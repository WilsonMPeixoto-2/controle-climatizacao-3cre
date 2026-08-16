import { test, expect } from '@playwright/test';

const SURVEY_URL = '/?levantamento=312014';
const STORAGE_KEY = 'gop_climate_survey_312014';

test.describe('Prontuário de Climatização - visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test('permite preencher um ambiente e dois aparelhos sem banco de dados', async ({ page }) => {
    await page.goto(SURVEY_URL);

    await expect(page.getByRole('heading', { name: 'Prontuário de Climatização' })).toBeVisible();
    await expect(page.getByText('Escola Municipal Nereu Sampaio')).toBeVisible();

    await page.getByLabel('Tipo de ambiente').fill('Sala de Aula');
    await page.getByLabel('Identificação do ambiente').fill('101');
    await page.getByLabel('Quantidade de aparelhos').selectOption('2');

    const applianceOne = page.locator('[data-appliance-index="0"]');
    const applianceTwo = page.locator('[data-appliance-index="1"]');

    await applianceOne.getByLabel('Modelo / marca').fill('Springer Midea');
    await applianceOne.getByLabel('Capacidade (BTU)').fill('12000');
    await applianceOne.getByLabel('Tipo do aparelho').fill('Split');
    await applianceOne.getByLabel('Situação').selectOption('Funcionando');

    await applianceTwo.getByLabel('Modelo / marca').fill('Gree');
    await applianceTwo.getByLabel('Capacidade (BTU)').fill('18000');
    await applianceTwo.getByLabel('Tipo do aparelho').fill('Split Hi Wall');
    await applianceTwo.getByLabel('Situação').selectOption('Precisa de manutenção');

    await page.getByRole('button', { name: 'Salvar rascunho' }).click();
    await expect(page.getByText('Rascunho salvo neste navegador.')).toBeVisible();

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
    expect(stored.designacao).toBe('312014');
    expect(stored.ambientes[0].nome_exibicao).toBe('Sala de Aula 101');
    expect(stored.ambientes[0].aparelhos).toHaveLength(2);
  });

  test('aceita ambiente livre e mantém o formulário utilizável no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SURVEY_URL);
    await page.getByRole('button', { name: 'Novo ambiente' }).click();
    await page.getByLabel('Tipo de ambiente').fill('Laboratório Maker');
    await page.getByLabel('Identificação do ambiente').fill('Bloco B');
    await page.getByLabel('Quantidade de aparelhos').selectOption('1');

    await expect(page.getByText('Laboratório Maker Bloco B').first()).toBeVisible();
    await expect(page.locator('[data-appliance-index="0"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar rascunho' })).toBeVisible();
  });
});
