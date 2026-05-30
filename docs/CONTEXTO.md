# Contexto do Projeto — Controle de Climatização (3ª CRE / GOP)

Documento de referência (consulta sob demanda). O resumo operacional e as regras que valem
sempre estão no **`CLAUDE.md`** da raiz; este arquivo guarda o histórico, o "porquê" das
decisões e os detalhes que não precisam ocupar contexto a cada sessão.

> **Duas regras de ouro, repetidas de propósito:**
> 1. **Escopo de domínio, não de tecnologia** (seção 7): a ferramenta informa o ciclo de um
>    chamado da GOP — pode fazê‑lo de formas modernas e inteligentes, mas não vira gestão da
>    rede de ar‑condicionado (isso é da CTO).
> 2. **Usabilidade radical** (seção 4): o público teme tecnologia e prefere papel; o site
>    precisa ser mais fácil e convidativo que o caderno.

## 1. O setor GOP, a CTO e a função

A GOP da 3ª CRE recebe das unidades escolares os pedidos de manutenção e instalação de
ar‑condicionado e precisa **informar tempestivamente** o andamento de cada caso. A dor
concreta não é falta de dado — é **responder rápido**: status de uma escola, chamados
parados, próximo passo, com quem está a bola.

**A divisão de papéis (essencial para o escopo):**
- **A GOP (nosso escopo)** recebe a solicitação, **gera um código de chamado**, registra os
  detalhes, **encaminha a outros setores**, registra as **atualizações de status** e mantém o
  **registro completo, da abertura ao encerramento**, para **informar a CTO**.
- **A CTO (fora do nosso escopo)** é a responsável pelo **controle completo**: compra,
  estoque, manutenção e **mapeamento de toda a rede** — com base nas ações de vários setores.

Em uma frase: **nosso escopo é informar, no âmbito da 3ª CRE, tudo o que aconteceu da
abertura ao encerramento de um chamado.** A GOP registra e dá visibilidade; **não executa** a
manutenção, **não compra**, **não controla estoque** e **não é dona do inventário**.

## 2. As duas planilhas atuais (o que existe hoje)

A GOP trabalha hoje com **duas planilhas que não se cruzam** — esse é o problema central:

- **Consultoria de Climatização — 3 CRE 2026** (operacional / viva). ≈28 linhas. É o
  acompanhamento dos pedidos em andamento: status, observações, datas de tratativa e de
  atualização. É o núcleo do que a ferramenta substitui. *(É o dado que hoje vive na tabela
  `chamados`.)*
- **Dados de Climatização (version 1)** (inventário geral). Uma foto do parque por escola
  (salas, splits/aparelhos), com data de referência (ex.: março) e **sem vínculo** com a
  operacional. Registra, p.ex., 20 splits numa escola, mas de lá para cá pode ter mudado — e
  não é atualizada. **Serve apenas de referência.** *(Arquivo presente na pasta do projeto.)*

**Diagnóstico de origem (resumido):** "te mandei duas planilhas, uma do que está acontecendo
e outra com os dados da climatização, e não existe cruzamento… a planilha de março diz que a
escola tem 20 splits, mas pode ter mudado." Conclusão: **não** depender da integração entre
setores (que falha por relação, não por técnica) e **buscar a verdade na fonte: as escolas**.

## 3. O fluxo — apenas as partes que a GOP monitora

O processo completo de climatização envolve vários setores e etapas operacionais. A
ferramenta **não modela o processo inteiro** — apenas o que a GOP precisa registrar e
acompanhar para informar:

- **Entrada:** a unidade solicita; a GOP **gera um código de chamado** (ideia fundadora, já
  nas planilhas Excel mais elaboradas) e registra escola, local, tipo de demanda e detalhes.
- **Acompanhamento:** cada chamado tem um **status** num fluxo numerado (`1 - Recebido — em
  triagem` … `11 - Encerrado`) e uma **próxima providência** (o que falta, de quem é a vez).
