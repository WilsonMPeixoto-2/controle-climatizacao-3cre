# Gemini V8.9 — Referências exploratórias da Etapa 2

> **ACERVO HISTÓRICO NÃO HOMOLOGADO. NÃO É CÓDIGO PARA IMPLEMENTAÇÃO OU PUBLICAÇÃO.**

**Situação:** primeira tentativa exploratória de traduzir as necessidades da Etapa 2 em uma demonstração interativa.  
**Data da catalogação:** 31/10/2026.  
**Autor da proposta original:** Gemini, a partir do prompt e do histórico fornecidos pelo usuário.  
**Responsabilidade desta pasta:** preservar contexto e conhecimento que possam ser examinados na **concepção do produto**, antes de qualquer implementação.

## Por que este acervo existe

O usuário solicitou **primeiro um plano textual de concepção do produto**, analisando quais funcionalidades dos quatro módulos Excel mereciam ser incorporadas ao site, quais deveriam permanecer nos instrumentos existentes e como gerar uma experiência simplificada para servidores públicos. A intenção era **evoluir o site atual**, principalmente na gestão financeira, sem traduzir as planilhas em telas.

O Gemini respondeu com um plano e avançou, antes da validação da concepção, para um protótipo HTML/JavaScript e alegações de implementação. **Esse resultado é uma tentativa exploratória**, não uma decisão de produto aprovada, nem evidência de integração ao site React/Firebase ou publicação em produção.

## Conteúdo selecionado

- [01 — Prompt original e contextualização](./01_PROMPT_ORIGINAL_E_CONTEXTO.md): fonte prioritária da intenção do usuário.
- [02 — Proposta funcional apresentada pelo Gemini](./02_PLANO_GEMINI_COM_RESSALVAS.md): visão histórica das ideias sugeridas, com as alegações técnicas devidamente qualificadas.
- [03 — Mapa de reaproveitamento do protótipo](./03_MAPA_DE_APROVEITAMENTO.md): interações e padrões que merecem **avaliação**, não adoção automática.
- [04 — Inventário técnico e limitações](./04_INVENTARIO_E_RISCOS.md): elementos identificados e motivos que impedem reutilização direta.

## Fontes examinadas e integridade

Os arquivos locais `painel-integrado-v9.html` e `GOP Clima 3ª CRE — Plataforma Integrada V8.9 (Contrato nº 59_2026).html` eram **idênticos**, com SHA-256:

`46440f367184b1c161612aa925ebe9207948a8e6d47aee2e4c49aea450dd2f80`

Também foram examinados `DESCRICAO_PR_ETAPA_2_FINANCEIRO_BI.md` e `aplicar_etapa2_financeiro_e_abrir_pr.py`. O script apresenta erro sintático verificável e a descrição de PR não comprova que os caminhos de código anunciados tenham sido integrados.

### Por que o HTML e o script não foram copiados integralmente

1. O repositório é **público**, e o HTML original contém base embutida de escolas, equipamentos e chamados; não se presume que todo registro operacional deva ser redistribuído publicamente.
2. O protótipo inclui **cálculos e regras financeiras insuficientemente validados**, além de textos que sugerem faturamento, glosas ou atos administrativos com base em estados simulados.
3. Preservar a íntegra sob o diretório de documentação poderia induzir reutilização incorreta ou confusão com código homologado.
4. O script de integração contém erro de sintaxe e não serve de procedimento de implantação.

A ausência desses arquivos **é intencional**, e não perda de referência: os aspectos aproveitáveis estão catalogados aqui. Uma eventual preservação integral exigiria reavaliação da necessidade, da publicidade dos dados, da rotulagem e do isolamento do código.

## Autoridade documental e sequência

A [Carta de Princípios do Produto](../../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md) **prevalece** sobre qualquer sugestão deste acervo.

**Ordem de trabalho:** intenção do usuário → concepção textual do produto → discussão e aprovação → desenho das jornadas e telas → implementação real no sistema → testes e verificação.

**Regra para outros agentes:** não copiar estas propostas para `src/`, `public/`, regras de negócio ou Firebase; não reaproveitar preços, prazos, retenções, saldos ou critérios de glosa sem validação contratual e funcional independente. Um exemplo nesta pasta não equivale a requisito aprovado.
