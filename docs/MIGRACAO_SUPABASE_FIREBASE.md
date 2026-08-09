# Registro da Migração Supabase -> Firebase

## Situação

- **Branch:** `feat/firebase-spark-migration`
- **Base original:** `d88b8a18effc152fed39537bb1d7f29394d3e6b2`
- **Produção permanece:** `master`
- **Destino de persistência:** Cloud Firestore, plano Spark
- **Hospedagem:** Vercel
- **Autenticação individual:** não integra o escopo; decisão histórica preservada
- **Firebase Storage/anexos:** adiado para fase futura

## Princípios

1. Atualizar dependências antes da troca de persistência.
2. Não misturar upgrades de pacotes com mudanças de banco no mesmo passo de diagnóstico.
3. Manter a `master` intacta até a validação final.
4. Preservar comportamento e regras de domínio antes de modernizar estrutura de UI.
5. Introduzir uma fronteira neutra de persistência antes do cutover.
6. Usar Emulator Suite e testes de Rules antes de acessar o Firestore real.
7. Não remover o legado Supabase antes da homologação do Firestore.

## Linha do tempo

### 2026-08-09 — abertura da migração

- Confirmado `master` em `d88b8a18effc152fed39537bb1d7f29394d3e6b2`.
- Criada branch `feat/firebase-spark-migration`.
- Criado plano detalhado em `docs/superpowers/plans/2026-08-09-firebase-spark-migration.md`.
- Criado workflow CI para baseline em Node 24.
- Baseline de qualidade: instalação limpa, lint, testes unitários/domínio e build aprovados.
- Playwright permanece com falhas a classificar separadamente; histórico do projeto já documentava 9 cenários aprovados e 4 falhas E2E preexistentes antes desta migração.
- Preview Vercel inicial da branch encontrou falha de provisionamento da plataforma antes do build da aplicação, não classificada como regressão de código.
- PR #13 (`feat/tier3-actions`) encerrado sem merge por estar supersedido pela evolução posterior da `master`.
- Confirmada existência de código/UI de anexos, mas ausência de `anexos_chamado` e metadados equivalentes no snapshot local versionado pesquisado. Função classificada como capacidade adiada, sem Firebase Storage nesta fase.
- Confirmada decisão documental histórica de operar sem login/autenticação individual; plano Firebase ajustado para não introduzir Auth silenciosamente.
- Criada coleta automatizada de `npm outdated`, `npm audit` e baseline E2E antes dos upgrades.

## Mapa de substituição

| Supabase atual | Destino |
|---|---|
| tabela `escolas` | coleção `escolas` |
| tabela `chamados` | coleção `chamados` |
| tabela `historico` | coleção `historico` |
| tabela `modelos_email` | coleção `modelos_email` |
| RPC create/save ticket | Firestore Transaction / Write Batch |
| sequence/trigger de ID | `contadores/chamados-{AAAA}` + Transaction |
| Supabase Realtime | `onSnapshot` |
| RLS | Firestore Security Rules |
| migrations/índices SQL | Rules + `firestore.indexes.json` + scripts versionados |
| Supabase Storage | fora desta fase |

## Critérios para cutover

O Supabase somente deixa de ser dependência ativa quando todos os itens abaixo forem verdadeiros:

- Firestore adapter implementado e coberto por testes;
- Rules testadas no Emulator;
- criação e atualização de chamados atômicas;
- IDs concorrentes testados;
- realtime Firestore validado;
- seed validado por contagem e amostragem;
- fallback local coerente;
- lint/test/build aprovados;
- E2E sem regressões em relação ao baseline consolidado;
- preview Vercel aprovado;
- documentação conciliada.

## Rollback

Até o merge final:

- `master` é a referência de produção e não recebe a migração incompleta;
- a pasta `supabase/` e seus artefatos históricos são preservados;
- a remoção de SDK/CLI/variáveis Supabase ocorre apenas no cutover;
- qualquer regressão não isolável implica retorno ao último commit verde da branch, e não correção improvisada diretamente em produção.
