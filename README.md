# Controle de Climatização — GOP/3ª CRE

Aplicação web para registrar, consultar e acompanhar chamados de climatização das unidades escolares acompanhadas pela GOP/3ª CRE.

O sistema substitui controles manuais por uma rotina única para registro de demanda, acompanhamento de status, identificação do setor responsável, histórico, consulta por unidade, indicadores, mapa operacional e preparação de comunicações.

## Estado atual

A aplicação foi migrada da persistência Supabase/PostgreSQL para **Firebase Cloud Firestore**, mantendo React/Vite no frontend e Vercel na hospedagem.

**Atualização de 03/11/2026:** a evolução consolidada no PR [#32](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/32) foi integrada à `master` (commit `16274ae5`) e publicada no projeto Vercel de homologação Firebase, deployment `dpl_CGtyz88nt38QkXP31M3D6SiPBZN7`, estado `READY`, em https://climatizacao-firebase-homologacao.vercel.app/. Esta informação substitui o estado provisório de migração registrado em agosto/2026.

A interface agora inclui **Gestão Financeira**, conferência de chamados por escola, planejamento local de visitas e prévia de estimativas econômicas. **A gravação de atendimentos financeiros ainda depende do emulador Firestore local de desenvolvimento e não está disponível pela internet.** A **consolidação por competência** pode ser calculada em desenvolvimento a partir dos atendimentos econômicos; **a persistência financeira remota, medição, faturamento, liquidação e pagamentos continuam indisponíveis para uso institucional**. Leia o [registro consolidado da entrega](docs/etapa-2/implementacao/RELEASE_CONSOLIDADA_2026-11-03.md) antes de planejar novos incrementos.

## Etapa 2 — visualização e qualidade dos dados

A Gestão Financeira incorpora **previsão mensal por escola/competência**, com valores nominais, acréscimos e cobertura pendente apresentados separadamente. Os atendimentos que alimentam a previsão continuam no **Firestore Emulator de desenvolvimento**, não no site público. A ausência de backend remoto é informada na interface, sem números inventados.

A seção **Corretivas: setembro e outubro** reproduz um recorte histórico **somente de leitura** da planilha `SETEMBRO.xlsx` (85 linhas, 25 escolas, 8 coincidências que podem representar duplicidade, 6 designações recuperadas). Agrupa pela **data do registro**, não pela competência de medição ou mês de pagamento, permite filtrar mês e escola e mostra as linhas de origem. Não contém valores a faturar nem supõe atesto. Veja [proveniência e limitações do recorte histórico](docs/etapa-2/implementacao/IMPORTACAO_HISTORICA_SET_OUT_2026.md).

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
- upload de anexos no Firebase Storage;
- salvamento financeiro remoto compartilhado e rotinas de faturamento/medição (a desenvolver).

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
