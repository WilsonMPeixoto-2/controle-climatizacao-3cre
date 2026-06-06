# Plano de Implementação — Fase 3 (Refinamento Visual, Usabilidade, Acessibilidade e Responsividade Mobile)

Este plano descreve o design e as alterações técnicas necessárias para implementar as melhorias de visualização, usabilidade e acessibilidade remanescentes do relatório de avaliação (**M-03 a M-14**).

## User Review Required

> [!IMPORTANT]
> **Alteração do Comportamento do Card Agrupador (M-04):**
> Propomos criar um card agrupador na fila de ações ("O que exige ação agora") caso existam múltiplas demandas paradas sem movimentação por mais de 15 dias. 
> * **Comportamento:** O card mais urgente (o mais antigo) continuará aparecendo de forma individual no topo. As demais demandas inativas serão agrupadas em um card consolidado ("X demandas sem movimentação"). Ao clicar no botão de ação deste card agrupado, o sistema aplicará o filtro correspondente e fará a rolagem da tela até a lista de chamados.
> * **Benefício:** Evita encher a fila de ações com itens repetidos do tipo "Atualizar andamento", abrindo espaço para pendências de outros tipos.

---

## Proposed Changes

### Componente 1: Regras de Negócio e Inteligência Operacional

#### [MODIFY] [operationalIntelligence.js](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/lib/operationalIntelligence.js)
* **Agrupamento de inatividade na fila de ações (M-04):**
  * Modificar a função `getActionItems` para agrupar múltiplos itens de inércia (`type === 'stuck'`) se houver mais de um.
  * O chamado mais urgente permanece como um item individual. Os demais serão consolidados em um único item com `type: 'stuck-group'` contendo uma descrição resumindo a contagem e os códigos dos chamados envolvidos.

---

### Componente 2: Interface Principal (React e Layout)

#### [MODIFY] [App.jsx](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/App.jsx)
* **Separação de KPIs por Famílias no Dashboard (M-03):**
  * Dividir a grid única de cartões indicadores em duas seções visualmente separadas por sub-títulos:
    1. **Volume Geral de Demandas** (cards: Registrados e Ativos).
    2. **Prazo e Gestão de Risco**:
       * Sub-bloco **Sem movimentação recente (Inércia)** (cards: +7 Dias e +15 Dias).
       * Sub-bloco **Tempo total em aberto (Antiguidade)** (cards: +30 Dias e +60 Dias).
* **Tratamento de cliques do card agrupador (M-04):**
  * No painel de ações de e-mail e atalhos, tratar cliques no item do tipo `'stuck-group'` para alterar `activeListsView` para `'stuck'` (chamados inativos) e efetuar a rolagem de tela até a lista de chamados.
* **Normalização de Setores Responsáveis (M-05):**
  * Na contagem de setores para o gráfico de progresso de responsabilidade, agregar dinamicamente `'Unidade Escolar / GIN'` sob a categoria unificada `'GIN / Unidade Escolar'`.
* **Âncora de rolagem (M-09) e data-labels para acessibilidade mobile (M-07):**
  * Adicionar `id="lists-section"` ao contêiner da aba de listagem de chamados.
  * Inserir atributos `data-label` em cada tag `<td>` da tabela principal de chamados (`lists-table`), permitindo mapear os títulos das colunas no modo responsivo vertical.

---

### Componente 3: Folhas de Estilo (Acessibilidade e Layouts Responsivos)

#### [MODIFY] [index.css](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/index.css)
* **Remoção de rolagem interna nos cards do Dashboard (M-06):**
  * Modificar a classe `.mini-progress-list` para remover a limitação de altura vertical (`max-height: 180px`) e o overflow interno, permitindo que a lista cresça naturalmente e a visualização do painel fique limpa.
* **Responsividade da tabela de chamados (Card Layout no Mobile) (M-07):**
  * Sob o breakpoint de `@media (max-width: 768px)`, forçar os elementos da tabela `.lists-table` (`thead`, `tbody`, `tr`, `td`) a se comportarem como blocos (`display: block`).
  * Ocultar visualmente o cabeçalho original da tabela e estilizar cada linha (`tr`) como um cartão individual, utilizando pseudo-elementos `:before` combinados com `content: attr(data-label)` para exibir as legendas ao lado dos valores correspondentes.
* **Aba de Comunicações responsiva (M-08):**
  * Sob `@media (max-width: 768px)`, alterar a classe `.email-composer-layout` para usar `grid-template-columns: 1fr`, fazendo com que os seletores, a lista de templates e a prévia da minuta de e-mail fiquem empilhados verticalmente.
* **Cabeçalho mobile compacto (M-09):**
  * Reduzir os espaçamentos internos de padding e margin da classe `.main-header` em telas pequenas e alinhar botões para ocuparem largura total em empilhamento.
* **Tipografia de inputs e minutas (M-10):**
  * Adicionar `font-family: var(--font-sans)` às classes `.form-control` e `textarea` para uniformidade visual.
  * Alterar a fonte da minuta de e-mail em `.email-preview-body` de monospace para a fonte sem-serifa da interface (`var(--font-sans)`).
* **Melhorias de acessibilidade cromática e design tokens (M-11, M-12, M-13):**
  * Ajustar cores e contrastes dos tons de status (como o âmbar e laranja) para maior legibilidade.
  * Assegurar que os badges e legendas estejam estruturados com os tokens CSS centralizados em `:root`.

---

## Verification Plan

### Testes Automatizados
* Rodar os testes automatizados da lógica de inteligência e filas de ações:
  ```bash
  npm run test
  ```
* Rodar o linter para confirmar aderência:
  ```bash
  npm run lint
  ```
* Validar a compilação Vite de produção:
  ```bash
  npm run dev (ou npm run build)

### Validação Manual (Mobile & Acessibilidade)
* Iniciar o servidor de desenvolvimento local e testar em tela redimensionada utilizando as ferramentas do Chrome DevTools para verificar se:
  * A tabela se transforma em cartões verticais legíveis no mobile.
  * O painel de e-mail e o cabeçalho se comportam de forma responsiva.
  * A rolagem interna dos cards foi removida e a ordenação unificada está visível.
