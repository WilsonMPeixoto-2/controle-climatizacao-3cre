# Estado do Projeto — Controle de Climatização (3ª CRE / GOP)

> **Fonte de estado operacional. Atualizado em 16/08/2026.**
> O código-fonte executável continua sendo a fonte de verdade. Este documento registra o que foi efetivamente conferido no repositório, nos testes e na infraestrutura disponível.

## 1. Produto

Ferramenta de registro e monitoramento dos chamados de climatização das escolas da 3ª CRE para a GOP.

O sistema registra e acompanha demandas, consulta por escola, apresenta painel/alertas/mapa, mantém histórico e auxilia a comunicação. Não possui login individual, por decisão funcional histórica preservada nesta migração.

A partir de 16/08/2026 também está em desenvolvimento um **Prontuário de Climatização por ambientes**, destinado ao levantamento físico simples dos aparelhos existentes em cada escola. Esse prontuário não é inventário patrimonial e, nesta fase, não cruza seus dados com chamados nem altera prioridade, status ou indicadores do sistema operacional.

## 2. Situação da migração Firebase em 16/08/2026

### Concluído e validado

- branch de migração: `feat/firebase-spark-migration`;
- base original de produção: `d88b8a18effc152fed39537bb1d7f29394d3e6b2`;
- `App.jsx` retirado da dependência direta do Supabase;
- fronteira neutra de persistência implantada;
- Firebase SDK / Cloud Firestore implantados no código;
- SDK e CLI Supabase removidos das dependências ativas da release candidate;
- Firestore Security Rules versionadas e testadas;
- criação transacional de chamado + contador + histórico validada;
- atualização de chamado + novos eventos validada de forma atômica;
- identificadores `GOP-AR-{AAAA}-{NNNN}` com exercício dinâmico;
- realtime por `onSnapshot`, sem refetch integral após cada evento;
- Firebase Storage fora desta fase;
- dependências atualizadas;
- problemas antigos de contraste WCAG no tema claro corrigidos;
- snapshots visuais Linux/Chromium consolidados.

### Evidência de qualidade da release candidate

Execução final do gate de release em 16/08/2026:

- `npm audit`: **0 vulnerabilidades**;
- lint: aprovado;
- testes unitários/domínio: aprovados;
- build Vite: aprovado;
- Firestore Security Rules no Emulator: aprovadas;
- adapter/persistência Firestore no Emulator: aprovado;
- Playwright + Axe: **13/13 aprovados**;
- regressão visual: **2/2 snapshots aprovados**.

Commit remoto do hardening validado: `f3f77e93e1de7ea5155be5fe5c634fa3e4d11960`.

## 3. MVP do Prontuário de Climatização

Branch de implementação: `feat/prontuario-climatizacao-mvp`.

### Escopo desta primeira etapa

O objetivo imediato é validar **layout, fluxo de preenchimento e estrutura futura de dados**, sem depender de conexão real com o Firebase.

Implementado:

- acesso por query string `/?levantamento={designacao}`;
- identificação automática da escola a partir de `src/data/db.json`;
- página independente do painel operacional;
- layout claro e responsivo;
- inclusão e exclusão de ambientes;
- tipos de ambiente sugeridos com digitação livre;
- identificação livre do ambiente, como `101`, `A` ou `Bloco B`;
- quantidade de aparelhos por ambiente;
- criação automática de um bloco para cada aparelho;
- campos opcionais de modelo/marca, BTU, tipo e observações;
- situação simples: `Não informado`, `Funcionando`, `Precisa de manutenção`;
- persistência local em `localStorage` durante a fase de protótipo;
- recarga do rascunho após atualizar a página;
- domínio Zod e helpers testados;
- coleção futura `levantamentos_climatizacao/{designacao}` preparada no adapter Firestore;
- Security Rules dessa coleção preparadas e validadas no Emulator;
- teste no Emulator para salvar e reabrir o prontuário por designação;
- cenário Playwright de preenchimento e recarga do rascunho aprovado;
- teste responsivo para viewport de celular incluído.

