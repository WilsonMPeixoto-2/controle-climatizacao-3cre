const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function run() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Iniciando navegador Playwright para screenshots de auditoria...');
  const browser = await chromium.launch({ headless: true });

  // 1. DESKTOP VIEWPORT (1280x800)
  console.log('--- ETAPA 1: DESKTOP (1280x800) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await desktopContext.newPage();

  console.log('Navegando para o site local http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(2000); // tempo para Leaflet carregar e renderizar

  // 1.1. Modo Escuro (Padrão)
  console.log('Garantindo que o tema esteja no Modo Escuro...');
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark-theme'));
  if (!isDark) {
    await page.click('.theme-toggle-header');
    await page.waitForTimeout(500);
  }

  // Dashboard
  console.log('Capturando: Desktop - Modo Escuro - Dashboard...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-01-dashboard.png') });

  // Mapa (o mapa está no dashboard, podemos rolar um pouco se necessário, mas no viewport de 800px ele deve estar visível)
  console.log('Capturando: Desktop - Modo Escuro - Mapa...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-02-map.png') });

  // Lista de chamados
  console.log('Navegando para Lista de chamados...');
  await page.click('button[aria-label="Lista de chamados"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Escuro - Lista...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-03-lista.png') });

  // Modal / ficha de edição
  console.log('Abrindo modal de edição de chamado...');
  const tableRow = page.locator('.lists-table tbody tr').first();
  if (await tableRow.count() > 0) {
    await tableRow.click();
    await page.waitForTimeout(800); // transição do modal
    console.log('Capturando: Desktop - Modo Escuro - Modal...');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-05-modal.png') });
    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('AVISO: Nenhuma linha de tabela encontrada para abrir o modal.');
  }

  // Registro de chamado
  console.log('Navegando para Registrar chamado...');
  await page.click('button[aria-label="Registrar chamado"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Escuro - Registro...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-04-registro.png') });

  // Dossiê da escola
  console.log('Navegando para Consulta por Escola...');
  await page.click('button[aria-label="Consulta por Escola"]');
  await page.waitForTimeout(800);
  console.log('Preenchendo busca da escola para carregar dossiê...');
  const searchInput = page.locator('input[placeholder="Nome ou designação..."]');
  if (await searchInput.count() > 0) {
    await searchInput.fill('Chanceler Willy Brandt');
    const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await suggestionItem.waitFor({ state: 'visible' });
    await suggestionItem.click();
    await page.waitForTimeout(1500); // transição do círculo e dados da escola
  }
  console.log('Capturando: Desktop - Modo Escuro - Dossiê...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-06-dossie.png') });

  // Comunicações
  console.log('Navegando para Comunicações...');
  await page.click('button[aria-label="Comunicações"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Escuro - Comunicações...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dark-07-comunicacoes.png') });


  // 1.2. Modo Claro
  console.log('--- Alternando para Modo Claro ---');
  await page.click('.theme-toggle-header');
  await page.waitForTimeout(800);

  // Dashboard
  console.log('Navegando para Dashboard...');
  await page.click('button[aria-label="Painel Executivo"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Claro - Dashboard...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-light-01-dashboard.png') });

  // Lista
  console.log('Navegando para Lista...');
  await page.click('button[aria-label="Lista de chamados"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Claro - Lista...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-light-02-lista.png') });

  // Registro
  console.log('Navegando para Registro...');
  await page.click('button[aria-label="Registrar chamado"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Claro - Registro...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-light-03-registro.png') });

  // Dossiê
  console.log('Navegando para Consulta por Escola...');
  await page.click('button[aria-label="Consulta por Escola"]');
  await page.waitForTimeout(800);
  // Recarregar a escola
  const searchInputLight = page.locator('input[placeholder="Nome ou designação..."]');
  if (await searchInputLight.count() > 0) {
    await searchInputLight.fill('Chanceler Willy Brandt');
    const suggestionItem = page.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await suggestionItem.waitFor({ state: 'visible' });
    await suggestionItem.click();
    await page.waitForTimeout(1200);
  }
  console.log('Capturando: Desktop - Modo Claro - Dossiê...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-light-04-dossie.png') });

  // Comunicações
  console.log('Navegando para Comunicações...');
  await page.click('button[aria-label="Comunicações"]');
  await page.waitForTimeout(800);
  console.log('Capturando: Desktop - Modo Claro - Comunicações...');
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-light-05-comunicacoes.png') });

  await desktopContext.close();


  // 2. MOBILE VIEWPORT (390x844)
  console.log('--- ETAPA 2: MOBILE (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const mPage = await mobileContext.newPage();

  console.log('Navegando no mobile...');
  await mPage.goto('http://127.0.0.1:5173/');
  await mPage.waitForTimeout(2000);

  // 2.1. Mobile Dark
  console.log('Garantindo Modo Escuro no Mobile...');
  const isDarkM = await mPage.evaluate(() => document.documentElement.classList.contains('dark-theme'));
  if (!isDarkM) {
    await mPage.click('.theme-toggle-header');
    await mPage.waitForTimeout(800);
  }

  // Dashboard
  console.log('Capturando: Mobile - Modo Escuro - Dashboard...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-dark-01-dashboard.png') });

  // Lista
  console.log('Navegando para Lista de chamados...');
  await mPage.click('button[aria-label="Lista de chamados"]');
  await mPage.waitForTimeout(800);
  console.log('Capturando: Mobile - Modo Escuro - Lista...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-dark-02-lista.png') });

  // Modal (abrir ficha no mobile)
  console.log('Abrindo modal no mobile...');
  const mTableRow = mPage.locator('.lists-table tbody tr').first();
  if (await mTableRow.count() > 0) {
    await mTableRow.click();
    await mPage.waitForTimeout(800);
    console.log('Capturando: Mobile - Modo Escuro - Modal...');
    await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-dark-04-modal.png') });
    // Fechar modal
    await mPage.keyboard.press('Escape');
    await mPage.waitForTimeout(500);
  } else {
    console.log('AVISO: Nenhuma linha de tabela encontrada para abrir o modal no mobile.');
  }

  // Registro
  console.log('Navegando para Registrar chamado...');
  await mPage.click('button[aria-label="Registrar chamado"]');
  await mPage.waitForTimeout(800);
  console.log('Capturando: Mobile - Modo Escuro - Registro...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-dark-03-registro.png') });

  // Comunicações
  console.log('Navegando para Comunicações...');
  await mPage.click('button[aria-label="Comunicações"]');
  await mPage.waitForTimeout(800);
  console.log('Capturando: Mobile - Modo Escuro - Comunicações...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-dark-05-comunicacoes.png') });


  // 2.2. Mobile Light
  console.log('--- Alternando para Modo Claro no Mobile ---');
  await mPage.click('.theme-toggle-header');
  await mPage.waitForTimeout(800);

  // Dashboard
  console.log('Navegando para Dashboard...');
  await mPage.click('button[aria-label="Painel Executivo"]');
  await mPage.waitForTimeout(800);
  console.log('Capturando: Mobile - Modo Claro - Dashboard...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-light-01-dashboard.png') });

  // Lista
  console.log('Navegando para Lista...');
  await mPage.click('button[aria-label="Lista de chamados"]');
  await mPage.waitForTimeout(800);
  console.log('Capturando: Mobile - Modo Claro - Lista...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-light-02-lista.png') });

  // Dossiê
  console.log('Navegando para Consulta por Escola...');
  await mPage.click('button[aria-label="Consulta por Escola"]');
  await mPage.waitForTimeout(800);
  const mSearchInput = mPage.locator('input[placeholder="Nome ou designação..."]');
  if (await mSearchInput.count() > 0) {
    await mSearchInput.fill('Chanceler Willy Brandt');
    const mSuggestionItem = mPage.locator('.suggestion-item', { hasText: 'Chanceler Willy Brandt' });
    await mSuggestionItem.waitFor({ state: 'visible' });
    await mSuggestionItem.click();
    await mPage.waitForTimeout(1200);
  }
  console.log('Capturando: Mobile - Modo Claro - Dossiê...');
  await mPage.screenshot({ path: path.join(screenshotsDir, 'mobile-light-03-dossie.png') });

  await mobileContext.close();
  await browser.close();
  console.log('Todos os screenshots de auditoria foram gerados com sucesso!');
}

run().catch(err => {
  console.error('Erro na geração dos screenshots:', err);
  process.exit(1);
});
