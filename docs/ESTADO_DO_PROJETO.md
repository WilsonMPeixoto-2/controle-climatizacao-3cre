# Estado do Projeto — Controle de Climatização (3ª CRE / GOP)

> **Sua fonte única.** Atualizado em **08/06/2026**. Substitui os relatórios espalhados.
> Tudo aqui foi **verificado direto no código / no git / no site / no banco vivo** nesta
> sessão — não é eco de relatório de outra ferramenta.

---

## Como ler este documento (30 segundos)

- **✅ Provado OK** = está funcionando e foi conferido agora.
- **🟡 Opcional / pendência pequena** = não impede o uso; lapidação de robustez. É *decisão*, não defeito.
- **🎯 Falta de verdade** = o trabalho que ainda vale fazer (é pouco, e é o que você queria: visual).

A regra de ouro contra a sensação de "loop infinito": **só conta como "falta" o que está em 🎯.**
O resto é opcional e pode ficar como está sem culpa.

---

## 1. O que é o site (não mudou)

Ferramenta de **registro e monitoramento** dos chamados de ar-condicionado das escolas da
3ª CRE, para a **GOP**. Faz o que as planilhas faziam, em formato muito melhor: registrar,
atualizar andamento, consultar por escola, painel/alertas/mapa, gerador de e-mail.
**Não** é gestão do parque de aparelhos (isso é da CTO). **Sem login** (dado aberto — decisão).

---

## 2. ✅ O que está PROVADO OK

| Item | Como foi provado (agora) |
|---|---|
| **O site está no ar e funcionando** | HTTP 200; título correto; bundle `index-HLk0Rw7s.js` em produção. |
| **O banco está íntegro** | Consulta ao vivo: 134 escolas · 30 chamados · 66 histórico · 1 anexo · 8 modelos. **0 chamados sem escola · 0 histórico órfão · 0 status nulo.** |
| **As regras de negócio estão certas** | Conferidas linha a linha contra o CLAUDE.md: 11 etapas de status; encerrados/suspensos nunca alertam; inércia âmbar≥7/vermelho≥15; antiguidade roxo≥30/≥60; setores GOP/GIN/CPS/CTO; tudo relativo a HOJE. **Zero divergência.** |
| **Os testes passam** | `lint` + 4 suites (lógica, anexos, dossiê, smoke) + `vite build` + Playwright e2e **3/3** — todos verdes nesta sessão. |
| **Não há login/autenticação** | Busca completa no código: **zero** resíduo da "Fase 4" revertida. (Existe só o gate do painel admin por senha — isso é esperado e não é login de usuário.) |
| **O dossiê da escola ficou consistente** | Commit `9e11f59` unificou o "match escola↔chamado/evento" (o que fazia um chamado com designação nula sumir do dossiê). Coberto por teste novo (Teste 8). Suite 40/40. |

> ⚠️ **Detalhe honesto:** a correção do dossiê acima (`9e11f59`) está **commitada localmente,
> mas ainda NÃO foi publicada** (produção roda a versão anterior, que também funciona). Publica-se
> quando você der o OK.

---

## 3. 🟡 Opcional / pendências pequenas (nenhuma impede o uso)

| Item | Severidade | Decisão |
|---|---|---|
| Cobertura = densidade de aparelhos por sala | informativo | **Mantido** (decisão de domínio). |
| Fuso horário no cálculo de dias (±1 dia em fronteiras de 7/15/30/60) | baixo/médio | Mantido; mitigável num passe futuro. |
| "Encerrar chamado concluído" pode subir na fila de ações | baixo | Lapidação futura. |
| `id_evento` por timestamp em **1** ponto (nota de comentário) | baixo | Quase teórico (a chave é PK; colisão falharia o insert, não corrompe). |
| Carregamento da nuvem não é 100% atômico em falha parcial | baixo | Robustez futura. |

Estes itens existem em **qualquer** software auditado a fundo. Não são sinal de que algo quebrou.

---

## 4. 🎯 O que falta DE VERDADE (o trabalho que vale fazer = visual)

Tudo aqui é **polimento visual, em escopo, finito e visível**:

1. **Reorganizar a página inicial — "herói dividido"** *(direção já escolhida por você)*:
   mapa grande à esquerda + KPIs em trilha compacta à direita, dialogando lado a lado;
   abaixo, resumo operacional, donut e lista. No celular empilha (mapa → KPIs → resto).
   *Hoje o mapa cai no meio da página, embaixo de 6 cards — é isso que muda.*
2. **Elevar a qualidade visual do mapa (claro E escuro)**: paletas coroplético mais coesas
   com a identidade do site, contornos/realces mais nítidos, rótulos com melhor contraste,
   transições suaves, e possivelmente uma legenda discreta. (Detalhe técnico no item 6.)

**Critério de "pronto" (a linha de chegada):** mapa como abertura clara da home; blocos
diagramados sem espaços mortos; mapa bonito e legível nos dois temas; build + e2e verdes;
capturas de tela aprovadas. **Atingido isso, PARA.**

---

## 5. ⚠️ Estado da cópia compartilhada (coordenação entre ferramentas)

A cópia local é **uma só**, usada por várias ferramentas. Estado atual:

- **Commitado (branch `fix/logic-v2-dossier-match`, local):** `9e11f59` — correção do dossiê + testes (meu).
- **Não-commitado no working tree (lote de outra ferramenta + meus quick-wins):**
  normalização de setor ao carregar; sincronização local→nuvem **desativada por segurança**;
  SQL do painel admin alinhado ao banco real; novas opções de setor; ajuste do diagnóstico de
  órfãos (`schema.sql` + migration); meus quick-wins de App.jsx (NaN%, IDs por UUID, reset de
  conexão). Verificado: **net-positivo/neutro**, sem teste direto na parte de UI.
- **Recomendação:** consolidar esse lote em **um commit claro** (descartando só os artefatos de
  dev-server `.pid`/logs que não se versiona) para deixar a cópia limpa **antes** de começar o
  bloco visual. Nada é publicado sem seu OK.

---

## 6. Regras que NÃO mudam (âncora de escopo)

- **Sem login / sem autenticação de usuário.** Dado aberto. Fora de escopo.
- **GOP, não CTO.** O site informa o ciclo do chamado; não gerencia o parque de aparelhos.
- **Usabilidade radical.** Público com aversão à tecnologia: tudo tem que parecer simples.
- **Lógica congelada.** As regras de negócio estão certas e conferidas; não mexer sem pedido seu.
- **Modernizar o "como" é bem-vindo; ampliar o "o quê" não.**

---

*Detalhes técnicos completos: `CLAUDE.md`, `docs/CONTEXTO.md`. Auditorias anteriores: `docs/auditorias/`.*
