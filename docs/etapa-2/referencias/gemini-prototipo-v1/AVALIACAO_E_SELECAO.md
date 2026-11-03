# Seleção técnica do protótipo Gemini — reaproveitamento mínimo

**Projeto:** GOP Clima — Etapa 2  
**Situação:** referência exploratória, não homologada.  
**Origem:** protótipo React/JSX `Prototipo_Concepcao_v1_0_GOP_Clima.jsx` fornecido pelo usuário e auditado em 01/11/2026.  
**Autoridade:** [Carta de Princípios](../../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) e [Concepção Funcional v1.0](../../concepcao/documento-integral-v1.0/README.md) prevalecem sobre este protótipo.

## Decisão desta rodada

**Não continuar corrigindo o protótipo independente.** Preservar os padrões que demonstram utilidade, absorver apenas ideias compatíveis com a arquitetura real React/Vite/Firestore e desenvolver implementação própria testada, em branch separada.

O código JSX completo NÃO é versionado como módulo ou página de produção: contém preços demonstrativos, dados exemplificativos, regras financeiras inseguras, estados isolados, simulação de permissões e UI divergente do site existente.

## Ideias aproveitáveis

| Padrão | Aproveitar como | Limite expresso |
|---|---|---|
| Duas dimensões no detalhe do chamado | Apresentar **referência contratual** separada da **apuração informada** | Valor unitário não vira medição nem cobrança automaticamente |
| Dupla rota de equipamento | Selecionar equipamento individual validado; na ausência, solicitar tipo/BTUs mínimos | Um exemplo do Gemini não comprova subinventário no Firestore |
| Não informado distinto de zero | Estados explícitos de ausência e valores informados | Não converter campos vazios em `0` |
| Chave de unidade de cobertura | Inspirar agregação por identidade, competência/ciclo e unidade remunerável validada | Não reutilizar chave construída a partir de texto de sala nem regra "primeiro chamado vence" |
| Filtro de competência / escola / situação | Recortes coerentes em indicadores aplicáveis | Manter métricas globais identificadas; não apresentar total global como se fosse filtrado |
| Reprogramação de preventiva | Uma programação ativa por unidade/ciclo com cálculo derivado | Não apenas alterar mês na interface sem atualizar projeções |
| Cards de quatro perguntas gerenciais | Previsão, execução informada, NFs/pagamentos, limites financeiros | Só quando houver dados e significados reconciliáveis |
| Visualização progressiva | Lista operacional preservada; contexto financeiro no detalhe | Evitar referências a seções do documento, mini-textos demais, fontes de 10px |

## Código que NÃO deve ser copiado

1. `CATEGORIAS_TR_INTERNAS`: contém faixas inconsistentes e valores não comprovados pelo instrumento contratual assinado.
2. `consultarCoberturaContratual()` original: confunde classificação de equipamento com confirmação da cobertura específica de serviço.
3. `handleAlterarApuracaoChamado()`: usa valor de referência ou `219.61` como preenchimento automático de apuração.
4. `analiseChamados` e a chave `equipamentoChave__cicloRef__categoria`: controle dependente de ordem, incompleto e baseado em identificadores não validados.
5. `handleReprogramarEscola()`: só muda o estado da escola, sem redistribuir previsões financeiras.
6. `resumoFinanceiro` e os dados dos gráficos: filtros com escopos inconsistentes, zeros substituindo ausência de informação e calendários de pagamento por competência.
7. `handleSalvarRegistroCompetencia()`: reduz faturamento e NF ao mesmo campo e um único registro por competência.
8. `setPerfilAutorizado()`, trilha local e bloco demonstrativo `firestore.rules`: não são autenticação, autorização nem trilha persistente; a substituição das regras existentes seria insegura.
9. `handleRegistrarNovoChamado()`: gera IDs incompatíveis com o padrão `GOP-AR-AAAA-NNNN` e a transação real de contadores.

## Código de fato aproveitado na aplicação real

A ideia de uma função de classificação pura, com **ausência explícita**, foi reconstruída em `src/domain/financialReference.js` e protegida por `test/financial-reference.test.mjs`. Esta implementação:

- **não contém nenhum preço ou categoria contratual carregada por padrão**;
- exige catálogo explicitamente validado, com fonte e versão;
- não determina cobertura nem valor devido por chamado;
- preserva quatro casas decimais internamente;
- distingue preço de referência, valor informado e ausência;
- não modifica dados do Firestore nem regras de segurança.

**Etapa seguinte:** conectar essa fundação às telas atuais somente depois de definir a origem validada do catálogo e os testes de integração; E3–E5 seguem o roteiro em `docs/etapa-2/planejamento/`.

## Situação editorial

Este documento é a **seleção de aproveitamento autorizada**, não a homologação do código original. Nenhum material do Gemini deve ser incorporado à produção por cópia automática.
