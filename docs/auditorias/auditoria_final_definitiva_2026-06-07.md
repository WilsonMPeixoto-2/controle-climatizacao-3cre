# Auditoria Final Definitiva - Gestao de Climatizacao Escolar

Data: 2026-06-07
Auditor: Codex
Repositorio local: C:\Users\okidata\.gemini\antigravity-ide\scratch\controle-climatizacao-3cre
Site publicado: https://controle-climatizacao-3cre.vercel.app/
Artefatos visuais: C:\Users\okidata\OneDrive\Área de Trabalho\CLIMATIZAÇÃO\auditoria_final_codex_20260607

## 1. Sumario executivo

O site publicado esta funcional para o uso operacional principal: painel, mapa, lista, consulta por escola, registro de chamado, ficha de edicao, anexos, dossie e comunicacoes carregam com dados reais do Supabase. A conexao com a base de producao foi verificada por consultas diretas e por testes no navegador contra o site publicado.

O estado do Git esta sincronizado entre local e remoto: `HEAD` e `origin/master` estao no commit `08f17ed630e99b46b8068dbb013326cd28749a01`, sem commits locais pendentes. O arquivo deste relatorio esta nao rastreado por escolha da auditoria, sem commit.

As melhorias visuais e de logica operacional estao majoritariamente implementadas: severidade por inatividade, ordenacao unificada, agrupamento de chamados repetidos, familias de KPIs, tabela em cards no mobile, comunicacoes empilhada, tema persistido e tipografia nao monoespacada nos campos comuns.

Nao classifico o projeto como perfeito/congelavel sem ressalvas. Ha pendencias reais de baixo a medio risco: um registro de teste externo ficou na base (`GOP-AR-2026-0034`), um teste E2E esta desatualizado por texto antigo, a lista desktop ainda usa rolagem horizontal interna, a navegacao mobile por icones esta sem nomes acessiveis, os badges de prioridade com acento perdem a cor da pilula e o modal principal precisa de reforco de acessibilidade.

Veredito: pronto para uso com correcoes pontuais antes de congelar.

## 2. Estado Git e deploy

Comandos executados: `pwd`, `git remote -v`, `git branch --show-current`, `git status --short`, `git fetch --all --prune`, `git rev-parse HEAD`, `git rev-parse origin/master`, `git rev-list --left-right --count origin/master...HEAD`, `git log --oneline --stat -n 10`, `Invoke-WebRequest https://controle-climatizacao-3cre.vercel.app/`.

| Item | Resultado |
| --- | --- |
| Branch | `master` |
| Commit local | `08f17ed630e99b46b8068dbb013326cd28749a01` |
| Commit remoto | `08f17ed630e99b46b8068dbb013326cd28749a01` |
| Ahead/behind | `0 0` |
| Working tree antes do relatorio | Limpa |
| Working tree apos o relatorio | Apenas `docs/auditorias/auditoria_final_definitiva_2026-06-07.md` nao rastreado |
| Deploy publicado | HTTP 200 |
| Bundle publicado | JS `/assets/index-CydMDQ4Z.js`; CSS `/assets/index-BFSzuY23.css` |
| Tela obrigatoria de entrada | Nao observada; site abre direto no painel |
| Observacao de escopo | Existe botao `Administracao dos Dados` com prompt de chave exposta. Isso nao bloqueia o uso comum, mas nao deve dominar a continuidade do projeto. |

Commits recentes relevantes:

| Commit | Tipo | Arquivos | Avaliacao |
| --- | --- | --- | --- |
| `08f17ed` | Banco/frontend/mobile | `src/App.jsx`, `src/index.css`, migration cascade | Ajusta restricao em historico, largura e touch targets. |
| `95de838` | Storage/anexos | `src/App.jsx`, migration storage | Corrige upload/delecao de anexos. Testado no site publicado. |
| `27d3915` | UI/texto | `src/App.jsx` | Ajusta icones e texto do resumo. |
| `61fcc80` | Logica | `src/App.jsx` | Usa normalizacao centralizada de setor. |
| `ac78bd9` | Banco/schema/logica | `src/lib/logic.js`, `supabase/schema.sql`, migration | Sincroniza view de climatizacao e normalizacao. |
| `1c8abe7` | Reversao de frente fora do escopo | docs, App, CSS, migration | Remove a barreira de entrada que havia sido introduzida. |
| `6fa149b` | UI/acessibilidade | `src/App.jsx`, `src/index.css` | Legendas visuais e rótulos textuais de status/prazos. |

## 3. Arquitetura analisada

Arquivos centrais analisados:

- `src/main.jsx`: ponto de entrada React, `StrictMode`, `ErrorBoundary`.
- `src/App.jsx`: aplicacao principal, abas, carregamento Supabase, filtros, dashboard, cadastro, edicao, dossie, anexos, comunicacoes.
- `src/index.css`: tema, tokens, responsividade, tabela mobile, foco, movimento reduzido.
- `src/components/OperationalMap.jsx`: mapa operacional por bairro.
- `src/components/ErrorBoundary.jsx`: tratamento de falhas de renderizacao.
- `src/lib/logic.js`: metricas, severidade, urgencia, normalizacao, e-mail.
- `src/lib/operationalIntelligence.js`: leituras gerenciais e agrupamento de acao.
- `src/lib/schoolDossier.js`: dossie por unidade.
- `src/lib/attachments.js`: upload, listagem, remocao e URLs de anexos.
- `src/lib/validation.js`: validacoes Zod para chamados e historico.
- `supabase/schema.sql` e `supabase/migrations/*`: tabelas, views, funcoes, storage.
- `test/*.mjs` e `e2e/dossier.spec.js`: testes unitarios, smoke e E2E.

## 4. Testes executados

| Teste/comando | Resultado | Evidencia | Observacao |
| --- | --- | --- | --- |
| `npm run lint` | PASS | ESLint sem erros | Sem bloqueio. |
| `npm test` | PASS | Logic: 53/53; attachments: 85/85; dossie e smoke passaram | Testes usam `src/data/db.json` com 30 chamados; banco real tem 31. |
| `npm run build` | PASS | Vite gerou `index-BFSzuY23.css` e `index-CydMDQ4Z.js` | Aviso de chunk JS > 500 kB; melhoria futura. |
| `npm run test:e2e` | FAIL parcial | 2 passaram, 1 falhou | Falha por texto antigo: teste espera `Resumo operacional de hoje`, app atual mostra `Resumo operacional`. |
| Site publicado | PASS | HTTP 200; bundle atual | Deploy esta servindo a versao atual. |
| Edicao + recarga + reversao | PASS | Playwright no site publicado; eventos temporarios limpos | Salvamento persistiu e reversao persistiu. |
| Upload + remocao de anexo | PASS | Screenshot `desktop-10-attachment-upload-tested.png`; metadado e Storage com marcador zero | O PDF temporario apareceu e foi removido. |
| Registro de chamado | PASS | Screenshot `desktop-11-register-tested.png`; gerou `GOP-AR-2026-0038`; depois limpo | O chamado temporario foi removido. |
| Comunicacoes | PASS | Preview formatado e botao copiar presentes | Usa dados reais do chamado selecionado. |
| Mobile | PASS com ressalvas | Screenshots `mobile-*.png`; sem overflow global | Lista muito extensa e nav por icones sem nome acessivel. |

Limpeza dos testes Codex: `DELETE` controlado por marcador removeu 1 chamado temporario e 3 eventos temporarios. Verificacao final retornou zero em `chamados`, `historico`, `anexos_chamado` e `storage.objects` para `AUDITORIA_CODEX_FINAL_20260607`.

## 5. Supabase e dados reais

Consultas executadas: `diagnostico_operacional()`, contagem de tabelas, views, status, prioridades, orfaos, percentual de climatizacao, densidade e registros recentes.

