# Prompt para o Codex — Inteligência financeira integrada, por etapas

## Instrução de execução

Você está trabalhando no repositório `WilsonMPeixoto-2/controle-climatizacao-3cre`.

Desenvolva a evolução financeira do GOP Clima por incrementos pequenos, úteis e verificáveis. O resultado esperado é uma ferramenta que relaciona dados, calcula referências, consolida previsões, apresenta análises e facilita o acompanhamento financeiro com poucas ações do servidor.

**Nesta execução, leia as referências obrigatórias, confira o estado real e implemente somente a Etapa 1 deste prompt.** As etapas 2–5 orientam a arquitetura e as próximas entregas; não execute todas em uma única rodada. **Conforme DP-004, autenticação individual é fase final e não deve ser implementada agora.** Se a Etapa 1 já estiver comprovadamente entregue, identifique a evidência e retome o primeiro incremento pendente, sem refazer o trabalho.

Preserve o avanço funcional e visual existente. Entregue código integrado à aplicação real e um PR de revisão. Não encerre com apenas um plano, componentes vazios, cálculo isolado sem conexão à tela ou um protótipo independente.

## DP-004 — decisão posterior e obrigatória sobre autenticação

**O responsável pelo produto decidiu expressamente adiar login, cadastro e autorização individual para a fase final anterior à entrega aos servidores. Esta decisão está formalizada em [DP-004 — Autenticação adiada durante o desenvolvimento](../decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md). Leia-a integralmente e aplique-a antes da Etapa 1.**

**Não interrompa ou desvie a execução para implementar autenticação.** A persistência compartilhada em ambiente de desenvolvimento, os cálculos, a interface e os testes entre sessões continuam obrigatórios, **sem exigir contas de usuários**. Regras temporárias de teste não deverão expor dados reais sensíveis publicamente nem ser promovidas para produção. A futura autenticação é um **portão de entrega institucional**, não um bloqueio de desenvolvimento. Esta decisão prevalece quanto ao cronograma de autenticação sobre exigências anteriores deste próprio prompt e do roteiro E1–E5.

## 1. Leitura obrigatória antes de implementar

Todos os caminhos desta relação partem da raiz do repositório. Leia o conteúdo integral destes documentos uma vez no início da retomada financeira. Um índice, resumo de outro agente ou afirmação de leitura não substitui os arquivos.

| Ordem | Documento | O que deve orientar no trabalho |
| --- | --- | --- |
| 1 | `AGENTS.md` | Entrada, branch, escopo e verificações. |
| 2 | `docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md` | Objetivos e fronteiras do produto; simplicidade na interface e inteligência interna. |
| 3 | `docs/etapa-2/concepcao/documento-integral-v1.0/01-texto-original.md` | Problema que a evolução pretende resolver e contexto do sistema existente. |
| 4 | `docs/etapa-2/concepcao/documento-integral-v1.0/02-texto-original.md` | Fontes contratuais, aproveitamento dos módulos Excel e arquitetura em camadas. |
| 5 | `docs/etapa-2/concepcao/documento-integral-v1.0/03-texto-original.md` | Jornadas, cálculos contextuais, previsão e perguntas do painel financeiro. |
| 6 | `docs/etapa-2/concepcao/documento-integral-v1.0/04-texto-original.md` | Natureza dos valores, calendários, governança e responsabilidades. |
| 7 | `docs/etapa-2/concepcao/documento-integral-v1.0/05-texto-original.md` | Entregas, núcleo mínimo, questões abertas e critérios de aceite. |
| 8 | `docs/etapa-2/decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md` | Edição flexível, referências provisórias, autonomia e alertas proporcionais. |
| 9 | `docs/etapa-2/decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md` | Reutilização de cadastros, jornadas e identidade do GOP Clima. |
| 10 | `docs/etapa-2/decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md` | Pergunta → resultado → ação → registros de origem; gráficos e comparações úteis. |
| 11 | `docs/etapa-2/decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md` | Sem login na fase de desenvolvimento; persistência compartilhada em ambiente de teste, sem enfraquecer produção. | 
| 12 | `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md` | Sequência técnica, dependências e limites de cada entrega. |

Para intervenções de interface, leia também `.agents/skills/gop-clima-visual-quality/SKILL.md` e examine os componentes/tokens efetivamente utilizados, inclusive `src/styles/finance-polish.css`, quando presente.

