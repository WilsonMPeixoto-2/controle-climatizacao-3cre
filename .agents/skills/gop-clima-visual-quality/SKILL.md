---
name: gop-clima-visual-quality
description: Coordena direção de arte, UX, inteligência visual e QA no GOP Clima 3ª CRE, com preservação do design system e das decisões DP-001 a DP-003. Use obrigatoriamente ao alterar ou auditar CSS, React visual, gráficos, dashboards, tabelas, formulários, modais, ícones, responsividade ou acessibilidade visual.
---

# GOP Clima · Ateliê de Qualidade Visual

Esta skill é uma **orquestradora local** para agentes que operam neste repositório. Inspira-se na metodologia de qualidade visual versionada anteriormente no projeto CTRH, mas **não transporta sua identidade, seus componentes, suas decisões ou qualquer aprovação estética**.

Leia sempre `AGENTS.md`, a DP-001/002/003 e `docs/etapa-2/qualidade-visual/PROTOCOLO_VISUAL_E_FERRAMENTAS.md`.

## Quando aplicar

Qualquer tarefa com efeito visual: criação/edição de React JSX, CSS, ilustrações, marca, layouts, cartões, dashboards, gráficos, interações, acessibilidade, animação, responsividade ou revisão de PR visual. Para regra de domínio sem UI, não consumir ferramentas de arte.

## Método obrigatório, enxuto

### 1. Inspeção do produto existente
- Identificar branch, commit, PR, arquivos e componente específico afetado.
- Ler o JSX atual, tokens, componentes de estilo e as telas vizinhas. Verificar como a função é usada; não criar UI separada ou segundo menu.
- Examinar, quando acessível, o preview real e as capturas de referência **autênticas**. Não declarar que viu uma tela que não foi renderizada.
- Resolver uma tarefa real: *o que usuário precisa reconhecer, decidir ou concluir com menos leitura/cliques?*

### 2. Direção de arte contextual
- Preservar a assinatura institucional/brand do GOP Clima, Outfit/Inter, Lucide, superfícies, hierarquia, tema claro/escuro e CSS vigente.
- Usar estilo deliberado e acabamento editorial com densidade controlada, e não repetir cartões brancos genéricos/gradientes/eyebrows/ícones aleatórios.
- Ao avaliar gráficos: cada visual responde a uma pergunta concreta; fonte do dado, período, alcance e possibilidade de clicar até escola/chamado são claros.
- Para ícones, comparar tamanho, peso óptico, alinhamento e estados; preferir família atual antes de importar outra.
- Toda proposta respeita DP-001: indicar pendência não é impor uma trava, registrar a informação não é atestar.

### 3. Recursos por função, sem simular instalações
- **Direção artística:** `frontend-design`, se instalada no ambiente.
- **Padrões, UX e iconografia:** `ui-ux-pro-max`, se instalada.
- **Crítica e acabamento:** `impeccable`, se instalada.
- **Critérios web técnicos:** `web-design-guidelines` e orientações de acessibilidade disponíveis.
- **Apple HIG:** inspiração de precisão e legibilidade, não importação de identidade Apple.
- **Visual Quality privado:** utilizar quando explicitamente acessível; não presumir conexão ou sua instalação a partir do CTRH.
- **Figma, Mobbin, MagicPath, Adobe/Canva:** exploração seletiva, apenas quando conectados, permitidos e úteis. Não exigir serviço pago.
- **Superpowers / Code Review:** quando disponíveis, ajudar com testes e revisão; não substituir prova visual ou homologação.
- **Storybook:** excelente para estados de componentes; **não está no package.json deste repositório** na verificação inicial. Não alegar que está instalado porque existe no CTRH.
- **Browser / Playwright / axe:** renderização e inspeção verdadeiras, incluindo comportamento responsivo, teclado e contraste. Não depender de TinyFish.

Não instalar pacotes/skills automaticamente só para cumprir um nome. Conservar licenças, verificar dependências e executar o pipeline existente antes de sugerir mudanças.

### 4. Prova antes de chamar “pronto”
1. Testar o fluxo real, navegação até registros e retorno ao estado anterior.
2. Executar lint, testes unitários/domínio, build; Firestore/Playwright quando aplicáveis.
3. Inspecionar imagens reais: ~390px, 1440px, 1920px e grande viewport/4K conforme contexto; claro e escuro; estado vazio, preenchido e erro quando existem.
4. Verificar foco visível, rótulos acessíveis, contraste, zoom, tooltip, overflow, largura útil e arte sem cortes.
5. Comparar antes/depois no mesmo viewport, zoom, dados e tema. Reportar SHA e URL do preview; diferenciar DEV/Preview/Production.
6. Classificar falhas: regressão real / teste desatualizado / ambiente / intermitência; atualizar snapshots apenas para composição deliberada e validada.
7. Pedir homologação artística humana antes do merge/deploy, quando a implementação visual impactar o produto.

## Critérios de qualidade

- **Identidade:** reconhecível como GOP Clima.
- **Inteligência:** uma resposta útil e ação contextual antes de grandes tabelas.
- **Economia:** menos leitura e retrabalho do usuário.
- **Acessibilidade:** teclado, contraste, foco e reflow.
- **Robustez:** dados ausentes explicitados; não inventar execução financeira.
- **Alto acabamento:** testes visuais reais, sem afirmar qualidade com base apenas no código.

## Proibições e limites

Não portar as cores, a marca ou o design do CTRH; não usar screenshots de protótipos como evidência do site; não misturar estados reais com demonstrações; não fazer redesign de telas fora do escopo; não criar burocracia ou bloqueios administrativos novos; não fazer merge ou publicar em produção sem autorização.
