# Controle de Climatização — 3ª CRE / GOP

Ferramenta de **registro e monitoramento** dos chamados de manutenção/instalação de
ar‑condicionado das escolas da 3ª CRE, para uso do setor **GOP (Gerência de Operações)**.
Hoje a GOP faz isso em planilhas básicas, preenchidas à mão; este site é a **mesma função,
em formato muito melhor** — mais fácil, mais bonito, mais automatizado.

---

## ⛔ LIMITE DE ESCOPO — leia antes de propor qualquer coisa (regra nº 1)

**O limite é de DOMÍNIO (o que é regido), NÃO de tecnologia.**

> Modernizar é bem‑vindo. Inovação técnica, automação inteligente e UX sofisticada são
> **desejadas** — o objetivo nunca foi "manter simples por falta de recurso", e sim **não
> deixar a ferramenta virar outra coisa.** Pode‑se executar as tarefas da GOP de formas
> modernas e espertas; o que não muda é **quais** tarefas são essas.

**O que é regido (o domínio, e só ele):** informar, no âmbito da 3ª CRE, **tudo o que
acontece com um chamado, da abertura ao encerramento** — para a GOP acompanhar e **informar
a CTO**.

**A GOP (nosso escopo)** recebe a solicitação da escola, gera um **código de chamado**,
registra os detalhes, **encaminha a outros setores**, registra as **atualizações de status**
e mantém o **registro completo, do início ao fim**.
**A CTO (NÃO é nosso escopo)** é quem controla compra, estoque, manutenção e o **mapeamento
de toda a rede** — com base nas ações de vários setores. O site **não faz** o trabalho da CTO.

**Fica FORA (domínio da CTO / de outros setores) — não construir aqui:**
- Compra, estoque/almoxarifado, contratos de aparelhos.
- Execução da manutenção (técnicos, agendas, ordens de serviço).
- Mapeamento/curadoria do parque de ar‑condicionado da rede como sistema de gestão.
- Aprovações automáticas **entre setores** ou dependência dos sistemas de outros setores —
  a verdade vem **da fonte (as escolas)**, não de integração interinstitucional.

**Fica DENTRO (e pode ser ambicioso no "como"):**
- Tudo que **registra/monitora/informa** o ciclo de um chamado da GOP.
- Lançamento assistido, auto‑preenchimento de dados da escola, consulta por unidade,
  painéis/alertas/ranking sobre os **próprios chamados**, gerador de e‑mail.
- Qualquer modernização de UX ou automação que torne **isso** mais simples e atraente.

**Teste de toda proposta:** *"isto informa o ciclo de um chamado da GOP, ou é gerir o parque
de ar‑condicionado (trabalho da CTO)?"* Se for a segunda, **está fora — pare e pergunte.**

---

## 🎯 USABILIDADE — requisito de primeira classe (tão importante quanto a regra nº 1)

O público são **servidores da 3ª CRE com dificuldade e até aversão à tecnologia** — muitos
não usam nem o Excel básico e preferem **anotações em papel**. O site só vence se for **mais
fácil e mais convidativo que o caderno deles.**

- **Extremamente intuitivo, agradável e convidativo.** Bonito importa — motiva o uso.
- **Complexidade escondida.** Ainda que o site faça coisas complexas, ao usuário **tudo deve
  parecer simples.** A engenharia difícil fica por baixo; a superfície é óbvia.
- **Cada detalhe pensado para o usuário menos técnico:** botões claros, poucas escolhas por
  tela, palavras do dia a dia (não jargão de sistema), navegação entre seções sem confusão,
  lançamento e consulta diretos. Erros explicados em linguagem humana.
- **Métrica de sucesso:** o servidor preferir lançar/consultar aqui a voltar para o papel.

Ao construir qualquer tela, a pergunta é: *"a pessoa que tem medo de tecnologia consegue,
sozinha e sem treino, na primeira vez?"*

---

## O que a GOP faz (o produto inteiro)

1. **Registrar** o chamado — gera **código único**; escolhe a escola → designação/endereço/
   bairro vêm sozinhos da base; registra detalhes da demanda; define status inicial e setor.
   *(Hoje é lançamento manual em planilha; aqui é manual também, porém assistido.)*
2. **Atualizar** o andamento conforme **outros setores** agem — status, setor responsável,
   próxima providência, e a *data da última movimentação*. Manter o registro completo.
3. **Consultar por unidade escolar** — dados da escola + todos os chamados dela + linha do
   tempo, num **status completo**. (Era a aba mais usada das planilhas finais.) Só‑leitura.