**Como comprovar entendimento:** antes de editar, apresente uma matriz curta, de até oito linhas, com: objetivo/decisão e seção de origem → situação atual no código → mudança desta rodada → teste ou evidência de aceite. Inclua ao menos referência econômica, vínculo dos registros, persistência e apresentação ao usuário. Depois prossiga com a execução; essa matriz não é uma nova rodada de aprovação nem um relatório extenso.

**Hierarquia:** siga as instruções atuais do usuário e o escopo desta rodada. A Carta e as DP orientam o produto; a concepção original contém propostas e questões abertas que não viraram decisões automaticamente. O roteiro detalha entregas, mas suas descrições históricas não provam o estado atual. Resolva escolhas rotineiras de implementação e registre a justificativa no PR. Se uma dúvida afetar o significado financeiro, não invente a regra; mantenha a referência identificada e avance no que for independente.

**Referências históricas:** o handoff `HANDOFF_CODEX_PRIMEIRA_IMPLEMENTACAO_VISUAL.md`, os protótipos Gemini e documentos antigos de estado não são ordens para recomeçar a primeira interface. Consulte-os apenas para uma questão específica. Não repita toda a leitura a cada pequeno ajuste; recupere a fonte pertinente se perder contexto.

## 2. Estado a conferir, sem assumir que ainda é igual

Base verificada na preparação deste prompt: PR #29, branch `feat/etapa2-acabamento-visual`, commit `cc9195d882a2246d53e71fd45fb6d42f56b24c91`, sobre o PR #28.

Antes de trabalhar, consulte branches, PRs, commits e testes atuais. Escolha uma base que contenha os avanços relevantes. Não comece de uma master antiga ignorando os PRs empilhados. Preserve mudanças de outros agentes; use uma branch própria.

Na revisão-base:

- O Firestore atende escolas, chamados, histórico e controles operacionais.
- A programação de visitas é um rascunho local, com cópias, recuperação e proteção entre abas.
- `financialReference.js` contém funções de referência, mas a consulta usada pela interface não recebe catálogo.
- A referência monetária contextual e os quatro grupos financeiros ainda exibem ausência de valores.
- O gráfico novo trata de abertura de chamados; não representa previsão financeira.
- O acabamento visual do PR #29 não implementa essas capacidades financeiras.

Verifique esses pontos no código antes de classificá-los como entregues ou pendentes. Recursos equivalentes surgidos depois devem ser aproveitados.

Leia os trechos pertinentes de `src/App.jsx`, `src/components/FinancialOverviewPage.jsx`, `FinancialReferenceCard.jsx`, `SchoolFinancialSummary.jsx`, `VisitPlanningBoard.jsx`, `src/domain/financialReference.js`, `financialPresentation.js`, `schoolVisitPlan.js`, `visitDraftStorage.js`, do adaptador Firestore, de `firestore.rules` e dos testes correspondentes. Inspecione importações e chamadas: a existência de uma função não comprova integração.

## 3. Regras permanentes

1. Reaproveite escola, chamado, dossiê e programação. Preventiva pode existir sem chamado; um atendimento pode relacionar-se a vários chamados. Preserve identificadores estáveis.
2. Separe referência de preço, estimativa, apuração informada, NF, liquidação informada e pagamento. Conclusão de chamado ou data de execução não gera cobrança, atesto ou pagamento.
3. A referência deve considerar o serviço e a cobertura aplicáveis. Tipo e BTUs, isoladamente, não demonstram elegibilidade para faturamento. Corretiva coberta não gera nova cobrança automática.
4. Admita valores de referência provisórios ou informados pelo responsável, com origem e natureza visíveis. Não espere um inventário completo para permitir trabalho válido; não invente dados técnicos.
5. Trabalhe com precisão monetária coerente com as referências existentes. Preserve ausência e zero informado como situações distintas. Totais parciais devem informar o que falta.
6. Reprogramação atualiza o planejamento e preserva histórico. Possível sobreposição é assunto de conferência, sem apagar serviços legítimos. Alterar uma referência não deve reescrever silenciosamente resultados financeiros já registrados; preserve a versão aplicada.
7. Dados compartilhados devem usar a persistência do projeto em ambiente de desenvolvimento. LocalStorage, Web Locks e exportação JSON não constituem persistência compartilhada. Sem autenticação atual, não se deve alegar auditoria individual de autoria.
8. **Aplicar DP-004:** durante desenvolvimento, **não implementar autenticação/login/perfis**; validar tecnicamente tipos, identificadores, valores e vínculos no backend de desenvolvimento e testar dados compartilhados entre sessões sem login. Projetar fronteira de autorização futura, sem antecipar sua implementação. Não liberar regras temporárias permissivas nem dados reais sensíveis em produção; autenticação definitiva será exigida antes da entrega institucional.
9. Use React/Vite, serviços, domínio, Firestore e identidade existentes. Mantenha cálculos testáveis separados da apresentação. Não instale uma biblioteca de gráficos sem necessidade demonstrada.
10. O site apoia decisões. Documentação integral de OES, IMR, atestação, CMMS e processo administrativo continua fora desta entrega.

