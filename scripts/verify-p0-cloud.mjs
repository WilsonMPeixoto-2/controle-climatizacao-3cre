// P0: teste sintético na produção existente, SEM alterar chamados/escolas.
// Executar somente na CI opt-in, nunca como rotina de usuário.
// Um único registro identificável permanece ao final com contribuição R$ 0,0000.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, expect } from '@playwright/test';

const baseURL = 'https://controle-climatizacao-3cre.vercel.app/';
const endpoint = 'https://firestore.googleapis.com/v1/projects/gestao-da-climatizacao-3-cre/databases/(default)/documents';
const marker = 'TESTE SINTETICO P0 GOP MEMORIA V8.7.2 2026-11-05';
const output = 'test-results/p0-cloud';
await mkdir(output, { recursive: true });

function decode(value) {
  if ('integerValue' in value) return Number(value.integerValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, x]) => [k, decode(x)]));
  return value.stringValue ?? value.timestampValue ?? value.booleanValue ?? value.doubleValue;
}
async function documents(path) {
  const rows = [];
  let token = '';
  do {
    const url = endpoint + '/' + path + '?pageSize=1000' + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const data = await response.json();
    assert.equal(response.status, 200, data.error?.message || 'Erro de leitura Firestore: ' + path);
    rows.push(...(data.documents || []).map(doc => ({ name: doc.name, ...decode({ mapValue: { fields: doc.fields } }) })));
    token = data.nextPageToken || '';
  } while (token);
  return rows;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  return value;
}
const digest = rows => createHash('sha256').update(JSON.stringify(canonical(rows.sort((a, b) => a.name.localeCompare(b.name))))).digest('hex');
const original = await Promise.all(['escolas', 'chamados', 'atendimentos_economicos'].map(documents));
const otherHashes = original.map((rows, index) => digest(index === 2 ? rows.filter(row => row.cycle !== marker) : rows));
const existing = original[2].filter(row => row.cycle === marker);
assert.ok(existing.length <= 1, 'Não criar um segundo registro sintético com o mesmo rótulo.');
const matchingTicket = original[1].find(ticket => /split/i.test(String(ticket.tipo_aparelho))
  && /(?:^|\D)12\.?000(?:\D|$)/.test(String(ticket.btu_existente || ticket.btu_pretendido)));
const school = original[0].find(row => String(row.designacao) === matchingTicket?.designacao)
  || original[0].find(row => row.designacao && row.unidade_escolar);
assert.ok(school, 'Escola de referência existente é necessária. Não criar escola nova.');

