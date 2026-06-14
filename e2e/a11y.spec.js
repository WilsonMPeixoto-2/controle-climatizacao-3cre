import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function runA11yScan(page) {
  // We exclude the map container because the map contains dynamic external tiles/layers out of our control
  const results = await new AxeBuilder({ page })
    .exclude('.op-map')
    .exclude('.leaflet-container')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe('Acessibilidade (WCAG 2.1)', () => {
  test('painel - tema escuro (padrão)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark-theme/);
    await expect(page.getByText('Volume Geral')).toBeVisible();
    await runA11yScan(page);
  });

  test('painel - tema claro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark-theme/);
    await page.click('.theme-toggle-header');
    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await runA11yScan(page);
  });

  test('lista de chamados - tema escuro e tema claro', async ({ page }) => {
    await page.goto('/');
    // Navega para a aba de chamados
    await page.click('button:has-text("Chamados")');
    await expect(page.getByPlaceholder('Buscar chamado...')).toBeVisible();
    await runA11yScan(page);

    // Alterna para tema claro e testa
    await page.click('.theme-toggle-header');
    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await runA11yScan(page);
  });

  test('dossiê da escola - tema escuro e tema claro', async ({ page }) => {
    await page.goto('/');
    // Navega para a aba Consulta por Escola
    await page.click('button:has-text("Consulta por Escola")');

    // Pesquisa e seleciona a escola "Chanceler Willy Brandt"
    const searchInput = page.locator('input[placeholder="Nome ou designação..."]');
    await searchInput.fill('Chanceler Willy Brandt');
    const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await suggestionItem.waitFor({ state: 'visible' });
    await suggestionItem.click();

    // Confirma que carregou
    await expect(page.locator('h2:has-text("CIEP Chanceler Willy Brandt")')).toBeVisible();
    await runA11yScan(page);

    // Alterna para tema claro e testa
    await page.click('.theme-toggle-header');
    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await runA11yScan(page);
  });

  test('registro de chamado - tema escuro e tema claro', async ({ page }) => {
    await page.goto('/');
    // Navega para a aba Registrar chamado
    await page.click('button:has-text("Registrar chamado")');
    await expect(page.locator('h3:has-text("Registrar chamado")')).toBeVisible();
    await runA11yScan(page);

    // Alterna para tema claro e testa
    await page.click('.theme-toggle-header');
    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await runA11yScan(page);
  });
});
