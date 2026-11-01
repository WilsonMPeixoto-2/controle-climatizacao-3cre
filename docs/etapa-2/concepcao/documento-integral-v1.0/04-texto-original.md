# 08 • Distinções financeiras obrigatórias

| **INFORMAÇÃO**                   | **SIGNIFICADO NO SITE**                                                                      |
|----------------------------------|----------------------------------------------------------------------------------------------|
| Preço ou referência contratual   | Parâmetro associado a uma categoria e cobertura válida.                                      |
| Estimativa de demanda            | Previsão calculada conforme dados e serviço pertinentes; não é valor necessariamente devido. |
| Programação por competência      | Distribuição planejada, separada de serviços efetivamente executados.                        |
| Valor informado para faturamento | Resultado de procedimento externo referenciado, não gerado por status genérico.              |
| Nota fiscal registrada           | Documento identificado, com competência e valor conforme informação inserida.                |
| Liquidação informada             | Registro da condição comunicada; não executa liquidação no sistema contábil.                 |
| Pagamento informado              | Registro do desembolso identificado, que pode ocorrer em mês posterior ao da execução.       |



```mermaid
flowchart LR
 A["Competência do serviço"] --- B["Programação financeira"] --- C["Data do pagamento"]
```



Figura 5 · Competência, programação de desembolso e pagamento são
referências temporais diferentes.

A expressão “saldo disponível” deve ser desambiguada. Teto contratual,
saldo de empenho e disponibilidade financeira não são sinônimos. O
painel deverá usar denominações precisas e identificar o dado ausente
como “não informado”, nunca como zero presumido.

## IMR, glosas e descontos

A avaliação técnica detalhada e sua documentação podem permanecer nas
planilhas e instrumentos da fiscalização. O site deverá utilizar o
resultado devidamente informado, sem presumir IMR integral, glosa
automática de chamado não executado ou retenção fixa por porcentagem
genérica. A eventual repercussão financeira será representada conforme
os dados e regras aplicáveis.

# 09 • Fronteiras, responsabilidades e governança



```mermaid
flowchart LR
 A["Portal GOP Clima: gestão e informação"] --- B["Instrumentos externos: OES, IMR, atestação, CMMS e processos"]
```



Figura 6 · Divisão intencional entre o site gerencial e os instrumentos
técnicos/administrativos.

## Perfis funcionais, sem multiplicar portais

| **PERFIL DE USO**              | **TAREFA MAIS FREQUENTE**                                 | **EXPERIÊNCIA RECOMENDADA**                              |
|--------------------------------|-----------------------------------------------------------|----------------------------------------------------------|
| Registro operacional           | Abrir e atualizar demandas                                | Mesmo fluxo atual, com referência financeira contextual. |
| Coordenação                    | Acompanhar demandas e programação                         | Painel sintético e busca por escola/competência.         |
| Acompanhamento financeiro      | Consultar faturas, empenhos e pagamentos                  | Área de Gestão Financeira e registros curtos.            |
| Fiscalização/gestão contratual | Consultar resultado relevante para procedimentos externos | Leitura e referência, sem recriar atestação ou processo. |

Os perfis representam necessidades, não autorização para criar
categorias de login. Porém, a inserção de valores de notas fiscais,
empenhos e pagamentos deve ser restrita a responsáveis autorizados; o
regime histórico de acesso aberto à edição operacional não pode ser
simplesmente estendido à nova área financeira.

# 10 • Caminhos de produto comparados

| **ALTERNATIVA**                              | **VANTAGEM**                                               | **LIMITAÇÃO / DECISÃO**                                                          |
|----------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------------|
| A. Painel financeiro isolado                 | Baixa interferência nas telas existentes.                  | Exige ir e voltar entre demanda e custo; integração perceptível limitada.        |
| B. Inteligência contextual + área financeira | Reaproveita cadastros e devolve respostas no ponto de uso. | RECOMENDADA: exige relações de dados cuidadosas, mas reduz trabalho do servidor. |
| C. Suíte documental contratual               | Abrangência técnica e jurídica elevada.                    | Recria a complexidade do Excel e extrapola o escopo pretendido.                  |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>RECOMENDAÇÃO</strong></p>
<p>Adotar a alternativa B: evoluir os fluxos atuais e adicionar uma
única área financeira. Mais complexidade interna, menos etapas visíveis
ao usuário.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

