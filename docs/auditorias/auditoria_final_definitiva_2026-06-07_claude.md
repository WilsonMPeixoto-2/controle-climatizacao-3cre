# Auditoria Final Definitiva — Gestão de Climatização Escolar (GOP/3ª CRE)

**Auditor:** Claude (Claude Code) · **Data:** 2026-06-07 · **HEAD:** `08f17ed` · **Modo:** READ-ONLY (nenhuma alteração de código/commit/push/migration/policy; nenhum login/usuário criado).
**Método:** evidência direta — git, catálogo Postgres (Management API), camada anon REST/Storage, leitura de código (arquivo:linha), execução de testes (workflow de 6 agentes). Onde não verificável: marcado **NÃO_VERIFICÁVEL**.
**Nota:** não sobrescrevi `auditoria_final_definitiva_2026-06-07.md` (relatório do Codex) — este é o complemento independente do Claude. Convergências e divergências entre ferramentas anotadas ao final.

---

## 1. Sumário executivo
- **O site está funcional?** SIM, para o uso operacional (painel, mapa, lista, registro, edição, anexos, dossiê, comunicações). Abre **direto, sem login**.
- **Dados coerentes?** SIM. Banco íntegro: 134 escolas / **30 chamados reais** (+1 lixo de teste, ver §5) / 67 históricos / 1 anexo; 0 órfãos; `vw_integridade_operacional`=0; clamp de % ok; densidade preservada.
- **Frontend conectado ao Supabase?** SIM, e verificado pela **camada anon real** (a do usuário): lê 31 linhas de chamados + 134 escolas e faz upload (HTTP 200). RLS off nas tabelas, Storage com policies anon.
- **Funções principais?** Funcionam (registro/edição via RPC transacional, anexos, comunicações) — confirmado por código + testes + camada anon.
- **Layout maduro?** Em grande parte SIM (design tokenizado, responsivo, acessibilidade com fundamentos). Há **2 bugs visuais reais** (badges de prioridade ACENTUADOS — Média e Crítica — perdem a cor da pílula; navegação só-ícones em ≤1024px).
- **Bloqueadores para congelar?** Nenhum bloqueia o uso comum. Para congelar **limpo**, há 4 pendências reais (1 dado de teste em prod, 1 e2e desatualizado, 2 ajustes de UI/a11y).
- **Veredito:** **PRONTO PARA USO COM RESSALVAS PONTUAIS** — uma pequena rodada de limpeza/polimento antes do congelamento.

## 2. Estado Git e deploy
| Item | Resultado |
|---|---|
| Branch | `master` |
| Commit local | `08f17ed` |
| Commit remoto (origin/master) | `08f17ed` |
| Ahead/behind | 0 / 0 (sincronizado) |
| Working tree | Limpa (sem modificados) |
| Untracked | Nenhum (antes deste relatório) |
| Stash | Vazio (Fase 4 já consumida) |
| Build | PASS (gate lint+test+vite build verde) |
| Deploy | HTTP 200 (Vercel, bundle atual) |
| Tela de login na entrada | **Não há** — abre direto no painel (Fase 4 revertida; fora de escopo) |
| Risco de alteração local não publicada | **Nenhum** |

## 3. Arquitetura analisada
SPA React 19 + Vite 8, deploy Vercel (auto-deploy no `master`), Supabase. 62 arquivos versionados. Núcleo:
- `src/App.jsx` (**6565 linhas**, componente único), `src/main.jsx`, `src/index.css` (3578 linhas).
- `src/lib/`: `logic.js` (511), `operationalIntelligence.js` (267), `schoolDossier.js` (143), `validation.js` (67), `attachments.js` (134) — regra pura testável.
- `src/components/`: `OperationalMap.jsx` (452, Leaflet), `ErrorBoundary.jsx` (126).
- `supabase/`: `schema.sql`, 13 migrations, `seed.sql`, `GOVERNANCA.md`, `CONEXAO_SUPABASE.md`.
- `test/` (4 suites Node + 1 manual), `e2e/dossier.spec.js`, `docs/`.

