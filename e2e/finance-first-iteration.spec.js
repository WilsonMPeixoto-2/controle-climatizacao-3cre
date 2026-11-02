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

async function seed(page, theme = 'light', data = { schools, tickets }) {
  await page.addInitScript(({ schools, tickets, theme }) => {
    if (!localStorage.getItem('finance_test_seeded')) {
      localStorage.setItem('gop_schools', JSON.stringify(schools));
      localStorage.setItem('gop_tickets', JSON.stringify(tickets));
      localStorage.setItem('gop_theme', theme);
      localStorage.setItem('finance_test_seeded', 'true');
    }
  }, { ...data, theme });
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

test('sair do painel durante o zoom do mapa não deixa callbacks em uma tela removida', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await seed(page);
  await page.locator('.leaflet-control-zoom-in').scrollIntoViewIfNeeded();
  // Termina o ajuste inicial (80 ms) e o primeiro zoom (250 ms) antes do zoom testado.
  await page.waitForTimeout(350);
  // Acompanha o início real do zoom; sai pela navegação antes do timeout do Leaflet.
  await page.locator('.leaflet-map-pane').evaluate(pane => new Promise(resolve => {
    const observer = new MutationObserver(() => {
      if (!pane.classList.contains('leaflet-zoom-anim')) return;
      observer.disconnect();
      const buttons = document.querySelectorAll('nav[aria-label="Navegação principal"] button');
      [...buttons].find(button => button.textContent.trim() === 'Gestão Financeira').click();
      resolve();
    });
    observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
    document.querySelector('.leaflet-control-zoom-in').click();
  }));
  await expect(page.getByRole('heading', { name: 'Gestão Financeira', exact: true })).toBeVisible();
  // Leaflet agenda o fim do zoom em 250 ms; observar esse prazo detecta o callback órfão.
  await page.waitForTimeout(350);
  expect(errors).toEqual([]);
  await nav(page, 'Painel Executivo').click();
  await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
});

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
  // Exibição sob demanda conserva o âmbito global e a informação ausente.
  await page.locator('.finance-availability summary').click();
  await expect(page.getByText('Âmbito global · não filtrado por escola ou mês')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('.finance-reference summary').click();
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

test('tendência de abertura usa registros reais e permite filtrar', async ({ page }) => {
  await seed(page);
  await finance(page);
  const trend = page.getByRole('group', { name: 'Evolução mensal interativa' });
  await expect(trend).toBeVisible();
  const september = trend.getByRole('button', { name: /em set de 2026/ });
  await expect(september).toHaveAttribute('aria-pressed', 'false');
  await september.click();
  await expect(page.getByLabel('Mês de abertura')).toHaveValue('2026-09');
  await expect(september).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('1 solicitações no recorte')).toBeVisible();
  await september.click();
  await expect(page.getByLabel('Mês de abertura')).toHaveValue('');
  await expect(page.getByLabel('4 solicitações no recorte')).toBeVisible();
  await expect(page.locator('.finance-page')).not.toContainText('R$');
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
  await page.getByRole('dialog').locator('.finance-reference summary').click();
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

test('ficha recebe e contém o foco, abre referência pelo teclado e devolve foco ao fechar', async ({ page }) => {
  await seed(page);
  await finance(page);
  const origin = page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001' });
  await origin.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Fechar ficha do chamado' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Copiar resumo do chamado' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Fechar', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Copiar resumo do chamado' })).toBeFocused();
  await dialog.locator('.finance-reference summary').focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('Valor de referência: Não informado.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(origin).toBeFocused();
});

