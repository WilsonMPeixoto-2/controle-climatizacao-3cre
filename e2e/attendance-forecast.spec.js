import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { deleteApp, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { createAttendancePersistence } from '../src/infrastructure/firebase/attendancePersistence.js';
import { seedAttendanceDevelopment } from '../scripts/seed-attendance-development.mjs';
import { attendanceSchools, attendanceTickets } from '../test/fixtures/attendance-development.mjs';

// Todos os preços e documentos deste spec são sintéticos. Somente os vínculos
// são carregados administrativamente; os atendimentos passam pelo SDK e Rules.
const SCHOOL_A = attendanceSchools[0];
const SCHOOL_B = attendanceSchools[1];
const MAIN_ID = 'forecast-atendimento-A';
const PARTIAL_ID = 'forecast-atendimento-A-parcial';
const OTHER_ID = 'forecast-atendimento-B';
const ZERO_ID = 'forecast-atendimento-B-zero';
const MAIN_DESCRIPTION = 'Serviço sintético A — nominal e cobertura';
const PARTIAL_DESCRIPTION = 'Parcela pendente sintética A';
const SOURCE_V1 = 'Orçamento fictício A — edição 1';
const SOURCE_V3 = 'Orçamento fictício A — edição 3';
const money = value => new RegExp('R\\$\\s*' + value.replaceAll('.', '\\.'));
const forecast = page => page.getByRole('region', { name: 'Previsão mensal compartilhada', exact: true });
const summary = page => forecast(page).getByRole('region', { name: 'Síntese financeira do período', exact: true });
const details = page => page.getByRole('region', { name: 'Atendimentos da previsão', exact: true });
const estimates = page => page.getByRole('region', { name: 'Estimativas de atendimento', exact: true });
const records = page => details(page).locator('.attendance-record');
const recordWith = (page, text) => records(page).filter({ hasText: text });
const editor = page => page.getByRole('form', { name: /^(Estimar atendimento|Editar estimativa de atendimento)$/ });
const bar = (page, month) => forecast(page).locator('.forecast-bar[data-month="' + month + '"]');
const metric = (page, name) => summary(page).locator('.forecast-kpi[data-measure="' + name + '"]');
const knownButton = (page, name) => forecast(page).getByRole('button', {
  name: name === 'nominal' ? 'Consultar parcela conhecida da referência nominal' : 'Consultar parcela conhecida do acréscimo adicional',
  exact: true
});
const pendingButton = (page, name) => forecast(page).getByRole('button', {
  name: name === 'nominal' ? 'Consultar pendências da referência nominal' : 'Consultar pendências do acréscimo adicional',
  exact: true
});

async function withPersistence(run) {
  const app = initializeApp({
    projectId: 'demo-gop-clima-financeiro',
    apiKey: 'demo-finance-development-key',
    appId: 'demo-finance-development-app'
  }, 'forecast-e2e-' + crypto.randomUUID());
  try {
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8082);
    // Não há Auth SDK nem contexto administrativo nas gravações abaixo.
    return await run(createAttendancePersistence(db));
  } finally {
    await deleteApp(app);
  }
}

function item(id, overrides = {}) {
  return {
    id, description: MAIN_DESCRIPTION, equipmentType: 'Split',
    capacityBtu: null, equipmentRef: '', quantity: 2,
    coverage: 'adicional', coverageSourceRef: 'Decisão fictícia de cobertura adicional',
    referenceNature: 'provisoria', unitPriceUnits4: 1234567,
    sourceRef: SOURCE_V1, referenceVersion: 'fictícia-v1', catalogId: '', categoryCode: '',
    ...overrides
  };
}

function attendance(schoolId, items, overrides = {}) {
  return {
    schoolId, plannedMonth: '2026-11', plannedDate: '', serviceKind: 'preventiva',
    cycle: 'Ciclo fictício de previsão', visitId: '', ticketIds: [],
    responsibleLabel: '', sessionId: 'sessao-ficticia-sdk-previsao', items,
    ...overrides
  };
}

