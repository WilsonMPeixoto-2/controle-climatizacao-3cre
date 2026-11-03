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
  // Fixtures de terceiros: estes testes verificam os fluxos financeiros e a navegação,
  // não a disponibilidade do analytics ou das imagens externas do mapa.
  // O código do Leaflet e seus eventos continuam reais; erros do aplicativo seguem verificados.
  await page.context().route('https://va.vercel-scripts.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.context().route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  }));
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

test('base histórica setembro/outubro preserva a origem e mantém agregações visuais acessíveis', async ({ page }, testInfo) => {
  await seed(page);
  await finance(page);
  const history = page.getByRole('region', { name: 'Histórico de corretivas de setembro e outubro' });
  await expect(history).toBeVisible();
  await expect(history.getByRole('group', { name: 'Selecionar mês dos registros históricos' })).toBeVisible();
  await expect(history.getByText('85', { exact: true })).toBeVisible();
  await expect(history.getByText('25', { exact: true })).toBeVisible();
  await expect(history.locator('.historic-note')).toContainText('SETEMBRO.xlsx');

  const october = history.getByRole('button', { name: /^Filtrar outubro de 2026/ });
  const september = history.getByRole('button', { name: /^Filtrar setembro de 2026/ });
  await expect(october).toHaveAttribute('aria-pressed', 'false');
  await october.click();
  await expect(october).toHaveAttribute('aria-pressed', 'true');
  await expect(history).toContainText('44 linhas · 14 escolas');
  const ce = history.locator('.historic-school').filter({ hasText: 'EM Ceará' });
  await ce.locator('summary').click();
  await expect(ce).toContainText('10 linha(s)');
  await expect(ce).toContainText('linhas 56, 57, 58');
  await expect(ce).toContainText('2 designação(ões) recuperada(s)');

  await september.click();
  await expect(history).toContainText('41 linhas');
  await expect(september).toHaveAttribute('aria-pressed', 'true');
  await history.getByRole('button', { name: 'Mostrar os dois meses' }).click();
  await expect(history).toContainText('85 linhas');

  for (const viewport of [
    { width: 320, height: 800 }, { width: 1440, height: 900 }, { width: 3840, height: 2160 }
  ]) {
    await page.setViewportSize(viewport);
    const path = testInfo.outputPath('historico-corretivas-' + viewport.width + '-claro.png');
    await history.screenshot({ path, animations: 'disabled' });
    await testInfo.attach('histórico real ' + viewport.width + 'px claro, fonte SETEMBRO.xlsx', { path, contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.evaluate(() => localStorage.setItem('gop_theme', 'dark'));
  await page.reload();
  await finance(page);
  const dark = page.getByRole('region', { name: 'Histórico de corretivas de setembro e outubro' });
  for (const viewport of [
    { width: 320, height: 800 }, { width: 1440, height: 900 }, { width: 3840, height: 2160 }
  ]) {
    await page.setViewportSize(viewport);
    const path = testInfo.outputPath('historico-corretivas-' + viewport.width + '-escuro.png');
    await dark.screenshot({ path, animations: 'disabled' });
    await testInfo.attach('histórico real ' + viewport.width + 'px escuro, fonte SETEMBRO.xlsx', { path, contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('financeiro usa recorte real, preserva ausências e retorna à ficha existente', async ({ page }) => {
  await seed(page);
  const original = await page.evaluate(() => localStorage.getItem('gop_tickets'));
  await finance(page);
  await expect(page).toHaveTitle(/Gestão Financeira/);
  await expect(nav(page, 'Gestão Financeira')).toHaveCount(1);
  await expect(page.locator('.finance-missing')).toHaveText(Array(3).fill('Não informado'));
  await expect(page.getByRole('region', { name: 'Previsão mensal por competência' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Limpar mês' }).click();
  await page.getByRole('button', { name: 'Limpar escola' }).click();
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
      // A nova comparação de meses é navegável antes do formulário de programação;
      // não se deve fixar a ordem antiga de foco após acrescentar controles legítimos.
      await expect(page.getByRole('region', {
        name: 'Histórico de corretivas de setembro e outubro'
      }).getByRole('button', { name: /^Filtrar setembro de 2026/ })).toBeFocused();
      // O mês da visita e a ação principal continuam alcançáveis pelo teclado.
      await page.locator('#visit-board-month').focus();
      await expect(page.locator('#visit-board-month')).toBeFocused();
      await page.getByRole('button', { name: 'Programar visita', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('form', { name: 'Adicionar programação' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.getByLabel('Mês de abertura dos chamados').fill('2030-01');
      await page.getByRole('button', { name: 'Limpar mês' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByLabel('4 solicitações no recorte')).toBeVisible();
      // O axe deve medir os tokens finais, não a opacidade intermediária de cardFadeUp.
      await page.locator('.finance-page').evaluate(async element => {
        await document.fonts.ready;
        let running;
        do {
          running = element.getAnimations({ subtree: true }).filter(animation =>
            animation.playState === 'running' && animation.effect.getTiming().iterations !== Infinity);
          await Promise.all(running.map(animation => animation.finished.catch(error => {
            // Foco/layout podem substituir uma transição. Aguarde a substituta
            // antes de medir contraste; cancelamento não é erro da aplicação.
            if (error.name !== 'AbortError') throw error;
          })));
        } while (running.length);
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
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
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

  // A escola consultada reaproveita a programação do mesmo navegador.
  await board.getByRole('button', { name: 'Abrir dossiê de Unidade de teste visual A' }).click();
  const schoolSummary = page.getByRole('region', { name: 'Contexto financeiro da escola' });
  await expect(schoolSummary).toContainText('1 visita programada');
  await expect(schoolSummary).toContainText('Rascunho somente neste dispositivo');
  await schoolSummary.getByRole('button', { name: 'Consultar Gestão Financeira' }).click();
  await expect(board).toContainText('Execução informada em 06/11/2026');

  await board.locator('#visit-board-month').fill('2026-10');
  await expect(board).toContainText('1 visita(s) reprogramada(s) para outro mês');
  await board.locator('#visit-board-month').fill('2026-11');
  await board.getByRole('button', { name: 'Baixar cópia de segurança' }).click();
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
    await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
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


test('E3: filtro da escola é aplicado aos totais, às visitas e aos resultados de execução', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.locator('#visit-board-month').fill('2026-10');
  for (const schoolId of ['900001', '900002']) {
    await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
    await board.locator('#visit-school').selectOption(schoolId);
    await board.locator('#visit-planned').fill('2026-10-12');
    await board.getByRole('button', { name: 'Adicionar visita' }).click();
  }
  await expect(board.locator('.visit-board-row')).toHaveCount(2);
  await page.locator('#finance-school').selectOption('900001');
  await expect(board.locator('.visit-board-row')).toHaveCount(1);
  await expect(board.locator('.visit-board-summary > div:nth-child(2) strong')).toHaveText('1');
  await expect(board).toContainText('Programação de Unidade de teste visual A');
  await expect(board.locator('.visit-board-row')).not.toContainText('Unidade de teste visual B');
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await expect(board.locator('#visit-school')).toHaveValue('900001');
  await board.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.locator('#finance-school').selectOption('900002');
  await expect(board.locator('.visit-board-row')).toHaveCount(1);
  await expect(board.locator('.visit-board-row')).toContainText('Unidade de teste visual B');
});

test('E3: alterações em outra aba não podem sobrescrever silenciosamente o rascunho', async ({ page, context }) => {
  await seed(page);
  await finance(page);
  const second = await context.newPage();
  try {
    await second.goto('/');
    await finance(second);
    const a = page.getByRole('region', { name: 'Planejamento por escola' });
    const b = second.getByRole('region', { name: 'Planejamento por escola' });
    await a.getByRole('button', { name: 'Programar visita', exact: true }).click();
    await a.locator('#visit-school').selectOption('900001');
    await a.locator('#visit-planned').fill('2026-10-12');
    await a.getByRole('button', { name: 'Adicionar visita' }).click();
    await expect(b).toContainText('outra aba');
    await b.getByRole('button', { name: 'Programar visita', exact: true }).click();
    await b.locator('#visit-school').selectOption('900002');
    await b.locator('#visit-planned').fill('2026-10-14');
    await b.getByRole('button', { name: 'Adicionar visita' }).click();
    await expect(b).toContainText('Sua edição continua aqui');
    expect(await second.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')))).toHaveLength(1);
    second.once('dialog', dialog => dialog.accept());
    await b.getByRole('button', { name: 'Recarregar programação local' }).click();
    await expect(b).toContainText('Programação recarregada');
    await b.getByRole('button', { name: 'Programar visita', exact: true }).click();
    await b.locator('#visit-school').selectOption('900002');
    await b.locator('#visit-planned').fill('2026-10-14');
    await b.getByRole('button', { name: 'Adicionar visita' }).click();
    await expect.poll(() => second.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')).length)).toBe(2);
  } finally { await second.close(); }
});

test('E3: cópia de segurança válida pode ser restaurada com consentimento; formato inválido é rejeitado', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await board.locator('#visit-school').selectOption('900001');
  await board.locator('#visit-planned').fill('2026-10-12');
  await board.getByRole('button', { name: 'Adicionar visita' }).click();
  await expect(board.getByRole('status')).toContainText('Visita incluída');
  await expect(board.locator('.visit-board-row')).toHaveCount(1);
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(draft).toHaveLength(1);
  page.once('dialog', dialog => dialog.accept());
  await board.getByRole('button', { name: 'Excluir rascunho da visita de Unidade de teste visual A' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')).length)).toBe(0);
  await board.locator('.visit-board-file-input').setInputFiles({
    name: 'invalido.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"outro","rows":[]}')
  });
  await expect(board.getByRole('alert')).toContainText('não é uma cópia');
  page.once('dialog', dialog => dialog.accept());
  await board.locator('.visit-board-file-input').setInputFiles({
    name: 'programacao.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: draft }))
  });
  await expect(board).toContainText('Cópia restaurada');
  await expect(board.locator('.visit-board-row')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')))).toHaveLength(1);
  await expect(board.getByRole('button', { name: 'Recuperar versão anterior' })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await board.getByRole('button', { name: 'Recuperar versão anterior' }).click();
  await expect(board.locator('.visit-board-row')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')).length)).toBe(0);
});

test('E3: gráfico destaca exclusivamente a soma das barras e identifica registros sem data', async ({ page }) => {
  await seed(page);
  await finance(page);
  const chart = page.locator('.finance-trend');
  await expect(chart.locator('.finance-trend-total')).toContainText('3');
  await expect(chart.locator('.finance-trend-caption')).toContainText('1 sem data, fora do gráfico');
  const bars = await chart.locator('.finance-trend-number').allTextContents();
  expect(bars.map(Number).reduce((sum, count) => sum + count, 0)).toBe(3);
});

test('E3: execução informada diretamente pela visita e contada no mês real', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.locator('#visit-board-month').fill('2026-10');
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await board.locator('#visit-school').selectOption('900001');
  await board.locator('#visit-planned').fill('2026-10-12');
  await board.getByRole('button', { name: 'Adicionar visita' }).click();
  await board.getByRole('button', { name: /Informar execução da visita de Unidade de teste visual A/ }).click();
  await expect(board.locator('#visit-reported')).toBeVisible();
  await expect(board.locator('#visit-reported')).toBeFocused();
  await board.locator('#visit-reported').fill('2026-11-05');
  await board.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(board.getByRole('status')).toContainText('Programação atualizada');
  await expect(board.locator('.visit-board-summary > div:nth-child(3) strong')).toHaveText('0');
  await board.locator('#visit-board-month').fill('2026-11');
  await expect(board.locator('.visit-board-summary > div:nth-child(3) strong')).toHaveText('1');
  await expect(board.getByRole('region', { name: 'Execuções informadas neste mês com programação em outra competência' })).toContainText('05/11/2026');
  await board.getByRole('button', { name: 'Abrir programação' }).click();
  await expect(board.locator('#visit-board-month')).toHaveValue('2026-10');
});

test('E3: escola e mês de abertura pertencem a filtros independentes', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.locator('#visit-board-month').fill('2026-10');
  await page.getByLabel('Mês de abertura dos chamados').fill('2026-09');
  await expect(board.locator('#visit-board-month')).toHaveValue('2026-10');
  await expect(page.getByText('Este filtro controla somente os chamados')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar mês' }).click();
  await expect(board.locator('#visit-board-month')).toHaveValue('2026-10');
});


test('E3: salvar com Web Lock pendente preserva o mês escolhido após o clique', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  const month = board.locator('#visit-board-month');
  await month.fill('2026-10');
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await board.locator('#visit-school').selectOption('900001');
  await board.locator('#visit-planned').fill('2026-10-12');
  await board.getByRole('button', { name: 'Adicionar visita' }).click();
  await expect(board.getByRole('status')).toContainText('Visita incluída');
  await board.getByRole('button', { name: /Informar execução da visita de Unidade de teste visual A/ }).click();
  await board.locator('#visit-reported').fill('2026-11-05');

  // Segura a trava da mesma origem para simular uma persistência de duração variável.
  await page.evaluate(() => new Promise(resolve => {
    navigator.locks.request('gop-clima-visit-drafts-v1', () => new Promise(unlock => {
      window.__releaseVisitLockForTest = unlock;
      resolve();
    }));
  }));
  try {
    await board.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(board.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    await month.fill('2026-11');
    await expect(month).toHaveValue('2026-11');
  } finally {
    await page.evaluate(() => window.__releaseVisitLockForTest?.());
  }
  await expect(board.getByRole('status')).toContainText('Programação atualizada');
  await expect(month).toHaveValue('2026-11');
  await expect(board.locator('.visit-board-summary > div:nth-child(3) strong')).toHaveText('1');
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(rows).toHaveLength(1);
  expect(rows[0].reportedDate).toBe('2026-11-05');
  expect(rows[0].plannedDate).toBe('2026-10-12');
});

async function holdVisitLock(page) {
  await page.evaluate(() => new Promise(resolve => {
    navigator.locks.request('gop-clima-visit-drafts-v1', () => new Promise(unlock => {
      window.__releaseVisitLockForTest = unlock;
      resolve();
    }));
  }));
}

async function addPlannedVisit(page, schoolId, plannedDate) {
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  await board.locator('#visit-school').selectOption(schoolId);
  await board.locator('#visit-planned').fill(plannedDate);
  await board.getByRole('button', { name: 'Adicionar visita', exact: true }).click();
  await expect(board.getByRole('form')).toHaveCount(0);
}

test('E3 regressão: restauração pendente bloqueia edições e preserva o mês escolhido', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await addPlannedVisit(page, '900001', '2026-11-12');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  const backup = rows => ({
    name: 'programacao.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows }))
  });
  // Uma restauração concluída disponibiliza também a ação de recuperação.
  page.once('dialog', dialog => dialog.accept());
  await board.locator('.visit-board-file-input').setInputFiles(backup(saved));
  await expect(board.getByRole('status')).toContainText('Cópia restaurada');
  await expect(board.getByRole('button', { name: 'Recuperar versão anterior' })).toBeVisible();
  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.getByText('Informações complementares').click();
  await board.locator('#visit-note').fill('Edição anterior à confirmação de restaurar.');

  await holdVisitLock(page);
  try {
    page.once('dialog', dialog => dialog.accept());
    await board.locator('.visit-board-file-input').setInputFiles(backup([
      { ...saved[0], plannedDate: '2026-12-10' }
    ]));
    await expect.poll(() => page.evaluate(async () =>
      (await navigator.locks.query()).pending.length
    )).toBe(1);
    for (const name of [
      'Programar visita', 'Editar visita de Unidade de teste visual A',
      'Informar execução da visita de Unidade de teste visual A',
      'Excluir rascunho da visita de Unidade de teste visual A',
      'Restaurar cópia', 'Recuperar versão anterior', 'Cancelar', 'Fechar edição'
    ]) {
      await expect(board.getByRole('button', { name, exact: true })).toBeDisabled();
    }
    await expect(board.locator('#visit-school')).toBeDisabled();
    await expect(board.locator('#visit-planned')).toBeDisabled();
    await expect(board.locator('#visit-note')).toBeDisabled();
    await expect(board.locator('button[type="submit"]')).toBeDisabled();
    await board.locator('#visit-board-month').fill('2026-10');
  } finally {
    await page.evaluate(() => window.__releaseVisitLockForTest?.());
  }
  await expect(board.getByRole('form')).toHaveCount(0);
  await expect(board.getByRole('status')).toContainText('Cópia restaurada');
  await expect(board.locator('#visit-board-month')).toHaveValue('2026-10');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(restored).toHaveLength(1);
  expect(restored[0].plannedDate).toBe('2026-12-10');
});

test('E3 regressão: voltar durante gravação pendente recebe o novo snapshot sem falso conflito', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await addPlannedVisit(page, '900001', '2026-10-12');
  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.locator('#visit-planned').fill('2026-10-20');
  await holdVisitLock(page);
  try {
    await board.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await expect(board.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled();
    await nav(page, 'Lista de chamados').click();
    await finance(page);
    await board.locator('#visit-board-month').fill('2026-10');
    await expect(board.locator('.visit-board-date strong')).toHaveText('12');
  } finally {
    await page.evaluate(() => window.__releaseVisitLockForTest?.());
  }
  await expect(board.locator('.visit-board-date strong')).toHaveText('20');
  await expect(board.getByRole('alert')).toHaveCount(0);
  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.locator('#visit-planned').fill('2026-10-21');
  await board.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(board.getByRole('form')).toHaveCount(0);
  await expect(board.locator('.visit-board-date strong')).toHaveText('21');
  await expect(board.getByRole('alert')).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(saved).toHaveLength(1);
  expect(saved[0].plannedDate).toBe('2026-10-21');
});

test('E3 regressão: novo snapshot preserva formulário aberto após voltar à programação', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await addPlannedVisit(page, '900001', '2026-10-12');
  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.locator('#visit-planned').fill('2026-10-20');
  await holdVisitLock(page);
  try {
    await board.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await expect(board.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled();
    await nav(page, 'Lista de chamados').click();
    await finance(page);
    await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
    await board.locator('#visit-school').selectOption('900002');
    await board.locator('#visit-planned').fill('2026-10-25');
    await board.getByText('Informações complementares').click();
    await board.locator('#visit-note').fill('Preservar esta edição não salva.');
  } finally {
    await page.evaluate(() => window.__releaseVisitLockForTest?.());
  }
  await expect(board.getByRole('alert')).toBeVisible();
  await expect(board.getByRole('button', { name: 'Recarregar programação local' })).toBeVisible();
  await expect(board.getByRole('form', { name: 'Adicionar programação' })).toBeVisible();
  await expect(board.locator('#visit-school')).toHaveValue('900002');
  await expect(board.locator('#visit-planned')).toHaveValue('2026-10-25');
  await expect(board.locator('#visit-note')).toHaveValue('Preservar esta edição não salva.');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gop_clima_programacao_rascunho_v1')));
  expect(saved).toHaveLength(1);
  expect(saved[0].plannedDate).toBe('2026-10-20');
});

test('E3 regressão: cópia com histórico inválido é rejeitada sem alterar a programação', async ({ page }) => {
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await addPlannedVisit(page, '900001', '2026-11-12');
  const previousRaw = await page.evaluate(() => localStorage.getItem('gop_clima_programacao_rascunho_v1'));
  const malformed = JSON.parse(previousRaw).map(row => ({ ...row, history: [null] }));
  // Caso uma regressão aceite o arquivo, o diálogo não pode bloquear o teste.
  page.once('dialog', dialog => dialog.accept());
  await board.locator('.visit-board-file-input').setInputFiles({
    name: 'historico-invalido.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: malformed }))
  });
  await expect(board.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gop_clima_programacao_rascunho_v1'))).toBe(previousRaw);
  await board.locator('#visit-board-month').fill('2026-10');
  await expect(board).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ocorreu um erro inesperado' })).toHaveCount(0);
});

test('E3 regressão: dossiê aberto durante gravação recebe atualização sem recarregar', async ({ page }) => {
  await seed(page);
  const original = await page.evaluate(() => [localStorage.getItem('gop_schools'), localStorage.getItem('gop_tickets')]);
  await finance(page);
  await addPlannedVisit(page, '900001', '2026-11-12');
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  await board.getByRole('button', { name: 'Editar visita de Unidade de teste visual A' }).click();
  await board.locator('#visit-planned').fill('2026-11-20');
  const summary = page.getByRole('region', { name: 'Contexto financeiro da escola' });
  await holdVisitLock(page);
  try {
    await board.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await expect(board.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled();
    await chooseSchool(page);
    await expect(summary).toContainText('12/11/2026');
  } finally {
    await page.evaluate(() => window.__releaseVisitLockForTest?.());
  }
  await expect(summary).toContainText('20/11/2026');
  await expect(summary).not.toContainText('12/11/2026');
  expect(await page.evaluate(() => [localStorage.getItem('gop_schools'), localStorage.getItem('gop_tickets')])).toEqual(original);
});

test('legibilidade: instruções principais e campos da programação têm tamanho confortável', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await finance(page);
  const board = page.getByRole('region', { name: 'Planejamento por escola' });
  const instruction = board.getByText('Organize visitas, reprogramações e informações de execução.');
  expect(await instruction.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await board.getByRole('button', { name: 'Programar visita', exact: true }).click();
  const schoolField = board.getByLabel('Unidade escolar', { exact: true });
  expect(await schoolField.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  expect(await board.locator('label[for="visit-school"]').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
});

test('identidade tipográfica: ações da programação usam a fonte institucional', async ({ page }) => {
  await seed(page);
  await finance(page);
  const action = page.getByRole('button', { name: 'Programar visita', exact: true });
  expect(await action.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
  const backup = page.getByRole('button', { name: 'Restaurar cópia', exact: true });
  expect(await backup.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
});

test('resumo em tablet distribui os três indicadores sem coluna vazia', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await seed(page);
  await finance(page);
  const summary = page.locator('.visit-board-summary');
  const row = await summary.boundingBox();
  const lastMetric = await summary.locator(':scope > div').nth(2).boundingBox();
  expect(row.x + row.width - lastMetric.x - lastMetric.width).toBeLessThan(32);
});

test('nomes longos de escolas mantêm leitura confortável em notebook', async ({ page }) => {
  await page.setViewportSize({ width: 1251, height: 1000 });
  const longName = 'Escola Municipal de Demonstração Professora Maria da Conceição de Albuquerque';
  const data = { schools: [{ ...schools[0], unidade_escolar: longName }], tickets: [{ ...tickets[0], unidade_escolar: longName }] };
  await seed(page, 'light', data);
  await finance(page);
  const name = page.locator('.school-review-details').getByText(longName, { exact: true });
  const bounds = await name.boundingBox();
  expect(bounds.height).toBeLessThan(150);
});
