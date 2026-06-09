# Auditoria de Estado Real — Sprint -1
**Projeto:** Controle de Climatização — GOP / 3ª CRE  
**Data:** Junho de 2026  
**Tipo:** Leitura apenas. Nenhuma alteração de código ou banco foi feita.  
**Executado por:** Inspeção direta do repositório GitHub

---

## Legenda de Classificação Final

| Símbolo | Significado |
|---|---|
| ✅ | Implementado — com evidência direta no nível indicado |
| ⚠️ | Implementado parcialmente — existe mas com lacuna identificada |
| ❌ | Pendente real — não existe ou não está em uso |
| 📄 | Apenas documentação — existe como texto, não como código ou regra ativa |
| ⚡ | Contraditório — o código diz uma coisa, o banco real diz outra |
| 🚫 | Fora de escopo — decisão deliberada de não implementar |

## Níveis de Verificação (hierarquia usada neste documento)

| Nível | O que significa | Quem verificou |
|---|---|---|
| **Código** | Existe no repositório, em arquivo identificado | ✅ Verificado aqui |
| **Uso real** | O código é chamado pela aplicação, não apenas existe | ✅ Verificado aqui |
| **Banco** | Está aplicado no Supabase real, não apenas em migration | ⚠️ Depende de inspeção direta do Supabase — dados fornecidos pelo usuário |
| **Produção** | Aparece no site publicado na Vercel | ❌ Não verificado — requer acesso ao browser/deploy |
| **Teste** | Existe teste automatizado cobrindo o comportamento | ✅ Verificado via `npm test` |
| **Governança** | Documentado com regra operacional clara | ✅ Verificado aqui |

---

## 1. Referência do Commit Analisado

```
commit f1634a4
Branch: copilot/research-diagnosis-controle-climatizacao
Mensagem: docs: adiciona análise exportável das sugestões implementadas

Commit anterior (base funcional):
9744025 — fix: resolve business logic bugs and robustness gaps in ticket edit and school search
```

> **Nota:** O repositório está em shallow clone. O histórico completo de commits não está disponível para análise.

---

## 2. Deploy Vercel

**Não verificado diretamente.**

