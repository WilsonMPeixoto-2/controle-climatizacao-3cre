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

### 9.1. Etapa 1 financeira — desenvolvimento sem login (DP-004)

O atendimento econômico usa uma fronteira própria (`attendancePersistence.js`), consumida pela interface através de um hook. O adaptador grava em `atendimentos_economicos/{id}` e cria simultaneamente o snapshot completo `revisoes/v{revision}`. Transações conferem a revisão esperada; ID e data de criação permanecem estáveis. Correções de escola revalidam seus vínculos e preservam a composição anterior no histórico. Valores usam inteiros de R$ 0,0001; ausência continua `null` e zero informado continua zero. Não há total financeiro presumido a partir de status de chamado.

**Atualização de implementação (PR #34):** a conexão financeira reutiliza por padrão a mesma instância Firebase/Firestore operacional do GOP Clima, configurada pelas variáveis `VITE_FIREBASE_*`. As coleções `atendimentos_economicos` e `revisoes` foram incluídas nas regras `firestore.rules`, preservando as regras de chamados e escolas. **A gravação só funcionará remotamente depois da publicação dessas regras no projeto Firebase existente.** O emulador `demo-gop-clima-financeiro` continua disponível unicamente ao executar testes ou `npm run dev:finance` com `VITE_FINANCE_FIRESTORE_EMULATOR`. Não se cria segundo Firebase nem login individual. Sessão e responsável informado são apenas informações de contexto.

Para experimentar com os vínculos já existentes na aplicação, execute `npm run dev:finance` (Node 24, Java 21 e dependências instaladas) e abra `http://localhost:5175`. O comando inicia o emulador em `127.0.0.1:8082`, carrega apenas os identificadores de escolas/chamados do snapshot local e habilita `VITE_FINANCE_FIRESTORE_EMULATOR=127.0.0.1:8082`. Duas sessões de navegador compartilham os atendimentos por esse backend. Se a aplicação estiver configurada com outro cadastro operacional, seus identificadores também precisam existir no emulador de desenvolvimento. Sem a variável, a interface utiliza o Firebase operacional configurado; se as variáveis operacionais estiverem ausentes ou o banco negar acesso, o estado de conexão é apresentado como indisponível.

As referências são informadas ou provisórias, com origem identificada e versão opcional. Esta entrega não contém tabela oficial de preços. A composição salva preserva os valores usados; alterar uma referência gera nova revisão. `sourceRef` identifica o preço e `coverageSourceRef` identifica separadamente a informação de cobertura. Somente cobertura incluída com essa referência e quantidade conhecida produz incremento adicional estimado zero; o preço nominal conhecido permanece registrado, ou sua ausência continua explícita. Completude aritmética não confirma cobertura. Previsão consolidada, apuração, atesto e faturamento continuam nas próximas etapas.

Há um limite técnico de **quatro grupos e oito chamados por atendimento**, validado inclusive no pior cenário de criação/edição para respeitar os limites de expressões e leituras das Firestore Rules. O documento principal valida metadados, vínculos e primeiro grupo; o snapshot valida os demais grupos. A igualdade exigida nos dois sentidos com `getAfter` obriga a gravação atômica dos dois documentos, sem duplicar a validação. Crescimento desse contrato exige rever o modelo e repetir os testes de limites, sem retirar validações. Os demais cadastros são somente leitura nesse ambiente.

Verificação reproduzível:

- `npm run test:finance:backend`: duas sessões sem Auth, sincronização, revisões, concorrência e rejeição de escritas inválidas diretamente pelo SDK, com regras do emulador financeiro isolado.
- `npm run test:finance:cloud-rules`: **as mesmas operações** contra `firestore.rules` do projeto operacional, em um emulador local que não modifica dados na nuvem.
- `npm run test:finance:e2e`: interface completa com Firestore do emulador, dois contextos de navegador, cadastros sintéticos, quatro casas decimais, edição, entradas contextuais, acessibilidade e capturas reais. Somente o seed dos vínculos usa contexto administrativo do emulador; as gravações financeiras passam pelas regras.

Os testes reiniciam somente a base sintética isolada. O emulador desta configuração é temporário e perde os dados ao ser encerrado; os testes demonstram persistência e sincronização **no backend emulado**, inclusive após recarregar o navegador. Não constituem homologação de sincronização em um projeto cloud ou de uso institucional. Para preservar dados de exploração entre execuções do emulador, use os recursos `--import` e `--export-on-exit` da Firebase CLI em um diretório local ignorado (`.firebase-finance/`). A futura configuração institucional deverá implementar a preparação de acesso prevista na DP-004.

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
