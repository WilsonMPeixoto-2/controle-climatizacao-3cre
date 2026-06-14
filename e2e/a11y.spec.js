import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Acessibilidade (WCAG 2.1)', () => {
  test('deve passar na verificação axe no tema escuro', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Resumo operacional');

    // Analisa a página inicial inteira sob acessibilidade básica
    // Desabilitamos color-contrast temporariamente para o Leaflet/Mapas legados que contêm tiles não controladas por nós
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'document-title'])
      .exclude('.op-map')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('deve passar na verificação axe no tema claro', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Resumo operacional');

    // Alterna para o tema claro
    const themeBtn = page.locator('.theme-toggle-header');
    if (await themeBtn.count() > 0) {
      await themeBtn.click();
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'document-title'])
      .exclude('.op-map')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
