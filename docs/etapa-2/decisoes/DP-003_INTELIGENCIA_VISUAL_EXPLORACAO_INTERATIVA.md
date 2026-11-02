# Decisão de Produto 003 — Inteligência visual e exploração interativa de dados

**Projeto:** GOP Clima · 3ª CRE / SME-RJ · Etapa 2  
**Data-base:** 01/11/2026  
**Origem:** orientação expressa do usuário para aproveitar o site como ambiente de gráficos, dashboards, visualizações modernas e recursos interativos.  
**Situação:** diretriz de evolução de produto, sem homologação de desenho específico ou de números contratuais.  
**Aplicação:** painéis operacionais existentes, nova área Gestão Financeira, consulta por unidade, detalhes do chamado e relatórios gerenciais.  
**Complementa:** [DP-001 (flexibilidade)](./DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), [DP-002 (continuidade visual)](./DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md), [Concepção Funcional v1.0](../concepcao/documento-integral-v1.0/README.md).

**Complemento visual:** [análise de dez capturas do protótipo Gemini](../referencias/gemini-prototipo-v1/AVALIACAO_VISUAL_10_CAPTURAS_MOBILE.md), com seleção de recursos úteis e correções de responsividade para orientar a implementação real. A referência não autoriza copiar o protótipo.

## 1. Decisão

> **O site é a superfície privilegiada de inteligência visual do GOP Clima.** Não deve limitar-se a reproduzir tabelas ou cartões estáticos: gráficos, mapas, tendências, comparações, filtros e detalhes navegáveis precisam transformar registros operacionais e financeiros em informação acionável.
>
> **Cada gráfico responde a uma pergunta de gestão, utiliza dados com origem identificável e permite navegar até os registros que explicam o indicador.** Visualização não é ato de medição, atestação ou decisão automática.

O objetivo é uma **experiência analítica única e integrada**, não um segundo sistema financeiro e nem uma réplica online das abas Excel. Sofisticação visual deve **reduzir** esforço cognitivo, não multiplicar telas, jargões ou regras rígidas.

## 2. Estado verificado do repositório (branch da primeira interface, PR #25)

O projeto **já utiliza**:
- Painel operacional com cartões KPI (`.stat-card`) interativos, gráfico circular em SVG, ranking de inatividade, mapa geográfico e consulta por escola.
- Design system próprio: `src/index.css`, `src/styles/tokens.css`, `src/styles/dashboard.css`, `src/styles/components.css`, `src/styles/maturity-2026.css`, fontes Outfit/Inter, Lucide e temas claro/escuro.
- Página inicial de Gestão Financeira em `src/components/FinancialOverviewPage.jsx`, integrada à aba `finance` do `src/App.jsx`, com filtros por escola e **mês de abertura** dos chamados, resumo operacional e quatro cartões financeiros em estado `Não informado`.
- Arquivos `src/components/FinancialReferenceCard.jsx`, `SchoolFinancialSummary.jsx` e `src/styles/finance.css` conectam visualmente a referência consultiva aos chamados e às escolas.
- O `package.json` **não inclui hoje** biblioteca externa de gráficos; o gráfico circular do Painel é SVG feito com componentes existentes. Isso **não obriga** a adotá-lo em todos os gráficos; escolher biblioteca somente após avaliar peso, acessibilidade, manutenção e coerência visual.

**Não afirmar** que a nova Gestão Financeira já possui previsões e faturamento reais: o PR #25 é uma interface consultiva inicial sem persistência financeira.

## 3. Gramática analítica: pergunta → gráfico → ação

