# Carta de princípios do produto

**Projeto GOP Clima 3ª CRE**  
**Diretrizes para a concepção da primeira evolução financeira do sistema**

**Documento de entendimentos consolidados | Versão 1.0 | 31 de outubro de 2026**

> **O site não deve ser uma tradução online dos arquivos Excel.**

Esta carta registra a intenção do produto, os limites do seu papel e os entendimentos construídos em diálogo. Serve como referência anterior ao planejamento funcional, para orientar escolhas futuras sem converter exemplos em requisitos fechados.

| NATUREZA DESTE DOCUMENTO | O QUE ELE NÃO É |
|---|---|
| Carta de filosofia e diretrizes de produto | Não é plano de implementação, backlog, protótipo ou especificação técnica. |
| Registro de entendimentos já alinhados | Não aprova telas, botões, modelos de dados ou fluxos ainda não deliberados. |
| Referência para conceber a evolução financeira | Não amplia o site para um sistema de atestação, fiscalização formal ou instrução processual. |

## 01. Origem, contexto e recorte correto da demanda

**Marco inicial.** O primeiro parágrafo do prompt enviado ao Gemini tratava exclusivamente de um arquivo de instruções de um módulo Excel. Não estabelecia requisito para o site. A demanda relativa à aplicação começa na expressão: “Quando acabar este último arquivo vamos começar a etapa 2. Sugiro começar com um plano de ação”.

**O que foi solicitado.** Primeiro, uma concepção de produto apresentada textualmente: quais necessidades atender, quais recursos aproveitar, o que acrescentar à navegação, quais funções permanecem no Excel e por que as decisões propostas proporcionariam uma experiência simples. Somente após discussão e validação dessa concepção caberia projetar e implementar o código.

**Desvio a evitar.** A entrega de HTML ou de arquivos técnicos, por mais sofisticados que pareçam, não substitui a etapa de definição do produto. A existência de um protótipo não significa que as escolhas de interface, escopo e comportamento foram previamente aprovadas.

## 02. Propósito e proposta de valor

A aplicação já dispõe de uma base operacional para escolas, equipamentos, localização, abertura e acompanhamento de chamados e indicadores de atendimento. A evolução desejada não é reconstruir essa base, e sim utilizá-la como fonte de inteligência financeira.

**Propósito central.** Converter dados operacionais e parâmetros contratuais em respostas rápidas e úteis sobre o custo previsto das demandas, a projeção de gastos, a composição financeira mensal e a situação dos recursos e pagamentos registrados.

**Resultado esperado.** O servidor escolhe ou confirma informações familiares à sua atividade; o sistema relaciona cadastros existentes, identifica parâmetros pertinentes e devolve informações consolidadas sem impor a manipulação das fórmulas que as produziram.

## 03. Princípios consolidados

| PRINCÍPIO | CONSEQUÊNCIA PARA O PRODUTO |
|---|---|
| **P1 — O site não é o Excel online** | Selecionar capacidades, não reproduzir abas, planilhas, tabelas intermediárias ou a organização dos quatro módulos. A equivalência deve ser funcional, não visual. |
| **P2 — Evolução, não reconstrução** | Preservar e reutilizar as funcionalidades e os identificadores já existentes, reduzindo retrabalho e evitando cadastros paralelos. |
| **P3 — Complexidade interna; simplicidade externa** | Transferir classificação, cálculo, cruzamentos, totalizações e validações para a lógica do sistema. O usuário vê o resultado e o contexto necessário para entendê-lo. |
| **P4 — Entrada de dados mínima** | Não solicitar novamente escola, equipamento, tipo ou potência quando o cadastro já fornecer essas informações confiavelmente. |
| **P5 — Valor prático antes de abrangência** | Priorizar orçamento prévio, projeção mensal, composição de valores e informações de gestão financeira. Não ampliar o escopo apenas porque uma função existe no Excel. |
| **P6 — Visão consolidada com detalhes sob demanda** | Apresentar respostas rápidas e indicadores claros; permitir aprofundamento quando útil, sem expor microinformações permanentemente. |
| **P7 — Linguagem da atividade, não da tecnologia** | Rótulos e ações compreensíveis para servidores com diferentes graus de familiaridade com sistemas e rotinas contratuais. |
| **P8 — Automatizar cálculos sem presumir atos administrativos** | Um valor estimado não é, por isso, valor devido. A lógica interna deve preservar as distinções pertinentes sem exigir que toda a documentação seja produzida no site. |
| **P9 — Regras confiáveis sem burocratizar a experiência** | Parâmetros contratuais corretos, dados consistentes, histórico básico e possibilidade de conferência servem à segurança do sistema, não à reprodução do processo administrativo na tela. |
| **P10 — Evolução incremental e verificável** | Conceber uma primeira atualização objetiva, implementá-la no sistema real, verificar seu funcionamento e só então decidir as etapas seguintes. |

