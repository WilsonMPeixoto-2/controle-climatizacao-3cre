# Concepção Funcional do Produto — Etapa 2 (v1.0)

**Projeto:** GOP Clima — 3ª CRE / SME-RJ  
**Data-base:** 31/10/2026  
**Estado:** proposta para discussão, **não homologada para implementação**.  
**Documento editorial:** `GOP_CLIMA_Etapa2_Concepcao_Funcional_v1.0.docx` — criado em Word, com 11 páginas, seis ilustrações incorporadas e diagramas; **o arquivo binário ainda não foi enviado a este repositório**.

## Objetivo da concepção

Transformar o portal de acompanhamento de chamados numa ferramenta que também ofereça **inteligência financeira integrada**, preservando a experiência operacional e evitando reproduzir as abas dos quatro módulos Excel.

A concepção detalhada permanece subordinada à [Carta de Princípios](./CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md).

## Direções funcionais propostas

1. **Reutilizar a estrutura atual:** chamados, escolas, identificação de unidade, histórico, consulta e comunicações permanecem como porta de entrada.
2. **Referências econômicas contextuais:** calcular estimativas pertinentes a escolas, equipamentos e serviços, sem exigir classificação manual nem presumir faturamento adicional em cada corretiva.
3. **Previsão por competência:** consolidar programação e demandas sem duplicar aparelhos, serviços ou períodos.
4. **Uma única área de Gestão Financeira:** indicadores de previsão, composição financeira, NFs, empenhos e pagamentos informados, com filtros claros.
5. **Registro financeiro resumido:** acompanhar documentos e estados financeiros sem reproduzir atesto formal, IMR integral ou liquidação no site.
6. **Visualização progressiva:** os cálculos ficam no processamento interno, e somente os resultados pertinentes aparecem nas telas.
7. **Rigor sem burocratização:** diferenciar valor de referência, estimativa, informação para faturamento, faturado, liquidado e pago.

## Estrutura editorial produzida

O documento Word contém: sumário executivo; histórico do projeto; limites da informação contratual; aproveitamento dos módulos Excel; arquitetura do produto; navegação e integração às telas existentes; jornada de abertura e estimativa; Gestão Financeira; distinções e calendários financeiros; fronteiras de responsabilidades; alternativas de produto; entregas da primeira atualização; critérios de aceite; questões abertas; conclusão; fontes e ficha de deliberação.

As seis figuras do DOCX ilustram: evolução histórica, arquitetura em camadas, jornada de solicitação, proposta de painel financeiro, três calendários e responsabilidades do site versus documentos externos.

## Fontes e ressalvas

- [Carta de Princípios v1.0](./CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md)
- Contexto e estado do site no repositório (`docs/CONTEXTO.md`, `docs/ESTADO_DO_PROJETO.md` e código executável).
- TR de climatização SME-RJ e documentos/planilhas de 2026, sujeitos à validação do contrato e dos valores aplicáveis.
- [Tentativa exploratória Gemini V8.9](../referencias/gemini-v8.9/README.md), não homologada.

**Importante:** divergências entre cadastros e planilhas não podem ser corrigidas automaticamente, e uma simulação financeira não equivale a medição, nota fiscal, liquidação ou pagamento.

## Versionamento do conteúdo integral

A conversão fiel do Word para Markdown, com os diagramas representados em Mermaid, está disponível em **[documento-integral-v1.0/](./documento-integral-v1.0/README.md)**. A versão foi dividida em cinco partes e verificada mediante leitura de volta do GitHub. Não é apenas uma síntese: são os capítulos, quadros e anexos da versão textual integral. O DOCX original ainda não foi submetido como binário ao repositório.

## Próximo marco

Revisão e discussão da concepção funcional antes de qualquer especificação ou implantação. A publicação do arquivo DOCX editável no repositório permanece **pendente**; não se deve declarar que o Word foi versionado até que o binário conste no histórico Git.
