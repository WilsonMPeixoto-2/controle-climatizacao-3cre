# Etapa 2 — Concepção e evolução financeira do GOP Clima 3ª CRE

Este diretório reúne, sob versionamento Git, os entendimentos e os documentos de planejamento **anteriores à implementação** da segunda etapa do site.

## Documento fundador

- **[Carta de Princípios do Produto — v1.0](./concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md)** — filosofia, intenções, responsabilidades entre o site e os instrumentos de gestão, decisões consolidadas, exemplos não vinculantes e questões em aberto. Data-base: 31/10/2026.

## Acervo de referências exploratórias

- **[Primeira tentativa Gemini V8.9](./referencias/gemini-v8.9/README.md)** — registro histórico com o prompt original, a proposta funcional apresentada, o mapa de ideias candidatas e a avaliação das limitações do protótipo. **Não homologado; não é código para implantação.**
- As referências são subordinadas à Carta de Princípios. Não transformar propostas, exemplos de interface ou números demonstrativos em requisitos aprovados.


## Concepção funcional — proposta v1.0

- **[Documento integral convertido do Word](./concepcao/documento-integral-v1.0/README.md)** — conteúdo fiel, dividido em cinco partes, com tabelas e diagramas Mermaid nativos do GitHub. **Proposta em discussão, ainda não homologada.**
- [Registro resumido e estado do arquivo editável](./concepcao/REGISTRO_CONCEPCAO_FUNCIONAL_v1.0.md).
- O Word original continua disponível como artefato editável fora do repositório; sua cópia binária no GitHub não foi efetuada. A versão textual integral está definitivamente versionada.

## Início da execução controlada

- **[Seleção técnica do protótipo Gemini v1](./referencias/gemini-prototipo-v1/AVALIACAO_E_SELECAO.md)**: catálogo de padrões úteis e decisão expressa de não reutilizar o JSX defeituoso como código de produção.
- **[Roteiro E1–E5](./planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md)**: incrementos de implementação, verificações e condições para publicação.
- **E1 iniciado na branch `feat/etapa2-fundacao-financeira`**: `src/domain/financialReference.js`, testes e integração à suíte. Sem modificar telas, Firestore ou valores em produção; preços contratuais só poderão ser inseridos após validação documental.
- A Concepção Funcional v1.0 permanece a base da evolução. O código do Gemini serve somente como fonte de ideias selecionadas.

## Regra de utilização

1. **Concepção como fonte principal.** A Carta de Princípios e a Concepção Funcional orientam os incrementos; os detalhes não homologados não se tornam requisitos apenas por aparecerem num protótipo.
2. **Não traduzir o Excel em telas.** Aproveitar informações e recursos existentes, transferindo o cálculo e a complexidade ao sistema.
3. **Não transformar exemplos em requisitos aprovados.** Possibilidades como botões de transição e fluxos de faturamento devem ser avaliadas na concepção.
4. **Preservar o escopo.** A aplicação prioriza gestão operacional e inteligência financeira; as comprovações e os procedimentos administrativos formais permanecem nos instrumentos próprios.
5. **Implementação incremental e isolada.** A fundação E1 pode avançar em branch sem dados financeiros reais; alterações de interface, permissões e publicação dependerão da validação correspondente.

## Organização prevista

- `concepcao/`: filosofia do produto, concepção funcional e decisões de experiência, com versões.
- `planejamento/`: roteiros de entrega e critérios de aceite dos incrementos (com hipóteses e decisões pendentes identificadas).
- `decisoes/`: futuramente, registros de decisões alteradas ou aprovadas.

Pastas são criadas somente quando houver documento real. Evitar duplicações e propostas não aprovadas apresentadas como decisões.

**Nota:** os documentos orientam o produto. A fundação E1 está em branch não integrada; não representa nova funcionalidade publicada no site.
