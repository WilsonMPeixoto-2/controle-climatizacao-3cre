# Controle de Climatização — GOP/3ª CRE

Aplicação web para registrar, consultar e acompanhar chamados de climatização das unidades escolares acompanhadas pela GOP/3ª CRE.

O sistema substitui controles manuais por uma rotina única para registro de demanda, acompanhamento de status, identificação do setor responsável, histórico, consulta por unidade, indicadores, mapa operacional e preparação de comunicações.

## Estado atual

A aplicação foi migrada da persistência Supabase/PostgreSQL para **Firebase Cloud Firestore**, mantendo React/Vite no frontend e Vercel na hospedagem.

A arquitetura Firebase está implementada e validada em Emulator Suite. A publicação definitiva em produção depende da criação/configuração do projeto Firebase real e das variáveis do Web App na Vercel. Até esse provisionamento, a `master` e o domínio de produção permanecem na versão anterior para evitar perda de persistência.

## Escopo

O sistema cobre:

- cadastro e consulta de chamados;
- consulta por unidade escolar;
- painel com indicadores de volume, inatividade e antiguidade;
- histórico de eventos relevantes;
- modelos de comunicação por e-mail;
- mapa operacional de contexto territorial;
- persistência Firestore;
- atualização realtime via `onSnapshot`;
- geração transacional e sequencial de IDs por exercício.

Ficam fora do escopo atual:

- controle de estoque;
- compras ou logística da CTO;
- inventário completo do parque de ar-condicionado;
- ordem de serviço técnica;
- autenticação individual de usuários;
- upload de anexos no Firebase Storage.

A funcionalidade histórica de anexos permanece isolada como legado/futuro. Firebase Storage não integra esta fase porque o projeto deve permanecer no plano Spark sem meio de pagamento.

## Tecnologias

- React 19;
- Vite 8;
- Firebase / Cloud Firestore;
- Firebase Emulator Suite;
- Leaflet;
- Zod;
- Vercel Analytics;
- ESLint;
- Playwright + Axe para E2E/acessibilidade.

## Modelo de dados Firestore

```text
escolas/{designacao}
chamados/{id_chamado}
historico/{id_evento}
modelos_email/{id}
contadores/chamados-{AAAA}
```

A criação de chamado usa transação para reservar o próximo número, gerar `GOP-AR-{AAAA}-{NNNN}`, criar o chamado e registrar o evento inicial de histórico sem emitir ID oficial antes da confirmação remota.

## Dados locais

`src/data/db.json` permanece como snapshot/fallback de referência. Ele não deve ser tratado como uma segunda base gravável concorrente com o Firestore.

Chamados somente locais não recebem número oficial de produção.

## Variáveis de ambiente

Use `.env.local` em desenvolvimento ou as variáveis equivalentes na Vercel:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
```

Esses valores são a configuração pública do Firebase Web App. Nunca coloque credenciais administrativas ou chaves de service account no frontend ou no repositório.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run test:firestore
npm run test:e2e
```

`npm run test:firestore` executa Security Rules e o adapter no Firestore Emulator.

## Qualidade

Na release candidate Firebase validada em 16/08/2026:

- `npm audit`: 0 vulnerabilidades;
- lint/testes de domínio: aprovados;
- build Vite: aprovado;
- Security Rules: aprovadas no Emulator;
- adapter Firestore: aprovado no Emulator;
- Playwright/Axe: **13/13 cenários aprovados**, incluindo temas claro/escuro;
- snapshots visuais Linux/Chromium: atualizados e aprovados.

## Regras de negócio principais

- status encerrados não entram nos alertas;
- SLA/inatividade: alerta a partir de 7 dias e severo a partir de 15 dias;
- antiguidade: alerta a partir de 30 dias em aberto e severo a partir de 60 dias;
- setores principais: GOP, GIN, CPS e CTO;
- IDs de chamados usam o exercício dinamicamente, sem literal fixo de 2026.

## Documentação técnica

- `docs/ESTADO_DO_PROJETO.md`: situação operacional e próximos passos;
- `docs/ARQUITETURA_FIREBASE.md`: decisões arquiteturais;
- `docs/MIGRACAO_SUPABASE_FIREBASE.md`: histórico e critérios do cutover;
- `firestore.rules`: regras de segurança versionadas;
- `firestore.indexes.json`: índices Firestore;
- `firebase.json`: configuração do Emulator/Firestore.

O **código-fonte executável é a fonte de verdade**. Documentação histórica serve como contexto e não prevalece sobre o comportamento implementado.