async function prepareForecast() {
  await seedAttendanceDevelopment({ synthetic: true, reset: true });
  await withPersistence(persistence => Promise.all([
    persistence.saveAttendance(attendance(SCHOOL_A.designacao, [
      item('grupo-A1'),
      item('grupo-A2', {
        description: 'Parcela nominal sintética A incluída', quantity: 3,
        unitPriceUnits4: 100000, sourceRef: 'Preço fictício A2',
        coverage: 'incluido', coverageSourceRef: 'Cobertura incluída fictícia A2'
      })
    ], { ticketIds: ['GOP-AR-2026-9001', 'GOP-AR-2026-9002'], visitId: 'visita-sintetica-A' }), { id: MAIN_ID }),
    persistence.saveAttendance(attendance(SCHOOL_A.designacao, [
      item('grupo-A-pendente', {
        description: PARTIAL_DESCRIPTION, quantity: 1, unitPriceUnits4: null,
        referenceNature: 'informada', sourceRef: 'Documento fictício ainda sem preço',
        coverage: 'a_confirmar', coverageSourceRef: ''
      })
    ], { ticketIds: ['GOP-AR-2026-9001'], visitId: 'visita-sintetica-A' }), { id: PARTIAL_ID }),
    persistence.saveAttendance(attendance(SCHOOL_B.designacao, [
      item('grupo-B1', {
        description: 'Serviço sintético B — cobertura a confirmar', quantity: 2,
        unitPriceUnits4: 777000, sourceRef: 'Orçamento fictício B',
        coverage: 'a_confirmar', coverageSourceRef: ''
      })
    ], { ticketIds: ['GOP-AR-2026-9003'] }), { id: OTHER_ID }),
    persistence.saveAttendance(attendance(SCHOOL_B.designacao, [
      item('grupo-B-zero', {
        description: 'Zero explícito sintético B', quantity: 0,
        unitPriceUnits4: 0, sourceRef: 'Origem fictícia do zero informado',
        referenceNature: 'informada'
      })
    ], { plannedMonth: '2026-12' }), { id: ZERO_ID })
  ]));
}

async function openApp(page, theme = 'light') {
  await page.context().route('https://va.vercel-scripts.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.context().route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  }));
  await page.context().addInitScript(({ schools, tickets, theme }) => {
    if (localStorage.getItem('forecast_synthetic_fixture_v1')) return;
    localStorage.setItem('gop_schools', JSON.stringify(schools));
    localStorage.setItem('gop_tickets', JSON.stringify(tickets));
    localStorage.setItem('gop_theme', theme);
    localStorage.setItem('forecast_synthetic_fixture_v1', 'true');
    sessionStorage.setItem('gop_current_tab', 'finance');
  }, { schools: attendanceSchools, tickets: attendanceTickets, theme });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gestão Financeira', exact: true })).toBeVisible();
  await expect(estimates(page).getByRole('status').filter({ hasText: 'Base de desenvolvimento compartilhada' })).toBeVisible();
  await forecast(page).getByLabel('Ano da previsão', { exact: true }).fill('2026');
}

async function choosePeriod(page, month) {
  await forecast(page).getByLabel('Competência prevista', { exact: true }).fill(month);
}

async function saveEdit(page, revision) {
  const form = editor(page);
  await form.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(estimates(page).getByRole('status').filter({
    hasText: 'Atendimento salvo na base compartilhada de desenvolvimento · versão ' + revision + '.'
  })).toBeVisible();
}

test.beforeEach(async () => { await prepareForecast(); });

test('síntese, barras e escolas reconciliam parcelas conhecidas sem somar naturezas diferentes nem vínculos repetidos', async ({ page }) => {
  await openApp(page);
  await choosePeriod(page, '2026-11');
  await expect(metric(page, 'nominal')).toContainText(money('432,3134'));
  await expect(metric(page, 'additional')).toContainText(money('246,9134'));
  await expect(pendingButton(page, 'nominal')).toContainText('1 atendimento');
  await expect(pendingButton(page, 'additional')).toContainText('2 atendimentos');
  await expect(bar(page, '2026-11')).toHaveAccessibleName(money('432,3134'));
  await expect(bar(page, '2026-11')).toHaveAccessibleName(/3 atendimentos/);
  const table = forecast(page).getByRole('table', { name: 'Composição da previsão por escola', exact: true });
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table.locator('tr[data-school-id="' + SCHOOL_A.designacao + '"]')).toContainText(money('276,9134'));
  await expect(table.locator('tr[data-school-id="' + SCHOOL_B.designacao + '"]')).toContainText(money('155,4000'));

  await knownButton(page, 'nominal').click();
  await expect(records(page)).toHaveCount(2);
  await expect(recordWith(page, PARTIAL_DESCRIPTION)).toHaveCount(0);
  await pendingButton(page, 'nominal').click();
  await expect(records(page)).toHaveCount(1);
  await expect(recordWith(page, PARTIAL_DESCRIPTION)).toBeVisible();
  await bar(page, '2026-11').click();
  await expect(records(page)).toHaveCount(3);
  await forecast(page).getByRole('button', { name: 'Consultar atendimentos de ' + SCHOOL_B.unidade_escolar, exact: true }).click();
  await expect(page.locator('#finance-school')).toHaveValue(SCHOOL_B.designacao);
  await expect(forecast(page).getByLabel('Competência prevista', { exact: true })).toHaveValue('2026-11');
  await expect(forecast(page).getByLabel('Grandeza do gráfico', { exact: true })).toHaveValue('nominal');
  await expect(records(page)).toHaveCount(1);
  await expect(metric(page, 'nominal')).toContainText(money('155,4000'));
  await expect(metric(page, 'additional')).not.toContainText(money('0,0000'));
  await expect(metric(page, 'additional')).toContainText(/Não informad/i);
});