| Item | Resultado |
| --- | --- |
| Escolas | 134 |
| Chamados | 31 |
| Historico | 67 |
| Anexos | 1 |
| Modelos de e-mail | 8 |
| Chamados sem escola | 0 |
| Historico sem chamado | 0 |
| Anexos sem chamado | 0 |
| Status invalidos | 0 |
| Prioridades invalidas | 0 |
| `vw_chamados_ativos` | 22 |
| `vw_chamados_por_bairro` | 21 |
| `vw_chamados_por_status` | 6 |
| `vw_chamados_sem_anexo` | 21 |
| `vw_chamados_sem_movimentacao` | 22 |
| `vw_escolas_resumo_climatizacao` | 134 |
| `vw_integridade_operacional` | 0 |
| Percentual de climatizacao > 100 | 0 |
| Densidade de aparelhos | Preservada; maior densidade: Eurico Vilela 2.90 |

Distribuicao real por status:

| Status | Total |
| --- | ---: |
| `10 - Concluido` | 9 |
| `2 - Em vistoria tecnica` | 2 |
| `4 - Aguardando orcamento` | 8 |
| `5 - Orcamento em analise/decisao` | 2 |
| `7 - Adequacao em execucao` | 8 |
| `9 - Aguardando aparelho/instalacao` | 2 |

Prioridades: `Alta = 1`; `Media = 30`.

Pendencia de dados: o banco contem `GOP-AR-2026-0034`, `unidade_escolar = Escola Teste Auditoria Antigravity`, `designacao = 312001`, mas a escola real dessa designacao e `Escola Municipal Oswaldo Cruz`. Isso nao aparece como orfao porque a designacao existe, mas e divergencia semantica e polui dashboard, lista e comunicacoes.

## 6. Mapeamento frontend <-> Supabase

Evidencia principal em `src/App.jsx`: carregamento inicial de `escolas`, `chamados`, `historico`, `anexos_chamado`, `modelos_email` nas linhas aproximadas 564-621; cadastro em 1415-1510; edicao via RPC em 1380-1381; historico manual em 1272; anexos em 527-560; comunicacoes em 5187-5377.

| Tela/funcao | Origem dos dados | Operacoes | Status | Observacao |
| --- | --- | --- | --- | --- |
| Dashboard | `chamados`, `escolas`, `historico` | Leitura + calculos frontend | Coerente | Totais exibidos batem com 31/22. |
| Mapa | `escolas`, `chamados` | Leitura + agregacao por bairro | Coerente | Clique em Inhauma mostrou 19 escolas e 2 chamados ativos. |
| Lista | `chamados`, `anexos_chamado` | Leitura, filtro, ordenacao, abertura da ficha | Coerente | Exibe 31 de 31; inclui residuo externo. |
| Registro | `escolas`, `chamados`, `historico` | Insert chamado + insert historico | Coerente | Teste gerou ID real e foi limpo. |
| Modal/ficha | `chamados`, `historico`, `anexos_chamado` | RPC de salvamento, insert historico, upload/delete anexo | Coerente | Testado com persistencia e recarga. |
| Dossie | `escolas`, `chamados`, `historico`, `anexos_chamado` | Leitura consolidada | Coerente | Tela renderiza resumo tecnico e linha do tempo. |
| Comunicacoes | `chamados`, `modelos_email` | Gera minuta e permite copia | Coerente | Preview formatado e edicao de texto presentes. |
| Views gerenciais | `vw_*` | Nao usadas diretamente pelo frontend | Parcial por desenho | Existem e retornam dados; sao apoio de auditoria/diagnostico, nao renderizacao principal. |

Nao encontrei chamada frontend a `vw_*`; as views estao implementadas no banco, mas usadas como diagnostico/auditoria, nao como fonte direta do site.

## 7. Verificacao das melhorias frontend/layout

