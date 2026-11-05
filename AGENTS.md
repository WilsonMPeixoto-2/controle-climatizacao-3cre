# GOP Clima 3ª CRE — Roteiro para Codex e demais agentes

> **Referência de depuração e entrega comprovada (04/11/2026):** para falhas de build/deploy, integrações Vercel, problemas de browser, persistência remota, dependências ou downloads, consultar [skill portátil](.agents/skills/diagnostico-entrega-verificada/SKILL.md) e [registro de evidências](docs/engineering/INCIDENTES_E_VERIFICACAO_2026_11.md). Estes textos são **suplementares** e não alteram a precedência, a governança, os gates, as decisões e os critérios de autorização definidos neste AGENTS.md.

**Este é o único ponto de entrada obrigatório.** Trabalhe sobre o código existente, não sobre protótipos. Na retomada financeira, cumpra a leitura obrigatória abaixo; nas demais tarefas, consulte documentos adicionais pertinentes. Não crie novos manuais nem reabra decisões já resolvidas.

## DP-004 — sem login durante o desenvolvimento (DECISÃO VIGENTE)

**Antes de qualquer implementação financeira, leia obrigatoriamente [DP-004 — Autenticação adiada durante o desenvolvimento](docs/etapa-2/decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md).** Por decisão expressa do responsável pelo produto, o GOP Clima permanece acessível diretamente aos agentes e desenvolvedores, **sem login, cadastro de usuários ou autorização individual nesta fase**. **Não trate essa ausência como impedimento à Etapa 1 ou como prioridade de correção.** A autenticação e os perfis ficam para antes da entrega aos servidores.

A Etapa 1 deve implementar cálculos e **persistência de desenvolvimento compartilhada**, com testes de duas sessões sem login, integridade e validações estruturais. **Não liberar bases sensíveis reais nem regras permissivas indiscriminadas em ambientes de produção**; usar projeto/emulador de desenvolvimento e dados adequados. Não afirme autoria individual autenticada quando não existir. A DP-004 prevalece quanto ao **cronograma de autenticação**, inclusive sobre menções anteriores a "edição autorizada" no prompt e no roteiro E1–E5. Outros requisitos de correção financeira, integridade e rastreabilidade continuam válidos.

## Retomada financeira da Etapa 2 — leitura obrigatória

Para desenvolver ou retomar capacidades financeiras da Etapa 2, leia antes de implementar o [prompt de execução por etapas](docs/etapa-2/planejamento/PROMPT_CODEX_EXECUCAO_FINANCEIRA_POR_ETAPAS.md) e todos os documentos da sua seção **1. Leitura obrigatória**. A sequência inclui a Carta, as cinco partes da concepção, DP-001/002/003, **DP-004** e o roteiro E1–E5.

A leitura deve resultar em uma matriz curta **objetivo/seção → código atual → mudança → teste de aceite**. Não basta declarar que os documentos foram lidos. Faça a leitura integral na retomada e recupere trechos pertinentes quando necessário, sem repeti-la a cada ajuste.

O prompt distingue a etapa ativa das futuras: a primeira entrega conecta atendimento, referência econômica, interface e persistência compartilhada. Os documentos históricos de primeira interface não são uma fila para recomeçar. Consulte o estado remoto e preserve os PRs já existentes.

## Execute nesta ordem

