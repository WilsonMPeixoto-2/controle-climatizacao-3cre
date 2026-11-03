# GOP Clima · Etapa 2 — Índice de estado e referências

**Atualizado em 03/11/2026.** A revisão consolidada [PR #32](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/32) foi integrada à `master` por squash (`16274ae5`) e publicada no site Firebase de homologação. Os PRs #24–#31 estão encerrados; não existe uma fila de PRs encadeados aguardando merge.

**[Leia primeiro o estado de release e os limites efetivamente entregues](./implementacao/RELEASE_CONSOLIDADA_2026-11-03.md).**

## Situação por capacidade

| Capacidade | Situação em 03/11/2026 |
|---|---|
| Nova área Gestão Financeira, conferência escolar e gráfico de abertura de chamados | Publicada; indicadores **operacionais**, não gastos efetivos |
| Programação mensal de visitas | Publicada como **rascunho local**, com importação/exportação; não sincronizada |
| Composição e prévia das estimativas por atendimento | Publicada na interface; sem catálogo contratual definitivo |
| Persistência, edição concorrente e histórico das estimativas | Testados no **emulador isolado**; salvamento financeiro remoto indisponível |
| Consolidação mensal de despesas, medição, glosa, faturamento, liquidação e pagamento | A desenvolver |
| Login e perfis institucionais | Adiados por [DP-004](./decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md) até antes da entrega aos servidores |

## Fontes de consulta

- **Para Codex/agentes:** [AGENTS.md](../../AGENTS.md); siga sua hierarquia de leitura e a [skill visual](../../.agents/skills/gop-clima-visual-quality/SKILL.md) ao modificar interface.
- **Produto:** [Carta de Princípios](./concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md), [concepção original](./concepcao/documento-integral-v1.0/README.md) e decisões [DP-001](./decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), [DP-002](./decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md), [DP-003](./decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md), [DP-004](./decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md).
- **Arquitetura e regras:** [Firestore](../ARQUITETURA_FIREBASE.md) e [roteiro E1–E5](./planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md), ambos com o recorte temporal claramente identificado.
- **Conferência de escolas:** [critérios de classificação](./implementacao/CONFERENCIA_REGISTROS_ESCOLAS.md).
- **Design:** [protocolo visual](./qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md) e [capturas da Etapa 1](./evidencias/etapa-1/).

Os handoffs iniciais, protótipos Gemini e notas dos PRs #24–#31 são **histórico de decisão**, não instruções para reimplementar tarefas concluídas. A experiência visual ainda depende de homologação humana, mesmo com CI aprovado.