const browser = await chromium.launch();
const contexts = await Promise.all([browser.newContext({ viewport: { width: 1440, height: 900 } }), browser.newContext({ viewport: { width: 1440, height: 900 } })]);
const pages = await Promise.all(contexts.map(async ctx => {
  await ctx.addInitScript(() => {
    sessionStorage.setItem('gop_current_tab', 'finance');
    localStorage.setItem('gop_theme', 'light');
  });
  const page = await ctx.newPage();
  await page.goto(baseURL);
  await page.getByRole('tab', { name: 'Atendimentos', exact: true }).click();
  await expect(page.getByText('Firestore financeiro conectado', { exact: true })).toBeVisible({ timeout: 45000 });
  await page.getByLabel('Competência', { exact: true }).fill('2099-12');
  return page;
}));
const [pageA, pageB] = pages;
const region = page => page.getByRole('region', { name: 'Estimativas de atendimento', exact: true });
const editor = page => page.getByRole('form', { name: /^(Estimar atendimento|Editar estimativa de atendimento)$/ });
const row = page => region(page).locator('tbody tr').filter({ hasText: marker });
async function openEditor(page) {
  await row(page).getByRole('button', { name: /^Abrir atendimento de/ }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Editar atendimento', exact: true }).click();
  await expect(editor(page)).toBeVisible();
}
const group = form => form.getByRole('group', { name: 'Grupo 1', exact: true });
let state = { url: baseURL, marker, originalRecords: original[2].length, verified: [], at: new Date().toISOString() };
async function remote() {
  const rows = (await documents('atendimentos_economicos')).filter(row => row.cycle === marker);
  assert.equal(rows.length, 1, 'Registro sintético único em produção.');
  return rows[0];
}
async function configurePrice(form) {
  const g = group(form);
  await g.locator('summary').filter({ hasText: 'Equipamentos e versão da referência' }).click();
  await g.getByLabel('Tipo de equipamento').fill('Split');
  await g.getByLabel(/^Capacidade/).fill('12000');
  await expect(g.getByLabel(/^Preço unitário/)).toHaveValue('239,7350');
  await expect(g.getByLabel(/^Origem do preço/)).toHaveValue(/CATEGORIAS!F6:F16/);
  await expect(form).toContainText('Enquadramento do TR CRE03: item 32');
  return g;
}
async function save(page, expectedRevision) {
  await editor(page).getByRole('button', { name: /^(Salvar atendimento|Salvar alterações)$/ }).click();
  await expect(editor(page)).toHaveCount(0, { timeout: 30000 });
  await expect(region(page).getByRole('status').filter({
    hasText: 'Atendimento salvo no Firestore compartilhado · versão ' + expectedRevision + '.'
  })).toBeVisible({ timeout: 30000 });
}
try {
  let revision = existing[0]?.revision || 0;
  if (!existing.length) {
    await region(pageA).getByRole('button', { name: 'Nova estimativa', exact: true }).click();
    const form = editor(pageA);
    await form.getByLabel('Escola', { exact: true }).selectOption(String(school.designacao));
    await form.getByLabel('Mês previsto', { exact: true }).fill('2099-12');
    await form.locator('.attendance-extra > summary').click();
    await form.getByLabel(/^Ciclo ou referência/).fill(marker);
    if (matchingTicket && String(matchingTicket.designacao) === String(school.designacao)) {
      const checkbox = form.getByRole('checkbox', { name: new RegExp(matchingTicket.id_chamado) });
      if (await checkbox.count()) {
        await checkbox.check();
        state.ticketId = matchingTicket.id_chamado;
      }
    }
    const g = await configurePrice(form);
    await g.getByLabel('Quantidade', { exact: true }).fill('2');
    await save(pageA, ++revision);
  }
  let current = await remote();
  state.id = current.id;
  assert.equal(current.schoolId, String(school.designacao));
  if (state.ticketId) assert.deepEqual(current.ticketIds, [state.ticketId]);
  if (current.items[0].unitPriceUnits4 !== 2397350 || current.items[0].categoryCode !== 'CRE03-32') {
    throw new Error('Preço ou categoria da memória ausente no documento remoto.');
  }
  assert.match(current.items[0].sourceRef, /CATEGORIAS!F6:F16/);
  assert.ok(current.items[0].referenceVersion, 'Versão de origem ausente no Firestore.');
  if (current.items[0].lineTotalUnits4 !== 4794700) {
    // Em nova execução do teste, a versão anterior pode estar neutralizada.
    // Restaurar temporariamente 2 unidades por edição, nunca criar novo ID.
    await expect(row(pageA)).toBeVisible({ timeout: 30000 });
    await openEditor(pageA);
    await group(editor(pageA)).getByLabel('Quantidade', { exact: true }).fill('2');
    await save(pageA, ++revision);
    current = await remote();
  }
  assert.equal(current.items[0].unitPriceUnits4, 2397350);
  assert.equal(current.items[0].lineTotalUnits4, 4794700);
  await expect(row(pageB)).toContainText('479,4700', { timeout: 30000 });
  state.verified.push('Preco automatico e quantidade 2 gravados no Firebase REAL e visiveis em segunda sessao');

  // Editar na segunda sessão, preservar o ID, conferir histórico remoto.
  await openEditor(pageB);
  await group(editor(pageB)).getByLabel('Quantidade', { exact: true }).fill('3');
  await save(pageB, ++revision);
  current = await remote();
  assert.equal(current.items[0].lineTotalUnits4, 7192050);
  assert.equal(current.items[0].unitPriceUnits4, 2397350);
  assert.equal(current.revision, revision);
  const history = await documents('atendimentos_economicos/' + current.id + '/revisoes');
  assert.equal(history.length, revision);
  assert.ok(history.some(row => row.items?.[0]?.lineTotalUnits4 === 4794700));
  state.verified.push('Edicao em segunda sessao preservou ID e historico imutavel');

  // O último estado do registro permanece NEUTRO, sem contribuir com previsão.
  await openEditor(pageB);
  await group(editor(pageB)).getByLabel('Quantidade', { exact: true }).fill('0');
  await save(pageB, ++revision);
  current = await remote();
  assert.equal(current.items[0].lineTotalUnits4, 0);
  state.finalRevision = revision;
  state.finalValueUnits4 = 0;
  const after = await Promise.all(['escolas', 'chamados', 'atendimentos_economicos'].map(documents));
  assert.deepEqual(after.map((rows, index) => digest(index === 2 ? rows.filter(row => row.cycle !== marker) : rows)), otherHashes,
    'Escolas, chamados e atendimentos anteriores não foram alterados.');
  state.verified.push('Valor sintetico neutralizado; cadastros anteriores preservados');
  await writeFile(output + '/p0-proof.json', JSON.stringify(state, null, 2));
  console.log('P0 CLOUD PASS ' + JSON.stringify({ id: current.id, revision, finalValueUnits4: 0, checks: state.verified }));
} finally {
  // Melhor esforço de neutralização mesmo quando uma asserção intermediária falha.
  // Não elimina o histórico imutável nem toca em outros registros.
  try {
    const candidates = (await documents('atendimentos_economicos')).filter(item => item.cycle === marker);
    if (candidates.length === 1 && candidates[0].items?.[0]?.lineTotalUnits4 > 0) {
      await pageB.reload();
      await pageB.getByRole('tab', { name: 'Atendimentos', exact: true }).click();
      await expect(pageB.getByText('Firestore financeiro conectado', { exact: true })).toBeVisible({ timeout: 45000 });
      await pageB.getByLabel('Competência', { exact: true }).fill('2099-12');
      await openEditor(pageB);
      await group(editor(pageB)).getByLabel('Quantidade', { exact: true }).fill('0');
      await save(pageB, candidates[0].revision + 1);
      assert.equal((await remote()).items[0].lineTotalUnits4, 0);
      console.log('P0: registro sintético neutralizado na rotina de recuperação.');
    }
  } catch (cleanupError) {
    console.error('ALERTA: conferir manualmente o atendimento com marcador "' + marker +
      '" no período 2099-12. A neutralização falhou: ' + cleanupError.message);
    throw cleanupError;
  } finally {
    await browser.close();
  }
}
