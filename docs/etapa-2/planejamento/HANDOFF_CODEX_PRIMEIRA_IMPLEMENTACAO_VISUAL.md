# Handoff operacional para o Codex — Etapa 2, primeira entrega visual integrada

**Projeto:** GOP Clima — 3ª CRE / SME-RJ  
**Objetivo:** começar a implementação REAL das novas capacidades financeiras, diretamente na aplicação React/Vite/Firestore existente, **sem reconstruir a UI** e **sem publicar em produção**.  
**Natureza:** instrução executável para desenvolvimento, não nova rodada de concepção.  
**Situação da origem:** PR #24, rascunho, com E1 e decisões de produto; base inicial `feat/etapa2-fundacao-financeira`.  
**Diretriz de escopo:** entregar um incremento visível e funcional em branch/PR de revisão. **Não tentar concluir E1–E5 de uma vez.**

## 0. Decisão antes de escrever código

1. Leia esta instrução e as referências abaixo; examine a **versão atual** dos arquivos do repositório antes de modificar componentes.
2. **Parta da branch `feat/etapa2-fundacao-financeira`**, que contém o núcleo E1, e crie uma branch derivada, por exemplo `feat/etapa2-primeira-interface`. Se o ambiente Codex preferir sua branch de trabalho própria, mantenha a ancestralidade e indique claramente a base do PR. **Não partir apenas de `master` ignorando E1 e as decisões DP-001/DP-002.**
3. Faça alterações reais no site React existente. Não criar `App2.jsx`, `painel-integrado.html`, tela demonstrativa separada ou novo projeto.
4. Submeta PR em rascunho para `feat/etapa2-fundacao-financeira` **ou** PR empilhado com essa branch como base, para evitar que alterações experimentais sejam publicadas automaticamente. Se GitHub/Vercel dispararem pré-visualização, ela é somente para análise; não promover deploy a produção.
5. **Implementar sem novas perguntas de produto quando a decisão couber à flexibilidade do usuário**, conforme DP-001. Pedir decisão apenas se houver bloqueio técnico incontornável, credencial/permissão ausente ou risco de perda de dados. Evitar loops de alterações cosméticas.

## 1. Hierarquia documental obrigatória

Leia em ordem:

- `docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md`
- `docs/etapa-2/decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md` — ferramentas de apoio, não instrumentos regulatórios; ajustes e reprogramações são decisões do usuário.
- `docs/etapa-2/decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md` — integração funcional, informacional e visual ao GOP Clima existente.
- `docs/etapa-2/concepcao/documento-integral-v1.0/README.md` — Concepção Funcional integral.
- `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md` — itinerário por entregas.
- `docs/etapa-2/referencias/gemini-prototipo-v1/AVALIACAO_E_SELECAO.md` — ideias aceitas e trechos rejeitados.
- `src/domain/financialReference.js` e `test/financial-reference.test.mjs` — núcleo E1 inicial e testes. **Não introduzir preços ou categorias a partir do Gemini.**

Havendo divergência, DP-001/DP-002 e Carta de Princípios orientam a interpretação da Concepção; o protótipo Gemini nunca prevalece sobre elas.

## 2. Estado REAL do código, verificado antes do handoff

### Aplicação, navegação e dados

- `src/App.jsx`: aplicativo principal com aproximadamente **6.798 linhas**, já controla `currentTab`, dados reais de `tickets` / `schools`, formulário, ficha de chamado, consulta por unidade, histórico, persistência e navegação.
- `TAB_TITLES` atualmente define `dashboard`, `tickets`, `lookup`, `form`, `email`, `cloud`. `VALID_TABS` contém as mesmas rotas na forma de identificadores.
- Sidebar real: `<aside className="sidebar">` e botões `sidebar-item` em `src/App.jsx`; PRESERVAR os itens existentes e acrescentar somente **Gestão Financeira** em lugar coerente.
- Cabeçalho e estrutura principal: `<main id="conteudo" className="main-content">`, `.main-header`, `.dashboard-section`, `.section-header`.
- Chamada de ficha: `openTicketEdit(ticket)`, com `editingTicket`, `showEditModal`; campos da ficha real têm `status_atual`, `tipo_demanda`, `tipo_aparelho`, `btu_existente`, `btu_pretendido`, `local_demanda` e identificador `id_chamado`.
- Cadastro de 134 escolas em `src/data/db.json` possui `designacao`, `unidade_escolar`, `sici`, `aparelhos_total`; **esse total NÃO constitui inventário individualizado**.
- Chamados reais usam identificadores `GOP-AR-AAAA-NNNN`, diferente do JSX Gemini. Não alterar a lógica transacional de criação ou as validações estruturais.
- O site integra Firebase/Firestore em `src/infrastructure/firebase/`; a nova interface deverá consumir os estados e dados já existentes, sem criar segundo banco ou duplicar cadastros.

