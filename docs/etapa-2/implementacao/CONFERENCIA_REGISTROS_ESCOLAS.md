# Conferência de registros escolares — primeiro incremento real

**Branch:** `feat/etapa2-conferencia-escolas` | **PR:** #26, dependente do #25.  
**Natureza:** consulta de registros operacionais, sem efeito de medição, atestação ou faturamento.

## Propósito
Apoiar o gestor a localizar escolas com chamados **sem conclusão informada no GOP Clima**, abrindo registros existentes em vez de exigir duplicação de dados.

## Fontes em uso
- `schools`: cadastro de unidades já existente no App/Firestore.
- `tickets`: chamados operacionais existentes, com `status_atual`, `designacao`, `unidade_escolar`, `criado_em`/`data_solicitacao`.
- Os filtros aplicam **mês de abertura do chamado**, não competência da manutenção.

## Os três recortes
- **A conferir**: existe ao menos um chamado no recorte cujo status não é `10 - Concluído` nem `11 - Encerrado`. Não equivale a atendimento contratual não realizado.
- **Com conclusão**: existem chamados e todos estão concluídos/encerrados. Não equivale a atesto formal.
- **Sem solicitação**: não existem chamados com data válida no recorte. Não equivale a escola não atendida.

Chamados sem data válida não são atribuídos artificialmente ao mês; quando houver, são sinalizados. Chamados que não se relacionam ao cadastro também são quantificados para conferência.

## Ações do usuário
- **Dossiê**: navega para a ficha da escola existente, com os registros e recursos de acompanhamento disponíveis.
- **Chamados**: navega para a lista real e pesquisa a escola selecionada.
- Pesquisa por nome/designação/bairro; categorias interativas; lista de oito registros com expansão para os demais; nenhum registro administrativo novo obrigatório.

## Fora do escopo
O site não dispõe, nesta entrega, de um cadastro confiável de atendimento preventivo efetivamente executado por escola e competência. Logo **não produz lista de escolas contratualmente não atendidas**. Essa informação dependerá da integração futura da programação e dos resultados informados por gestores/fiscais, sem impor travas artificiais (DP-001).

## Testes
- `test/school-record-review.test.mjs`: recortes, misturas de status, datas, vínculos, ausência e imutabilidade.
- `e2e/finance-first-iteration.spec.js`: interação real com filtros, dossiê e lista.
- Visuais: `src/styles/finance.css`, CSS e fontes existentes (DP-002/DP-003).

**Publicação:** nenhuma alteração de produção sem revisão do PR e validação do CI.
