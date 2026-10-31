# Prompt original do usuário — intenção para a Etapa 2

**Classificação:** fonte primária da intenção do produto.  
**Estado:** entendimento consolidado e contextualizado em conversa posterior.  
**Não é:** especificação de interface ou autorização de implementação imediata.

## Contextualização indispensável

O parágrafo inicial do prompt, relativo a “gerar o arquivo com instruções para este módulo”, **referia-se exclusivamente a outro arquivo Excel** e **não dizia respeito ao site**.

A demanda para a evolução do site começa em: **“Quando acabar este último arquivo vamos começar a etapa 2. Sugiro começar com um plano de ação.”**

**O que “plano de ação” significava neste contexto:** uma **concepção textual do produto**, não a descrição de código que seria programado e muito menos uma ordem de implementação. O usuário pretendia discutir e justificar as capacidades de cada nova área, a organização da interface, a simplicidade visual, a reutilização de cadastros existentes e as atividades que deveriam permanecer nos instrumentos Excel e administrativos.

## Trecho do prompt original relativo ao site

> Quando acabar este último arquivo vamos começar a etapa 2. Sugiro começar com um plano de ação. A primeira coisa que precisamos pensar é em como traduzir as principais funcionalidades dos 4 módulos para o site de forma que o site não aumente o número de telas absurdamente e se torne um sistema não intuitivo e difícil de usar pelo servidor público mediano, e muitas vezes sem muita familiaridade com sistemas complexos. A complexidade deve ser feita por nós nos códigos e no desenvolvimento, de forma que o site seja o mais automático e integrado possível.
>
> Podemos ter uma painel operacional de gestão de dados no site com um design baseado em um power BI. Essa aba do site mostraria visualmente as principais informações já consolidadas e permitiria análises com toques simples e intuitivos.
>
> Talvez não seja possível, ou até mesmo necessário, levar todas as abas e complexidade das planilhas e de todos os módulos. Já temos uma base para gestão dos aparelhos de ar condicionado, abertura com registro de chamados e criação de identificação dos chamados, análise de dados de diversas formas de incluindo tempo de abertura do chamado, gestão do atendimento, cadastro e localização das unidades escolares, dentre uma ampla variedade de funcionalidades e gestão de dados. Essencialmente o que não existe ainda são informações financeiras, tanto em relação aos valores novos que foram contratados, quanto a gestão de gastos mensais, gestão das verbas disponíveis, pagamentos de faturas e demais informações referentes ao pagamento e gestão de verbas. Essa seria a prioridade! Relacionar os chamados de manutenção com cálculos dos serviços e gestão financeira dos pagamentos. Na minha concepção dentre outras ideais que você pode pensar podemos facilitar muito incorporando os valores unitários dos serviços em um banco de dados interno que nem precisa ficar visível de forma que os cálculos fossem feitos automaticamente. A filosofia é que a complexidade fique para o sistema e fique *invisível* e o usuário veja um site simples, intuitivo e inteligente, automatizado etc os documentos em Excel que criamos ten um grau de detalhamento muito maior porque cada micro informação fica exposta e lá muitos dados são gerados e construídos com diversos objetivos, como comprovação de gestão e fiscalização micro, etc.
>
> **O site não deve ser uma tradução online dos arquivos em Excel! Isso precisa ficar muito claro!**
>
> Vou até repetir para isso ficar como uma premissa básica:
>
> **O site não deve ser uma tradução online dos arquivos em Excel! Isso precisa ficar muito claro!**
>
> Neste primeiro momento é melhor fazermos escolhas que sejam mais objetivas e se for necessário, em outro momento futuro, podemos acrescentar algo. Neste primeiro momento em linhas gerais acredito que o maior diferencial em relação ao que o site faz hoje e o que precisa fazer agora é uma gestão financeira, com cálculos automatizados do valor das demandas, cálculo dos serviços para composição da nota fiscal mensal e gestão da verba disponível mensalmente.
>
> Essas são minhas diretrizes gerais iniciais. Você deve criar um plano para fazermos a primeira implementação real que irá atualizar o site com estes elementos. O plano não precisa neste momento pensar em todo o site completo. Vamos focar nesta primeira atualização e vamos planejar as próximas quando for o momento certo, depois que as atualizações de agora estiverem funcionando perfeitamente.

*Transcrição do trecho pertinente ao site, com normalização mínima de espaços, quebras e marcação Markdown; preservam-se o conteúdo e as expressões originais.*

## Esclarecimentos posteriores confirmados pelo usuário

- O site **não tem cunho explicativo ou documental**: não se destina a substituir o Excel, os documentos de comprovação, a atestação formal ou a gestão jurídico-administrativa.
- Reutilizar escola, equipamentos cadastrados, demanda específica e preços aplicáveis para gerar **orçamento prévio** e **previsão mensal** é exemplo central da experiência desejada.
- O usuário pode selecionar **somente os equipamentos envolvidos** em um atendimento; não se presume que o serviço abranja todo o parque da unidade.
- Uma transição simples de valor estimado para composição de faturamento, por botão ou evento de encerramento, **foi apresentada como exemplo ilustrativo**, não como fluxo aprovado.
- A complexidade contratual deve orientar as regras internas, sem impor uma interface burocrática; **não confundir cálculo automático com atesto automático**.
- As críticas técnicas à primeira tentativa do Gemini são pertinentes, mas não autorizam ampliar o escopo do site para uma suíte documental.

## Interpretação autorizada para continuidade

Antes de programar, elaborar uma concepção funcional que justifique **o que aproveitar, o que não incorporar, como simplificar e qual será a experiência real do servidor**. O trabalho subsequente deve seguir os princípios da Carta do Produto, não o mapa de módulos proposto pelo protótipo.