O que se sabe pelo repositório:
- `vite.config.js` está configurado para build SPA padrão.
- `.env.example` documenta as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`.
- O `CLAUDE.md` cita deploy automático em `controle-climatizacao-3cre.vercel.app` a cada push para `master`.
- A branch auditada é `copilot/research-diagnosis-controle-climatizacao`, **não** `master` — portanto, as mudanças aqui podem não estar publicadas na Vercel.

**Pendência:** Confirmar no painel da Vercel qual branch está em produção.

---

## 3. Supabase — Fatos Confirmados pelo Usuário

Os seguintes fatos foram fornecidos pelo usuário com base em inspeção direta do painel Supabase. Este documento os aceita como verdadeiros para esta auditoria.

| Item | Estado confirmado pelo usuário |
|---|---|
| Versão PostgreSQL | 17 |
| Região | sa-east-1 |
| Tabelas existentes | escolas, chamados, historico, modelos_email, anexos_chamado |
| Volume: escolas | 134 linhas |
| Volume: chamados | 30 linhas |
| Volume: historico | 70 linhas |
| Volume: modelos_email | 8 linhas |
| Volume: anexos_chamado | 2 linhas |
| **RLS nas 5 tabelas** | **DESABILITADO** |
| Funções/RPCs | diagnostico_operacional(), generate_next_id_chamado(), save_ticket_with_history() |
| Índices | status_atual, modificado_em, designacao (chamados); id_chamado, data (historico); chamado+designacao (anexos) |

> **Divergência detectada:** O schema.sql e a migration `20260602000000_schema_rls_and_policies.sql` contêm `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` para todas as 5 tabelas. Mesmo assim, o RLS está desabilitado no banco real. Isso indica que as migrations **não foram aplicadas** ao projeto Supabase de produção.

---

## 4. Melhorias Visuais M-01 a M-14

### M-01 — Diferenciar níveis de urgência por cor e texto

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `severidadeInatividade()` em `src/lib/logic.js` linhas 157–162: classifica em CRITICO (≥60d), ALTO (≥15d), ATENCAO (≥7d), OK |
| Uso real | ✅ | `App.jsx` linha 1092: `const sev = severidadeInatividade(inactDays)` — usado na renderização do painel de ações |
| Banco | 🚫 | Não se aplica — lógica client-side |
| Produção | ❓ | Não verificado |
| Teste | ✅ | `test/logic.test.mjs` seção "Melhorias P0": 2 testes cobrem todas as faixas de `severidadeInatividade` — passam |
| Governança | ✅ | `CLAUDE.md` documenta os limiares 7/15 para SLA e 30/60 para antiguidade |

**Classificação: ✅ Implementado (Código + Uso real + Teste)**

**Lacuna observada:** O nível CRITICO (≥60d) e o nível ALTO (≥15d) recebem a mesma cor (`var(--color-red)`) e a mesma classe `tag-danger` no App.jsx — apenas o texto diferencia os dois. Visualmente são idênticos exceto pelo rótulo. Isso pode ser suficiente, mas é uma escolha de design que deve ser confirmada pelo usuário.

---

### M-02 — Ordem única de urgência em todas as listas

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `compararUrgencia()` e `ordenarPorUrgencia()` em `logic.js` linhas 168–183; `calculateUrgencyScore()` em `operationalIntelligence.js` linhas 23–72 |
| Uso real | ✅ | `getActionItems()` e `getOperationalSummary()` em `operationalIntelligence.js` chamadas em `App.jsx` linha 813 |
| Banco | 🚫 | Não se aplica — lógica client-side |
| Produção | ❓ | Não verificado |
| Teste | ✅ | `test/logic.test.mjs` seção "Melhorias P0": teste `M-02: ordenarPorUrgencia ordena chamados de forma determinista e estavel` — passa |
| Governança | ✅ | Critério documentado no código |

**Classificação: ✅ Implementado (Código + Uso real + Teste)**

---

### M-03 — Separar indicadores de inércia e antiguidade

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `App.jsx` linhas 2268–2326: dois sub-blocos com títulos `"Sem Movimentação Recente (Inércia)"` e `"Tempo Total em Aberto (Antiguidade)"` |
| Uso real | ✅ | Renderizado no painel principal |
| Banco | 🚫 | Não se aplica — lógica client-side |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Nenhum teste de renderização de componente cobre esta separação visual |
| Governança | ✅ | `CLAUDE.md` documenta os dois alertas como independentes |

**Classificação: ✅ Implementado (Código + Uso real) — sem cobertura de teste**

---

### M-04 — Agrupamento de cards repetidos de "Atualizar andamento"

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `operationalIntelligence.js` linhas 165–200: lógica de agrupamento de `stuck` em `stuck-group` quando há mais de 1 item |
| Uso real | ✅ | `App.jsx` linhas 1106, 1148, 1213: renderização do tipo `stuck-group` com comportamento diferente (rolagem para lista) |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ✅ | `test/smoke.test.mjs` teste 8.5: "Limitação estrita do painel para no máximo 5 ações prioritárias com agrupamento" — passa |
| Governança | ✅ | Documentado em `docs/implementation_plan.md` |

**Classificação: ✅ Implementado (Código + Uso real + Teste)**

---

### M-05 — Setores duplicados (visualização vs. saneamento do banco)

Este item precisa ser **dividido em dois sub-itens**, pois são problemas diferentes:

#### M-05a — Normalização visual do setor

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `normalizeSector()` em `logic.js` linhas 41–46: converte `"Unidade Escolar / GIN"` → `"GIN / Unidade Escolar"` |
| Uso real | ✅ | `App.jsx` linha 2658: `const sec = normalizeSector(t.setor_responsavel || 'Não especificado')` — chamado no gráfico de responsabilidade |
| Banco | 🚫 | Não se aplica — normalização ocorre apenas no front |
| Produção | ❓ | Não verificado |
| Teste | ❌ | `logic.test.mjs` não tem teste para `normalizeSector` |
| Governança | 📄 | Documentado como decisão de unificação |

**Classificação: ✅ Implementado visualmente (Código + Uso real) — sem teste unitário**

#### M-05b — Saneamento dos valores divergentes no banco

| Nível | Status | Evidência |
|---|---|---|
| Código | ❌ | Não existe migration de UPDATE que sanitize `"Unidade Escolar / GIN"` para `"GIN / Unidade Escolar"` |
| Uso real | ❌ | Não se aplica |
| Banco | ❌ | Os dados locais (`db.json`) contêm **7 registros** com `setor_responsavel = "Unidade Escolar / GIN"`: GOP-AR-2026-0002, 0009, 0011, 0014, 0022, 0025, 0026. O banco real tem 30 chamados — provável que os mesmos valores existam lá. |
| Produção | ❌ | Não se aplica |
| Teste | ❌ | Nenhum teste verifica que o banco não contém valores divergentes |
| Governança | ❌ | Não há constraint CHECK em `setor_responsavel` no schema.sql |

**Classificação: ❌ Pendente real — saneamento do banco não foi feito; constraint não existe**

---

### M-06 — Remover rolagem interna em cards do dashboard

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `index.css` linhas 2740–2747: `.mini-progress-list { max-height: none; overflow-y: visible; }` |
| Uso real | ✅ | A classe é usada no painel de responsabilidade |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Nenhum teste cobre isso |
| Governança | ✅ | Comentado como parte do conjunto M-06 |

**Classificação: ✅ Implementado (Código)**

---

### M-07 — Tabela de chamados em cards no mobile

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `index.css` linha 3493: `@media (max-width: 768px)` com `.lists-table-mobile-view`, `.mobile-ticket-card` (linhas 3771–3994); `App.jsx` linhas 3224–3281: atributos `data-label` em todas as `<td>` |
| Uso real | ✅ | Código está presente na renderização da lista principal |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | **Não existe teste Playwright para mobile.** O `playwright.config.js` não define projetos com viewport mobile. O arquivo `e2e/dossier.spec.js` não tem `viewport` definido. |
| Governança | ✅ | Documentado em `docs/implementation_plan.md` |

**Classificação: ⚠️ Implementado parcialmente — Código existe, sem teste automatizado mobile**

---

### M-08 — Comunicações empilhada no mobile

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `index.css` dentro do `@media (max-width: 768px)` (linha 3575): `.email-composer-layout { grid-template-columns: 1fr !important; }` |
| Uso real | ✅ | A classe `.email-composer-layout` está definida em `index.css` linha 1380 e é usada na aba de Comunicações |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Sem teste Playwright mobile |
| Governança | ✅ | Comentado como M-08 no CSS |

**Classificação: ⚠️ Implementado parcialmente — Código existe, sem teste automatizado mobile**

---

### M-09 — Cabeçalho mobile compacto

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `index.css` linha 3593: bloco `/* M-09: Cabeçalho mobile compacto */` com regras para `.main-header`, `.header-title`, `.header-actions` |
| Uso real | ✅ | Classes `.main-header` e `.header-actions` são utilizadas no cabeçalho do App |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Sem teste Playwright mobile |
| Governança | ✅ | Comentado como M-09 no CSS |

**Classificação: ⚠️ Implementado parcialmente — Código existe, sem teste automatizado mobile**

---

### M-10 — Fonte normal em campos e minutas (não monospace)

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `index.css` linha 1502: `.email-preview-body { font-family: var(--font-sans); }` |
| Uso real | ✅ | Usada na prévia do e-mail |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Sem teste |
| Governança | ✅ | Alinhado à intenção documentada |

**Classificação: ✅ Implementado para o email preview**

**Lacuna observada:** Dois seletores ainda usam fontes monoespaçadas fora do contexto de código/IDs:
- `.admin-sql-details pre` (linha 1823): `font-family: Consolas, monospace` — contexto técnico, aceitável
- `.priority-ticket-link` (linha 3251): `font-family: monospace` — este é um link de chamado que aparece no painel de ações. Pode ser intencional para destacar o código, mas deveria ser verificado visualmente.

---

### M-11 — Texto junto das cores (legendas)

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `App.jsx` linhas 3148–3189: painel `.lists-legend-panel` com 9 itens de legenda textual. Ação de inatividade exibe texto: "Crítico — revisar caso", "Alto risco", "Atenção" (linhas 1095–1103) |
| Uso real | ✅ | Painel de legenda renderizado abaixo dos filtros da lista |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Sem teste de acessibilidade |
| Governança | ✅ | Comentado como M-11 no CSS (linha 745, 848) |

**Classificação: ✅ Implementado (Código + Uso real)**

---

### M-12 — Contraste de tons âmbar e laranja

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `:root` no CSS: `--color-amber: hsl(35, 88%, 32%)` com nota `(WCAG AA)`; `--color-orange: hsl(16, 85%, 38%)` com nota `(WCAG AA)` |
| Uso real | ✅ | Tokens são usados em 505 ocorrências de `var(--` no CSS |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado com ferramenta de contraste em produção |
| Teste | ❌ | Sem teste de contraste automatizado (ex: axe-core) |
| Governança | ✅ | Anotação WCAG AA no código |

**Classificação: ✅ Implementado no código — sem validação de contraste automatizada**

**Observação técnica:** O `--color-amber` no modo claro é `hsl(35, 88%, 32%)` — um dourado escuro, teoricamente adequado. No modo escuro (`.dark-theme`), `--color-amber: hsl(38, 88%, 55%)` — mais claro, para funcionar sobre fundo escuro. A implementação está correta em conceito, mas não foi testada com ferramenta objetiva.

---

### M-13 — Tokens de design centralizados

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `:root` em `index.css` linhas 6–67: ~30 variáveis CSS cobrindo paleta, sombras, raios, fontes, transições. `.dark-theme` sobrescreve os valores para o tema escuro. Total de `var(--` no CSS: 505 ocorrências. |
| Uso real | ✅ | Tokens usados extensamente em todo o CSS |
| Banco | 🚫 | Não se aplica |
| Produção | ❓ | Não verificado |
| Teste | ❌ | Sem teste |
| Governança | ✅ | Sistema estruturado |

**Classificação: ✅ Implementado (Código)**

**Lacuna observada:** O `App.jsx` ainda contém **27 ocorrências** de cores e valores de estilo inline (ex.: `style={{ color: 'hsl(...)' }}`, `style={{ background: '#...' }}`). Isso é ruído, não problema grave — mas significa que o sistema de tokens não é 100% centralizado. Requer verificação visual antes de declarar "totalmente resolvido".

---

### M-14 — Tema claro/escuro persistido

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `App.jsx` linha 300: `localStorage.getItem('gop_theme')` — lê preferência. Linha 309: `localStorage.setItem('gop_theme', theme)` — grava ao trocar. Linha 301: fallback para `'dark'` se não houver preferência salva |
| Uso real | ✅ | Executado no `useState` inicial do componente |
| Banco | 🚫 | Não se aplica — cliente |
| Produção | ❓ | Não verificado no deploy real |
| Teste | ❌ | Sem teste E2E de persistência de tema |
| Governança | ✅ | Comportamento documentado: padrão é tema escuro |

**Classificação: ✅ Implementado (Código + Uso real)**

---

## 5. Governança Supabase

### G-01 — Protocolo de backup antes de mudanças

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | 11 migrations cronológicas existem em `supabase/migrations/` |
| Uso real | 📄 | O processo de usar migrations é parcialmente seguido — mas **nem todas as migrations foram aplicadas ao banco real** (conforme evidenciado pelo RLS desabilitado) |
| Banco | ❌ | Não há evidência de backup automatizado ou rotina documentada além do texto em `GOVERNANCA.md` |
| Teste | ❌ | Sem validação |
| Governança | 📄 | `supabase/GOVERNANCA.md` seção 1 descreve o protocolo — é um documento, não uma automação |

**Classificação: 📄 Apenas documentação — o protocolo existe como texto, não como processo verificável**

---

### G-02 — Uso dos Advisors do Supabase

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | Migration `20260602000002_advisor_hardening.sql` contém correções que vieram de uma rodada de Advisors |
| Uso real | 📄 | Não há rotina automatizada ou registro de frequência — foi feito uma vez |
| Banco | ❓ | Não verificado se os achados foram aplicados |
| Governança | 📄 | `GOVERNANCA.md` seção 2 recomenda frequência mensal — é recomendação, não rotina vigente |

**Classificação: 📄 Feito uma vez — sem rotina estabelecida**

---

### G-03 — RLS (Row Level Security)

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `schema.sql` e migration `20260602000000`: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` nas 5 tabelas + políticas de SELECT/INSERT/UPDATE |
| Migration | ✅ | Migration `20260607032700_cleanup_residual_insecure_policies.sql` remove políticas de DELETE para `anon` em chamados e políticas de INSERT/UPDATE para `anon` em escolas e historico |
| **Banco real** | **⚡ CONTRADITÓRIO** | **RLS está DESABILITADO nas 5 tabelas no Supabase real** (confirmado pelo usuário). As migrations que habilitam RLS **não foram aplicadas** ao banco de produção. |
| Produção | ❌ | O banco real está sem RLS — qualquer pessoa com a chave anon pode ler e escrever sem restrição |
| Teste | ❌ | Sem teste de RLS |
| Governança | ✅ | `GOVERNANCA.md` seção 3 documenta o modelo de segurança desejado |

**Classificação: ⚡ Contraditório — implementado no repositório, desabilitado no banco real. Esta é a lacuna de segurança mais grave do projeto.**

---

### G-04 — Funções SECURITY DEFINER com search_path fixo

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `schema.sql` linhas 183–184: `SECURITY DEFINER SET search_path = public, pg_temp` em `generate_next_id_chamado()`. Migration `20260603000004_rpc_save_ticket.sql`: `SECURITY DEFINER SET search_path = public, pg_temp` em `save_ticket_with_history()`. Migration `20260604054013`: `diagnostico_operacional()` com `SECURITY DEFINER SET search_path = public, pg_temp` |
| Banco | ✅ (provável) | O usuário confirmou que as 3 funções existem no banco real. A aplicação do search_path depende de qual migration foi aplicada. |
| Uso real | ✅ | `App.jsx` linha 1425: `.rpc('save_ticket_with_history', {...})` — única chamada RPC do app |
| Teste | ✅ | `test/smoke.test.mjs` testes 6 e 7 cobrem o fluxo da RPC |
| Governança | ✅ | `GOVERNANCA.md` seção 4 documenta as funções |

**Classificação: ✅ Implementado no código — estado no banco real não é completamente verificável sem acesso direto**

---

### G-05 — Mover extensões para schema dedicado

| Nível | Status | Evidência |
|---|---|---|
| Código | ❌ | As extensões (`unaccent`, `pg_trgm`, `moddatetime`, `http`) são criadas com `CREATE EXTENSION IF NOT EXISTS` sem especificar schema — ficam em `public` |
| Banco | ❌ | Extensões estão em `public` (padrão Supabase) |
| Governança | 📄 | `GOVERNANCA.md` seção 5 cita como item futuro |

**Classificação: ❌ Pendente — de baixo risco operacional, alto risco de regressão se feito incorretamente**

---

### G-06 — Auditoria de arquivos órfãos no Storage

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | `vw_chamados_sem_anexo` e `vw_integridade_operacional` existem nas migrations. `diagnostico_operacional()` conta `anexos_sem_chamado` |
| Banco | ✅ (provável) | O usuário confirmou que as funções existem. As views dependem de qual migration foi aplicada. |
| Uso real | ❌ | As views SQL existem no banco mas não são chamadas pela interface web — são para uso direto no painel SQL do Supabase |
| Teste | ❌ | Sem teste |
| Governança | ✅ | `GOVERNANCA.md` seção 6 documenta o bucket e as políticas |

**Classificação: ✅ Implementado como ferramenta SQL — sem uso na interface web**

---

### G-07 — Views gerenciais

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | 7 views definidas em migrations (principalmente `20260604054013_security_invoker_and_suspended_logic.sql` e `20260605235747_clamp_e_densidade_climatizacao.sql`) com `security_invoker = true` |
| Banco | ✅ (provável) | Usuário confirmou existência das funções. Views dependem da migration aplicada. |
| Uso real | ❌ | **As views não são chamadas pelo app React.** O app carrega os dados diretamente de `escolas`, `chamados`, `historico`, `modelos_email` e `anexos_chamado` via queries SELECT simples (App.jsx linhas 602–644). As views são para análise manual via SQL. |
| Teste | ❌ | Sem teste |
| Governança | ✅ | `GOVERNANCA.md` seção 7 lista as views |

**Classificação: ✅ Implementado como ferramentas de diagnóstico SQL — não integradas à interface web**

---

### G-08 — Histórico imutável (sem UPDATE pelo anon)

| Nível | Status | Evidência |
|---|---|---|
| Código | ✅ | Migration `20260607032700`: `DROP POLICY IF EXISTS "Permitir atualização de historico"` — remove a política de UPDATE para anon |
| Banco | ⚡ | **Depende de qual migration foi aplicada ao banco real.** Como o RLS está desabilitado, mesmo que a política tenha sido removida, sem RLS ativo ela não tem efeito |
| Governança | 📄 | Intenção documentada, mas depende do RLS estar ativo para funcionar |

**Classificação: ⚡ Contraditório — intenção implementada no código; sem RLS ativo, a política não tem efeito prático**

---

## 6. Arquitetura do Front-end

### Estado verificado

| Item | Estado | Evidência |
|---|---|---|
| `src/services/` | ❌ NÃO EXISTE | Não há pasta de serviços |
| `src/domain/` | ❌ NÃO EXISTE | Não há camada de domínio separada |
| `src/hooks/` | ❌ NÃO EXISTE | Não há hooks customizados |
| `src/types/` | ✅ Existe | `src/types/supabase.ts` — tipos TypeScript gerados (mas o projeto usa JSX, não TSX) |
| `src/lib/` | ✅ Existe | `logic.js`, `operationalIntelligence.js`, `attachments.js`, `schoolDossier.js`, `validation.js` |
| `src/components/` | ✅ Existe | `ErrorBoundary.jsx`, `OperationalMap.jsx` — apenas 2 componentes externalizados |

### Concentração em App.jsx

| Métrica | Valor |
|---|---|
| Total de linhas | **6.818** |
| Quantidade de `useState` | **50** |
| Quantidade de `useEffect` | **11** |
| Queries Supabase diretas (`.from()`, `.rpc()`, `.select()` etc.) | **27 ocorrências** |
| Funções de negócio importadas de `src/lib` | ~20 funções |

### Observações

1. **Queries Supabase estão em App.jsx.** As 27 ocorrências de `.from()`, `.select()`, `.insert()`, `.update()`, `.rpc()` estão todas dentro do componente principal. Não há camada de serviço separando acesso ao banco da UI.

2. **Listas de status e setores são duplicadas em inline no JSX.** O formulário de novo chamado tem 4 opções de status (linhas 5332–5335). O formulário de edição tem 12 opções (linhas 5959–5978) — com valores diferentes do catálogo oficial. Detalhe abaixo.

3. **Não há hooks customizados.** Todo o estado é gerenciado com `useState`/`useEffect` diretamente no componente de 6.818 linhas.

4. **A lógica de negócio está bem separada** em `src/lib/logic.js` e `src/lib/operationalIntelligence.js` — isto é um ponto forte.

---

## 7. Banco e Domínio — Valores Verificados

### 7.1 Valores distintos no `db.json` (dados locais — 30 chamados)

| Campo | Valores encontrados | Valores no catálogo oficial | Divergências |
|---|---|---|---|
| `status_atual` | 10-Concluído, 2-Em vistoria, 4-Aguardando orçamento, 5-Orçamento análise, 7-Adequação execução, 9-Aguardando aparelho | 12 valores no catálogo (1–11 + Suspenso) | 6 valores presentes; 6 do catálogo nunca ocorreram ainda |
| `setor_responsavel` | CPS, GIN, GIN/CPS, GIN/Unidade Escolar, GOP, **Unidade Escolar / GIN** | SECTORS = [GOP, GIN, CPS, CTO] | **"Unidade Escolar / GIN" aparece em 7 registros** — valor invertido |
| `prioridade` | Alta, Média | Baixa, Média, Alta, Crítica | Baixa e Crítica existem no catálogo mas nunca ocorreram nos dados |
| `resultado_aptidao` | Apta, Apta parcialmente, Não apta, Pendente | Não há catálogo formal | Parece completo |
| `informacao_validada` | Pendente de Vistoria, Sim | Não há catálogo formal | Parece razoável |
| `comunicacao_cto` | Não | Não há catálogo formal | "Sim" nunca ocorreu nos dados |
| `tipo_demanda` | Adequação infra/elétrica, Substituição/Instalação de Aparelho | Vários no formulário | Apenas 2 valores reais |

### 7.2 Nulos e vazios (db.json — 30 chamados)

| Campo | Nulos/vazios |
|---|---|
| status_atual | 0 |
| setor_responsavel | 0 |
| prioridade | 0 |
| modificado_em | 0 |
| criado_em | 0 |
| designacao | 0 |
| unidade_escolar | 0 |

**Conclusão:** Os dados locais estão limpos. O banco real pode ter situação diferente — especialmente os 2 chamados que foram inseridos depois da carga inicial (chamados 29 e 30).

### 7.3 Constraints no banco (schema.sql)

| Campo | Tem constraint CHECK? | Evidência |
|---|---|---|
| `status_atual` | ❌ NÃO | Nenhum `CHECK` no schema.sql — apenas `NOT NULL` |
| `prioridade` | ❌ NÃO | Nenhum `CHECK` — apenas `NOT NULL` |
| `setor_responsavel` | ❌ NÃO | Nenhum `CHECK` — apenas `NOT NULL` |
| `tipo_demanda` | ❌ NÃO | Nenhum `CHECK` — apenas `NOT NULL` |

**Conclusão:** O banco aceita qualquer string nesses campos. A integridade dos valores depende exclusivamente do front-end (formulários e validação Zod).

### 7.4 Divergências entre formulários de novo chamado e edição

**Formulário de novo chamado (App.jsx linhas 5332–5354):**
- Oferece apenas **4 status**: 1, 2, 4, Suspenso
- Oferece **5 setores**: GOP, CPS, GIN, CTO, Unidade Escolar

**Formulário de edição (App.jsx linhas 5959–6004):**
- Oferece **12 status**, incluindo:
  - `"3 - Vistoria concluída"` — texto diferente do catálogo (`"3 - Vistoria concluída — pendente laudo"`)
  - `"6 - Recurso / remanejamento"` — **não existe no catálogo oficial** do CLAUDE.md
  - `"8 - Autorizado — CTO acionada"` — **não existe no catálogo** (catálogo tem `"8 - Adequação concluída"`)
- Oferece **10 setores**, incluindo:
  - `CTIN` — citado no CLAUDE.md como sinônimo de GIN, não deve aparecer como opção
  - `GMP`, `COMP` — **não estão no catálogo de setores do CLAUDE.md**
  - `Unidade Escolar` (singular, sem setor), `GIN / Unidade Escolar`, `CPS / Unidade Escolar`

**Status validado pelo `diagnostico_operacional()` no banco:** lista de 12 valores em schema.sql diverge dos que aparecem nos formulários acima.

**Conclusão:** Os formulários de edição contêm valores de status e setor que divergem do catálogo oficial — criando risco de inserir dados fora do catálogo que depois serão contados como `status_invalidos` pela função `diagnostico_operacional()`.

---

## 8. Classificação Final

### 8.1 Melhorias Visuais M-01 a M-14

| Item | Classificação | Observação |
|---|---|---|
| M-01 Urgência por cor/texto | ✅ Implementado | CRITICO e ALTO usam mesma cor; apenas texto diferencia |
| M-02 Ordem única de urgência | ✅ Implementado | |
| M-03 Inércia x Antiguidade | ✅ Implementado | Sem teste de renderização |
| M-04 Agrupamento de cards | ✅ Implementado | |
| M-05a Normalização visual de setores | ✅ Implementado | Apenas no front; banco não foi sanitizado |
| M-05b Saneamento do banco (setores) | ❌ Pendente real | 7 registros com valor invertido em db.json; sem constraint |
| M-06 Rolagem interna | ✅ Implementado | |
| M-07 Cards mobile | ⚠️ Parcial | Código existe; sem teste Playwright mobile |
| M-08 Comunicações mobile | ⚠️ Parcial | Código existe; sem teste Playwright mobile |
| M-09 Cabeçalho mobile | ⚠️ Parcial | Código existe; sem teste Playwright mobile |
| M-10 Fonte normal | ✅ Implementado | `.priority-ticket-link` ainda usa monospace — verificar se intencional |
| M-11 Texto junto das cores | ✅ Implementado | |
| M-12 Contraste | ✅ Implementado no código | Sem validação com ferramenta de contraste |
| M-13 Tokens centralizados | ✅ Implementado | 27 cores inline ainda em App.jsx |
| M-14 Tema persistido | ✅ Implementado | |

### 8.2 Governança Supabase

| Item | Classificação | Observação |
|---|---|---|
| G-01 Backup antes de mudanças | 📄 Apenas documentação | Migrations existem; aplicação ao banco é manual e não foi feita |
| G-02 Advisors do Supabase | 📄 Feito uma vez | Sem rotina periódica estabelecida |
| G-03 RLS nas tabelas | ⚡ Contraditório | Código habilita; banco real tem RLS desabilitado |
| G-04 SECURITY DEFINER + search_path | ✅ Implementado no código | Banco: provável, não confirmado diretamente |
| G-05 Extensões em schema dedicado | ❌ Pendente | De baixo risco |
| G-06 Auditoria de órfãos no Storage | ✅ Implementado como SQL | Não integrado à UI web |
| G-07 Views gerenciais | ✅ Implementado como SQL | Não integradas à UI web |
| G-08 Histórico imutável | ⚡ Contraditório | Política removida no código; sem efeito sem RLS ativo |

### 8.3 Arquitetura do Front

| Item | Classificação | Observação |
|---|---|---|
| Lógica pura separada | ✅ Implementado | `src/lib/` com 5 módulos, testados |
| Serviços de acesso ao banco | ❌ Não existe | 27 queries Supabase em App.jsx diretamente |
| Hooks customizados | ❌ Não existe | 50 useState em um único componente |
| Domain layer | ❌ Não existe | Listas de status/setor duplicadas no JSX |
| Componentes separados | ⚠️ Parcial | Apenas ErrorBoundary e OperationalMap externalizados |

### 8.4 Banco e Domínio

| Item | Classificação | Observação |
|---|---|---|
| Nulos em campos obrigatórios (db.json) | ✅ Sem nulos | |
| Valores de status dentro do catálogo (db.json) | ✅ Sim | |
| Valores de setor dentro do catálogo | ⚠️ Parcial | 7 registros com "Unidade Escolar / GIN" (invertido) |
| Valores de prioridade dentro do catálogo | ✅ Sim | Apenas "Alta" e "Média" usados; catálogo maior que os dados |
| Constraints CHECK no banco | ❌ Não existem | Status, prioridade e setor aceitam qualquer string |
| Formulários alinhados ao catálogo oficial | ⚠️ Divergência | Edit form tem status e setores fora do catálogo |

---

## 9. Próximas Decisões Necessárias (não implementar — decidir)

Os itens abaixo requerem **decisão** antes de qualquer implementação:

1. **RLS [URGENTE]:** Decidir se o Supabase de produção deve ter RLS habilitado agora, e quais políticas aplicar. Esta é a única pendência com impacto de segurança real e imediato.

2. **Catálogo de status [GOVERNANÇA]:** Os formulários de edição contêm status que não existem no catálogo oficial (`"6 - Recurso / remanejamento"`, `"8 - Autorizado — CTO acionada"`). Isso é erro, ou o catálogo evoluiu e o CLAUDE.md está desatualizado?

3. **Catálogo de setores [GOVERNANÇA]:** O formulário de edição tem CTIN, GMP, COMP, que não existem nos dados reais e não estão no catálogo. Devem ser removidos?

4. **Saneamento de "Unidade Escolar / GIN" [BANCO]:** Os 7 registros com valor invertido devem ser corrigidos no banco? Se sim, com UPDATE direto ou via migration?

5. **Teste mobile [QUALIDADE]:** M-07, M-08 e M-09 existem no CSS mas nunca foram testados automaticamente. Deseja criar testes Playwright mobile, ou confiar na inspeção visual?

---

*Este documento representa o estado do projeto no commit `f1634a4`, analisado exclusivamente por inspeção do repositório GitHub. Os dados de estado do banco Supabase real foram fornecidos pelo usuário e não foram verificados diretamente nesta sessão.*
