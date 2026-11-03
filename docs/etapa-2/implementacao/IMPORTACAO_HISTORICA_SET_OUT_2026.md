# Evidência da base histórica de corretivas — setembro/outubro de 2026

**Origem preservada:** `SETEMBRO.xlsx`, aba `Setembro`, intervalo `A2:M87`; arquivo presente na Biblioteca do projeto CLIMATIZAÇÃO, hash SHA-256 `8ee3a04108a11c9c6cf7d2efede2e0f25c16917f63fcd695df2e1831d43a282b`. Data do lançamento: coluna **E**, formato serial Excel; escola: colunas A–C; tipo/BTU: H/I; situação: K. **O nome da aba não determina a competência financeira.**

## Confrontação com a fonte

| Medida | Set/2026 | Out/2026 | Total |
|---|---:|---:|---:|
| Linhas de registro | 41 | 44 | **85** |
| `RESOLVIDO` | 34 | 14 | 48 |
| `EM ANDAMENTO` | 4 | 28 | 32 |
| `IMPRESTABILIDADE` | 1 | 2 | 3 |
| `PENDENTE` | 2 | 0 | 2 |

- **25 escolas únicas** e **28 combinações escola/mês**.
- **57 Split** e **28 ACJ**, conforme os campos informados no arquivo.
- **8 possíveis repetições** por coincidência de escola, data, ambiente, número, tipo, capacidade e situação. Não se pode eliminar automaticamente uma coincidência: podem existir aparelhos diferentes com dados iguais.
- **6 linhas com designação em branco nas colunas específicas**, recuperável do texto da coluna A. Mantidas como exceção de qualidade de origem.
- Data mínima 25/09/2026 e máxima 20/10/2026. A ausência de informações depois dessa data **não comprova ausência de serviços posteriores**.

## Uso permitido no GOP Clima

O componente `HistoricCorrectionsPanel.jsx` utiliza apenas agregados por escola/mês com referências às linhas da planilha. É uma **fotografia estática de histórico operacional**, não fluxo online de chamados nem confirmação fiscal. Foram excluídos da versão publicável endereços, localização exata das salas e detalhes textuais livres. Não altera dados de escola, chamado, OES, atendimento financeiro ou Firestore.

A visualização permite comparar situações entre meses, aplicar filtro global por escola, filtrar o mês, abrir grupo e identificar as linhas de origem; onde existe correspondência confirmada no cadastro escolar do site, oferece acesso ao dossiê existente. A escola de origem permanece identificada pelo código, sem deduplicação automática.

### Não transformar em medição/faturamento

O arquivo **`02_Execucao_Fiscalizacao_e_Medicao_V4_1_MODULO 02.xlsx`**, verificado separadamente, contém exemplos/pilotos de uma OES preventiva e de auditoria de 85 corretivas, com fórmulas de preços, glosas, IMR e medição mensal. Esses valores e expressões como “atestada” na planilha **não constituem por si só evidência de atestação ou valor contratual devido**. Não foram importados para os indicadores financeiros do site, nem tratados como transações oficiais. Para usar valores, é necessária conciliação com OES e boletins efetivamente aprovados, tabelas de preços contratuais e documentos do processo.

No painel de previsão econômica, as fontes continuam sendo os **atendimentos registrados no Firestore de desenvolvimento**. O backend emulado não está acessível ao navegador do site remoto, conforme DP-004. A visualização histórica, em contrapartida, é **consultável pela internet sem criar contas ou permitir gravações**.

## Critérios de auditoria

- Testes puros: `test/historic-corrections.test.mjs` conferem contagem, distribuição mensal, status, tipos, exceções, linhas 3–87 e filtragem por escola.
- Testes de navegador: `e2e/finance-first-iteration.spec.js` valida o caminho Gestão Financeira → mês → escola → linhas, além de capturas em 320/1440/3840 pixels, claro/escuro, sem rolagem horizontal global.
- Identidade visual: Outfit/Inter, Lucide, tokens existentes; o painel é distinguido semanticamente da **previsão financeira**.
- Não apresentar comparações setembro/outubro como tendência financeira, pois se trata de meses da **data do registro** e não da competência de medição.
