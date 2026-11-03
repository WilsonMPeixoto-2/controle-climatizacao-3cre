# GOP Clima 3ª CRE — Roteiro para Codex e demais agentes

**Este é o único ponto de entrada obrigatório.** Trabalhe sobre o código existente, não sobre protótipos. Na retomada financeira, cumpra a leitura obrigatória abaixo; nas demais tarefas, consulte documentos adicionais pertinentes. Não crie novos manuais nem reabra decisões já resolvidas.

## Retomada financeira da Etapa 2 — leitura obrigatória

Para desenvolver ou retomar capacidades financeiras da Etapa 2, leia antes de implementar o [prompt de execução por etapas](docs/etapa-2/planejamento/PROMPT_CODEX_EXECUCAO_FINANCEIRA_POR_ETAPAS.md) e todos os documentos da sua seção **1. Leitura obrigatória**. A sequência inclui a Carta, as cinco partes da concepção, DP-001/002/003 e o roteiro E1–E5.

A leitura deve resultar em uma matriz curta **objetivo/seção → código atual → mudança → teste de aceite**. Não basta declarar que os documentos foram lidos. Faça a leitura integral na retomada e recupere trechos pertinentes quando necessário, sem repeti-la a cada ajuste.

O prompt distingue a etapa ativa das futuras: a primeira entrega conecta atendimento, referência econômica, interface e persistência compartilhada. Os documentos históricos de primeira interface não são uma fila para recomeçar. Consulte o estado remoto e preserve os PRs já existentes.

## Execute nesta ordem

1. **Localize a tarefa.** Verifique branch, PR, arquivos afetados e resultado pretendido; leia o código atual. Etapa 2 em desenvolvimento: [PR #24](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/24) (E1) → [PR #25](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/25) (interface) → [PR #26](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/26) (conferência escolar). A sequência avançou também pelos PRs [#27](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/27), [#28](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/28) e [#29](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/29). **Confirme o estado remoto antes de agir**; essa sequência é uma referência, não uma ordem automática de merge.
2. **Implemente o menor incremento útil.** Use `src/App.jsx`, os componentes, o domínio, o Firebase e os cadastros existentes. Reaproveite escola/chamado/equipamento; sem duplicar registros, refazer a aplicação ou presumir valores. **Quem decide execução, apuração e atesto é o gestor/fiscal, não o sistema.** Ofereça edição e alertas informativos em vez de travas administrativas inventadas.
3. **Quando houver UI, aplique a skill local** [`gop-clima-visual-quality`](.agents/skills/gop-clima-visual-quality/SKILL.md) **antes de alterar JSX/CSS**. Preserve design real (`src/index.css`, `src/styles/`), Outfit/Inter, Lucide, temas e navegação. O objetivo é **menos leitura, menos cliques e mais respostas/ações contextuais**, não mais cartões. Ferramentas externas são opcionais, conforme disponibilidade; não depender de TinyFish nem de serviços pagos.
4. **Teste, olhe e entregue.** Rode `npm run lint`, `npm test`, `npm run build` e testes Firestore/Playwright pertinentes. **UI exige inspeção de telas reais** em desktop, monitor largo e mobile (tema claro/escuro), com navegação, foco, contraste e overflow verificados. Classifique falhas; não atualize snapshots cegamente. Informe PR, SHA, o que funciona, evidências visuais e pendências. **Não faça merge/deploy de produção sem aprovação.**

## Três decisões que não podem ser contrariadas

- **DP-001 — Autonomia:** ferramentas apoiam e calculam; gestor/fiscal ajusta, decide e atesta nos instrumentos próprios. Sem obrigação administrativa criada pelo software.
- **DP-002 — Continuidade:** interfaces e dados novos são extensão do GOP Clima existente, nunca uma aplicação paralela com outra identidade.
- **DP-003 — Inteligência visual:** valor do dashboard = resposta útil + próxima ação + acesso aos registros. Não criar gráficos fictícios, texto excessivo ou formulários redundantes. O conjunto visual do Gemini foi reprovado; só conceitos pontuais podem inspirar.

## Consulta adicional por necessidade (além da leitura financeira obrigatória)

- **Escopo e arquitetura:** [Concepção Funcional v1.0](docs/etapa-2/concepcao/documento-integral-v1.0/README.md) e [Carta de Princípios](docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md).
- **Decisões detalhadas:** `docs/etapa-2/decisoes/DP-00*.md`.
- **Etapas futuras:** `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md`. O handoff antigo F1–F4 é **registro histórico**, não ordem para refazer trabalho.
- **Catálogo de ferramentas e critérios visuais extensos:** `docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md`, somente quando precisar escolher recurso, investigar falha visual ou validar captura.

**Regra final:** defeito comprovado se corrige; decisão legítima do usuário se torna opção editável. Nada de loops de documentação ou refinamento sem ganho verificável.