| Pergunta de gestão | Informação necessária | Visual recomendado | Interação útil |
|---|---|---|---|
| Quais demandas estão crescendo ou diminuindo? | Chamados por data de abertura e modalidade | Linha temporal ou colunas por mês | Selecionar período → lista de chamados correspondentes |
| Quais escolas concentram mais solicitações? | Escola e chamados vinculados | Barras horizontais ordenadas | Selecionar escola → consulta por unidade/dossiê |
| Onde existem chamados antigos sem andamento? | Status e dias sem atualização; sem confundir idade com atraso contratual | Ranking de atenção e distribuição por faixa de inatividade | Selecionar faixa/registro → ficha do chamado |
| Como se distribuem os atendimentos geograficamente? | Escola, localização válida, demanda | Mapa operacional já existente, com filtros relacionados | Selecionar escola → chamados e dossiê |
| Que volume de preventiva está programado e como foi reprogramado? | Programação por escola/competência/ciclo e unidades informadas | Barras por competência, com previsto × reprogramado se ambos disponíveis | Clicar na coluna → escolas e programação; editar conforme DP-001 |
| Como evolui o valor por competência? | Previsões, valores de apuração informados, faturamento (cada grandeza com fonte) | Barras comparativas ou linhas, **apenas com fontes disponíveis** | Selecionar competência → memória de composição e registros |
| Quando ocorreram pagamentos informados? | **Data efetiva do desembolso**, valor e referência da NF | Tendência de caixa por mês de pagamento | Selecionar mês → pagamentos e documentos relacionados |
| Quais escolas concentram valores estimados ou informados? | Escola, itens financeiros vinculados, origem e período comparável | Ranking horizontal, selecionando **uma grandeza por vez** | Clicar no item → escola, período e registros componentes |
| Há divergência entre previsão e valor informado? | Valores comparáveis da mesma unidade/competência e situação | Barras de variação ou tabela de exceções | Abrir diferença → registros e origem; usuário decide ajuste |
| Onde coincidem risco operacional e materialidade financeira? | Risco bem definido + valores comparáveis e vinculados | Dispersão risco × valor, **somente após maturação dos dados** | Selecionar ponto → dossiê; não produzir “score” fictício |

**Evitar**: pizza decorativa, velocímetros arbitrários, gráficos redundantes, dupla escala de eixo sem necessidade, somar estimativa + NF + pagamento como se fossem montantes aditivos, cores sem legenda, ranking por nome de escola quando a chave cadastral é o identificador.

## 4. Interatividade mínima que diferencia site de planilha

1. **Exploração progressiva:** KPI/segmento/barra/ponto é entrada para detalhes, não enfeite; clicando, usuário abre lista filtrada, chamado, escola ou composição, preservando contexto.
2. **Filtros sincronizados e explícitos:** período, escola, modalidade e situação conforme a pergunta. Cada cartão declara escopo; indicadores globais não se mascaram como escolares.
3. **Visões cruzadas sem recadastro:** a escola escolhida na consulta escolar deve chegar selecionada à Gestão Financeira. O chamado acessado a partir do gráfico abre a ficha original.
4. **Seleção reversível:** chips de filtros ativos, limpar seleção, retroceder e estado vazio informativo; evitar filtros ocultos cuja aplicação não seja perceptível.
5. **Inspeção temporal correta:** data de abertura ≠ competência da execução ≠ programação de desembolso ≠ data do pagamento. Cada série e filtro usa o calendário explicitamente indicado.
6. **Tooltips úteis:** valor, unidade, período, universo, quantidade de registros, estado de completude e, quando cabível, referência do dado. Nenhum tooltip deve sugerir dado que a fonte não sustenta.
7. **Comparações honestas:** distinguir *valor não informado* de **R$ 0,00 efetivamente informado**; totais parciais devem trazer contagem/aviso de ausência, sem falsear completude.
8. **Facilidade de compartilhamento:** permitir, futuramente, exportar tabelas/visões filtradas com identificação de filtros, data de extração e origem. Exportar visualização **não** transforma a tabela em documento de atestação.

## 5. Integração informacional por níveis

**Nível A — Disponível agora:** escolas, chamados, datas de abertura, modalidades, status, histórico e referências de escola. Liberar visualizações operacionais reais com os limites das fontes; não denominá-las “medição” ou “cumprimento contratual” sem fundamento.

**Nível B — Programação financeira (E3):** adicionar estruturas editáveis de competência, escola, quantidade/itens e valores de referência (inclusive provisórios), com histórico proporcional e marcação de origem. Derivar a previsão de uma única fonte atual. Duplicidade é alerta para conferência, não bloqueio genérico.

