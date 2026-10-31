# Mapa de reaproveitamento — experiências do protótipo V8.9

**Estado de todas as propostas desta página:** **CANDIDATAS A AVALIAÇÃO**, não implementações aprovadas.

| ELEMENTO OBSERVADO | VALOR COMO REFERÊNCIA | ORIENTAÇÃO NA CONCEPÇÃO |
|---|---|---|
| Filtros simples de competência, polo, modalidade e escola | Permitem perguntas rápidas e recortes operacionais | Considerar filtros contextuais, sem exigir vários painéis nem mudar indevidamente indicadores globais. |
| Indicadores financeiros consolidados | Reduzem consulta manual a fontes distintas | Selecionar apenas métricas que respondem a decisões reais: custo previsto, valores de referência, composição mensal, situação financeira informada. |
| Relação entre chamados e custo | Reutiliza dados existentes para estimar demanda | Explorar orçamento prévio por equipamento e serviço pertinente, inclusive seleção parcial do parque. |
| Atualização visual imediata de valores após interação | Dá feedback útil ao servidor | Considerar recálculo de estimativas sem equiparar mudança de status a reconhecimento financeiro. |
| Comparação por polo/competência | Pode revelar distribuição e concentração de demandas | Reaproveitar se a pergunta analítica for útil; não colocar gráficos apenas para decorar. |
| Linguagem visual de cartões, contraste, números tabulares | Pode favorecer leitura rápida | Explorar no sistema de design real, com acessibilidade e preservação da identidade do site. |
| Detalhamento sob demanda | Permite conciliar visão sintética e conferência | Reavaliar como exibir origem de valores sem reproduzir tabelas auxiliares do Excel. |

## Padrões técnicos observados, somente como inspiração

A implementação V8.9 incluiu o estado de filtros `biState` com campos de competência, polo, modalidade e busca, além de funções de atualização de visualização como `computeBiData()` e `updatePowerBiDashboard()`. Esses nomes registram a origem da ideia; **não são uma API aprovada ou componentes a copiar**.

A folha de estilos original usou, por exemplo, `font-variant-numeric: tabular-nums` para melhorar alinhamento visual de números e um realce diferenciado para filtros ativos. **A intenção visual é aproveitável; o código concreto deve ser reconstruído ou integrado segundo o design system da aplicação.**

## Decisões que NÃO foram tomadas

- Não se aprovou criar “Módulo 1”, “Módulo 2”, “Módulo 3” e “Módulo 4” como telas do site.
- Não se aprovou o painel financeiro específico exibido na V8.9.
- Não se aprovou um cálculo de glosa automática associado diretamente a chamado pendente.
- Não se aprovou uma associação automática de status “RESOLVIDO” a valor faturável.
- Não se aprovou um controle deslizante para definir avaliação do IMR.
- Não se aprovou o mecanismo de composição da nota fiscal do protótipo.
- Não se aprovou o texto de despacho SEI nem se atribuiu ao site a emissão formal de atestos.
- Não se aprovou um cálculo de retenção fixa ou saldo de empenho simplificado.
- Não se aprovou implementar no site todas as funcionalidades do Excel.

## Perguntas úteis para a futura concepção textual

1. Qual informação financeira o servidor precisa obter **durante o fluxo de trabalho que já executa**?
2. Que informações técnicas sobre equipamentos estão suficientemente confiáveis para alimentar estimativas?
3. Como representar visualmente **custo previsto** sem sugerir que a despesa já é devida?
4. Qual é a menor intervenção de interface que oferece a maior utilidade prática?
5. Quais indicadores de gestão mudam uma decisão do servidor e quais só reproduzem planilhas?
6. Quais etapas continuam acontecendo fora do site e como refletir seus resultados sem transformar a aplicação num sistema documental?

**Regra:** a Carta de Princípios prevalece sobre este catálogo de possibilidades.
