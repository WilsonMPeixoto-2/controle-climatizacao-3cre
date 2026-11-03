# DP-004 — Autenticação individual adiada durante o desenvolvimento

**Projeto:** GOP Clima 3ª CRE · Etapa 2  
**Decisão de Produto:** DP-004  
**Situação:** diretriz expressa do responsável pelo produto, consolidada para desenvolvimento  
**Registrada em:** 02/11/2026 (horário de Brasília)  
**Aplicabilidade:** etapas atuais de desenvolvimento, integração, testes e homologação técnica **anterior à entrega aos servidores**.  
**Referência curta para agentes:** **DP-004 — sem login na fase de desenvolvimento**.

## 1. Decisão expressa

O GOP Clima **não está sendo utilizado operacionalmente pelos servidores durante a atual fase de reconstrução e desenvolvimento**. Por decisão deliberada do responsável pelo produto, **tela de login, cadastro de usuários, perfis individuais e autenticação individual serão implementados somente nas etapas finais de preparação para a entrega institucional**.

A ausência desses mecanismos **não constitui defeito urgente, pendência impeditiva ou motivo para interromper a implementação das capacidades financeiras**. O ambiente deve continuar acessível diretamente a agentes de IA, desenvolvedores e ferramentas de teste, sem exigir que o responsável se autentique repetidamente.

**A presente decisão altera a prioridade e a ordem de implementação, não elimina o requisito de autenticação antes da utilização institucional.**

## 2. Consequências obrigatórias para a Etapa 1 e as seguintes

1. **Não criar nesta fase:** tela de login, fluxo de cadastro, autenticação individual obrigatória, papéis de usuários, perfis de servidores ou um portal paralelo de permissões.
2. **Não bloquear a entrega funcional por ausência de login:** construir os vínculos escola–atendimento–item–referência econômica, cálculos, interface contextual e persistência compartilhada.
3. **Persistência real de desenvolvimento:** usar o Firestore e o adaptador do projeto quando houver necessidade de acesso compartilhado; armazenamento apenas no navegador não comprova sincronização entre sessões/dispositivos.
4. **Validações técnicas permanecem obrigatórias:** integridade de identificadores, tipos, valores, vínculos, origem, ausência versus zero, prevenção de corrupção e testes de concorrência pertinentes.
5. **Testes sem contas de servidores:** comprovar criação, consulta, alteração e sincronização entre duas sessões de desenvolvimento, sem exigir autenticação individual. Rejeitar dados estruturalmente inválidos ou mutações fora do contrato de dados.
6. **Dados de teste:** são admitidos dados reais adequados ao ambiente de desenvolvimento, sintéticos ou mocks. Identificar fontes e cenários; **não apresentar mocks como resultados reais do contrato**. Preferir dados sintéticos/anônimos para testes públicos e não publicar dados pessoais ou financeiros sensíveis em repositórios e endpoints abertos.
7. **Facilitar autenticação futura:** separar a camada de acesso a dados e prever um ponto de extensão para autorização, **sem implementar agora** a experiência de login ou uma infraestrutura extensa de perfis.
8. **Não inventar autoria:** sem identidade autenticada, timestamps, IDs de sessão e campos informados não provam quem foi o servidor responsável. Não anunciar auditoria individual autenticada enquanto ela não existir.

## 3. Condições técnicas e limites da flexibilização

A decisão de não exigir login **não autoriza expor indiscriminadamente bases reais sensíveis em Firestore público** nem tornar gravações irrestritas em bases de produção. Para testar gravações compartilhadas sem autenticação individual, use **ambiente/projeto Firebase de desenvolvimento ou emulador isolado**, com dados apropriados e regras explicitamente identificadas como temporárias e restritas a essa finalidade.

Não enfraqueça silenciosamente as regras do ambiente de produção. Caso o projeto Firebase de desenvolvimento ainda não esteja separado, documente a configuração necessária e teste a implementação no emulador ou ambiente de homologação; **não marque um teste só local como prova de sincronização no backend real**.

Esta diretriz também não altera as regras de negócio: atendimento planejado ≠ executado, estimativa ≠ apuração, chamado concluído ≠ atesto, NF ≠ liquidação ≠ pagamento. Revisões humanas e origem dos valores permanecem essenciais.

## 4. Como adaptar o critério de aceite da Etapa 1

**Substituir temporariamente** o requisito “edição não autorizada rejeitada por identidade individual” por:

- Gravação/releitura/edição por **duas sessões de desenvolvimento**, persistidas no backend de teste e sem login.
- Regras e validações recusam estruturas inválidas e impedem inconsistências técnicas verificáveis.
- Dados e alterações são identificáveis por ID, versão e data; a interface não declara uma identidade individual comprovada.
- O código mantém fronteira clara entre domínio, persistência e futura autorização.
- Conclusão funcional da Etapa 1 não depende da existência de formulário de login ou controle de perfis.

O requisito de **autorização por usuário** não foi cancelado: deverá ser entregue e testado antes de expor o sistema aos servidores, em etapa de preparação para uso institucional.

## 5. Hierarquia documental, rastreabilidade e retomada

Esta decisão complementa a [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md), a [DP-001](./DP-001_FERRAMENTA_DE_GESTAO_NAO_REGULATORIA.md), a [DP-002](./DP-002_CONTINUIDADE_FUNCIONAL_INFORMACIONAL_VISUAL.md) e a [DP-003](./DP-003_INTELIGENCIA_VISUAL_EXPLORACAO_INTERATIVA.md).

**Prevalece exclusivamente quanto ao momento de implementar autenticação** sobre instruções anteriores que a tratam como pré-requisito da Etapa 1, inclusive o roteiro E1–E5 e a versão original do [Prompt Codex de execução por etapas](../planejamento/PROMPT_CODEX_EXECUCAO_FINANCEIRA_POR_ETAPAS.md). Não prevalece sobre obrigações reais de segurança de informação, integridade, regras contratuais ou exigências futuras de operação institucional.

**Leitura obrigatória:** AGENTS.md e o prompt Codex devem apontar diretamente à DP-004. Agentes que retomarem uma tarefa em progresso devem **conferir esta decisão antes de continuar**, sem reiniciar a leitura de todos os documentos ou recomeçar a implementação.

**Portão de entrega institucional (futuro):** antes da disponibilização aos servidores, definir autenticação, perfis, regras de autorização do Firestore, rastreabilidade individual, migração segura das regras temporárias e testes de acesso. Nenhuma configuração de desenvolvimento permissiva deve ser promovida automaticamente para uso real.
