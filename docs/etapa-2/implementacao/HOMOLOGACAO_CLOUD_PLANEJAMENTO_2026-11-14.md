# GOP Clima · Homologação remota do planejamento compartilhado

**Data da homologação:** 14/11/2026 · **Projeto Firebase:** `gestao-da-climatizacao-3-cre` · **Ambiente:** produção

## Evidência de ponta a ponta

- **PR #43:** https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/43
- **Master após o merge do teste:** `174fb32d5e15e45d376a13379edddea999c3f232`
- **CI de regressão:** 4/4 verificações aprovadas: https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/43650407305
- **Teste real no domínio oficial:** https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/43650751421
- **Resultado:** 1 teste Playwright no site publicado, aprovado em 14/11/2026 às 19:58 (Brasília); arquivo de evidências `gop-cloud-planning-live`, artefato GitHub `14135448379`.

### Ações efetivamente comprovadas

1. Acessar https://controle-climatizacao-3cre.vercel.app e carregar o editor de planejamento conectado ao Firestore.
2. Incluir registro marcado expressamente `TESTE SINTETICO GOP CLIMA - NAO E ESCOLA` no código `950474`, sem alterar escolas existentes.
3. Conferir a leitura pela segunda sessão independente (tela mobile 390px) e pela primeira (desktop 1280px).
4. Alterar o mês relativo e a quantidade de aparelhos pela segunda sessão; observar atualização na primeira.
5. Recarregar a página e confirmar o mesmo registro no Firestore real.
6. Arquivar o registro fictício mediante a ação de restauração; confirmar ausência na lista de escolas ativas.

O teste **não excluiu os documentos de revisão**, preservando sua rastreabilidade. Não escreveu em `escolas`, `chamados`, `programacao_visitas` ou `atendimentos_economicos`.

## Configuração e publicação

- Regras do Firestore publicadas pela API oficial no run https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/42634505307
- Ruleset: `projects/gestao-da-climatizacao-3-cre/rulesets/d34ae6b5-da0a-411b-8843-fe20679817d9`
- SHA-256 das regras em produção verificado: `456af9c356c4cc913a370fa58297b9f5d1e198e6137f1ae20fc9820597cb6ecc`
- Produção Vercel permanece no **commit de aplicação** `39f73802b911b1e5529d9c2983432dbed7bebbf6` e deployment `dpl_FLeotzEqgaPEAbsP8Wv4m61rBEy4`. O commit posterior `174fb32d` contém somente testes/workflow, sem alterar o frontend.

## Limites da homologação

O teste de escrita comprovou especificamente **ajustes de planejamento compartilhado**. Ele não equivale à validação de toda a cadeia de medição, atesto, notas fiscais, liquidação e pagamento, ainda não integralmente desenvolvida. Não valida uma política de identidade/autoria individual de usuários (DP-004). Outras coleções exigem testes próprios.

## Próxima prioridade

Concluir o incremento **P2 (serviço executado e medição informada)** conforme `PLANO_CONCLUSAO_FUNCIONAL_2026_11.md`, sem declarar atestação jurídica automática, priorizando edição amigável, referências externas e separação entre previsto, executado e aceito.
