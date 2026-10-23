# Design — MVP do Prontuário de Climatização

**Data:** 16/08/2026  
**Projeto:** Controle de Climatização — GOP / 3ª CRE  
**Status:** design aprovado para especificação do MVP

## 1. Objetivo

Criar uma funcionalidade simples e rápida para que o diretor de cada unidade escolar registre, por ambiente, a quantidade de aparelhos de ar-condicionado existentes e um conjunto mínimo de dados técnicos e de condição atual.

O objetivo desta primeira versão é **levantamento/mapeamento**, não gestão de manutenção.

## 2. Princípio central

Os dados existentes do projeto serão usados para **oferecer opções em listas pesquisáveis**, e não para preencher automaticamente informações cuja atualidade não pode ser garantida.

Regra:

> usar o que sabemos como vocabulário de apoio; deixar a unidade confirmar a realidade atual.

## 3. Escopo do MVP

### 3.1 Prontuário por unidade escolar

A aplicação terá uma única tela/componente reutilizável, carregado para a escola selecionada. Não serão criadas páginas de código separadas manualmente para cada escola.

A escola já entra identificada pelo cadastro existente, incluindo designação e nome.

### 3.2 Cadastro de ambientes

O diretor adiciona os ambientes da unidade conforme necessário.

O campo de ambiente será um **combobox pesquisável com digitação livre**.

Opções iniciais sugeridas podem incluir, entre outras:

- Sala de Aula
- Sala de Leitura
- Biblioteca
- Secretaria
- Direção
- Sala dos Professores
- Laboratório
- Sala de Informática
- Refeitório
- Cozinha
- Berçário
- Sala de Recursos
- Sala Multiuso
- Depósito

A lista poderá aproveitar nomenclaturas já encontradas nos registros existentes, mas a unidade poderá escrever qualquer nome que não esteja previsto.

Para ambientes numerados ou identificados, usar dois campos:

- **Tipo de ambiente:** exemplo `Sala de Aula`
- **Identificação:** exemplo `101`, `A`, `Azul`

A exibição consolidada passa a ser, por exemplo, `Sala de Aula 101`.

### 3.3 Quantidade de aparelhos por ambiente

Cada ambiente terá um campo simples de quantidade de aparelhos.

Opções iniciais:

- 0
- 1
- 2
- 3
- 4
- 5
- 6+

Ao informar a quantidade, o formulário cria dinamicamente os blocos `Aparelho 1`, `Aparelho 2` etc.

### 3.4 Detalhamento mínimo de cada aparelho

Para cada aparelho serão exibidos os campos:

- **Modelo / marca** — combobox pesquisável com digitação livre;
- **Capacidade (BTU)** — lista pesquisável com valores conhecidos + digitação livre;
- **Tipo** — lista pesquisável com valores conhecidos + digitação livre;
- **Situação** — `Funcionando`, `Precisa de manutenção` ou `Não informado`;
- **Observações** — texto livre opcional.

Os catálogos de modelo/marca, BTU e tipo podem ser inicializados com valores já existentes no projeto e ampliados futuramente com valores informados pelos usuários.

### 3.5 Fluxo de uso

1. Diretor abre o prontuário da própria escola.
2. Adiciona ou seleciona um ambiente.
3. Informa a identificação do ambiente quando necessária.
4. Informa a quantidade de aparelhos naquele ambiente.
5. Preenche, se possível, os dados básicos de cada aparelho.
6. Seleciona a situação atual de cada aparelho.
7. Adiciona novos ambientes conforme necessário.
8. Salva o levantamento.

## 4. Fora do escopo desta versão

Explicitamente adiado para fases futuras:

- cruzamento entre o novo levantamento e os totais agregados antigos;
- conferência automática `total anterior x total informado`;
- associação automática entre aparelho e chamado de manutenção;
- importação automática do status de chamados;
- classificação de gravidade, prioridade ou criticidade;
- geração automática de alertas de manutenção;
- dedução automática da condição de aparelhos a partir do histórico;
- indicadores gerenciais complexos;
- inventário patrimonial formal;
- rotinas de manutenção preventiva.

## 5. Interface aprovada

A interface deve seguir o conceito visual aprovado em conversa:

- modo claro;
- foco apenas no preenchimento;
- muito espaço em branco e baixa poluição visual;
- escola identificada no topo;
- seleção de ambiente e quantidade em uma faixa compacta;
- cards simples de `Aparelho 1`, `Aparelho 2` etc.;
- botão `+ Adicionar aparelho` quando necessário;
- ação principal `Salvar levantamento`;
- sem dashboard, painel lateral ou indicadores nesta primeira tela.

## 6. Modelo conceitual de dados

Estrutura lógica mínima:

```text
Escola
└── Ambientes
    └── Aparelhos
```

### Ambiente

- id
- escola/designação
- tipo
- identificação
- nome_exibicao
- ordem opcional

### Aparelho

- id
- ambiente_id
- modelo_marca
- capacidade_btu
- tipo
- situacao
- observacoes

Nenhuma relação com chamados é necessária no MVP.

## 7. Persistência

A implementação deve seguir a arquitetura Firestore definida para o projeto, adicionando coleções/documentos próprios para o levantamento sem acoplar esta nova funcionalidade à coleção de chamados.

Uma estrutura recomendada é manter ambientes e aparelhos como entidades próprias ligadas pela designação da escola e pelo `ambiente_id`.

O desenho final da persistência será definido no plano de implementação, preservando consultas simples e baixo custo no plano Spark.

## 8. Validações mínimas

- escola obrigatória e derivada do contexto atual;
- nome/tipo do ambiente obrigatório;
- quantidade não pode ser negativa;
- se houver N aparelhos, devem existir no máximo N blocos ativos correspondentes;
- situação deve aceitar apenas os valores previstos ou `Não informado`;
- campos técnicos podem permanecer vazios no MVP;
- observações são opcionais.

## 9. Critério de sucesso do MVP

A versão é considerada funcional quando um diretor consegue:

1. abrir o prontuário da escola;
2. cadastrar todos os ambientes relevantes;
3. informar a quantidade de aparelhos por ambiente;
4. detalhar opcionalmente os aparelhos;
5. indicar se cada aparelho funciona ou precisa de manutenção;
6. salvar e reabrir o levantamento sem perda dos dados.

O sistema não precisa interpretar esses dados além disso nesta fase.

## 10. Decisão de escopo registrada

A conferência ou cruzamento com números antigos foi deliberadamente retirada do MVP para reduzir tempo, complexidade e risco. Os dados históricos serão usados apenas para construir listas de opções e sugestões de preenchimento.
