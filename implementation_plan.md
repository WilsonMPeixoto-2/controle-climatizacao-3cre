# Implementation Plan Final — Controle de Climatização GOP/3ª CRE

## Diretriz central

Este plano substitui os planos anteriores e estabelece a sequência oficial de trabalho para as próximas fases do projeto `controle-climatizacao-3cre`.

A prioridade é consolidar o estado real do projeto, estabilizar o banco e evoluir o sistema com segurança, sem retrabalho e sem ampliar indevidamente o escopo.

---

# 0. Decisão definitiva: não haverá login/autenticação

A decisão sobre autenticação está encerrada.

O projeto NÃO terá:

* login;
* tela de acesso;
* Supabase Auth;
* SSO;
* perfis de usuário;
* papéis por usuário;
* controle individualizado de permissões;
* fluxo de cadastro de usuário;
* autenticação institucional.

Não tratar login/autenticação como pendência, fase futura obrigatória ou recomendação recorrente.

Quando houver discussão sobre RLS, policies ou permissões, ela deve ser entendida exclusivamente como configuração técnica de banco para uma aplicação pública/anônima, e não como autenticação.

A formulação correta é:

> operação pública/anônima controlada por regras de banco e RPCs, sem login.

---

# 1. Veto absoluto de execução automática

Nenhuma ação destrutiva ou alteração física deve ser executada sem aprovação manual no chat.

Não executar automaticamente:

* commits;
* push;
* criação de PR;
* alterações em produção;
* migrations SQL;
* alteração de RLS;
* criação/alteração de policies;
* alteração em Storage;
* alteração de schema;
* refatoração;
* redesign da Home;
* exclusões;
* scripts de importação;
* qualquer operação irreversível.

Toda mudança deve ser preparada, explicada e aprovada antes da execução.

---

# 2. Princípio de fonte de verdade

Relatórios de IA não são fonte definitiva de verdade. Eles são hipóteses de investigação.

A fonte de verdade do projeto será composta por evidências verificáveis:

1. código no GitHub, em commit identificado;
2. banco real no Supabase;
3. deploy real na Vercel;
4. testes automatizados;
5. documentação versionada;
6. logs e outputs salvos.

Nenhum item deve ser chamado simplesmente de “implementado”.

Usar sempre qualificadores:

* implementado no código;
* usado pelo app;
* aplicado no Supabase real;
* publicado na Vercel;
* coberto por teste;
* apenas documentado;
* existente em migration local;
* parcialmente implementado;
* contraditório;
* pendente real;
* fora de escopo.

---

# 3. Rodada 1 — Auditoria factual e documentação

## Objetivo

Produzir uma matriz confiável do estado real do projeto, antes de qualquer implementação.

## Entregáveis obrigatórios

Criar ou confirmar no repositório:

```text
implementation_plan.md
docs/auditorias/estado-real-projeto-2026-06.md
docs/auditorias/evidencias/
```

## A auditoria deve conter

* branch analisada;
* commit SHA;
* `git status`;
* arquivos modificados;
* diff dos arquivos alterados;
* deploy Vercel analisado;
* estado real do Supabase;
* migrations existentes no repositório;
* migrations aplicadas no banco remoto;
* tabelas reais;
* colunas reais;
* índices reais;
* constraints reais;
* triggers reais;
* funções/RPCs reais;
* RLS real por tabela;
* policies reais;
* grants relevantes;
* buckets e policies de Storage;
* fluxos do frontend que usam `select`, `insert`, `update`, `delete`, `rpc` e Storage.

## Matriz obrigatória

Usar o seguinte modelo:

```text
| Item | Código | Uso no app | Supabase real | Produção Vercel | Testes | Status final | Evidência |
|---|---|---|---|---|---|---|---|
```

## Itens mínimos a auditar

### Melhorias visuais M-01 a M-14

Verificar item por item:

