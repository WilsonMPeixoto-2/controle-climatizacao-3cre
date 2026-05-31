# Controle de Climatização — GOP/3ª CRE

Aplicação web simples para registrar, consultar e acompanhar chamados de climatização das unidades escolares acompanhadas pela GOP/3ª CRE.

O objetivo do projeto é substituir o controle manual em planilhas por uma rotina mais clara para a equipe: registrar uma demanda, localizar a escola, acompanhar o status, identificar o setor responsável, consultar o histórico e preparar comunicações.

## Escopo

O sistema apoia a GOP no acompanhamento administrativo dos chamados de climatização.

Ele cobre:

- cadastro e consulta de chamados;
- consulta rápida por unidade escolar;
- painel com indicadores de chamados, inatividade e antiguidade;
- histórico de eventos relevantes;
- modelos de comunicação por e-mail;
- mapa operacional de contexto territorial;
- leitura e gravação opcional em Supabase.

Ele não cobre:

- controle de estoque;
- compras ou logística da CTO;
- inventário completo do parque de ar-condicionado;
- ordem de serviço técnica;
- georreferenciamento individual das escolas;
- autenticação de usuários.

## Tecnologias

- React 19;
- Vite 8;
- Supabase;
- Leaflet;
- Zod;
- Vercel Analytics;
- ESLint;
- testes de lógica em Node.js.

## Dados

A aplicação usa quatro conjuntos principais:

- `chamados`: registros dos chamados;
- `historico`: linha do tempo dos eventos relevantes;
- `escolas`: cadastro de referência das unidades escolares;
- `modelos_email`: textos-base para comunicação.

Em desenvolvimento, os dados locais ficam em `src/data/db.json`. Em uso online, a aplicação pode ler e gravar no Supabase quando as variáveis de ambiente estiverem configuradas.

## Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
```

Use apenas a chave pública/anon do projeto Supabase. Não inclua service role key no front-end.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

## Regras De Negócio

As regras puras ficam em `src/lib/logic.js` e são cobertas por `test/logic.test.mjs`.

Principais regras atuais:

- status encerrados não entram nos alertas;
- SLA/inatividade: alerta a partir de 7 dias e severo a partir de 15 dias;
- antiguidade: alerta a partir de 30 dias em aberto e severo a partir de 60 dias;
- setores principais de acompanhamento: GOP, GIN, CPS e CTO.

## Limites Da Versão Atual

Este é um protótipo funcional para uso controlado. Antes de uso institucional amplo, ainda é recomendável validar regras oficiais de status, governança da base online, fluxo multiusuário e critérios de escrita em produção.
