# Correção de arquitetura — gravação financeira no Firebase existente

**Data:** 03/11/2026 · **Revisão:** PR #34 · **Situação:** regras publicadas manualmente pelo responsável e acesso financeiro comprovado no Firestore cloud; publicação do frontend e aceite no domínio público em conclusão.

## Decisão expressa do responsável pelo produto

O GOP Clima já possui um projeto Firebase operacional. **Usá-lo também para a gravação financeira.** Não criar outro banco, não manter uma conexão somente ao emulador e **não exigir login individual na fase atual de desenvolvimento**, conforme a orientação posterior à DP-004. Adiar o portal de identidades para antes da entrega institucional. A configuração de sessão não equivale à autenticação individual.

## O que muda no código

- `attendanceDevelopmentClient.js`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` e na `.firebaserc` (`gestao-da-climatizacao-3-cre`), `VITE_FIREBASE_APP_ID` e demais valores usados pela aplicação operacional agora também alimentam a persistência financeira. A mesma instância nomeada Firebase é reaproveitada, evitando aplicativo paralelo.
- A variável `VITE_FINANCE_FIRESTORE_EMULATOR=127.0.0.1:8082` continua selecionando **explicitamente** o emulador local isolado para testes e desenvolvimento, sem modificar o Firebase remoto.
- `attendancePersistence.js` continua usando transação com revisão esperada, snapshots imutáveis e `onSnapshot`, sem migrar valores ou alterar chamados.
- `firestore.rules` recebeu validadores de `atendimentos_economicos` e `revisoes` já testados localmente. Regras anteriores das escolas/chamados/contadores/históricos permanecem inalteradas. Esta etapa não configura perfis ou cadastros de login.

## Ativação efetiva no projeto já existente

A publicação da interface na Vercel **não atualiza as regras do Firebase**. A ordem operacional é:

1. Verificar o projeto Cloud Firestore usado pelo frontend em `VITE_FIREBASE_PROJECT_ID`, sem expor variáveis administrativas nem credenciais em repositório.
2. Após o CI verde do PR #34, aplicar as regras versionadas pelo Firebase CLI autenticado, **no mesmo projeto**:

   ```bash
   npx firebase-tools@15.26.0 deploy --only firestore:rules --project gestao-da-climatizacao-3-cre
   ```

   A `.firebaserc` do repositório identifica esse projeto como padrão. Antes do deploy, confirme que a variável de produção `VITE_FIREBASE_PROJECT_ID` aponta para o mesmo ID. A implantação exige autorização administrativa na conta Firebase, não login dos futuros usuários do GOP Clima.
3. Verificar no console Firebase que as regras estão publicadas e que os caminhos `atendimentos_economicos` e `revisoes` estão contemplados; **não afirmar deploy concluído sem essa evidência**.
4. Realizar merge do PR e publicar no projeto Vercel `climatizacao-firebase-homologacao`, com SHA da `master` verificado.
5. **Prova remota de aceitação:** abrir o endereço publicado em dois navegadores/dispositivos; criar atendimento econômico **sintético**, identificar ID, revisão e data; observar atualização em ambos; editar quantidade/competência no segundo; confirmar apenas uma versão corrente, versões anteriores no histórico e a previsão mensal alterada. Atualização concorrente deve preservar erro de conflito; o teste não pode criar nota fiscal, pagamento ou atesto.
6. Caso os passos remotos falhem, registrar o erro e corrigir as regras/integração sem declarar entrega operacional. Não desativar a validação dos dados para mascarar um erro.

## Evidências automatizadas

- `npm test`: inclui `test/attendance-development-client.test.mjs`, que exige o uso do Firebase existente por padrão e a precedência do emulador explicitamente configurado.
- `npm run test:finance:cloud-rules`: usa **as regras versionadas do projeto operacional** no emulador 8080 com chamadas do SDK sem login, cobrindo escrita, leitura, concorrência, versões, escolas/chamados, precisão e rejeição de documentos inválidos.
- `npm run test:finance:backend`: preserva o fluxo anterior do emulador de desenvolvimento, 8082.
- `npm run test:finance:e2e`: fluxo financeiro entre duas sessões do navegador, com registros sintéticos no emulador.
- **Os testes do emulador não substituem a prova remota** do passo 5.

## Limites

Este incremento apenas conecta atendimentos econômicos, suas revisões e previsões ao banco já existente. A programação de visitas ainda tem seu próprio rascunho local; medição, atesto, glosa, faturamento, liquidação e pagamento não são criados automaticamente. Não se presume autenticidade individual de ações sem login.

**Regra de governança:** uma alteração no modelo de persistência ou no escopo operacional deverá ser comunicada ao responsável e por ele decidida antes da execução, sem tratar experimentos técnicos como decisões de produto.

## Verificação de ativação — 03/11/2026

O responsável informou a publicação de `firestore.rules` da branch deste PR no projeto `gestao-da-climatizacao-3-cre`, banco `(default)`. A conferência independente foi funcional, sem credencial administrativa para baixar o texto da release: leitura, criação/edição atômica em `atendimentos_economicos`, consulta de `revisoes`, recusa HTTP 403 de alteração de revisão antiga e de incremento sem snapshot correspondente. SHA-256 do arquivo versionado: `e2ffb276659a94bbbff83a7144eebef50b08288627157ad93ca9f52e4d371dc3`.

Antes do deploy, o build do PR #34 conectado ao **Firebase remoto** comprovou duas sessões, recarga, histórico, conflito por versão desatualizada e reconciliação da previsão. Registro sintético exclusivo `06202454-8de2-4fc4-9e2c-8202ba7a82f7`, identificado como teste, competências 2099-12/2099-11; referência fictícia de R$ 12,3456, composição de 2 → 3 unidades (R$ 24,6912 → R$ 37,0368). A comparação canônica dos documentos confirmou escolas, chamados e atendimentos anteriores inalterados. A execução final no site deve encerrar esse registro com valor corrente zero, preservando suas revisões de teste.

O checkpoint `e30625d` foi comparado com a `master`/PR #34. Contém outra implementação da previsão mensal, não correções do acesso Firestore. A previsão vigente já veio do PR #33; portanto o checkpoint permanece preservado em `feat/etapa2-previsao-mensal-compartilhada`, sem cherry-pick nem duplicação de componentes nesta entrega.

A verificação reproduzível está em `scripts/verify-finance-remote.mjs`. É **manual e escreve um registro sintético**, não integra o CI nem altera cadastros existentes. Reutilize a mesma pasta de evidências para continuar o mesmo registro:

```bash
NODE_USE_ENV_PROXY=1 node scripts/verify-finance-remote.mjs https://climatizacao-firebase-homologacao.vercel.app /caminho/privado/evidencias-financeiro
```

O script usa apenas o acesso público previsto nas regras, sem autenticação individual; salva IDs, resultados e capturas. As verificações locais de regras continuam usando exclusivamente emuladores. A confirmação de publicação e os resultados no domínio serão registrados abaixo após o deployment READY.
