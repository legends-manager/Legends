# PLANO GAME FEEL AAA — "Legends com alma de Clash Royale/Pokémon GO/FIFA Heroes"
**Versão 1.1 · 20/jul/2026 · Elaborado por Claude (Fable 5) a pedido de Felyp**
**v1.1: adiciona §6-B (composição de cena / level design de telas) + C2.6/C2.7 — feedback do Felyp de que a composição estava simples demais.**
**Análise e plano priorizado — NADA aqui está aprovado para implementação até o Felyp aprovar por partes.**

Baseado em leitura real do repo: `CLAUDE.md`, `PLANO_MESTRE_LEGENDS_LIMEIRA.md`,
`REDESIGN_LEGENDS_MANAGER.md`, specs (`spec-mercado.md`, `spec-liga-viva.md`,
`spec-marco2-polish.md`, `spec-fase1-fundacao-online.md`), motor (`engine/simulador.js`,
`engine/copa.js`, `engine/mundo.js`), telas (`Escalacao.jsx`, `PartidaAoVivo.jsx`,
`Intervalo.jsx`, `Resultado.jsx`, `TelaCopa.jsx`, `FimDeTemporada.jsx`,
`ConquistaCelebracao.jsx`, `Pacotinho.jsx`), sistemas (`storage/audio.js`,
`storage/conquistas.js`, `engine/pacotinhos.js`, `data/lendas.js`, `storage/quiz.js`),
design system (`entry-hub/estilos.js`, `index.css`) e assets (`public/sfx/`: apito,
torcida-gol, chute).

---

## 1. Auditoria crítica de game feel — tela por tela

**Onde o jogo JÁ tem estrutura AAA** (não reinventar — este é o padrão a espalhar):
a cadeia FimDeTemporada → Pacotinho → ConquistaCelebracao. Own-screen de verdade,
antecipação→revelação em 3 fases (`Pacotinho.jsx`: escolha → "TOQUE PRA ABRIR" →
revelado), som por raridade (`tocarSomTier`), mascote com entrada animada
(`mascoteEntra`/`mascoteBalanco` em `index.css`), fundo de arena só nos tiers altos.
Isso é exatamente o "level up" do FIFA Heroes que o PLANO_MESTRE §3.2 pediu. O problema
do jogo não é não saber fazer momento — é que **90% do tempo de jogo acontece longe
desses momentos**.

Tela a tela, sem elogio vazio:

- **Escalação** (`Escalacao.jsx`) — a tela mais usada do jogo é uma pilha de ~9 cards
  de texto com o MESMO peso visual: copa, semana temática, provocação, orçamento,
  torcida, comentários, escalados, campinho, formação. Tudo 12px, tudo `superficie`.
  O confronto da rodada — a promessa emocional pela qual o jogador está ali — é uma
  linha de texto ("vs Sereno FC · visitante") no cabeçalho. **Não existe momento VS.**
  Clash Royale nunca te deixa entrar em partida sem te mostrar contra quem, em tela
  cheia, com peso. Diagnóstico: informação certa, hierarquia emocional errada.
- **Partida ao vivo** (`PartidaAoVivo.jsx`) — tem o esqueleto certo (relógio, "AO VIVO"
  pulsante, faixa de gol com glow + arte). Mas: (a) o gol **aparece sem antecipação** —
  o payoff mais importante do jogo chega do nada, banner+som simultâneos ao evento;
  (b) lance perigoso tem o mesmo peso visual de qualquer narração (`textSecondary`,
  card igual); (c) nada muda no clímax — 45'+ com jogo empatado é visualmente idêntico
  ao minuto 3; (d) placares dos outros jogos mudam sem nenhum flash; (e) o placar
  principal não reage quando muda (número troca, sem "soco"). É uma transmissão em
  texto, não uma experiência de tensão.
- **Intervalo** (`Intervalo.jsx`) — puramente operacional: duas colunas de botões 12px.
  Zero vestiário, zero decisão. O único ponto de agência DENTRO da partida é trocar
  jogador. É a maior oportunidade barata de interatividade do jogo (ver §4-B).
- **Resultado** (`Resultado.jsx`) — **vitória e derrota são a mesma tela.** Mesma cor,
  mesmo layout, mesma hierarquia. O jogador que ganhou de 6 e o que perdeu de 6 veem
  o mesmo card cinza. Craque da Partida é um cardzinho com `★` unicode — o
  PLANO_MESTRE §5 F1b pedia "Craque da Partida com gold de verdade" (momento), ainda
  não aconteceu. Não há gancho pra próxima rodada (acabou → "Ver tabela", seco).