## 4. Testes executados
| Teste | Resultado | Evidência | Bloqueador? |
|---|---|---|---|
| `npm run lint` | **PASS** | eslint sem erros/warnings | não |
| `npm test` | **PASS** | logic 53/0 · attachments 85/0 · dossier OK · smoke OK (~138 asserts, 0 falhas) | não |
| `npm run build` | **PASS** | gate lint+test+vite build; aviso chunk >500kB (cosmético) | não |
| `npm run test:e2e` | **FAIL 1/3** | `e2e/dossier.spec.js:9` espera "Resumo operacional de hoje"; app renderiza "Resumo operacional" (`App.jsx:952`). Testes 2 e 3 passam (tocam Supabase real). | **não** — teste obsoleto, não regressão |
| Supabase vivo (read-only) | **PASS** | Management API: integridade 0 órfãos/inválidos | — |
| Camada anon (REST/Storage) | **PASS** | anon lê 31 chamados + 134 escolas; upload PDF HTTP 200 (+cleanup) | — |

## 5. Supabase e dados reais (read-only, HEAD 08f17ed)
| Item | Valor |
|---|---|
| Escolas / Chamados / Histórico / Anexos / Modelos | 134 / **31** / 67 / 1 / 8 |
| Chamados sem escola · Histórico sem chamado · Anexos sem chamado | 0 · 0 · 0 |
| Status inválidos · Prioridades inválidas | 0 · 0 |
| vw_chamados_ativos / por_bairro / por_status | 22 / 21 / 6 |
| vw_chamados_sem_anexo / sem_movimentacao / escolas_resumo | 21 / 22 / 134 |
| vw_integridade_operacional | 0 (zero inconsistências) |
| percentual_climatizacao > 100 | 0 (clamp funciona) |
| densidade máxima | Eurico Vilela 2,90 (preservada) |
| RLS nas 5 tabelas | **OFF** (modelo aberto) · 0 policies de tabela |
| Storage `gop-anexos` | policies anon SELECT/INSERT/DELETE (upload OK) |
| RPCs | save_ticket_with_history, diagnostico_operacional, generate_next_id_chamado |

**🔴 Pendência de dados (alta):** existe **1 chamado de teste residual em produção** — `GOP-AR-2026-0034`, `unidade_escolar="Escola Teste Auditoria Antigravity"`, `designacao=312001` (escola real = **Escola Municipal Oswaldo Cruz**), `observacoes="Texto de observação atualizado via RPC transacional"`, criado 2026-06-07 04:39 (+1 evento de histórico). É o único registro de teste e a **única** divergência nome×cadastro (varredura confirmou: nenhum outro). O `chamados=31` ⇒ o real é **30**; o `+1` é este lixo. `diagnostico_operacional()` não o pega (valida FK/status/prioridade, não o nome).

## 6. Mapeamento frontend ↔ Supabase
| Tela/função | Origem | Operação | Coerente? | Observação |
|---|---|---|---|---|
| Conexão inicial | escolas/chamados/historico/anexos_chamado/modelos_email | SELECT | SIM | `App.jsx:572-617` |
| Dashboard / Resumo / Fila de ações | — (cálculo client-side) | — | SIM | `operationalIntelligence.js` |
| Mapa | — (aggregateBairroStats em memória) | — | SIM | `OperationalMap.jsx`; 0 hits `.from('vw_')` |
| Lista / busca / filtros | array em memória | — | SIM | `App.jsx:785-850` |
| Dossiê | escolas+historico (memória) + anexos (SELECT) | SELECT | SIM | `schoolDossier.js` + `App.jsx:510-525` |
| Registro | chamados INSERT + historico INSERT + rollback | INSERT/DELETE | SIM | `App.jsx:1468-1500` (id por trigger) |
| Edição | RPC `save_ticket_with_history` (atômica) | RPC | SIM | `App.jsx:1380`; 14 campos existem no schema |
| Histórico (nota) | historico INSERT | INSERT | SIM | `App.jsx:1271`; nota de escola sem id_chamado (by design) |
| Anexos | Storage `gop-anexos` + anexos_chamado | INSERT/SELECT/DELETE | SIM | `attachments.js` |
| Comunicações | modelos_email (SELECT) + montagem em memória | SELECT | SIM | `App.jsx:607-617` |
| Exportação CSV / Busca | — (client-side) | — | SIM | `App.jsx:1692-1745` / `830-849` |
| Sync local→nuvem (admin) | escolas/chamados/historico UPSERT | UPSERT | SIM | `App.jsx:692-700` |