**Nível C — Faturamento e pagamentos (E5):** registrar dados financeiros pertinentes por responsáveis autorizados, relacionando apurações, NFs, pagamentos e escolas/competências quando existir vínculo legítimo. Uma NF pode envolver várias escolas e pagamentos podem ser parciais; não pressupor uma NF para cada chamado.

**Nível D — Inteligência gerencial:** só após fontes comparáveis construir análises de variação, materialidade, tendências financeiras e cruzamento risco × valores, sempre com drill-through aos registros e interpretação clara.

## 6. Princípios visuais e técnicos obrigatórios

- **Visual nativo do GOP Clima:** herdar diretamente `stat-card`, `surface-card`, `section-header`, tokens `--primary`, `--surface-*`, `--text-*`, Outfit/Inter, Lucide, interação de sidebar e temas claro/escuro. **Não copiar o design Tailwind do protótipo Gemini.**
- **4K e mobile:** usar bem a largura em 32”/4K sem esticar excessivamente indicadores; organizar por grids fluidos, número contido de séries e texto legível; no mobile, visualizações que preservem rótulos ou ofereçam alternativa em lista/tabela.
- **Acessibilidade:** teclado, foco visível, contraste, títulos descritivos, significado não dependente somente de cor; uma tabela/resumo textual correspondente para dados essenciais, `prefers-reduced-motion` e estados carregando/erro/vazio.
- **Desempenho:** computação pura e memoização de séries, agregação proporcional a centenas de escolas e milhares de equipamentos, componente de gráfico carregado sob demanda quando útil; não instalar biblioteca volumosa por preferência estética.
- **Integridade:** identificar origem do dado e instante de atualização quando relevantes; diferenciar estimativas, registros informados, valores efetivamente faturados e pagamentos. Não presumir controle de faturamento por status de chamado.
- **Flexibilidade DP-001:** filtros e visualização não imponham decisão administrativa; quantidades, competências e referências editáveis por quem responde por esses registros na experiência própria.
- **Validação visual proporcional DP-002:** antes de aprovar, verificar integração com o Painel atual, além da nova página; capturas desktop, monitor largo/4K, mobile e temas claro/escuro; teste de abertura de registros a partir dos gráficos.

## 7. Sequência incremental recomendada ao Codex

**V1 — inteligência operacional já sustentada por dados:** aprimorar a área financeira inicial com bloco de *contexto operacional* interativo (por mês de abertura e escola) e navegação para chamados e dossiê; reutilizar gráfico/controle existentes onde apropriado. **Não simular receitas nem pagamentos.**

**V2 — programação editável:** após E3, adicionar barras de previsão por competência e por escola com drill-through, distinguindo programação de solicitação operacional.

**V3 — financeiro registrado:** após E5, comparar apuração, NF e pagamento em visões separadas ou corretamente nomeadas, incluindo competência e mês de caixa distintos.

**V4 — análises cruzadas:** variações, prioridades, previsões, materialidade por escola e eventuais indicadores de gestão. Sem duplicar gráficos nem transformar o site em ferramenta de atestação.

**Critério de seleção de biblioteca:** avaliar necessidade, compatibilidade com React/Vite, licença, acessibilidade, comportamento em telas 4K/mobile, tamanho do bundle e integração com tokens. **Nenhuma dependência de gráficos é exigida por esta decisão.**

## 8. Critério de aceite da diretriz

O resultado é satisfatório quando o usuário consegue responder uma pergunta relevante no gráfico, aplicar um filtro, **chegar ao registro que fundamenta o resultado**, corrigir parâmetros de trabalho quando autorizado e voltar à visualização sem perder o contexto. A interface parece uma evolução do GOP Clima, não um dashboard de outra ferramenta.

**Não concluir por estética isolada:** gráficos modernos e interativos só constituem melhoria quando representam dados reais ou registrados, respeitam a semântica e facilitam a gestão.
