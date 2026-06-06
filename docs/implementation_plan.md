# Plano de Implementação — Fase 1 (Melhorias de Lógica Operacional e Registro de Relatório)

Este plano descreve as ações iniciais da nova etapa de desenvolvimento com foco em registrar as especificações visuais e operacionais propostas pelo usuário no relatório consolidado de melhorias e implementar os itens de prioridade máxima (**Etapa 1 — P0 Lógica**).

## User Review Required

Documentamos as seguintes perguntas de design para o seu alinhamento:

> [!IMPORTANT]
> **Aplicação das Funções na Interface (React):**
> Neste plano inicial, propomos implementar e testar as funções puras `severidadeInatividade` (M-01) e `ordenarPorUrgencia` (M-02) no arquivo [`src/lib/logic.js`](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/lib/logic.js) e em sua suíte de testes.
> 
> * **Pergunta:** Você deseja que já integremos essas novas funções ao componente de visualização da interface principal [`src/App.jsx`](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/App.jsx) (para atualizar visualmente as cores dos cards de "Ação Agora" e ordenar as duas listas de forma unificada) já nesta rodada de código, ou prefere primeiro aprovar a lógica pura e os testes no console?
>
> **Escopo do Registro de Documentação:**
> Para garantir a governança e que as 16 melhorias recomendadas (M-01 a M-16) não se percam, salvaremos o documento HTML de relatório enviado por você no diretório do projeto.
>
> * **Pergunta:** O caminho sugerido `docs/relatorio-melhorias.html` está de acordo com a estrutura desejada por você para guardar este arquivo?

---

## Proposed Changes

### Componente 1: Documentação e Relatórios
* **[NEW]** Criar o arquivo [docs/relatorio-melhorias.html](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/docs/relatorio-melhorias.html) contendo a versão HTML do relatório.
* **[NEW]** Criar o arquivo [docs/relatorio-melhorias.md](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/docs/relatorio-melhorias.md) contendo o relatório consolidado integral em Markdown.

---

### Componente 2: Núcleo de Regras de Negócio (Lógica P0)

#### [MODIFY] [logic.js](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/lib/logic.js)
* **[M-01] Níveis de Severidade (Inatividade):**
  * Criar e exportar a função `severidadeInatividade(dias)` para categorizar inatividade de chamados em quatro níveis: `'CRITICO'` (>= 60 dias), `'ALTO'` (>= 15 dias), `'ATENCAO'` (>= 7 dias) e `'OK'` (em dia).
* **[M-02] Ordenação de Urgência:**
  * Criar e exportar a função `ordenarPorUrgencia(chamados)` para ordenar chamados de forma estável: dias sem movimentação decrescente -> dias em aberto decrescente -> código em ordem alfabética estável.

#### [MODIFY] [logic.test.mjs](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/test/logic.test.mjs)
* Adicionar testes unitários completos em Node para validar a função `severidadeInatividade` nas fronteiras dos limiares (148 dias, 74 dias, 16 dias, 8 dias e 3 dias).
* Adicionar testes unitários para a função `ordenarPorUrgencia` garantindo a estabilidade e o comportamento dos critérios de desempate.

---

## Verification Plan

### Testes Automatizados
* Executar a suite de testes locais para garantir que a lógica nova e as já existentes estejam verdes:
  ```bash
  npm run test
  ```
* Rodar o linter para manter a aderência estrita às regras do projeto:
  ```bash
  npm run lint
  ```
