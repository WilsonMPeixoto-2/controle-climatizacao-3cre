import { test, expect } from '@playwright/test';

const indicators = [
  { label: 'Mostrar todos os chamados', title: 'Chamados registrados' },
  { label: 'Mostrar chamados ativos', title: 'Chamados ativos' },
  {
    label: 'Mostrar chamados sem movimentação há mais de sete dias',
    title: 'Sem movimentação há 7 dias ou mais'
  },
  {
    label: 'Mostrar chamados sem movimentação há mais de quinze dias',
    title: 'Sem movimentação há 15 dias ou mais'
  },
  { label: 'Mostrar chamados abertos há mais de trinta dias', title: 'Em aberto há 30 dias ou mais' },
  { label: 'Mostrar chamados abertos há mais de sessenta dias', title: 'Em aberto há 60 dias ou mais' }
];

test('os seis KPIs abrem a lista filtrada e permitem voltar ao painel', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  for (const indicator of indicators) {
    await page.getByRole('button', { name: indicator.label }).click();

    await expect(page.getByRole('heading', { name: /lista de chamados/i })).toBeVisible();
    const context = page.locator('.dashboard-kpi-result');
    await expect(context).toContainText(indicator.title);
    await expect(context).toContainText(/\d+ de \d+ chamados correspondentes/);
    await expect(page.locator('.lists-table-desktop-view .lists-table')).toBeVisible();

    await context.getByRole('button', { name: 'Voltar ao painel' }).click();
    await expect(page.getByRole('button', { name: indicator.label })).toBeVisible();
  }
});

test('teclado aciona os indicadores e abre a lista correspondente', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar chamados ativos' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.dashboard-kpi-result')).toContainText('Chamados ativos');
  await page.locator('.dashboard-kpi-result').getByRole('button', { name: 'Voltar ao painel' }).click();
  await page.getByRole('button', { name: 'Mostrar todos os chamados' }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.dashboard-kpi-result')).toContainText('Chamados registrados');
});

test('um filtro antigo não impede que o indicador mostre todos os chamados relacionados', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Lista de chamados' }).click();
  await page.getByPlaceholder('Buscar chamado...').fill('busca-inexistente-98765');
  await expect(page.getByText('Nenhum chamado encontrado').first()).toBeVisible();

  await page.getByRole('button', { name: 'Painel Executivo' }).click();
  await page.getByRole('button', { name: 'Mostrar todos os chamados' }).click();
  await expect(page.getByPlaceholder('Buscar chamado...')).toHaveValue('');
  await expect(page.locator('.dashboard-kpi-result')).toContainText('Chamados registrados');
});
