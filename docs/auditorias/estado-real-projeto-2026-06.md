# Relatório de Auditoria Factual de Estado Real — Junho de 2026
### Projeto: Controle de Climatização (GOP / 3ª CRE)

Este documento atende à **Fase -1 (Auditoria Factual de Estado Real)** do Plano Diretor Final. Todas as informações contidas aqui foram verificadas diretamente no repositório local, no banco de dados ativo do Supabase via consultas SQL e no deploy de produção da Vercel.

---

## 1. Dados Estruturais da Release e Ambiente

1.  **Branch Atual:** `fix/logic-v2-dossier-match`
2.  **Commit SHA Analisado:** `9e11f59455f8a5d92a131a6cfdd3e53887876906`
3.  **Git Status:** Alterações locais não commitadas no repositório de trabalho:
    *   `src/App.jsx` (UUIDs na geração de IDs de histórico, match de escola via `matchesSchool` no dossiê, setores adicionais no form e desativação do botão de sincronização local-to-cloud).
    *   `supabase/schema.sql` (Ajuste no diagnóstico para desconsiderar eventos que possuam designação, evitando falso alerta de histórico órfão).
4.  **Arquivos Modificados:** `src/App.jsx` e `supabase/schema.sql`.
5.  **Deploy Atual da Vercel:** `https://controle-climatizacao-3cre.vercel.app/`
6.  **Versão Local vs Produção:** A produção executa o bundle `/assets/index-HLk0Rw7s.js` e CSS `/assets/index-sCrFgtEO.css` gerado no build anterior. O código local possui correções de match de dossiê e UUIDs que ainda não foram comitados e publicados.
7.  **Migrations no Repositório (14 arquivos):** De `20260602000000_schema_rls_and_policies.sql` até `20260607190000_fix_historico_orfaos_diagnostic.sql`.
8.  **Migrations Aplicadas no Supabase (11 registradas):** As migrações locais `20260607043000`, `20260607044500` e `20260607190000` não estão aplicadas. A migração remota `20260606223400` está registrada na tabela de controle remoto, mas **não existe localmente**.
9.  **Tabelas Reais:** 6 tabelas no esquema `public` do banco vivo: `escolas` (134 linhas), `chamados` (30 linhas), `historico` (70 linhas), `modelos_email` (8 linhas), `anexos_chamado` (2 linhas) e `implementacoes_futuras`.
10. **Colunas Reais (Tabela `chamados`):** `id_chamado` (text), `unidade_escolar` (text), `designacao` (text), `data_solicitacao` (timestamptz), `local_demanda` (text), `tipo_demanda` (text), `status_atual` (text), `setor_responsavel` (text), `proxima_providencia` (text), `ultima_movimentacao` (text), `informacao_validada` (text), `prioridade` (text), `comunicacao_cto` (text), `observacoes` (text), `resultado_aptidao` (text), `criado_em` (timestamptz), `modificado_em` (timestamptz), `tipo_aparelho` (text), `btu_existente` (text), `btu_pretendido` (text).
11. **Índices Reais:** Índices ativos na chave primária das tabelas `escolas` (designacao), `chamados` (id_chamado), `historico` (id_evento), `modelos_email` (id) e `anexos_chamado` (id). Existem índices simples nas colunas estrangeiras e em `chamados.status_atual`.
12. **Constraints Reais:** Relações de chave estrangeira com deleção em cascata (`ON DELETE CASCADE`) ativas em `anexos_chamado` e `historico` apontando para `chamados(id_chamado)`.
13. **Triggers Reais:** 1 trigger ativo: `trg_generate_id_chamado` (INSERT em `chamados` executando a RPC `generate_next_id_chamado()`). **O trigger de moddatetime está ausente em produção.**
14. **Funções/RPCs Reais:** 3 funções customizadas ativas no schema `public`: `diagnostico_operacional()`, `generate_next_id_chamado()` e `save_ticket_with_history(p_ticket jsonb, p_events jsonb[])` (todas configuradas como `SECURITY DEFINER`).
15. **RLS Real por Tabela:** **Desativado (`rowsecurity = false`) em todas as 6 tabelas.**
16. **Policies Reais:** **Zero** políticas ativas no esquema `public`.
17. **Grants Relevantes:** Permissões padrão abertas para a role `anon`.
18. **Buckets do Storage:** 1 bucket operacional: `gop-anexos`.
19. **Policies do Storage:** 3 políticas ativas em `storage.objects` para a pasta `chamados/` (leitura pública, inserção anônima e exclusão física).
20. **Fluxos Reais do App.jsx:** Edição de chamados utiliza a RPC transacional; criação de chamado utiliza comandos de insert brutas com lógica de rollback compensatório de deleção no front; anexos salvam arquivo no storage e depois inserem metadados no banco, deletando o arquivo físico se a gravação de metadados falhar.