- **Sem campo-fantasma** de escrita ou exibição (verificado contra schema linha a linha).
- **As 7 views `vw_*` e a RPC `diagnostico_operacional` NÃO são consumidas pelo front** (0 hits `.from('vw_')`); existem só como apoio de diagnóstico/auditoria. **Não remover** (servem bem). 
- `percentual_climatizacao`/`densidade_aparelhos_sala` existem **só na view**; o front recalcula em JS (não é phantom; é derivado não-consumido).
- `pg_trgm` habilitado mas sem uso (busca é `Array.filter` local) — subutilização, não bug.

## 7. Avaliação por tela
- **Dashboard** — BOM. Hierarquia forte, KPIs em famílias (inércia × antiguidade), resumo em linguagem natural, fila de ações, donut (divisão-por-zero protegida). Único ruído: `aggregateBairroStats` recalculado em dobro (memo no mapa + inline no painel de bairro, `App.jsx:2341`). *Prioridade: baixa.*
- **Mapa** — BOM. Leaflet com init única, update in-place, cleanup robusto, coroplético por bairro real, `role=img`+aria-label. *Baixa.*
- **Lista** — BOM com ressalva. Filtros/busca/CSV/legendas OK. **Badges de prioridade acentuados (Média/Crítica) saem sem cor** (ver §11 — hoje afeta ~97% das linhas, pois 30/31 são "Média"); desktop com scroll horizontal interno; mobile vira cards (data-label) mas fica longa. *Média.*
- **Registro** — BOM. Autocomplete, validação zod, INSERT real + evento + rollback. *Baixa.*
- **Modal/ficha** — BOM (func). Edição pessimista via RPC, histórico por diff, Esc+scroll-lock. **Falta `role=dialog`/aria-modal/foco-armadilha** (a11y). *Média-baixa.*
- **Dossiê** — BOM. Cobertura, status climático, timeline, impressão isolada por ref. *Baixa.*
- **Comunicações** — BOM. Preview XSS-safe (escapa antes do `dangerouslySetInnerHTML`), copiar. O chamado de teste `0034` aparece como opção e polui a minuta. *Média (resolve com §5).*
- **Mobile** — BOM com ressalvas. Sem overflow global; **navegação só-ícones sem rótulos/aria-label em ≤1024px** (ver §11). *Média.*
- **Tema claro/escuro** — BOM. Persistido (`gop_theme`), default dark, reflete no CSS e no mapa. *Baixa.*

## 8. Avaliação da lógica de dados
Núcleo **correto e testado** (evidência em `src/lib`):
- **Status** ativos/concluídos(10)/encerrados(11)/suspensos — `logic.js:17-20`, idêntico às views.
- **Dois alertas independentes**: inércia via `modificado_em` (7/15) e antiguidade via `criado_em` (30/60) — `logic.js:118-151`. `severidadeInatividade` 7/15/60 (`:157`).
- **Urgência**: `calculateUrgencyScore` (pesos coerentes c/ seed) + `compararUrgencia`/`ordenarPorUrgencia` (estável, puro). Agrupamento `stuck-group` com dedup por id (`operationalIntelligence.js:238-264`).
- **stageGroup** (legenda mapa) particiona exaustivamente. **aggregateBairroStats** cruza com normalização + fallback órfão.
- **Discrepâncias latentes (não-bug hoje):** (a) `calculateCoveragePercent` usa `Math.round` inteiro + `Math.min(100)` vs a view `ROUND(...,2)` + `LEAST(100)` — **a view não é consumida**, logo sem dupla exibição divergente; risco só se a view passar a alimentar a tela. (b) cobertura calculada em **3 lugares** (view + `App.jsx:1588` + `schoolDossier.js:14`) — risco de drift. (c) `normalizeSector` só no caminho de exibição (não em filtros). (d) `getSchoolDossierData` casa escola↔chamado por `designacao` exata (vs normalizada no mapa). (e) "salasClimatizadas = aparelhos_em_sala" é misnomer (é contagem de aparelhos; por isso o clamp de 100% é necessário).

