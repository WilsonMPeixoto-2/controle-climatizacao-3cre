# Plano de evolução real — Etapa 2 (E1 a E5)

**Estado:** execução inicial controlada em branch de trabalho; desenho e regras de produção ainda sujeitos a validação.  
**Base:** [Concepção Funcional v1.0](../concepcao/documento-integral-v1.0/README.md), [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) e [seleção útil do Gemini](../referencias/gemini-prototipo-v1/AVALIACAO_E_SELECAO.md).  
**Arquitetura operacional atual:** React/Vite, módulos em `src/domain/`, serviços, Firestore e testes Node.  
**Princípio:** evoluir o site existente, não recriá-lo.
**Diretrizes complementares consolidadas:** [DP-001 — flexibilidade de gestão](../decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), [DP-002 — continuidade visual](../decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md) e [DP-003 — inteligência visual interativa](../decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md). **A [DP-004 — autenticação adiada durante desenvolvimento](../decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md) complementa a ordem de execução e prevalece quanto ao momento de implementar login/perfis.**

## Recorte implementado nesta branch: E1 — fundação de referência

- `src/domain/financialReference.js`: normalização técnica, consulta a catálogos de referência **confirmados ou provisórios**, indicação de origem, ajuste manual consultivo, estados de ausência e precisão de quatro casas.
- `test/financial-reference.test.mjs`: testes sem dados reais; valores fictícios explicitamente assinalados.
- `package.json`: integra a suíte nova ao comando existente `npm test`.

**Limites do incremento:** não há preço oficial carregado, nova coleção Firebase, autorização financeira, alteração de chamados nem modificação da navegação. O módulo não é utilizado pela produção e não executa faturamento. A simulação aceita referências de trabalho identificadas como provisórias. Isso não torna o cálculo um atesto e não impede o gestor de ajustar dados quando necessário.

## E2 — referência na demanda, dentro do fluxo atual

1. Reaproveitar dados existentes de tipo, capacidade e identidade dos aparelhos, com alternativa simples para informar ou corrigir dados insuficientes, sem exigir inventário completo.
2. Exibir referência automática, provisória ou informada pelo usuário; o responsável poderá ajustar os valores pertinentes sem transformar automaticamente um cálculo em valor faturável.
3. Acrescentar detalhe discreto em Chamados e Consulta por Unidade, e prévia durante o registro de solicitação, mantendo o identificador transacional `GOP-AR-AAAA-NNNN`.
4. Em caso de dados insuficientes, indicar a ausência da referência automática, mantendo o fluxo disponível para registros e ajuste manual; **não inventar valores silenciosamente**.
5. Testar um e múltiplos aparelhos por demanda, identificadores inexistentes, retrocompatibilidade dos chamados e ausência de presunção de faturamento.

## E3 — previsão por competência, sem dupla contagem

1. Modelar unidade financeira/remunerável separada de chamado operacional.
2. Permitir reprogramar competências, escolas, quantidades e ciclos; atualizar a projeção e sinalizar eventuais sobreposições para conferência, sem impor proibição administrativa automática.
3. Indicar identificação incerta como alerta informativo, sem impedir o trabalho nem deduplicar arbitrariamente por nome de sala.
4. Preservar a competência do serviço distinta da data de pagamento, e contagens parciais identificadas.
5. Testar reprogramação e repetição de chamados sem duplicação ou supressão de serviços legítimos.

## E4 — uma única área "Gestão Financeira"

1. Integrar à navegação existente com os tokens e componentes de `src/index.css`, `src/styles/tokens.css`, `src/styles/components.css`, `src/styles/dashboard.css` e demais estilos vigentes; não copiar a sidebar, o tema Tailwind ou a identidade visual independente do Gemini.
2. Começar por quatro perguntas: previsão, execução informada, faturamento/pagamentos e limites/empenhos.
3. Definir escopo de cada indicador e filtros aplicáveis; métricas globais devem continuar identificadas como globais.
4. Distinguir "sem dados" de "zero informado". Gráfico de caixa deve seguir **data de pagamento**, não competência de execução.
5. Testar desktop largo/4K, notebook e mobile com a escala tipográfica existente, temas claro/escuro e ícones Lucide, assegurando continuidade de interação e orientação mínima na tela.
6. **Exploração visual interativa (DP-003):** indicadores e gráficos respondem a perguntas, têm origem e escopo explícitos e permitem navegar para escola, chamado ou registros financeiros relacionados. Começar com métricas operacionais já sustentadas pelos dados; adicionar gráficos financeiros somente com dados efetivamente informados.
7. **Não adotar biblioteca de gráficos por antecipação:** avaliar necessidade, peso, acessibilidade, tema e desempenho antes da escolha; manter a identidade visual já implementada.

## E5 — registros financeiros com autorização real

**Sequenciamento esclarecido pela DP-004:** a persistência de desenvolvimento compartilhada e os cálculos do incremento financeiro atual **não aguardam login**. Os requisitos de autenticação individual, perfis e autorização por usuário são **portão anterior à entrega institucional**, não condição para desenvolver, demonstrar e testar em projeto/emulador isolado. Esta seção descreve uma capacidade futura de operação, e não ordem para interromper a Etapa 1.

1. Permitir registrar e corrigir resultados informados de apuração, NF, liquidação e pagamentos, inclusive parciais e múltiplos por competência, sem exigir coincidência obrigatória com uma estimativa.
2. Preservar trilha autoral e fonte do registro sem reproduzir atos oficiais.
3. **Antes da entrega institucional**, implementar controle de edição **no Firestore e no mecanismo de autenticação**, sem copiar o exemplo do Gemini e sem enfraquecer as regras atuais. Durante o desenvolvimento, preservar regras de validação e dados adequados num ambiente Firebase isolado, conforme DP-004.
4. **Durante desenvolvimento**, são permitidos formulários de escrita e persistência compartilhada em **Firestore de desenvolvimento/emulador isolado, sem login**, com testes técnicos e sem exposição indiscriminada de dados sensíveis. **Na entrega aos servidores**, não disponibilizar formulários financeiros de escrita sem autorização individual efetiva.
5. Testar agora regras Firebase de desenvolvimento (emulador), alterações, persistência entre sessões sem login, consistência, conciliação e regressão; **na fase de entrega institucional**, testar autenticação, perfis e regras definitivas de autorização.

## Portões obrigatórios antes de publicação

- Catálogo definitivo conferido para uso como referência contratual confirmada; **catálogos provisórios podem ser utilizados em planejamento com identificação explícita**, sem bloquear a utilização da ferramenta.
- Nenhum número inventado nem campo em branco convertido em zero.
- Nenhum evento operacional gera por si só valor faturável, NF ou pagamento.
- Nenhum incremento prejudica o fluxo atual de chamados ou a integridade dos IDs.
- Testes unitários, integração Firestore, lint, build, revisão visual e testes de navegação concluídos.
- Revisão/aceite do usuário antes do merge e da publicação.
- **Continuidade visual obrigatória:** utilizar componentes, tokens e padrões reais do site, conforme [DP-002](../decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md), sem copiar o shell do Gemini.
- **Flexibilidade operacional:** quantidades, programações, referências e valores informados são ajustáveis, conforme [DP-001](../decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md); nenhum ato de atesto é produzido automaticamente.

## Resultado esperado desta rodada

Um incremento real, reversível e isolado do domínio E1, com testes e documentação técnica. Não é um redesenho do Gemini nem a implementação integral E1–E5. O próximo passo após a avaliação do PR é ligar as referências à **experiência operacional existente**, não construir quatro telas novas.
