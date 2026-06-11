import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GOP Clima — Criação de Chamados e Acessibilidade', () => {
  test('deve preencher o formulário, validar com Zod e criar chamado no modo local', async ({ page }) => {
    await page.goto('/');

    // 1. Navega para a aba de Registrar Chamado
    const registerTabBtn = page.locator('button[title="Registrar chamado"]');
    await expect(registerTabBtn).toBeVisible();
    await registerTabBtn.click();

    // Confirma que a aba de formulário carregou
    await expect(page.locator('h3:has-text("Registrar chamado")')).toBeVisible();

    // 2. Tentar submeter sem preencher nada para validar comportamento (validação nativa/Zod)
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // O campo de busca de escola deve estar vazio e o formulário não deve ter sido submetido
    await expect(page.locator('text=Demanda Registrada com Sucesso!')).not.toBeVisible();

    // 3. Preencher escola por autocomplete
    const schoolSearchInput = page.locator('#new-ticket-school-search');
    await schoolSearchInput.fill('Chanceler Willy Brandt');

    const suggestionItem = page.locator('.suggestion-box .suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await suggestionItem.waitFor({ state: 'visible' });
    await suggestionItem.click();

    // Confirma que os campos automáticos foram preenchidos
    await expect(page.locator('#new-ticket-designacao')).toHaveValue('313502');
    await expect(page.locator('#new-ticket-sici')).toHaveValue('11797');

    // 4. Preencher local e providência
    await page.locator('#new-ticket-local').fill('Laboratório de Robótica');
    await page.locator('#new-ticket-providencia').fill('Avaliar rede elétrica de 220V');

    // Preencher observações opcionais
    await page.locator('#new-ticket-observacoes').fill('Solicitação prioritária para instalação de split 18000 BTU.');

    // 5. Registrar Demanda
    await submitBtn.click();

    // Confirma mensagem de sucesso
    await expect(page.locator('text=Demanda Registrada com Sucesso!')).toBeVisible();
    await expect(page.locator('text=O chamado foi gravado com o identificador exclusivo')).toBeVisible();
  });

  test('deve realizar análise de acessibilidade (Axe) nas abas principais', async ({ page }) => {
    await page.goto('/');

    // 1. Análise na aba Dashboard
    await expect(page.locator('text=Resumo operacional')).toBeVisible();
    const dashboardScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Desativa algumas regras que são geradas dinamicamente pelo Leaflet ou bibliotecas externas que não controlamos diretamente
      .disableRules(['color-contrast', 'region', 'link-in-text-block', 'nested-interactive'])
      .analyze();
    expect(dashboardScan.violations).toEqual([]);

    // 2. Análise na aba Lista de chamados
    const listTabBtn = page.locator('button[title="Lista de chamados"]');
    await listTabBtn.click();
    await expect(page.locator('h3:has-text("Lista de chamados")')).toBeVisible();
    const listScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'region', 'link-in-text-block', 'nested-interactive'])
      .analyze();
    expect(listScan.violations).toEqual([]);

    // 3. Análise na aba Registrar chamado
    const registerTabBtn = page.locator('button[title="Registrar chamado"]');
    await registerTabBtn.click();
    await expect(page.locator('h3:has-text("Registrar chamado")')).toBeVisible();
    const formScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'region', 'link-in-text-block', 'nested-interactive'])
      .analyze();
    expect(formScan.violations).toEqual([]);
  });
});
