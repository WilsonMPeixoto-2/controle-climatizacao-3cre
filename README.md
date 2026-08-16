# Controle de Climatização — GOP/3ª CRE

Aplicação web para registrar, consultar e acompanhar chamados de climatização das unidades escolares acompanhadas pela GOP/3ª CRE.

O sistema substitui controles manuais por uma rotina única para registro de demanda, acompanhamento de status, identificação do setor responsável, histórico, consulta por unidade, indicadores, mapa operacional e preparação de comunicações.

## Estado atual

A aplicação operacional foi preparada para migração da persistência Supabase/PostgreSQL para **Firebase Cloud Firestore**, mantendo React/Vite no frontend e Vercel na hospedagem.

A arquitetura Firebase está implementada e validada em Emulator Suite, mas **o projeto Firebase real ainda não está conectado**. A publicação definitiva em produção depende da criação/configuração do projeto Firebase real e das variáveis do Web App na Vercel. Até esse provisionamento, a `master` e o domínio de produção permanecem na versão anterior para evitar perda de persistência.

Em paralelo, existe na branch `feat/prontuario-climatizacao-mvp` um **MVP de Prontuário de Climatização por ambientes**. Nesta primeira etapa ele é deliberadamente local-first: o foco é validar o layout, a experiência de preenchimento e o modelo de dados. Sem Firebase configurado, o levantamento é salvo no `localStorage` do navegador; adapter, coleção e Security Rules já ficam preparados para a conexão futura.

## Escopo

O sistema operacional cobre:

- cadastro e consulta de chamados;
- consulta por unidade escolar;
- painel com indicadores de volume, inatividade e antiguidade;
- histórico de eventos relevantes;
- modelos de comunicação por e-mail;
- mapa operacional de contexto territorial;
- persistência Firestore preparada;
- atualização realtime via `onSnapshot` quando o Firestore real for conectado;
- geração transacional e sequencial de IDs por exercício.

O MVP de Prontuário de Climatização acrescenta:

- acesso por link individual da escola: `/?levantamento={designacao}`;
- identificação automática da unidade pelo cadastro já existente;
- inclusão livre de ambientes;
- sugestões de tipos de ambiente com possibilidade de digitação livre;
- quantidade de aparelhos por ambiente;
- um bloco de preenchimento para cada aparelho informado;
- modelo/marca, capacidade BTU, tipo, situação e observações;
- situações simples: `Não informado`, `Funcionando` e `Precisa de manutenção`;
- salvamento e reabertura local do levantamento durante a fase de protótipo;
- estrutura Firestore já preparada para um documento de levantamento por escola.

Ficam fora do escopo atual:

- controle de estoque;
- compras ou logística da CTO;
- inventário patrimonial com tombamento e movimentação de bens;
- cruzamento automático entre o prontuário e chamados existentes;
- classificação de prioridade/criticidade a partir do levantamento;
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
levantamentos_climatizacao/{designacao}
```

O documento `levantamentos_climatizacao/{designacao}` guarda o levantamento da escola com seus ambientes e aparelhos. Nesta fase ele é validado somente no Emulator; o frontend usa `localStorage` quando as variáveis Firebase não estão configuradas.

A criação de chamado usa transação para reservar o próximo número, gerar `GOP-AR-{AAAA}-{NNNN}`, criar o chamado e registrar o evento inicial de histórico sem emitir ID oficial antes da confirmação remota.

## Dados locais

`src/data/db.json` permanece como snapshot/fallback de referência. Ele também fornece a identificação das escolas e sugestões iniciais para alguns campos do prontuário, mas **os totais históricos de aparelhos não são importados para o novo levantamento**.

Durante o MVP, cada levantamento local usa a chave:

```text
gop_climate_survey_{designacao}
```

Chamados somente locais não recebem número oficial de produção.

## Variáveis de ambiente

Quando chegar o momento da conexão real, use `.env.local` em desenvolvimento ou as variáveis equivalentes na Vercel:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
```

Esses valores são a configuração pública do Firebase Web App. Nunca coloque credenciais administrativas ou chaves de service account no frontend ou no repositório.

Sem essas variáveis, o Prontuário de Climatização continua funcionando como protótipo local e não tenta se apresentar como sincronizado na nuvem.

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

`npm run test:firestore` executa Security Rules e adapters no Firestore Emulator, inclusive o contrato futuro do Prontuário de Climatização.

## Qualidade

Na release candidate Firebase validada em 16/08/2026:

- `npm audit`: 0 vulnerabilidades;
- lint/testes de domínio: aprovados;
- build Vite: aprovado;
- Security Rules: aprovadas no Emulator;
- adapter Firestore: aprovado no Emulator;
- Playwright/Axe do sistema operacional: 13/13 cenários aprovados, incluindo temas claro/escuro;
- snapshots visuais Linux/Chromium: atualizados e aprovados.

O MVP do prontuário possui testes próprios para domínio, persistência futura, preenchimento, recarga do rascunho e layout responsivo.

## Regras de negócio principais

- status encerrados não entram nos alertas;
- SLA/inatividade: alerta a partir de 7 dias e severo a partir de 15 dias;
- antiguidade: alerta a partir de 30 dias em aberto e severo a partir de 60 dias;
- setores principais: GOP, GIN, CPS e CTO;
- IDs de chamados usam o exercício dinamicamente, sem literal fixo de 2026;
- o prontuário não altera prioridade, status ou métricas de chamados nesta fase.

## Documentação técnica

- `docs/ESTADO_DO_PROJETO.md`: situação operacional e próximos passos;
- `docs/ARQUITETURA_FIREBASE.md`: decisões arquiteturais;
- `docs/MIGRACAO_SUPABASE_FIREBASE.md`: histórico e critérios do cutover;
- `docs/superpowers/specs/2026-08-16-prontuario-climatizacao-mvp-design.md`: desenho funcional do MVP;
- `docs/superpowers/plans/2026-08-16-prontuario-climatizacao-mvp.md`: plano de implementação;
- `firestore.rules`: regras de segurança versionadas;
- `firestore.indexes.json`: índices Firestore;
- `firebase.json`: configuração do Emulator/Firestore.

O **código-fonte executável é a fonte de verdade**. Documentação histórica serve como contexto e não prevalece sobre o comportamento implementado.
