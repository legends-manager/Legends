# Auditoria Visual Mobile-First — Legends Manager

> Só leitura. Feita direto em produção (`https://legends-iota-steel.vercel.app`),
> viewport mobile 375×812 (equivalente a um Android/iPhone comum), sem login
> (nenhuma escrita no Supabase), sem nenhuma alteração de código, CSS,
> componente, asset público, banco ou configuração. Nenhum commit, push,
> merge ou deploy foi feito nesta etapa. A carreira usada para navegar as
> telas internas (Real União, Série C) existe só no `localStorage` da sessão
> de auditoria, nunca foi sincronizada online.
>
> Console do navegador conferido ao longo de toda a navegação: **zero erros**
> — os achados abaixo são 100% de UX/UI visual, não bugs funcionais.

Esta auditoria é o insumo direto pra Fase "F1 — Fundação" do
`REDESIGN_LEGENDS_MANAGER.md` e pra montagem da página "03 — Current State"
no Figma (ver `Legends_Manager_Documento_Mestre_v1.2_ETAPA_C_CONCLUIDA.docx`,
seção 9).

---

## Achado 1 — Botões fixos cobrem o elenco na Escalação

- **Tela/fluxo**: Escalação (após escolher time → fechar mercado).
- **Viewport**: 375×812 (mobile).
- **Descrição**: a barra fixa "Jogar ao vivo" / "Rápida" fica sobreposta à
  lista de jogadores do elenco. Rolando até o fim da lista, o último
  jogador ("Santos", posição MEI) fica quase totalmente escondido atrás da
  barra de ação + barra de navegação inferior, sem espaço reservado
  suficiente abaixo do conteúdo.
- **Evidência**: capturado ao vivo durante a auditoria — screenshot da tela
  de Escalação rolada até o fim, jogador "Santos" visível só como uma tira
  fina entre a barra de ação e a navegação inferior.
- **Gravidade**: **Crítica**.
- **Impacto no usuário**: o jogador pode nem perceber que aquele atleta
  existe na lista, ou ter dificuldade de tocar nele pra trocar a escalação
  — o pior tipo de bug de UX porque esconde uma ação real do jogo.
- **Recomendação**: já mapeada no `REDESIGN_LEGENDS_MANAGER.md` item 5.1 —
  barra de ação fixa com `padding-bottom` no conteúdo igual à soma da
  altura da barra de ação + barra de navegação + `env(safe-area-inset-bottom)`.
- **Pertence a**: CSS/componentes (Fase F1 do redesign, prioridade máxima).

## Achado 2 — Times aparecem só como sigla, sem nome completo

- **Tela/fluxo**: Classificação (Tabela), Resultado (placar dos outros
  jogos da rodada), parcialmente no Ranking (coluna do clube).
- **Viewport**: 375×812.
- **Descrição**: a tabela de classificação mostra só `CAN`, `DRA`, `FOR`,
  `KIS`, `MAR`, `NOR`, `PUR`, `RAC`, `RLE`, `RUN`, `SLM`, `SER` — nenhum
  nome completo de time em lugar nenhum da tabela. O mesmo vale pra lista
  "Resultados da rodada" na tela de Resultado (`FOR 3:3 RLE`, etc.).
- **Evidência**: capturas da Tabela (rodada 0 e rodada 1) e da tela de
  Resultado, seção "Resultados da rodada".
- **Gravidade**: Alta.
- **Impacto no usuário**: quem não decorou as 12 siglas não consegue saber
  quem está jogando contra quem, nem localizar times rivais conhecidos —
  reduz a conexão emocional que é a proposta de valor central do produto.
- **Recomendação**: já mapeada no `REDESIGN_LEGENDS_MANAGER.md` item 5.3 —
  nome completo na linha principal, sigla como informação secundária.
- **Pertence a**: CSS/componentes.

## Achado 3 — Nome de atleta real truncado com reticências

- **Tela/fluxo**: Mercado (aba Comprar), lista de jogadores disponíveis.
- **Viewport**: 375×812.
- **Descrição**: o nome "Ricardo Alexandre Theodoro Co..." aparece cortado
  com reticências no meio da última palavra, dentro do card do jogador.
- **Evidência**: captura da aba "Comprar" do Mercado, card perto do fim da
  lista visível.
