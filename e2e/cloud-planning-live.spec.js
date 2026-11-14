import { test, expect } from '@playwright/test';

// Homologação CONTROLADA no projeto real: somente um código sintético da faixa
// 91xxxx–99xxxx; jamais altera escola, chamado, estimativa ou visita existente.
// A remoção lógica é realizada em finally, preservando o histórico de revisões.
const SITE = 'https://controle-climatizacao-3cre.vercel.app/';
const ORIGIN = new URL(SITE).origin;
const runId = Number(process.env.GITHUB_RUN_ID || 101);
const attempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1);
const schoolId = String(910000 + ((runId * 13 + attempt) % 89000));
const marker = 'TESTE SINTETICO GOP CLIMA - NAO E ESCOLA - RUN ' + String(runId) + '-' + String(attempt);

test.setTimeout(210000);
test('Cloud: planejamento em duas sessões e restauração da referência', async ({ browser }, testInfo) => {
  if (new URL(SITE).origin !== ORIGIN) throw new Error('URL de produção não autorizada.');

  const a = await browser.newContext({ viewport: {width:1280,height:900} });
  const b = await browser.newContext({ viewport: {width:390,height:844}, deviceScaleFactor:1 });
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  let created = false;
  let archived = false;
  let cleanupFailure = null;

  async function openFinance(page) {
    await page.addInitScript(() => sessionStorage.setItem('gop_current_tab','finance'));
    const response = await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:45000});
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading',{name:'Gestão Financeira',exact:true})).toBeVisible({timeout:45000});
    const button=page.getByRole('button',{name:'Ajustar planejamento',exact:true});
    await button.click();
    const panel=page.getByRole('region',{name:'Ajustar planejamento por escola'});
    await expect(panel.getByRole('button',{name:'Incluir escola'})).toBeEnabled({timeout:45000});
    await panel.getByPlaceholder('Nome ou código da escola').fill(schoolId);
    return panel;
  }

  let pA,pB;
  try {
    [pA,pB]=await Promise.all([openFinance(pageA),openFinance(pageB)]);
    // Registros do mundo real ou de outros testes não podem ser sobrescritos.
    await expect(pA.locator('.planning-editor-row')).toHaveCount(0,{timeout:15000});
    await expect(pB.locator('.planning-editor-row')).toHaveCount(0,{timeout:15000});

    await pA.getByRole('button',{name:'Incluir escola'}).click();
    const newForm=pA.getByRole('form',{name:'Incluir escola no planejamento'});
    await newForm.getByLabel('Código da escola').fill(schoolId);
    await newForm.getByLabel('Nome de identificação (opcional)').fill(marker);
    await newForm.getByLabel('Mês relativo do ciclo').selectOption('4');
    await newForm.getByLabel('Equipamentos previstos').fill('4');
    await newForm.getByLabel('Orçamento estimado (R$)').fill('10,2500');

    created=true; // garante tentativa de limpeza mesmo se o aviso de sucesso se perder
    await newForm.getByRole('button',{name:'Salvar ajustes'}).click();
    await expect(pA.getByText('Planejamento ajustado e salvo no Firestore.')).toBeVisible({timeout:35000});

    await expect(pB.locator('.planning-editor-row')).toContainText(marker,{timeout:35000});
    await expect(pB.locator('.planning-editor-row')).toContainText('4 aparelhos');
    await expect(pB.locator('.planning-editor-row')).toContainText('Mês 4');
    await pB.locator('.planning-editor-row').screenshot({
      path:testInfo.outputPath('planejamento-cloud-segunda-sessao.png')
    });

    // A segunda sessão edita o mesmo registro; a primeira recebe novo snapshot.
    await pB.getByRole('button',{name:'Editar planejamento da escola '+schoolId}).click();
    const editB=pB.getByRole('form',{name:'Editar planejamento da escola'});
    await editB.getByLabel('Mês relativo do ciclo').selectOption('5');
    await editB.getByLabel('Equipamentos previstos').fill('7');
    await editB.getByRole('button',{name:'Salvar ajustes'}).click();
    await expect(pA.locator('.planning-editor-row')).toContainText('7 aparelhos',{timeout:35000});
    await expect(pA.locator('.planning-editor-row')).toContainText('Mês 5');

    // Recarregar a página deve ler o estado do serviço, não apenas o estado React.
    await pageB.reload({waitUntil:'domcontentloaded'});
    const reopened=pageB.getByRole('button',{name:'Ajustar planejamento',exact:true});
    await reopened.click();
    pB=pageB.getByRole('region',{name:'Ajustar planejamento por escola'});
    await expect(pB.getByRole('button',{name:'Incluir escola'})).toBeEnabled({timeout:40000});
    await pB.getByPlaceholder('Nome ou código da escola').fill(schoolId);
    await expect(pB.locator('.planning-editor-row')).toContainText('7 aparelhos',{timeout:30000});
    await expect(pB.locator('.planning-editor-row')).toContainText('Mês 5');
    await testInfo.attach('cloud-live-verification.txt',{body:
      'PRODUCAO: '+ORIGIN+'\nSINTETICO: '+schoolId+'\nDUAS SESSOES: OK\nREVISAO VIA RELOAD: OK\n',
      contentType:'text/plain'});

  } finally {
    if (created && !archived) {
      // Não fazemos delete físico. Arquivo + revisões devem permanecer rastreáveis.
      try {
        let panel=pB;
        if(!panel || !(await panel.isVisible().catch(()=>false))) {
          await pageB.reload({waitUntil:'domcontentloaded'});
          await pageB.getByRole('button',{name:'Ajustar planejamento',exact:true}).click();
          panel=pageB.getByRole('region',{name:'Ajustar planejamento por escola'});
        }
        await expect(panel.getByRole('button',{name:'Incluir escola'})).toBeEnabled({timeout:35000});
        await panel.getByPlaceholder('Nome ou código da escola').fill(schoolId);
        const row=panel.locator('.planning-editor-row');
        if(await row.count() > 0) {
          await expect(row).toContainText(marker,{timeout:25000});
          pageB.once('dialog',dialog=>dialog.accept());
          await panel.getByRole('button',{name:'Restaurar referência da escola '+schoolId}).click();
          await expect(row).toHaveCount(0,{timeout:30000});
        }
        archived=true;
      } catch(cleanupError){
        console.error('FALHA DE LIMPEZA: registro sintético '+schoolId+' precisa ser arquivado. '+String(cleanupError));
        cleanupFailure = cleanupError;
      }
    }
    await Promise.allSettled([a.close(),b.close()]);
  }
  if (cleanupFailure) throw cleanupFailure;
  expect(archived).toBe(true);
  console.log('CLOUD GOP CLIMA PASS: duas sessões, persistência após recarga e arquivamento de registro sintético '+schoolId);
});
