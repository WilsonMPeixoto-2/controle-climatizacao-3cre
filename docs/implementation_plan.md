# Plano de Implementação — Fase 4 (Segurança, Governança e Autenticação Supabase Auth)

Este plano descreve o design e as alterações técnicas necessárias para implementar a segurança de acesso a nível de linha (RLS) e a autenticação de usuários no frontend e banco de dados Supabase.

## User Review Required

> [!IMPORTANT]
> **Enrijecimento de Acesso e Credenciais Padrão:**
> * **Autenticação Obrigatória:** Ao conectar à base Supabase (produção/local), a aplicação passará a exibir uma tela de login institucional, bloqueando o acesso e a visualização dos dados por usuários não autenticados.
> * **Seeding de Usuário Admin:** O script de migração criará um usuário padrão para acesso administrative inicial:
>   * **Usuário:** `admin@gop3cre.gov.br`
>   * **Senha padrão:** `gop-clima-admin`
> * **Políticas RLS:** O acesso público (`anon`) de leitura e escrita será revogado em todas as tabelas e no Storage, exigindo autenticação do usuário.

---

## Proposed Changes

### Componente 1: Banco de Dados e Migrações (Supabase)

#### [NEW] [20260606223400_security_hardening.sql](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/supabase/migrations/20260606223400_security_hardening.sql)
* **Ativação e Restrição de RLS:**
  * Revogar as políticas anteriores que permitiam acesso público (perfil `anon`) a todas as tabelas (`escolas`, `chamados`, `historico`, `modelos_email`, `anexos_chamado`).
  * Aplicar novas políticas que restringem operações de `SELECT`, `INSERT`, `UPDATE` e `DELETE` apenas a usuários autenticados (`TO authenticated`).
  * Restringir o acesso aos arquivos físicos no Supabase Storage (`gop-anexos` bucket) apenas para usuários autenticados.
* **Governança de Funções `SECURITY DEFINER`:**
  * Revogar o privilégio de execução direta para as roles `PUBLIC`, `anon` e `authenticated` na função `generate_next_id_chamado()`, limitando-a para uso estrito pela trigger interna do banco.
  * Restringir a execução da RPC `save_ticket_with_history(...)` apenas para usuários com perfil `authenticated`.
* **Criação do Usuário Administrador Padrão:**
  * Inserir o registro de login do usuário `admin@gop3cre.gov.br` na tabela `auth.users` com senha criptografada `gop-clima-admin`.
  * Vincular o registro correspondente em `auth.identities` para permitir autenticação via email e senha no Supabase Auth.

---

### Componente 2: Interface Frontend (React e Estado de Sessão)

#### [MODIFY] [App.jsx](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/App.jsx)
* **Integração de Estado de Sessão (Supabase Auth):**
  * Criar o estado `session` (`null` por padrão) para armazenar os dados do usuário conectado.
  * Capturar a sessão ativa no carregamento inicial dentro do método `initializeSupabase` usando `supabaseClient.auth.getSession()`.
  * Escutar mudanças no estado de autenticação via `supabaseClient.auth.onAuthStateChange` para gerenciar login/logout em tempo real e atualizar a sessão.
* **Tela de Login Institucional Premium:**
  * Criar um componente de tela de login estilizado com base nas regras de alta estética (fundo de blur com HSL, container glassmorphism, tipografia Outfit/Inter, inputs animados).
  * Exibir a tela de login quando `supabaseClient` estiver ativo mas o usuário não possuir uma sessão válida (`session === null`).
  * Implementar a chamada de login: `supabaseClient.auth.signInWithPassword({ email, password })`.
  * Tratar mensagens de erro do Supabase de forma amigável ao usuário (ex.: "Credenciais inválidas ou usuário não cadastrado").
* **Logout e Cabeçalho:**
  * No topo da barra lateral / cabeçalho, exibir as informações do usuário logado (email) e um botão de Logout que aciona `supabaseClient.auth.signOut()`.
  * Limpar a sessão local ao deslogar.

---

### Componente 3: Estilização Visual (CSS)

#### [MODIFY] [index.css](file:///C:/Users/okidata/.gemini/antigravity-ide/scratch/controle-climatizacao-3cre/src/index.css)
* **Design da Tela de Login:**
  * Adicionar classes para a tela de login (`.login-page-container`, `.login-card`, `.login-form-group`, `.login-title`, `.login-button`).
  * Utilizar a paleta baseada nos tokens HSL (`--primary`, `--primary-light`, `--bg-app`, `--border-color`) para consistência nos temas claro e escuro.
  * Aplicar animações sutis de fade-in no card e scale nos botões ao passar o cursor (`:hover`).

---

## Verification Plan

### Testes Automatizados
* Rodar a suite de testes locais para garantir que a lógica e validações não quebraram:
  ```bash
  npm run test
  ```
* Rodar o linter para assegurar que não foram introduzidas variáveis não utilizadas ou erros de sintaxe:
  ```bash
  npm run lint
  ```
* Confirmar a compilação de produção Vite:
  ```bash
  npm run build
  ```

### Validação Manual (Autenticação e RLS)
1. **Fluxo de Login:**
   * Abrir o site localmente em modo conectado (`supabaseClient` ativo).
   * Confirmar que a tela de login é exibida bloqueando o acesso aos dados.
   * Digitar credenciais inválidas e validar o tratamento de erros.
   * Logar com `admin@gop3cre.gov.br` e a senha `gop-clima-admin`. Validar se o dashboard e dados carregam perfeitamente.
2. **Fluxo de Logout:**
   * Clicar em "Sair" e confirmar se a tela de login volta a ser exibida.
3. **Auditoria de Políticas RLS:**
   * Executar uma chamada de leitura anônima ao endpoint REST do Supabase e confirmar que retorna erro de autenticação ou array vazio devido às políticas RLS restritas.