### Estilos existentes

- `src/main.jsx` já importa `src/index.css` e, em ordem, `src/styles/tokens.css`, `components.css`, `dashboard.css`, `dossier.css`, `print-executive.css`, `maturity-2026.css`, `return-polish-2026.css`.
- Reutilizar `.sidebar`, `.sidebar-item`, `.section-header`, `.surface-card`, `.stat-card`, `.btn`, `.status-chip`, `.form-control`.
- Usar os tokens `--font-display` (Outfit), `--font-text` (Inter), `--text-*`, `--space-*`, `--surface-*`, `--hairline` e `--primary`/demais cores atuais.
- A identidade do site atual predomina sobre o painel Gemini. Evitar CSS utilitário Tailwind introduzido só para esta tela, sidebar paralela, outra tipografia, cards genéricos, textos fundamentais com 10px e gráficos decorativos.
- Garantir tema claro e `.dark-theme`, dispositivos móveis, desktop e telas amplas/4K. Priorizar reutilização de classes existentes; CSS novo, se necessário, escopado à área financeira.

### Riscos de integração a respeitar

- Existe um fluxo de administração online com controles históricos no frontend. **Não usar sessão/localStorage ou senha do menu atual como autorização para gravar valores financeiros.**
- A visualização da nova área pode operar com dados do site e estados vazios; **nenhum registro financeiro editável deve ser persistido** nesta primeira entrega sem controle real por identidade nas regras Firestore.
- Alguns chamados históricos são **instalação, substituição, obras elétricas** etc., e não representam automaticamente manutenção do Contrato nº 59/2026. Não rotular todos como cobertos nem os incluir em valores estimados.
- Dados financeiros ainda não foram integrados/validados. Não introduzir teto, parcela, preço ou empenho como fato a partir das demonstrações do Gemini. Um cartão “Não informado” é melhor que R$ 0,00 inventado.

## 3. Pacote de implementação desta primeira rodada — entregar agora

### F1 — Nova área nativa: Gestão Financeira (visível e navegável)

Adicionar uma seção `finance` (ou outro ID coerente com `TAB_TITLES`) à sidebar real, ao controle de abas e à página principal. A página deve ser um **componente React separado**, por exemplo `src/components/FinancialOverviewPage.jsx`, renderizado pelo App existente; jamais duplicar shell, cabeçalho, logotipo, sidebar, tema ou persistência.

A nova tela deve ter:

- Cabeçalho de seção com título **Gestão Financeira** e subtítulo breve, seguindo o design system real.
- Até quatro grupos semânticos **Previsão / Apuração informada / Faturamento e pagamentos / Limites e empenhos**, inicialmente com valores ausentes identificados como **“Não informado”** onde não existir dado válido. Não reproduzir números demonstrativos.
- Consulta/recorte inicial por **escola** e **período** usando estados/entradas existentes. Os dados disponíveis devem fundamentar os resultados; deixar explícito quando um indicador é global, não filtrável, ou ainda não foi informado.
- Pequeno resumo operacional **real** (ex.: quantidade de solicitações históricas relacionadas ao recorte), com título que não sugira cobrança, medição ou competência financeira definida.
- Estado vazio bem desenhado para a fase atual (“Informações financeiras ainda não registradas”), legível e sem alertas alarmistas.
- Comportamentos reais de seleção, limpeza de filtros, responsividade e teclado. **Não** incluir botões sem função nem cartões com valores fictícios.