## 9. Avaliação visual/design + acessibilidade
- **Fortes:** tokens centralizados (`:root` + `.dark-theme`), tipografia/raios/sombras coerentes, `tabular-nums`, tabela→cards com `data-label`, comunicações empilhada, cabeçalho compacto, **redundância cor+texto exemplar** (status/prioridade/aptidão sempre com texto; tags "Inércia: X dias"), `:focus-visible`, `prefers-reduced-motion` (inclui pulsos SLA), labels `htmlFor` válidos, print stylesheet do dossiê.
- **Problemas reais:** (1) **badges de prioridade acentuados sem cor** — `App.jsx:3211` gera `badge badge-priority-${'$'}{prioridade.toLowerCase()}`; "Média"→`badge-priority-média` e "Crítica"→`badge-priority-crítica` (COM acento), mas as regras em `index.css:1025-1040` são SEM acento (`-media`/`-critica`) e o `.badge` base (`index.css:1014-1023`) não tem `background-color`/`color` → essas duas prioridades caem em texto sem pílula colorida. Só `Alta`/`Baixa` (sem acento) casam. **Verificado por mim:** afeta Média (30/31 chamados hoje) + Crítica, não só Crítica como sugerido inicialmente; (2) **conflito de dois `@media (max-width:1024px)`** (`index.css:1809-1844` esconde rótulos; `:3088-3129` torna a nav horizontal mas não restaura rótulos) → **navegação só-ícones**; (3) **modal sem `role=dialog`/aria-modal/foco**; (4) **sidebar só-ícone sem `aria-label`**; (5) **skeleton-loader é código morto** (classe nunca usada) e não há indicador de carregamento durante o fetch inicial.
- **Contraste numérico:** NÃO_VERIFICÁVEL sem browser (tokens anotados como WCAG AA; intenção explícita no código).

## 10. Pontos fortes (preservar)
- Painel executivo claro e orientado à decisão; dados reais sustentam dashboard/lista/mapa/dossiê/comunicações.
- Regras (severidade, urgência, agrupamento, status) **centralizadas em `src/lib` e testadas** (lint+test+build verdes).
- Gravação **pessimista cloud-first via RPC transacional** (atômica ticket+histórico) com rollback no registro.
- Validação zod com mensagens humanas; ErrorBoundary acessível; toasts `aria-live`; estados vazios consistentes.
- Mapa Leaflet defensivo (cleanup/guards). Tema persistido. Integridade de banco impecável.

## 11. Pontos de melhoria reais (com evidência)
| Recomendação | Evidência | Impacto | Risco de alterar | Prioridade |
|---|---|---|---|---|
| Remover chamado de teste `GOP-AR-2026-0034` (+1 evento) | §5; `chamados`=31 vs 30 real | Polui dashboard/lista/minutas | Baixo (1 registro nominal; backup antes) | **Alta** |
| Atualizar e2e desatualizado | `e2e/dossier.spec.js:9` vs `App.jsx:952` | Falso negativo antes do congelamento | Baixo | **Alta** |
| Corrigir cor dos badges de prioridade ACENTUADOS (Média + Crítica) | `App.jsx:3211` gera classe acentuada (`-média`/`-crítica`) sem regra em `index.css:1025-1040` (só `-media`/`-critica`) | ~97% das linhas hoje (Média) sem cor de prioridade; Crítica idem | Baixo (normalizar acento na classe OU adicionar regras acentuadas) | **Alta** |
| Restaurar rótulos/`aria-label` na nav ≤1024px | `index.css:1809-1844` × `:3088-3129`; `App.jsx:1938-1980` | Navegação só-ícones confunde público avesso a tech + a11y | Baixo-médio (CSS + aria-label) | **Média** |
| `role=dialog`/aria-modal/foco no modal | `App.jsx:5590-5605` | Acessibilidade (leitor de tela/teclado) | Baixo | Média |
| Toast de carga: distinguir "online vazio → base local" | `App.jsx:564-632` (só schools/email dão throw) | Evita falsa confiança em sucesso parcial | Baixo | Média |
| Persistir `schools` no localStorage (igual a tickets/history) | `App.jsx:235-251` (schools fora) | Reload em modo local reseta escolas | Baixo | Média-baixa |
| Limpar/deduplicar `schoolLogs` ao conectar nuvem | `App.jsx:307-309`,`4463-4520` | Notas locais órfãs na timeline do dossiê | Médio | Média-baixa |
| Importar constantes `*_DAYS`/`isClosed` no App.jsx | `App.jsx:794/798/802/806/813-815/3146` (viola CLAUDE.md) | Risco de drift de limiar/status | Baixo | Média-baixa |
| Indicador de loading na carga inicial (usar/retirar skeleton) | `index.css:3394-3415` (código morto) | Feedback durante fetch | Baixo | Baixa |
| Reduzir scroll horizontal da lista (desktop) / compactar mobile | §7 Lista | Polimento/legibilidade | Médio | Média |
| Consolidar cálculo de cobertura (view × 2 JS) | §8 (b) | Evita drift futuro de % | Médio | Baixa |
| Code-splitting do bundle (>500kB) | build aviso | Performance inicial | Médio | Baixa |

