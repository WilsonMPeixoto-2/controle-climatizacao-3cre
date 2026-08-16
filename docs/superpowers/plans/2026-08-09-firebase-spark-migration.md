# Migração para Firebase Spark — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a persistência ativa do Supabase para Cloud Firestore no plano Spark, preservando as funcionalidades atuais, o modo local e a hospedagem Vercel, sem exigir cadastro de meio de pagamento.

**Architecture:** A UI React não deve conhecer diretamente o SDK do provedor de banco. A migração introduzirá uma camada de persistência/repositórios com adapter Firebase, Firestore Transactions para operações atômicas e `onSnapshot` para sincronização multiusuário. Upload de anexos ficará fora desta fase, pois Firebase Storage exige projeto com faturamento habilitado; a capacidade existente será preservada como legado/futuro, sem ser conectada ao Spark. A decisão histórica de produto de operar sem login/autenticação individual será preservada nesta migração.

**Tech Stack:** React 19, Vite 8, Firebase JS SDK, Cloud Firestore, Firebase App Check quando compatível com o modo público/anônimo, Firebase Emulator Suite, Zod, Playwright, Vercel.

## Restrições globais

- A branch de implementação é `feat/firebase-spark-migration`; não implementar diretamente em `master`.
- O frontend continuará hospedado na Vercel.
- A primeira versão deve permanecer compatível com o plano Firebase Spark e não depender de meio de pagamento.
- Firebase Storage e upload de anexos ficam fora do escopo desta fase.
- Preservar a decisão existente de produto: sem login, sem tela de acesso, sem cadastro de usuários e sem perfis individuais de permissão.
- Firestore Security Rules devem ser compatíveis com a operação pública/anônima controlada definida pelo projeto; não introduzir autenticação silenciosamente como requisito técnico.
- O código-fonte executável é a fonte de verdade em caso de divergência documental.
- Não reescrever a aplicação; migrar incrementalmente e manter testes verdes entre etapas.
- Não introduzir Redux, Zustand, TanStack Query ou outra camada de estado sem necessidade comprovada.
- Preservar o fallback local durante a transição.
- Nenhum identificador oficial de chamado deve ser gerado offline após a nova estratégia de IDs entrar em vigor.
- Atualizações de dependências devem ser separadas das mudanças de persistência e verificadas antes da migração.

---

## Estrutura de arquivos alvo

### Criar

- `src/infrastructure/firebase/client.js` — inicialização única do Firebase App/Firestore e integrações compatíveis com o modo público/anônimo.
- `src/infrastructure/firebase/firestoreAdapter.js` — primitives do Firestore usadas pelos repositórios.
- `src/repositories/chamadosRepository.js` — leitura, criação, atualização e realtime de chamados.
- `src/repositories/escolasRepository.js` — leitura ordenada das escolas.
- `src/repositories/historicoRepository.js` — leitura e inserção do histórico.
- `src/repositories/modelosEmailRepository.js` — leitura de modelos de e-mail.
- `src/repositories/persistence.js` — fachada consumida pela aplicação.
- `firebase.json` — Emulator Suite e configuração Firebase do projeto.
- `firestore.rules` — regras de acesso versionadas.
- `firestore.indexes.json` — índices versionados.
- `test/firebase-rules.test.mjs` — testes das regras no Emulator Suite.
- `scripts/seed-firestore.mjs` — importação controlada do `db.json` para Firestore.
- `docs/ARQUITETURA_FIREBASE.md` — arquitetura, decisões, configuração, limites e operação.
- `docs/MIGRACAO_SUPABASE_FIREBASE.md` — registro de transição e rollback.

### Modificar

- `package.json` / `package-lock.json` — atualizar dependências seguras, instalar Firebase e ferramentas de teste, retirar Supabase apenas no cutover.
- `src/App.jsx` — trocar dependências diretas de Supabase pela fachada de persistência; remover configuração manual de URL/key; substituir realtime.
- `src/lib/attachments.js` — manter capacidade legada isolada ou transformá-la em módulo inativo explícito, sem Firebase Storage nesta fase.
- `.env.example` — documentar variáveis Firebase.
- `vite.config.js` — trocar chunk específico do Supabase por Firebase quando ocorrer o cutover.
- `playwright.config.js` — remover variáveis Supabase e suportar ambiente Firebase/Emulator.
- `scripts/sync-local-db.js` — substituir integração REST Supabase por exportação Firestore ou arquivar no cutover.
- `README.md` — atualizar stack, dados, configuração, modo online e escopo de anexos.
- testes de serviços e smoke tests — remover contratos específicos de `.from()`/`.rpc()` e testar comportamento dos repositórios.

