# Protocolo de qualidade visual e recursos disponíveis — GOP Clima

**Estado:** governança de desenvolvimento e QA; não é aprovação de nova arte nem autorização de publicação.  
**Referência:** `AGENTS.md` e `.agents/skills/gop-clima-visual-quality/SKILL.md`.  
**Origem metodológica:** experiência do projeto `WilsonMPeixoto-2/demandas-rhsme-expansao` (Fluxo CTRH), que possui uma skill coordenadora `impeccable-frontend-design`, várias skills especializadas, protocolo de evidência e Storybook. **Não pressupor que o pacote do CTRH esteja instalado globalmente nem presente no GOP Clima.**

## 1. O que o GOP Clima já possui, verificado neste repositório

| Recurso | Situação inicial | Utilização |
|---|---|---|
| React/Vite + design system | Presente; `src/index.css` e `src/styles/*.css` | Preservar identidade, tokens e componentes reais. |
| Outfit / Inter | Presentes no `package.json` | Tipografia atual; não instalar outra por padrão. |
| Lucide | Presente (`lucide-react`) | Iconografia coerente; testar pesos, tamanhos e estados. |
| Playwright | Presente (`@playwright/test`) | Navegação, desktop/mobile, regressão visual e capturas reais. |
| axe | Presente (`@axe-core/playwright`) | Auditoria automatizada de acessibilidade. |
| Rotinas `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` | Presentes; `npm run test:firestore` também existe | Verificação técnica objetiva. |
| Storybook | **Não listado** no `package.json` verificado | Pode ser considerado para isolamento de estados se houver ganho; **não instalar sem necessidade e revisão**. |
| Skill própria `gop-clima-visual-quality` | **Versionada na branch de trabalho** | Porta de entrada para os agentes, ligada ao `AGENTS.md`. |

## 2. Recursos de design recuperados do projeto CTRH

As entradas abaixo são **um inventário de origem**, não declarações de instalação neste repositório nem de conexão funcional neste chat:

| Recurso | Papel útil | Estado de origem/limite |
|---|---|---|
| `impeccable-frontend-design` | Coordenação de criação, crítica e evidência visual | Versionada em `demandas-rhsme-expansao/.agents/skills/impeccable-frontend-design/`, com referências próprias. A coordenação para GOP Clima é a skill local equivalente, adaptada. |
| `frontend-design` | Direção de arte não genérica, tipografia e composição | Existente no CTRH, com licença própria. Utilizar apenas se presente/instalada onde o Codex opera. |
| `ui-ux-pro-max` | Repertório pesquisável de UI/UX, padrões de interação, acessibilidade e gráficos | Existente no CTRH; seu buscador Python depende de arquivos locais daquela skill. Não executar caminhos do CTRH assumindo que existem aqui. |
| `impeccable` | Crítica detalhada, polimento, simplificação, sistema de design | Existente no CTRH; versão e executável devem ser verificados no ambiente ativo. |
| `web-design-guidelines` | Auditoria objetiva de interface e acessibilidade | Existente no CTRH; regras de origem Vercel, consultar atualização quando acessível. |
| `apple-inspired-web-design` | Refinamento e legibilidade inspirados nas Apple HIG | Adaptação local do CTRH, **não oficial Apple**; usar como inspiração qualitativa, sem transplantar estilos CTRH. |
| `cthr-sidebar-visual-quality` | Skill específica para sidebar do CTRH | **Não portar:** marca, arte e navegação são exclusivas do outro sistema. |
| Visual Quality privado v0.1.1 | Revisão visual/PR em contexto ChatGPT | Relatado como publicado na configuração do CTRH. **Não há ferramenta direta Visual Quality exposta nesta sessão**; verificar disponibilidade antes de uso. |
| Storybook do CTRH | Estados de componentes, inspeção isolada | Integração era no outro repositório, **não no GOP Clima**. |
| Superpowers e Code Review | Processo de desenvolvimento, revisão de PR e verificação | Ativação em sessões anteriores não prova que possam ser invocados aqui; verificar e usar quando disponíveis. |

O diretório `.agents/skills/` do CTRH contém as habilidades citadas. Para obter uma instalação completa no GOP Clima em uma tarefa futura, **revisar a árvore dos arquivos, scripts, licenças e dependências de cada skill** antes de portar uma versão inteira. Não copiar somente `SKILL.md` quando a execução exigir `scripts/` e `references/`.

## 3. Conectores disponíveis para explorar e avaliar (dependentes da sessão)

