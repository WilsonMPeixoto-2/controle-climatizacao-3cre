import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fixtures sintéticas exclusivamente para testes/capturas. Não entram no produto.
const schools = [
  { designacao: '900001', unidade_escolar: 'Unidade de teste visual A', bairro: 'Teste', sici: 'TESTE-A', aparelhos_total: 25, qtd_salas_de_aula: 10, aparelhos_em_sala: 15, necessidade_aparelhos: 0 },
  { designacao: '900002', unidade_escolar: 'Unidade de teste visual B', bairro: 'Teste', sici: 'TESTE-B', aparelhos_total: 40 }
];
const tickets = [
  { id_chamado: 'GOP-AR-2026-9001', ...schools[0], tipo_demanda: 'Manutenção Corretiva', tipo_aparelho: 'Split', btu_existente: '12000', btu_pretendido: '18000', criado_em: '2026-10-01', status_atual: '1 - Recebido — em triagem' },
  { id_chamado: 'GOP-AR-2026-9002', ...schools[0], tipo_demanda: 'Nova Instalação', criado_em: '2026-09-01', status_atual: '1 - Recebido — em triagem' },
  { id_chamado: 'GOP-AR-2026-9003', ...schools[1], tipo_demanda: 'Adequação infra/elétrica', criado_em: '2026-10-15', status_atual: '1 - Recebido — em triagem' },
  { id_chamado: 'GOP-AR-2026-9004', ...schools[0], tipo_demanda: 'Manutenção Preventiva', criado_em: '', status_atual: '1 - Recebido — em triagem' }
].map(ticket => ({ ...ticket, setor_responsavel: 'GOP', local_demanda: 'Sala de teste', prioridade: 'Média', proxima_providencia: 'Conferir solicitação de teste.', informacao_validada: 'Pendente de Vistoria', resultado_aptidao: 'Pendente', modificado_em: '2026-10-20', observacoes: 'Registro sintético para teste de interface.' }));

async function seed(page, theme = 'light') {
  await page.addInitScript(({ schools, tickets, theme }) => {
    if (!localStorage.getItem('finance_test_seeded')) {
      localStorage.setItem('gop_schools', JSON.stringify(schools));
      localStorage.setItem('gop_tickets', JSON.stringify(tickets));
      localStorage.setItem('gop_theme', theme);
      localStorage.setItem('finance_test_seeded', 'true');
    }
  }, { schools, tickets, theme });
  await page.goto('/');
}
const nav = (page, name) => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name, exact: true });
async function finance(page) {
  await nav(page, 'Gestão Financeira').click();
  await expect(page.getByRole('heading', { name: 'Gestão Financeira', exact: true })).toBeVisible();
}
async function chooseSchool(page) {
  await nav(page, 'Consulta por Escola').click();
  await page.getByPlaceholder('Nome ou designação...').fill('900001');
  await page.locator('.suggestion-item').filter({ hasText: 'Unidade de teste visual A' }).click();
}

test('financeiro usa recorte real, preserva ausências e retorna à ficha existente', async ({ page }) => {
  await seed(page);
  const original = await page.evaluate(() => localStorage.getItem('gop_tickets'));
  await finance(page);
  await expect(page).toHaveTitle(/Gestão Financeira/);
  await expect(nav(page, 'Gestão Financeira')).toHaveCount(1);
  await expect(page.locator('.finance-missing')).toHaveText(Array(4).fill('Não informado'));
  await expect(page.locator('.finance-page')).not.toContainText('R$');
  await expect(page.getByLabel('4 solicitações no recorte')).toBeVisible();
  await page.getByLabel('Escola', { exact: true }).selectOption('900001');
  await page.getByLabel('Mês de abertura').fill('2026-10');
  await expect(page.getByLabel('1 solicitações no recorte')).toBeVisible();
  await expect(page.getByText('1 solicitação(ões) sem data de abertura válida fora deste recorte mensal.')).toBeVisible();
  await expect(page.getByText('Âmbito global · não filtrado por escola ou mês')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Referência financeira de manutenção', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Consulta a partir de', { exact: false })).toContainText('BTU existente');
  await expect(dialog.getByText('12.000 BTU', { exact: true })).toBeVisible();
  await expect(dialog.getByText('18.000 BTU', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Valor de referência: Não informado.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Salvar Alterações' })).toBeDisabled(); // contrato local anterior
  await dialog.getByRole('button', { name: 'Fechar ficha do chamado' }).click();
  await expect(page.getByLabel('Mês de abertura')).toHaveValue('2026-10');
  await page.getByLabel('Mês de abertura').fill('2030-01');
  await expect(page.getByText('Nenhuma solicitação neste recorte.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByLabel('Escola', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Mês de abertura')).toHaveValue('');
  await expect(page.getByLabel('4 solicitações no recorte')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gop_tickets'))).toBe(original);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Gestão Financeira', exact: true })).toBeVisible();
});

