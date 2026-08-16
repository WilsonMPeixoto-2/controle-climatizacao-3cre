import { test, expect } from '@playwright/test';

const SURVEY_URL = '/?levantamento=312014';
const STORAGE_KEY = 'gop_climate_survey_312014';

test.describe('Prontuário de Climatização - MVP', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test('diretor cadastra ambiente e aparelhos e reencontra o rascunho após recarregar', async ({ page }) => {
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
    await applianceTwo.getByLabel('Observações').fill('Apresenta ruído na unidade interna.');

    await page.getByRole('button', { name: 'Salvar levantamento' }).click();
    await expect(page.getByText(/Levantamento salvo/)).toBeVisible();

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
    expect(stored.designacao).toBe('312014');
    expect(stored.ambientes).toHaveLength(1);
    expect(stored.ambientes[0].nome_exibicao).toBe('Sala de Aula 101');
    expect(stored.ambientes[0].aparelhos).toHaveLength(2);

    await page.reload();
    await expect(page.getByLabel('Identificação do ambiente')).toHaveValue('101');
    await expect(applianceOne.getByLabel('Modelo / marca')).toHaveValue('Springer Midea');
    await expect(applianceTwo.getByLabel('Situação')).toHaveValue('Precisa de manutenção');
  });

  test('permite criar outro ambiente com nome livre sem consultar chamados', async ({ page }) => {
    await page.goto(SURVEY_URL);
    await page.getByRole('button', { name: 'Novo ambiente' }).click();

    await page.getByLabel('Tipo de ambiente').fill('Laboratório Maker');
    await page.getByLabel('Identificação do ambiente').fill('Bloco B');
    await page.getByLabel('Quantidade de aparelhos').selectOption('1');

    await expect(page.getByText('Laboratório Maker Bloco B')).toBeVisible();
    await expect(page.locator('[data-appliance-index="0"]')).toBeVisible();
  });
});