- **Gravidade**: Alta — viola uma regra explícita já travada no próprio
  `REDESIGN_LEGENDS_MANAGER.md` item 5.3: "Nomes de atletas reais NUNCA
  truncados com '…'".
- **Impacto no usuário**: nome de pessoa real cortado de forma feia; em
  alguns casos pode até ficar ambíguo com outro jogador de nome parecido.
- **Recomendação**: quebra de linha ou fonte condensada, nunca corte no
  meio da palavra — exatamente como a regra já pede.
- **Pertence a**: CSS/componentes.

## Achado 4 — Placeholder de e-mail cortado sem reticências

- **Tela/fluxo**: Tela inicial (widget de login) e tela de Ranking (mesmo
  widget).
- **Viewport**: 375×812.
- **Descrição**: o placeholder `seu@email.com — entra e concorre no
  ranking` aparece cortado como `...concorre nc`, sem indicação visual de
  corte (sem "…"), em 2 telas diferentes que reaproveitam o mesmo
  componente de login.
- **Evidência**: capturas da Tela Inicial e da tela de Ranking, campo de
  e-mail.
- **Gravidade**: Baixa — é só um placeholder (não é dado real, some ao
  digitar), mas passa impressão de texto quebrado logo na primeira tela
  que qualquer novo usuário vê.
- **Impacto no usuário**: pequena impressão de descuido visual no primeiro
  contato com o produto.
- **Recomendação**: encurtar o texto do placeholder pra caber em telas
  estreitas, ou usar `text-overflow: ellipsis` pra cortar com reticências
  de forma intencional.
- **Pertence a**: CSS/componentes (baixo esforço, pode entrar já na F1).

## Achado 5 — Sigla do time do usuário ocupa uma vaga da navegação inferior

- **Tela/fluxo**: barra de navegação inferior, visível em Escalação,
  Mercado, Tabela, Copa, Ranking.
- **Viewport**: 375×812.
- **Descrição**: o segundo item da barra inferior mostra "RUN" (sigla do
  time escolhido) em vez de uma função fixa de navegação.
- **Evidência**: capturas de Mercado, Escalação, Tabela, Copa e Ranking —
  o item "RUN" aparece idêntico em todas.
- **Gravidade**: Média — já mapeado e com solução definida.
- **Impacto no usuário**: a barra de navegação perde previsibilidade (o
  segundo botão muda de rótulo dependendo do time escolhido, em vez de ser
  sempre a mesma função) — o usuário precisa reaprender a navegação a cada
  time diferente.
- **Recomendação**: já mapeada no `REDESIGN_LEGENDS_MANAGER.md` item 5.2 —
  itens fixos (Início, Elenco, Tabela, Copa, Ranking); identidade do clube
  vai pro cabeçalho da carreira.
- **Pertence a**: CSS/componentes.

## Achado 6 — Emojis usados como ícone em vários pontos

- **Tela/fluxo**: botão "Ver ranking online" (🏆), botão "nomes" na
  Escalação (✏️), comentário da torcida no Resultado (🎙️), seletor de mês
  no Ranking (📅), troféu do craque da partida (⭐).
- **Viewport**: 375×812.
- **Descrição**: confirma que a substituição de emojis por SVG (item 4 do
  `REDESIGN_LEGENDS_MANAGER.md`) ainda não foi feita — emojis aparecem
  renderizados de forma inconsistente (dependem da fonte de emoji do
  sistema operacional/navegador).
- **Evidência**: presentes em quase toda captura feita nesta auditoria.
- **Gravidade**: Média.
- **Impacto no usuário**: aparência inconsistente entre Android/iOS/
  desktop, e reduz a percepção de "produto premium" citada no próprio
  documento mestre.
- **Recomendação**: já mapeada — criar `icons.jsx` com ~20 SVGs próprios.
- **Pertence a**: CSS/componentes (Fase F1, já é item 4 do redesign).

## Achado 7 — Ranking sem cor de medalha para 1º/2º/3º lugar

- **Tela/fluxo**: Ranking de técnicos (aba mensal e geral).
- **Viewport**: 375×812.
- **Descrição**: as posições aparecem como "1º"/"2º" em texto simples, sem
  nenhum destaque de cor por posição. **Correção (14/jul)**: só a cor
  `gold` está formalmente definida na identidade visual (seção 7 do
  documento mestre, `#FFC400`) — silver e bronze ainda NÃO têm valor
  travado em lugar nenhum; precisam ser definidos no Figma antes de
  qualquer implementação.