- **Encaminhamento:** registra para qual setor (GIN, CPS, CTO…) o caso seguiu.
- **Tempo:** quanto está aberto (antiguidade) e quanto está sem movimentação (inércia/SLA).
- **Memória:** o histórico de marcos relevantes — o registro completo, do início ao fim.
- **Consulta por unidade:** dados da escola + chamados + linha do tempo, num **status
  completo**. Era a aba **mais usada** das versões finais das planilhas. Só referência, não
  edita/gere inventário.

**Como é hoje e como deve ser:** o lançamento é feito **manualmente** por servidores em
planilhas básicas (sem fórmulas). A ideia é **manter o lançamento manual, porém assistido** —
dados da unidade puxados automaticamente da base, listas prontas, consulta de status fácil.

**O que NÃO é da GOP monitorar** (e não entra): execução técnica da manutenção, agenda de
técnicos, compras/contratos, e a curadoria do inventário da rede (tudo isso é da CTO).

## 4. Usabilidade — pilar do projeto, não acabamento

Contexto humano decisivo: os servidores da 3ª CRE têm **muita dificuldade e até aversão à
tecnologia** — muitos não usam nem o Excel básico e gostam de **anotações em papel**, métodos
que não podem continuar. O site só cumpre seu papel se for **mais fácil e mais convidativo que
o caderno deles**.

- **Extremamente intuitivo, visualmente agradável e convidativo** — o "bonito" motiva o uso.
- **Complexidade escondida:** o site pode fazer coisas complexas, mas ao usuário **tudo deve
  parecer simples.** A parte difícil fica por baixo; a superfície é óbvia.
- **Tudo pensado para o usuário menos técnico:** navegação entre abas/seções sem confusão,
  botões claros, escolhas lexicais do dia a dia (não jargão), poucas decisões por tela,
  lançamento e consulta diretos, mensagens de erro em linguagem humana.
- **Medida de sucesso:** o servidor se sentir **mais motivado a usar o site** do que a manter
  o papel. Toda tela passa pelo teste: *"alguém com medo de tecnologia consegue, sozinho, de
  primeira?"*

Isto **não** conflita com modernidade — pelo contrário: usar técnica boa (auto‑preenchimento,
busca esperta, feedback visual) é o que **permite** a simplicidade aparente.

## 5. Evolução das ferramentas (os objetivos NÃO mudaram)

A mesma necessidade em formatos diferentes; o objetivo é único, muda o meio:

- **Planilhas atuais (legado):** as duas da seção 2.
- **Excel consolidado ("Controle Vivo"):** versão estruturada que organizou o método —
  painel, consulta por unidade, registro de chamados com código, visões por setor, histórico,
  modelos de e‑mail e o cadastro vivo das ~134 escolas. Traduziu o POP nº 002‑25. Ficou
  poderoso, porém **frágil** (>7.000 fórmulas; auditoria de 28/05) — o que motivou sair do Excel.
- **Planos para Microsoft Lists / SharePoint:** caminho institucional de maior governança.
  Manuais e plano prontos. **Alternativa de hospedagem**, não pendência.
- **Site (atual):** SPA React + Vite, no Vercel, conectado ao Supabase. Maior potencial de
  **experiência** (lançamento assistido, painéis, ranking, gerador de e‑mail) e de **futuras
  portas de entrada** (Forms — seção 10).

O formato pode mudar; o que importa é **servir ao registro e monitoramento da GOP.** O site
pode **modernizar a forma**; **não pode acrescentar tarefas nem monitoramentos extras.**

## 6. Modelo de dados (três pilares + apoio)

- **`chamados`** — registro mestre, 1 linha por demanda (`id_chamado` único): escola, datas
  (`criado_em`/`modificado_em`/`data_solicitacao`), `tipo_demanda`, `status_atual`,
  `setor_responsavel`, `proxima_providencia`, e apoio (`informacao_validada`, `prioridade`,
  `comunicacao_cto`, `resultado_aptidao`, `observacoes`).
- **`historico`** — marcos relevantes por chamado: a memória do caso.
- **`escolas`** — cadastro das ~134 unidades; **fonte do auto‑preenchimento** no lançamento +
  inventário **de referência** + validação (`confirmado_pela_unidade`, `validado_pela_gop`) e
  `acao_sugerida`.
