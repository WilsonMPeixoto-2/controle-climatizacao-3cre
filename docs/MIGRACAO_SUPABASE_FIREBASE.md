# Registro da Migração Supabase -> Firebase

## Situação em 16/08/2026

- **Branch:** `feat/firebase-spark-migration`
- **Base original:** `d88b8a18effc152fed39537bb1d7f29394d3e6b2`
- **Produção permanece:** `master`, até provisionamento do Firebase real
- **Destino:** Cloud Firestore, plano Spark
- **Hospedagem:** Vercel
- **Autenticação individual:** fora do escopo; decisão histórica preservada
- **Firebase Storage/anexos:** adiado
- **Implementação de código:** concluída e validada
- **Cutover de produção:** bloqueado apenas pelo provisionamento/configuração do projeto Firebase real e ambiente Vercel

## Princípios

1. Código-fonte executável é a fonte de verdade.
2. A `master` não recebe backend incompleto.
3. Operações que eram atômicas por RPC continuam atômicas em Firestore Transaction/Write Batch.
4. ID oficial não é emitido antes da confirmação remota.
5. Firestore Emulator e Rules testadas precedem o banco real.
6. A ausência histórica de login não é reescrita silenciosamente como Firebase Auth.
7. Storage permanece fora do Spark nesta fase.

## Linha do tempo

### 09/08/2026 — abertura

- Confirmada `master` em `d88b8a18effc152fed39537bb1d7f29394d3e6b2`.
- Criada `feat/firebase-spark-migration`.
- Baseline em Node 24 consolidado.
- Confirmadas falhas E2E preexistentes e preview Vercel com falha de provisionamento da plataforma.
- PR antigo #13 encerrado sem merge.
- Anexos classificados como capacidade adiada.
- Decisão de operar sem login individual preservada.

### 09–16/08/2026 — implementação

- dependências atualizadas;
- vulnerabilidades transitivas do baseline eliminadas;
- criada fronteira neutra de persistência;
- criado adapter Firestore;
- criadas Security Rules e testes com Emulator Suite;
- substituídos RPCs por transações/batches;
- substituído Realtime Supabase por `onSnapshot`;
- removido literal fixo `2026` da sequência de chamados;
- `App.jsx` migrado para a camada Firestore;
- runtime de Storage retirado do fluxo principal;
- SDK/CLI Supabase removidos das dependências ativas da release candidate;
- CI ajustado para Firebase;
- falhas antigas de contraste WCAG corrigidas;
- snapshots visuais Linux/Chromium consolidados.

### 16/08/2026 — release candidate validada

Gate final aprovado com:

- `npm audit`: 0 vulnerabilidades;
- lint e testes de domínio: aprovados;
- build Vite: aprovado;
- Security Rules: aprovadas;
- adapter Firestore: aprovado no Emulator;
- criação sequencial/atômica: aprovada;
- realtime: aprovado;
- Playwright/Axe: 13/13;
- regressão visual: 2/2.

Commit do hardening: `f3f77e93e1de7ea5155be5fe5c634fa3e4d11960`.

## Mapa de substituição

| Supabase | Firebase |
|---|---|
| `escolas` | `escolas/{designacao}` |
| `chamados` | `chamados/{id_chamado}` |
| `historico` | `historico/{id_evento}` |
| `modelos_email` | `modelos_email/{id}` |
| RPC create/save | Transaction / Write Batch |
| sequence/trigger | `contadores/chamados-{AAAA}` |
| Supabase Realtime | `onSnapshot` |
| RLS | Firestore Security Rules |
| índices SQL | `firestore.indexes.json` |
| Supabase Storage | fora desta fase |

## Critérios de código do cutover

Todos estão atendidos na release candidate:

- [x] adapter Firestore implementado;
- [x] Rules testadas no Emulator;
- [x] criação e atualização atômicas;
- [x] sequência anual dinâmica;
- [x] realtime validado;
- [x] fallback local coerente;
- [x] Supabase removido das dependências ativas;
- [x] lint/test/build aprovados;
- [x] E2E 13/13;
- [x] documentação principal conciliada.

## Critérios externos ainda pendentes

O merge de produção depende de:

- [ ] projeto Firebase real Spark criado em conta Google autenticada;
- [ ] Firestore criado;
- [ ] Web App registrado e configuração fornecida;
- [ ] `firestore.rules` e `firestore.indexes.json` publicados;
- [ ] seed/import inicial conciliado por contagem e amostra;
- [ ] variáveis `VITE_FIREBASE_*` configuradas na Vercel;
- [ ] conectividade real validada;
- [ ] Vercel apta a gerar o deploy final;
- [ ] merge em `master` e verificação do domínio.

## Rollback

Até o merge final, `master` permanece como referência operacional. O material histórico Supabase é preservado para rastreabilidade, mas o runtime da release candidate não depende mais do SDK/CLI Supabase.

Se o provisionamento Firebase real apresentar divergências de dados ou Rules, não se corrige diretamente em produção: a `master` anterior permanece o ponto de rollback até a homologação.