Apoio: painel (totais + ranking dos mais parados), alertas por cor, modelos de e‑mail.

**Frente futura já prevista (dentro do escopo):** aceitar abertura de chamado por **Forms**,
com os dados do Forms integrados com **o mesmo valor** dos lançamentos manuais (uma fonte só,
duas portas de entrada). Pode ser desenvolvido como uma frente própria.

## As duas planilhas atuais (o ponto de partida)

Hoje a GOP usa **duas planilhas que não se cruzam** — e a ferramenta dá visibilidade **sem**
virar gestor de inventário:
- **Operacional / viva** ("Consultoria de Climatização — 3 CRE"): os pedidos em andamento
  (status, observações, datas). É o núcleo — corresponde à tabela `chamados`. ≈28 casos.
- **Inventário** ("Dados de climatização v1"): foto do parque por escola (splits, salas),
  datada e **desatualizada**, sem vínculo com a operacional. **Só referência.**

Decisão de origem: não depender de integração entre setores (falha por relação, não por
técnica) e buscar a verdade **na fonte — as unidades escolares**.

## Modelo de dados (3 pilares + apoio)

- **`chamados`** — registro mestre, 1 linha por demanda (`id_chamado` único): escola, datas
  (`criado_em`/`modificado_em`/`data_solicitacao`), tipo, `status_atual`, `setor_responsavel`,
  `proxima_providencia`, e apoio (`informacao_validada`, `prioridade`, `comunicacao_cto`,
  `resultado_aptidao`, `observacoes`).
- **`historico`** — marcos relevantes por chamado (a memória do caso).
- **`escolas`** — cadastro das ~134 unidades; dados puxados no lançamento + inventário **de
  referência** + validação (`confirmado_pela_unidade`, `validado_pela_gop`) e `acao_sugerida`.
- **`modelos_email`** — textos por etapa, variáveis `{ID_CHAMADO}`/`{UNIDADE}`/`{DATA}`.

## Regras de negócio (vivem em `src/lib/logic.js`, funções puras + testadas)

- **Status:** esquema enxuto de **11 etapas** (`1 - Recebido — em triagem` … `10 - Concluído`,
  `11 - Encerrado`, + `Suspenso / pendente`). Encerrados/suspensos **nunca** disparam alerta.
- **Dois alertas independentes** (ambos devem existir):
  - **SLA / inércia** = dias SEM movimentação → âmbar ≥ **7**, vermelho ≥ **15**.
  - **Antiguidade** = dias TOTAIS em aberto → roxo ≥ **30**, roxo intenso ≥ **60**.
  - Ex.: atualizado ontem (SLA verde) mas aberto há 90 dias (antiguidade crítica).
- **Cálculos sempre relativos a HOJE** (nada de data fixa no código).
- **Setores reais:** `GOP, GIN, CPS, CTO` (+ responsabilidades compartilhadas). O Excel cita
  "CTIN", mas os dados usam GIN/CPS — as visões seguem o que **de fato ocorre**.
- **Ação sugerida** colorida: vermelho = falta confirmação; âmbar = confirmada com
  necessidade; verde = em dia.
- Mudou regra? Mexa em `logic.js` + atualize/rode os testes. Não duplicar regra no `App.jsx`.

## Stack e fatos operacionais

- **React 19 + Vite**, SPA. Deploy: **Vercel** → `controle-climatizacao-3cre.vercel.app`
  (auto‑deploy no push para `master`; `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY` em Production).
- **Supabase** (`wmnzcujojlygkcszocwb`): `escolas/chamados/historico/modelos_email`.
- **Testes:** `npm test` → `node test/logic.test.mjs` (puro Node). **Build:** `npm run build`.

## Decisões já tomadas

- **Auth/perfis/RLS:** não necessários hoje (dado aberto, baixa sensibilidade; espelha o
  status quo das planilhas). É uma **decisão**, não um dogma — se o Forms ou a escala um dia
  pedirem, reavaliar **com o Wilson**. Não é onde gastar esforço agora.
- **Hospedagem:** Supabase + Vercel. Microsoft Lists permanece como opção futura, não pendência.

## Como trabalhar aqui

- **Ambicioso no "como", disciplinado no "o quê".** Modernize a execução; não amplie o domínio.
- Entregar em **blocos curtos** com critério de aceite; **parar** quando atingido (o risco do
  projeto é o loop de melhorias que adia a entrega).
- Traduzir o que a planilha já fazia em algo **mais fácil** — não reinventar o domínio.
- Detalhes, histórico e o "porquê": ver **`docs/CONTEXTO.md`**.
