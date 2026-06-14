import { test, expect } from '@playwright/test';

test.describe('Regressão Visual', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('deve capturar screenshot da home no tema escuro', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Resumo operacional');

    // Aguarda um tempo para assentar as animações de carregamento inicial
    await page.waitForTimeout(1000);

    // Captura a tela inteira mascarando elementos dinâmicos e o mapa para evitar falsos negativos
    await expect(page).toHaveScreenshot('home-dark-theme.png', {
      mask: [
        page.locator('.leaflet-container'),
        page.locator('.op-map'),
        page.locator('.operational-summary-card'),
        page.locator('.stat-number'),
        page.locator('.header-title p'),
        page.locator('.task-queue-section'),
        page.locator('.inactivity-ranking-section'),
        page.locator('.goals-section'),
        page.locator('[role="status"]')
      ]
    });
  });

  test('deve capturar screenshot da home no tema claro', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Resumo operacional');

    // Alterna para o tema claro
    const themeBtn = page.locator('.theme-toggle-header');
    if (await themeBtn.count() > 0) {
      await themeBtn.click();
    }

    await page.waitForTimeout(1000);

    // Captura a tela inteira mascarando elementos dinâmicos e o mapa para evitar falsos negativos
    await expect(page).toHaveScreenshot('home-light-theme.png', {
      mask: [
        page.locator('.leaflet-container'),
        page.locator('.op-map'),
        page.locator('.operational-summary-card'),
        page.locator('.stat-number'),
        page.locator('.header-title p'),
        page.locator('.task-queue-section'),
        page.locator('.inactivity-ranking-section'),
        page.locator('.goals-section'),
        page.locator('[role="status"]')
      ]
    });
  });
});
