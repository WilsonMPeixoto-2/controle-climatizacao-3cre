# 11 • Primeira atualização: proposta de entregas funcionais

## E1 \| Referência contratual confiável

Parâmetros, cobertura, preços e competência com identificação de dados
pendentes; sem cristalizar divergências de planilha.

## E2 \| Estimativa contextual da demanda

Escola e aparelhos selecionados; estimativa válida sem recadastro ou
cobrança corretiva indevida.

## E3 \| Previsão mensal integrada

Consolidar demandas e programação por competência, com reprogramação sem
duplicidades.

## E4 \| Gestão Financeira em uma área

Indicadores e filtros simples para programação, faturamento e pagamentos
informados.

## E5 \| Registro resumido de situação financeira

NF, competência, valor e pagamentos registrados com referenciamento e
edição controlada.

## Escopo expressamente adiado

Otimização territorial de rotas, módulo completo de OES, avaliação
integral do IMR, relatórios documentais de fiscalização, controle de
peças e técnicos, integração direta com CMMS, gestão patrimonial e
automações de pagamento. São temas futuros, sujeitos à demonstração de
necessidade.

## Núcleo mínimo, caso seja necessário reduzir ainda mais

Se a primeira implantação tiver de ser reduzida, as três capacidades a
preservar são: (i) referência econômica por demanda; (ii) projeção sem
dupla contagem; (iii) consulta consolidada dos dados financeiros
efetivamente registrados.

# 12 • Critérios de aceite e testes de produto

| **SITUAÇÃO TESTADA**               | **COMPORTAMENTO ESPERADO**                                                      |
|------------------------------------|---------------------------------------------------------------------------------|
| Dados técnicos completos           | Enquadramento correto, quando a precificação for aplicável.                     |
| Tipo ou BTUs ausentes              | Indicação de pendência; nunca inventar categoria.                               |
| Demanda abrange parte da escola    | Considerar apenas os equipamentos envolvidos.                                   |
| Corretiva já coberta pelo contrato | Não gerar valor adicional presumido.                                            |
| Dois chamados no mesmo aparelho    | Evitar duplicidade financeira sem apagar eventos distintos.                     |
| Reprogramação mensal               | Atualizar projeções sem duplicar cobertura.                                     |
| NF sem registro de pagamento       | Não classificar como quitada.                                                   |
| Pagamento após a competência       | Preservar datas de serviço, faturamento e pagamento.                            |
| Nenhum dado informado              | Mostrar “não informado”; não converter em zero comprovado.                      |
| Tentativa de edição não autorizada | Impedir alteração financeira e preservar trilha de alterações quando realizada. |

O aceite exige teste da interface por servidores com baixa familiaridade
tecnológica, conferência dos cálculos contra fontes contratuais
pertinentes, persistência dos novos registros, preservação do histórico
existente e verificação da aplicação efetivamente publicada. A presença
de componentes ou fórmulas no código não basta como prova de
funcionamento.

# 13 • Questões de produto em aberto

| **QUESTÃO**                                | **DIREÇÃO PROPOSTA / STATUS**                                                                                     |
|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Cadastro individual de equipamentos        | Confirmar origem dos dados; seleção simples quando identificados e informação mínima nos demais casos. A definir. |
| Repercussão financeira por tipo de demanda | Diferenciar valor de cobertura e cobrança incremental conforme contrato. A validar.                               |
| Transição para composição financeira       | Poderá ocorrer por ação simples ou evento operacional apropriado; exemplo ainda não aprovado.                     |
| Origem dos valores de NF/pagamento         | Registro manual resumido inicialmente; eventual integração futura depende de necessidade.                         |
| Governança de edição                       | Restrição a responsáveis autorizados sem reformular todas as funções do site.                                     |
| Indicadores definitivos                    | Selecionar a partir das perguntas reais dos servidores, não por estética.                                         |
| Cronograma financeiro                      | Conciliar competência, desembolso e vigência com fontes formais antes de automatizar.                             |