---

## 2. Matriz de Evidências por Camada

| Item | Código | Uso no app | Supabase real | Produção Vercel | Testes | Status final | Evidência |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** (Severidade urgência) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `logic.js:157` / `App.jsx:1069` |
| **M-02** (Ordem única prioridade) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `logic.js:122` / `operationalIntelligence.js:33` |
| **M-03** (Famílias de KPIs) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `App.jsx:2203-2325` |
| **M-04** (Agrupamento stuck cards) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `operationalIntelligence.js:65` |
| **M-05** (Normalização de setores) | Sim | Sim | Não | Sim | Sim | `parcialmente implementado` | `logic.js:189` (Normalizado no front; dados do banco não saneados) |
| **M-06** (Cards sem scroll interno) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:804` |
| **M-07** (Cards mobile) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:3504` |
| **M-08** (Comunicações mobile) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:3650` |
| **M-09** (Cabeçalho mobile compacto) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:3420` |
| **M-10** (Fonte normal em Composer) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `App.jsx` renderização / `index.css` |
| **M-11** (Legenda de cores textuais) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `App.jsx:2188` |
| **M-12** (Contraste WCAG AA) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:35` |
| **M-13** (Tokens CSS) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `index.css:6-105` |
| **M-14** (Tema persistente) | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `App.jsx:299` |
| **RLS** (Segurança Banco) | Parcial | Sim | **Desativado** | N/A | Não | `divergente` | `pg_tables` rowsecurity |
| **Policies** (Esquema Public) | Sim | Sim | **Zero** | N/A | Não | `divergente` | `pg_policies` query |
| **Migrations pendentes** | Sim | N/A | Não | N/A | N/A | `existente em migration, mas não confirmado no banco` | `supabase migration list` (3 pendentes) |
| **Funções/RPCs** | Sim | Parcial | Sim | Sim | Sim | `parcialmente implementado` | `information_schema.routines` (RPC na edição; inserts soltos no cadastro) |
| **Triggers** | Sim | Sim | Parcial | Sim | Sim | `parcialmente implementado` | `information_schema.triggers` (Trigger de ID ativo; moddatetime ausente) |
| **Storage Buckets & Policies** | Sim | Sim | Sim | Sim | Sim | `aplicado no Supabase real` | `storage.buckets` / `pg_policies` storage |
| **Cadastro & Rollback** | Sim | Sim | Sim | Sim | Não | `implementado no código` | `App.jsx:1532` (Forte risco de quebra se RLS ativado sem DELETE público) |
| **Comentário Manual** | Sim | Sim | Sim | Sim | Sim | `implementado e usado pelo app` | `App.jsx:451` |
| **Minuta de E-mail** | Sim | Sim | Sim | Sim | Sim | `implementado e usado pelo app` | `App.jsx:91` / `logic.js:101` |
| **Dossiê Escolar** | Sim | Sim | Sim | Sim | Sim | `implementado e usado pelo app` | `App.jsx:4698` / `schoolDossier.js` |
| **Tema claro/escuro** | Sim | Sim | N/A | Sim | Sim | `implementado e usado pelo app` | `App.jsx:512` |
| **Services Layer** | Não | Não | N/A | N/A | N/A | `pendente real` | Ausência de arquivos em `src/services` |
| **Domain Catalogs** | Não | Não | N/A | N/A | N/A | `pendente real` | Ausência de arquivos em `src/domain` |

---

## 3. Diagnóstico e Conclusões da Fase -1
A suíte de testes do Playwright e Jest local está passando perfeitamente, garantindo que o comportamento lógico e visual do frontend está blindado localmente. No entanto, o banco de dados remoto opera sem RLS para evitar o bloqueio anônimo causado pela migração remota `20260606223400` (ausente localmente). Qualquer ativação do RLS exige a criação de políticas explícitas de `DELETE` devido ao fluxo de rollback compensatório por deletar chamado presente na interface atual.
