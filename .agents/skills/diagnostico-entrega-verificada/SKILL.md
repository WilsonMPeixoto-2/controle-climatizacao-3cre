---
name: diagnostico-entrega-verificada
description: Use when diagnosing failed deployments, broken websites, downloads, remote persistence, npm ci conflicts, GitHub/Vercel/Firebase/Supabase errors, protected previews or whenever a fix requires end-to-end proof.
---

# Diagnóstico e entrega comprovada (reutilizável)

**Objetivo:** resolver a falha real no projeto original e demonstrar que o fluxo funciona. Esta skill complementa, nunca substitui, as regras e decisões de `AGENTS.md` e os documentos canônicos do repositório.

## Sequência operacional
1. **Identidade:** confirmar owner/repo, branch, HEAD SHA, equipe/projeto Vercel (IDs), ambiente, domínio, banco e projeto de backend. Não assumir que projetos Vercel ligados ao mesmo GitHub são equivalentes.
2. **Reprodução:** registrar sintoma, passos, horário, URL, primeira falha e consequências. Reproduzir preferencialmente com dados sintéticos e escopo controlado.
3. **Evidência bruta:** obter deployment exato e logs completos; diferenciar aviso de erro fatal. Correlacionar Git diff, CI, configurações e lockfile. Comparar com execução `READY` realmente equivalente.
4. **Múltiplas vias autorizadas:** API/conectores, CLI com escopo explícito, navegador autenticado, Chrome DevTools (Network, Console, Performance e Memory), observabilidade, testes e banco. Se uma via retornar 403, explorar alternativa oficial **sem burlar proteção**; não repetir uma chamada bloqueada como única estratégia.
5. **Teste discriminador:** distinguir falha de infraestrutura/provisionamento, build/dependências, autenticação/proteção, aplicação, download ou persistência. Marcar causa como **comprovada**, hipótese ou ainda não verificada.
6. **Correção mínima:** preservar projeto original, dados e histórico; planejar rollback. Não criar outro projeto para contornar defeito. Desvincular recursos legados apenas após confirmar ausência de dependências, sem excluir o serviço.
7. **Prova:** executar gates do repositório, verificar commit/ID do deployment/ambiente, domínio efetivamente apontado, navegador, chamadas de rede, fluxo principal e estado persistido. Status `READY`, HTTP 200, gráfico ou progresso visual não provam operação íntegra.
8. **Entrega:** fornecer links, IDs, SHA, testes executados e resultados, estado final e riscos residuais. Distinguir explicitamente `corrigido e comprovado`, `parcial`, `bloqueado` e `não verificado`.

## Diagnósticos-chave
- **Vercel:** se até uma página mínima falha em menos de 1s com `Resource provisioning failed`, examinar Storage/Marketplace e integrações suspensas do *projeto consumidor* antes de alterar código. Validar staged, produção e aliases; `git.deploymentEnabled: false` pode ser política intencional de economia de quota.
- **npm:** `npm ci` executa resolução de peers (`ERESOLVE`) e valida `package-lock.json` versus `package.json` (`EUSAGE`). Não mascarar com `--force` ou `--legacy-peer-deps`; atualizar lockfile pelo gerenciador correto e provar CI.
- **Preview protegido:** usar `vercel curl` autenticado ou Trusted Sources/OIDC temporário quando autorizado. Não desativar Deployment Protection; 403 de plataforma, 403 de API administrativa e 403 de regra de banco não são o mesmo erro.
- **Navegador/PDF:** inspecionar console, rede, worker, traces e memória; confirmar Blob/arquivo íntegro, número de páginas, download real e leitura posterior. Uma barra completa não é prova de arquivo disponível.
- **Bancos:** testar escrita remota sintética, nova leitura em outra sessão, concorrência/revisões quando aplicável, cálculos e reconciliação; distinguir emulador de produção. Não escrever dados institucionais reais para testar.

## Uso de delegação
Especialistas podem investigar em paralelo infraestrutura, código, navegação e dados. A orquestração deve reconciliar evidências e entregar **uma** correção no projeto aprovado. Nenhum agente pode criar produção alternativa.

## Segurança e escopo
Nunca expor segredos, tokens, dados pessoais, dados institucionais ou bypass persistente. Mutação destrutiva exige autorização adequada. Não declarar execução de ferramentas às quais não houve acesso. Respeitar regras superiores de homologação e governança locais.

**Formato de encerramento:** projeto/ambiente | primeira falha comprovada | causa | alteração/commit | testes reais | deployment/alias | pendências.