test('reprogramação e correção atualizam meses e outra sessão preservando ID, histórico e filtros', async ({ page, browser, baseURL }) => {
  const otherContext = await browser.newContext({ baseURL });
  try {
    const other = await otherContext.newPage();
    await Promise.all([openApp(page), openApp(other)]);
    for (const active of [page, other]) {
      await active.locator('#finance-school').selectOption(SCHOOL_A.designacao);
      await choosePeriod(active, '2026-11');
      await forecast(active).getByLabel('Grandeza do gráfico', { exact: true }).selectOption('additional');
    }
    await bar(page, '2026-11').click();
    await recordWith(page, MAIN_DESCRIPTION).getByRole('button', { name: /^Abrir e editar atendimento de/ }).click();
    await editor(page).getByLabel('Mês previsto', { exact: true }).fill('2026-12');
    await saveEdit(page, 2);
    await expect(forecast(page).getByLabel('Competência prevista', { exact: true })).toHaveValue('2026-11');
    await expect(page.locator('#finance-school')).toHaveValue(SCHOOL_A.designacao);
    await expect(forecast(page).getByLabel('Grandeza do gráfico', { exact: true })).toHaveValue('additional');
    await expect(bar(other, '2026-11')).toHaveAccessibleName(/sem valor conhecido/i);
    await expect(bar(other, '2026-12')).toHaveAccessibleName(money('246,9134'));
    await expect(recordWith(other, MAIN_DESCRIPTION)).toHaveCount(0);
    await bar(other, '2026-12').click();
    await recordWith(other, MAIN_DESCRIPTION).getByRole('button', { name: /^Abrir e editar atendimento de/ }).click();
    const firstGroup = editor(other).getByRole('group', { name: 'Grupo 1', exact: true });
    await firstGroup.getByLabel(/^Preço unitário/).fill('200,0000');
    await firstGroup.getByLabel(/^Origem do preço/).fill(SOURCE_V3);
    await saveEdit(other, 3);
    await expect(metric(other, 'nominal')).toContainText(money('430,0000'));
    await expect(metric(other, 'additional')).toContainText(money('400,0000'));
    await expect(bar(page, '2026-12')).toHaveAccessibleName(money('400,0000'));
    await expect(forecast(other).getByLabel('Competência prevista', { exact: true })).toHaveValue('2026-12');
    const persisted = await withPersistence(async persistence => ({
      records: await persistence.loadAttendances(),
      revisions: await persistence.loadAttendanceRevisions(MAIN_ID)
    }));
    expect(persisted.records).toHaveLength(4);
    const changed = persisted.records.find(record => record.id === MAIN_ID);
    expect(changed.plannedMonth).toBe('2026-12');
    expect(changed.revision).toBe(3);
    expect(persisted.revisions.map(record => record.revision)).toEqual([3, 2, 1]);
    expect(persisted.revisions.map(record => record.plannedMonth)).toEqual(['2026-12', '2026-12', '2026-11']);
    expect(persisted.revisions.at(-1).items[0].sourceRef).toBe(SOURCE_V1);
    expect(persisted.revisions[0].items[0].sourceRef).toBe(SOURCE_V3);
  } finally {
    await otherContext.close();
  }
});