### O que deliberadamente NÃO ocorre agora

- nenhuma conexão com projeto Firebase real;
- nenhum deploy de regras em ambiente real;
- nenhum cruzamento com chamados;
- nenhum uso dos totais históricos de aparelhos de `db.json` para preencher o novo prontuário;
- nenhuma geração de prioridade ou criticidade;
- nenhum vínculo patrimonial/tombamento;
- nenhum upload de arquivos.

Enquanto `VITE_FIREBASE_*` estiver vazio, o prontuário deve se apresentar como **rascunho local**, nunca como sincronizado online.

## 4. O que NÃO está concluído ainda

A migração de código está pronta, mas o **cutover de produção não deve ocorrer antes do provisionamento do Firebase real**.

No momento desta atualização não foi localizado, nas integrações disponíveis, um projeto Firebase real já criado/configurado para este sistema nem a configuração Web App necessária para a Vercel.

Sem isso, publicar a branch de migração em `master` faria o frontend operar sem persistência Firestore real. Isso seria regressão, não migração concluída.

### Bloqueio externo obrigatório para a futura conexão

É necessário provisionar uma vez, em conta Google/Firebase autenticada:

1. projeto Firebase no plano Spark;
2. Cloud Firestore;
3. Web App Firebase;
4. configuração Web (`apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId`);
5. deploy de `firestore.rules` e `firestore.indexes.json`;
6. carga inicial validada das coleções;
7. variáveis `VITE_FIREBASE_*` na Vercel.

Após isso, a sequência será: validar Firestore real -> validar preview/deploy -> merge em `master` -> verificar produção -> encerrar o legado Supabase ativo.

## 5. Produção e previews

A `master` e o domínio Vercel continuam deliberadamente na versão anterior enquanto o Firebase real não está provisionado.

Isso preserva o funcionamento atual e evita trocar um backend pausado por uma interface que pareça online mas não consiga persistir dados.

Os previews Vercel das branches Firebase e do prontuário apresentaram `Resource provisioning failed` **antes de qualquer build útil**, enquanto o mesmo código compila e é testado no GitHub Actions. Essa falha está classificada como infraestrutura de preview, não como erro da aplicação, e deve ser reavaliada separadamente.

## 6. Modelo Firestore preparado

```text
escolas/{designacao}
chamados/{id_chamado}
historico/{id_evento}
modelos_email/{id}
contadores/chamados-{AAAA}
levantamentos_climatizacao/{designacao}
```

O prontuário usa um documento por escola com ambientes e aparelhos aninhados. Essa coleção existe no contrato de código e nas Security Rules, porém **não existe ainda em um Firebase real conectado ao sistema**.

Anexos não integram o primeiro cutover Spark.

## 7. Regras que permanecem ancoradas

- sem login/autenticação individual nesta etapa;
- GOP, não CTO;
- regras de negócio não devem ser alteradas sem demanda funcional explícita;
- código-fonte prevalece sobre documentação histórica;
- simplicidade para o usuário final é requisito central;
- Firebase Storage não deve ser introduzido enquanto o requisito for Spark sem meio de pagamento;
- ID oficial de chamado só existe após persistência remota confirmada;
- o novo prontuário não deve contaminar ou recalcular os chamados existentes nesta fase.

## 8. Próximos marcos

Curto prazo do prontuário: **validar visualmente e funcionalmente o formulário local-first**.

Marco posterior da infraestrutura: **provisionar o Firebase real e realizar a conexão/cutover**, incluindo a nova coleção `levantamentos_climatizacao`.

Não há necessidade de conectar o Firebase para continuar refinando o layout do prontuário.

Referências: `README.md`, `docs/ARQUITETURA_FIREBASE.md`, `docs/MIGRACAO_SUPABASE_FIREBASE.md`, `docs/superpowers/specs/2026-08-16-prontuario-climatizacao-mvp-design.md`, `firestore.rules`, `firebase.json`.