---

### Task 1: Baseline verificável e higiene do repositório

**Files:**
- Create: `.github/workflows/ci.yml`
- Existing: `package.json`, `package-lock.json`, `playwright.config.js`

**Interfaces:**
- Produces: baseline reprodutível de lint, testes, build e Playwright no Node 24.

- [ ] **Step 1:** Criar workflow CI para `feat/firebase-spark-migration` e pull requests.
- [ ] **Step 2:** Executar `npm ci`, `npm run lint`, `npm test`, `npm run build` e `npm run test:e2e`.
- [ ] **Step 3:** Registrar falhas preexistentes separadamente das regressões novas.
- [ ] **Step 4:** Confirmar preview Vercel da branch ou registrar falha ambiental da plataforma quando não houver logs de build da aplicação.
- [ ] **Step 5:** Encerrar PR #13 como supersedido, sem merge.

### Task 2: Atualização controlada de dependências

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: base de dependências atualizada e validada antes de Firebase.

- [ ] **Step 1:** Executar `npm outdated` e `npm audit` no ambiente de CI/execução.
- [ ] **Step 2:** Atualizar primeiro patches/minors compatíveis de React/Vite/ESLint/Playwright/Prettier/Lucide e ferramentas relacionadas.
- [ ] **Step 3:** Regenerar `package-lock.json` com npm.
- [ ] **Step 4:** Rodar suíte completa; qualquer regressão causada por upgrade deve ser corrigida antes de continuar.
- [ ] **Step 5:** Instalar `firebase`, `firebase-tools`, `firebase-admin` e `@firebase/rules-unit-testing` nas categorias apropriadas.
- [ ] **Step 6:** Repetir suíte completa e registrar versões finais.

### Task 3: Caracterizar e congelar anexos fora do escopo Spark

**Files:**
- Test: `test/attachments-deep.test.mjs`
- Modify: `docs/ARQUITETURA_FIREBASE.md`, `README.md`

**Interfaces:**
- Produces: decisão documentada de não migrar Firebase Storage nesta fase sem remover capacidade futura.

- [ ] **Step 1:** Confirmar no código os pontos de entrada da UI de anexos e verificar se há dados persistidos no snapshot local disponível.
- [ ] **Step 2:** Documentar que o módulo atual depende de Supabase Storage e RPCs.
- [ ] **Step 3:** Garantir que a migração de banco não passe a depender de Firebase Storage.
- [ ] **Step 4:** Manter testes de validação de tipo/tamanho/nome de arquivo se continuarem úteis como contrato futuro.

### Task 4: Introduzir fronteira de persistência antes de trocar o banco

**Files:**
- Create: `src/repositories/persistence.js`
- Create: repositories específicos
- Modify: `src/App.jsx`
- Test: testes de repositories

**Interfaces:**
- Produces: `loadInitialData()`, `createTicketWithHistory()`, `updateTicketWithHistory()`, `insertHistoryEvent()`, `subscribeOperationalData()` e métodos de consulta de anexos marcados como capability opcional.

- [ ] **Step 1:** Escrever testes que expressem o contrato da fachada sem API Supabase.
- [ ] **Step 2:** Confirmar RED porque a fachada ainda não existe.
- [ ] **Step 3:** Implementar a fachada inicialmente delegando ao backend existente.
- [ ] **Step 4:** Alterar `App.jsx` para consumir a fachada em vez de `.from()`, `.rpc()`, `.channel()` e `createClient()` diretamente.
- [ ] **Step 5:** Confirmar GREEN em unitários, smoke, build e E2E.

### Task 5: Adapter Firebase e Firestore

**Files:**
- Create: `src/infrastructure/firebase/client.js`
- Create: `src/infrastructure/firebase/firestoreAdapter.js`
- Create: `firestore.rules`, `firestore.indexes.json`, `firebase.json`
- Test: `test/firebase-rules.test.mjs`

**Interfaces:**
- Consumes: contrato dos repositórios da Task 4.
- Produces: backend Firestore compatível com a mesma fachada e com a operação pública/anônima do projeto.

- [ ] **Step 1:** Escrever testes do adapter/repositories contra Emulator Suite.
- [ ] **Step 2:** Criar inicialização Firebase baseada em `VITE_FIREBASE_*`, sem exigir login/autenticação individual.
- [ ] **Step 3:** Implementar leitura de `escolas`, `chamados`, `historico` e `modelos_email`.
- [ ] **Step 4:** Implementar criação atômica chamado+histórico+contador anual com `runTransaction`.
- [ ] **Step 5:** Implementar atualização atômica chamado+eventos com transaction/write batch.
- [ ] **Step 6:** Implementar realtime com `onSnapshot` sem refetch integral disparado por evento.
- [ ] **Step 7:** Implementar Security Rules compatíveis com o modo público/anônimo e testes explícitos das permissões necessárias; não confundir regras de banco com autenticação de usuário.
- [ ] **Step 8:** Validar tudo no Emulator Suite.