## 4. Etapa 1 — Atendimento com referência econômica utilizável e compartilhada

**Pergunta resolvida:** “Qual é a referência econômica deste atendimento e de onde veio o valor?”

Entregue o seguinte percurso completo:

- A partir da escola, programação ou chamado existente, o responsável informa apenas o necessário sobre o atendimento previsto.
- Reutiliza dados técnicos identificáveis e admite grupos com quantidade quando os aparelhos não estiverem individualizados.
- Um atendimento pode conter mais de um grupo/item com referências diferentes; não transforme toda a escola numa única categoria de preço.
- A referência vem de catálogo pertinente ou de informação editável e identificada. Reaproveite o domínio E1 e conecte-o efetivamente à interface.
- O usuário vê a estimativa, sua natureza e origem. A composição fica disponível sob demanda.
- O registro é salvo no backend **de desenvolvimento**, pode ser reaberto e corrigido e aparece em outra sessão de desenvolvimento **sem login**, com dados e regras adequados ao ambiente de teste. O dossiê/contexto escolar apresenta o resultado pertinente.
- O registro permite futura consolidação por competência, sem exigir nesta etapa um painel financeiro completo.

Modele o atendimento/composição separadamente do chamado operacional. Preserve as ligações necessárias com escola, competência prevista, ciclo quando pertinente, itens, quantidades, referência/versão utilizada, responsável e alterações. Não exponha essa estrutura inteira como um formulário técnico.

Se faltarem parâmetros oficiais, permita referências provisórias identificadas. Valores fictícios ficam restritos a testes/demonstração. Confirme as fontes antes de apresentá-los como contratuais. A estimativa preliminar de aquisição/adequação já existente no dossiê não é a tabela de manutenção.

Se a persistência compartilhada ainda não existir, trate-a como dependência deste incremento. **Não criar login ou perfis para viabilizar o teste.** Valide em emulador/projeto Firebase de desenvolvimento com regras apropriadas a esse ambiente, identifique a configuração necessária ao uso futuro e não exponha dados reais sensíveis em endpoints permissivos. Uma simulação exclusivamente no navegador deve ser descrita como parcial, não como conclusão desta etapa.

**Aceite da Etapa 1:**

- Duas escolas, atendimentos com referências distintas e um atendimento com múltiplos grupos produzem composições conferíveis.
- Referência provisória, ausência de parâmetro e zero informado recebem tratamentos corretos.
- Correção de quantidade ou referência atualiza a estimativa sem alterar a escola ou duplicar o atendimento.
- Falta de cadastro individual não obriga inventar equipamento ou recadastrar a escola.
- Gravação, releitura e acesso por **outra sessão de desenvolvimento sem login** preservam os dados no backend de teste; estruturas inválidas são rejeitadas por validações técnicas. **A rejeição por identidade/perfil autenticado não é requisito desta etapa, conforme DP-004.**
- A estimativa pode ser consultada no contexto escolar/operacional sem repetir dados já conhecidos.
- O usuário consegue identificar a origem do resultado; nenhum status operacional transforma a estimativa em valor devido.

Faça commits pequenos e mantenha um PR de revisão atualizado. Se houver impedimento externo, entregue o código e os testes executáveis já concluídos, identifique o requisito faltante e marque o aceite afetado como pendente. Não afirme sucesso em uma persistência que não foi demonstrada.

## 5. Etapa 2 — Previsão mensal com leitura visual e navegação

**Executar em rodada posterior.**

