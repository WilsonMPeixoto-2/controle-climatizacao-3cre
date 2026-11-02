# GOP Clima 3ª CRE — Roteiro para Codex e demais agentes

**Este é o único ponto de entrada obrigatório.** Trabalhe sobre o código existente, não sobre protótipos. Leia documentos adicionais **somente quando forem relevantes para a tarefa**. Não crie novos manuais nem reabra decisões já resolvidas.

## Execute nesta ordem

1. **Localize a tarefa.** Verifique branch, PR, arquivos afetados e resultado pretendido; leia o código atual. Etapa 2 em desenvolvimento: [PR #24](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/24) (E1) → [PR #25](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/25) (interface) → [PR #26](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/26) (conferência escolar). **Confirme o estado remoto antes de agir**; essa sequência é uma referência, não uma ordem automática de merge.
2. **Implemente o menor incremento útil.** Use `src/App.jsx`, os componentes, o domínio, o Firebase e os cadastros existentes. Reaproveite escola/chamado/equipamento; sem duplicar registros, refazer a aplicação ou presumir valores. **Quem decide execução, apuração e atesto é o gestor/fiscal, não o sistema.** Ofereça edição e alertas informativos em vez de travas administrativas inventadas.
3. **Quando houver UI, aplique a skill local** [`gop-clima-visual-quality`](.agents/skills/gop-clima-visual-quality/SKILL.md) **antes de alterar JSX/CSS**. Preserve design real (`src/index.css`, `src/styles/`), Outfit/Inter, Lucide, temas e navegação. O objetivo é **menos leitura, menos cliques e mais respostas/ações contextuais**, não mais cartões. Ferramentas externas são opcionais, conforme disponibilidade; não depender de TinyFish nem de serviços pagos.
4. **Teste, olhe e entregue.** Rode `npm run lint`, `npm test`, `npm run build` e testes Firestore/Playwright pertinentes. **UI exige inspeção de telas reais** em desktop, monitor largo e mobile (tema claro/escuro), com navegação, foco, contraste e overflow verificados. Classifique falhas; não atualize snapshots cegamente. Informe PR, SHA, o que funciona, evidências visuais e pendências. **Não faça merge/deploy de produção sem aprovação.**

## Três decisões que não podem ser contrariadas

- **DP-001 — Autonomia:** ferramentas apoiam e calculam; gestor/fiscal ajusta, decide e atesta nos instrumentos próprios. Sem obrigação administrativa criada pelo software.
- **DP-002 — Continuidade:** interfaces e dados novos são extensão do GOP Clima existente, nunca uma aplicação paralela com outra identidade.
- **DP-003 — Inteligência visual:** valor do dashboard = resposta útil + próxima ação + acesso aos registros. Não criar gráficos fictícios, texto excessivo ou formulários redundantes. O conjunto visual do Gemini foi reprovado; só conceitos pontuais podem inspirar.

## Consulta adicional por necessidade (não é leitura obrigatória em sequência)

- **Escopo e arquitetura:** [Concepção Funcional v1.0](docs/etapa-2/concepcao/documento-integral-v1.0/README.md) e [Carta de Princípios](docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md).
- **Decisões detalhadas:** `docs/etapa-2/decisoes/DP-00*.md`.
- **Etapas futuras:** `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md`. O handoff antigo F1–F4 é **registro histórico**, não ordem para refazer trabalho.
- **Catálogo de ferramentas e critérios visuais extensos:** `docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md`, somente quando precisar escolher recurso, investigar falha visual ou validar captura.

**Regra final:** defeito comprovado se corrige; decisão legítima do usuário se torna opção editável. Nada de loops de documentação ou refinamento sem ganho verificável.
