# Instruções permanentes para agentes — GOP Clima 3ª CRE

Este documento é o ponto de entrada para **Codex e outros agentes que executam tarefas neste repositório**. Preserva o contexto de produto e a metodologia de qualidade visual já desenvolvida em outros projetos SME-RJ, mas **não presume que skills ou plugins de outros repositórios estejam instalados aqui**.

## 1. Ordem de leitura para Etapa 2

1. `docs/etapa-2/concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md`;
2. `docs/etapa-2/decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md`;
3. `docs/etapa-2/decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md`;
4. `docs/etapa-2/decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md`;
5. `docs/etapa-2/concepcao/documento-integral-v1.0/README.md`, para arquitetura de produto;
6. `docs/etapa-2/planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md` e documentos do incremento ativo.

A concepção orienta evolução incremental. **Referências de outros produtos ou protótipos, incluindo o Gemini, não substituem o design do GOP Clima**.

## 2. Regra mandatória para qualquer atividade visual

**Antes de implementar, revisar ou polir UI, ler integralmente**:

- `.agents/skills/gop-clima-visual-quality/SKILL.md`;
- `docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md`.

Isso inclui menus, dashboards, gráficos, cartões, filtros, modais, iconografia, tipografia, tabelas, responsividade, cores e alterações CSS pequenas. O protocolo aplica-se **somente ao escopo da alteração**, sem reabrir indefinidamente o desenho do restante do site.

## 3. Fonte da verdade do produto e da identidade

- Código real: `src/App.jsx`, `src/components/`, `src/domain/`, `src/infrastructure/firebase/`.
- Identidade: `src/index.css`, `src/styles/tokens.css`, `src/styles/components.css`, `src/styles/dashboard.css`, `src/styles/maturity-2026.css`, `src/styles/return-polish-2026.css`, `src/styles/finance.css`.
- Fontes: Outfit/Inter; ícones Lucide; classes e tokens já existentes; comportamento em claro/escuro e desktop grande/mobile.
- Dados: escolas e chamados **já existentes**; os históricos são preservados. Não presumir atendimentos, competências, valores apurados, NFs ou pagamentos com base apenas em status de chamado ou totais de equipamentos.

**DP-001:** o produto informa, calcula, sugere e deixa o gestor ajustar; não executa medição, atestação ou decisão administrativa por conta própria.

**DP-002:** o novo design deve ser uma **evolução visual do GOP Clima**, não uma página padrão de template ou segunda aplicação.

**DP-003:** a interface deve **diminuir leitura, redigitação e navegação**, oferecer respostas e próximos passos baseados em evidências; gráficos são interativos e relacionados aos registros, não decoração.

## 4. Ferramentas e habilidades: verificar disponibilidade e usar por finalidade

As opções e o inventário de origem estão no protocolo visual. Usar o recurso realmente disponível na sessão e apropriado à tarefa: skill de direção de arte/UX para alternativas, auditoria técnica de interface para regras, Figma/Mobbin/Browser quando acessíveis, Playwright/axe para evidência renderizada. **Não afirmar uso de plugin apenas porque ele foi usado num projeto anterior.**

O protocolo do CTRH adotava `impeccable-frontend-design` e habilidades complementares. Aqui, o ponto de entrada específico é `gop-clima-visual-quality`, sem importar regras da marca, CSS ou lógica do CTRH.

**Não usar TinyFish nem recomendar compra de créditos como dependência do fluxo.** Utilizar Browser/Playwright ou ferramentas de inspeção já disponíveis, conforme permissões.

Não instalar novas bibliotecas, copiar pacotes privados, executar scripts remotos ou migrar design system sem necessidade demonstrada, conferência de licença/dependências e autorização pertinente.

## 5. Evidência e homologação

- Antes de editar: comparar o componente existente, escopo aprovado e contexto funcional.
- Depois: verificar comportamento, navegação, acessibilidade, tema e UI real.
- Rodar `npm run lint`, `npm test`, `npm run build`, e Playwright/Firestore conforme o escopo; separar falha de teste, baseline desatualizado e regressão comprovada.
- Fazer capturas reais **mobile (~390 CSS px), desktop (1440/1920 CSS px) e telas grandes/4K**, com identificação de branch/SHA, dados e tema; conferir aproveitamento de largura em monitor de 32”, sem confundir resolução física com CSS px.
- Inspecionar corte da marca, nitidez dos ativos visuais, ícones, gráfico/tooltip, overflow, foco, contraste e microinterações. Não considerar `CI verde` substituto de homologação estética.
- Evitar mudança cega de screenshots esperados para forçar sucesso do pipeline.
- Produção, merge, migrar banco ou mudar regras de Firestore requerem revisão/autorizações próprias; PR em rascunho não significa implantação.

## 6. Princípio contra loops

Distinguir **falha funcional comprovada**, **regressão visual objetiva**, **melhoria visual justificável** e **decisão de execução do gestor**. Corrigir as duas primeiras, priorizar a terceira pelo benefício e deixar a quarta para o usuário com mecanismos simples de ajuste.

Não substituir um sistema utilizável por uma sucessão de propostas mais longas, genéricas ou carregadas de texto.
