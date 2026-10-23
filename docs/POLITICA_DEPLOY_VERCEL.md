# Política de implantação econômica | CLIMATIZAÇÃO (3ª CRE)

**Data:** 23/10/2026  
**Objetivo:** impedir o consumo da quota Hobby da Vercel por deploys automáticos e duplicados durante o desenvolvimento.

## Diagnóstico confirmado
- O plano Hobby da Vercel possui limites documentados de **100 deployments em 24 h**, **32 builds em 1 h** e **1 build concorrente**. São limites distintos e por isso o bloqueio horário pode ocorrer antes da quota diária.
- Dois projetos Vercel foram associados ao mesmo GitHub `WilsonMPeixoto-2/controle-climatizacao-3cre`:
  - Antigo: `controle-climatizacao-3cre` (`prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw`); o Supabase original está inativo.
  - Operacional Firebase: `climatizacao-firebase-homologacao` (`prj_dAaYkrr2kp9F2RgvqS7L5j9ry1x2`); serve o alias público `controle-climatizacao-3cre.vercel.app`.
- A API retornou **17 deployments** do projeto antigo (todos com erro) e **19** do novo na sequência de trabalho de 23/10/2026: **36 registros do CLIMATIZAÇÃO**. A maioria das alterações gerou um deployment para **cada** projeto; também houve recriações manuais para commits já compilados automaticamente.
- A listagem da equipe para a data UTC 23/10/2026 somou **126 registros de deployments**: 36 dos dois projetos CLIMATIZAÇÃO, aproximadamente 75 do projeto RADAR PDDE de testes, e 15 de outros projetos. Entre os 126 registros, 71 constavam como `CANCELED`, 18 `ERROR`, 37 `READY`. Estes são **registros da API**, não um extrato preciso de faturamento ou do medidor interno da quota (rejeições/cancelamentos podem receber tratamento específico).

## Correção aplicada
- `vercel.json` na raiz da branch `master` contém:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": { "deploymentEnabled": false }
}
```

- Essa configuração oficial desativa **deploys automáticos por push** de todas as branches em ambos os projetos conectados ao mesmo repositório. Não impede publicações explícitas via API, dashboard ou CLI.
- Projeto Vercel antigo: `previewDeploymentsDisabled=true` aplicado como proteção adicional. O desligamento definitivo da integração Git do projeto antigo deve ser feito em **Settings > Git > Connected Git Repository > Disconnect**. Não excluir o projeto nem mexer no domínio sem plano de transferência.
- Não usar `Ignored Build Step` como solução principal: cancelamentos posteriores ao gatilho ainda podem consumir quota de deployments.

## Fluxo aprovado para próximas mudanças
1. Agrupar correções em uma branch de trabalho e commits de desenvolvimento. **Nenhum commit individual deve solicitar deployment**.
2. Executar instalação, lint, testes e build no ambiente de desenvolvimento/CI, sem criar deploys Vercel a cada alteração.
3. Fazer integração à `master` depois das verificações, preservando um commit de release identificável.
4. Para validação remota, criar **uma prévia manual quando realmente necessária**, usando somente o projeto Firebase operacional; nunca criar outra no projeto antigo.
5. Para produção, criar **uma única implantação explícita** do commit validado no projeto Firebase, aguardar `READY` e então atribuir o alias histórico `controle-climatizacao-3cre.vercel.app`. Não criar segundo deployment se o mesmo commit já possui build `READY` utilizável.
6. Conferir alias, funcionamento do Firebase e mapa. Registrar commit/deployment no changelog. Para rollback, remapear o alias ao deployment anterior `READY`, sem novo build.
7. Ao abrir exceção para automação no futuro, revisar antes `git.deploymentEnabled` e o vínculo duplo na Vercel.

## Estado do produto na data da auditoria
- Site público continua no deployment operacional `dpl_4CwnzFynwX62T8AEEhJYMEMkvtkD`, commit `ff8a5eca`, com React 19.3.1 e Firebase 13.1.0.
- A `master` recebeu o merge da migração Firebase e o prontuário escolar. Esse commit integrado **não deve ser descrito como publicado** enquanto não houver um deployment explícito `READY` e atualização confirmada do alias.

## Fontes oficiais
- https://vercel.com/docs/limits
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/project-configuration/git-settings
- https://vercel.com/docs/project-configuration/project-settings
