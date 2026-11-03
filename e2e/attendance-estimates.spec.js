import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, connectFirestoreEmulator, getDocs, getFirestore } from 'firebase/firestore';
import { seedAttendanceDevelopment } from '../scripts/seed-attendance-development.mjs';
import { attendanceSchools, attendanceTickets } from '../test/fixtures/attendance-development.mjs';

// Exclusivamente dados e preços fictícios; as gravações da interface usam o Firestore real do emulador.
const SCHOOL_A = attendanceSchools[0];
const SCHOOL_B = attendanceSchools[1];
const SOURCE_V1 = 'Orçamento fictício de teste A — edição 1';
const SOURCE_V2 = 'Orçamento fictício de teste A — edição 2';
const MONTH = '2026-11';
const money = value => new RegExp('R\\$\\s*' + value.replaceAll('.', '\\.').replaceAll(',', '\\,'));
const estimates = page => page.getByRole('region', { name: 'Estimativas de atendimento', exact: true });
const editor = page => page.getByRole('form', { name: /^(Estimar atendimento|Editar estimativa de atendimento)$/ });
const records = page => estimates(page).getByRole('list', { name: /Atendimentos/ }).getByRole('listitem');
const schoolRecord = (page, school) => records(page).filter({ has: page.getByRole('heading', { name: school.unidade_escolar, exact: true }) });
const group = (form, number = 1) => form.getByRole('group', { name: 'Grupo ' + number, exact: true });
const nav = (page, name) => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true });

async function openApp(page, theme = 'light') {
  await page.context().route('https://va.vercel-scripts.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.context().route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  }));
  await page.context().addInitScript(({ schools, tickets, theme }) => {
    if (localStorage.getItem('attendance_synthetic_fixture_v1')) return;
    localStorage.setItem('gop_schools', JSON.stringify(schools));
    localStorage.setItem('gop_tickets', JSON.stringify(tickets));
    localStorage.setItem('gop_theme', theme);
    localStorage.setItem('attendance_synthetic_fixture_v1', 'true');
    sessionStorage.setItem('gop_current_tab', 'finance');
  }, { schools: attendanceSchools, tickets: attendanceTickets, theme });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gestão Financeira', exact: true })).toBeVisible();
  await expect(estimates(page).getByRole('status').filter({ hasText: 'Base de desenvolvimento compartilhada' })).toBeVisible();
}

async function startEstimate(page, school = SCHOOL_A) {
  await estimates(page).getByRole('button', { name: 'Estimar atendimento', exact: true }).click();
  const form = editor(page);
  await form.getByLabel('Escola', { exact: true }).selectOption(school.designacao);
  await form.getByLabel('Mês previsto', { exact: true }).fill(MONTH);
  return form;
}

async function fillGroup(form, number, values = {}) {
  const item = group(form, number);
  if (values.description !== undefined) await item.getByLabel(/^Serviço ou grupo/).fill(values.description);
  if (values.quantity !== undefined) await item.getByLabel('Quantidade', { exact: true }).fill(String(values.quantity));
  if (values.price !== undefined) await item.getByLabel(/^Preço unitário/).fill(values.price);
  if (values.coverage !== undefined) await item.getByLabel('Cobertura do serviço', { exact: true }).selectOption(values.coverage);
  if (values.nature !== undefined) await item.getByLabel('Natureza da referência', { exact: true }).selectOption(values.nature);
  if (values.source !== undefined) await item.getByLabel(/^Origem do preço/).fill(values.source);
  if (values.coverageSource !== undefined) await item.getByLabel(/^Referência da cobertura/).fill(values.coverageSource);
  if (values.version !== undefined) {
    await item.locator('summary').filter({ hasText: 'Equipamentos e versão da referência' }).click();
    await item.getByLabel('Versão da referência', { exact: true }).fill(values.version);
  }
  return item;
}

async function saveEstimate(page, revision = 1) {
  const form = editor(page);
  await form.getByRole('button', { name: /^(Salvar atendimento|Salvar alterações)$/ }).click();
  await expect(form).toHaveCount(0);
  await expect(estimates(page).getByRole('status').filter({ hasText: 'Atendimento salvo na base compartilhada de desenvolvimento · versão ' + revision + '.' })).toBeVisible();
}

async function backendSnapshot() {
  // Leitura independente, sem Auth e sem desativar regras; somente o seed inicial é administrativo.
  const app = initializeApp({ projectId: 'demo-gop-clima-financeiro', apiKey: 'demo-finance-development-key', appId: 'demo-finance-development-app' }, 'attendance-e2e-' + crypto.randomUUID());
  try {
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8082);
    const snapshot = await getDocs(collection(db, 'atendimentos_economicos'));
    return await Promise.all(snapshot.docs.map(async document => ({
      ...document.data(),
      revisions: (await getDocs(collection(document.ref, 'revisoes'))).docs.map(revision => revision.data()).sort((a, b) => a.revision - b.revision)
    })));
  } finally {
    await deleteApp(app);
  }
}

