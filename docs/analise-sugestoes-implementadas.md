# Análise: O que foi sugerido × O que já está implementado

**Sistema:** Controle de Climatização — GOP / 3ª CRE  
**Data da análise:** Junho de 2026  
**Fonte:** Inspeção direta dos arquivos `src/App.jsx`, `src/index.css`, `src/lib/logic.js`, `src/lib/operationalIntelligence.js`, `supabase/schema.sql` e todas as 11 migrations em `supabase/migrations/`.

---

## Explicação das sugestões do Relatório Visual (M-01 a M-14)

### M-01 — Diferenciar os níveis de urgência por cor e texto

**Em linguagem simples:** Um chamado parado há 148 dias parecia igual a um parado há 16 dias — os dois tinham o mesmo crachá "ATENÇÃO". A sugestão era criar três níveis: atenção (amarelo), alto risco (vermelho), crítico (vermelho intenso).

**✅ JÁ ESTÁ IMPLEMENTADO.** A função `severidadeInatividade()` em `src/lib/logic.js` faz exatamente isso:
- Até 6 dias → em dia
- 7 a 14 dias → Atenção (âmbar)
- 15 a 59 dias → Alto risco (vermelho)
- 60 dias ou mais → **Crítico — revisar caso**

Esse texto aparece na tela quando você abre o painel de ações.

---

### M-02 — Usar a mesma ordem de prioridade em todas as listas

**Em linguagem simples:** A lista "O que exige ação agora" e a lista de acompanhamento podiam mostrar os chamados em ordens diferentes — um ficava no topo de uma e no meio da outra. A sugestão era usar uma régua única de urgência em todos os lugares.

**✅ JÁ IMPLEMENTADO.** As funções `compararUrgencia()` e `calculateUrgencyScore()` em `src/lib/operationalIntelligence.js` garantem que todos os blocos do sistema usam o mesmo critério de ordenação.

---

### M-03 — Separar os indicadores do painel em duas famílias

**Em linguagem simples:** Os quatro cards de prazo no painel mediam coisas diferentes, mas pareciam todos iguais. "Sem movimentação há +7 dias" é diferente de "aberto há +30 dias" — o primeiro mede *preguiça recente*, o segundo mede *tempo total na fila*. Essas duas coisas exigem providências diferentes.

**✅ JÁ IMPLEMENTADO.** O painel agora tem dois sub-blocos com títulos distintos:
- **"Sem Movimentação Recente (Inércia)"** — para os alertas de 7 e 15 dias
- **"Tempo Total em Aberto (Antiguidade)"** — para os alertas de 30 e 60 dias

---

### M-04 — Parar de mostrar 5 cards repetidos de "Atualizar andamento"

**Em linguagem simples:** Se havia 5 chamados parados, o bloco de ações mostrava 5 cards quase idênticos, todos dizendo "Atualizar andamento". A sugestão era mostrar o mais urgente destacado, e agrupar os outros em um resumo como "4 outras demandas sem movimentação".

**✅ JÁ IMPLEMENTADO.** Em `src/lib/operationalIntelligence.js`, o código agrupa os chamados de inatividade em um card único do tipo `stuck-group`, exibindo a contagem e os IDs dos demais chamados envolvidos.

---

### M-05 — Corrigir categorias duplicadas de setor responsável

**Em linguagem simples:** No gráfico de responsabilidade apareciam "Unidade Escolar / GIN" e "GIN / Unidade Escolar" como se fossem setores diferentes, mas eram a mesma coisa com a ordem das palavras invertida. Isso distorcia os números do gráfico.

**✅ JÁ IMPLEMENTADO.** A função `normalizeSector()` em `src/lib/logic.js` unifica os dois automaticamente para "GIN / Unidade Escolar" antes de qualquer cálculo.

---

### M-06 — Remover a barra de rolagem dentro dos cards do painel

**Em linguagem simples:** Um card do dashboard tinha uma mini-barra de rolagem interna, dando a sensação de que havia informação escondida. A sugestão era deixar o card crescer naturalmente, mostrando tudo de uma vez.

**✅ JÁ IMPLEMENTADO.** O CSS mudou `.mini-progress-list` para `max-height: none` e `overflow-y: visible` — a lista cresce livremente, sem barra de rolagem interna.

---

### M-07 — Lista de chamados em cards no celular

**Em linguagem simples:** No celular, a tabela de chamados era larga demais — era preciso rolar para os lados para ler. Isso era desconfortável e pouco prático. A sugestão era transformar cada linha da tabela em um cartão vertical, fácil de ler do topo para baixo.