| Item | Status | Evidencia | Avaliacao |
| --- | --- | --- | --- |
| Severidade por inatividade | IMPLEMENTADO | `src/lib/logic.js:157` | Faixas OK/ATENCAO/ALTO/CRITICO existem. |
| Ordenacao unificada | IMPLEMENTADO | `compararUrgencia` em `src/lib/logic.js:168`; `ordenarPorUrgencia` em 182 | Usada pela inteligencia operacional. |
| Agrupamento de repetidos | IMPLEMENTADO | `stuck-group-aggregated` em `src/lib/operationalIntelligence.js:252` | Aparece em “O que exige acao agora”. |
| KPIs por familias | IMPLEMENTADO | Dashboard separa inatividade e antiguidade | Visual confirmado em `desktop-01-dashboard.png`. |
| Normalizacao de setor | IMPLEMENTADO | `normalizeSector` em `src/lib/logic.js:41`; uso em App | Unifica `GIN / Unidade Escolar` e variantes. |
| Tabela vira cards no mobile | IMPLEMENTADO | `data-label` em `src/App.jsx:3155+`; CSS `max-width:768px` em `src/index.css:3447+` | Funciona, mas lista fica muito longa. |
| Comunicacoes empilhada no mobile | IMPLEMENTADO | `.email-composer-layout` em `src/index.css:1378` e media query 3529 | Confirmado em `mobile-06-comunicacoes.png`. |
| Cabecalho compacto mobile | IMPLEMENTADO | CSS mobile esconde textos da sidebar e reorganiza topo | Funciona visualmente, mas falta nome acessivel nos icones. |
| Tipografia sem monospace indevida | IMPLEMENTADO | `textarea` e `.email-preview-body` usam fonte sans | Campos comuns nao usam mono. |
| Legendas textuais de status | IMPLEMENTADO | Legenda de prazos/status na lista e cards | Boa clareza operacional. |
| Persistencia de tema | IMPLEMENTADO | `gop_theme` em `src/App.jsx:273-282` | Alternancia persiste em reload. |
| Foco visivel | IMPLEMENTADO | `src/index.css:2105-2119` | Adequado no CSS. |
| Movimento reduzido | IMPLEMENTADO | `prefers-reduced-motion` em `src/index.css:2135` | Adequado. |
| Cores com texto | PARCIAL | Badges + legenda existem | Alguns chips truncam em colunas estreitas/mobile. |

## 8. Avaliacao por tela

### Dashboard

Pontos fortes: excelente hierarquia, resumo operacional claro, separacao correta entre inatividade e antiguidade, mapa visualmente forte, cards de acao orientam prioridade.

Problemas reais: nenhum bloqueador funcional. Ajuste recomendado: alguns rotulos pequenos no mapa/status podem ficar apertados.

Prioridade: baixa.

### Mapa

Pontos fortes: carrega, zoom funciona, clique por bairro abre detalhes e lista escolas/chamados vinculados. O uso de cor + legenda ajuda a entender concentracao.

Problemas reais: em mobile o mapa fica mais estreito e denso; ainda utilizavel, mas nao excelente.

Prioridade: media-baixa.

### Lista de chamados

Pontos fortes: filtros, busca, exportacao CSV, legendas e abertura da ficha funcionam. A lista reflete os 31 chamados reais.

Problemas reais: desktop tem rolagem horizontal interna (`clientWidth 1012`, `scrollWidth 1608` observado por Playwright). No mobile, cards funcionam mas a pagina fica muito longa e alguns textos/badges truncam. O residuo `GOP-AR-2026-0034` aparece aqui.

Prioridade: media.

### Registro

Pontos fortes: autocomplete de escola, validacao, insert real no Supabase e evento inicial no historico funcionam. Teste gerou `GOP-AR-2026-0038` e depois foi limpo.

Problemas reais: nenhum bloqueador. Ajuste visual pequeno em selects longos.

Prioridade: baixa.

### Modal/ficha

Pontos fortes: edicao persistente, historico de alteracoes, ficha tecnica, anexos, minutar e-mail. Upload e remocao de PDF testados.

