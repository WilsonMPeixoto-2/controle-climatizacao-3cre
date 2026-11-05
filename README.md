# GOP Clima · Controle de Climatização da 3ª CRE

**Sistema web operacional e gerencial** para registrar e acompanhar chamados de manutenção de aparelhos de ar-condicionado nas escolas da 3ª CRE/SME-RJ, relacionando demandas, escolas, visitas planejadas e referências financeiras do contrato. A aplicação **não é** uma transcrição das planilhas nem substitui atos administrativos, o CMMS da contratada ou os instrumentos oficiais de fiscalização.

[**Abrir o sistema em produção**](https://controle-climatizacao-3cre.vercel.app/) · [**Estado comprovado da release de 04/11/2026**](docs/etapa-2/implementacao/RELEASE_PRODUCAO_2026-11-04.md) · [**Próximas entregas**](docs/etapa-2/planejamento/PLANO_CONCLUSAO_FUNCIONAL_2026_11.md) · [**Orientação dos agentes**](AGENTS.md)

## Situação atual · 04/11/2026 (horário de Brasília)

A versão atual foi publicada na **Vercel original** `controle-climatizacao-3cre`, projeto `prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw`, deployment **`dpl_FTPryGYDv7H6peCR6f3GJia1YFFw`**, `production/READY`, commit **`897ff5c4312d598b683c65d3f078c378d72d30bb`**. O domínio oficial respondeu HTTP 200 e foi verificado em navegador real.

As entregas mais recentes são o [PR #35](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/35) (Gestão Financeira em duas abas, vínculo chamado → atendimento, precificação por categoria/BTU) e o [PR #36](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/36) (metodologia Engenharia Comprovada, registros de incidentes). Ambos estão incorporados à `master`; não havia PRs abertos ao encerrar a implantação.

**Teste automatizado pré-merge:** [CI #278](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41944618519), **4/4 jobs aprovados** (lint, unitários, build, Firestore e Playwright). **Verificação pós-deploy:** chamados, dashboard, mapa, abas **Visão financeira** e **Atendimentos**, conexões Firestore e preenchimento automático de **R$ 239,7350** para um Split de 12.000 BTU. O formulário foi cancelado sem gravar; **o teste não comprovou nova escrita cloud com esse preço específico na release publicada**. Existem evidências anteriores de testes reais de escrita/leitura financeira no Firestore, documentadas [aqui](docs/etapa-2/implementacao/INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md).

### Capacidades existentes

| Área | O que o usuário já encontra | Limite relevante |
|---|---|---|
| Chamados e escolas | Cadastro, consulta, fluxo de status, histórico, dossiê, indicadores, mapa, comunicações | Chamado concluído não é serviço medido |
| Firestore operacional | Banco cloud compartilhado e atualização realtime; IDs sequenciais transacionais por exercício | Sem autenticação individual durante desenvolvimento |
| Gestão Financeira | Duas abas, filtros por competência/escola, indicadores, gráficos e detalhamento dos atendimentos | Painel não representa ainda faturamento e caixa completos |
| Atendimento econômico | Entrada contextual a partir da escola/chamado/programação; grupos, quantidades, cobertura, revisões e fonte dos valores | Estimativa não é atesto, NF ou pagamento |
| Preço de manutenção | Identificação automática da faixa CRE03; **11 preços unitários P01–P11**, com precisão de quatro casas | Categorias TR sem preço na memória continuam sem valor, nunca zero |
| Planejamento de visitas | Criar, editar e reprogramar visitas, iniciar estimativas | **localStorage**: ainda não é agenda compartilhada |
| Corretivas set/out | Consulta do histórico operacional importado, com origem e limitações | Não comprova execução/aceite da fiscalização |

### Tabela de preços aplicada

A tabela é carregada de `src/data/cre03SignedPriceSchedule.js` e consumida por `src/domain/cre03TrCatalog.js`. Origem: planilha **`CLIMATIZACAO_V8_7_2_Painel_Lateral.xlsx`**, aba `CATEGORIAS!F6:F16` (`UNIT_CALC`), confrontada com o relatório **`03_Faturamento_Conformidade_e_Pagamentos_V4_1_Visualizacao.pdf`**. **Os preços devem ser usados nos cálculos operacionais**, conforme orientação expressa do responsável pelo projeto, e não exigem outra planilha para estimar atendimentos.

A referência agregada da memória é de **3.061 aparelhos, quatro ciclos e R$ 2.035.894,27**. O valor **unitário de uma manutenção** não é multiplicado por quatro ao criar um atendimento. Itens do TR sem preço (37, 38 e 42, com quantitativos iniciais zero) permanecem sem referência; valores de exemplo são restritos aos testes. Veja a [release detalhada](docs/etapa-2/implementacao/RELEASE_PRODUCAO_2026-11-04.md) para fonte/precisão/limites.

### O que ainda não está concluído

**Não existe ainda fluxo gerencial completo de** medição e aceite de serviços, glosas/IMR, notas fiscais, retenções, liquidação informada, pagamentos, empenhos/saldos e reconciliação entre essas etapas. Esses dados não são deduzidos do andamento dos chamados. A agenda de visitas não é compartilhada entre navegadores.

O plano é evoluir **o mesmo site** em incrementos verificáveis: [P0 a P6 — plano de conclusão funcional](docs/etapa-2/planejamento/PLANO_CONCLUSAO_FUNCIONAL_2026_11.md). O login/perfis institucionais são exigências anteriores à entrega aos servidores, **não** prioridade durante o desenvolvimento, conforme [DP-004](docs/etapa-2/decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md).

## Arquitetura e dados

- **Frontend:** React 19, Vite 8, Firebase Web SDK, Leaflet, Lucide, Zod, Vercel Analytics; temas claro/escuro e interface responsiva.
- **Persistência:** Firebase Cloud Firestore **`gestao-da-climatizacao-3-cre`**, único backend operacional e financeiro ativo. Coleções operacionais `escolas`, `chamados`, `historico`, `modelos_email` e `contadores`; registros financeiros `atendimentos_economicos` e revisões relacionadas, conforme `firestore.rules` e os serviços de infraestrutura.
- **Programação:** visitas ainda guardadas no armazenamento local do navegador, sem sincronização entre equipes.
- **Legado:** `src/data/db.json` é snapshot/fallback de leitura e não uma segunda base compartilhada. Supabase antigo permanece apenas em referências históricas; não religar a integração de Storage suspensa para executar o projeto.
- **Escopo de dados:** 134 escolas no cadastro histórico do site; 136 designações em levantamento; 3.061 aparelhos previstos inicialmente no TR e 3.253 em inventário posterior. **Diferenças exigem conciliação**, não correção unilateral.

### Configuração local

Copie as variáveis públicas de configuração do Firebase Web App para `.env.local` (não versionar segredos administrativos):

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
```

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run test:firestore
npm run test:finance:cloud-rules
npm run test:finance:backend
npm run test:finance:e2e
npm run test:e2e
```

Os testes de Firestore usam emuladores. Testes remotos autorizados devem trabalhar **somente com dados sintéticos**; o status de `READY` na Vercel, isoladamente, não comprova gravação de negócio. A publicação é **explícita**, pois `vercel.json` mantém `git.deploymentEnabled: false` para economizar quota Hobby. Conferir equipe, project ID, commit, deploy e aliases antes de publicar.

## Contribuições anteriores e documentação de referência

**Gemini Antigravity:** a investigação com navegador autenticado, Chrome DevTools MCP, GitHub e Vercel identificou e corrigiu o bloqueio de provisionamento causado por uma integração Supabase suspensa no projeto original. A recuperação do Vercel, sem criar outro projeto nem excluir o Firestore, viabilizou a release atual. O método está preservado em [registro do incidente](docs/engineering/INCIDENTES_E_VERIFICACAO_2026_11.md), [skill Engenharia Comprovada](.agents/skills/diagnostico-entrega-verificada/SKILL.md) e [política de deploy](docs/POLITICA_DEPLOY_VERCEL.md). Esse trabalho técnico é distinto do [protótipo Gemini V8.9](docs/etapa-2/referencias/gemini-v8.9/README.md), mantido como acervo exploratório não homologado integralmente.

**Leituras atuais:** [estado do projeto](docs/ESTADO_DO_PROJETO.md), [índice da Etapa 2](docs/etapa-2/README.md), [concepção do produto](docs/etapa-2/concepcao/documento-integral-v1.0/README.md), [arquitetura Firestore](docs/ARQUITETURA_FIREBASE.md), [documento histórico de 03/11](docs/etapa-2/implementacao/RELEASE_CONSOLIDADA_2026-11-03.md), [registro de integração Firebase](docs/etapa-2/implementacao/INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md) e [diretrizes de agentes](AGENTS.md).

**Princípio de governança:** código executável, decisões vigentes, CI e estado remoto comprovado prevalecem sobre registros históricos de datas anteriores. **Não alterar `master`, banco real ou deploy de produção sem aprovação do responsável.**
