# spec-marco2-polish.md — Polimento do Marco 2: setinhas, manchetes, torcida e capa

> Quatro adições de camada fina sobre o Marco 2. NENHUMA mexe no motor (atributo, força
> interna, Poisson, mando, fase). Números ⚙️ são calibráveis.

## 1. Setinha de valorização (▲▼)
- Novo campo por jogador: `valorRef` = valor no fechamento da última janela (ou início da temporada).
- Exibição ao lado do valor: ▲ verde se valor > valorRef, ▼ vermelho se menor, "–" se igual
  (tolerância ±2 ⚙️). Onde: Escalação (elenco próprio) e TODAS as abas do Mercado — na aba
  Comprar a setinha também aparece (informação pública), mas o atributo bruto de outros times
  continua oculto.
- `valorRef` atualiza ao fechar cada janela e ao iniciar temporada.

## 2. Manchetes de transferência
Geradas ao fechar cada janela, a partir do `historico` (máx. 3 ⚙️, topo do resumo
"Movimentações da janela"). Tom de várzea, frases curtas:
- Compra ≥ L$800 ⚙️ → "💣 BOMBA: {comprador} contrata {jogador} por L$ {valor}!"
- Venda do jogador mais valioso do elenco → "{vendedor} vende a joia: {jogador} vai pro {comprador}"
- Time que mais gastou → "{time} abriu o cofre nesta janela"
- Janela sem movimentação → "Janela morna: ninguém abriu o cofre"

## 3. Torcida
- Novo campo por time: `torcida` (torcedores). Inicial: 500 ⚙️.
- Após cada rodada: vitória **+8%** ⚙️ · empate **+1%** ⚙️ · derrota **−6%** ⚙️.
  Clamp **100–5000** ⚙️, arredondado.
- Exibição: na Escalação, junto do orçamento — "🏟️ 1.240 torcedores" com ▲▼ vs rodada anterior.
- Comentários da torcida (1 por rodada na tela de Resultado; últimos 3 visíveis na Escalação ⚙️).
  Pools de ~8 frases ⚙️ por humor, sem repetir a última:
  - **Bom** (3+ vitórias seguidas OU top 3): "É CAMPEÃO!", "Melhor time da várzea!",
    "Lotamos a Arena Novo Horizonte!"
  - **Neutro**: "Vamo que vamo.", "Jogo duro, mas tamo junto."
  - **Ruim** (3+ derrotas seguidas OU últimos 3 da tabela): "Devolve o bicho!",
    "Assim não dá, técnico!", "Que vergonha na Arena!"
- **SEM efeito no jogo nesta fase:** torcida não altera λ, mando, fase nem atributo — evita
  bola de neve (quem ganha teria torcida maior → jogaria melhor → ganharia mais) e mantém o
  motor travado do v3. Micro-bônus de mando por torcida = decisão futura ⚙️ (registrada no roadmap).
- Save: campo ausente ao carregar (save v2 antigo) → inicializar 500, sem bump de versão.

## 4. Tela inicial — capa "Legends"
- Direção: a tela inicial vira uma **capa** no padrão das artes da marca da liga
  (referência de CLIMA: pôster de game AAA — inspiração, **não** cópia de layout do Metasoccer
  ou de qualquer produto de terceiros).
- **Capa = marca (roxo); dentro do jogo = verde-campo atual.** Nada muda nas outras telas.
- Estrutura: escudo da onça como herói no topo, wordmark "LEGENDS MANAGER" (itálico, peso black,
  system font — sem web font nova), linha "Série C · Legends Liga Fut7 · 2026", input do nome
  do técnico, botões Continuar / Nova temporada, grid dos 12 times em cards (sigla + cor, borda
  com leve gradiente roxo), rodapé "Simulação — BETA".
- Paleta da capa ⚙️: fundo gradiente #2A0E4F → #14081F, texto #F2ECFA, ação/CTA mantém o
  âmbar #FFC53D do app.
- **Herói da capa:** a arte v2 com os dois jogadores ESTILIZADOS (renders de game — aprovada:
  não há sósia de pessoa real) como imagem de fundo/topo, com overlay de gradiente pra
  legibilidade do wordmark e dos botões.
- Assets (Felyp adiciona ao repo, fora do Claude Code):
  - `/public/brand/capa-avatares.png` — a arte v2 (jogadores estilizados) → herói da capa
  - `/public/brand/escudo.png` — o escudo da onça (usos secundários e fallback)
  - **Regra permanente:** nenhuma imagem com rosto de pessoa real ou sósia entra no app.
    (A arte v1 continua vetada; a v2 estilizada passa.)
  - Fallback em cascata: sem capa-avatares.png → usa escudo.png; sem nenhum → capa
    tipográfica com a coroa/wordmark (sem quebrar).

## 5. Avatar do técnico (galeria)
- Conjunto de **8–12 avatares** ⚙️ pré-gerados pelo Felyp (GPT Image), no MESMO estilo da arte
  da capa (bustos, render de game, fundo transparente ou roxo), PNG quadrado ~512px, salvos em
  `/public/avatars/a01.png … a12.png`. Variedade de tons de pele, cabelos, barba, boné etc. —
  todo mundo da liga precisa achar um que "seja ele".
- **Seleção:** na capa, junto do nome do técnico — carrossel/grid horizontal dos avatares;
  escolha guardada no save como `avatarId` (ausente = fallback: círculo com as iniciais do
  técnico; nada quebra sem os assets).
- **Exibição:** capa (seleção), cabeçalho da Escalação (pequeno, ao lado do nome) e **pôster de
  campeão** (destaque junto do nome do técnico — é o lugar que rende no print).
- Sem geração dinâmica por usuário nesta fase (exigiria backend/pipeline) — galeria fixa.
  Avatar personalizado por usuário = evolução futura registrada no roadmap.

## 6. Checklist
- [ ] ▲▼ de valor correto após janela com compra, venda e ociosidade.
- [ ] Manchetes ao fechar janela; janela vazia gera "Janela morna".
- [ ] Torcida sobe/desce conforme resultado, clamp 100–5000, comentário coerente com a campanha.
- [ ] Buscar `torcida` em `src/engine/` não retorna NADA em fórmula de simulação (só dados/UI).
- [ ] Save v2 sem torcida carrega e inicializa 500 sem crash.
- [ ] Capa renderiza com capa-avatares.png; fallback em cascata funciona sem os arquivos;
      demais telas seguem verde-campo.
- [ ] Galeria de avatares: escolha persiste no save; save antigo sem avatarId usa as iniciais;
      app funciona sem a pasta /public/avatars.
- [ ] Avatar aparece na Escalação e no pôster de campeão.
- [ ] Nenhuma imagem com rosto de pessoa real/sósia dentro do app (arte v1 vetada; v2 estilizada ok).