- **`modelos_email`** — textos por etapa, variáveis `{ID_CHAMADO}`/`{UNIDADE}`/`{DATA}`.

## 7. Limite de escopo — DOMÍNIO, não tecnologia

**O ponto mais sensível, e o mais incompreendido.** A intenção **não** é limitar evoluções
tecnológicas nem formas modernas/inteligentes de executar as tarefas — essas são bem‑vindas.
A limitação é de **escopo do que é regido**: a ferramenta **registra e monitora o ciclo de um
chamado da GOP — e nada além.**

**Dentro (e pode ser ambicioso no "como"):** registrar/atualizar/encaminhar/consultar
chamados; lançamento assistido; auto‑preenchimento dos dados da escola; painéis, alertas e
ranking sobre os **próprios** chamados; gerador de e‑mail; intake por Forms (seção 10);
qualquer UX/automação que torne **isso** mais simples e atraente.

**Fora (domínio da CTO / de outros setores):** gestão do ciclo de vida dos aparelhos;
estoque/almoxarifado, compras, contratos, ordens de serviço; execução da manutenção
(técnicos, agendas, visitas); mapeamento/curadoria do parque da rede como sistema de gestão;
aprovações automáticas **entre setores** ou dependência dos sistemas de terceiros.

**Teste rápido:** *"isto informa o ciclo de um chamado da GOP, ou é gerir o parque de
ar‑condicionado (trabalho da CTO)?"* Se for a segunda, **está fora.**

## 8. Por que a disciplina de escopo importa (sem travar a inovação)

Já houve, em outros projetos, o padrão de **loop de produção**: melhorias sucessivas que
adiam a entrega e o projeto nunca sai do papel. A prioridade é **concluir** um site funcional
e simples de usar. Na prática: **ambicioso no "como", disciplinado no "o quê"**; entregar em
blocos curtos com critério de aceite; **parar** quando o aceite for atingido; resistir a
**expandir o domínio** (estoque, manutenção, rede) sem demanda; medir sucesso pela resposta às
perguntas do propósito e pela **adoção dos servidores**, não por sofisticação gratuita.

## 9. Decisões já tomadas

- **Auth/perfis/RLS:** não necessários hoje (dado aberto, baixa sensibilidade; espelha o
  status quo das planilhas). **Decisão**, não dogma — se o Forms ou a escala pedirem, reavaliar
  com o responsável. Não é onde gastar esforço agora.
- **Hospedagem: Supabase + Vercel.** Lists permanece como opção futura, não pendência.
- **Persistência conectada (feito em 30/05/2026):** projeto Supabase `wmnzcujojlygkcszocwb`
  criado, `schema.sql` + `seed.sql` carregados (134 escolas / 28 chamados / 28 históricos /
  8 modelos), site em produção (`controle-climatizacao-3cre.vercel.app`) já lendo e escrevendo
  via `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY`. O protótipo virou ferramenta de uso diário.

## 10. Frente futura prevista — intake por Microsoft Forms

Está **dentro do escopo** e pode virar uma frente própria: permitir que a abertura de um
chamado também chegue por **Forms**, com os dados do Forms integrados ao sistema com **o mesmo
valor** dos lançamentos manuais. Uma fonte de verdade só (`chamados`), duas portas de entrada
(manual assistido + Forms). Mantém o lançamento manual como caminho principal e adiciona uma
porta opcional — sem mudar o domínio.

---

### Divergências conhecidas (registro, não pendência de ação)

- **Numeração de status:** o site/dados usam o esquema **enxuto de 11 etapas**; o POP/Excel
  tinha 29. Os rótulos de etapa em `modelos_email` ainda citam a numeração antiga (`27 → 28`
  etc.) — inconsistência cosmética, sem efeito nas regras.
- **Limiares de alerta** divergem do Manual do Excel (15/30 e 90/180/365); o site adotou 7/15
  (inércia) e 30/60 (antiguidade), calibrados para o ritmo do POP‑002/25.
- **Contagem de escolas:** 134 no site/Supabase; 135 em algumas versões do Excel.

Nenhuma é bug; são decisões/heranças. Mexer só com decisão explícita do responsável.
