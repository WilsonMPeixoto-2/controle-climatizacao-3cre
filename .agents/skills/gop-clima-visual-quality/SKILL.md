---
name: gop-clima-visual-quality
description: Aplicar à criação ou revisão de UI, CSS, componentes, dashboards, ícones, modais, gráficos e responsividade do GOP Clima; preservar identidade existente e comprovar acabamento por renderização real.
---

# GOP Clima · Roteiro visual aplicável

**Entrada:** siga primeiro o [`AGENTS.md`](../../../AGENTS.md). Esta skill **só complementa o passo 3** quando a mudança afeta a experiência visual. Não é uma obrigação de instalar todos os plugins citados no projeto.

## 1. Antes de editar
Veja **o componente e a tela real**, o fluxo do servidor, o JSX, os tokens e as telas vizinhas. Identifique **uma pergunta ou tarefa que deve ficar mais fácil**. Preserve Outfit/Inter, Lucide, a paleta, `src/index.css`, `src/styles/`, sidebar, estados e tema atuais. O visual Gemini não foi aprovado.

## 2. Ao implementar
- Priorize **resposta concisa → exceção verificável → ação contextual → detalhes sob demanda**. Não multiplique cartões, textos, formulários ou gráficos decorativos.
- Reaproveite componentes e dados existentes; mantenha edição flexível pelo responsável (DP-001), continuidade visual (DP-002) e inteligência da informação (DP-003).
- **Ferramentas somente conforme a necessidade e disponibilidade:** Frontend Design (direção), UI/UX Pro Max (padrões), Impeccable (crítica), Vercel Web Interface Guidelines (qualidade técnica), Apple HIG (referência), Figma/Mobbin (pesquisa), Browser/Playwright/axe (evidência). Verifique instalação e acesso; não dependa de TinyFish.
- Não portar marcas, imagens, CSS ou decisões do projeto CTRH. O sistema original do GOP Clima é a referência.

## 3. Para declarar pronto
- Renderize a **interface real**, não apenas um mockup. Examine mobile, desktop e monitor largo/4K, claro/escuro, dados ausentes, tooltips, tabela, overflow, foco e teclado.
- Compare com a tela anterior no mesmo viewport e conjunto de dados; reporte branch, SHA e preview/capturas verificáveis. Se faltar navegador, **declare a limitação**.
- Rode lint/testes/build e Playwright pertinentes. Diferencie regressão, falha ambiental e screenshot antigo; não apague testes nem regenere snapshots cegamente.
- Entregue PR de revisão. **Qualidade visual é homologada pelo usuário; CI verde não é aprovação estética.** Não promover produção automaticamente.

### Referência profunda (consultar só quando realmente necessária)
[`PROTOCOLO_VISUAL_E_FERRAMENTAS.md`](../../../docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md) contém inventário das skills do CTRH, conexões disponíveis e a matriz detalhada de verificação. **Não precisa ser lido em toda tarefa.**