## 04. Divisão de responsabilidades entre instrumentos

O sistema e os instrumentos administrativos não competem entre si. Cada um deve desempenhar o papel para o qual oferece mais eficiência e confiabilidade.

| NO SITE, COMO PRIORIDADE | FORA DO ESCOPO CENTRAL DO SITE |
|---|---|
| Relacionar solicitações, escolas e equipamentos já cadastrados. | Produzir todos os documentos comprobatórios e formulários formais de fiscalização. |
| Identificar parâmetros aplicáveis e calcular valores de referência automaticamente. | Reproduzir cada fórmula, campo auxiliar e aba de controle das planilhas. |
| Gerar previsões e consolidar custos por competência, escola e situação. | Substituir, por padrão, processos administrativos, atestos formais ou documentos exigidos para pagamentos. |
| Exibir resultados financeiros, pendências de informação e pagamentos registrados. | Implantar, nesta fase, um sistema completo de gestão jurídica e instrução processual. |

**Nota de interpretação.** Manter comprovações e atos formais em Excel e demais instrumentos não elimina o dever de modelar corretamente os valores apresentados no site. Da mesma forma, preservar informações conferíveis internamente não implica reproduzir a documentação integral na interface.

## 05. Da demanda ao valor: distinções que devem existir por trás da tela

A proposta admite automatização intensa, mas exige diferenciar a natureza dos valores para não confundir previsão de gasto, execução e pagamento.

| CONCEITO | PAPEL NA EXPERIÊNCIA |
|---|---|
| Custo estimado da demanda | Resultado preliminar calculado a partir dos equipamentos selecionados, do serviço efetivamente aplicável e dos parâmetros contratuais pertinentes. |
| Previsão mensal | Consolidação de demandas programadas ou em atendimento, identificada expressamente como estimativa. |
| Valor encaminhado à composição financeira | Quantia vinculada a uma transição operacional explicitamente definida, cuja premissa de validação deve ser compatível com os procedimentos externos. |
| Faturamento informado | Valores associados à competência e às notas fiscais efetivamente registradas; não confundir com estimativas. |
| Liquidação e pagamento informados | Registros da situação financeira pertinente, respeitando sua diferença conceitual e sem presumir que o site executou atos externos. |

**Princípio operacional.** O cálculo pode ocorrer instantaneamente. A transição de um valor previsto para outro estado financeiro depende de um evento definido e válido. O usuário pode acionar esse evento de maneira muito simples, desde que o sistema não declare automaticamente uma condição administrativa não demonstrada.

## 06. Exemplo ilustrativo: selecionar, calcular, consolidar

Cenário de referência, não requisito aprovado: uma escola possui vários aparelhos cadastrados, mas sua solicitação envolve apenas alguns deles. O usuário abre a demanda e seleciona somente os equipamentos abrangidos.