## 12. O que NÃO deve ser mexido agora
- **Não reabrir login/autenticação/RLS restritivo/Fase 4** — fora de escopo por decisão; foi revertido. O `*.example` de policies authenticated é inerte (não executa) — deixar.
- **Não remover as views `vw_*` nem a RPC `diagnostico_operacional`** só porque o front não as usa — são apoio de diagnóstico.
- **Não redesenhar o dashboard** nem trocar paleta/tipografia/arquitetura visual por preferência.
- **Não refatorar o monolito `App.jsx` em massa** agora (estável, testes verdes) — apenas não deixá-lo crescer (extrair novas features como componentes).
- **Não substituir regras de cálculo testadas** sem caso concreto.
- **Não fazer limpeza ampla de banco** sem lista nominal + backup (a remoção do `0034` é nominal e pontual).

## 13. Veredito final
**PRONTO PARA USO COM RESSALVAS PONTUAIS.** O site publicado é funcional, aberto (sem login), conectado a dados reais e com base íntegra; testes unitários e build verdes. Não há bloqueador para o uso comum.

**Para congelar com tranquilidade, resolver primeiro (todas de baixo risco):**
1. Remover o chamado de teste `GOP-AR-2026-0034` (+ seu evento).
2. Atualizar o e2e desatualizado (`e2e/dossier.spec.js:9`).
3. Corrigir a cor dos badges de prioridade acentuados (Média + Crítica) — hoje a maioria das linhas exibe a prioridade sem cor.
4. Restaurar rótulos/`aria-label` da navegação em ≤1024px.

> **Nota de confiabilidade:** os achados de **Alta prioridade** acima foram **re-verificados diretamente** pelo Claude (leitura de `App.jsx`/`index.css` + dados live), não apenas reportados por subagentes. O achado do badge foi **ampliado** na verificação (afeta Média além de Crítica). As citações `arquivo:linha` dos subagentes conferiram exatamente nos pontos checados.

Itens de §11 com prioridade média/baixa são polimento pós-congelamento. **Não há promessa visual que o backend não sustente** (as telas leem/gravam nas tabelas reais; views/RPC não-usadas são diagnóstico, não divergência).

---

### Anexo — Cruzamento entre ferramentas (Claude × Codex × Antigravity)
- **Convergência (Claude + Codex):** app funcional/aberto/conectado; banco íntegro; melhorias frontend implementadas; `GOP-AR-2026-0034` residual; e2e desatualizado; lista desktop com scroll; nav mobile sem nome acessível; chave admin exposta (fora de escopo).
- **Profundidade adicionada por esta auditoria:** badge "Crítica" sem estilo na tabela; conflito de `@media 1024px` (nav só-ícones); toast de sucesso em carga parcial; `schools` não persistido; `schoolLogs` órfãos; duplicação de limiares/status no `App.jsx` (viola CLAUDE.md); cobertura calculada em 3 lugares.
- **Antigravity (relatório anterior):** havia concluído "produção 100% funcional/sem risco" durante a janela em que o RLS estava endurecido — incorreto à época (validou via service_role/dev-local). Após o revert da Fase 4 + correção do Storage, a produção de fato voltou ao modelo aberto, agora confirmado pelas 3 ferramentas pela camada anon.