Problemas reais: modal mobile e longo e exige muita rolagem, mas nao quebra. Alguns campos pequenos podem truncar texto longo.

Prioridade: media-baixa.

### Dossie

Pontos fortes: consolida escola, cobertura, chamados, anexos e linha do tempo. Boa tela de apoio gerencial.

Problemas reais: alguns badges longos extrapolam em largura estreita.

Prioridade: baixa.

### Comunicacoes

Pontos fortes: gera assunto, destinatario e minuta formatada a partir do chamado e modelo. Botao de copiar existe e a tela empilha corretamente no mobile.

Problemas reais: o chamado de teste externo aparece como primeira opcao e polui a minuta. No mobile, o select e alguns trechos destacados ficam apertados.

Prioridade: media por causa do dado residual.

### Administracao dos Dados

Pontos fortes: nao interfere no fluxo comum.

Problema real: o botao exibe prompt com chave padrao visivel (`GOP-ADMIN-3CRE`). E uma area fora do escopo operacional principal e deve ser tratada com cuidado para nao reabrir frente paralela.

Prioridade: media, por higiene de produto.

## 9. Avaliacao da logica de dados

| Regra/calculo | Evidencia | Origem | Status | Observacao |
| --- | --- | --- | --- | --- |
| Chamados ativos | Dashboard + views | `chamados.status_atual` | Correto | 22 ativos no banco e no painel. |
| Concluidos | Status `10 - Concluido` | `chamados` | Correto | 9 concluidos. |
| Inatividade | `diasDesdeMovimentacao`, `severidadeInatividade` | `modificado_em`, historico | Correto | KPIs +15d e +7d aparecem. |
| Antiguidade | `diasEmAberto` | `criado_em`/`data_solicitacao` | Correto | Separado da inatividade. |
| Urgencia | `compararUrgencia` | status, prioridade, datas | Correto | Usado em acoes prioritarias. |
| Agrupamento de chamados | `stuck-group-aggregated` | chamados parados | Correto | Evita repeticao excessiva. |
| Setor responsavel | `normalizeSector` | `setor_responsavel` | Correto | Normaliza variantes GIN/Unidade. |
| Cobertura climatizacao | view + frontend | `escolas` | Correto | View limita percentual a 100 e preserva densidade. |
| Dossie | `buildSchoolDossier` | escolas/chamados/historico/anexos | Correto | Sem divergencia estrutural observada. |
| Comunicacoes | `buildEmailDraft` | modelos + chamado | Correto | Funciona, mas depende de dado selecionado limpo. |

## 10. Avaliacao visual/design

O layout atual e forte no desktop: identidade institucional clara, tema escuro consistente, hierarquia visual bem resolvida, bons contrastes de cards e chamadas de prioridade. O dashboard esta acima de “usavel”; ele esta maduro e util para leitura executiva.

A lista e o mobile ainda nao estao no mesmo nivel do dashboard. A tabela desktop e tecnicamente funcional, mas depende de rolagem horizontal interna. No celular, a conversao para cards evita quebra global, mas a pagina fica excessivamente longa para 31 chamados, e a navegacao por icones perde nomes acessiveis.

O tema claro/escuro e persistido e esta bem acabado. A tipografia nao monoespacada nos campos melhorou a leitura. As legendas textuais reduzem dependencia exclusiva de cor.

## 11. Pontos fortes

- Painel executivo claro e diretamente relacionado a decisao operacional.
- Dados reais do Supabase carregam e sustentam dashboard/lista/mapa/dossie/comunicacoes.
- Regras de severidade, urgencia e agrupamento estao implementadas em helpers dedicados.
- Registro, edicao, anexos e comunicacoes funcionam no site publicado.
- Views de auditoria existem e retornam dados coerentes.
- Integridade operacional sem orfaos, status invalidos ou prioridades invalidas.
- Tema, responsividade e acabamento visual tiveram evolucao real.

## 12. Pontos de melhoria reais

