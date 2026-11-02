# Inspeção visual — dez capturas do protótipo Gemini (moldura de prévia em smartphone)

**Projeto:** GOP Clima, Etapa 2 · 3ª CRE  
**Fonte:** 10 imagens enviadas pelo usuário em 01/11/2026, retratando telas de prévia de um protótipo Gemini Canvas.  
**Natureza:** referências visuais selecionáveis, **não** screenshots da aplicação React/Firestore real nem prova de funcionamento, autorização financeira ou aderência às regras contratuais.  
**Decisão:** preservar padrões úteis; **não** copiar a aplicação, CSS ou lógica financeira do Gemini. Integração regida pelas [DP-001](../../decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), [DP-002](../../decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md) e [DP-003](../../decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md).

## 1. O que as imagens acrescentam concretamente

| Imagens de referência | Recurso visual observado | Decisão para GOP Clima |
|---|---|---|
| `1000359952.jpg` | Cartões de faturamento/OB e limite/empenho com hierarquia numérica nítida; escopo global indicado. | **Aproveitar a hierarquia** de número, contexto e metadados; renderizar com `.stat-card` e tokens reais, mantendo valores indisponíveis como “Não informado”. |
| `1000359968.jpg`, `1000359954.jpg` | Barras temporais comparando programação, apuração, NF e desembolso, com legenda. | **Aproveitar a pergunta analítica**, mas distinguir competência de execução, emissão NF e mês de caixa; alternar séries ou usar filtros para melhorar legibilidade em mobile. Não importar os valores demonstrativos. |
| `1000359970.jpg`, `1000359956.jpg` | Barras horizontais para concentração por unidade escolar; tooltip de estimativa × apurado. | **Aproveitar ranking horizontal + interação de detalhe**; clique/toque leva à consulta escolar ou recorte de registros. Tooltip precisa caber no viewport e funcionar por toque e teclado. |
| `1000359972.jpg` | Modal de edição de competência reúne medição informada, NF e OB, campos brutos/líquidos/retenções. | **Aproveitar proximidade contextual** dos dados e campos; não impor uma única NF/OB por competência e não confundir formulário gerencial com ato oficial. Separar em seções progressivas conforme volume de campos. |
| `1000359964.jpg` | Seção de desembolso com campos empilhados, hierarquia legível e ação de salvar. | **Aproveitar organização dos inputs**, identificação de OB, data, bruto, líquido e retenções quando pertinentes. Representar cada grandeza de forma distinta e editável pelo responsável, sem travas administrativas artificiais. |
| `1000359966.jpg` | Modal curto de apuração de um chamado; valor apurado, boletim/medição, referência OES/SEI e atalho “Usar valor calculado”. | **Aproveitar o editor contextual e o atalho OPT-IN** de copiar valor de referência para o campo; nunca registrar automaticamente, nem presumir que equivale a medição/atesto. Permitir ajuste manual. |
| `1000359958.jpg`, `1000359960.jpg` | Tabela de competência, programação, apuração, NF e desembolso; comparação de calendários. | **Aproveitar a tabela como detalhamento**, mas NÃO repetir sua apresentação desktop truncada no mobile. Aplicar cartões por competência, colunas prioritárias, drill-down e tabela larga opcional para desktop/exportação. |

## 2. Problemas visuais observáveis — não copiar