- **Evidência**: captura do Ranking, mostrando "1º Felyp" e "2º Kevin
  Almeida" sem destaque de cor por posição.
- **Gravidade**: Média.
- **Impacto no usuário**: perde-se o reforço visual imediato de "quem está
  no pódio", que é justamente o gatilho de competitividade que o ranking
  foi desenhado pra criar.
- **Recomendação**: aplicar `gold` (já definido) ao 1º lugar; definir
  silver e bronze no Figma (não existem ainda) antes de implementar o
  destaque do 2º/3º lugar. Referência: `REDESIGN_LEGENDS_MANAGER.md`
  item 5.4.
- **Pertence a**: CSS/componentes.

## Achado 8 — "Craque da partida" sem tratamento visual proporcional

- **Tela/fluxo**: tela de Resultado, card "Craque da partida".
- **Viewport**: 375×812.
- **Descrição**: o card do craque da partida usa uma borda amarelada sutil
  e uma estrela, mas o fundo continua igual ao resto da tela — não há
  destaque forte o bastante pra um momento que o próprio documento mestre
  descreve como devendo "parecer evento, não notificação".
- **Evidência**: captura da tela de Resultado, seção "Craque da partida".
- **Gravidade**: Média.
- **Impacto no usuário**: um dos poucos momentos de conquista pessoal da
  partida passa despercebido.
- **Recomendação**: aplicar a cor `--gold` de forma mais assertiva (fundo
  ou brilho), consistente com a regra "dourado só em conquista".
- **Pertence a**: CSS/componentes (Fase "Momentos" do design system,
  seção 7 do documento mestre).

## Achado 9 — Tela da Copa quase vazia, sem energia de "evento"

- **Tela/fluxo**: Copa (aba inferior).
- **Viewport**: 375×812.
- **Descrição**: mostra só um card pequeno com o confronto ("Real União x
  Canelas"), um botão "Jogar" e um "Voltar" — o resto da tela (mais de
  60% da altura) fica vazio, sem nenhum tratamento de cabeçalho de evento.
- **Evidência**: captura da tela Copa, fase "16-avos de final".
- **Gravidade**: Média.
- **Impacto no usuário**: a Copa é um formato de "mata-mata, sem segunda
  chance" que deveria gerar tensão — hoje parece uma tela secundária
  esquecida.
- **Recomendação**: já mapeada no `REDESIGN_LEGENDS_MANAGER.md` item 5.10
  — cabeçalho de evento com fonte display, "Uma partida. Sem segunda
  chance.".
- **Pertence a**: Figma (definir o tratamento de hero) + CSS/componentes
  (implementar depois).

## Achado 10 — Grandes áreas em branco em telas com pouco conteúdo

- **Tela/fluxo**: Tela inicial (abaixo do botão "Ver ranking online"),
  Artilharia (estado vazio "Nenhum gol ainda").
- **Viewport**: 375×812.
- **Descrição**: sobra bastante espaço vazio abaixo do conteúdo real,
  sem ilustração, mensagem ou hierarquia que preencha o vazio de forma
  intencional.
- **Evidência**: capturas da Tela Inicial (rolada até o fim) e da
  Artilharia antes da rodada 1.
- **Gravidade**: Baixa.
- **Impacto no usuário**: pequeno, mas reforça a sensação de "painel
  funcional" em vez de "jogo" mencionada na seção 6 do documento mestre.
- **Recomendação**: já mapeada — estados vazios fazem parte da Etapa 5
  (Polish) do redesign, seção 10 do documento mestre.
- **Pertence a**: Figma (desenhar o estado vazio) + CSS/componentes.

## Achado 11 — Paleta atual (roxo/amarelo) — registro de linha de base

- **Tela/fluxo**: todas.
- **Viewport**: 375×812.
- **Descrição**: não é um defeito — é o estado ANTES do redesign, com a
  paleta antiga (fundo roxo escuro, botões amarelos). Registrado aqui só
  como marco visual de "antes", pra comparação direta com a nova
  identidade grafite + verde-limão na página "03 — Current State" do
  Figma.