| Recomendacao | Evidencia | Impacto | Risco de alterar | Prioridade |
| --- | --- | --- | --- | --- |
| Remover/corrigir `GOP-AR-2026-0034` | Registro de teste externo com unidade divergente | Evita poluir dashboard, lista e minutas | Baixo se feito por script controlado e backup | Alta |
| Atualizar E2E desatualizado | `npm run test:e2e` falha por texto antigo | Evita falso negativo antes do congelamento | Baixo | Alta |
| Corrigir badges de prioridade com acento | Playwright: `badge-priority-média` fica transparente; CSS principal so tem `.badge-priority-media` | Recupera leitura visual de prioridade em 30/31 chamados atuais | Baixo | Alta |
| Nomear botoes mobile de navegacao | Playwright mobile: `innerText` vazio, `span display:none`, sem `aria-label`/`title` | Acessibilidade e orientacao do usuario | Baixo | Media |
| Reduzir rolagem horizontal da lista desktop | `.lists-table-wrapper` scrollWidth 1608 vs clientWidth 1012 | Melhor leitura repetida e impressao de polimento | Medio | Media |
| Compactar lista mobile | `mobile-02-lista.png` muito longa | Menos fadiga operacional em campo | Medio | Media |
| Remover/ocultar chave padrao do prompt administrativo | Screenshot `desktop-07-admin-click-dismissed.png` | Higiene de produto e escopo | Medio | Media |
| Adicionar semantica acessivel ao modal | `src/App.jsx:5592-5597` nao define `role=dialog` nem `aria-modal` | Melhora teclado/leitor de tela | Baixo | Media |
| Revisar carregamento parcial da base online | `src/App.jsx:564-632` trata erro forte em escolas/modelos, mas aceita dados parciais de chamados/historico/anexos | Evita falsa percepcao de carga completa | Baixo | Media |
| Persistir escolas no fallback local ou explicitar limite | `localStorage` persiste chamados/historico/notas, mas nao escolas | Evita diferenca de comportamento em modo local | Baixo | Media-baixa |
| Limpar/deduplicar notas locais de escola ao conectar base online | `gop_school_notes` pode conviver com historico online | Evita duplicidade/ruido em dossie | Medio | Media-baixa |
| Centralizar limiares de 7/15/30/60 no App | App usa numeros literais em filtros mesmo com constantes em `logic.js` | Reduz risco de drift futuro | Baixo | Media-baixa |
| Alinhar testes locais ao banco real ou explicitar fixture | `npm test` usa 30 chamados; Supabase tem 31 | Evita falsa sensacao de paridade | Baixo | Media-baixa |
| Quebrar bundle grande futuramente | Vite alerta chunk > 500 kB | Performance inicial | Medio | Baixa |

## 13. O que nao deve ser mexido agora

- Nao reabrir frentes paralelas fora do escopo operacional.
- Nao redesenhar o dashboard inteiro; ele esta funcionando bem.
- Nao trocar a fonte, paleta ou arquitetura visual por preferencia estetica.
- Nao substituir as regras de calculo ja testadas sem caso concreto.
- Nao mexer nas views apenas porque o frontend nao as usa diretamente; elas servem bem como diagnostico.
- Nao fazer limpeza ampla de banco sem lista nominal de registros e backup.

## 14. Conclusao

O site publicado esta funcional e coerente com o Supabase para o usuario comum. As melhorias de layout/frontend foram realmente implementadas, especialmente no dashboard, nas regras de prioridade/inatividade, na separacao dos KPIs, na responsividade basica e na tela de comunicacoes.

Nao ha promessa visual importante que o backend nao sustente: as telas principais leem e gravam nas tabelas reais. As views gerenciais existem e retornam dados, mas nao sao fonte direta de renderizacao do site; isso deve ser entendido como apoio de auditoria, nao como divergencia.