Consolidar os atendimentos valorados por escola e competência. A área financeira deve apresentar síntese do período, evolução mensal da previsão e acesso à composição. Indicar quantos registros permanecem sem referência; não transformar parcela conhecida em total completo.

Reprogramar um atendimento entre meses deve atualizar ambos os períodos sem duplicação financeira. Gráfico/indicador deve abrir seus registros com filtros preservados. Entregar junto dados, agregação, gráfico e ação contextual.

**Aceite central:** alterar a programação de duas escolas modifica a previsão e as barras correspondentes; clicar na barra explica o total; outra sessão vê os mesmos registros.

## 6. Etapa 3 — Execução e apuração informadas

**Executar em rodada posterior.**

Relacionar o atendimento ao resultado informado pelo responsável, com competência, valor e referência de origem. Quantidade prevista e data de execução, sozinhas, não equivalem ao que foi efetivamente apurado.

Comparar estimativa e apuração em bases compatíveis, mostrar diferenças e permitir conferência/correção com histórico. O responsável pode informar valor diferente da estimativa. Consumir o resultado dos instrumentos externos, sem reconstruir sua avaliação técnica integral no site.

**Aceite central:** informar uma apuração modifica a visão do período e permite rastrear a diferença; não gera automaticamente NF, pagamento ou atesto.

## 7. Etapa 4 — Faturamento e pagamentos resumidos

**Executar em rodada posterior.**

Registrar NF, competência(s) pertinente(s), valor, situação financeira e pagamentos com suas datas. Reutilizar o contexto disponível. Admitir múltiplas NFs e pagamentos parciais, sem presumir uma NF por chamado.

Uma NF pode abranger várias escolas. Não distribuir seu valor por escola sem informação que sustente a alocação. Separar competência do serviço e mês do pagamento; distinguir valor faturado, quitado e ainda pendente conforme os registros.

**Aceite central:** NF com pagamento parcial continua com saldo pendente; pagamento posterior aparece corretamente na leitura de caixa; os totais reconciliam com os registros vinculados.

## 8. Etapa 5 — Análises cruzadas e avisos úteis

**Executar em rodada posterior, conforme maturidade dos dados.**

Acrescentar somente leituras que resolvam perguntas: previsto × apurado por competência, concentração por escola, pendências de informação, faturamento sem pagamento integral, diferenças que merecem conferência e cruzamentos operacionais pertinentes.

Cada visual deve declarar grandeza, período, origem e ação de aprofundamento. Avisos encaminham à correção ou consulta; não criam glosas, infrações ou decisões administrativas automaticamente. Não somar previsão + NF + pagamento como despesas distintas.

## 9. Método de trabalho e evidência de entrega

- Comece pela leitura e pela matriz curta; depois execute o primeiro incremento pendente. Não substitua a implementação por novos manuais.
- Aproveite as ferramentas e habilidades disponíveis pertinentes à tarefa, sem fazer sua instalação virar o objetivo do trabalho.
- Teste cálculo, vínculos, persistência/autorização e interface. Use testes de comportamento e integração; não congele classes ou DOM antigos como requisitos de produto.
- Execute lint, suíte unitária, build e verificações Firestore/Playwright pertinentes. Classifique causas de falhas. Não omita erros nem faça testes passarem reduzindo expectativas.
- Identifique branch e SHA. Confira se o CI foi disparado para a base do PR; ajuste o gatilho quando necessário, preservando sua cobertura.
- Inspecione a aplicação real nos temas claro/escuro, notebook, tela ampla/4K e mobile essencial; inclua nomes longos, ausência de dados e estados de gravação/erro.
- Apresente URL de preview quando disponível e capturas reais com ambiente e dados identificados. HTML demonstrativo ou teste com dados sintéticos não comprova ligação ao banco real.
- Atualize pontualmente o estado do incremento em documentação existente ou no PR. Não reescreva retrospectivamente a concepção.
- Abra/atualize PR em rascunho para revisão. Merge e publicação de produção dependem de autorização específica.

Ao encerrar, informe: pergunta que passou a ser resolvida; percurso utilizável; relações e persistência efetivamente implementadas; cálculos e visuais conectados; testes executados; limitações e aceites pendentes; link do PR/preview; próximo incremento.

**Condição de progresso:** cada etapa acrescenta uma capacidade gerencial verificável. Mais cartões, funções isoladas ou testes de navegação, por si, não demonstram conclusão da inteligência financeira.