* urgência por cor/texto;
* ordem única de prioridade;
* separação inércia x antiguidade;
* agrupamento de cards repetidos;
* normalização de setores;
* remoção de rolagem interna;
* cards mobile;
* layout mobile de Comunicações;
* cabeçalho mobile;
* fonte normal em e-mails;
* legenda textual além de cor;
* contraste;
* tokens;
* tema persistente.

### Banco e Supabase

Verificar:

* RLS real;
* policies reais;
* migrations pendentes;
* migration aplicada e ausente no repositório;
* funções/RPCs;
* triggers;
* constraints;
* índices;
* Storage;
* históricos órfãos;
* anexos órfãos;
* chamados sem histórico;
* status fora do catálogo;
* setores fora do catálogo;
* datas nulas ou incoerentes.

### Fluxos reais do app

Verificar:

* criação de chamado;
* edição de chamado;
* geração de histórico;
* rollback;
* comentário manual;
* upload de anexo;
* exclusão de anexo;
* geração de minuta;
* consulta por escola;
* exportação CSV;
* alternância de tema;
* modo local;
* conexão Supabase.

### Arquitetura

Verificar:

* tamanho e responsabilidades do `App.jsx`;
* existência ou ausência de `src/services`;
* existência ou ausência de `src/domain`;
* uso direto de Supabase no React;
* uso de RPCs;
* uso de localStorage/sessionStorage;
* hooks existentes;
* componentes já extraídos.

## Critério de conclusão da Rodada 1

A Rodada 1 só estará concluída quando os arquivos estiverem versionados ou disponibilizados para revisão, com logs reais de:

```bash
npm test
npm run test:e2e
npm run build
```

Não avançar para banco/RLS/migrations sem essa entrega revisável.

---

# 4. Rodada 2 — Estabilização e reconciliação documental

## Objetivo

Consolidar o estado atual antes de alterações reais de banco ou visual.

## Ações

1. Confirmar se `implementation_plan.md` e `estado-real-projeto-2026-06.md` estão no repositório ou em branch revisável.
2. Confirmar commit SHA e branch.
3. Revisar working tree.
4. Separar alterações locais em commit limpo, se já validadas.
5. Confirmar outputs de teste/build.
6. Confirmar se o deploy Vercel corresponde ao commit analisado.

## Migration fantasma

Se a migration `20260606223400_security_hardening` estiver registrada no Supabase, mas ausente no repositório, criar arquivo de reconciliação:

```text
supabase/migrations/20260606223400_security_hardening.sql
```

O arquivo deve conter apenas comentário explicativo, sem DDL executável.

Modelo:

```sql
-- Migration registrada no Supabase em produção como 20260606223400_security_hardening.
-- O conteúdo original aplicado em produção não está presente no repositório atual.
-- Este arquivo foi criado apenas para reconciliar o histórico local do Supabase CLI
-- com a tabela de migrations do banco remoto.
-- Não contém DDL intencionalmente.
-- Antes de recriar/alterar policies/RLS, consultar o estado real do banco.
```

## Proibição nesta rodada

Não aplicar RLS.
Não aplicar policies.
Não aplicar migrations reais.
Não alterar Home v2.
Não alterar layouts ou CSS.
Não refatorar.

---

# 5. Rodada 3 — Transações, RPCs e eliminação de DELETE perigoso no frontend

## Objetivo

Eliminar a necessidade de DELETE público ou rollback manual pelo frontend antes de discutir RLS.

## Problema

O frontend pode depender de `.delete()` para rollback em caso de falha na criação do histórico, além de fluxos de exclusão de anexos.

Não criar policy pública ampla de DELETE para `anon`.

## Decisão

Não aprovar:

```sql
FOR DELETE TO anon USING (true)
```

em tabelas operacionais.

## Ações

1. Criar ou revisar RPC transacional para criação de chamado:

```text
create_ticket_with_history
```

2. A RPC deve:

   * gerar ou receber o identificador do chamado;
   * inserir chamado;
   * inserir histórico inicial;
   * falhar de forma atômica;
   * retornar o chamado salvo;
   * evitar rollback via frontend.

