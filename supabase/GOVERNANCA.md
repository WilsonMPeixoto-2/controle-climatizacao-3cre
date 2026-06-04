# Guia de Governança, Segurança e Estabilidade do Supabase
**Projeto:** Controle de Climatização — GOP 3ª CRE (SME/RJ)

Este documento estabelece as diretrizes oficiais de administração, segurança, monitoramento e integridade do banco de dados no Supabase. Qualquer alteração ou nova fase de desenvolvimento deve seguir rigorosamente os protocolos abaixo.

---

## 1. Protocolo de Modificação e Alterações Grandes (Pipeline de Deploy)
Antes de realizar qualquer alteração estrutural (DDL/DML) em produção, siga este checklist de proteção de dados:
1. **Exportar Schema:** Realizar o backup do schema atual do banco.
2. **Exportar Dados:** Fazer backup das tabelas operacionais críticas:
   * `escolas`
   * `chamados`
   * `historico`
   * `anexos_chamado`
   * `modelos_email`
3. **Log de Alteração:** Registrar a data, hora e autor da alteração.
4. **Execução:** Aplicar a mudança (via migrations ou SQL Editor).
5. **Validação de Testes:** Executar os testes SQL locais e testar os fluxos centrais no site.

---

## 2. Auditoria Permanente com Supabase Advisors
O monitoramento do banco deve ser feito de forma contínua usando a ferramenta nativa de diagnóstico do Supabase (*Database > Advisors*).
* **Frequência:** A cada novo ciclo de desenvolvimento ou mensalmente.
* **Foco:** Priorizar alertas de **Segurança** e depois de **Performance** (Query Optimization/Indexation).
* **Rollback:** Nunca fazer alterações sugeridas sem um plano claro de reversão de código.

---

## 3. Segurança RLS (Row Level Security) e Perfis de Acesso
Para o MVP, o acesso de gravação foi liberado para o perfil `anon` para viabilizar os testes. Antes de abrir a aplicação para piloto amplo ou múltiplos usuários, as permissões RLS devem ser refinadas:

| Tabela | Leitura (SELECT) | Escrita Recomendada (INSERT/UPDATE/DELETE) |
| :--- | :--- | :--- |
| **`escolas`** | Pública/Autenticada | Apenas Administradores (GOP) |
| **`chamados`** | Autenticada | Usuários Autorizados |
| **`historico`** | Autenticada | Inserção Controlada por API/Triggers |
| **`anexos_chamado`**| Autenticada | Usuários Autorizados (Donos do Chamado) |
| **`modelos_email`** | Autenticada | Apenas Administradores (GOP) |

---

## 4. Governança de Funções `SECURITY DEFINER`
Funções que executam com privilégios de superusuário (`SECURITY DEFINER`) precisam de controle de execução estrito:
* **`generate_next_id_chamado()`**: Avaliar se a chamada pode ser restrita apenas à execução interna da Trigger de banco de dados, revogando privilégios de execução direta pública (`anon`/`authenticated`).
* **`save_ticket_with_history(...)`**: Manter a função encapsulada para garantir atomicidade, mas restringir sua execução via RPC apenas a usuários devidamente autenticados e autorizados.

---

## 5. Organização de Extensões
* **Extensões Ativas:** As seguintes extensões estão ativas no banco de dados:
  * `unaccent` (Remoção de acentos em buscas textuais)
  * `moddatetime` (Auditoria e atualização automática de data/hora de alteração)
  * `pg_trgm` (Busca e ordenação por similaridade/trigramas de texto)
  * `http` (Disparos e integrações diretas do banco via requisições HTTP)
* **Futuro:** Em fases de consolidação de arquitetura, planejar a migração de extensões PostgreSQL para um schema dedicado (como `extensions`) para manter a estrutura `public` limpa e isolada para os dados da aplicação.
* **Cuidado:** Realizar testes de regressão de busca textual ao mover a extensão para garantir que nenhuma query dependente pare de funcionar.

---

## 6. Governança e Auditoria do Supabase Storage
O bucket `gop-anexos` deve ser auditado recorrentemente:
* **Limites:** Manter o tamanho máximo de arquivo em **10MB** e MIME types estritos (PDF, JPEG, PNG, WEBP).
* **Auditoria de Órfãos:** Executar consultas SQL para cruzar os arquivos físicos registrados no Storage com os registros lógicos da tabela `anexos_chamado` para identificar e limpar eventuais arquivos órfãos.

---

## 7. Views Gerenciais e Funções de Diagnóstico (Ativas)
Foram criadas views gerenciais e funções de auditoria para monitorar o estado do banco diretamente via SQL:

*   **`diagnostico_operacional()`**: Função SQL que faz uma varredura completa no banco de dados e retorna contagens de escolas, chamados, anexos, registros órfãos (tabelas sem vínculo correspondente), status inválidos e prioridades fora do padrão. Para executar:
    ```sql
    SELECT * FROM public.diagnostico_operacional();
    ```
*   **`vw_chamados_por_status`**: Agrega os chamados por etapa do fluxo operacional.
*   **`vw_chamados_por_bairro`**: Mostra a distribuição territorial dos chamados (ativos e totais).
*   **`vw_chamados_ativos`**: Filtro rápido de chamados com status diferente de Concluído/Encerrado.
*   **`vw_escolas_resumo_climatizacao`**: Consolida as métricas físicas e calcula o percentual de climatização das escolas.
*   **`vw_chamados_sem_anexo`**: Lista os chamados ativos que necessitam de anexo (para o fluxo de auditoria física).
*   **`vw_chamados_sem_movimentacao`**: Lista chamados ativos ordenados pelo tempo sem atualização em dias (controle de SLA).
*   **`vw_integridade_operacional`**: View que retorna o log de todas as inconsistências e registros órfãos detectados no banco de dados.

---

## 8. Logs de Depuração (Troubleshooting Protocol)
Em caso de falha operacional no site, a primeira linha de investigação deve ser o painel de logs do Supabase (*Project > Logs*), identificando:
* Erros de violação de RLS (recusas de requisições do frontend).
* Falhas em chamadas de funções remotas (RPC).
* Erros de limite de requisições (Rate Limiting).