1. **Conteúdo cortado no eixo horizontal:** especialmente a tabela de competências e algumas capturas do ranking. O usuário precisa deslocar o conteúdo dentro da moldura e perde a visão do todo. A moldura do Canvas pode agravar o problema; **validar em navegador real** antes de atribuir o defeito exclusivamente ao CSS do protótipo.
2. **Tooltip ultrapassa área útil:** em capturas do ranking, a janela com valores invade a margem e parte do texto se perde. Tooltip adaptativo/flutuante, detalhes em bottom sheet ou tooltip vinculado ao toque são alternativas melhores.
3. **Legendas densas e eixo comprimido:** barras com quatro séries e longos rótulos competem por poucos pixels. Em mobile, preferir duas séries selecionáveis, alternância de grandezas, pequenos múltiplos ou tabela resumida acessível.
4. **Campos de formulário muito estreitos:** modal de medição/NF/OB com três colunas em viewport estreito dificulta conferir datas, número de OB, valores. Empilhar campos por seção no mobile, preservar largura mínima legível e uso correto do teclado.
5. **Carga textual em caixas e títulos:** nomes como “Três Calendários Reais (Competência Serviço × Emissão NF × Mês Caixa OB)” são explicações técnicas longas para um gráfico pequeno. Simplificar título e levar as definições para legenda/ajuda sob demanda.
6. **Identidade visual isolada:** o protótipo tem cartões claros, azul-marinho e verde-petróleo coerentes em si, mas não herda todos os elementos do design system e da navegação do GOP Clima real. **Não copiar shell, sidebar, botão ou layout próprio do Gemini.**
7. **Valores e afirmações de origem demonstrativa:** números como teto, empenho, preços, totais, NF, OB e percentuais vistos nas imagens **não são dados comprovados da execução**; não transportar para Firestore nem para gráficos do site.
8. **Risco de falso indicador:** “saldo de empenho” e “disponibilidade financeira” são grandezas diferentes; apresentação gráfica deve refletir fonte e cálculo corretos, e não apenas o rótulo de um cartão.

## 3. Padrões recomendados, em ordem de valor

**P1 — já comporta dados reais do site:** rankings horizontais de escolas por volume de solicitações e tendências operacionais por mês de abertura, com clique para escola/chamados. Distinguir mês de abertura de competência do serviço. Usar tema e tokens atuais.

**P2 — quando houver programação editável:** previsão por competência/escola e visual da reprogramação; usuário ajusta quantidades, data e referência, e o gráfico recalcula; não impor uma quantidade inicial imutável.

**P3 — quando houver registros financeiros informados:** comparação entre programação, apuração, NF e caixa. Não tratar quatro valores como parcelas aditivas; cada série terá calendário, unidade e origem explícitos. Valores não informados não viram zero.

**P4 — registro gerencial contextual:** formulário curto de valor apurado, com atalhos de referência **opcionais** e campos de fonte. Múltiplas NFs e OBs por competência conforme necessidade real. A aplicação registra a informação sem executar atesto.

**P5 — detalhes interativos:** do cartão para recorte, do gráfico para escola, da linha para chamado, sem perda de filtros; no mobile preferir cards e drawers, mantendo opção de tabela detalhada.

## 4. Critérios de UX e verificação

- **Desktop 1440px e 4K:** aproveitar espaço sem esticar indiscriminadamente os cartões; títulos e gráficos legíveis e alinhados com `dashboard.css`.
- **Mobile ~390px:** sem conteúdo obrigatório inacessível; tabela vira cartões ou ganha navegação explícita; tooltip não sai da tela; inputs não sofrem truncamento; botões sempre alcançáveis.
- **Tema claro/escuro:** todas as novas superfícies herdam `tokens.css` e componentes oficiais, sem segunda identidade estética.
- **Interatividade real:** toque e teclado abrem registro ou filtram dados, com retorno reversível e estado da seleção visível.
- **Gráficos honestos:** sempre preservar “não informado”, separação de competência/caixa e dados demonstrativos fora de produção.
- **Formulários flexíveis:** ajustes do responsável refletem as visualizações, sem gerar automaticamente NF, atesto ou pagamento.

## 5. Escopo e estado

Estas capturas **enriquecem a DP-003, mas não substituem a Concepção Funcional v1.0**. Não se justifica corrigir o protótipo Gemini ou replicar integralmente seus gráficos e formulários.

**Não autorizar merge, deploy, mudança de Firestore ou inclusão de dados falsos a partir desta avaliação visual.** O PR #25 continua sendo a primeira integração consultiva. Os elementos acima orientam incrementos futuros e revisão estética do código real, priorizando poucas melhorias com alto valor perceptível.
