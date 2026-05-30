# Conectar o sistema ao Supabase (persistência de dados)

Enquanto não conectado, o sistema funciona sobre `src/data/db.json` (local) e as
alterações se perdem ao recarregar a página. Conectado ao Supabase, os 28 chamados
e as 134 escolas passam a viver online e **as edições persistem**.

São cinco passos — leva cerca de 10 minutos e só precisa ser feito uma vez.

## 1. Criar o projeto
1. Acesse https://supabase.com e crie uma conta (gratuita).
2. Crie um novo projeto, ex.: **"Vivo Climatização 3CRE"**. Defina e guarde a senha do banco.

## 2. Criar as tabelas
No painel do projeto: menu lateral → **SQL Editor** → **New Query** →
cole todo o conteúdo de **`supabase/schema.sql`** → **Run**.

## 3. Carregar os dados iniciais
Ainda no SQL Editor → **New Query** → cole todo o conteúdo de
**`supabase/seed.sql`** → **Run**. (Confirme depois em **Table Editor** que
`escolas` tem 134 linhas e `chamados`, 28.)

## 4. Pegar as credenciais
No projeto: **Project Settings → API**. Copie:
- **Project URL** (algo como `https://xxxxx.supabase.co`)
- **anon public key** (a chave `anon`, pública)

## 5. Conectar o app
Há dois caminhos — escolha um:

**a) Pela própria interface (mais simples):** abra o sistema → aba **Nuvem** →
cole a URL e a chave → **Conectar**. (As credenciais ficam salvas no navegador.)

**b) Por variável de ambiente (recomendado para o deploy no Vercel):**
crie um arquivo **`.env`** na raiz (copie de `.env.example`) e preencha:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_KEY=sua-chave-anon-aqui
```

No Vercel, cadastre as mesmas duas variáveis em
**Project → Settings → Environment Variables** e refaça o deploy.

> O arquivo `.env` já está no `.gitignore` — ele não vai para o GitHub, o que evita
> expor a chave por engano. O `.env.example` (sem segredos) permanece versionado
> como modelo.

---

### Observação técnica (caso queira saber)
A chave `anon` é, por desenho do Supabase, embutida no app e visível no navegador —
não é um segredo. Para este controle (dados de acompanhamento de chamados de
ar-condicionado), isso é adequado. Se um dia o uso mudar e exigir restrição de
acesso, o Supabase oferece *Row Level Security* e autenticação — mas isso fica para
quando (e se) fizer falta, não agora.
