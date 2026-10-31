# Inventário técnico do protótipo HTML V8.9 — avaliação de reaproveitamento

**Classificação:** análise de um artefato exploratório, **não homologado**.  
**Finalidade:** permitir a um próximo agente entender o que existiu, o que foi investigado e por que o código não foi disponibilizado como base de implementação.

## Fonte e identificação

Arquivo analisado: `painel-integrado-v9.html` (duplicado com outro nome no conjunto recebido).  
SHA-256: `46440f367184b1c161612aa925ebe9207948a8e6d47aee2e4c49aea450dd2f80`  
Dimensão: **174.303 bytes**, aproximadamente **1.706 linhas**.  
Tecnologia: HTML único com Tailwind via CDN, Chart.js e JavaScript embutido.  
Tipo de execução: protótipo independente em memória, não módulo integrado ao React/Firebase existente.

## Elementos efetivamente presentes

- Navegação por cinco seções designadas “mod0” a “mod4”, espelhando parcialmente a estrutura dos módulos Excel.
- Visões de polos e escolas, subinventário piloto, dados de chamados, itens de IMR e painel de indicadores financeiros.
- Variável `APP_DATA` embutida no HTML, com seis grupos de polos, 135 entradas no campo de escolas, 11 categorias, 16 subitens do guia IMR, 37 registros de subinventário e 85 registros de chamados.
- Objeto `CONTRACT_FINANCE_ENGINE` com regras e parâmetros internos, cálculo de preços e agregações.
- Estado local de filtros `biState`; renderização de gráficos e cartões; alternâncias de status no navegador.
- Composição demonstrativa de fatura, cálculo demonstrativo de saldos e botão de cópia de texto administrativo.

**Não foi demonstrado pelos arquivos:** uso de Firestore, autenticação, persistência multiusuário, registro de auditoria operacional, integração real ao site existente, emissão oficial de faturas ou publicação em produção.

## Inconsistências e riscos identificados no próprio arquivo

| ACHADO | EVIDÊNCIA EXAMINADA | CONSEQUÊNCIA PARA O REAPROVEITAMENTO |
|---|---|---|
| Duplicação e falha de importação de dados | 135 itens na lista de escolas, sendo 134 com código numérico e uma nota textual indevidamente importada. | A base não pode ser tratada como cadastro de referência validado. |
| Quantitativos divergentes | A soma do cadastro escolar é 3.080 equipamentos; a soma de `qtd_rede` nas categorias é 3.061. | Diferença de 19 equipamentos exige reconciliação antes de qualquer cálculo operacional. |
| Competências demonstrativas inconsistentes | Os 85 chamados incluem 41 datas de setembro/2026 e 44 de outubro/2026; a agregação financeira corretiva os trata como um bloco de setembro. | Não usar o cálculo para faturamento real; abertura do chamado também não comprova execução na competência. |
| Arredondamento inadequado | Existe `unit_calc` com mais precisão, mas `computeBiData()` usa `unitExib` para agregar valores. | O total pode divergir da memória contratual e do regime de arredondamento válido. |
| Inferências silenciosas | `getPoloForDesignacao()` devolve Polo 3 quando não encontra correspondência; o subinventário usa potência padrão de 24.000 BTUs em ausência de dado. | Um dado ausente vira dado falso; a solução futura deve indicar inconsistência ou bloquear estimativas sem base. |
| Estados operacionais confundidos com financeiros | Chamados “RESOLVIDO” entram na composição demonstrativa; pendências podem aparecer como glosa. | Resolver o chamado não equivale, por si, a atestar execução; não executado e glosa não são categorias intercambiáveis. |
| IMR presumido | A avaliação parte de pontuações pré-selecionadas sem evidências técnicas no registro. | O cálculo não pode ser reaproveitado como avaliação contratual definitiva. |
| Saldos simplificados | `saldoContrato` e `saldoEmpenho` são apurados subtraindo valores liquidados de referências fixas e utilizando `Math.max(0,...)`. | Perde distinções entre limite, empenho, medição, liquidação, pagamento e eventual extrapolação. |
| Retenções arbitrárias | Pagamento líquido simulado com `sumPago * 0.95`. | Percentual fixo não substitui apuração de retenções efetivamente aplicáveis. |
| Texto oficial indevido | Botão `btn-copy-sei-summary` produz texto iniciado com “DESPACHO DE LIQUIDAÇÃO” e declaração de atesto com números simulados. | Não reutilizar como despacho oficial ou prova de atestação. |
| Segurança e integridade | Renderização dinâmica por `innerHTML` de dados de origem operacional; ausência de controles de autorização/persistência. | Não transferir a estratégia para produção sem proteção, validação e modelo de permissões. |
| Escopo excessivo | Arquitetura baseada em módulos e visualizações documentais que reproduzem partes do Excel. | Contraria a restrição expressa de não fazer do site um Excel online. |

**Importante:** estes são achados relativos ao código e aos dados embutidos na demonstração. Não constituem, isoladamente, afirmações sobre a execução real do contrato. Valores financeiros e regras contratuais devem ser confrontados com as fontes formais antes de decisões de implementação.

## Material auxiliar descartado para a biblioteca

- `DESCRICAO_PR_ETAPA_2_FINANCEIRO_BI.md`: anunciava integração de caminhos como `src/domain/financeiroContrato59.js` e `src/components/FinancialBiDashboardPage.jsx`, mas a descrição, sozinha, não comprova sua presença ou implantação. As capacidades propostas foram preservadas conceitualmente na síntese.
- `aplicar_etapa2_financeiro_e_abrir_pr.py`: apresenta **SyntaxError na linha 67** ao fazer análise sintática; não deve ser arquivado como script utilizável.
- Segunda cópia do HTML: idêntica ao primeiro arquivo (mesmo SHA-256), portanto sem benefício de versionamento.
- HTML bruto: não publicado neste repositório **público** por conter registros operacionais incorporados e lógica financeira ainda não validada.

## Orientação para uso

**Pode inspirar:** padrões de interação, uso de filtros, integração visual entre informação operacional e financeira, indicadores pertinentes e exemplos de simplificação.

**Não pode fundamentar diretamente:** motor financeiro, preço unitário, enquadramento de intervenção, cálculos de medição, glosa, IMR, empenho, tributos, pagamento ou documentação oficial.

**Próximo passo admissível:** utilizar a Carta de Princípios e as referências como insumos para o **plano textual de concepção funcional do produto**, a ser discutido e aprovado antes de escrever código.
