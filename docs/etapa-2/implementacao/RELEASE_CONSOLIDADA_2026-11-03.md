# GOP Clima 3ª CRE · Entrega consolidada de 03/11/2026

> **REGISTRO HISTÓRICO — 03/11/2026.** A homologação no projeto `climatizacao-firebase-homologacao` e as ressalvas de emulador descrevem **a entrega da época**. O estado vigente após os PRs #35 e #36, com Firestore operacional/cloud, 11 preços unitários, duas abas e produção no Vercel original, é [release de 04/11/2026](RELEASE_PRODUCAO_2026-11-04.md). Não reutilize os itens antigos “pendente” como se ainda estivessem não implementados.


**Estado comprovado:** PR [#32](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/pull/32) integrado à `master` por squash no commit [`16274ae5`](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/commit/16274ae50631e4da5e5d429f833a6f670d18693b). Os PRs #24–#31 foram encerrados como substituídos pela entrega consolidada. Nenhum PR está aberto imediatamente após a integração.

**Ambiente web:** projeto Vercel `climatizacao-firebase-homologacao` (`prj_dAaYkrr2kp9F2RgvqS7L5j9ry1x2`); implantação explícita `dpl_CGtyz88nt38QkXP31M3D6SiPBZN7`, `production`, `READY`, associada ao commit `16274ae5`. Domínio configurado e confirmado: https://climatizacao-firebase-homologacao.vercel.app/. **A verificação técnica do deploy não equivale a uma homologação visual humana do domínio.**

**CI do último commit do PR antes do merge:** [run 41602599427](https://github.com/WilsonMPeixoto-2/controle-climatizacao-3cre/actions/runs/41602599427), 4/4 jobs aprovados, 57/57 Playwright operacional + 9/9 Playwright financeiro, além dos testes de domínio, lint, build e Firestore emulado.

## Entregas realmente incorporadas ao site

| Área | Implementação | Limite prático |
|---|---|---|
| Nova navegação **Gestão Financeira** | Visão integrada da programação, consulta de chamados, conferência de escolas, tendência de abertura e estimativas contextuais | Indicadores de apuração, faturamento, pagamentos e limites/empenhos permanecem como **não informados**; não há painel financeiro consolidado |
| Conferência por escola | Recortes **A conferir**, **Com conclusão**, **Sem solicitação**, pesquisa, filtros, dossiê e acesso aos chamados | Baseia-se no estado dos **chamados**, não em prova de execução contratual ou atesto |
| Tendência interativa | Barras de **abertura de chamados** com filtro por mês e escola | Não representa gastos ou desembolsos |
| Programação de visitas | Criar, editar, reprogramar, informar execução, filtrar por mês, importar/exportar e recuperar rascunho | **Somente localStorage neste navegador**; não é agenda compartilhada, OS ou atesto |
| Estimativa por atendimento | Grupos editáveis, quantidades, preço nominal, origem, cobertura, incremento estimado, valores ausentes e composição detalhada | Teto de **4 grupos e 8 chamados**; não existem preços contratuais oficiais carregados |
| Ligações contextuais | Entrada a partir de chamado, visita planejada ou dossiê e composição reaberta na ficha da escola | Não altera automaticamente os dados operacionais nem gera cobrança |
| Históricos financeiros | Revisões imutáveis, conflito entre sessões e gravação transacional testados | **Somente no emulador Firestore local de desenvolvimento**; indisponível como salvamento financeiro remoto |
| Acabamento visual | Estilos compatíveis com Outfit/Inter, Lucide, temas claro/escuro e testes em 320/1440/3840 px | Testes e capturas não substituem aprovação estética do responsável |

**Limite mais importante:** no endereço público, a interface e a prévia de estimativas foram entregues, **mas a gravação/sincronização de atendimentos econômicos não funciona sem o emulador local**. O cliente financeiro aceita apenas `localhost`/`127.0.0.1`, projeto `demo-gop-clima-financeiro`; o deploy Vercel não oferece esse backend aos visitantes. Os testes com duas sessões comprovaram integração **no emulador**, não um backend de homologação acessível pela internet. Esta distinção não afeta, por si só, as capacidades anteriores do banco operacional.

## Próximas entregas ainda não concluídas

1. Decidir e validar um **backend remoto de desenvolvimento/homologação** adequado à DP-004, preservando isolamento e sem expor dados sensíveis; não tratar o Firestore emulado como cloud.
2. Reavaliar a persistência local da programação de visitas antes de prometer agenda multiusuário ou cálculos mensais compartilhados.
3. Consolidar estimativas por competência com **grandezas homogêneas**: preço nominal, acréscimo e cobertura não podem compor um único total ambíguo. Identificar registros incompletos, escolas, links de origem e prevenção de duplicidade.
4. Evoluir apuração informada, medição, glosa, nota fiscal, retenções, liquidação e pagamento **sem transformá-los automaticamente em atos administrativos**.
5. Manter a **DP-004**: autenticação e perfis individuais são adiados durante desenvolvimento, mas são condição anterior à entrega institucional a servidores. Não atribuir autoria autenticada a rótulos de sessão.
6. Homologar a qualidade e o comportamento da interface publicada em navegador real, incluindo o monitor largo.

## Documentos e responsabilidades

- [Índice atual da Etapa 2](../README.md); [AGENTS.md](../../../AGENTS.md) é a entrada para agentes.
- [Carta de Princípios](../concepcao/CARTA_DE_PRINCIPIOS_DO_PRODUTO_v1.0.md), [DP-001 a DP-004](../decisoes/DP-004_AUTENTICACAO_ADIADA_DURANTE_DESENVOLVIMENTO.md) e [roteiro técnico E1–E5](../planejamento/ROTEIRO_IMPLEMENTACAO_E1_E5.md).
- [Arquitetura Firebase](../../ARQUITETURA_FIREBASE.md), seção 9.1, documenta o backend financeiro temporário e os comandos de teste.
- [Política Vercel](../../POLITICA_DEPLOY_VERCEL.md): `vercel.json` fixa `git.deploymentEnabled: false` para reduzir consumo do plano Hobby; **deploy manual após merge é deliberado**, não falha automática.
- Documentos com datas de agosto/outubro anteriores a este release preservam o contexto histórico e **não descrevem o estado atual** quando divergem deste registro e do código.

**Nenhuma decisão de produto autoriza presumir medição, atesto, faturamento, liquidação ou pagamento a partir de uma previsão.**
