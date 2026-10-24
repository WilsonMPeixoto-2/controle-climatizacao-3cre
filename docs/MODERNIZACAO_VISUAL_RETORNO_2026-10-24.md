# CLIMATIZAÇÃO | Polimento visual de retorno — 24/10/2026

## Objetivo
Melhorar o acabamento do sistema em funcionamento, sem reformulação de telas, fluxos, banco de dados ou identidade institucional. Esta entrega sucede a atualização de pacotes e as correções de navegação de KPIs e de mensagens sobre anexos.

## Escopo implementado
- **CSS incremental:** `src/styles/return-polish-2026.css`, importado ao final da cadeia em `src/main.jsx`. Não substitui os estilos anteriores.
- **Cabeçalho e navegação:** tipografia, ritmo, botões e foco.
- **KPIs:** alinhamentos, hierarquia dos números, ícones e resposta sutil a hover/foco. Os seis cartões mantêm suas funções de navegação e os alertas mantêm suas cores semânticas.
- **Resumo operacional:** cartões e chips com superfície e raio mais uniformes.
- **Listas:** leitura de cabeçalhos e linhas, campos de busca, filtros, abas, indicador selecionado e botão de retorno.
- **Formulários:** bordas, estados ativos/desabilitados, legibilidade e manutenção explícita das bordas de erro.
- **Responsividade:** espaços e controles para larguras menores, sem alterar a estrutura das páginas.
- **Temas claro/escuro:** preservar os valores semânticos existentes.
- **Impressão e redução de movimento:** respeitar as preferências e modos já implementados.

## Restrições de escopo respeitadas
Não foram alterados: biblioteca Leaflet, GeoJSON, cores e cálculos de risco, persistência Firestore, regras de autenticação, funcionalidades de anexos, cadastros, geração de chamados e funcionamento do Prontuário. Não se alteraram bibliotecas ou versões de dependências. Não há anúncios, banners novos, notas sobre plano gratuito nem elementos de marketing.

A branch antiga `feat/polimento-visual-retorno-2026` divergiu da `master` depois dos patches funcionais. A modernização foi **reaproveitada seletivamente** numa nova branch originada da versão atual `master`, sem importar os arquivos `App.jsx` obsoletos dessa branch.

## Verificação
- `npm ci`: concluído.
- `npm run build` (ESLint, testes existentes, build Vite): aprovado no commit inicial da camada (`c18d512`).
- Browser Chromium em execução local: acesso ao painel em **390×844**, **768×1024**, **1366×768** e **1920×1080**, seis cartões presentes, **sem overflow horizontal de documento**.
- Em todas as larguras, o clique no KPI "Chamados ativos" abriu a lista filtrada, e o botão "Voltar ao painel" funcionou.
- Alternância claro/escuro: aprovada, sem exceções JavaScript na página testada.
- Rota `?levantamento=312014` abriu o Prontuário com formulário de levantamento.
- Ajuste final de CSS reforça especificidade das bordas de erro; validação de compilação final deve integrar a homologação da versão de publicação.

## Estado da entrega
A mudança pode ser integrada à `master`, mas **não está publicada** até o deploy manual ser concluído e o alias `controle-climatizacao-3cre.vercel.app` apontar para a compilação nova em estado `READY`.

Política de releases: **um único deploy de produção** quando a modernização for liberada; nenhum build automático por commit (`git.deploymentEnabled=false`). Consulte `docs/POLITICA_DEPLOY_VERCEL.md`.

## Limitações conhecidas e próximos passos
Esta rodada não constitui redesenho completo, nem substitui uma avaliação visual exaustiva com usuários finais. O módulo de anexos permanece desativado e deverá ser tratado separadamente, com solução de armazenamento sem despesas não autorizadas.