- **Evidência**: todas as capturas desta auditoria.
- **Gravidade**: Informativa (não é um problema a corrigir isoladamente —
  é o próprio objetivo do redesign).
- **Impacto no usuário**: nenhum imediato; relevante só como referência.
- **Recomendação**: nenhuma ação aqui — a substituição de paleta já é o
  corpo inteiro do `REDESIGN_LEGENDS_MANAGER.md`.
- **Pertence a**: Figma (captura do "antes") + CSS/componentes (a troca
  em si, Fase F1).

## Achado 12 — Risco visual de contraste a validar tecnicamente

- **Tela/fluxo**: textos secundários em lilás/cinza-claro sobre fundo roxo
  escuro — visível em vários lugares (descrição da Tela Inicial, "Escolha
  seu time", legendas de posição na Escalação).
- **Viewport**: 375×812.
- **Descrição**: **Correção (14/jul)**: esta auditoria só registra uma
  impressão visual de contraste baixo — NÃO é uma falha de WCAG
  confirmada, porque nenhuma medição numérica (AA/AAA) foi feita contra
  cada par de cor de fundo. É um risco a validar tecnicamente, não um
  problema comprovado.
- **Evidência**: capturas da Tela Inicial e da Escalação.
- **Gravidade**: Média (mantida como risco a investigar, não como defeito
  confirmado — o item 5.6 do `REDESIGN_LEGENDS_MANAGER.md` já previa medir
  isso, o que reforça que vale a pena verificar, não que já esteja
  provado).
- **Impacto no usuário** (se o risco se confirmar): leitura mais cansativa
  em ambiente externo/sol, típico de uso em campo de várzea.
- **Recomendação**: medir contraste real par a par contra `--text-secondary`
  na nova paleta (já definida na seção 7 do documento mestre) durante a
  implementação, antes de decidir se há algo a corrigir de fato.
- **Pertence a**: tarefa técnica separada (medição de contraste) + CSS/
  componentes, condicionada ao resultado da medição.

## Achado 13 — Relação do cartão do goleiro com a escalação não está visualmente clara

- **Tela/fluxo**: Escalação, logo abaixo do campo, antes da lista de
  elenco por posição.
- **Viewport**: 375×812.
- **Descrição**: **Correção (14/jul)**: aparece um cartão isolado rotulado
  "GOL" mostrando um jogador (ex. "Dieniton da Silva Constâncio"), valor
  de mercado e uma barra de progresso, logo abaixo do campo. O jogador já
  aparece marcado no próprio campo (posição de goleiro) — mas a relação
  visual entre esse cartão isolado e a escalação mostrada acima dele não
  fica clara só olhando a tela (não é óbvio se é reforço da mesma
  informação, um destaque separado, ou outra coisa).
- **Evidência**: captura da Escalação, logo abaixo do campo.
- **Gravidade**: Baixa — não é claramente um bug, é falta de clareza
  visual; não investiguei o código nesta auditoria (fora de escopo, só
  leitura visual).
- **Impacto no usuário**: um elemento de informação cuja relação com o
  resto da tela não é autoexplicativa.
- **Recomendação**: antes de decidir tratamento visual no Figma, confirmar
  no código qual é a relação exata desse cartão com o goleiro escalado —
  não presumir a resposta aqui.
- **Pertence a**: tarefa técnica separada (investigação primeiro, decisão
  de design depois).

---

## Resumo por gravidade

| Gravidade | Quantidade | Achados |
|---|---|---|
| Crítica | 1 | #1 |
| Alta | 2 | #2, #3 |
| Média | 6 | #5, #6, #7, #8, #9, #12 |
| Baixa | 3 | #4, #10, #13 |
| Informativa | 1 | #11 |

## O que esta auditoria NÃO cobre (fora de escopo desta etapa)

- Medição numérica de contraste WCAG (só impressão visual, ver achado 12).
- Telas que exigem login real (não fiz login, pra não gravar nada real).
- Fluxo de partida ao vivo minuto a minuto (só testei "rodada rápida",
  que pula direto pro resultado).
- Comportamento em dispositivo físico real (testado só em viewport
  simulado 375×812, não em hardware Android/iOS de verdade).
- Qualquer alteração — esta auditoria é estritamente observacional.
