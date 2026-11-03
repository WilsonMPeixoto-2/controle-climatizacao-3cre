# Decisão de Produto 001 — Ferramenta de gestão não é instrumento regulatório

**Projeto:** GOP Clima 3ª CRE · Etapa 2  
**Data:** 01/11/2026  
**Origem:** orientação expressa do usuário, reiterando diretriz já discutida na construção dos módulos Excel.  
**Situação:** **diretriz de produto consolidada**; complementar à Carta de Princípios v1.0 e à Concepção Funcional v1.0.  
**Escopo:** planilhas Excel, site, regras financeiras, jornadas de uso, validação de dados, planejamento de implementação e revisão de qualidade.

## 1. Enunciado

> **Os sistemas e planilhas criados para apoiar a gestão não são instrumentos normativos nem substituem a competência de gestores e fiscais.**
>
> O sistema calcula, organiza, compara, alerta e registra. Quem decide quantos equipamentos e escolas foram efetivamente atendidos, como reprogramar demandas, qual valor foi apurado, o que foi atestado e quando informar o valor para faturamento são as pessoas responsáveis pela execução e gestão, segundo os procedimentos aplicáveis. A ferramenta não deve tomar essas decisões em seu lugar.

A interface deve **facilitar correções e adaptações**, em vez de impor como limites imutáveis as hipóteses usadas durante o planejamento do software.

## 2. Regras práticas para implementação

| Situação de trabalho | Comportamento recomendado | Antipadrão |
|---|---|---|
| Número de escolas e equipamentos diferente do planejamento | Usuário ajusta o dado aplicável e o sistema recalcula; divergência pode ser exibida informativamente. | Bloquear o uso por não coincidir com a base inicial de 134/136 escolas ou 3.061/3.253 equipamentos. |
| Mudança do mês de atendimento ou dos ciclos | Permitir reprogramação, atualizar projeções e preservar histórico mínimo. | Tratar uma data ou uma única visita por ciclo como condição inalterável. |
| Tipo/BTUs não cadastrados ou informação conflitante | Prosseguir no registro da demanda e oferecer edição de dados ou referência manual, distinguindo o que foi informado. | Inventar o valor, exigir inventário completo ou impedir registrar o chamado. |
| Valor unitário ou composição de referência ainda sujeitos a conferência | Permitir trabalhar com valores **provisórios claramente identificados** e revisá-los. | Bloquear todas as simulações por falta de status de 'catálogo validado'. |
| Estimativa calculada diferente do resultado apurado | Permitir informar e ajustar o valor de apuração por responsável, mantendo distinção entre as grandezas. | Transferir o cálculo automático para faturamento ou obrigar coincidência com a estimativa. |
| Um chamado concluído | Manter registro operacional independente da situação financeira. | Converter automaticamente o status em atesto, NF, pagamento ou glosa. |
| Dois atendimentos no mesmo aparelho/período | Sinalizar possível repetição ou sobreposição e oferecer conferência e ajuste. | Deduplicar, eliminar custo ou recusar lançamento automaticamente sem considerar a decisão do usuário. |
| Documentos e atos externos de fiscalização | Permitir registrar o **resultado informado** quando pertinente, sem reconstruir o rito. | Exigir no site todos os documentos, assinaturas ou etapas externas antes de liberar funções gerenciais. |

## 3. Qual a diferença entre um alerta e uma trava?

**Alerta não impeditivo:** “Quantidade diferente do planejamento inicial. Confira se a alteração está correta.” A quantidade continua editável e a projeção pode ser atualizada.

**Validação técnica essencial:** impedir que `NaN`, uma string onde se espera valor numérico, IDs estruturalmente inválidos ou uma gravação não autorizada corrompam o banco. É obrigação de qualidade do software, não uma decisão administrativa.

**Ação administrativa:** avaliação, confirmação e atestação de execução continuam nas mãos do servidor competente. O sistema deve registrar o que o usuário informou, não fabricar o ato nem exigir uma cadeia burocrática própria.

**Princípio:** segurança técnica e rastreabilidade proporcional, **sem tutela do julgamento do servidor**.

## 4. Parâmetros, preços e referências financeiras

A tabela contratual e o cronograma são **fontes de referência**, não fontes de bloqueios operacionais.

- Uma referência calculada automaticamente deve exibir origem e estado (ex.: contratual informada / provisória / digitada pelo usuário).
- Valores provisórios podem servir a simulações e planejamento, desde que não sejam exibidos como valores contratuais homologados.
- O responsável poderá informar ou corrigir o valor apurado, sem ser obrigado a aceitar o cálculo da ferramenta.
- Atribuir o estado **“apuração informada”** não equivale a executar atesto administrativo dentro do site.
- O registro financeiro será sempre distinguido de atestação, liquidação e pagamento oficial, com datas e valores próprios quando aplicáveis.

A solução deve permitir o trabalho **mesmo quando uma decisão de execução ainda estiver em aberto**; apresentar “não informado” onde necessário, sem confundir ausência com zero.

## 5. Política explícita contra loops de correção

Antes de abrir um novo ciclo de auditorias, perguntar:

> **Isto é defeito técnico comprovável ou uma decisão operacional legítima que o usuário poderá resolver na execução?**

| Caso | Tratamento |
|---|---|
| Erro de cálculo, salvamento, permissão, vínculo, duplicação automática indevida | Corrigir no software e testar. |
| Quantidade, cronograma, enquadramento, valor atestado, exceção de medição dependente da realidade da execução | Oferecer campo ou ação editável e registrar a decisão; **não antecipar escolha do fiscal/gestor**. |
| Sugestão visual sem ganho demonstrável | Não abrir ciclo de refinamento infinito. |
| Informação pendente de conferência externa | Sinalizar a condição sem bloquear outras atividades válidas. |

## 6. Impacto nas entregas E1–E5

**E1:** catálogo de referência pode ser provisório; cálculo é consultivo e editável na futura experiência; valores ausentes permanecem ausentes. O módulo técnico deve aceitar estado provisório sem atribuir validação contratual inexistente.

**E2:** registro e consulta de chamados funcionam mesmo sem inventário completo. Ajustar escola, equipamento e referência não depende de prévia conciliação universal.

**E3:** programação e quantidades podem ser reprogramadas, ajustadas e recalculadas. Possíveis duplicidades são alertas de conferência, não vetos automáticos a serviços legítimos.

**E4:** painéis diferenciam estimativas e registros informados; informação incompleta não impede consulta, e referências globais não são impostas como limites a cada escola.

**E5:** responsável informa apuração e situação de NF/pagamento sem o site presumir um atesto. Controle efetivo de acesso protege a edição financeira, mas não cria um processo regulatório paralelo.

## 7. Hierarquia e preservação do histórico

Esta decisão **complementa e esclarece** a Carta de Princípios v1.0; não a reescreve retroativamente. Em pontos de interpretação de P8/P9 ou da concepção que pareçam exigir etapas administrativas como pré-requisitos universais, prevalece a orientação **“apoio com flexibilidade, não bloqueio antecipado”**.

**Não autorizado por esta decisão:** inventar dados, burlar regras reais de segurança, gerar atos oficiais falsos, modificar silenciosamente informações registradas ou misturar valor estimado com valor efetivamente informado.

**Resultado esperado:** um produto utilizável que se adapta à gestão, em vez de exigir que a gestão se adapte às suposições iniciais do desenvolvedor.
