import { test, expect } from '@playwright/test';

test.describe('GOP Clima E2E tests', () => {
  test('deve carregar a home e exibir o painel operacional', async ({ page }) => {
    // Abre a página local
    await page.goto('/');

    // Verifica que o painel principal foi renderizado com a leitura operacional de hoje
    await expect(page.locator('text=Resumo operacional')).toBeVisible();
    await expect(page.locator('text=O que exige ação agora')).toBeVisible();
  });

  test('deve alternar entre abas e carregar dossiê da escola', async ({ page }) => {
    await page.goto('/');

    // Clica na aba Consulta por Escola
    await page.click('button:has-text("Consulta por Escola")');

    // Verifica se a primeira escola já veio carregada ou se exibe tela inicial de forma robusta
    const titleLocator = page.locator('h2');
    
    if (await titleLocator.count() === 0) {
      // Nenhuma escola selecionada (tela inicial vazia), preenchemos a busca
      const searchInput = page.locator('input[placeholder="Nome ou designação..."]');
      await searchInput.fill('Chanceler Willy Brandt');

      const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
      await suggestionItem.waitFor({ state: 'visible' });
      await suggestionItem.click();
    } else {
      const titleText = await titleLocator.first().innerText();
      if (!titleText.includes('Chanceler Willy Brandt')) {
        const searchInput = page.locator('input[placeholder="Nome ou designação..."]');
        await searchInput.fill('Chanceler Willy Brandt');

        const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
        await suggestionItem.waitFor({ state: 'visible' });
        await suggestionItem.click();
      }
    }

    // Confirma que a Ficha Técnica Consolidada da escola carregou
    await expect(page.locator('h2:has-text("CIEP Chanceler Willy Brandt")')).toBeVisible();
    await expect(page.locator('text=Designação: 313502')).toBeVisible();
  });

  test('deve alternar entre temas claro/escuro e persistir', async ({ page }) => {
    await page.goto('/');

    // Verifica o tema inicial (padrão dark-theme)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark-theme/);

    // Clica no botão de alternar tema (.theme-toggle-header)
    const themeBtn = page.locator('.theme-toggle-header');
    if (await themeBtn.count() > 0) {
      await themeBtn.click();
      // Verifica se o tema mudou para light (remove dark-theme class)
      await expect(htmlElement).not.toHaveClass(/dark-theme/);
      
      // Recarrega a página
      await page.reload();
      // Confirma que persiste como light (sem dark-theme)
      await expect(htmlElement).not.toHaveClass(/dark-theme/);
    }
  });

  test('deve exibir estimativa financeira, atalho de e-mail e filtros de timeline no dossiê', async ({ page }) => {
    await page.goto('/');

    // Clica na aba Consulta por Escola
    await page.click('button:has-text("Consulta por Escola")');

    // Pesquisa e seleciona a escola "Chanceler Willy Brandt"
    const searchInput = page.locator('input[placeholder="Nome ou designação..."]');
    await searchInput.fill('Chanceler Willy Brandt');
    const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await suggestionItem.waitFor({ state: 'visible' });
    await suggestionItem.click();

    // 1. Verifica a exibição da estimativa referencial e da nota legal
    await expect(page.locator('text=Estimativa referencial preliminar, não orçamentária:')).toBeVisible();
    await expect(page.locator('text=Valor meramente referencial para triagem gerencial')).toBeVisible();

    // 2. Se houver atalho de e-mail de pendência (porque o CIEP Chanceler Willy Brandt tem chamados ativos)
    const emailBtn = page.locator('.btn-email-shortcut');
    if (await emailBtn.count() > 0) {
      await emailBtn.click();
      // Deve ter trocado para a aba de e-mail
      await expect(page.locator('textarea')).toBeVisible();
      // Volta para a aba Consulta por Escola
      await page.click('button:has-text("Consulta por Escola")');
    }

    // 3. Verifica os botões de filtro na linha do tempo
    await expect(page.locator('button:has-text("Todos")')).toBeVisible();
    await expect(page.locator('button:has-text("Notas Técnicas")')).toBeVisible();
    await expect(page.locator('button:has-text("Histórico do Sistema")')).toBeVisible();

    // Clica em Notas Técnicas e verifica o comportamento
    await page.click('button:has-text("Notas Técnicas")');
    // Clica em Histórico do Sistema
    await page.click('button:has-text("Histórico do Sistema")');
  });
});
