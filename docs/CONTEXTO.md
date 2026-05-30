# Contexto do Projeto — Controle de Climatização (3ª CRE / GOP)

Documento de referência (consulta sob demanda). O resumo operacional e as regras que
valem sempre estão no **`CLAUDE.md`** da raiz; este arquivo guarda o histórico, o "porquê"
das decisões e os detalhes que não precisam ocupar contexto a cada sessão.

> **Regra nº 1, repetida aqui de propósito:** a ferramenta **registra e monitora o que é
> da GOP — e nada além disso.** Nada de gestão completa de climatização, estoque, compras
> ou execução de manutenção. Ver a seção 7.

## 1. O setor GOP e sua função

A GOP da 3ª CRE recebe das unidades escolares os pedidos de manutenção e instalação de
ar‑condicionado e precisa informar a CTO (e demais setores) tempestivamente sobre o
andamento de cada caso. A dor concreta não é falta de dado — é a dificuldade de
**responder rápido** ao que perguntam: status de uma escola, chamados parados, próximo
passo, carga por setor.

**Fronteira da função (essencial):** a GOP **registra e monitora** pedidos e dá
visibilidade ao fluxo. Ela **não executa** a manutenção, **não controla estoque** de
aparelhos e **não é dona do inventário**. A ferramenta deve refletir exatamente essa
fronteira.

## 2. As duas planilhas atuais (o que existe hoje)

A GOP trabalha hoje com **duas planilhas que não se cruzam** — esse é o problema central:

- **Consultoria de Climatização — 3 CRE 2026** (operacional / viva). ≈28 linhas,
  ≈13 colunas. É o acompanhamento dos pedidos em andamento: status, observações, datas
  de tratativa e de atualização. É o núcleo do que a ferramenta substitui e do que a GOP
  monitora. *(É o dado que hoje vive na tabela `chamados`.)*
- **Dados de Climatização (version 1)** (inventário geral). Uma foto do parque instalado
  por escola (nº de salas, splits/aparelhos), com data de referência (ex.: março) e **sem
  vínculo** com a planilha operacional. Registra, p.ex., que a escola tem 20 splits, mas
  de lá para cá pode ter recebido mais, dado baixa ou ter aparelhos quebrados — e isso não
  é atualizado. **Serve apenas de referência.** *(Arquivo presente na pasta do projeto.)*

**Diagnóstico de origem (resumido):** "te mandei duas planilhas, uma do que está
acontecendo (solicitações em andamento) e outra com os dados da climatização, e não existe
cruzamento entre o que está sendo feito e aquele dado… aquela planilha de março diz que a
escola tem 20 splits, mas pode ter mudado." A conclusão foi que o caminho **não** é depender
da integração entre setores (que falha por relação, não por técnica), e sim **buscar a
verdade na fonte: as unidades escolares.**

## 3. O fluxo — apenas as partes que a GOP monitora

O processo completo de climatização envolve vários setores e etapas operacionais
(vistoria, orçamento, execução etc.). A ferramenta **não modela o processo inteiro** —
apenas o que a GOP precisa registrar e acompanhar para informar tempestivamente:

- **Entrada:** a unidade solicita; a GOP abre um chamado (ID único) com escola, local,
  tipo de demanda.
- **Acompanhamento:** cada chamado tem um **status** dentro de um fluxo numerado
  (de `1 - Recebido — em triagem` até `11 - Encerrado`) e uma **próxima providência**
  (o que falta e de quem é a vez).
- **Monitoramento de tempo:** quanto tempo o chamado está aberto (antiguidade) e quanto
  tempo está sem movimentação (inércia / SLA).
- **Responsabilidade:** com qual setor (GOP, GIN, CPS, CTO) está a bola no momento.
- **Memória:** o histórico de marcos relevantes do chamado.
- **Consulta:** dados da escola e inventário **somente para referência**, não para
  edição/gestão dentro do sistema.

**O que NÃO é da GOP monitorar aqui** (e portanto não entra): execução técnica da
manutenção, agenda de técnicos, compras/contratos, e a curadoria do inventário.

## 4. Evolução das ferramentas (os objetivos NÃO mudaram)

A mesma necessidade foi materializada em formatos diferentes; o objetivo é único, muda o meio:

- **Planilhas atuais (legado):** as duas descritas na seção 2.
- **Excel consolidado ("Controle Vivo"):** versão estruturada que organizou o método —
  painel, consulta por unidade, registro de chamados, visões por setor, histórico, modelos
  de e‑mail e o cadastro vivo das ~134 escolas. Traduziu o POP nº 002‑25 em instrumento
  utilizável. Ficou poderoso, porém **frágil** (milhares de fórmulas; auditoria de 28/05
  contou >7.000 fórmulas e funções modernas) — o que motivou sair do Excel.
- **Planos para Microsoft Lists / SharePoint:** caminho institucional de maior governança
  (auth corporativa, permissões, backup do M365). Manuais e plano de migração prontos.
  Permanece como **alternativa de hospedagem**, não como pendência.
- **Site (atual):** SPA React + Vite, hospedado no Vercel e conectado ao Supabase. Maior
  potencial de experiência (painéis, ranking, gerador de e‑mails).

O formato pode ser planilha, Lists ou site — o que importa é **servir ao registro e
monitoramento da GOP.** O site pode modernizar a *forma* de executar essas tarefas, mas
**não pode acrescentar tarefas nem monitoramentos extras.**

