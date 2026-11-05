# GOP Clima — plano de conclusão funcional (base 04/11/2026)

**Orientação executiva e técnica para o próximo desenvolvimento.** Não é um novo protótipo, não recria planilhas ou CMMS e não reabre as decisões DP-001 a DP-004. Plano elaborado a partir do código da `master`, dos testes/produção, da [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md), da [concepção original](../concepcao/documento-integral-v1.0/README.md), dos [quatro módulos Excel](../concepcao/documento-integral-v1.0/02-texto-original.md) e das demandas posteriores de gestão contratual.

## Ponto de partida: o que **já** pode ser reutilizado

- Backend operacional `gestao-da-climatizacao-3-cre`: escolas, chamados, históricos, ID oficial, realtime e dossiê. **Não migrar** para novo Firebase, Supabase ou Vercel.
- Atendimento econômico `atendimentos_economicos` com revisão/histórico, vínculos `ticketIds`, grupos, valor com 4 decimais e referência/versão; Firestore compartilhado.
- Catálogo CRE03 em `src/domain/cre03TrCatalog.js` e `src/data/cre03SignedPriceSchedule.js`: faixas e preços unitários P01–P11 recuperados. Ex.: Split até 12.000 BTU = **R$ 239,7350** por manutenção; quatro ciclos só na memória contratual agregada, **não** multiplicação automática no atendimento.
- `src/domain/monthlyForecast.js`, `FinancialOverviewPage.jsx`, `AttendanceEstimates.jsx`, `MonthlyForecast.jsx`: leitura por competência, dois painéis, filtros e passagem da escola/chamado à composição.
- `VisitPlanningBoard.jsx` e `schoolVisitPlan.js`: útil para iniciar programação, mas **somente local**. `HistoricCorrectionsPanel`: registros estáticos de set/out/2026, **não** medição.
- Testes e2e/Firestore/CI e protocolo [Engenharia Comprovada](../../../.agents/skills/diagnostico-entrega-verificada/SKILL.md).

## Matriz de conclusão (prioridades na ordem, uma entrega validada por PR)

| Ordem | Resultado de negócio | Estado de partida | Incremento objetivo | Aceite comprovável |
|---|---|---|---|---|
| **P0** | Base confiável | Deploy `READY`, preço testado na UI; gravação cloud de referência precificada ainda não retestada na release | Exercitar fluxo sintético remoto **chamado → estimativa → salvar → outra sessão → editar/recarregar**; documentar disparo, registros e descarte seguro | Referência P01–P11, `ticketIds`, quatro casas e versão persistidos; nenhuma mutação de chamado ou NF |
| **P1** | Planejamento compartilhado | Visitas apenas localStorage; 134 escolas no cadastro versus 136 designações e 3.061/3.253 equipamentos em fontes diferentes | Sincronizar programação de visitas no **Firestore existente**, com vínculo de escola, mês, ciclo, equipamento/grupo, situação e alterações; iniciar conciliação dos identificadores sem adicionar automaticamente escolas ou aparelhos ao contrato | Alteração de visita em um navegador aparece no outro, sem duplicar mês/ciclo; conflito e reprogramação testados |
| **P2** | Execução/medição informadas | Só há estimativa e chamado; não há medição aceita | Introduzir registro simples de **serviço informado/executado e medição conferida** com itens, quantidades executadas/aceitas, evidência externa, competência, responsável e decisões da fiscalização; manter referências à OES/relatórios externos | Orçado ≠ executado ≠ aceito; aceito nunca supera executado sem aviso fundamentado; revisões; cálculo por preço unitário e quantidade aceita; 2 sessões |
| **P3** | Corretivas e glosas rastreáveis | `serviceKind` e `coverage` consultivos, sem valor a faturar | Associar preventiva/corretiva a itens, decidir **cobertura incluída ou adicional** por registro da fiscalização, registrar glosa/IMR quando pertinente com motivo, valor e referência; reconciliação com medição | Chamado encerrado **não** produz cobrança; corretiva coberta não duplica preventiva; glosa só repercute quando informada/validada, sem IMR presumido |
| **P4** | Fluxo financeiro completo | NF, liquidação e pagamento ainda não possuem registros próprios | Criar **NF**, **retenções/glosas**, **liquidação informada**, **pagamentos parciais** e **empenhos/cotas** como eventos distinguíveis; vínculos com medições e competência; discriminar data do serviço, emissão, liquidação e pagamento | Uma medição pode gerar NFs parciais; NF pode receber vários pagamentos; `valor líquido = valor bruto - glosas/deduções cabíveis - retenções`; prevenir dupla contabilização; nenhum sistema contábil é simulado |
| **P5** | Visão gerencial útil | Gráficos de **estimativas**, não de caixa/faturamento | Conectar as duas abas já existentes a **Previsto × Executado/Aceito × Faturado × Liquidado × Pago**, com filtros por escola/competência e links às origens; diferenciar teto, saldo empenhado e liquidez | Valores reconciliáveis por competência e por pagamento; totais de grupos/meses/escolas sem dupla contagem; `não informado` ≠ 0 |
| **P6** | Entrega institucional | Acesso sem login por DP-004 | Antes de liberar uso a servidores: identidade, perfis, regras Firestore de autorização, autoria verificável, governança de dados, instruções curtas e testes de permissão/retorno | Acesso negado a papel indevido; trilha auditável; instrução de operação; aceite por gestor/fiscal e smoke de produção |

