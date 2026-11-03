// Opt-in acceptance against the existing cloud database. Never run in CI.
// NODE_USE_ENV_PROXY=1 node scripts/verify-finance-remote.mjs <baseURL> <evidenceDirectory>
// Creates/reuses ONE labelled synthetic attendance; preserves all existing data.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, expect } from '@playwright/test';

const [baseURL, output] = process.argv.slice(2);
if (!output || !['http://localhost:5190', 'https://climatizacao-firebase-homologacao.vercel.app'].includes(baseURL)) {
  throw new Error('Informe a URL de homologação (ou preview local 5190) e a pasta de evidências. Este teste grava no Firebase existente.');
}
const project = 'gestao-da-climatizacao-3-cre';
const endpoint = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
await mkdir(output, { recursive: true });
const stateFile = `${output}/state.json`;
let state;
try { state = JSON.parse(await readFile(stateFile, 'utf8')); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  state = { cycle: `TESTE SINTETICO HOMOLOGACAO ${new Date().toISOString()}`, project, checks: [] };
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}
assert.equal(state.project, project);
const phase = baseURL.startsWith('https:') ? 'published' : 'preflight';
function decode(v) {
  if ('integerValue' in v) return Number(v.integerValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, decode(x)]));
  return v.stringValue ?? v.timestampValue ?? v.booleanValue ?? v.doubleValue;
}
async function api(path, options) {
  const response = await fetch(`${endpoint}/${path}`, { signal: AbortSignal.timeout(30000), ...options });
  const body = await response.json();
  return { status: response.status, body };
}
async function documents(path) {
  let token = '', rows = [];
  do {
    const { status, body } = await api(`${path}?pageSize=1000${token ? '&pageToken=' + encodeURIComponent(token) : ''}`);
    assert.equal(status, 200, body.error?.message);
    rows.push(...(body.documents || []).map(d => ({ name: d.name, ...decode({ mapValue: { fields: d.fields } }) })));
    token = body.nextPageToken;
  } while (token);
  return rows;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const digest = rows => createHash('sha256').update(JSON.stringify(canonical(rows.sort((a, b) => a.name.localeCompare(b.name))))).digest('hex');
const before = await Promise.all(['escolas', 'chamados', 'atendimentos_economicos'].map(documents));
const preserved = before.map((rows, i) => digest(i === 2 ? rows.filter(r => r.cycle !== state.cycle) : rows));
const school = before[0].find(s => s.designacao && s.unidade_escolar);
assert.ok(school, 'Uma escola existente é necessária; o teste não cria cadastros.');
const existing = before[2].find(r => r.cycle === state.cycle);
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
const contexts = await Promise.all([browser.newContext({ viewport: { width: 1440, height: 1000 } }), browser.newContext()]);
const pages = await Promise.all(contexts.map(async context => {
  await context.addInitScript(() => { sessionStorage.setItem('gop_current_tab', 'finance'); localStorage.setItem('gop_theme', 'light'); });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.getByText('Firestore financeiro conectado', { exact: true })).toBeVisible({ timeout: 45000 });
  return page;
}));
const [a, b] = pages;
console.log('Duas sessões conectadas ao Firestore remoto.');
const region = p => p.getByRole('region', { name: 'Estimativas de atendimento', exact: true });
const card = p => region(p).locator('.attendance-record').filter({ hasText: state.cycle });
const form = p => p.getByRole('form', { name: /^(Estimar atendimento|Editar estimativa de atendimento)$/ });
async function save(p, revision) {
  console.log('Gravando revisão', revision);
  await form(p).getByRole('button', { name: /^(Salvar atendimento|Salvar alterações)$/ }).click();
  await expect(form(p)).toHaveCount(0, { timeout: 30000 });
  await expect(region(p).getByRole('status').filter({ hasText: `Atendimento salvo no Firestore compartilhado · versão ${revision}.` })).toBeVisible();
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}
async function snapshot() {
  const rows = (await documents('atendimentos_economicos')).filter(r => r.cycle === state.cycle);
  assert.equal(rows.length, 1, 'Somente uma versão corrente do registro sintético.');
  state.id = rows[0].id;
  await writeFile(stateFile, JSON.stringify(state, null, 2));
  return rows[0];
}
try {
  let revision = existing?.revision || 0;
  if (!existing) {
    await region(a).getByRole('button', { name: 'Estimar atendimento', exact: true }).click();
    await form(a).getByLabel('Escola', { exact: true }).selectOption(String(school.designacao));
    await form(a).getByLabel('Mês previsto', { exact: true }).fill('2099-12');
    await form(a).locator('.attendance-extra > summary').click();
    await form(a).getByLabel(/^Ciclo ou referência/).fill(state.cycle);
    const group = form(a).getByRole('group', { name: 'Grupo 1', exact: true });
    await group.getByLabel(/^Serviço ou grupo/).fill('TESTE SINTETICO — sem execução, cobrança ou valor contratual');
    await group.getByLabel('Quantidade', { exact: true }).fill('2');
    await group.getByLabel(/^Preço unitário/).fill('12,3456');
    await group.getByLabel(/^Origem do preço/).fill('Valor fictício exclusivo para homologação técnica');
    await group.getByLabel('Cobertura do serviço', { exact: true }).selectOption('adicional');
    await group.getByLabel(/^Referência da cobertura/).fill('Cobertura fictícia para teste');
    await save(a, ++revision);
    await expect(card(b)).toContainText('24,6912', { timeout: 30000 });
    assert.equal((await snapshot()).items[0].lineTotalUnits4, 246912);
  }
  await card(a).locator('.attendance-history > summary').click();
  await expect(card(a).locator('.attendance-history-content')).toContainText('Versão 1');
  // Both editors start with the same revision. The second save must report a conflict.
  for (const page of pages) await card(page).getByRole('button', { name: /^Abrir e editar atendimento/ }).click();
  await form(b).getByLabel('Mês previsto', { exact: true }).fill(phase === 'preflight' ? '2099-11' : '2099-10');
  await form(b).getByLabel('Quantidade', { exact: true }).fill('3');
  await form(b).getByLabel(/^Preço unitário/).fill('12,3456');
  await save(b, ++revision);
  await expect(card(a).locator('.attendance-history-content')).toContainText(`Versão ${revision}`, { timeout: 30000 });
  await form(a).getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(form(a)).toHaveCount(1);
  await expect(region(a).getByRole('alert')).toContainText(/outra sessão|versão/, { timeout: 30000 });
  await form(a).getByRole('button', { name: 'Cancelar', exact: true }).click();
  const saved = await snapshot();
  assert.equal(saved.revision, revision);
  assert.equal(saved.items[0].lineTotalUnits4, 370368);
  const history = await documents(`atendimentos_economicos/${state.id}/revisoes`);
  assert.equal(history.length, revision);
  assert.equal(history.find(r => r.revision === 1).items[0].lineTotalUnits4, 246912);
  const deniedRevision = await api(`atendimentos_economicos/${state.id}/revisoes/v1?updateMask.fieldPaths=cycle`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { cycle: { stringValue: 'Tentativa de alteração proibida — teste' } } })
  });
  assert.equal(deniedRevision.status, 403, 'Histórico deve ser imutável no Firebase remoto.');
  const deniedCurrent = await api(`atendimentos_economicos/${state.id}?updateMask.fieldPaths=revision`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { revision: { integerValue: String(revision + 1) } } })
  });
  assert.equal(deniedCurrent.status, 403, 'Registro corrente não pode avançar sem revisão atômica.');
  await Promise.all(pages.map(p => p.reload()));
  for (const page of pages) {
    await expect(card(page)).toContainText(`Versão ${revision}`, { timeout: 30000 });
    await expect(card(page)).toContainText('37,0368');
    await page.getByLabel('Competência', { exact: true }).fill(saved.plannedMonth);
    await expect(page.locator('.forecast-records')).toContainText('37,0368');
  }
  state.checks.push({ phase, url: baseURL, at: new Date().toISOString(), revision, plannedMonth: saved.plannedMonth,
    lineTotalUnits4: 370368, historyCount: history.length, creation: true, edit: true, reload: true,
    twoSessions: true, staleSaveRejected: true, immutableHistory: true, atomicRevision: true, forecast: true });
  // Close the synthetic test with zero contribution, retaining its immutable evidence.
  if (phase === 'published') {
    await card(b).getByRole('button', { name: /^Abrir e editar atendimento/ }).click();
    await form(b).getByLabel('Quantidade', { exact: true }).fill('0');
    await form(b).getByLabel(/^Preço unitário/).fill('0');
    await save(b, ++revision);
    await a.reload();
    await expect(card(a)).toContainText(`Versão ${revision}`, { timeout: 30000 });
    assert.equal((await snapshot()).items[0].lineTotalUnits4, 0);
    state.finalRevision = revision;
    state.finalValueUnits4 = 0;
    for (const [label, width, height] of [['notebook', 1440, 1000], ['4k', 3840, 2160], ['mobile', 390, 844]]) {
      for (const theme of ['light', 'dark']) {
        await a.setViewportSize({ width, height });
        await a.evaluate(t => localStorage.setItem('gop_theme', t), theme);
        await a.reload();
        await expect(card(a)).toContainText(`Versão ${revision}`, { timeout: 30000 });
        await a.getByLabel('Competência', { exact: true }).fill(saved.plannedMonth);
        await a.locator('.monthly-forecast').scrollIntoViewIfNeeded();
        await a.screenshot({ path: `${output}/${label}-${theme}.png` });
        assert.ok(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Sem overflow horizontal.');
      }
    }
  }
  const after = await Promise.all(['escolas', 'chamados', 'atendimentos_economicos'].map(documents));
  assert.deepEqual(after.map((rows, i) => digest(i === 2 ? rows.filter(r => r.cycle !== state.cycle) : rows)), preserved,
    'Cadastros, chamados e atendimentos anteriores devem permanecer intactos.');
  state.checks.at(-1).existingDataUnchanged = true;
  await writeFile(stateFile, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ phase, id: state.id, revision, project, checks: state.checks.at(-1), finalValueUnits4: state.finalValueUnits4 }));
} finally { await browser.close(); }
