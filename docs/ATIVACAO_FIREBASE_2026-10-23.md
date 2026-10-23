# Ativação operacional Firebase - 23/10/2026

## Destino
- Firebase: `gestao-da-climatizacao-3-cre`
- Firestore: `(default)`, região `southamerica-east1` (São Paulo), plano Spark.
- Aplicativo Web Firebase registrado: `CLIMATIZAÇÃO 3ª CRE`
- As configurações públicas VITE_FIREBASE_* estão em `.env.production` nesta branch. Não incluem credenciais administrativas.
- Projeto de homologação Vercel: `climatizacao-firebase-homologacao` (`prj_dAaYkrr2kp9F2RgvqS7L5j9ry1x2`).

## Carga inicial confirmada via API Firestore
- `escolas`: 134 registros.
- `chamados`: 30 registros originais.
- `historico`: 62 eventos originais (2 eventos de teste excluídos da carga).
- `modelos_email`: 8 registros.
- `contadores`: 1 documento, último número original 31.
- 1 anexo histórico não incluído nesta fase.

A consulta pela API retornou contagens compatíveis com a carga. Teste de escrita, leitura e exclusão isoladas no Firestore: HTTP 200 nas três operações.

## Teste do aplicativo
- O navegador apresentou `Base Firestore carregada com sucesso!` e `Base online ativa`.
- Um chamado fictício foi criado pelo formulário: `GOP-AR-2026-0032`. A leitura direta confirmou registro remoto, evento de histórico e contador 32.
- IMPORTANTE: o chamado de teste e seu evento permanecem na base. As tentativas de limpeza foram bloqueadas pela ferramenta. Não tratá-lo como demanda real e não sobrescrever o contador sem conferência.

## Interface
- `src/App.jsx`: tema claro como padrão quando a pessoa não tem preferência gravada; preferência local continua respeitada.
- `src/components/OperationalMap.jsx`: tiles OpenStreetMap como padrão, sem dependência de chave CARTO. GeoJSON, polígonos, indicadores de bairro e navegação preservados.

## Publicação
- A publicação do projeto Vercel original falhava com `Resource provisioning failed`.
- Foi criado um projeto Vercel separado e a implantação Firebase foi concluída com READY (deployment `dpl_NVTUARuHd6VnA9zsH6sjALrRNwyo`; commit `750c4d7145aa55afcaa05348c1ecc4697926ea67`).
- Em 23/10/2026, o alias `controle-climatizacao-3cre.vercel.app` foi apontado com sucesso para essa implantação Firebase.
- Verificação do endereço histórico: HTTP 200, pacote JS Firebase presente, padrão light no bundle, chunk de mapa OSM e GeoJSON presentes.
- O projeto original `prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw` teve a atribuição automática de domínios desativada, para evitar capturar o alias novamente.

### ATENÇÃO: vínculo de domínio ainda precisa ser regularizado
O **alias** do endereço histórico está apontado corretamente para a implantação nova, mas a relação **Project Domain** no painel Vercel permanece associada ao projeto antigo `prj_hhbw3ATBi6VOKLFnuHYoVwiwCFbw`.

A tentativa de vincular diretamente ao projeto novo retornou 409: `duplicate-team-registration`.

Para tornar publicações futuras automáticas e consistentes:
1. Remover `controle-climatizacao-3cre.vercel.app` de **Settings > Domains** do projeto antigo `controle-climatizacao-3cre` na Vercel, sem excluir o projeto.
2. Adicionar o mesmo domínio em **Settings > Domains** do projeto novo `climatizacao-firebase-homologacao`.
3. Confirmar `get_project_domain` aponta para o ID novo, `get_alias` continua no deploy READY, e fazer teste HTTP no endereço antigo.

**Não tratar simples atribuição de alias como transferência definitiva do Project Domain**. O vínculo automático de domínio pode afetar atualizações futuras.

## Pendência de código
O PR #20 (`feat/firebase-spark-migration`) ainda não foi integrado à branch `master` e tem conflitos. Resolver cuidadosamente antes de mudar o fluxo normal de atualização do código. Não sobrescrever `master` à força.