test('competência vazia difere de zero informado e o mês de abertura dos chamados não altera a previsão', async ({ page }) => {
  await openApp(page);
  await choosePeriod(page, '2026-12');
  await expect(metric(page, 'nominal')).toContainText(money('0,0000'));
  await expect(metric(page, 'additional')).toContainText(money('0,0000'));
  await expect(bar(page, '2026-12')).toHaveAccessibleName(/1 atendimento/);
  await expect(bar(page, '2026-12')).toHaveAccessibleName(money('0,0000'));
  await expect(bar(page, '2026-01')).toHaveAccessibleName(/sem valor conhecido/i);
  await page.locator('#finance-month').fill('2030-01');
  await expect(forecast(page).getByLabel('Competência prevista', { exact: true })).toHaveValue('2026-12');
  await expect(metric(page, 'nominal')).toContainText(money('0,0000'));
  await expect(records(page)).toHaveCount(1);
  await choosePeriod(page, '2026-01');
  await expect(records(page)).toHaveCount(0);
  await expect(metric(page, 'nominal')).not.toContainText(money('0,0000'));
  await expect(metric(page, 'additional')).not.toContainText(money('0,0000'));
  await forecast(page).getByLabel('Ano da previsão', { exact: true }).fill('2027');
  await expect(forecast(page)).toContainText(/Nenhum atendimento/i);
  await expect(forecast(page).locator('.forecast-school-table tbody tr[data-school-id]')).toHaveCount(0);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 3840, height: 2160 }, { width: 320, height: 844 }]) {
  for (const theme of ['light', 'dark']) {
    test('previsão ' + viewport.width + 'px ' + theme + ': valores, composição, teclado, contraste e captura real', async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize(viewport);
      await openApp(page, theme);
      await choosePeriod(page, '2026-11');
      await expect(metric(page, 'nominal')).toContainText(money('432,3134'));
      await expect(metric(page, 'additional')).toContainText(money('246,9134'));
      await bar(page, '2026-11').focus();
      await page.keyboard.press('Enter');
      await expect(records(page)).toHaveCount(3);
      await expect(details(page)).toBeFocused();
      await expect(bar(page, '2026-11')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      const scan = await new AxeBuilder({ page }).include('.forecast-overview').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(scan.violations).toEqual([]);
      const componentPath = testInfo.outputPath('forecast-' + viewport.width + '-' + theme + '.png');
      await forecast(page).screenshot({ path: componentPath, animations: 'disabled' });
      await testInfo.attach('Previsão — dados sintéticos — ' + viewport.width + 'px ' + theme, { path: componentPath, contentType: 'image/png' });
      await forecast(page).evaluate(element => element.scrollIntoView({ block: 'start' }));
      const contextPath = testInfo.outputPath('forecast-' + viewport.width + '-' + theme + '-context.png');
      await page.screenshot({ path: contextPath, animations: 'disabled' });
      await testInfo.attach('Contexto real — ' + viewport.width + 'px ' + theme, { path: contextPath, contentType: 'image/png' });
      expect(errors).toEqual([]);
    });
  }
}
