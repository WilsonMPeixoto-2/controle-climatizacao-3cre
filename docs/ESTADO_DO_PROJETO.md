# Estado do Projeto — Controle de Climatização (3ª CRE / GOP)

> **Fonte de estado operacional. Atualizado em 16/08/2026.**
> O código-fonte executável continua sendo a fonte de verdade. Este documento registra o que foi efetivamente conferido no repositório, nos testes e na infraestrutura disponível.

## 1. Produto

Ferramenta de registro e monitoramento dos chamados de climatização das escolas da 3ª CRE para a GOP.

O sistema registra e acompanha demandas, consulta por escola, apresenta painel/alertas/mapa, mantém histórico e auxilia a comunicação. Não é sistema de gestão patrimonial do parque de aparelhos e não possui login individual, por decisão funcional histórica preservada nesta migração.

## 2. Situação da migração em 16/08/2026

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

## 3. O que NÃO está concluído ainda

A migração de código está pronta, mas o **cutover de produção não deve ocorrer antes do provisionamento do Firebase real**.

No momento desta atualização não foi localizado, nas integrações disponíveis, um projeto Firebase real já criado/configurado para este sistema nem a configuração Web App necessária para a Vercel.

Sem isso, publicar a branch em `master` faria o frontend operar sem persistência Firestore real. Isso seria regressão, não migração concluída.

### Único bloqueio externo obrigatório

É necessário provisionar uma vez, em conta Google/Firebase autenticada:

1. projeto Firebase no plano Spark;
2. Cloud Firestore;
3. Web App Firebase;
4. configuração Web (`apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId`);
5. deploy de `firestore.rules` e `firestore.indexes.json`;
6. carga inicial validada das coleções;
7. variáveis `VITE_FIREBASE_*` na Vercel.

Após isso, a sequência é: validar Firestore real -> validar preview/deploy -> merge em `master` -> verificar produção -> encerrar o legado Supabase ativo.

## 4. Produção atual

A `master` e o domínio Vercel continuam deliberadamente na versão anterior enquanto o Firebase real não está provisionado.

Isso preserva o funcionamento atual e evita trocar um backend pausado por uma interface que pareça online mas não consiga persistir dados.

Os previews Vercel da branch apresentaram `Resource provisioning failed` antes de um build útil. O build da aplicação, entretanto, foi repetidamente aprovado no GitHub Actions. Essa falha de preview deve ser reavaliada no corte final, sem ser confundida com erro de compilação do projeto.

## 5. Modelo Firestore aprovado

```text
escolas/{designacao}
chamados/{id_chamado}
historico/{id_evento}
modelos_email/{id}
contadores/chamados-{AAAA}
```

Anexos não integram o primeiro cutover Spark.

## 6. Regras que permanecem ancoradas

- sem login/autenticação individual;
- GOP, não CTO;
- regras de negócio não devem ser alteradas sem demanda funcional explícita;
- código-fonte prevalece sobre documentação histórica;
- simplicidade para o usuário final é requisito central;
- Firebase Storage não deve ser introduzido enquanto o requisito for Spark sem meio de pagamento;
- ID oficial só existe após persistência remota confirmada.

## 7. Próximo marco

**Provisionar o Firebase real e realizar o cutover de produção.**

Não há nova refatoração arquitetural necessária antes desse marco. A release candidate já possui gates verdes de segurança, build, Firestore e navegador.

Referências: `README.md`, `docs/ARQUITETURA_FIREBASE.md`, `docs/MIGRACAO_SUPABASE_FIREBASE.md`, `firestore.rules`, `firebase.json`.