- **Tabela / Artilharia / Mercado** — sóbrias POR REGRA (PLANO_MESTRE §3.3: "telas
  operacionais continuam sóbrias") — isso está CERTO, não mexer no tom. Ressalva no
  Mercado: a negociação é instantânea (`proporJogador` resolve aceite/recusa no mesmo
  toque) — o "drama de negociação" prometido no PLANO_MESTRE §4.3 (persuasão) nunca
  virou experiência. Não é urgente, mas é emoção deixada na mesa.
- **Copa** (`TelaCopa.jsx` + `engine/copa.js`) — o tratamento de evento ("Uma partida.
  Sem segunda chance." + CTA com glow) está bom. Mas o clímax máximo do futebol —
  **pênaltis — é resolvido por `Math.random() < forcaA/(forcaA+forcaB)` invisível**
  (`copa.js:65`) e reportado como uma palavrinha. O momento mais dramático possível
  do esporte hoje é o menos dramático do jogo. Maior desperdício de emoção do repo.
- **Transversal** — (a) emojis ainda em **11 arquivos de componente** (18 ocorrências;
  REDESIGN §4 chama isso de "prioridade máxima de percepção" — é a maior denúncia
  visual de "projeto de hobby"); (b) uma única animação de entrada (`telaEntra`) sem
  stagger de listas; (c) **zero haptics**; (d) 3 arquivos de som existem
  (`public/sfx/`) mas a partida usa pouco — apito/chute são subutilizados; (e) o
  Ranking já abre na aba mensal (REDESIGN §5.8 ✓ — não acusar de novo).

---

## 2. Princípios transferíveis (e anti-padrões a rejeitar)

**De Clash Royale:**
1. *Momento VS* — antes de toda partida, uma tela de matchup (escudos grandes, nomes,
   contexto "3º contra 1º"). Por que funciona: cria investimento antes do resultado
   existir. Tradução: tela VS de ~1,5s entre "Jogar ao vivo" e o relógio (§7-C2).
2. *Resultado quantificado além de W/L* — coroas dão textura à vitória. Tradução:
   Resultado com cara de vitória OU derrota + destaque de números ("maior goleada da
   sua temporada").
3. *Clareza acima de tudo* — CR é lível num relance mesmo sendo vibrante. Tradução:
   a regra sóbrio/momento do REDESIGN já é isso; manter, não "enfeitar tabela".

**De Pokémon GO:**
4. *Conquista com contexto* — medalha gravada com onde/quando. Já GRAVAMOS data+clube
   +temporada (`storage/conquistas.js`) — mas a UI quase não mostra. Tradução: exibir
   contexto na galeria (custo ~zero).
5. *Silhueta de desejo* — o que falta é visível e nomeado. Tradução: galeria de
   insígnias bloqueadas em silhueta (F1c previa) + **álbum de lendas** dos pacotinhos
   (as 12 de `data/lendas.js` como coleção com silhuetas — hoje a lenda some da vista
   quando a temporada acaba).
6. *Evento rotativo* — o mundo muda semanalmente. JÁ EXISTE (`engine/semana.js`,
   semana temática) — falta dar peso sensorial (selo visual/som próprio) pra parecer
   evento, não um card de texto.

**De FIFA Heroes:**
7. *Celebração own-screen com 1 toque* — feito (`ConquistaCelebracao`). Espalhar o
   mesmo padrão pra momentos que ainda são cards (craque da partida, acesso).
8. *Antecipação→revelação* ("TOQUE!") — feito no `Pacotinho`. Levar o princípio pra
   PARTIDA (gol com batida de antecipação, §3).
9. *Mascote com personalidade* — começou (comemorando/confiante). Dar mais palcos
   (derrota = consolo, VS screen = provocação).

**Anti-padrões que NÃO entram (e por quê):**
- **Loot box paga / gacha por dinheiro** — nosso pacotinho é grátis, 1×/temporada,
  probabilidades declaradas (⚙️ em `pacotinhos.js`). Mudar isso mataria a confiança
  de uma liga onde todo mundo se conhece. Travado pelo CLAUDE.md de qualquer forma.
- **Timers de energia / "volte em 4h"** — a sessão é do jogador. Nada no plano cria
  espera artificial.
- **FOMO punitivo (streak que se perde, evento que expira pra sempre)** — a semana
  temática é rotativa e sem punição; manter. Nada de "perdeu, acabou".
- **Pity/probabilidade escondida** — nossas taxas são explícitas; transparência é
  vantagem num produto de comunidade, não fraqueza.

---

## 3. Spec de game feel (a parte barata que separa AAA de hobby)

**3.1 Motion — tokens novos em `index.css` (hoje só existe `telaEntra` 0.22s):**
- `--dur-tap: 120ms` (feedback de toque — botões já têm via `button:active`);
- `--dur-base: 220ms` ease-out (entrada de tela — manter o atual);
- `--dur-celebra: 500–700ms` com `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot —
  JÁ usado em `mascoteEntra`; promover a token e usar em toda celebração);
- **stagger de lista**: itens entram com delay incremental de 40ms (máx. 8 itens,
  depois instantâneo) — aplica em eventos da partida, lista da tabela, galeria.
  Regra dura: **overshoot só em celebração**; telas operacionais usam ease-out seco.
  Tudo já respeita `prefers-reduced-motion` (bloco existente no `index.css`).

**3.2 Antecipação→payoff (a regra dos 400ms):** nenhum payoff raro aparece "do nada".
No tick ANTES do gol (o motor já sabe: `ev` tem `min` de todos os eventos —
`App.jsx` só revela por minuto), a borda do card do placar pulsa lime por ~400ms +
`chute.mp3`; só então banner + `torcida-gol.mp3` + shake. Custo: pequeno (o array de
eventos é conhecido desde `montarJogo()` — é só olhar 1 minuto à frente). Este é o
upgrade de maior retorno emocional por linha de código do plano inteiro.

**3.3 Som (reusar os 3 arquivos + síntese, zero asset novo obrigatório):**
- `apito.mp3`: início do jogo, intervalo, fim — âncora ritual da partida;
- `chute.mp3`: lance perigoso do MEU time + antecipação de gol (3.2);
- `torcida-gol.mp3`: gol meu (já) + pênalti convertido + acesso/campeão (já);
- `tocarDing` (síntese, `audio.js`): confirmações leves; variação descendente
  (2 notas invertidas, ~5 linhas) para "quase!"/derrota — sem arquivo novo.
  Regra de raridade sonora já codificada em `tocarSomTier` — o princípio se estende:
  quanto mais raro o momento, mais "real" o som (síntese → gravação).

**3.4 Haptics (`navigator.vibrate` — Android vibra, iOS ignora em silêncio):**
15ms no toggle de escalação/formação; 40ms no gol do meu time; padrão `[30,50,80]`
em título/acesso/lendário. Nada em navegação ou telas de leitura.
⚠️ Decisão pendente (§8): herda o `mudo` atual ou ganha toggle próprio.

**3.5 Screen shake e partículas (com rédea curta):**
- shake: SÓ gol do meu time e pênalti convertido — `translateX ±3px` por 150ms **no
  card do placar**, nunca na tela inteira;
- confete: só campeão/acesso/lendário — canvas 2D próprio (~2KB, sem lib), cores da
  paleta (lime/gold/steel), 1,5s, morre sozinho. Fora desses 3 contextos, nunca.

---

## 4. Momentos-chave interativos (mini-games dentro da simulação)

Três, e só três — frequência controlada é o que preserva a emoção. Ordem de entrada
recomendada: B (barato) → A (clímax) → C (delicado).

**A) Pênaltis interativos na Copa — esforço M, emoção máxima.**
Gancho existente: `simularJogoCopa` (`copa.js:58-66`) já marca `penaltis: true` no
empate e decide por viés de força invisível. Proposta: quando o confronto é DO
JOGADOR, a decisão vira sequência de 5 cobranças alternadas — barra oscilante, toque
na zona certa converte; goleiro IA defende por sorteio. **Calibração preservada por
construção**: a largura da zona de acerto deriva do MESMO viés atual
(`forcaA/(forcaA+forcaB)`) — jogador de reflexo mediano converte na taxa que o
sorteio já dava; habilidade desloca no máximo ±12% (⚙️). IA×IA continua sorteio puro
(zero mudança nos outros 15 confrontos da fase). Teste de regressão: 1.000 empates
com "toque médio" simulado ≈ taxa de vitória atual.

**B) Decisão tática de intervalo — esforço P, agência imediata.**
No `Intervalo.jsx`, além das substituições: UMA escolha de um toque — Pressionar /
Equilibrado / Segurar. Efeito transparente e pequeno no 2º tempo (ex.: Pressionar =
ataque ×1,06, defesa ×0,96 ⚙️), aplicado como modulação de lambda em `simMetade` —
a MESMA família matemática do mando +5% e da fase 0,92–1,08 (decisão travada 12),
zero mudança estrutural no Poisson. Mostra o efeito escolhido na tela ("2º tempo:
pressão alta") pra decisão ter peso percebido.

**C) Lance decisivo (QTE raro) — esforço M/G, o mais delicado.**
Minutos finais (40'+), jogo empatado ou perdendo por 1: o motor pode sortear (prob.
fixa ⚙️, máx. 1/partida, nem toda partida) um "lance decisivo" do meu time — relógio
pausa, tela de toque com janela de timing; acerto converte em gol, erro vira "quase"
narrado. **Regra anti-inflação**: o gol do QTE é *transferido*, não somado — quando o
evento é sorteado, o lambda restante do 2º tempo é reduzido pelo valor esperado do
QTE, mantendo a média ~3-4 gols/time da decisão travada 12. Exige teste de regressão
de média de gols antes de ligar. Por ser o que mais mexe na filosofia "resultado vem
do motor", fica por último e atrás da decisão do §8.

Por que isso não vira jogo de ação: os três são **pontuais, raros e de um toque** —
o loop continua sendo escalar/decidir/assistir/torcer. Nenhum exige reflexo contínuo,
física ou controle de jogador.

---

## 5. Meta-progressão e retenção (evoluir o que existe)

A cadência de recompensa JÁ existe — rodada (resultado/insígnia) → semana temática
(bônus) → copa (evento paralelo) → fim de temporada (pódio/pacotinho/sobe-desce).
O que falta é cada batida ter peso sensorial distinto e rastro visível:

- **Álbum de Lendas (novo, P/M):** grid das 12 lendas de `data/lendas.js`, obtidas a
  cores + bio, não-obtidas em silhueta com nome oculto. Hoje a lenda some quando a
  temporada acaba — coleção dá razão de longo prazo pra abrir pacotinho ("faltam 3").
  Zero mudança de economia (mesmas taxas, mesmo 1×/temporada).
- **Contexto nas insígnias (quase grátis):** data/clube/temporada já são gravados no
  desbloqueio (`storage/conquistas.js`) — exibir na galeria ("Épico · Kissassa, T3").
- **Gancho "mais uma rodada" (P, alto impacto):** no `Resultado`, trocar o fim seco
  por um card de próxima rodada com narrativa de 1 linha derivada da tabela
  ("Próxima: o líder. Vitória te coloca a 2 pontos.") + botão direto. É o gancho de
  retenção mais barato que existe num jogo de temporada.
- **Recordes pessoais (P):** `engine/mundo.js` já guarda recorde de goleada e
  artilheiro (`atualizarRecordeGoleada`/`atualizarRecordeArtilheiro`) — exibir e
  celebrar quando quebra ("novo recorde da sua carreira!").
- **Semana temática com selo (P):** dar identidade visual/sonora ao evento da semana
  (`engine/semana.js`) — hoje é um card de texto igual aos outros.
- **Streak visível (P):** sequência invicta na Escalação (derivável de
  `formaRecente`), com quebra SEM punição — mostrar, nunca punir (anti-FOMO, §2).

---

## 6. Direção de arte / polish AAA (dentro da paleta e do orçamento)

A regra registrada (PLANO_MESTRE §3.3 / REDESIGN §6) continua sendo a espinha:
**operacional sóbrio, energia nos momentos**. O que falta pra "cara AAA":

1. **Emojis → SVG** (REDESIGN §4, pendente em 11 arquivos) — é o item nº 1 de
   percepção de qualidade. ~20 ícones próprios num `icons.jsx`, stroke 1.5-2px,
   `currentColor`. Sem lib externa.
2. **Tipografia display nos títulos de celebração** — hoje é `font-black italic` da
   fonte de sistema. Uma display condensada via `@font-face` (subset ≤120KB, teto do
   REDESIGN §8) só para celebrações/VS/Copa muda o patamar percebido. Decisão de
   orçamento no §8.
3. **Tela VS** — crests grandes, diagonal em `clip-path` (§6 do REDESIGN já autoriza
   nos heros), contexto do confronto. Reusa `Crest.jsx` + CSS puro, zero asset.
4. **Brush stroke atrás de títulos de celebração** (FIFA Heroes, PLANO_MESTRE §3.2) —
   1 SVG tom-sobre-tom reutilizável.
5. **Moldura de motion unificada** — os tokens do §3.1 aplicados de forma idêntica em
   toda celebração (mesmo timing, mesmo easing) é o que faz o jogo parecer "um
   produto", não telas costuradas.

Orçamento: tudo acima é CSS/SVG/síntese exceto a fonte (item 2). Nenhum raster novo.

---

## 6-B. Composição de cena — "level design" de telas
**(Emenda v1.1, feedback direto do Felyp: "Level Design e Composição de Cena estão
muito simples, muito longe de um jogo AAA." Ele está certo — esta seção corrige.)**

**Diagnóstico honesto:** toda tela do Legends hoje é a MESMA construção — fundo
grafite chapado (`paginaGrafite`), decoração sutil (`PolishDecor`) e uma pilha
vertical de cards. Não existe profundidade, não existe cenário, não existe "onde".
A **Arena Novo Horizonte — decisão travada de ambientação — existe só como label de
texto** (`ARENA.label`). Clash Royale te coloca dentro de uma arena; FIFA Heroes
compõe cada tela com personagem + cenário + camadas; o Legends mostra uma lista.
Matéria-prima JÁ existente e subusada: `public/fundos/celebracao-{wide,poster}.webp`,
6 artes em `public/art/`, 4 poses da mascote, 32 escudos reais.

### Gramática de cena (5 regras)

1. **Três planos nos palcos.** Toda tela-palco compõe: FUNDO (cenário ambiental com
   scrim), MEIO (o herói da cena — UM elemento grande) e FRENTE (UI/ações). Telas
   operacionais continuam 1 plano (a regra sóbria do REDESIGN §6 não muda).
2. **Cada tela é um LUGAR nomeável.** O jogador deve conseguir dizer onde está sem
   ler o título:
   | Tela | Lugar | Herói da cena | Fundo |
   |---|---|---|---|
   | Início/Entry | Centro de treinamento | capa + mascote presente | `capa-legends.jpg` (já) + mascote confiante ancorada |
   | Escalação | Prancheta do vestiário | **o campinho, GRANDE** (hoje é um card no meio da pilha) | vestiário escuro (Lote 3) |
   | VS pré-jogo | Túnel de entrada | os 2 escudos em escala | túnel (Lote 3) |
   | Partida ao vivo | Arquibancada da Arena à noite | **o placar como placar de estádio** | `celebracao-wide.webp` com scrim (JÁ DÁ, sem asset novo) |
   | Intervalo | Vestiário | placar parcial + prancheta | mesmo fundo da Escalação |
   | Copa | Palco de evento | o confronto sob holofote | palco escuro (Lote 3) |
   | Fim de temporada | Cerimônia | pódio/mascote (já é) | `celebracao-poster.webp` (já) |
   | Tabela/Mercado/Ranking | Escritório (sóbrio) | — | chapado como hoje (regra mantida) |
3. **Profundidade barata (CSS, sem lib):** parallax de 2 camadas (fundo com
   `translateY` mais lento que o scroll do conteúdo), vinheta radial escura nas
   bordas pra focar o olho no herói da cena, "luz de estádio" descendo do topo
   (gradiente linear lime/branco a 8-12% de opacidade). Custa transform/opacity —
   dentro da regra de performance do REDESIGN §6.
4. **Escala e ancoragem.** Um elemento por cena tem direito a ser GRANDE. Hoje placar,
   campinho, escudo e craque têm todos o mesmo tamanho de card — escala uniforme é a
   assinatura visual de planilha. O placar da partida deve dominar; o campinho da
   escalação deve ser a tela, não um item dela.
5. **Legibilidade inegociável.** Scrim mínimo de 70-85% sobre qualquer fundo de cena
   (contraste AA do REDESIGN §5.6); fundos ≤200KB cada, lazy por tela, e fora das
   telas operacionais. ⚠️ Teto de sessão do REDESIGN §8 (≤800KB): com 3 fundos novos
   é preciso lazy-load rigoroso — fundo só baixa quando a tela abre.

### Lote 3 de GPT Image (Felyp gera; prompts prontos entram no PROMPTS_GPT_IMAGE.md)

1. **Vestiário** — armários escuros, camisa pendurada, luz lime fria, sem pessoas
   (fundo de Escalação/Intervalo);
2. **Túnel de entrada** — perspectiva pro campo iluminado ao fundo (VS screen);
3. **Palco de mata-mata** — holofotes cruzados sobre fundo navy/grafite (Copa).
   (A arquibancada noturna da Partida NÃO precisa de asset novo — `celebracao-wide`
   resolve a v1.)

---

## 7. Roadmap priorizado (P=dias, M=~1 semana, G=mais)

**Camada 1 — "Game Feel Pack" (sem tocar em motor nem backend; risco ~zero):**
| Item | Esforço | Impacto |
|---|---|---|
| C1.1 Antecipação de gol (regra 400ms) + sons de partida completos (apito/chute) | P | **Altíssimo** — transforma a tela mais emocional |
| C1.2 Motion tokens + stagger de listas | P | Alto — o jogo inteiro fica "produto" |
| C1.3 Vitória ≠ derrota no Resultado + craque com gold de momento | P | Alto |
| C1.4 Gancho "próxima rodada" no Resultado | P | Alto (retenção) |
| C1.5 Haptics | P | Médio (Android) |
| C1.6 Shake no placar + flash nos outros jogos | P | Médio |

**Camada 2 — "Palco" (UI nova, motor intacto):**
| Item | Esforço | Impacto |
|---|---|---|
| C2.1 Tela VS pré-jogo | M | Alto |
| C2.2 Decisão tática de intervalo (mini-game B) | P/M | Alto — 1ª agência in-match |
| C2.3 Álbum de Lendas + contexto nas insígnias | M | Alto (coleção/retenção) |
| C2.4 Emojis→SVG (REDESIGN §4) | M | Alto (percepção de qualidade) |
| C2.5 Semana temática com selo + recordes + streak | P | Médio |
| C2.6 Cenografia v1: Partida como Arena (fundo existente + scrim + placar de estádio + vinheta/parallax) e Escalação como prancheta (campinho grande) | M | **Altíssimo** — mata o "fundo chapado" nas 2 telas mais usadas |
| C2.7 Cenografia v2: VS/Copa/Intervalo com fundos do Lote 3 (depende de Felyp gerar) | M | Alto |

**Camada 3 — "Clímax" (mexe em regra de resultado — atrás das decisões do §8):**
| Item | Esforço | Impacto |
|---|---|---|
| C3.1 Pênaltis interativos na Copa (mini-game A) | M | **Altíssimo** |
| C3.2 Lance decisivo QTE (mini-game C) | M/G | Alto, risco de calibração |
| C3.3 Confete de campeão + fonte display + brush stroke | P/M | Médio (acabamento) |

Nada em nenhuma camada exige backend, multiplayer ou monetização. Tudo offline-first.

---

## 8. Decisões que SÓ o Felyp pode tomar (nada disso está assumido)

1. **Habilidade do jogador pode influenciar resultado?** (bloqueia a Camada 3)
   Hoje o resultado é 100% do motor (decisões travadas 8/12 — Poisson calibrado,
   zebra viva). Pênaltis interativos (±12% ⚙️) e QTE (gol transferido) introduzem
   skill de reflexo no resultado pela primeira vez. É mudança de filosofia de jogo,
   não de código. Opções: (a) aprovar com teto de influência; (b) aprovar só o modo
   "ritual" (mini-game visual, resultado continua 100% sorteio — emoção sem skill);
   (c) recusar — Camadas 1-2 seguem valendo sozinhas.
2. **Haptics**: herda o botão `mudo` atual ou ganha toggle próprio?
3. **Fonte display** (~100-120KB de asset): dentro do teto do REDESIGN §8, mas é o
   único item do plano que gasta orçamento de peso — vale?
4. **Drama de negociação no Mercado** (persuasão do PLANO_MESTRE §4.3): fora deste
   plano por ser sistema, não game feel — promover a ativo ou deixar quieto?

**Cerca (listado por dever, NÃO proposto):** qualquer PvP/multiplayer, push
notification, monetização, backend de gameplay, edição de elenco — continuam fora,
nada no plano depende deles.

---

## 9. Primeira entrega proposta (após aprovação)

**Camada 1 completa** (C1.1–C1.6) numa branch única `gamefeel/camada-1`, com
verificação ao vivo tela a tela e testes verdes. É a de maior retorno por risco:
nenhuma regra de jogo muda, nenhum save muda, e o jogo inteiro passa a "responder".

Aprovando ("aprovada camada 1"), começo por C1.1 — antecipação de gol.