for (const theme of ['light', 'dark']) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }, { width: 390, height: 844 }, { width: 320, height: 812 }]) {
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
      await page.getByRole('region', { name: 'Conferência por escola' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
      await capture('school-review');
      await page.getByRole('button', { name: 'Abrir ficha GOP-AR-2026-9001' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.locator('.finance-reference')).not.toHaveAttribute('open');
      await capture('ticket-initial');
      // A ficha precisa conter todos os botões e campos mesmo no celular estreito.
      expect(await dialog.locator('.modal-body').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      const dialogBox = await dialog.boundingBox();
      for (const button of await dialog.locator('.modal-footer button').all()) {
        const box = await button.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(dialogBox.x);
        expect(box.x + box.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width);
      }
      await dialog.locator('.finance-reference summary').click();
      await expect(page.getByRole('dialog').getByText('Valor de referência: Não informado.')).toBeVisible();
      const dialogScan = await new AxeBuilder({ page }).include('.modal-container').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(dialogScan.violations).toEqual([]);
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


test('conferência escolar diferencia ausência de registros e permite abrir dossiê e chamados reais', async ({ page }) => {
  await seed(page);
  const previousTickets = await page.evaluate(() => localStorage.getItem('gop_tickets'));
  await finance(page);
  const review = page.getByRole('region', { name: 'Conferência por escola' });
  await expect(review).toBeVisible();
  await expect(review.getByRole('button', { name: 'A conferir' })).toBeVisible();
  await expect(review).toContainText('não falta comprovada de atendimento');
  await expect(review).toContainText('A execução e a medição contratual podem constar de registros externos.');

  // A revisão mensal usa DATA DE ABERTURA e não inventa competência contratual.
  await page.getByLabel('Mês de abertura').fill('2026-09');
  await review.getByRole('button', { name: /Sem solicitação/ }).click();
  await expect(review).toContainText('Unidade de teste visual B');
  await expect(review).not.toContainText('Unidade de teste visual A');
  await review.getByRole('button', { name: 'Abrir dossiê de Unidade de teste visual B' }).click();
  await expect(nav(page, 'Consulta por Escola')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByPlaceholder('Nome ou designação...')).toHaveValue('Unidade de teste visual B');

  // Retorno preserva filtros anteriores; a navegação para a lista usa a busca original.
  await finance(page);
  await expect(page.getByLabel('Mês de abertura')).toHaveValue('2026-09');
  await review.getByRole('button', { name: /A conferir/ }).click();
  await expect(review).toContainText('Unidade de teste visual A');
  await review.getByRole('button', { name: 'Ver chamados de Unidade de teste visual A' }).click();
  await expect(nav(page, 'Lista de chamados')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('GOP-AR-2026-9001').first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gop_tickets'))).toBe(previousTickets);
});

test('conferência explora categorias, busca, expansão e registros sem vínculo sem alterar a base', async ({ page }) => {
  const extraSchools = Array.from({ length: 9 }, (_, index) => ({
    designacao: String(900010 + index), unidade_escolar: `Unidade de teste adicional ${index + 1}`, bairro: 'Bairro de expansão'
  }));
  const concluded = { designacao: '900003', unidade_escolar: 'Unidade de teste concluída', bairro: 'Concluídos' };
  const empty = { designacao: '900004', unidade_escolar: 'Unidade de teste sem solicitação', bairro: 'Sem registros' };
  const data = {
    schools: [...schools, concluded, empty, ...extraSchools],
    tickets: [...tickets,
      { ...tickets[0], ...concluded, id_chamado: 'GOP-AR-2026-9005', status_atual: '10 - Concluído' },
      ...extraSchools.map((school, index) => ({ ...tickets[0], ...school, id_chamado: `GOP-AR-2026-${9010 + index}` })),
      { ...tickets[0], id_chamado: 'GOP-AR-2026-9999', designacao: '999999', unidade_escolar: 'Sem vínculo cadastral' }
    ]
  };
  await seed(page, 'light', data);
  const previous = await page.evaluate(() => [localStorage.getItem('gop_schools'), localStorage.getItem('gop_tickets')]);
  await finance(page);
  const review = page.getByRole('region', { name: 'Conferência por escola' });
  await expect(review).toContainText('1 chamado não pôde ser associado');
  await expect(review.locator('.school-review-item')).toHaveCount(8);
  await review.getByRole('button', { name: 'Ver mais 3 escolas' }).click();
  await expect(review.locator('.school-review-item')).toHaveCount(11);
  const search = review.getByRole('searchbox', { name: 'Localizar escola' });
  await search.fill('900001');
  await expect(review.locator('.school-review-item')).toHaveCount(1);
  await expect(review).toContainText('Unidade de teste visual A');
  await search.fill('BAIRRO DE EXPANSÃO');
  await expect(review.locator('.school-review-item')).toHaveCount(8);
  await search.clear();
  const completed = review.getByRole('button', { name: /Com conclusão/ });
  await completed.focus();
  await page.keyboard.press('Enter');
  await expect(completed).toHaveAttribute('aria-pressed', 'true');
  await expect(review.locator('.school-review-item')).toHaveCount(1);
  await expect(review).toContainText('Unidade de teste concluída');
  await expect(review).toContainText('1 chamado · 1 com conclusão');
  await review.getByRole('button', { name: /Sem solicitação/ }).click();
  await expect(review).toContainText('Unidade de teste sem solicitação');
  await expect(review.getByRole('button', { name: /Ver chamados de/ })).toHaveCount(0);
  await search.fill('Inexistente');
  await expect(review.getByText('Nenhuma escola encontrada para esta seleção.', { exact: false })).toBeVisible();
  await search.clear();
  await page.getByLabel('Mês de abertura').fill('2030-01');
  await expect(review.getByRole('status').filter({ hasText: '13 escolas' })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.getItem('gop_schools'), localStorage.getItem('gop_tickets')])).toEqual(previous);
});

test('E3: programação local por escola permite salvar, reprogramar e informar execução sem alterar chamados', async ({ page }) => {
  await seed(page);
  const beforeTickets = await page.evaluate(() => localStorage.getItem('gop_tickets'));
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await expect(board).toBeVisible();
  await expect(board).toContainText('Rascunho local');
  await board.locator('#visit-board-month').fill('2026-10');
  await board.getByRole('button', { name: 'Programar', exact: true }).click();
  await board.locator('#visit-school').selectOption('900001');
  await board.locator('#visit-planned').fill('2026-10-12');
  await board.getByRole('button', { name: 'Adicionar visita' }).click();
  await expect(board.getByText('Unidade de teste visual A')).toBeVisible();
  await expect(board.locator('.visit-board-summary > div:nth-child(2) strong')).toHaveText('1');
  await expect(board).toContainText('Execução ainda não informada');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ schoolId: '900001', plannedDate: '2026-10-12', kind: 'preventiva', reportedDate: '' });

  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.locator('#visit-planned').fill('2026-11-05');
  await board.getByText('Informações complementares').click();
  await board.locator('#visit-reported').fill('2026-11-06');
  await board.locator('#visit-reference').fill('Boletim interno de teste');
  await board.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(board.locator('#visit-board-month')).toHaveValue('2026-11');
  await expect(board).toContainText('Execução informada em 06/11/2026');
  await expect(board).toContainText('Reprogramada 1x');
  const revised = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(revised[0].history).toHaveLength(1);
  expect(revised[0].reportReference).toBe('Boletim interno de teste');

  await board.locator('#visit-board-month').fill('2026-10');
  await expect(board).toContainText('1 visita(s) reprogramada(s) para outro mês');
  await board.locator('#visit-board-month').fill('2026-11');
  await board.getByRole('button', { name: 'Exportar cópia JSON' }).click();
  await page.reload();
  await expect(board.locator('.visit-board-summary > div:nth-child(2) strong')).toHaveText('1');
  expect(await page.evaluate(() => localStorage.getItem('gop_tickets'))).toBe(beforeTickets);
});



for (const sample of [
  { width: 320, height: 812, theme: 'light' },
  { width: 390, height: 844, theme: 'light' },
  { width: 1440, height: 900, theme: 'dark' },
  { width: 3840, height: 2160, theme: 'light' }
]) {
  test(`E3: programação preenchida ${sample.width}px ${sample.theme}, acessibilidade e captura`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: sample.width, height: sample.height });
    await seed(page, sample.theme);
    await finance(page);
    const board = page.getByRole('region', { name: 'Planejamento por escola' });
    await board.getByRole('button', { name: 'Programar', exact: true }).click();
    await board.locator('#visit-school').selectOption('900001');
    await board.locator('#visit-planned').fill('2026-11-12');
    await board.getByRole('button', { name: 'Adicionar visita' }).click();
    await expect(board.getByText('Unidade de teste visual A')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const scan = await new AxeBuilder({ page }).include('.visit-board').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(scan.violations).toEqual([]);
    expect(await board.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const path = testInfo.outputPath(`programacao-preenchida-${sample.width}-${sample.theme}.png`);
    await board.screenshot({ path, animations: 'disabled' });
    await testInfo.attach('programacao-preenchida', { path, contentType: 'image/png' });
  });
}