| ETAPA DA EXPERIÊNCIA | FUNCIONAMENTO PRETENDIDO |
|---|---|
| 1. Identificação contextual | A escola já está vinculada à solicitação; sua lista de equipamentos aparece sem novo cadastro. |
| 2. Seleção restrita | O servidor indica os aparelhos efetivamente envolvidos, e não toda a carteira da unidade escolar. |
| 3. Cálculo automático | O sistema utiliza os dados técnicos já cadastrados e aplica as regras de precificação pertinentes para produzir um orçamento prévio. |
| 4. Projeção e consolidação | O valor alimenta as previsões gerenciais adequadas, sem se confundir com faturamento autorizado. |
| 5. Transição de estado | Conforme a concepção que vier a ser aprovada, uma ação simples ou evento de encerramento poderá encaminhar o valor à composição financeira, observadas as premissas administrativas pertinentes. |

O exemplo não aprova um botão específico, não define a ordem final dos eventos e não impõe a produção documental dentro da aplicação. Demonstra apenas como muitos dados e regras podem resultar em pouquíssimas ações do servidor.

## 07. Diretrizes para a experiência visual

**Referência de painel.** A inspiração no Power BI diz respeito à capacidade de visualizar informações consolidadas, selecionar filtros rapidamente e compreender relações entre demandas, previsões e execução financeira. Não exige adotar o Power BI como ferramenta nem reproduzir seus controles ou densidade visual.

- **Informação orientada por perguntas:** quanto está previsto, quanto foi encaminhado ao faturamento, o que está registrado como pago e quais unidades concentram demandas?
- **Pouca navegação:** aproveitar as telas atuais e considerar, se realmente contribuir para o uso, uma área financeira concentradora.
- **Detalhamento progressivo:** oferecer acesso a informações complementares quando solicitadas, sem poluir a visão geral.
- **Filtros inteligíveis:** competência, escola, situação e outros recortes necessários; distinguir indicadores globais de resultados filtrados.
- **Comunicação precisa:** usar “estimado”, “registrado”, “faturado” e “pago” conforme o dado representado; evitar rótulos que insinuem reconhecimento não ocorrido.
- **Qualidade visual funcional:** hierarquia clara, tipografia legível, espaço útil bem aproveitado, contraste adequado e ausência de gráficos meramente decorativos.

## 08. O que está decidido e o que ainda não está

| SITUAÇÃO | REGISTRO |
|---|---|
| **CONSOLIDADO** | A primeira entrega desejada é uma concepção de produto, textual e justificada, antes de implementação ou prototipação. |
| **CONSOLIDADO** | O site deve reutilizar o sistema operacional existente, sem se tornar uma versão web das planilhas. |
| **CONSOLIDADO** | A primeira evolução prioriza inteligência financeira, cálculos automáticos e consolidações úteis. |
| **CONSOLIDADO** | O site não assume como objetivo principal a produção de toda a prova documental, o atesto formal ou a instrução jurídica-administrativa. |
| **DIREÇÃO PREFERENCIAL** | Concentrar novas informações em poucas intervenções na experiência existente e em uma visualização financeira integrada, a avaliar na concepção. |
| **EXEMPLO, NÃO REQUISITO** | Utilizar um botão ou o encerramento de uma demanda para encaminhar valores do orçamento prévio à composição do faturamento. |
| **EM ABERTO** | Estrutura final das telas, ações exatas, regras de estados, casos de exceção, prioridade dos indicadores e forma de registrar informações externas. |
| **EM ABERTO** | Limites exatos da primeira entrega: devem ser propostos e justificados no planejamento de produto, com validação posterior. |

## 09. Antipadrões expressamente incompatíveis com a filosofia

- Converter cada módulo ou aba do Excel em uma seção correspondente no site.
- Criar formulários ou recadastros para dados que o sistema já possui.
- Expor parâmetros, fórmulas, classificações contratuais ou tabelas densas sem necessidade operacional.
- Apresentar custo estimado de uma solicitação como serviço comprovadamente executado ou pagamento efetuado.
- Usar valores financeiros sem base contratual pertinente ou adotar categorias padrão para dados técnicos desconhecidos.
- Confundir um protótipo HTML com a atualização efetivamente integrada e publicada no sistema.
- Antecipar decisões de interface, funcionamento ou escopo sem submetê-las à etapa de concepção solicitada.
- Acrescentar controles documentais e jurídicos completos ao site apenas porque são necessários no processo administrativo externo.

