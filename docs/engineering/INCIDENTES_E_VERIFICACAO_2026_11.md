# GOP Clima — referência de investigação e publicação

**Registro histórico: 04/11/2026.** Não substitui `AGENTS.md`, DP-001 a DP-004, `docs/POLITICA_DEPLOY_VERCEL.md` ou o estado real obtido no remoto.

## Incidente: provisionamento Vercel
- Repositório: `WilsonMPeixoto-2/controle-climatizacao-3cre` (`master`). Projeto **original** Vercel: `prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw`. Ambiente Firebase: `gestao-da-climatizacao-3-cre`.
- Sintoma observado: `Resource provisioning failed` com `BUILD_FAILED`, antes de qualquer build, inclusive para um HTML mínimo. O mesmo commit tinha deploy `READY` em projetos paralelos, o que afastou o código como causa imediata.
- Causa registrada após inspeção autenticada na Vercel: conexão legada com Supabase suspenso, Store `store_c7xuboFdk7syqNN0`, integração `icfg_9o0c1iOohLBagZF5MTgo6pyS`, do projeto Supabase `wmnzcujojlygkcszocwb`, conectada a todos os ambientes e bloqueando `Provisioning Integrations`. A origem foi identificada no painel; não inferir esse mecanismo para outros projetos sem conferência.
- Correção efetuada no painel: `Remove Project Connection` **apenas no consumidor Vercel**; não excluir recurso nem banco Supabase, tampouco mexer no Firestore. Preservar separação de identidades de projeto.
- Verificação independente de publicação: `dpl_2QiCi9uDRvQu8Bqvx7t3SvouVYxB` = `READY`, SHA `2a3ce097386db19c6779d9596affc572866ac3fd`, no projeto original. Domínio `controle-climatizacao-3cre.vercel.app` e alias secundário de equipe apontaram para essa implantação após correção do alias.
- **Limite da evidência:** deploy e domínio `READY` não provam atestação, faturamento ou toda a persistência financeira. Exigir provas do fluxo com Firestore real, não apenas interface e status `Base online`.

## Regras extraídas
1. Resolver vínculo de Storage suspenso no **projeto original**, sem criar projeto Vercel substituto ou base paralela.
2. A política `git.deploymentEnabled: false` é intencional para limitar deploys no plano Hobby; **não** ativar push→deploy automaticamente sem revisar múltiplos projetos conectados, quotas e aprovação.
3. Antes de publicar, registrar `repo SHA → project ID → deployment ID → alias`. Comparar credenciais/variáveis pela presença e escopo sem imprimir valores.
4. Validar escrita/leitura de atendimentos econômicos no Firestore existente com dados sintéticos, duas sessões, histórico, conflito e valores reais não nulos. Disponibilidade da UI não prova essas operações.
5. `PR #35` (Gestão Financeira em duas abas) estava separado da `master` na data do incidente; revalidar estado do PR antes de chamá-lo de publicado.

**Fontes rastreáveis:** [repositório](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre), [publicação original](https://vercel.com/wilson-m-peixotos-projects/controle-climatizacao-3cre), `docs/POLITICA_DEPLOY_VERCEL.md`, `docs/etapa-2/implementacao/INTEGRACAO_FINANCEIRO_FIRESTORE_EXISTENTE.md`.