## 5. Modelo de dados (três pilares + apoio)

- **`chamados`** — registro mestre, uma linha por demanda (`id_chamado` único): escola,
  datas (`criado_em` / `modificado_em` / `data_solicitacao`), `tipo_demanda`,
  `status_atual`, `setor_responsavel`, `proxima_providencia`, e campos de apoio
  (`informacao_validada`, `prioridade`, `comunicacao_cto`, `resultado_aptidao`, `observacoes`).
- **`historico`** — marcos relevantes por chamado: a memória do caso.
- **`escolas`** — cadastro vivo das ~134 unidades; inventário **de referência** (salas,
  aparelhos, necessidade) e estado de validação (`confirmado_pela_unidade`,
  `validado_pela_gop`) + `acao_sugerida`.
- **`modelos_email`** — textos por etapa, com variáveis `{ID_CHAMADO}`/`{UNIDADE}`/`{DATA}`.

## 6. Capacidades que definem o produto (manter, não ampliar)

- ID automático e preenchimento dos dados da escola ao registrar um chamado.
- Cálculo automático, **sempre relativo a hoje**, de dias em aberto e dias sem movimentação.
- **Dois alertas distintos e independentes:**
  - **SLA / inércia** — dias sem movimentação (âmbar ≥ 7, vermelho ≥ 15). Mede estagnação.
  - **Antiguidade** — tempo total em aberto (roxo ≥ 30, roxo intenso ≥ 60). Mede demora.
  - Diferentes de propósito: um chamado pode ter sido atualizado ontem (SLA verde) e ainda
    assim estar aberto há 90 dias (antiguidade crítica). **Ambos devem existir.**
- Painéis com métricas e **ranking dos chamados mais parados**.
- Visões por setor com indicadores próprios. Obs.: o Excel cita "CTIN", mas os dados usam
  GIN/CPS — as visões seguem os setores que **de fato ocorrem** (GOP, GIN, CPS, CTO).
- **Ação sugerida colorida** no cadastro (vermelho = falta confirmação; âmbar = confirmada
  com necessidade; verde = em dia).
- **Modelos de e‑mail** por etapa, com substituição de variáveis.

Toda essa lógica vive em `src/lib/logic.js` (funções puras, cobertas por 43 testes em
`test/logic.test.mjs`). É a fonte única da verdade das regras — o `App.jsx` só consome.

## 7. Limite de escopo — o ponto mais sensível

A ferramenta **NÃO** deve evoluir para uma gestão completa de ar‑condicionado. Fora de
escopo, sem pedido explícito: gestão do ciclo de vida dos aparelhos; estoque/almoxarifado,
compras, contratos, ordens de serviço; gestão da manutenção (execução, técnicos, visitas);
atualização do inventário como função do sistema; BI/relatórios além dos painéis definidos;
autenticação/perfis/RLS; automações, notificações, integrações entre setores; reescrita
arquitetural ampla.

**Teste rápido em qualquer proposta:** *"isto é registrar/monitorar um pedido, ou é
executar/gerir o ar‑condicionado?"* Se for a segunda, **está fora.**

## 8. Por que a disciplina de escopo é o ponto central

Já houve, em outros projetos, o padrão de **loop de produção**: melhorias sucessivas que
adiam a entrega e o projeto nunca sai do papel. A prioridade é **concluir** um site
funcional e simples. Na prática: traduzir cada objetivo do Excel (não reinventar); entregar
em blocos curtos com critério de aceite; **parar quando o aceite for atingido**; resistir a
adicionar segurança, automação, estoque ou integrações sem demanda; medir sucesso pela
resposta às perguntas do propósito (status de uma escola, parados, próximo passo, carga por
setor), não por sofisticação.

## 9. Decisões já tomadas

- **Segurança institucional (auth/RLS)** deliberadamente **fora de escopo**, dada a baixa
  sensibilidade do dado e o status quo (planilhas abertas).
- **Hospedagem atual: Supabase + Vercel** (escolha do responsável). Lists permanece como
  opção futura, não como trabalho pendente.
- **Persistência conectada (feito em 30/05/2026):** projeto Supabase `wmnzcujojlygkcszocwb`
  criado, `schema.sql` + `seed.sql` carregados (134 escolas / 28 chamados / 28 históricos /
  8 modelos), e o site em produção (`controle-climatizacao-3cre.vercel.app`) já lê e escreve
  nele via as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`. O protótipo virou
  ferramenta de uso diário.

---

### Divergências conhecidas (registro, não pendência de ação)

- **Numeração de status:** o site/dados usam o esquema **enxuto de 11 etapas**; o POP/Excel
  tinha 29 estágios. Os rótulos de etapa em `modelos_email` ainda citam a numeração antiga
  (`27 → 28` etc.) — inconsistência cosmética herdada, sem efeito nas regras.
- **Limiares de alerta** divergem do Manual do Excel (que usava 15/30 e 90/180/365); o site
  adotou 7/15 (inércia) e 30/60 (antiguidade), calibrados para o ritmo do POP‑002/25.
- **Contagem de escolas:** 134 no site/Supabase; 135 apareciam em algumas versões do Excel.

Nenhuma dessas é bug; são decisões/heranças. Mexer só com decisão explícita do responsável.
