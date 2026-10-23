# Modernização técnica e visual do CLIMATIZAÇÃO
**Data:** 23/10/2026  
**Ambiente:** Controle de Climatização da GOP / 3ª CRE  
**Site público:** https://controle-climatizacao-3cre.vercel.app  
**Firebase:** `gestao-da-climatizacao-3-cre` (Cloud Firestore `(default)`)

## Escopo executado
1. Auditoria das versões declaradas no `package.json` e efetivamente fixadas no `package-lock.json`.
2. Atualização das bibliotecas estáveis de React, Firebase, Vite, Vite React, ESLint, Lucide, Zod, tipos de React, Playwright, Axe, Prettier e Globals.
3. Migração coordenada de `@firebase/rules-unit-testing` para a major compatível com Firebase 13 e Node 24. O primeiro build falhou devido ao peer dependency do SDK 12; foi corrigido.
4. Atualização das dependências transitivas com `npm update --package-lock-only`. Override explícito de `@grpc/grpc-js` para versão corrigida `^1.14.6`; atualizado `browserslist`, `brace-expansion` e `baseline-browser-mapping`.
5. `npm audit --json` e `npm audit --json --omit=dev` finalizaram com **zero alertas** após os ajustes.
6. Novo cabeçalho com hierarquia institucional, data em metadado separado e indicador de conectividade que depende de `cloudConnected` e `isInitialLoad`, nunca de mensagem estática.
7. Navegação mais legível, estado de aba atual com `aria-current`; cartões KPI acessíveis por Enter/Espaço; nova camada `src/styles/maturity-2026.css`, importada depois dos estilos preexistentes.
8. Mantidos mapa Leaflet + OpenStreetMap, GeoJSON, filtros, fluxos e chamadas Firestore; o redesign não muda modelo de dados.

## Versões principais no manifesto atualizado
- React e React DOM: `^19.3.1`
- Firebase JS SDK: `^13.1.0`
- Vite: `^8.3.5`
- Plugin React do Vite: `^6.1.2`
- Lucide React: `^1.61.0`
- Zod: `^4.6.7`
- ESLint: `^10.13.0`
- Testes de regras Firestore: `^6.0.0`
- Leaflet permanece em `^1.9.4` (estável; mapa intencionalmente preservado).

## Testes e publicação
- O build Vercel executa `npm run lint && npm run test && vite build`.
- Preview do commit final `ff8a5eca60ea6dbb11e0710917932f2350e77e1e`: **READY**.
- Deploy de produção: `dpl_4CwnzFynwX62T8AEEhJYMEMkvtkD`: **READY**.
- Alias histórico `controle-climatizacao-3cre.vercel.app` atribuído ao deploy acima.
- Verificação HTTP após publicação: **200**; código React, CSS, configuração pública Firebase, logotipo e chunk OpenStreetMap presentes.
- Consulta Vercel Runtime Errors no período imediatamente posterior à publicação: sem erros de funções reportados (o aplicativo é client-side; isso não substitui teste no navegador).
- Ferramenta de browser retornou a nova estrutura de cabeçalho e navegação em preview, mas tentativas posteriores de esperar a sincronização completa do Firestore falharam por limitação do navegador remoto. **Não houve novo E2E de formulário com Firestore 13 na versão pós-atualização.**
- Os testes do emulador Firestore (`npm run test:firestore`) e a suíte Playwright completa (`npm run test:e2e`) não foram executados neste release; permanecem uma verificação complementar recomendada antes de mudanças funcionais maiores.

## Pendências preexistentes e cuidados
- PR #20 (migração Firebase) continua draft e divergente de `master`. A versão Firebase funciona por implantação explícita dessa branch. Evitar merge forçado na principal.
- Na Vercel, o alias histórico serve o projeto Firebase novo, porém o vínculo cadastral `Project Domain` pode ainda estar no projeto antigo. A atribuição automática do projeto antigo está desabilitada, mas a transferência definitiva do cadastro de domínio requer operação administrativa própria.
- Permanece um chamado fictício de homologação `GOP-AR-2026-0032`, identificado como teste; limpeza e eventual recomposição do contador dependem de conferência transacional.

## Rollback
A implantação de produção anterior ao upgrade é `dpl_HD3oPFXQAT9LVdQfabeNE3UcNpLt`. Em caso de regressão, atribuir temporariamente o alias histórico a esse deploy, sem alterar os dados Firestore. **Não retornar à versão antiga conectada ao Supabase inativo.**


## Encerramento da integração no GitHub — 23/10/2026
- PR #20 (migração Firebase) integrado à `master` com sucesso. Merge GitHub: `9c8767c4335b6eeb13006669f4cd44d7c1d3dd9b`.
- A integração preserva também o Prontuário de Climatização da antiga `master`: `ClimateSurveyPage`, lógica, CSS, teste unitário, E2E e seleção da página por `?levantamento=`.
- Os conflitos em `src/main.jsx` e `package.json` foram resolvidos manualmente com os recursos das duas branches preservados.
- Validação independente do commit intermediário `4feeec3595874644ed84436366c786a5c86218b8`: `npm ci` concluído; `npm run build` executou ESLint, todos os testes unitários incluindo `climate-survey.test.mjs`, e compilação Vite com êxito.
- Teste **real** com `firebase@13.1.0`: leitura das 134 escolas e consulta do chamado fictício preexistente; CRUD isolado na coleção `diagnostico_integracao` (criar, ler, atualizar, reler, excluir, conferir exclusão), todas as etapas aprovadas. Nenhum chamado administrativo foi alterado; o teste foi removido.
- A Vercel recusou **novos builds** do commit integrado por limite de builds da equipe (`build-rate-limit`), não por erro de código. Portanto o endereço público permaneceu no deploy READY `dpl_4CwnzFynwX62T8AEEhJYMEMkvtkD` com código `ff8a5eca`, que **já continha Firebase 13 e as dependências atualizadas**, mas ainda não contém a restauração do Prontuário feita no merge. Não declarar que o merge completo já foi publicado até nova compilação e troca de deploy confirmadas.
- Testes Playwright de navegador e testes de emulador Firestore não foram integralmente executados nesta etapa; a validação substitutiva foi `npm run build` mais CRUD real do SDK 13.