1. **Localize a tarefa.** Verifique branch, PR, arquivos afetados e resultado pretendido; leia o código atual. **A evolução da Etapa 2 foi integrada à `master` no [PR #32](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/32), squash `16274ae5`, e publicada no site de homologação em 03/11/2026.** Antes de iniciar nova tarefa, consulte o [estado da entrega](docs/etapa-2/implementacao/RELEASE_CONSOLIDADA_2026-11-03.md). Os antigos PRs #24–#30 eram uma cadeia acumulativa; o PR #31 foi substituído por correção equivalente já validada no #32. São referências históricas, **não tarefas independentes aguardando merges**. Confirme o estado remoto antes de agir; **não recrie a fila de PRs encadeados**.
2. **Implemente o menor incremento útil.** Use `src/App.jsx`, os componentes, o domínio, o Firebase e os cadastros existentes. Reaproveite escola/chamado/equipamento; sem duplicar registros, refazer a aplicação ou presumir valores. **Quem decide execução, apuração e atesto é o gestor/fiscal, não o sistema.** Ofereça edição e alertas informativos em vez de travas administrativas inventadas.
3. **Quando houver UI, aplique a skill local** [`gop-clima-visual-quality`](.agents/skills/gop-clima-visual-quality/SKILL.md) **antes de alterar JSX/CSS**. Preserve design real (`src/index.css`, `src/styles/`), Outfit/Inter, Lucide, temas e navegação. O objetivo é **menos leitura, menos cliques e mais respostas/ações contextuais**, não mais cartões. Ferramentas externas são opcionais, conforme disponibilidade; não depender de TinyFish nem de serviços pagos.
4. **Teste, olhe e entregue.** Rode `npm run lint`, `npm test`, `npm run build` e testes Firestore/Playwright pertinentes. **UI exige inspeção de telas reais** em desktop, monitor largo e mobile (tema claro/escuro), com navegação, foco, contraste e overflow verificados. Classifique falhas; não atualize snapshots cegamente. Informe PR, SHA, o que funciona, evidências visuais e pendências. **Não faça merge/deploy de produção sem aprovação.**

## Política obrigatória de integração: não empilhar PRs

- **Uma entrega consolidada e revisável por vez.** O PR #32 reuniu e integrou à `master` as entregas acumuladas até a Etapa 1 financeira. Não há PRs antigos aguardando merge. **Não abrir PR da Etapa 2 (E2–E5) baseado em outro PR ainda pendente**, nem criar PR adicional para mero acabamento de um incremento já incluído.
- **Encerrar o ciclo de integração antes de ampliar o escopo.** Com testes e revisão funcional/visual, submeter o PR consolidado à aprovação do responsável; só então fazer merge. **Não realizar merge nem deploy de produção sem autorização explícita.** O CI aprovado é evidência técnica, não aceite estético/funcional.
- **Após a integração, sempre partir da `master` atualizada** para a próxima entrega; trabalhar em branch curta, abrir um único PR com escopo limitado, evidência e testes, resolver as observações nele e integrá-lo antes de iniciar o seguinte. Corrigir no PR em andamento em vez de empilhar outro PR sobre sua branch.
- **Se uma etapa nova for solicitada enquanto o PR anterior ainda estiver pendente**, registrar a dependência e priorizar a conclusão da revisão/integração anterior, sem criar silenciosamente uma nova cadeia. PRs realmente independentes só em paralelo com justificativa explícita e base em `master`.
- **Preservar o histórico sem inflar a fila.** PRs encerrados por substituição permanecem disponíveis para rastreabilidade; não apagar branches ou commits sem autorização. Se houver necessidade de condensar muitos commits no merge, preferir squash aprovado para manter a história de `master` legível.
- **Cuidado com o alcance atual:** o backend financeiro da Etapa 1 só foi comprovado no emulador Firestore isolado. Merge na `master` ou deploy Vercel **não transforma esse emulador numa base cloud compartilhada**. Não anunciar a funcionalidade como operacional remotamente antes de configurar e validar infraestrutura de desenvolvimento adequada (DP-004).

## Quatro decisões que não podem ser contrariadas

- **DP-001 — Autonomia:** ferramentas apoiam e calculam; gestor/fiscal ajusta, decide e atesta nos instrumentos próprios. Sem obrigação administrativa criada pelo software.
- **DP-002 — Continuidade:** interfaces e dados novos são extensão do GOP Clima existente, nunca uma aplicação paralela com outra identidade.
- **DP-003 — Inteligência visual:** valor do dashboard = resposta útil + próxima ação + acesso aos registros. Não criar gráficos fictícios, texto excessivo ou formulários redundantes. O conjunto visual do Gemini foi reprovado; só conceitos pontuais podem inspirar.
- **DP-004 — Autenticação adiada:** não criar login/perfis nesta fase nem bloquear E1 por essa ausência; validar persistência compartilhada no ambiente de desenvolvimento e implementar autenticação antes da entrega aos servidores.

## Consulta adicional por necessidade (além da leitura financeira obrigatória)

- **Escopo e arquitetura:** [Concepção Funcional v1.0](docs/etapa-2/concepcao/documento-integral-v1.0/README.md) e [Carta de Princípios](docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md).
- **Decisões detalhadas:** `docs/etapa-2/decisoes/DP-00*.md`.
- **Etapas futuras:** `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md`. O handoff antigo F1–F4 é **registro histórico**, não ordem para refazer trabalho.
- **Catálogo de ferramentas e critérios visuais extensos:** `docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md`, somente quando precisar escolher recurso, investigar falha visual ou validar captura.

**Regra final:** defeito comprovado se corrige; decisão legítima do usuário se torna opção editável. Nada de loops de documentação ou refinamento sem ganho verificável.