async function originalRegistries(page) {
  return page.evaluate(() => [localStorage.getItem('gop_schools'), localStorage.getItem('gop_tickets')]);
}

async function chooseSchool(page, school) {
  await nav(page, 'Consulta por Escola').click();
  await page.getByPlaceholder('Nome ou designação...').fill(school.designacao);
  await page.locator('.suggestion-item').filter({ hasText: school.unidade_escolar }).click();
  return page.getByRole('region', { name: 'Contexto financeiro da escola', exact: true });
}

test.beforeEach(async () => {
  await seedAttendanceDevelopment({ synthetic: true, reset: true });
});

test('duas sessões sem login compartilham composições distintas de duas escolas', async ({ page, browser, baseURL }) => {
  const otherContext = await browser.newContext({ baseURL });
  try {
    const other = await otherContext.newPage();
    await Promise.all([openApp(page), openApp(other)]);
    const original = await originalRegistries(page);
    let form = await startEstimate(page);
    await fillGroup(form, 1, { description: 'Grupo sintético A1', quantity: 2, price: '123,4567', source: SOURCE_V1, version: 'fictícia-v1' });
    await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
    await fillGroup(form, 2, { description: 'Grupo sintético A2', quantity: 3, price: '10,0000', source: 'Referência fictícia A2' });
    await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText(money('276,9134'));
    await saveEstimate(page);
    await expect(schoolRecord(other, SCHOOL_A)).toContainText(money('276,9134'));

    form = await startEstimate(other, SCHOOL_B);
    await fillGroup(form, 1, { description: 'Grupo sintético B', quantity: 2, price: '77,7000', source: 'Orçamento fictício B', nature: 'informada' });
    await saveEstimate(other);
    await page.reload();
    await expect(records(page)).toHaveCount(2);
    await expect(schoolRecord(page, SCHOOL_B)).toContainText(money('155,4000'));
    const before = await backendSnapshot();
    const initial = before.find(record => record.schoolId === SCHOOL_A.designacao);
    expect(initial.items.map(item => item.unitPriceUnits4)).toEqual([1234567, 100000]);
    expect(initial.revision).toBe(1);
    expect(before).toHaveLength(2);
    expect(await originalRegistries(page)).toEqual(original);
    expect(await originalRegistries(other)).toEqual(original);
  } finally {
    await otherContext.close();
  }
});

