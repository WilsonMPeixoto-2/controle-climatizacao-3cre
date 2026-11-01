# Plano de evolução real — Etapa 2 (E1 a E5)

**Estado:** execução inicial controlada em branch de trabalho; desenho e regras de produção ainda sujeitos a validação.  
**Base:** [Concepção Funcional v1.0](../concepcao/documento-integral-v1.0/README.md), [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) e [seleção útil do Gemini](../referencias/gemini-prototipo-v1/AVALIACAO_E_SELECAO.md).  
**Arquitetura operacional atual:** React/Vite, módulos em `src/domain/`, serviços, Firestore e testes Node.  
**Princípio:** evoluir o site existente, não recriá-lo.

## Recorte implementado nesta branch: E1 — fundação de referência

- `src/domain/financialReference.js`: normalização estrita, consulta a catálogo validado com fonte/versão, estados de ausência e erro, representação decimal de quatro casas e soma de valores efetivamente informados.
- `test/financial-reference.test.mjs`: testes sem dados reais; valores fictícios explicitamente assinalados.
- `package.json`: integra a suíte nova ao comando existente `npm test`.

**Limites do incremento:** não há preço oficial carregado, nova coleção Firebase, autorização financeira, alteração de chamados nem modificação da navegação. O módulo não é utilizado pela produção e não executa faturamento. Toda operação com catálogo ainda depende de fonte e validação. Esse isolamento é deliberado para evitar regressão.

## E2 — referência na demanda, dentro do fluxo atual

1. Definir fonte confiável de tipo, capacidade e identidade dos aparelhos sem confundir total por escola com inventário individual.
2. Identificar qual serviço/atendimento pode receber preço consultivo e qual é coberto sem gerar novo valor faturável.
3. Acrescentar detalhe discreto em Chamados e Consulta por Unidade, e prévia durante o registro de solicitação, mantendo o identificador transacional `GOP-AR-AAAA-NNNN`.
4. Caso os dados sejam insuficientes, mostrar ausência de referência; **não preencher com valores demonstrativos**.
5. Testar um e múltiplos aparelhos por demanda, identificadores inexistentes, retrocompatibilidade dos chamados e ausência de presunção de faturamento.

## E3 — previsão por competência, sem dupla contagem

1. Modelar unidade financeira/remunerável separada de chamado operacional.
2. Garantir uma programação ativa por unidade/ciclo na base consolidada; mudanças de competência redistribuem a previsão derivada.
3. Tratar identidade não confiável como pendência de conciliação, nunca deduplicação por nome de sala.
4. Preservar a competência do serviço distinta da data de pagamento, e contagens parciais identificadas.
5. Testar reprogramação e repetição de chamados sem duplicação ou supressão de serviços legítimos.

## E4 — uma única área "Gestão Financeira"

1. Integrar à navegação existente, com componentes e estilo reais, sem dependência obrigatória de Recharts do protótipo.
2. Começar por quatro perguntas: previsão, execução informada, faturamento/pagamentos e limites/empenhos.
3. Definir escopo de cada indicador e filtros aplicáveis; métricas globais devem continuar identificadas como globais.
4. Distinguir "sem dados" de "zero informado". Gráfico de caixa deve seguir **data de pagamento**, não competência de execução.
5. Testar desktop largo, notebook e mobile com fontes confortáveis e orientação mínima na tela.

## E5 — registros financeiros com autorização real

1. Definir registros de NF, apuração, liquidação informada e pagamentos, inclusive parciais e múltiplos por competência.
2. Preservar trilha autoral e fonte do registro sem reproduzir atos oficiais.
3. Implementar controle de edição **no Firestore e no mecanismo de autenticação**, sem copiar o exemplo do Gemini e sem enfraquecer as regras atuais.
4. Sem autorização efetiva, disponibilizar apenas leitura ou protótipo local: não publicar formulários de escrita financeira.
5. Testar autenticação, regras Firebase (emulador), alterações, consistência, conciliação e regressão.

## Portões obrigatórios antes de publicação

- Catálogo de preços e fontes contratuais validados independentemente.
- Nenhum número inventado nem campo em branco convertido em zero.
- Nenhum evento operacional gera por si só valor faturável, NF ou pagamento.
- Nenhum incremento prejudica o fluxo atual de chamados ou a integridade dos IDs.
- Testes unitários, integração Firestore, lint, build, revisão visual e testes de navegação concluídos.
- Revisão/aceite do usuário antes do merge e da publicação.

## Resultado esperado desta rodada

Um incremento real, reversível e isolado do domínio E1, com testes e documentação técnica. Não é um redesenho do Gemini nem a implementação integral E1–E5. O próximo passo após a avaliação do PR é ligar as referências à **experiência operacional existente**, não construir quatro telas novas.
