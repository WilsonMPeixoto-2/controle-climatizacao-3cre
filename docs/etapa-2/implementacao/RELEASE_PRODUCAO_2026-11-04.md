# GOP Clima — estado comprovado da produção (04/11/2026, horário de Brasília)

**Natureza:** fotografia verificável de uma release; não substitui código, condições do TR, decisões de produto ou testes posteriores. Referência principal atual para `README.md`, `docs/ESTADO_DO_PROJETO.md` e `AGENTS.md`.

## Identidade e publicação

| Item | Registro conferido |
|---|---|
| Repositório | [WilsonMPeixoto-2/controle-climatizacao-3cre](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre) |
| Branch de produção | `master` |
| PR funcional | [#35 — Gestão Financeira em duas abas](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/35), integrado por squash `1d567e7faa9d048c8bfe2fa2b223611fa8e22d66` |
| PR documental | [#36 — método Engenharia Comprovada](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/36), integrado por squash `897ff5c4312d598b683c65d3f078c378d72d30bb` |
| Vercel **original** | `controle-climatizacao-3cre` — `prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw` |
| Deployment | `dpl_FTPryGYDv7H6peCR6f3GJia1YFFw`; `production/READY`; SHA `897ff5c` |
| Domínio principal | https://controle-climatizacao-3cre.vercel.app/ — HTTP 200; alias confirmado no mesmo deployment |
| Domínio secundário da equipe | `controle-climatizacao-3cre-wilson-m-peixotos-projects.vercel.app` — alias confirmado no mesmo deployment |
| Persistência | Projeto Firebase/Firestore existente `gestao-da-climatizacao-3-cre`, sem criar banco paralelo |
| Política de publicação | `vercel.json` mantém `git.deploymentEnabled: false`; deployments explícitos, não automáticos por push |
| PRs remanescentes | Nenhum aberto ao final da publicação |

**Testes do código:** [GitHub Actions CI #278](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41944618519), commit `08752753bcc41f93d03a59234bb8f453079c90ab`, **4/4 jobs aprovados** (lint/unitários/build, regras e adapter Firestore, backend financeiro e navegador em duas sessões, Playwright operacional). Os merges subsequentes não alteraram arquivos executáveis: #36 é somente documental.

**Inspeção pós-publicação, somente leitura:** o navegador carregou dashboard, mapa e chamados sem erro visual observado, mostrou “Base online”, “Base Firestore carregada com sucesso!” e “Firestore financeiro conectado”. A Gestão Financeira apresentou as duas abas **Visão financeira** e **Atendimentos**. No formulário de estimativa, equipamento **Split / 12.000 BTU** recebeu automaticamente **R$ 239,7350**. O formulário foi cancelado sem criar dados. **Isso não equivale a novo teste de gravação cloud da precificação publicada.** Consulte [relato anterior de escrita/leitura remota](INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md) e os testes emulados de integração.

## O que está implementado e o que significa

| Capacidade | Estado atual verificável | Fronteira |
|---|---|---|
| Operacional | Escolas, chamados, status, histórico, notificações/comunicações, dossiê, painéis e mapa; Firestore com realtime | Não significa serviço executado ou atestado |
| Vínculo financeiro | Contexto do chamado/escola/equipamento abre estimativa, mantendo `ticketIds`; grupos de itens permitem diversas categorias | Não gera obrigação de pagamento |
| Precificação | 14 faixas técnicas CRE03 (TR, itens 29–42); **11 preços P01–P11** da memória Excel; por tipo e BTU; edição manual, fonte e versão | Itens 37, 38 e 42 não têm preço na memória (quantitativo inicial zero); ausência não é R$ 0 |
| Memória financeira | `CLIMATIZACAO_V8_7_2_Painel_Lateral.xlsx`, `CATEGORIAS!F6:F16`, coluna `UNIT_CALC`, com 4 casas; apoio em `03_Faturamento_Conformidade_e_Pagamentos_V4_1_Visualizacao.pdf` | Valores adotados para **cálculo operacional** por decisão do responsável; não transformar estimativa em medição/fatura |
| Controle de teto | Referência inicial: **3.061 equipamentos × 4 ciclos** ponderados por categoria = **R$ 2.035.894,27** | Teto histórico não é saldo de empenho, medição ou pagamento |
| Atendimentos | Grupos e quantidades; valor nominal versus acréscimo dependente de cobertura; registro e revisão no Firestore; concorrência e histórico | Valores persistidos são estimativas, não serviços atestados |
| Previsão e consultas | Competência mensal, filtros, gráficos/indicadores e navegação para registros; consulta de histórico set/out/2026 apenas operacional | Não há série real completa de faturamento e caixa |
| Visitas | Planejar, alterar e reprogramar no **localStorage**; permite iniciar atendimento contextual | Não é agenda compartilhada entre servidores nem OES formal |
| Financeiro integral | Medição aceita, glosas/IMR, NF, retenções, liquidação, pagamentos, empenho/saldo | **Ainda não implementados como fluxo de registros financeiro/contratual completo** |
| Identidade/acesso | Sem login durante desenvolvimento, conforme DP-004 | Antes da entrega institucional será necessário controle de perfis e autorização |

**Duas populações diferentes:** cadastro histórico do site com **134 escolas**; levantamento contratual com **136 designações**; quantitativo inicial TR de **3.061 equipamentos** versus **3.253 registros individualizados** em levantamento posterior. Não equiparar os conjuntos nem ampliar direitos contratuais automaticamente. O status de reconciliação deve ser visível no fluxo futuro.

## Participação e aprendizado do Gemini Antigravity

**Reconhecimento técnico e rastreabilidade:** a investigação do Gemini Antigravity, apoiada em GitHub, Vercel, Chrome DevTools MCP e navegador autenticado, isolou a causa da falha **pré-build** `Resource provisioning failed`: integração legada Supabase suspensa (`store_c7xuboFdk7syqNN0`/`icfg_9o0c1iOohLBagZF5MTgo6pyS`). O vínculo foi retirado do **projeto Vercel consumidor**, preservando Firestore e o projeto original. A recuperação foi confirmada pelo deployment anterior `dpl_2QiCi9uDRvQu8Bqvx7t3SvouVYxB` `READY`; a publicação posterior dos PRs #35/#36 tomou essa infraestrutura como base.

O protocolo derivado está versionado em [Engenharia Comprovada](../../../.agents/skills/diagnostico-entrega-verificada/SKILL.md), [incidente de provisionamento](../../engineering/INCIDENTES_E_VERIFICACAO_2026_11.md) e [política de deploy](../../POLITICA_DEPLOY_VERCEL.md). **Não confundir** essa contribuição de engenharia com a proposta visual exploratória Gemini V8.9: o acervo [Gemini V8.9](../referencias/gemini-v8.9/README.md) documenta limites e a decisão de não transplantar integralmente sua interface. O trabalho e as críticas devem continuar acessíveis.

## Histórico de releases e próximas decisões

- [Release de homologação em 03/11/2026](RELEASE_CONSOLIDADA_2026-11-03.md): PR #32, estágio anterior ao Firestore cloud financeiro e aos novos preços; **registro histórico**, não estado atual.
- [Integração remota da gravação financeira](INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md): evidência cloud do PR #34 e execução sintética, anterior ao deploy de 04/11.
- [Roteiro de conclusão funcional](../planejamento/PLANO_CONCLUSAO_FUNCIONAL_2026_11.md): próximos incrementos, critérios de aceite e limites do produto.
- [AGENTS.md](../../../AGENTS.md) e **DP-001 a DP-004**: precedência de decisões, sem recriar sistema paralelo e sem login nesta fase de desenvolvimento.

**Estado final:** publicação operacional validada; dois PRs integrados; automação de preço observada em navegador; finalização contratual de medição → faturamento → pagamento ainda pendente e deve ser implementada como **novos registros explícitos**, nunca inferida do status dos chamados.