### Task 6: Corrigir estratégia de IDs e offline

**Files:**
- Modify: `src/App.jsx` e/ou módulo de domínio extraído
- Test: testes de criação de chamado

**Interfaces:**
- Produces: ID oficial somente após persistência remota; rascunhos offline usam ID não oficial.

- [ ] **Step 1:** Escrever teste que falha se o modo offline gerar `GOP-AR-AAAA-NNNN` como ID oficial.
- [ ] **Step 2:** Implementar identificador local `RASCUNHO-<uuid>`.
- [ ] **Step 3:** Implementar contador Firestore por exercício (`contadores/chamados-AAAA`).
- [ ] **Step 4:** Garantir ano derivado da data corrente e não literal `2026`.
- [ ] **Step 5:** Revalidar concorrência no Emulator com duas criações simultâneas.

### Task 7: Migração dos dados

**Files:**
- Create: `scripts/seed-firestore.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/data/db.json` ou export final validado do Supabase.
- Produces: coleções Firestore com IDs determinísticos e relatório de contagem.

- [ ] **Step 1:** Escrever validação do arquivo de origem com Zod/checagens de integridade antes de gravar.
- [ ] **Step 2:** Implementar dry-run exibindo contagens por coleção e conflitos.
- [ ] **Step 3:** Implementar seed idempotente no Emulator.
- [ ] **Step 4:** Comparar contagens e amostras de campos após importação.
- [ ] **Step 5:** Somente depois executar contra o projeto Firebase real.

### Task 8: Cutover da aplicação

**Files:**
- Modify: `src/App.jsx`, `.env.example`, `vite.config.js`, `playwright.config.js`, `package.json`, `package-lock.json`
- Archive/Modify: `supabase/`, `scripts/sync-local-db.js`, `test/supabase_real_persistence.mjs`

**Interfaces:**
- Produces: aplicação sem dependência ativa do Supabase.

- [ ] **Step 1:** Configurar Firebase como provider ativo na fachada.
- [ ] **Step 2:** Remover UI de URL/key Supabase e substituir por estado de conexão Firebase configurado por ambiente.
- [ ] **Step 3:** Remover `@supabase/supabase-js`, Supabase CLI e script `db:types` depois de todos os testes passarem com Firestore.
- [ ] **Step 4:** Atualizar chunks do Vite e variáveis E2E.
- [ ] **Step 5:** Arquivar documentação/migrations Supabase em `docs/legacy/supabase/` ou manter pasta marcada explicitamente como legado até homologação final.
- [ ] **Step 6:** Executar suíte completa e preview Vercel.

### Task 9: Documentação e conciliação

**Files:**
- Create/Modify: `docs/ARQUITETURA_FIREBASE.md`, `docs/MIGRACAO_SUPABASE_FIREBASE.md`, `README.md`, `CLAUDE.md`

**Interfaces:**
- Produces: documentação coerente com o código executável e adequada à continuidade por outras ferramentas/agentes.

- [ ] **Step 1:** Documentar arquitetura atualizada e mapa Supabase → Firebase.
- [ ] **Step 2:** Documentar configuração local, Vercel e Emulator Suite.
- [ ] **Step 3:** Corrigir número/descrição das coleções efetivamente usadas.
- [ ] **Step 4:** Registrar anexos como capacidade adiada por restrição do Spark.
- [ ] **Step 5:** Registrar que a arquitetura continua sem login/autenticação individual, em consonância com a decisão histórica do projeto.
- [ ] **Step 6:** Registrar procedimento de rollback e fonte de verdade.

### Task 10: Verificação final e integração

**Files:**
- No new production behavior.

**Interfaces:**
- Produces: evidência objetiva de prontidão para merge.

- [ ] **Step 1:** Executar `npm ci` limpo.
- [ ] **Step 2:** Executar lint + testes unitários + regras Firebase + build.
- [ ] **Step 3:** Executar Playwright completo.
- [ ] **Step 4:** Validar preview Vercel e persistência Firestore real com dados de teste controlados.
- [ ] **Step 5:** Verificar que a aplicação não referencia configuração Supabase ativa.
- [ ] **Step 6:** Revisar diff final por escopo, segredos, documentação e arquivos legados.
- [ ] **Step 7:** Abrir PR para `master` com checklist e evidências; não publicar em Production antes da revisão final.