# 14 • Conclusão e orientação para a próxima deliberação

A evolução mais promissora do GOP Clima combina uma arquitetura de dados
e cálculos robusta com uma experiência muito reduzida para o servidor. O
usuário continua trabalhando com escolas, solicitações e equipamentos; o
site acrescenta referências econômicas, previsão por competência,
acompanhamento das faturas e registros de pagamento. Os procedimentos
formais de execução, fiscalização e liquidação permanecem nos
instrumentos apropriados.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>SÍNTESE EDITORIAL</strong></p>
<p>Uma aplicação mais inteligente por dentro, mais simples por fora e
mais útil no trabalho diário.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Antes de iniciar a programação, devem ser discutidos e aprovados: o
significado do valor financeiro por modalidade de demanda; a origem do
cadastro individual de equipamentos; a navegação e as jornadas; o
conteúdo mínimo do painel; as transições de estados financeiros e o
recorte definitivo da primeira entrega.

# Referências e rastreabilidade

1\. Carta de Princípios do Produto v1.0, versionada em
docs/etapa-2/concepcao/ no repositório
WilsonMPeixoto-2/controle-climatizacao-3cre.

2\. Documentos históricos e código do repositório, especialmente
README.md, docs/CONTEXTO.md, docs/ESTADO_DO_PROJETO.md, src/App.jsx,
src/data/db.json e firestore.rules; consultados em 31/10/2026. Alguns
registros históricos descrevem estados anteriores do produto.

3\. Termo de Referência SME/RJ (01/09/2025), 77 páginas, com Anexos I a
VI. O documento geral não substitui a leitura do contrato específico
assinado e de eventuais alterações.

4\. Memória documental da contratação e cronograma de desembolso da 3ª
CRE, construída a partir dos arquivos fornecidos em outubro de 2026.
Quantitativos e valores da planilha são referências para validação, não
evidências de pagamento efetivo.

5\. Módulos Excel de planejamento e demandas (V9.0),
execução/fiscalização/medição (V9.0), faturamento/pagamentos e materiais
de auditoria e identidade visual anteriormente debatidos.

6\. Acervo exploratório Gemini V8.9 em
docs/etapa-2/referencias/gemini-v8.9/, catalogado como material não
homologado, sem autorização para implementação direta.

# Anexo A • Ficha de validação da concepção

Esta ficha registra o que precisa ser discutido antes da implementação.
A marcação de prioridades e a aprovação de qualquer fluxo cabem à etapa
deliberativa seguinte.

| **TEMA**                           | **PROPOSTA A AVALIAR**                                           | **DECISÃO** |
|------------------------------------|------------------------------------------------------------------|-------------|
| Navegação                          | Uma nova área financeira, mantendo os fluxos principais do site. | Em aberto   |
| Estimativa da demanda              | Cálculo contextual conforme equipamento, serviço e cobertura.    | Em aberto   |
| Equipamentos sem cadastro completo | Informação mínima assistida, sem criar bem patrimonial.          | Em aberto   |
| Programação financeira             | Consolidar previsões por competência, sem dupla contagem.        | Em aberto   |
| Faturas e pagamentos               | Registro sintético e separado dos atos externos.                 | Em aberto   |
| Usuários financeiros               | Restringir edições; manter consultas simples.                    | Em aberto   |
| Indicadores de destaque            | Selecionar pelo valor das perguntas reais dos servidores.        | Em aberto   |

## Sequência de trabalho proposta

01 Validar a experiência conceitual → 02 Delimitar a primeira entrega →
03 Desenhar as telas e interações → 04 Especificar as regras → 05
Implementar no site real → 06 Testar e verificar → 07 Deliberar sobre a
próxima etapa.

Registro editorial: esta versão mantém expressamente a condição de
proposta para discussão. A utilização futura deve observar as decisões
que vierem a ser aprovadas e documentadas, sem converter exemplos deste
estudo em especificações automaticamente vinculantes.