**Não desenvolver ainda nesta rodada:** editor de NF/pagamento, cálculo automático por chamado como valor faturável, autenticação financeira, gráficos com séries inventadas, reprogramação complexa, importação CMMS ou quatro módulos copiados do Excel.

### F2 — Referência contextual nos chamados existentes

Criar componente reutilizável de **referência informativa**, ex. `src/components/FinancialReferenceCard.jsx`:

- Na ficha existente (`showEditModal && editingTicket`), exibir identificação consultiva baseada em `tipo_aparelho` e na capacidade informada `btu_existente` ou `btu_pretendido`, **sem presumir que ambas representem o aparelho que será mantido**. Rotular a fonte do campo de BTU ou, na dúvida, indicar que o enquadramento exige confirmação.
- Invocar `consultContractReference` do E1 com catálogo **ausente por padrão**; o resultado será ausência de referência, com orientação compacta e caminho para informar parâmetros quando a etapa de edição financeira for disponibilizada.
- Para tipos de demanda como instalação, substituição ou adequação elétrica, **não afirmar cobertura contratual**; exibir “Referência financeira de manutenção não aplicável automaticamente a este tipo de demanda” ou ocultar o componente, conforme UX.
- Não acoplar preço, cobertura ou valor apurado ao `status_atual`; não editar chamados históricos ou eventos.
- Reutilizar `surface-card` / estilos do modal, preservando largura, controles e a ação “Salvar alterações” atual.

### F3 — Contexto no registro de chamados e na consulta por escola, sem duplicação

- No formulário real `currentTab === 'form'`, acrescentar referência leve e opcional, conectada à seleção de `formSelectedSchool`, `newTicket.tipo_demanda`, `newTicket.tipo_aparelho` e BTUs disponíveis. Não criar segundo formulário financeiro, não bloquear a criação se não houver preço e não alterar a estrutura de gravação.
- Na consulta `currentTab === 'lookup'`, acrescentar seção compacta quando houver uma escola selecionada (`selectedSchool` / dossier), associando informações existentes da unidade e sua disponibilidade financeira **ainda não registrada**, sem considerar `aparelhos_total` como equipamentos individualizados.
- Não alterar de forma transversal layout, cards de risco, consulta do dossiê ou filtros de chamados.

### F4 — Testes reais e evidências