## 10. Como deve ser elaborado o próximo documento: a concepção do produto

O planejamento seguinte deverá responder à pergunta “qual experiência deve ser construída e por quê?”, antes de responder à pergunta “como programá-la?”. Sua entrega deverá ser textual, estruturada e comparativa, considerando o que já existe no sistema e a contribuição marginal de cada proposta.

**Conteúdo esperado da concepção:**

- Diagnóstico resumido da experiência atual e identificação das lacunas financeiras prioritárias.
- Relação das atividades reais dos servidores e de suas perguntas mais frequentes sobre demandas, previsões e gastos.
- Seleção justificada das capacidades dos quatro módulos Excel que geram valor no site, e das que devem permanecer nos demais instrumentos.
- Descrição das jornadas pretendidas, da navegação e dos elementos visuais, com alternativas quando houver escolhas relevantes.
- Exemplos de uso simples que demonstrem integração de cadastros, precificação, projeções mensais e consolidação.
- Delimitação explícita da primeira atualização e do que ficará para versões posteriores.
- Critérios de utilidade, simplicidade, qualidade informacional e validação a observar antes da implementação.

**Sequência de trabalho acordada:**

Concepção textual de produto → análise e refinamento das escolhas → aprovação do recorte funcional → desenho de interface e regras → implementação no site real → verificação dos resultados e da persistência → avaliação da próxima etapa.

## 11. Critérios para julgar se a concepção respeita esta carta

| CRITÉRIO | PERGUNTA DE AVALIAÇÃO |
|---|---|
| Utilidade | O servidor obtém uma resposta ou conclui uma tarefa que hoje exige mais passos ou cruzamentos manuais. |
| Integração | Os cadastros existentes são reutilizados e a vinculação entre escola, equipamento, demanda e informação financeira é inteligível. |
| Simplicidade | A interface não obriga o servidor a reproduzir o trabalho matemático ou o detalhamento das planilhas. |
| Fidelidade | Os valores são apresentados com a natureza correta: estimativa, informação de faturamento ou registro financeiro efetivo. |
| Escopo | A primeira atualização não se torna uma reformulação integral nem um sistema documental paralelo. |
| Rastreabilidade proporcional | Há fundamento suficiente para conferir os resultados, sem impor provas e formulários desnecessários à experiência cotidiana. |
| Evolução verificável | O que for aprovado poderá ser implementado no sistema real e testado sem depender de afirmações de sucesso não verificadas. |

## 12. Regra para continuidade e atualização deste entendimento

Este documento é a referência conceitual inicial. Em futuras conversas, protótipos ou contribuições de outros agentes, decisões que contrariem seus princípios deverão ser identificadas e justificadas antes de serem incorporadas ao produto. Novas ideias serão tratadas como propostas até aprovação expressa, e não como alterações silenciosas da filosofia estabelecida.

Quando houver mudança relevante de escopo ou entendimento, recomenda-se registrar em nova versão: a decisão revisada, o motivo e os efeitos esperados na experiência do servidor. A presente versão consolida o diálogo, mas não encerra as escolhas que pertencem à etapa de concepção.

---

### Síntese de encerramento

> **Uma aplicação mais inteligente por dentro, mais simples por fora e mais útil no trabalho diário.**

A primeira evolução do GOP Clima deve transformar os dados operacionais já existentes em previsões e informações financeiras confiáveis, com poucos passos para o servidor. O Excel e os instrumentos administrativos conservam suas funções próprias. A concepção do produto precede a implementação; a implementação real precede qualquer declaração de conclusão.