test('correção mantém o mesmo ID e atualiza o histórico já aberto em outra sessão', async ({ page, browser, baseURL }) => {
  const otherContext = await browser.newContext({ baseURL });
  try {
    await openApp(page);
    const original = await originalRegistries(page);
    let form = await startEstimate(page);
    await fillGroup(form, 1, { description: 'Grupo sintético revisado', quantity: 2, price: '123,4567', source: SOURCE_V1, version: 'fictícia-v1' });
    await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
    await fillGroup(form, 2, { quantity: 3, price: '10,0000', source: 'Referência fictícia A2' });
    await saveEstimate(page);
    const [initial] = await backendSnapshot();
    const other = await otherContext.newPage();
    await openApp(other);

    const observingHistory = schoolRecord(page, SCHOOL_A).locator('.attendance-history-content');
    await schoolRecord(page, SCHOOL_A).locator('.attendance-history > summary').click();
    await expect(observingHistory.getByText(/^Versão 1 ·/)).toBeVisible();
    await expect(observingHistory.getByText(/^Versão 2 ·/)).toHaveCount(0);

    await schoolRecord(other, SCHOOL_A).getByRole('button', { name: /^Abrir e editar atendimento de/ }).click();
    form = editor(other);
    await fillGroup(form, 1, { quantity: 3, source: SOURCE_V2, version: 'fictícia-v2' });
    await saveEstimate(other, 2);
    await expect(schoolRecord(page, SCHOOL_A)).toContainText(money('400,3701'));
    await expect(observingHistory.getByText(/^Versão 2 ·/)).toBeVisible();
    await expect(observingHistory.getByText(/^Versão 1 ·/)).toBeVisible();
    await other.reload();
    await expect(records(other)).toHaveCount(1);
    const updated = schoolRecord(other, SCHOOL_A);
    await updated.locator('.attendance-composition > summary').click();
    await expect(updated).toContainText('3 ×');
    await expect(updated).toContainText(SOURCE_V2);
    await updated.locator('.attendance-history > summary').click();
    const history = updated.locator('.attendance-history-content');
    await expect(history.getByText(/^Versão 1 ·/)).toBeVisible();
    await expect(history.getByText(/^Versão 2 ·/)).toBeVisible();
    for (const summary of await history.locator('.attendance-composition > summary').all()) await summary.click();
    await expect(history).toContainText(SOURCE_V1);
    await expect(history).toContainText(SOURCE_V2);
    await expect(history).toContainText('fictícia-v1');
    await expect(history).toContainText('fictícia-v2');
    const after = await backendSnapshot();
    expect(after).toHaveLength(1);
    const corrected = after.find(record => record.schoolId === SCHOOL_A.designacao);
    expect(corrected.id).toBe(initial.id);
    expect(corrected.revision).toBe(2);
    expect(corrected.revisions.map(revision => revision.items[0].sourceRef)).toEqual([SOURCE_V1, SOURCE_V2]);
    expect(corrected.revisions.map(revision => revision.items[0].quantity)).toEqual([2, 3]);
    expect(await originalRegistries(page)).toEqual(original);
    expect(await originalRegistries(other)).toEqual(original);
  } finally {
    await otherContext.close();
  }
});

test('ausência, parcela conhecida, zero e corretiva incluída mantêm origem e natureza sem presumir faturamento', async ({ page }, testInfo) => {
  await openApp(page);
  const original = await originalRegistries(page);
  let form = await startEstimate(page);
  await fillGroup(form, 1, { description: 'Preço ausente — teste fictício', quantity: 2, price: '', nature: 'nao_informada' });
  await saveEstimate(page);
  await expect(records(page).first()).toContainText('Estimativa parcial · parcela conhecida');
  await expect(records(page).first()).toContainText('Não informada');
  await expect(records(page).first()).not.toContainText(money('0,0000'));

  form = await startEstimate(page);
  await fillGroup(form, 1, { description: 'Parcela conhecida fictícia', quantity: 2, price: '25,0000', source: 'Preço fictício parcial', nature: 'informada' });
  await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
  await fillGroup(form, 2, { description: 'Parcela pendente fictícia', quantity: 1, price: '', nature: 'nao_informada' });
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText(money('50,0000'));
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText('1 grupo com informação pendente');
  await saveEstimate(page);
  await expect(records(page).first()).toContainText('Estimativa parcial');

  form = await startEstimate(page);
  await form.getByLabel('Atividade', { exact: true }).selectOption('corretiva');
  const zero = await fillGroup(form, 1, { description: 'Zero informado fictício', quantity: 0, price: '0,0000', nature: 'informada' });
  await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
  await fillGroup(form, 2, { description: 'Corretiva coberta fictícia', quantity: 3, coverage: 'incluido', price: '' });
  await form.getByRole('button', { name: 'Salvar atendimento', exact: true }).click();
  await expect(estimates(page).getByRole('alert')).toContainText('Grupo 1: informe a origem');
  await zero.getByLabel(/^Origem do preço/).fill('Origem fictícia do zero informado');
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText('Estimativa parcial');
  await fillGroup(form, 2, { source: 'Origem de preço fictícia não comprova cobertura' });
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText('1 grupo com informação pendente');
  await fillGroup(form, 2, { coverageSource: 'Cobertura fictícia identificada' });
  await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
  await fillGroup(form, 3, { description: 'Preço nominal fictício preservado', quantity: 2, price: '12,0000', source: 'Preço fictício nominal', coverage: 'incluido' });
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText(money('24,0000'));
  await fillGroup(form, 3, { coverageSource: 'Decisão de cobertura fictícia separada' });
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText(money('0,0000'));
  await zero.locator('summary').filter({ hasText: 'Equipamentos e versão da referência' }).click();
  await expect(zero.getByLabel(/^Capacidade/)).toHaveValue('');
  await form.locator('.attendance-extra > summary').click();
  await form.getByRole('checkbox', { name: /GOP-AR-2026-9002/ }).check();
  await saveEstimate(page);
  await expect(records(page)).toHaveCount(3);
  const covered = records(page).first();
  await expect(covered).toContainText(money('0,0000'));
  await expect(covered).not.toContainText('Estimativa parcial');
  await covered.locator('.attendance-composition > summary').click();
  await expect(covered).toContainText('Incluído na cobertura informada');
  await expect(covered).toContainText('2 × R$ 12,0000 = R$ 24,0000');
  await expect(covered).toContainText('Acréscimo estimado: R$ 0,0000');
  await expect(covered).toContainText('Decisão de cobertura fictícia separada');
  const compositionPath = testInfo.outputPath('attendance-economic-nature.png');
  await covered.screenshot({ path: compositionPath, animations: 'disabled' });
  await testInfo.attach('Preço nominal e acréscimo — dados fictícios', { path: compositionPath, contentType: 'image/png' });
  const data = await backendSnapshot();
  const absent = data.find(record => record.items[0].description.startsWith('Preço ausente'));
  const coveredData = data.find(record => record.items[0].description.startsWith('Zero informado'));
  expect(absent.items[0].unitPriceUnits4).toBeNull();
  expect(coveredData.items.map(item => item.unitPriceUnits4)).toEqual([0, null, 120000]);
  expect(coveredData.items[2].sourceRef).toBe('Preço fictício nominal');
  expect(coveredData.items[2].coverageSourceRef).toBe('Decisão de cobertura fictícia separada');
  expect(coveredData.items.every(item => item.capacityBtu === null)).toBe(true);
  const summary = await chooseSchool(page, SCHOOL_A);
  await expect(summary).toContainText('Apuração e pagamentos: não informados.');
  await expect(summary).toContainText('Nenhum valor é presumido a partir dos registros de manutenção.');
  expect(await originalRegistries(page)).toEqual(original);
});