test('mantém navegação histórica e contexto escolar sem inventário financeiro', async ({ page }) => {
  await seed(page);
  await finance(page);
  for (const name of ['Painel Executivo', 'Lista de chamados', 'Consulta por Escola', 'Registrar chamado', 'Comunicações']) {
    await nav(page, name).click();
    await expect(nav(page, name)).toHaveAttribute('aria-current', 'page');
  }
  page.once('dialog', dialog => dialog.accept('GOP-ADMIN-3CRE'));
  await nav(page, 'Administração dos Dados').click();
  await expect(nav(page, 'Administração dos Dados')).toHaveAttribute('aria-current', 'page');
  await chooseSchool(page);
  const summary = page.getByRole('region', { name: 'Contexto financeiro da escola' });
  await expect(summary).toContainText('Informações financeiras ainda não registradas');
  await expect(summary).not.toContainText('R$');
  await summary.getByRole('button', { name: 'Consultar Gestão Financeira' }).click();
  await expect(page.getByLabel('Escola', { exact: true })).toHaveValue('900001');
  await expect(page.getByLabel('3 solicitações no recorte')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9002' }).click();
  await expect(page.getByRole('dialog')).toContainText('Referência financeira de manutenção não aplicável automaticamente a este tipo de demanda');
});

test('registro continua possível sem tipo conhecido, BTUs ou tabela de preços', async ({ page }) => {
  await seed(page);
  await nav(page, 'Registrar chamado').click();
  await page.getByLabel('Buscar Escola por Nome / Designação *').fill('900001');
  await page.locator('.suggestion-item').filter({ hasText: 'Unidade de teste visual A' }).click();
  await page.locator('#new-ticket-local').fill('Sala de teste sem inventário');
  await page.locator('#new-ticket-tipo').selectOption('Manutenção Corretiva');
  await page.getByLabel('Tipo de Equipamento').selectOption('Não Sabe Informar');
  await page.locator('.finance-reference summary').click();
  await expect(page.locator('.finance-reference')).toContainText('nenhuma categoria presumida');
  await expect(page.locator('.finance-reference')).toContainText('Unidade de teste visual A');
  await page.locator('form').getByRole('button', { name: 'Registrar Chamado', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registrar Outro' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_tickets')));
  expect(saved).toHaveLength(5);
  const created = saved.find(ticket => ticket.local_demanda === 'Sala de teste sem inventário');
  expect(created.tipo_aparelho).toBe('Não Sabe Informar');
  expect(created.btu_existente).toBe('');
  expect(created.btu_pretendido).toBe('');
  expect(created).not.toHaveProperty('priceUnits4');
});

for (const theme of ['light', 'dark']) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 3840, height: 2160 }, { width: 390, height: 844 }]) {
    test(`interfaces ${theme} ${viewport.width}px: teclado, responsividade e capturas`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await seed(page, theme);
      await finance(page);
      await page.getByLabel('Escola', { exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Mês de abertura')).toBeFocused();
      await page.keyboard.press('Tab'); // month input tem segmentos nativos por plataforma
      await page.getByRole('button', { name: 'Limpar filtros' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByLabel('4 solicitações no recorte')).toBeVisible();
      // O axe deve medir os tokens finais, não a opacidade intermediária de cardFadeUp.
      await page.locator('.finance-page').evaluate(async element => {
        await document.fonts.ready;
        await Promise.all(element.getAnimations({ subtree: true })
          .filter(animation => animation.effect.getTiming().iterations !== Infinity)
          .map(animation => animation.finished));
      });
      const scan = await new AxeBuilder({ page }).include('.finance-page').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(scan.violations).toEqual([]);
      const capture = async name => {
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(page.locator('vite-error-overlay')).toHaveCount(0);
        const path = testInfo.outputPath(`${name}-${viewport.width}-${theme}.png`);
        await page.screenshot({ path, fullPage: name === 'finance', animations: 'disabled' });
        await testInfo.attach(`${name}-${viewport.width}-${theme}`, { path, contentType: 'image/png' });
      };
      await capture('finance');
      await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001' }).click();
      await expect(page.getByRole('dialog').getByText('Valor de referência: Não informado.')).toBeVisible();
      await capture('ticket-reference');
      await page.getByRole('button', { name: 'Fechar ficha do chamado' }).click();
      await chooseSchool(page);
      await page.getByRole('region', { name: 'Contexto financeiro da escola' }).scrollIntoViewIfNeeded();
      await capture('school-context');
      await nav(page, 'Registrar chamado').click();
      await page.locator('#new-ticket-tipo').selectOption('Manutenção Corretiva');
      await page.getByLabel('BTU Existente', { exact: true }).fill('12000');
      await page.locator('.finance-reference summary').click();
      await page.locator('.finance-reference').scrollIntoViewIfNeeded();
      await capture('form-reference');
      expect(errors).toEqual([]);
    });
  }
}