- **Figma:** revisão de composição, tokens, prototipação e design-to-code quando houver arquivo válido e acesso efetivo. Não presumir Figma como fonte da verdade sem uma arte aprovada.
- **Mobbin:** padrões e repertório visual quando o serviço efetivamente permitir consulta. Em teste anterior do CTRH houve bloqueio de conteúdo por requisito de plano; não depender de compra de acesso.
- **Adobe, Canva, MagicPath:** possíveis suportes para produção gráfica e variantes; escolher apenas se houver resultado verificável e vinculado à tarefa.
- **Browser em ChatGPT Work / navegador integrado do Codex:** inspecionar **a aplicação renderizada**, em vez de julgar CSS de memória. No chat comum a conexão Browser pode ser apenas leitura de abas; verificar modo e permissões.
- **GitHub e Vercel:** diff, preview, build, registros de teste e comparação de versões. Não confundir preview com produção.
- **TinyFish:** **não utilizar** nem recomendar recarga de créditos; outras ferramentas de navegador e Playwright são preferíveis.

Conector listado **não equivale a integração testada, permissão de edição concedida ou plugin instalado em Codex**.

## 4. Processo de qualidade, em cinco ações

**A. Diagnóstico visual** — identificar página, componente, uso principal, estado real dos dados e contexto do viewport. Examinar antes de editar; verificar navegação, dossiê, tema, CSS e fontes.

**B. Direção artística local** — conceber apenas o componente/fluxo necessário; priorizar economia de leitura, resultado contextual e ação útil. Usar identidade e marca GOP Clima; reprovação global do visual Gemini permanece.

**C. Implementação incremental** — código React e CSS do design system real, com pequenos commits. Evitar novos frameworks, pacotes e shells, e não obrigar o usuário a inserir dados que o site já possui.

**D. Prova técnica + visual** — executar CI e teste de interação; observar a renderização nos viewports adequados. Para mudanças relevantes, apresentar antes/depois capturado realmente com mesmo conjunto de dados, tema e zoom.

**E. Aceite** — identificar branch/SHA/URL de preview e quaisquer falhas, diferenciação de teste e produto. Homologação humana da composição visual é distinta do CI verde. Sem autorização, não mesclar nem publicar.

## 5. Matriz visual mínima para interfaces da Etapa 2

| Cenário | O que precisa funcionar e parecer correto |
|---|---|
| **Desktop 1440px** | Boa hierarquia e uso funcional da largura, sem tabelas artificialmente estreitas. |
| **Desktop 1920px / 32”** | Evitar vazios desproporcionais, aproveitamento inadequado do grid, títulos/logotipo cortados ou raster borrado. |
| **Grande viewport / 4K** | Conferir densidade, max-width adequado ao conteúdo e consistência de escala; resolução física ≠ pixels CSS. |
| **Mobile ~390px** | Sem perda de comandos, tooltip cortado ou formulários comprimidos; filtros e listas progressivos, acesso por toque/teclado. |
| **Tema escuro / claro** | Contraste, cores semânticas, superfícies, estados, focus ring e legibilidade. |
| **Estados vazios, completos, pendentes** | Não inventar valores para tornar o visual bonito; “Não informado” permanece distinto de zero. |
| **Acessibilidade** | Navegação teclado, rótulos reais, leitura de gráficos por alternativa textual, foco, contraste e `prefers-reduced-motion`. |

Dados financeiros e termos contratuais devem manter semântica: solicitação ≠ serviço executado ≠ medição informada ≠ NF ≠ liquidação ≠ pagamento. **Design bonito não autoriza juntar métricas incomparáveis**.

## 6. Classificação das falhas e uso correto dos snapshots

Todo erro em testes visuais deve ser classificado como: **(1) regressão real; (2) expectativa/baseline desatualizado por mudança aprovada; (3) diferença ambiental/fixture; (4) intermitência**.

Não ignorar o Playwright, nem atualizar automaticamente todas as capturas até ficar verde. Preservar testes de comportamento, revisar o requisito e a captura de evidência; só mudar um baseline quando a alteração visual intencional for rastreável e aceita.

A implementação deve avaliar **qualidade percebida**, não só CSS válido. Há um histórico concreto no CTRH de regressões que passaram por inúmeras rodadas mas deixaram tabelas curtas e áreas em branco em monitor de 32”; essa falha não pode se repetir.

## 7. Limites e decisões já aprovadas

- [DP-001](../decisoes/DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md): flexibilidade de gestão e ausência de travas administrativas artificiais.
- [DP-002](../decisoes/DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md): integrar visualmente a identidade atual, não recriar outra.
- [DP-003](../decisoes/DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md): inteligência visual com automação, menos leitura e drill-through para os registros.
- [Avaliação do Gemini](../referencias/gemini-prototipo-v1/AVALIACAO_VISUAL_10_CAPTURAS_MOBILE.md): conjunto visual reprovado; conceitos isolados podem ajudar, mas não são arte de referência.
- [PR #26](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/26): conferência por escola deve ser avaliada por evidência visual real; ainda está em rascunho.

**Resultado exigido:** experiência reconhecível como GOP Clima, profissional e moderna, que entregue o próximo passo com menos esforço e não apenas multiplique títulos, caixas e gráficos.