Nao ha bloqueador imediato para uso comum. Para congelar com tranquilidade, eu corrigiria primeiro: o registro residual `GOP-AR-2026-0034`, o teste E2E desatualizado, os nomes acessiveis da navegacao mobile e o refinamento da lista em desktop/mobile.

Classificacao final: pronto para uso com ressalvas pontuais; ainda nao perfeito/congelavel sem uma pequena rodada de limpeza e polimento.



## 15. Complemento verificado a partir do relatório externo

Este complemento foi adicionado apos comparar o relatório externo com verificacoes diretas no codigo e no site publicado. Nao incorporei afirmacoes apenas por autoridade de outra ferramenta.

### Achados novos confirmados

| Achado | Evidencia verificada | Impacto | Prioridade |
| --- | --- | --- | --- |
| Badges de prioridade com acento perdem cor | `src/App.jsx:2448`, `3211`, `4309` geram classe por `prioridade.toLowerCase()`; CSS principal em `src/index.css:1025-1040` define `media/critica` sem acento. Playwright no site publicado confirmou `badge-priority-média` com `backgroundColor: rgba(0,0,0,0)`. | A prioridade `Média` representa 30/31 chamados e fica sem pilula colorida na lista. | Alta |
| Navegacao mobile fica so com icones sem nome acessivel | CSS `src/index.css:1809-1844` oculta `.sidebar-item span`; outro bloco `max-width:1024px` em `3088+` nao restaura o texto. Playwright mobile confirmou `innerText` vazio, `span display:none`, sem `aria-label`/`title`. | Afeta orientacao do usuario e acessibilidade. | Media |
| Modal principal precisa de semantica acessivel | `src/App.jsx:5592-5597` renderiza overlay/container sem `role=dialog`, `aria-modal` e sem foco inicial/trava de foco. | Nao quebra uso comum, mas e lacuna real de acessibilidade. | Media |
| Classe `skeleton-loader` parece codigo morto | `src/index.css:3404` define a classe; `rg` nao encontrou uso no JSX. | Loading inicial poderia ser mais claro ou o CSS removido futuramente. | Baixa |
| Escolas nao sao persistidas no fallback local | `src/App.jsx:237-259` persiste chamados/historico; `297-309` persiste notas; nao ha persistencia equivalente para `schools`. | Em modo local, o comportamento pode divergir apos reload. | Media-baixa |
| Notas locais de escola podem conviver com historico online | `schoolLogs` usa `gop_school_notes` e e mesclado ao dossie junto do historico real. | Pode gerar ruido se notas locais antigas ficarem no navegador. | Media-baixa |
| Limiar de filtros aparece literal no App | `src/App.jsx:794-806` usa `7`, `15`, `30`, `60`; `src/lib/logic.js` possui constantes equivalentes. | Risco de drift futuro se os limiares mudarem. | Media-baixa |

### Pontos do relatório externo que convergem com esta auditoria

- App publicado funcional e aberto diretamente no painel.
- Git local/remoto sincronizado no commit `08f17ed`.
- Supabase com 134 escolas, 31 chamados totais, 67 eventos, 1 anexo, 8 modelos.
- Integridade sem orfaos, sem status invalidos e sem prioridades invalidas.
- Registro residual `GOP-AR-2026-0034` e divergencia entre nome da unidade e designacao.
- E2E desatualizado por texto antigo.
- Views `vw_*` existem e retornam dados, mas nao sao fonte direta do frontend.
- Lista desktop com rolagem interna e mobile muito longa.

### Pontos nao incorporados como conclusao independente

- Afirmacoes sobre politicas de banco e modelo de permissao nao foram ampliadas neste relatorio para nao deslocar o foco operacional. O que importa para esta auditoria foi verificado pelo funcionamento real de leitura, cadastro, edicao e anexo no site publicado.
- Sugestoes de refatoracao ampla do `App.jsx` ficaram fora das prioridades imediatas. O arquivo e grande, mas o sistema esta estavel; a recomendacao pratica e evitar que novas frentes aumentem ainda mais o monolito.