- Testes unitários de apresentação e regras já existentes, sem alterar `test/financial-reference.test.mjs` para aceitar números indevidos.
- Adicionar teste Playwright, por exemplo `e2e/finance-first-iteration.spec.js`, verificando navegação para Gestão Financeira, acesso às abas históricas, estados sem informação financeira, seleção de escola/período, retorno à ficha do chamado e ausência de regressão nas ações operacionais.
- `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, e `npm run test:firestore` quando ambiente disponibilizar emuladores.
- Conferir screenshots em **desktop padrão (ex.: 1440×900), desktop largo/4K e mobile (~390px)**, ao menos em tema claro e escuro. Capturas devem evidenciar a convivência visual com telas preexistentes. Não basta compilar.
- Registrar execução dos testes, falhas não resolvidas e screenshots/links verificáveis no PR. Não alegar CI verde antes de conferir.

## 3.1. Diagnóstico CI pré-handoff — NÃO presumir suíte inteiramente aprovada

Na consulta realizada para este handoff, o workflow da branch no commit `e9b31d6` apresentou: **Lint, unit tests and build = success; Firestore emulator = success; Playwright baseline = failure** (falha no passo `Run Playwright`). Confira os detalhes do [workflow anterior](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41364576547) e do [job Playwright](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41364576547/job/125021921595).

Uma nova execução CI foi enfileirada após a atualização documental; **não confundir enfileirada com sucesso**. Na primeira execução do Codex: (a) conferir CI atual e logs; (b) reproduzir e identificar o erro Playwright; (c) corrigir regressões originadas da nova implementação; (d) documentar separadamente eventuais falhas preexistentes sem desviar o escopo para refatoração geral. Não promover PR enquanto a validação esperada não estiver satisfatória.

## 4. Itens de aceite objetivo da primeira rodada

- [ ] Sidebar real contém **um** novo item Gestão Financeira e os itens anteriores permanecem funcionais.
- [ ] Tela financeira utiliza a identidade visual existente, sem novo shell, nova paleta ou fontes próprias.
- [ ] A página apresenta dados reais do aplicativo quando disponíveis e valores ausentes como **“Não informado”**.
- [ ] Campos financeiros ainda não integrados NÃO são substituídos por R$ 0,00 nem pelos números do Gemini.
- [ ] Chamados atuais mantêm seu fluxo, IDs, histórico, estados, anexos e gravação inalterados.
- [ ] Uma ficha de chamado oferece contexto de referência **sem** gerar direito de cobrança ou medição.
- [ ] Registro de chamado continua funcionando com tipo/BTUs ausentes e sem tabela de preços carregada.
- [ ] Consulta por escola não inventa subinventário nem converte total de aparelhos em valor contratual.
- [ ] Não há novo acesso de escrita a dados financeiros no Firestore.
- [ ] Filtros e indicadores mostram seu alcance e não representam valores globais como valores da escola.
- [ ] Desktop, mobile, 4K, temas claro/escuro e navegação por teclado são verificados.
- [ ] Lint, testes, build e Playwright verificados; nenhum merge/deploy em produção realizado automaticamente.

## 5. Depois da primeira entrega: sequência E3–E5 (NÃO antecipar)

**E3** | Programação ajustável de escolas/equipamentos e previsões por competência; duplicidades são *alertas*, não proibições. Não supor inventário perfeito.  
**E4 completo** | Indicadores e gráficos somente quando tiverem fonte, grandeza e calendário definidos; sempre separar competência de serviço, programação financeira e pagamento real informado.  
**E5** | Modelar NFs, registros de apuração e pagamentos, inclusive múltiplos/parcelados; usuário responsável edita valores sem que o site execute atesto administrativo. Escrita exige autorização real nas regras Firestore. Definir esse modelo em PR próprio antes de habilitar edição.

A implementação deverá preservar DP-001: **a ferramenta facilita decisões dos usuários, não determina o que o fiscal deve atestar nem prende o gestor a quantidades imutáveis**.

## 6. Regras de execução do Codex

**Fazer, testar e mostrar.** Não produzir somente proposta ou imagens para aprovação; esta instrução autoriza construir o primeiro incremento acima em código real, isolado em branch de desenvolvimento.

- Criar commits pequenos, mantendo o PR revisável.
- Não "consertar" indiscriminadamente o site histórico nem refatorar as 6.798 linhas para executar este objetivo.
- Não copiar o JSX do Gemini. Não instalar dependências grandes sem necessidade objetiva.
- Não abrir loops intermináveis de validações administrativas que cabem ao servidor, nem loops estéticos que não resolvem problemas visíveis.
- Não modificar `firestore.rules` nesta rodada, nem acrescentar credenciais.
- Não usar dados pessoais operacionais como dataset público de demonstração.
- Não habilitar Vercel produção, merge automático ou push em `master`.
- Ao finalizar, informar: URL do PR, commits, arquivos alterados, demonstração funcional, screenshots desktop/mobile, testes executados, falhas remanescentes e próximas decisões.

## 7. Instrução resumida para iniciar no Codex

> No repositório `WilsonMPeixoto-2/controle-climatizacao-3cre`, continue a partir de `feat/etapa2-fundacao-financeira` (PR #24) e execute integralmente `docs/etapa-2/planejamento/HANDOFF_CODEX_PRIMEIRA_IMPLEMENTACAO_VISUAL.md`. Implemente as entregas F1–F4 na aplicação React/Vite/Firestore REAL, preservando a navegação e o design system atual. Respeite DP-001 (flexibilidade gerencial) e DP-002 (continuidade visual). Crie branch e PR em rascunho para revisão, execute os testes e forneça capturas verificáveis, sem merge nem publicação em produção.