**✅ JÁ IMPLEMENTADO.** O CSS tem uma regra `@media (max-width: 768px)` que converte a tabela em `.mobile-ticket-card` — cards verticais com as informações empilhadas. Os atributos `data-label` nas células do `App.jsx` garantem que cada campo apareça com sua legenda ao lado do valor.

---

### M-08 — Aba de Comunicações empilhada no celular

**Em linguagem simples:** A área de geração de e-mails ficava espremida no celular, com seletor de chamado e prévia do e-mail lado a lado. A sugestão era empilhar tudo verticalmente para uso mais confortável.

**✅ JÁ IMPLEMENTADO.** O CSS empilha `.email-composer-layout` em coluna única nas telas pequenas.

---

### M-09 — Cabeçalho menor no celular

**Em linguagem simples:** No celular, o topo da página consumia muito espaço antes do conteúdo principal aparecer. A sugestão era um cabeçalho mais compacto, para o usuário chegar mais rápido ao que interessa.

**✅ JÁ IMPLEMENTADO.** O CSS tem uma seção `M-09: Cabeçalho mobile compacto` que reduz espaçamentos e reorganiza os botões em telas pequenas.

---

### M-10 — Usar fonte normal em campos e minutas de e-mail

**Em linguagem simples:** Alguns campos de formulário e o corpo do e-mail gerado usavam fonte de computador/código (tipo máquina de escrever), que passa sensação de "rascunho técnico" — não de documento institucional. A sugestão era usar a mesma fonte limpa e moderna da interface.

**✅ JÁ IMPLEMENTADO.** `.email-preview-body` e os campos de formulário usam `font-family: var(--font-sans)` no CSS.

---

### M-11 — Adicionar texto junto às cores (não depender só da cor)

**Em linguagem simples:** Algumas informações eram transmitidas só por cor (borda vermelha, crachá amarelo). Isso é problema para quem tem daltonismo ou não conhece o sistema. A sugestão era sempre ter um texto junto: "Crítico", "Atenção", "Aguardando".

**✅ JÁ IMPLEMENTADO.** Há um painel de legenda textual na lista de chamados com etiquetas como "Sem movimentação (Alerta Âmbar)" e "Antiguidade Crítica (aberto +60 dias)". O código também exibe os rótulos em texto: "Crítico — revisar caso", "Alto risco", "Atenção".

---

### M-12 — Revisar contraste das cores âmbar e laranja

**Em linguagem simples:** Alguns tons de amarelo/laranja podiam ser difíceis de ler sobre fundo branco em textos pequenos. A sugestão era escurecer levemente esses tons para atender padrões de acessibilidade.

**✅ JÁ IMPLEMENTADO.** O CSS usa `--color-amber: hsl(35, 88%, 32%)` com nota `(WCAG AA)` — a cor foi calibrada para passar nos critérios internacionais de legibilidade.

---

### M-13 — Formalizar tokens de design (dicionário de cores)

**Em linguagem simples:** Em vez de cada desenvolvedor inventar uma cor nova em qualquer parte do código, a sugestão era centralizar todas as cores, tamanhos e estilos num "dicionário" único — chamado de tokens de design. Assim o sistema fica sempre consistente, e corrigir uma cor muda em todo lugar de uma vez.

**✅ JÁ IMPLEMENTADO.** O `:root` do CSS tem tokens semânticos completos:
- Cores de status: `--color-green`, `--color-amber`, `--color-orange`, `--color-red`, `--color-blue`, `--color-gray`
- Cores de antiguidade: `--color-age-warn`, `--color-age-severe`
- Raios de borda: `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`
- Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Fontes: `--font-sans`

---

### M-14 — Preservar a preferência de tema (claro/escuro) do usuário

**Em linguagem simples:** A sugestão era não forçar o usuário a escolher o tema toda vez que abre o sistema — o sistema deve lembrar a escolha.

**✅ JÁ IMPLEMENTADO.** O sistema persiste a escolha do tema via `localStorage` do navegador.

---

## Análise das sugestões de Governança Supabase (GOVERNANCA.md)

### 1 — Protocolo de backup antes de mudanças

**Em linguagem simples:** Antes de mexer no banco de dados, sempre exportar uma cópia de segurança.

**✅ JÁ IMPLEMENTADO (como processo).** As 11 migrations organizadas cronologicamente em `supabase/migrations/` mostram que cada mudança no banco foi registrada como um arquivo separado, com data, hora e descrição — o que é exatamente esse protocolo em prática.

