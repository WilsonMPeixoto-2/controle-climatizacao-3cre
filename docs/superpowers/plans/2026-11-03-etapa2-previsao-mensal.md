# Etapa 2 — Previsão mensal vinculada aos atendimentos

**Base:** `master` atualizada após PR #32. **Objetivo:** consolidar somente os atendimentos financeiros já persistidos no Firestore de desenvolvimento, por escola e competência, sem duplicação de revisões e sem somar grandezas heterogêneas.

**Escolha de desenho:** leitura junto às estimativas existentes na Gestão Financeira. Exibir seis competências, selecionar mês e abrir a composição do atendimento; conservar o gráfico operacional de abertura de chamados. Sem biblioteca de gráficos adicional. Dados vazios são assumidos como ausentes e valores sintéticos apenas nos testes.

**Separação de grandezas:** (i) preço nominal de referência; (ii) acréscimo com cobertura adicional informada; (iii) referência sem enquadramento de cobertura comprovado; (iv) nominal já incluído na cobertura, que não gera novo acréscimo. Os valores de (ii), (iii) e (iv) não constituem o valor da nota fiscal ou do pagamento e não devem ser somados em um indicador financeiro contratual de despesa.

**Testes:** deduplicar pelo ID/revisão mais recente; reprogramação de novembro para dezembro; filtro escolar; ausência vs. preço zero; proteção de overflow; registro inválido explicitado; clique no mês e na composição; manter 57 Playwright baseline e 9 financeiros, adicionando cenários econômicos necessários.

**Limites:** a persistência remota continua restrita ao emulador local. Nenhum novo backend em produção, login, perfil, atesto ou cobrança automática nesta etapa, conforme DP-001 a DP-004.

**Fluxo:** um PR da Etapa 2 baseado diretamente em `master`; testes e capturas, avaliação do responsável, depois integração. Sem PRs empilhados, merge ou deploy antecipado.