### P0 — prioridade imediata, antes de ampliar o esquema

**Teste end-to-end remoto** com registro *sintético* em ambiente autorizado, isolado e identificado:
1. Abrir chamado sintético ou selecionar contexto de fixture sem modificar chamado real; iniciar atendimento financeiro.
2. Preencher Split 12.000 BTU e quantidade 2; conferir valor nominal **R$ 479,4700**, sem multiplicador de ciclo e sem acréscimo não confirmado.
3. Salvar e verificar no Firestore (não apenas no toast) o `ticketIds`, `schoolId`, `categoryCode=CRE03-32`, `unitPriceUnits4=2397350`, `sourceRef`, `referenceVersion` e revisão.
4. Reabrir em outra sessão, editar/reprogramar, verificar atualização e histórico sem perda de precisão; testar concorrência. Encerrar/neutralizar o dado sintético de acordo com a política existente de preservação de revisões.
5. Registrar deployment exato, commit, IDs sintéticos, resultados e limitações, sem credenciais ou dados reais.

**Não começar P2/P4 se P0 revelar falha de persistência ou de normalização.** Nenhuma passagem deve gerar NF, atesto ou medição por status do chamado.

### P1 — planejamento operacional que alimenta orçamento, sem retrabalho

- Preservar a interface de programação; trocar apenas persistência local por coleção/serviço compartilhado com revisão esperada e regras testadas.
- Unidade mínima de planejamento: `escola + competência + ciclo + equipamento/grupo + tipo serviço + situação`; vínculo opcional a chamados. Não tornar obrigatório inventário individual quando inexistente.
- Confrontar 134 escolas cadastradas, 136 designações levantadas, 3.061 equipamentos inicialmente contratados e 3.253 registros posteriores. Mostrar divergências e sua fonte; **não alterar unilateralmente o quantitativo contratado**.
- Programação mensal derivada do plano de ciclos e da capacidade real de atendimento. Não transformar cotas de desembolso em obrigação de pagar serviço ainda não medido.

### P2/P3 — fiscalização com autoria humana e separação da cobrança

- O site deve permitir registrar **resultado técnico e econômico informado**, sem declarar ter executado a fiscalização.
- A OES e o CMMS técnico da empresa, IMR e atesto podem continuar nos **instrumentos externos previstos**, com ID/link/data/evidência associados. **Não recriar a suíte técnica completa nesta fase**; se o responsável solicitar emissão documental eletrônica formal, isso exige especificação própria e validação das competências/assinaturas.
- A medição só contabiliza quantidade **aceita** respaldada, considerando preços por faixa, cobertura e limites; estado “concluído” de chamado não autoriza valor devido.
- Glosas, correções, revisões e justificativas rastreáveis; evitar regras automáticas não previstas no TR.

### P4/P5 — finanças sem misturar grandezas

Modelo mínimo conceitual (ajustável conforme a solução atual): `medicoes` (registros técnicos/valores aceitos), `notas_fiscais` (número, emitente, data, referência), `retencoes_glosas`, `liquidacoes_informadas`, `pagamentos` (data efetiva, valor, referência de OB), `empenhos` e `vinculos`. **Não criar essas coleções por antecipação**, nem armazenar valores replicados com fontes divergentes; começar pelo primeiro caso real e testar normalização/reconciliação.

- Competência de execução, mês de faturamento e data do pagamento são dimensões **separadas**; não confundir previsão com saída de caixa.
- Teto contratual de R$ 2.035.894,27 e cronograma informativo são referências de planejamento; saldo de empenho e disponibilidade financeira dependem de registros próprios.
- Retenções devem ter tipo, base, alíquota/valor e fonte, sem porcentagem presumida; liquidação não se confunde com pagamento.
- Painel com métricas acionáveis e acesso à composição, sem exibir tabelas imensas, códigos técnicos ou formulário duplicado na primeira camada.

## Governança transversal: não antecipar ações administrativas

1. Aplicar **DP-001**: o fiscal/gestor decide, informa, ajusta e formaliza; sistema organiza, calcula e alerta.
2. Aplicar **DP-002/003**: aproveitar telas/dados do GOP Clima e manter duas abas financeiras, dados reais, acessibilidade, 4K e mobile; não transplantar a interface Gemini V8.9.
3. Aplicar **DP-004**: seguir sem login **durante desenvolvimento** com fixtures adequadas; autenticação e autorização são barreira obrigatória antes de disponibilizar registros sensíveis a servidores.
4. Validar por PR **unitários → integração Firestore → E2E em duas sessões → build → inspeção real de interface**; em produção verificar URL, SHA, alias e escrita quando autorizada.
5. Antes de prometer “concluído”, apresentar tabela **objetivo → dados → teste → prova** e registrar o que ainda não existe. Não publicar dados financeiros pessoais ou institucionais reais para obter aprovação rápida.

## Critério de conclusão funcional

A Gestão Financeira estará **funcionalmente concluída** quando uma solicitação/visita conseguir originar atendimento e referência econômica; sua execução e medição forem informadas e relacionadas à escola/competência; valores aceitos e eventuais glosas alimentarem as NFs; liquidação e pagamentos informados atualizarem corretamente previsões e saldos; a tela permitir **reconciliar cada total até o registro de origem**; e o acesso institucional tiver controles adequados.

**Próximo PR de produto recomendado: P0 + preparação restrita de P1, não P2–P6 em bloco.** Priorizar um fluxo compartilhado completo e testado antes de multiplicar telas e modelos.