3. Atualizar o frontend para chamar a RPC na criação.

4. Revisar exclusão de anexos:

   * avaliar soft delete;
   * avaliar RPC controlada;
   * evitar DELETE direto amplo;
   * registrar exclusão no histórico.

5. Garantir que edição continue usando fluxo transacional com histórico.

## Critério de pronto

* criação de chamado não depende de DELETE no frontend;
* histórico inicial é criado atomicamente;
* falha não deixa chamado órfão;
* testes passam;
* fluxo documentado.

---

# 6. Rodada 4 — RLS e policies para operação pública/anônima

## Objetivo

Se aprovado, reativar RLS de modo compatível com app sem login, sem criar falsa segurança e sem quebrar fluxos.

## Diretriz

Não chamar esta frente de autenticação.

Não propor login.

Não propor Supabase Auth.

Não propor SSO.

## Modelo preferencial

* leitura pública controlada;
* escrita preferencialmente via RPCs;
* evitar direct DELETE por `anon`;
* policies mínimas compatíveis com o app;
* uso de funções transacionais para operações sensíveis.

## Antes de aplicar

Responder:

1. Quais tabelas precisam de SELECT público?
2. Quais tabelas precisam de INSERT direto?
3. Quais tabelas precisam de UPDATE direto?
4. Quais operações podem ir para RPC?
5. DELETE direto é realmente necessário?
6. Storage precisa de insert/update/delete público?
7. Há alternativa de soft delete?
8. Quais grants atuais existem?
9. Quais policies antigas devem ser removidas?

## Saída

PR exclusivo:

```text
PR Banco/RLS/Policies
```

Sem Home v2, sem layout, sem refatoração.

---

# 7. Rodada 5 — Migrations pendentes e integridade referencial

## Objetivo

Aplicar migrations reais somente após auditoria, backup e revisão.

## Migrations citadas a revisar

```text
20260607043000_storage_anon_policies.sql
20260607044500_alter_fk_cascade.sql
20260607190000_fix_historico_orfaos_diagnostic.sql
```

## Antes de aplicar

1. Confirmar se existem no repositório.
2. Confirmar se já foram aplicadas parcialmente.
3. Verificar impacto em dados existentes.
4. Verificar risco do `ON DELETE CASCADE`.
5. Confirmar backup.
6. Preparar plano de rollback.

## Atenção ao cascade

Não aplicar `ON DELETE CASCADE` sem decisão explícita sobre preservação histórica.

Se o histórico tiver valor administrativo, avaliar se o melhor é impedir DELETE de chamado, e não apagar histórico junto.

---

# 8. Rodada 6 — Domínio único e saneamento de dados

## Objetivo

Unificar status, setores, prioridades, aptidão e flags.

## Criar ou consolidar

```text
src/domain/statuses.js
src/domain/sectors.js
src/domain/priorities.js
src/domain/aptidao.js
src/domain/validationCatalogs.js
```

## Cada catálogo deve conter

* valor canônico;
* aliases;
* rótulo de exibição;
* descrição;
* normalização;
* uso em UI;
* uso em validação;
* uso em testes.

## Diagnóstico no Supabase

Listar valores distintos e contagens de:

```text
status_atual
setor_responsavel
prioridade
resultado_aptidao
informacao_validada
comunicacao_cto
tipo_aparelho
```

## Depois

1. propor mapping;
2. sanear dados;
3. aplicar constraints somente depois do saneamento.

---

# 9. Rodada 7 — Histórico, anexos e governança documental

## Objetivo

Consolidar a linha do tempo como fonte operacional confiável.

## Ações

1. Padronizar evento de criação.
2. Padronizar evento de edição.
3. Padronizar comentário manual.
4. Padronizar upload de anexo.
5. Padronizar exclusão de anexo.
6. Definir tipos de anexo:

   * foto;
   * laudo;
   * vistoria;
   * orçamento;
   * autorização;
   * outro.
