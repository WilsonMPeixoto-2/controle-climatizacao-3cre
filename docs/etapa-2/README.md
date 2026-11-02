# GOP Clima · Etapa 2 — Índice rápido

**Para executar uma tarefa no Codex, comece pelo [`AGENTS.md`](../../AGENTS.md).** Ele contém o roteiro de quatro passos e aponta para a skill visual **somente quando a tarefa envolve interface**. Este diretório é um acervo de referência, não uma fila de leitura obrigatória.

## O que está em desenvolvimento (confirme o estado remoto)

| Entrega | PR | Resultado |
|---|---|---|
| Fundação de referência financeira E1 | [#24](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/24) | Cálculo de referência consultivo, sem atesto ou faturamento automático |
| Integração visual F1–F4 | [#25](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/25) | Nova área financeira, contexto em chamados e consulta escolar |
| Conferência operacional por escola | [#26](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/26) | Escolas com registros a conferir, dossiê e acesso aos chamados |

**São PRs empilhados, em rascunho e não publicados automaticamente.** O próximo trabalho deve verificar os testes, a interface renderizada e as regressões antes de abrir novas funcionalidades. **CI verde não substitui homologação visual.**

## Quando consultar qual referência

- **Decisão ou dúvida de produto:** [Carta de Princípios](./concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) e [Concepção Funcional v1.0](./concepcao/documento-integral-v1.0/README.md).
- **Flexibilidade, integração e dashboards:** [DP-001](./decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), [DP-002](./decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md), [DP-003](./decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md).
- **Tarefa com alteração visual:** [skill GOP Clima Visual Quality](../../.agents/skills/gop-clima-visual-quality/SKILL.md) e, **somente se precisar aprofundar**, [protocolo de ferramentas](./qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md).
- **Planejar E3–E5:** [roteiro técnico por entregas](./planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md). **Não refazer E1/F1–F4 que já estão em PR.**
- **Conferência escolar:** [escopo e fontes](./implementacao/CONFERENCIA_REGISTROS_ESCOLAS.md).

## Histórico, não instrução ativa

O [handoff inicial F1–F4](./planejamento/HANDOFF_CODEX_PRIMEIRA_IMPLEMENTACAO_VISUAL.md) e os arquivos de prototipação Gemini documentam decisões anteriores. **Não são um roteiro para reimplementar o que já foi construído.** O conjunto visual do Gemini foi reprovado, embora algumas ideias funcionais possam ser aproveitadas.

**Princípio permanente:** o sistema deve reduzir o trabalho do servidor, não aumentar leitura, cadastros, travas ou documentação.
