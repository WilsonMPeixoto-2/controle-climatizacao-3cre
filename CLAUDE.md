# Controle de Climatização — 3ª CRE / GOP

Ferramenta de **registro e monitoramento** dos chamados de manutenção/instalação de
ar‑condicionado das escolas da 3ª CRE, para uso do setor **GOP (Gerência de Operações)**.
Hoje a GOP faz isso em planilha; este site é a mesma função em formato melhor.

---

## ⛔ LIMITE DE ESCOPO — leia antes de propor qualquer coisa (regra nº 1)

Esta ferramenta **registra e monitora o que é da GOP — e nada além disso.**

A GOP **recebe** pedidos das escolas, **acompanha** o andamento e **informa** os setores
parceiros. Ela **não executa** a manutenção, **não compra**, **não controla estoque** e
**não é dona do inventário** de aparelhos. O software reflete exatamente essa fronteira.

**Está FORA de escopo (não construir sem pedido explícito e consciente do Wilson):**
- Gestão completa do ciclo de vida do ar‑condicionado.
- Estoque / almoxarifado, compras, contratos, ordens de serviço.
- Gestão da execução da manutenção (técnicos, agendas, visitas).
- Inventário de aparelhos como função editável do sistema (é só referência).
- Autenticação, perfis, RLS, BI/relatórios além dos painéis já definidos.
- Automações, notificações, integrações entre setores.
- Reescrita arquitetural ampla.

**Teste de toda proposta:** *"isto é registrar/monitorar um pedido da GOP, ou é
executar/gerir o ar‑condicionado?"* Se for a segunda, **está fora** — pare e pergunte.

O site **pode** modernizar a *forma* de fazer o que a GOP já faz (UX, painéis, gerador
de e‑mail). O site **não pode** acrescentar tarefas nem monitoramentos novos.

> Por que isto é a regra nº 1: o objetivo é **concluir** um site simples e funcional.
> O risco real do projeto é o loop de "melhorias" que adiam a entrega. Traduzir o que a
> planilha já faz — não reinventar. Parar quando o aceite for atingido.

---

## O que a GOP faz (os 3 verbos = o produto inteiro)

1. **Registrar** o chamado inicial — ID único; escolhe a escola → designação/endereço/
   bairro vêm sozinhos; tipo de demanda, status inicial, setor responsável, datas.
2. **Atualizar** o andamento conforme **outros setores** agem — status, setor atual,
   próxima providência, e a *data da última movimentação* (que zera o contador de inércia).
3. **Consultar por unidade escolar** — dados da escola + chamados dela + linha do tempo.
   Tela só‑leitura ("como está a Escola X?").

Apoio: painel (totais + ranking dos mais parados), alertas por cor, modelos de e‑mail.

## As duas planilhas atuais (o ponto de partida)

A GOP trabalha hoje com **duas planilhas que não se cruzam** — esse é o problema que a
ferramenta resolve dando visibilidade, **sem** virar gestor de inventário:
- **Operacional / viva** ("Consultoria de Climatização — 3 CRE"): os pedidos em
  andamento (status, observações, datas de tratativa/atualização). É o núcleo. ≈28 casos.
- **Inventário** ("Dados de climatização v1"): foto do parque por escola (splits, salas),
  datada (ex.: março), **desatualizada e sem vínculo** com a operacional. **Só referência.**

Decisão de origem: não depender da integração entre setores (que falha por relação, não
por técnica), e sim buscar a verdade **na fonte — as unidades escolares**.

## Modelo de dados (3 pilares)

- **`chamados`** — registro mestre, 1 linha por demanda (`id_chamado` único): escola,
  datas (`criado_em`/`modificado_em`/`data_solicitacao`), tipo, `status_atual`,
  `setor_responsavel`, `proxima_providencia`.
- **`historico`** — marcos relevantes por chamado (a memória do caso).
- **`escolas`** — cadastro das ~134 unidades; inventário **de referência** + validação
  (`confirmado_pela_unidade`, `validado_pela_gop`) e `acao_sugerida`.
- (`modelos_email` — textos por etapa, com variáveis `{ID_CHAMADO}`/`{UNIDADE}`/`{DATA}`.)

## Regras de negócio que definem o produto (manter, não ampliar)

Toda a aritmética vive em `src/lib/logic.js` (funções **puras**, testadas). Não duplicar
regra no `App.jsx`.

- **Status:** esquema enxuto de **11 etapas** (`1 - Recebido — em triagem` … `10 - Concluído`,
  `11 - Encerrado`, + `Suspenso / pendente`). Encerrados/suspensos **nunca** disparam alerta.
- **Dois alertas independentes** (medem coisas diferentes; ambos devem existir):
  - **SLA / inércia** = dias SEM movimentação → âmbar ≥ **7**, vermelho ≥ **15**.
  - **Antiguidade** = dias TOTAIS em aberto → roxo ≥ **30**, roxo intenso ≥ **60**.
  - Ex.: atualizado ontem (SLA verde) mas aberto há 90 dias (antiguidade crítica).
- **Cálculos sempre relativos a HOJE** (nada de data fixa no código).
- **Setores reais:** `GOP, GIN, CPS, CTO` (+ responsabilidades compartilhadas, ex.
  "GIN / Unidade Escolar"). O Excel cita "CTIN", mas os dados usam GIN/CPS — as visões
  seguem o que **de fato ocorre**.
- **Ação sugerida** colorida: vermelho = falta confirmação da unidade; âmbar = confirmada
  com necessidade; verde = em dia.

## Stack e fatos operacionais

- **React 19 + Vite**, SPA. Deploy: **Vercel** → `controle-climatizacao-3cre.vercel.app`
  (auto‑deploy no push para `master`; `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY` em Production).
- **Supabase** (projeto `wmnzcujojlygkcszocwb`): tabelas `escolas/chamados/historico/modelos_email`.
- **Segurança:** RLS **desligado** e escrita anônima **por decisão deliberada** (dado
  operacional de baixa sensibilidade, espelha o status quo das planilhas abertas).
  Não adicionar auth/RLS sem pedido — está fora de escopo.
- **Testes:** `npm test` → `node test/logic.test.mjs` (puro Node, sem deps). Rodar sempre
  que mexer em `logic.js`. **Build:** `npm run build`.

## Como trabalhar aqui

- Entregar em **blocos curtos** com critério de aceite; parar quando atingido.
- Fidelidade ao que a planilha/Excel já fazia; **não inventar** capacidade nova.
- Mudou regra de negócio? Mexa em `logic.js` + atualize/rode os testes.
- Detalhes, histórico e o "porquê" das decisões: ver **`docs/CONTEXTO.md`** (consulta sob
  demanda — não precisa ocupar contexto a cada sessão).