7. Criar diagnóstico de anexos órfãos.
8. Documentar regra de tamanho e tipo.
9. Garantir que anexos relevantes apareçam no dossiê da escola.

## Regra de campos

* `modificado_em`: timestamp técnico da última alteração;
* `historico.data`: data do evento;
* `ultima_movimentacao`: resumo humano ou campo derivado, não data principal.

---

# 10. Rodada 8 — Busca, filtros e índices

## Objetivo

Melhorar busca sem tempo gasto à toa.

## Ações

1. Melhorar busca em Comunicações.
2. Evitar select longo.
3. Manter busca local onde o volume for pequeno.
4. Usar `unaccent` e `pg_trgm` apenas em busca feita no banco.
5. Criar índices compostos apenas se as consultas reais justificarem.

## Índices candidatos

```sql
chamados(status_atual, modificado_em)
chamados(setor_responsavel, modificado_em)
chamados(designacao, modificado_em)
chamados(prioridade, modificado_em)
historico(id_chamado, data desc)
anexos_chamado(id_chamado, criado_em desc)
```

## Não fazer agora

* busca vetorial;
* embeddings;
* RAG;
* IA semântica.

---

# 11. Rodada 9 — Observabilidade e diagnóstico operacional

## Objetivo

Fazer o próprio sistema apontar problemas da base.

## Implementar

* diagnóstico de chamados sem escola;
* diagnóstico de histórico órfão;
* diagnóstico de anexo órfão;
* diagnóstico de chamado sem histórico;
* status fora do catálogo;
* setor fora do catálogo;
* datas nulas;
* datas incoerentes;
* tela administrativa somente leitura de saúde da base.

---

# 12. Rodada 10 — UX e Home v2

## Objetivo

Melhorar a experiência visual e operacional sem misturar com banco.

## Condição

Executar apenas após estabilização e banco encaminhado.

## Home v2

Se aprovado:

* mapa operacional grande à esquerda;
* KPIs verticais à direita;
* resumo operacional reposicionado;
* donut e lista na base;
* legenda integrada;
* paleta cartográfica refinada;
* responsividade.

## Importante

PR visual separado.

Não alterar RLS.

Não aplicar migrations.

Não refatorar arquitetura junto.

---

# 13. Rodada 11 — Camada de services

## Objetivo

Remover chamadas Supabase espalhadas pelo React.

## Criar gradualmente

```text
src/services/chamadosService.js
src/services/escolasService.js
src/services/historicoService.js
src/services/anexosService.js
src/services/modelosEmailService.js
src/services/diagnosticoService.js
src/services/storageService.js
```

## Regra

Extrair sem mudar comportamento.

---

# 14. Rodada 12 — Modularização progressiva do frontend

## Objetivo

Reduzir o tamanho e o risco do `App.jsx`.

## Extrair gradualmente

```text
src/pages/DashboardPage.jsx
src/pages/TicketsListPage.jsx
src/pages/SchoolLookupPage.jsx
src/pages/TicketFormPage.jsx
src/pages/CommunicationsPage.jsx
src/pages/AdminDataPage.jsx

src/components/TicketDetailsModal.jsx
src/components/ActionQueue.jsx
src/components/KpiRail.jsx
src/components/DashboardDonut.jsx
src/components/SchoolDossier.jsx

src/hooks/useTickets.js
src/hooks/useSupabaseData.js
src/hooks/useToast.js
src/hooks/useTheme.js
src/hooks/useAttachments.js
```

Cada extração deve ter teste e build.

---

# 15. Rodada 13 — Testes E2E ampliados

## Fluxos mínimos

1. abrir painel;
2. alternar tema;
3. carregar base online;
4. filtrar chamados;
5. expandir detalhes;
6. abrir ficha;
7. editar chamado;
8. cadastrar chamado;
9. impedir cadastro sem escola;
10. consultar escola;
11. gerar minuta;
12. copiar e-mail;
13. anexar arquivo;
14. excluir anexo;
15. exportar CSV;
16. testar mobile;
17. testar modo local bloqueado.