test('chamado e programação iniciam a estimativa contextual e mostram seus valores no dossiê sem alterar cadastros', async ({ page }) => {
  await openApp(page);
  const original = await originalRegistries(page);
  await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.finance-reference > summary').click();
  await expect(dialog.getByText('12.000 BTU', { exact: true })).toBeVisible();
  await expect(dialog.getByText('18.000 BTU', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Estimar atendimento deste chamado', exact: true }).click();
  let form = editor(page);
  await expect(form.getByLabel('Escola', { exact: true })).toHaveValue(SCHOOL_A.designacao);
  await expect(form.getByLabel('Atividade', { exact: true })).toHaveValue('corretiva');
  await expect(group(form).getByLabel('Quantidade', { exact: true })).toHaveValue('');
  await expect(group(form).getByLabel(/^Preço unitário/)).toHaveValue('');
  await group(form).locator('summary').click();
  await expect(group(form).getByLabel(/^Capacidade/)).toHaveValue('12000');
  await expect(group(form).getByLabel(/^Capacidade/)).not.toHaveValue('18000');
  await form.locator('.attendance-extra > summary').click();
  await expect(form.getByRole('checkbox', { name: /GOP-AR-2026-9001/ })).toBeChecked();
  await fillGroup(form, 1, { quantity: 1, price: '12,3456', source: 'Referência fictícia do chamado A' });
  await saveEstimate(page);

  await page.locator('#finance-school').selectOption(SCHOOL_B.designacao);
  const board = page.getByRole('region', { name: 'Planejamento por escola', exact: true });
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await expect(board.getByLabel('Unidade escolar', { exact: true })).toHaveValue(SCHOOL_B.designacao);
  await board.getByLabel('Data prevista', { exact: true }).fill('2026-11-12');
  await board.getByLabel('Atividade', { exact: true }).selectOption('preventiva');
  await board.locator('.visit-board-extra > summary').click();
  await board.getByLabel('Equipamentos previstos', { exact: true }).fill('2');
  await board.getByLabel('Ciclo ou referência', { exact: true }).fill('Ciclo fictício de teste');
  await board.getByRole('button', { name: 'Adicionar visita', exact: true }).click();
  await expect(board.locator('.visit-board-row')).toHaveCount(1);
  const visit = await page.evaluate(() => localStorage.getItem('gop_clima_programacao_rascunho_v1'));
  await board.getByRole('button', { name: 'Estimar atendimento da visita de ' + SCHOOL_B.unidade_escolar, exact: true }).click();
  form = editor(page);
  await expect(form.getByLabel('Mês previsto', { exact: true })).toHaveValue(MONTH);
  await expect(group(form).getByLabel('Quantidade', { exact: true })).toHaveValue('2');
  await group(form).locator('summary').click();
  await expect(group(form).getByLabel(/^Capacidade/)).toHaveValue('');
  await fillGroup(form, 1, { description: 'Preventiva fictícia programada B', price: '5,4321', source: 'Referência fictícia da visita B' });
  await saveEstimate(page);
  expect(await page.evaluate(() => localStorage.getItem('gop_clima_programacao_rascunho_v1'))).toBe(visit);
  await board.getByRole('button', { name: 'Abrir dossiê de ' + SCHOOL_B.unidade_escolar, exact: true }).click();
  let summary = page.getByRole('region', { name: 'Contexto financeiro da escola', exact: true });
  await expect(summary).toContainText(money('10,8642'));
  await expect(summary).not.toContainText(money('12,3456'));
  summary = await chooseSchool(page, SCHOOL_A);
  await expect(summary).toContainText(money('12,3456'));
  await expect(summary).not.toContainText(money('10,8642'));
  const data = await backendSnapshot();
  expect(data.find(record => record.schoolId === SCHOOL_A.designacao).ticketIds).toEqual(['GOP-AR-2026-9001']);
  expect(data.find(record => record.schoolId === SCHOOL_B.designacao).visitId).toBe(JSON.parse(visit)[0].id);
  expect(await originalRegistries(page)).toEqual(original);
});

test('conflito entre sessões preserva a edição local e permite reabrir a revisão mais recente', async ({ page, browser, baseURL }) => {
  const otherContext = await browser.newContext({ baseURL });
  try {
    await openApp(page);
    let form = await startEstimate(page);
    await fillGroup(form, 1, { description: 'Conflito fictício', quantity: 1, price: '25,0000', source: SOURCE_V1 });
    await saveEstimate(page);
    const other = await otherContext.newPage();
    await openApp(other);
    await schoolRecord(other, SCHOOL_A).getByRole('button', { name: /^Abrir e editar atendimento de/ }).click();
    await fillGroup(editor(other), 1, { quantity: 9, source: 'Edição local fictícia ainda não salva' });
    await schoolRecord(page, SCHOOL_A).getByRole('button', { name: /^Abrir e editar atendimento de/ }).click();
    await fillGroup(editor(page), 1, { quantity: 4, source: SOURCE_V2 });
    await saveEstimate(page, 2);
    form = editor(other);
    await expect(form).toContainText('Este atendimento tem uma versão mais recente. Sua edição foi preservada.');
    await form.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await expect(estimates(other).getByRole('alert')).toContainText('Este atendimento mudou em outra sessão. Reabra a versão atual antes de salvar.');
    await expect(group(form).getByLabel('Quantidade', { exact: true })).toHaveValue('9');
    await expect(group(form).getByLabel(/^Origem do preço/)).toHaveValue('Edição local fictícia ainda não salva');
    const data = await backendSnapshot();
    expect(data).toHaveLength(1);
    expect(data[0].revision).toBe(2);
    expect(data[0].items[0].quantity).toBe(4);
    expect(data[0].revisions).toHaveLength(2);
    await form.getByRole('button', { name: 'Reabrir versão atual', exact: true }).click();
    await expect(group(form).getByLabel('Quantidade', { exact: true })).toHaveValue('4');
    await expect(group(form).getByLabel(/^Origem do preço/)).toHaveValue(SOURCE_V2);
  } finally {
    await otherContext.close();
  }
});

test('previsão mensal sincroniza escolas e reprogramação entre sessões sem somar natureza nominal', async ({ page, browser, baseURL }, testInfo) => {
  const otherContext = await browser.newContext({ baseURL });
  try {
    await openApp(page);
    const forecast = page.getByRole('region', { name: 'Previsão mensal por competência' });
    await expect(forecast).toBeVisible();
    await expect(forecast).toContainText('Nenhuma estimativa nesta competência');

    let form = await startEstimate(page);
    await fillGroup(form, 1, {
      description: 'Adicional sintético de novembro',
      quantity: 2, price: '25,0000', source: 'Preço sintético E2',
      coverage: 'adicional', coverageSource: 'Cobertura sintética informada'
    });
    await saveEstimate(page);
    await expect(forecast).toContainText(money('50,0000'));
    // Evidência visual real do componente preenchido, usando dados sintéticos do backend.
    // Cada viewport preserva a mesma estimativa e o mesmo tema.
    const originalViewport = page.viewportSize();
    for (const viewport of [
      { width: 320, height: 800 },
      { width: 1440, height: 900 },
      { width: 3840, height: 2160 }
    ]) {
      await page.setViewportSize(viewport);
      // A ausência de overflow global não descarta corte interno de controles ou rótulos.
      const forecastBox = await forecast.boundingBox();
      const monthInput = await forecast.getByLabel('Competência', { exact: true }).boundingBox();
      const resetButton = await forecast.getByRole('button', { name: 'Voltar ao mês mais recente' }).boundingBox();
      expect(monthInput.width).toBeGreaterThanOrEqual(180);
      expect(resetButton.x + resetButton.width).toBeLessThanOrEqual(forecastBox.x + forecastBox.width + 1);
      await expect(forecast.locator('.forecast-month-count')).toHaveText(['0', '0', '0', '0', '0', '1']);
      const path = testInfo.outputPath('previsao-mensal-' + viewport.width + '-claro.png');
      await forecast.screenshot({ path, animations: 'disabled' });
      await testInfo.attach('previsao-mensal-' + viewport.width + '-dados-sinteticos', { path, contentType: 'image/png' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.setViewportSize(originalViewport);

    // O mesmo registro e os mesmos viewports devem preservar legibilidade no tema escuro.
    await page.evaluate(() => localStorage.setItem('gop_theme', 'dark'));
    await page.reload();
    await expect(forecast).toContainText(money('50,0000'));
    for (const viewport of [
      { width: 320, height: 800 },
      { width: 1440, height: 900 },
      { width: 3840, height: 2160 }
    ]) {
      await page.setViewportSize(viewport);
      const path = testInfo.outputPath('previsao-mensal-' + viewport.width + '-escuro.png');
      await forecast.screenshot({ path, animations: 'disabled' });
      await testInfo.attach('previsao-mensal-' + viewport.width + '-escuro-sintetico', { path, contentType: 'image/png' });
      const controlsBox = await forecast.boundingBox();
      const inputBox = await forecast.getByLabel('Competência', { exact: true }).boundingBox();
      await expect(forecast.getByLabel('Competência', { exact: true })).toHaveCSS('color-scheme', 'dark');
      const buttonBox = await forecast.getByRole('button', { name: 'Voltar ao mês mais recente' }).boundingBox();
      expect(inputBox.width).toBeGreaterThanOrEqual(180);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(controlsBox.x + controlsBox.width + 1);
    }
    await page.setViewportSize(originalViewport);

    const other = await otherContext.newPage();
    await openApp(other);
    const otherForecast = other.getByRole('region', { name: 'Previsão mensal por competência' });
    await expect(otherForecast).toContainText(money('50,0000'));
    await expect(otherForecast.getByRole('button', { name: /^Abrir composição de/ })).toHaveCount(1);

    await forecast.getByRole('button', { name: /^Abrir composição de/ }).click();
    form = editor(page);
    await expect(form.getByRole('heading', { name: 'Editar estimativa de atendimento' })).toBeVisible();
    await form.getByLabel('Mês previsto', { exact: true }).fill('2026-12');
    await fillGroup(form, 1, { quantity: 3, source: 'Preço sintético E2 atualizado' });
    await saveEstimate(page, 2);

    await otherForecast.getByLabel('Competência', { exact: true }).fill('2026-11');
    await expect(otherForecast).toContainText('Nenhuma estimativa nesta competência');
    await otherForecast.getByLabel('Competência', { exact: true }).fill('2026-12');
    await expect(otherForecast).toContainText(money('75,0000'));
    await expect(otherForecast.getByRole('button', { name: /^Abrir composição de/ })).toHaveCount(1);

    const backend = await backendSnapshot();
    expect(backend).toHaveLength(1);
    expect(backend[0].plannedMonth).toBe('2026-12');
    expect(backend[0].revision).toBe(2);
    expect(backend[0].revisions.map(item => item.plannedMonth)).toEqual(['2026-11', '2026-12']);
  } finally {
    await otherContext.close();
  }
});

async function filledLayout(page) {
  let form = await startEstimate(page);
  await fillGroup(form, 1, { description: 'Serviço fictício com nome extenso para conferir a composição', quantity: 2, price: '123,4567', source: SOURCE_V1 });
  await saveEstimate(page);
  const start = estimates(page).getByRole('button', { name: 'Estimar atendimento', exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  form = editor(page);
  await expect(form.getByRole('heading', { name: 'Estimar atendimento', exact: true })).toBeFocused();
  await form.getByLabel('Escola', { exact: true }).selectOption(SCHOOL_A.designacao);
  await form.getByLabel('Mês previsto', { exact: true }).fill(MONTH);
  await fillGroup(form, 1, { description: 'Referência provisória fictícia em edição', quantity: 2, price: '123,4567', source: SOURCE_V1 });
  await form.getByRole('button', { name: 'Adicionar grupo', exact: true }).click();
  await expect(group(form, 2).getByLabel(/^Serviço ou grupo/)).toBeFocused();
  await fillGroup(form, 2, { description: 'Grupo fictício ainda sem preço', quantity: 3, price: '', nature: 'nao_informada' });
  await expect(form.getByRole('region', { name: 'Prévia da estimativa' })).toContainText('Estimativa parcial');
  await expect(records(page)).toHaveCount(1);
}

async function assertLayout(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const clipped = await estimates(page).locator('input, select, button, .attendance-value').evaluateAll(elements => elements.filter(element => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
  }).map(element => element.getAttribute('aria-label') || element.textContent || element.tagName));
  expect(clipped).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Ocorreu um erro inesperado' })).toHaveCount(0);
}

async function capture(page, testInfo, name) {
  const path = testInfo.outputPath(name + '.png');
  await estimates(page).screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name + ' — dados e preços fictícios', { path, contentType: 'image/png' });
}

async function captureContext(page, testInfo, name) {
  await estimates(page).locator('.attendance-header').evaluate(element => element.scrollIntoView({ block: 'start' }));
  const path = testInfo.outputPath(name + '-context.png');
  await page.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name + '-context — dados e preços fictícios', { path, contentType: 'image/png' });
}

for (const theme of ['light', 'dark']) {
  test('mobile 320px ' + theme + ': editor preenchido, foco, contraste e composição sem overflow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await openApp(page, theme);
    await filledLayout(page);
    await assertLayout(page);
    const scan = await new AxeBuilder({ page }).include('.attendance-estimates').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(scan.violations).toEqual([]);
    await capture(page, testInfo, 'attendance-320-' + theme);
    await editor(page).getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(estimates(page).getByRole('button', { name: 'Estimar atendimento', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(editor(page)).toBeVisible();
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 3840, height: 2160 }]) {
test('desktop ' + viewport.width + 'px exibe registro e editor preenchidos nos dois temas', async ({ page }, testInfo) => {
  await page.setViewportSize(viewport);
  await openApp(page, 'light');
  await filledLayout(page);
  await assertLayout(page);
  await capture(page, testInfo, 'attendance-' + viewport.width + '-light');
  await captureContext(page, testInfo, 'attendance-' + viewport.width + '-light');
  await page.evaluate(() => localStorage.setItem('gop_theme', 'dark'));
  await page.reload();
  await expect(records(page)).toHaveCount(1);
  await estimates(page).getByRole('button', { name: 'Estimar atendimento', exact: true }).click();
  const form = editor(page);
  await form.getByLabel('Escola', { exact: true }).selectOption(SCHOOL_B.designacao);
  await fillGroup(form, 1, { description: 'Grupo fictício em monitor amplo', quantity: 3, price: '10,0000', source: 'Origem fictícia de teste em monitor amplo' });
  await assertLayout(page);
  await capture(page, testInfo, 'attendance-' + viewport.width + '-dark');
  await captureContext(page, testInfo, 'attendance-' + viewport.width + '-dark');
});
}
