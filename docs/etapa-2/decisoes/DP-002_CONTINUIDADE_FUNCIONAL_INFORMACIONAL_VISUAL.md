# Decisão de Produto 002 — Continuidade funcional, informacional e visual

**Projeto:** GOP Clima / 3ª CRE · Etapa 2  
**Data-base:** 01/11/2026  
**Origem:** diretriz expressa do usuário após avaliar visualmente o protótipo Gemini.  
**Estado:** **diretriz de produto consolidada**, complementar à [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md), à [Concepção Funcional v1.0](../concepcao/documento-integral-v1.0/README.md) e à [DP-001](./DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md).  
**Status de execução:** documentação e planejamento; ainda não autoriza alteração visual de produção.

## 1. Enunciado

> **A Etapa 2 deve parecer, funcionar e se comportar como evolução natural do GOP Clima existente.** Novas capacidades não autorizam construir uma interface paralela, criar identidade gráfica própria, impor novo modelo mental ao servidor ou manter uma base de dados concorrente.

A continuidade abrange **três dimensões indissociáveis**.

- **Funcional:** aprofundar as jornadas existentes, preservando ações, menus, históricos e expectativas dos usuários.
- **Informacional:** relacionar escola, chamado, aparelho, competência e resultado financeiro aos registros existentes, sem recadastro redundante nem valores incoerentes.
- **Visual:** herdar integralmente a identidade, os tokens, os padrões de interface, a tipografia, os ícones e os estados dos componentes já utilizados pelo site.

## 2. Base visual REAL do repositório, verificada nesta decisão

A proposta de interface será desenvolvida **no próprio React/Vite do projeto** e deve consultar os arquivos:

| Arquivo existente | Elementos a reaproveitar |
|---|---|
| `src/index.css` | Paleta institucional azul-ciano / teal, variáveis `--primary`, `--secondary`, superfícies, estados semânticos e temas claro/escuro. |
| `src/styles/tokens.css` | Escala tipográfica `--text-*`, fontes `--font-display` (Outfit) / `--font-text` (Inter), espaçamento `--space-*`, `--surface-*`, `--hairline`, foco, movimento e ajustes para telas 4K. |
| `src/styles/components.css` | `.section-header`, `.section-title`, `.surface-card`, `.btn`, `.status-chip`, `.tabs-shell`, `.table-shell`, campos e mensagens. |
| `src/styles/dashboard.css` | Cartões `.stat-card`, grupos de indicadores, tipografia numérica tabular, bordas e elevação. |
| `src/styles/maturity-2026.css` | `.sidebar`, `.sidebar-item`, cabeçalhos, densidade, hierarquia de conteúdo e acabamento visual institucional. |
| `src/styles/return-polish-2026.css` | Refinos efetivamente adotados na tipografia, botões, foco, painéis e formulários. |
| `src/App.jsx` | Arquitetura de navegação, estado e funcionalidades reais: não substituir por um aplicativo paralelo. |

Os nomes acima são **referências ao código existente**, não instrução para copiar CSS sem analisar a cascata ou para criar classes redundantes. Reutilizar o que já existe é preferível a criar uma segunda biblioteca de UI.

## 3. Reaproveitamento visual seletivo do Gemini

O JSX demonstrativo serve somente como inspiração para:

1. **Detalhe contextual ao lado da lista de chamados**, se couber no layout real; caso contrário, usar padrão já existente de painel, aba ou drawer.
2. **Quatro perguntas gerenciais reunidas numa visão financeira**, sem obrigatoriamente copiar os quatro cartões do Gemini.
3. **Filtros hierarquizados e indicadores de recorte ativo**, com apresentação e nomenclatura nativas do site.
4. **Visualizações comparativas** quando respondam a perguntas úteis, construídas com componentes integráveis ao projeto.
5. **Separação visual entre estimativa contratual e apuração informada**, respeitando o vocabulário de estados já utilizado.

**Não aproveitar:** sidebar escura autônoma, título de marca alternativo, conjunto independente de botões, `text-[10px]` repetido, excesso de rótulos explicativos sobre a própria implementação, paleta Tailwind desconectada dos tokens, tipografia sem relação com a existente, cartões e tabelas de estilo diferente ou dados de demonstração tratados como reais.

## 4. Como a integração deve aparecer na experiência

| Local existente | Evolução visual recomendada | O que evitar |
|---|---|---|
| **Painel** | Síntese financeira pontual, visualmente subordinada aos indicadores operacionais; mesma gramática de KPI. | Criar segundo dashboard ou reorganizar todo o Painel para demonstrar E4. |
| **Chamados** | Informação econômica contextual no detalhe e nos padrões já utilizados; lista continua priorizando atendimento. | Sobrecarga de colunas ou nova tela independente de preços. |
| **Consulta por Unidade** | Pequena seção de valores e previsão associada à escola já selecionada. | Cadastro de escola paralelo ou cartão com identidade conflitante. |
| **Registrar Chamado** | Cálculo contextual e informações editáveis no fluxo atual, sem alterar seu objetivo principal. | Wizard autônomo que substitua o formulário atual ou imponha novas etapas regulatórias. |
| **Gestão Financeira** | **Uma área nova**, construída com os componentes, fontes, cores, grids e menu lateral reais; aprofundamento progressivo. | Reutilizar a página autônoma do Gemini ou reconstruir o shell inteiro do aplicativo. |

## 5. Guardrails de qualidade visual proporcionais

- **Consistência**: utilizar o mesmo `font-display`, `font-text`, ícones Lucide, cores e estados semânticos das telas existentes.
- **Continuidade de interação**: botão, foco, seleção, aba, filtro e mensagens respondem de forma coerente com o sistema atual.
- **Legibilidade**: evitar textos principais em 10px; respeitar escala tipográfica e uso sensato de densidade.
- **Responsividade**: validar mobile, notebook e desktop largo/4K; não deixar painéis excessivamente estreitos nem esticar números e tabelas sem critério.
- **Temas**: respeitar tokens dos temas claro e escuro disponíveis, sem estilos hardcoded que quebrem um deles.
- **Fluxo intacto**: o usuário deve reconhecer instantaneamente o site; não perder funções existentes.
- **Valor visual real**: nenhuma exigência de reproduzir cada imagem ou cartão do Gemini; a melhor solução pode ser simplificar.

## 6. Regra contra loops visuais

Correções são prioritárias quando houver **quebra de identidade**, ilegibilidade, problemas de contraste, layout quebrado, regressão em componente existente ou interação inconsistente. Propostas meramente decorativas não devem reabrir indefinidamente a concepção, salvo ganho perceptível demonstrável.

Antes de redesenhar, verificar se **um componente ou estilo existente já resolve o problema**. Preferir melhoria localizada à reconstrução do layout completo.

## 7. Critério de aceite e início de implementação

**Nenhuma tela financeira será considerada integrada por ser apenas semelhante ao layout existente.** É necessário demonstrar que ela usa a navegação e os componentes reais, herda corretamente o design system e está ligada aos cadastros e estados reais, respeitando os controles de edição aplicáveis.

A DP-001 e a DP-002 se complementam: **flexibilidade de gestão nas ações do usuário e continuidade visual na experiência do produto**.

**Decisão de implantação:** documentar agora; alterar interface apenas em incremento específico com revisão visual e testes, sem tocar no site em produção nesta etapa documental.