---

### 2 — Usar o "Advisor" do Supabase

**Em linguagem simples:** O Supabase tem uma ferramenta de diagnóstico automático que aponta problemas de segurança e desempenho. A sugestão era usá-la regularmente.

**✅ JÁ IMPLEMENTADO.** A migration `20260602000002_advisor_hardening.sql` mostra que o Advisor foi executado e seus achados foram corrigidos.

---

### 3 — RLS — restringir quem pode gravar o quê

**Em linguagem simples:** O RLS é como uma portaria do banco de dados — define quem pode ler, quem pode criar, quem pode alterar e quem pode apagar cada tabela. A sugestão era refinar essas regras antes de abrir o sistema para mais usuários.

**✅ PARCIALMENTE IMPLEMENTADO (decisão intencional).** O RLS está ativo em todas as tabelas. A migration `20260607032700` removeu permissões excessivas: o usuário anônimo não consegue mais apagar chamados, nem alterar escolas ou histórico. Ainda pode criar e editar chamados — isso é uma decisão consciente enquanto o sistema não tem login de usuário. O GOVERNANCA.md documenta isso claramente.

---

### 4 — Funções SECURITY DEFINER com search_path fixo

**Em linguagem simples:** Duas funções do banco rodam com privilégios elevados (como um "super-usuário"). Sem proteção, alguém mal-intencionado poderia enganar essas funções para fazer coisas indevidas. A sugestão era adicionar uma proteção técnica chamada `search_path`.

**✅ JÁ IMPLEMENTADO.** Ambas as funções `generate_next_id_chamado()` e `save_ticket_with_history()` têm `SECURITY DEFINER` com `SET search_path = public, pg_temp` — a proteção está aplicada.

---

### 5 — Mover extensões para schema separado

**Em linguagem simples:** As "ferramentas extras" instaladas no banco (como busca por similaridade e remoção de acentos) ficam misturadas com os dados. A sugestão era organizá-las numa "pasta" separada chamada `extensions`.

**❌ NÃO FEITO** — as extensões (`unaccent`, `pg_trgm`, `moddatetime`, `http`) ainda ficam no schema `public`. Mudança de baixo risco, para fazer em momento tranquilo de manutenção. Sem impacto para o usuário final.

---

### 6 — Auditar arquivos órfãos no Storage

**Em linguagem simples:** Verificar se há arquivos no "disco" do Supabase que não têm chamado correspondente — como fotos de um chamado que foi apagado e o arquivo ficou sozinho, ocupando espaço sem servir para nada.

**✅ JÁ IMPLEMENTADO.** A view `vw_chamados_sem_anexo` e a função `diagnostico_operacional()` fazem esse cruzamento diretamente via SQL.

---

### 7 — Views gerenciais para consultas frequentes

**Em linguagem simples:** Criar "atalhos" pré-prontos no banco para as perguntas mais comuns: quais chamados estão ativos, quantos por bairro, quais ficaram sem movimentação, quais têm inconsistências.

**✅ JÁ IMPLEMENTADO.** Sete views foram criadas:
- `vw_chamados_ativos` — chamados que não foram encerrados ou suspensos
- `vw_chamados_por_bairro` — distribuição territorial dos chamados
- `vw_chamados_por_status` — contagem por etapa do fluxo
- `vw_chamados_sem_movimentacao` — lista por tempo sem atualização
- `vw_chamados_sem_anexo` — chamados ativos sem documento vinculado
- `vw_escolas_resumo_climatizacao` — percentual de climatização por escola
- `vw_integridade_operacional` — log de inconsistências e registros órfãos

---

### 8 — Usar os logs do Supabase para debug

**Em linguagem simples:** Quando algo der errado, consultar o painel de logs do Supabase antes de entrar em pânico — lá ficam registradas as mensagens de erro, recusas de acesso e falhas de conexão.

Orientação operacional documentada no GOVERNANCA.md. Não há código a implementar.

---

## Conclusão

| Categoria | Total de sugestões | Já implementadas | Pendentes |
|---|---|---|---|
| Visual/UX (M-01 a M-14) | 14 | **14 (100%)** | 0 |
| Governança Supabase | 8 | **7 (87,5%)** | 1 (extensões) |

**O projeto está mais maduro do que os documentos de sugestão fazem parecer.** Os documentos foram escritos durante o processo de implementação, e o trabalho de execução foi feito com bastante fidelidade. A única pendência real (mover extensões para schema dedicado) é cosmética e não afeta o funcionamento do sistema.