---

# 16. Rodada 14 — Scripts e reprodutibilidade

## Criar

```text
scripts/import/parse_lists_data.py
scripts/import/README.md
scripts/import/examples/
scripts/check-data-integrity.mjs
scripts/export-supabase-snapshot.mjs
```

## Requisitos

* dry-run;
* validação de campos obrigatórios;
* detecção de duplicidades;
* relatório de divergências;
* comparação `db.json` versus Supabase;
* exportação de snapshot.

---

# 17. Rodada 15 — Snapshots e tendências

## Objetivo

Responder se o passivo está melhorando ou piorando.

## Primeiro manual

Criar snapshots de:

* ativos;
* +7 dias;
* +15 dias;
* +30 dias;
* +60 dias;
* por setor;
* por bairro;
* por prioridade.

## Depois avaliar `pg_cron`

Só usar `pg_cron` depois de validar manualmente a estrutura de snapshot.

---

# 18. Rodada 16 — Edge Functions

## Usar apenas se houver integração concreta

Casos válidos:

* Microsoft Forms;
* envio real de e-mail;
* geração server-side de PDF;
* webhook;
* validação server-side de anexos;
* relatório automático.

Não usar por sofisticação técnica.

---

# 19. Rodada 17 — Alertas e relatórios executivos

## Alertas

* alerta interno no painel;
* alerta +15 dias;
* relatório semanal manual;
* e-mail automático futuro;
* chamado sem histórico;
* anexo pendente.

## Relatórios

* por escola;
* por bairro;
* por período;
* chamados parados;
* pendências por setor;
* anexos;
* ficha executiva PDF.

---

# 20. Rodada 18 — IA, vetores e busca semântica

## Backlog distante

Só considerar futuramente para:

* busca semântica em histórico;
* agrupamento de chamados parecidos;
* sugestão automática de prioridade;
* resumo automático de escola;
* detecção de padrões recorrentes.

Não implementar agora.

---

# Ordem de execução resumida

1. Auditoria factual e arquivos versionados.
2. Estabilização do estado atual.
3. Reconciliação documental da migration fantasma.
4. RPC transacional para criação de chamado.
5. Eliminar DELETE perigoso do frontend.
6. RLS/policies públicas-anônimas, se ainda fizer sentido.
7. Migrations reais e integridade referencial.
8. Domínio e saneamento de dados.
9. Histórico/anexos.
10. Busca/filtros.
11. Diagnóstico operacional.
12. Home v2.
13. Services.
14. Modularização.
15. E2E ampliado.
16. Scripts.
17. Snapshots/pg_cron.
18. Edge Functions.
19. Alertas/relatórios.
20. IA/vetores.

---

# Critério de aprovação por PR

Cada PR deve informar:

1. problema resolvido;
2. evidência de que o problema existia;
3. arquivos alterados;
4. se altera banco;
5. se altera produção;
6. quais testes foram rodados;
7. risco;
8. plano de rollback;
9. o que ficou fora.

---

# Decisão imediata sobre os pontos atuais

## DELETE público para anon

Não aprovado.

Não criar policy pública ampla de DELETE para `anon`.

Se o RLS exigir DELETE público para manter rollback do frontend, o RLS deve ser postergado até a criação de RPC transacional.

## Migration fantasma

Aprovado criar arquivo documental de reconciliação, sem SQL executável, desde que conste explicação clara no arquivo.

## Login/autenticação

Fora de escopo definitivamente.

Não propor novamente.

---

# Encerramento

Este plano deve orientar as próximas fases do projeto.

A execução deve começar pela auditoria factual e estabilização documental.

Nenhuma alteração de banco, RLS, migration real ou Home v2 deve ser executada antes da aprovação manual após revisão da auditoria.
