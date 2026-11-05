# GOP Clima · Etapa 2 — estado e referências atuais

**Atualizado em 04/11/2026 (Brasília).** O estado vigente é [release de produção de 04/11](implementacao/RELEASE_PRODUCAO_2026-11-04.md) e [roteiro de conclusão funcional](planejamento/PLANO_CONCLUSAO_FUNCIONAL_2026_11.md). A [entrega do PR #32 em 03/11](implementacao/RELEASE_CONSOLIDADA_2026-11-03.md) continua acessível como **marco histórico**, não estado atual.

## Situação por capacidade

| Capacidade | Estado na publicação de 04/11 |
|---|---|
| Camada operacional (escolas, chamados, dossiê, mapas, comunicações, histórico) | **Publicada no projeto Vercel original**; Firebase/Firestore compartilhado |
| Gestão Financeira em duas abas | **Publicada:** Visão financeira + Atendimentos, indicadores, navegação e filtros |
| Referência por equipamento | **Publicada:** 11 valores P01–P11 (memória `CATEGORIAS!F6:F16`, V8.7.2); quatro casas decimais e enquadramento por BTU; 14 faixas previstas |
| Chamado → estimativa | **Implementado:** escola/identificador/BTU e `ticketIds` reaproveitados, composição por grupos e histórico de revisões |
| Gravação Firestore financeira | **Conexão online visível e testada anteriormente no cloud**; suíte CI inclui emulador e duas sessões. **A nova precificação foi testada na UI publicada sem salvar**, não em gravação cloud pós-release |
| Programação de visitas | **Local** no navegador; persistência compartilhada pendente |
| Histórico de corretivas set/out | Consulta de origem operacional, não medição/aceite |
| Medição/aceite, glosa/IMR, NF, retenção, liquidação, pagamento, empenho | **Não implementados como cadeia financeira operacional** |
| Login/perfis | Adiados durante desenvolvimento por [DP-004](decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md); necessários antes da entrega institucional |

**Publicação:** [projeto original](https://controle-climatizacao-3cre.vercel.app/), commit `897ff5c`, deployment `dpl_FTPryGYDv7H6peCR6f3GJia1YFFw`, `READY`; [CI #278](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41944618519), 4/4 jobs aprovados. PRs [#35](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/35) e [#36](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/36) incorporados à `master`.

## Continuidade do desenvolvimento

**Próxima entrega:** P0 (verificar escrita cloud da precificação já publicada) e P1 (transformar agenda local em agenda compartilhada), seguindo [plano P0–P6](planejamento/PLANO_CONCLUSAO_FUNCIONAL_2026_11.md). **Não reimplementar** as capacidades já presentes no #32/#35, nem acrescentar novos módulos desconectados.

- **Agentes:** [AGENTS.md](../../AGENTS.md), [Engenharia Comprovada](../../.agents/skills/diagnostico-entrega-verificada/SKILL.md) e [skill visual](../../.agents/skills/gop-clima-visual-quality/SKILL.md).
- **Decisões vigentes:** [Carta de Princípios](concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) e [DP-001/002/003/004](decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md).
- **Fontes de negócio:** [concepção original](concepcao/documento-integral-v1.0/README.md), [roteiro E1–E5 histórico](planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md), [arquitetura Firebase](../ARQUITETURA_FIREBASE.md).
- **Referências de implementação:** [Firestore cloud financeiro](implementacao/INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md), [histórico set/out](implementacao/IMPORTACAO_HISTORICA_SET_OUT_2026.md), [conferência de escolas](implementacao/CONFERENCIA_REGISTROS_ESCOLAS.md).
- **Gemini Antigravity (contribuição técnica):** [diagnóstico/recuperação Vercel](../engineering/INCIDENTES_E_VERIFICACAO_2026_11.md) e [política de deploy](../POLITICA_DEPLOY_VERCEL.md). **Protótipo Gemini V8.9** é [referência exploratória avaliada, não implantação integral](referencias/gemini-v8.9/README.md).
- **Qualidade visual:** [protocolo](qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md) e evidências de inspeção `evidencias/etapa-1`.

**Regra de leitura:** código atual + decisões vigentes + release comprovada prevalecem sobre cronologias anteriores; documentação antiga não deve ser eliminada nem reinterpretada como ação pendente.
