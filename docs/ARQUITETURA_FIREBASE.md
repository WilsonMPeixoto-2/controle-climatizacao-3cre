# Arquitetura Firebase Spark

## 1. Objetivo

Este documento registra a arquitetura-alvo do Controle de Climatização da GOP/3ª CRE para a substituição da persistência Supabase/PostgreSQL por Cloud Firestore, preservando a hospedagem Vercel e o funcionamento sem autenticação individual.

A migração será incremental. O código-fonte executável permanece a fonte de verdade. Documentos históricos servem como contexto, mas não prevalecem sobre o comportamento efetivamente implementado.

## 2. Decisões de arquitetura

### 2.1. Permanecem

- React e Vite no frontend;
- hospedagem e deploy pela Vercel;
- modo local/fallback durante a transição;
- regras de domínio atuais;
- acompanhamento multiusuário/realtime;
- ausência de tela de login, cadastro de usuários e perfis individuais de acesso;
- estrutura de dados conceitualmente equivalente a escolas, chamados, histórico e modelos de e-mail.

### 2.2. Mudam

- Supabase/PostgreSQL -> Cloud Firestore;
- RPCs PostgreSQL -> Firestore Transactions / Write Batches;
- Supabase Realtime -> listeners `onSnapshot`;
- sequence/trigger de número de chamado -> contador Firestore por exercício;
- chamadas diretas ao SDK no `App.jsx` -> fachada de persistência/repositórios;
- configuração manual URL/key Supabase -> configuração Firebase por ambiente.

### 2.3. Ficam fora desta fase

#### Upload e armazenamento de anexos

O repositório possui implementação real de anexos em `src/lib/attachments.js` e pontos de entrada na interface. Essa implementação depende de Supabase Storage e de RPCs para coordenar metadados e histórico.

Entretanto:

- a funcionalidade foi tratada historicamente como evolução documental posterior;
- o snapshot local versionado (`src/data/db.json`) não contém `anexos_chamado` nem os campos de metadados de arquivo pesquisados;
- a migração atual deve permanecer no plano Firebase Spark, sem cadastro de meio de pagamento;
- Cloud Storage for Firebase não será requisito desta fase.

Assim, a capacidade de anexos será preservada como funcionalidade futura/legada, mas não será conectada ao Firebase nesta migração. O banco principal não poderá depender do módulo de anexos para inicializar, ler, gravar ou sincronizar chamados.

## 3. Modelo Firestore alvo

```text
escolas/{designacao}
chamados/{id_chamado}
historico/{id_evento}
modelos_email/{id}
contadores/chamados-{AAAA}
```

A coleção `anexos_chamado` não integra o primeiro cutover Spark.

## 4. Fronteira de persistência

A UI não deve importar ou manipular diretamente um cliente Firebase. A aplicação consumirá uma fachada neutra, com contratos equivalentes a:

```text
loadInitialData()
createTicketWithHistory(ticket, initialEvent)
updateTicketWithHistory(ticket, events)
insertHistoryEvent(event)
subscribeOperationalData(callbacks)
```

A infraestrutura Firebase implementará esses contratos.

Objetivo: uma futura troca de backend não deve exigir nova cirurgia no `App.jsx`.

## 5. Atomicidade

As operações hoje protegidas por RPC continuarão atômicas:

### Criação de chamado

Uma transação deverá:

1. ler o contador do exercício;
2. reservar o próximo número;
3. gerar `GOP-AR-{AAAA}-{NNNN}`;
4. criar o documento do chamado;
5. criar o evento inicial do histórico;
6. atualizar o contador.

Nenhum ID oficial será emitido localmente antes da confirmação da persistência remota.

### Atualização de chamado

Alteração do chamado e seus novos eventos de histórico deverão ser persistidos como uma única unidade lógica por transaction/write batch, conforme necessidade de leitura concorrente.

## 6. Identificadores e modo offline

O literal `2026` será removido da geração de identificadores. O exercício será derivado da data aplicável à criação.

Chamados ainda não confirmados na nuvem utilizarão identificador não oficial:

```text
RASCUNHO-<uuid>
```

Isso evita colisões entre dispositivos e impede que um registro somente local pareça oficialmente persistido.

## 7. Realtime

O comportamento atual do Supabase recebe um evento realtime e posteriormente refaz consultas completas de chamados e histórico.

No Firestore, os snapshots recebidos pelos listeners deverão atualizar diretamente o estado relevante, evitando o padrão evento -> debounce -> refetch integral.

## 8. Segurança sem login individual

A decisão histórica do produto de não possuir autenticação individual será preservada nesta fase.

Consequências técnicas devem permanecer explícitas:

- Security Rules controlarão quais coleções, operações e formatos são aceitos;
- regras de validação podem limitar estrutura e operações, mas não devem ser apresentadas como identidade de usuário inexistente;
- mecanismos adicionais compatíveis com o plano adotado, como App Check, poderão ser utilizados para reduzir abuso por clientes não legítimos, sem serem confundidos com autorização individual;
- introdução futura de autenticação exigirá decisão funcional própria e documentação específica.

## 9. Testes

A estratégia alvo inclui:

- testes puros de domínio;
- testes dos repositórios;
- Firebase Emulator Suite;
- testes versionados de Firestore Security Rules;
- Playwright E2E;
- build Vite em CI;
- validação de preview Vercel antes do merge.

## 10. Legado Supabase

A pasta `supabase/`, migrations e documentação histórica não será apagada no início da migração. Permanecerá disponível para rastreabilidade até o Firestore estar homologado.

Somente no cutover serão removidas as dependências ativas do SDK/CLI Supabase, variáveis de ambiente e integrações executáveis. O material histórico poderá então ser movido para `docs/legacy/supabase/`.

## 11. Ordem de execução

1. baseline técnico;
2. atualização controlada de dependências;
3. registro formal da situação dos anexos;
4. criação da fronteira neutra de persistência;
5. implementação Firestore/Emulator/Rules;
6. correção de IDs e offline;
7. seed/migração validada dos dados;
8. cutover Supabase -> Firebase;
9. conciliação documental;
10. verificação final, PR e somente depois integração em `master`.
