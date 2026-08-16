# Prontuário de Climatização MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma página simples e funcional para cada escola cadastrar ambientes e aparelhos de ar-condicionado, salvar e reabrir o levantamento, sem cruzamento com chamados ou totais históricos.

**Architecture:** A funcionalidade será isolada do `App.jsx` principal e acessível por `/?levantamento=<designacao>`. `src/main.jsx` decide entre o app operacional existente e uma nova `ClimateSurveyPage`. O levantamento será persistido como **um documento Firestore por escola** em `levantamentos_climatizacao/{designacao}`, com `ambientes` e `aparelhos` aninhados; no modo sem Firebase, usa `localStorage` por designação para continuar plenamente testável e utilizável como rascunho local.

**Tech Stack:** React 19, Vite 8, Firebase/Cloud Firestore, Zod, Playwright, Node test runner.

## Global Constraints

- Modo claro e interface focada no preenchimento, sem dashboard ou painel de prioridades.
- Não relacionar levantamento com chamados, criticidade, manutenção preventiva ou totais antigos.
- Comboboxes devem aceitar opções sugeridas e digitação livre.
- Situação do aparelho: `Funcionando`, `Precisa de manutenção`, `Não informado`.
- Campos técnicos são opcionais; ambiente e escola são obrigatórios.
- Preservar a aplicação operacional existente sem alterar suas regras de negócio.
- Sem nova dependência de UI.

---

### Task 1: Domínio e validação do levantamento

**Files:**
- Create: `src/lib/climateSurvey.js`
- Create: `test/climate-survey.test.mjs`

**Interfaces:**
- Produces: `ENVIRONMENT_TYPE_OPTIONS`, `APPLIANCE_STATUS_OPTIONS`, `createEnvironment`, `resizeAppliances`, `buildDisplayName`, `normalizeSurvey`, `validateSurvey`.

- [ ] **Step 1: Write failing tests** para composição de nome, redimensionamento de aparelhos sem perder dados existentes, normalização e rejeição de situação inválida.
- [ ] **Step 2: Run** `node --test test/climate-survey.test.mjs` e confirmar falha por módulo inexistente.
- [ ] **Step 3: Implement minimal domain helper** com IDs injetáveis, opções de ambientes e situações e validação Zod.
- [ ] **Step 4: Run** `node --test test/climate-survey.test.mjs` e confirmar PASS.

### Task 2: Persistência Firestore e Security Rules

**Files:**
- Modify: `src/infrastructure/firebase/firestorePersistence.js`
- Modify: `firestore.rules`
- Modify: `test/firestore-persistence.test.mjs`
- Modify: `test/firestore-rules.test.mjs`

**Interfaces:**
- Produces no gateway: `loadClimateSurvey(designacao)` e `saveClimateSurvey(survey)`.
- Firestore collection: `levantamentos_climatizacao/{designacao}`.

- [ ] **Step 1: Add failing adapter tests** que salvam e recarregam um levantamento por designação.
- [ ] **Step 2: Add failing Rules tests** permitindo documento válido, rejeitando designação divergente, situação inválida e coleção não declarada.
- [ ] **Step 3: Run** `npm run test:firestore` e confirmar RED.
- [ ] **Step 4: Implement adapter methods and Rules** com schema restrito e escola existente.
- [ ] **Step 5: Run** `npm run test:firestore` e confirmar PASS.

### Task 3: Página de preenchimento isolada

**Files:**
- Create: `src/components/ClimateSurveyPage.jsx`
- Create: `src/styles/climate-survey.css`
- Modify: `src/main.jsx`
- Create: `e2e/climate-survey.spec.js`

**Interfaces:**
- Route selector: query parameter `levantamento=<designacao>`.
- Local fallback key: `gop_climate_survey_<designacao>`.
- Page props: nenhuma; escola é resolvida pelo parâmetro e `db.json`.

- [ ] **Step 1: Write failing Playwright scenario** que abre `/?levantamento=312014`, cria ambiente, informa dois aparelhos, salva, recarrega e encontra os dados.
- [ ] **Step 2: Run** `npx playwright test e2e/climate-survey.spec.js` e confirmar RED.
- [ ] **Step 3: Implement page** com escola identificada, chips de ambientes, `+ Novo ambiente`, tipo de ambiente com `datalist`, identificação livre, quantidade 0–5/6+, cards de aparelhos, datalists de BTU/tipo derivados de `db.json`, situação e observações.
- [ ] **Step 4: Implement Firestore/localStorage save-load** sem qualquer consulta a chamados para classificar ou alterar os dados.
- [ ] **Step 5: Update `main.jsx`** para renderizar `ClimateSurveyPage` somente quando o parâmetro `levantamento` existir; caso contrário manter `App` intocado.
- [ ] **Step 6: Run** o E2E específico e confirmar PASS.

### Task 4: Verificação integral e documentação mínima

**Files:**
- Modify: `README.md`
- Modify: `docs/ESTADO_DO_PROJETO.md`

- [ ] **Step 1: Run** `npm run lint`.
- [ ] **Step 2: Run** `npm test`.
- [ ] **Step 3: Run** `npm run test:firestore`.
- [ ] **Step 4: Run** `npm run build`.
- [ ] **Step 5: Run** `npm run test:e2e`.
- [ ] **Step 6: Document** a URL do levantamento, coleção Firestore e escopo explicitamente sem cruzamentos.
- [ ] **Step 7: Re-run** `npm run build` após documentação/configuração final e conferir árvore de mudanças.
