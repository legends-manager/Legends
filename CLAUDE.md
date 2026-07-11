# CLAUDE.md — Legends Manager (Marco 1 — Single-Player)

Contexto que o Claude Code deve carregar antes de tocar em qualquer código.
Base: documento do projeto **v3** + decisões travadas depois dele (listadas abaixo como emendas).

## O que é
Jogo de gestão de futebol estilo Brasfoot, mobile-first, ambientado na **Série C real da Legends Liga Fut7** (Limeira-SP, 12 times, elencos reais). Marco 1 = **single-player**: 1 humano escolhe 1 dos 12 times reais e joga contra 11 IAs em temporada de pontos corridos (22 rodadas, ida e volta). Distribuição: link no WhatsApp da liga. Grátis, sem backend.

## Ambientação (fixo)
- Todas as partidas acontecem na **Arena Novo Horizonte**, em **Limeira-SP**.
- Texto padrão: **"Arena Novo Horizonte — Limeira, SP"**, exibido de forma discreta em exatamente 3 lugares: partida ao vivo, tela de resultado e tela de campeão. Em nenhum outro.

## Decisões travadas (v3 consolidado — não reabrir sem autorização do Felyp)
1. Sem teste de validação formal — o lançamento é o teste.
2. Single-player apenas. Hot-seat foi testado e descartado. Multiplayer = backlog (Supabase).
3. Pontos corridos, todos contra todos, ida e volta = 22 rodadas, grupo único.
4. **[Emenda]** Elencos **reais** com **tamanho variável** (11–18 jogadores), vindos de `src/data/elencos-reais.js` — extraídos do Copa10 e conferidos pelo Felyp. Nada de cortar jogador ou inventar nome. Entidade `jogador` com campo `origem`.
5. **[Emenda]** Atributos = base por posição + **viés das estatísticas reais** (gols/assistências/MVP do Copa10) + **ruído aleatório** re-sorteado a cada temporada → favoritos existem, zebras acontecem.
6. **[Emenda — substitui a decisão 5 do v3]** Força dos times é **100% interna ao motor**: o bolo fixo (2×forte, 3×médio-forte, 4×médio, 3×fraco) continua sendo sorteado automaticamente a cada nova temporada, mas **sem estrelas na interface e sem botão de re-sortear**. Nenhum indicador de força visível.
7. IA rotaciona escalação (nem sempre os 7 melhores). A escalação do jogador vem pré-carregada com os melhores.
8. Partida ao vivo: relógio minuto a minuto (2×25 min, ~200ms/min), **faixa de gol compacta no topo** (~1,5s, som sintetizado + botão mudo) — NUNCA overlay de tela cheia. Gols com autor + assistência + descrição; lances perigosos narrados; placares dos outros 5 jogos ao vivo.
9. Substituições só no intervalo, máx. 3, **goleiro só por goleiro**. Times com **1 goleiro** (Real União, Sereno FC, Marselha FC, Nordeste FC, Fortaleza, Dragon Bola FC) não têm troca de goleiro disponível.
10. Extras do Marco 1: tabela (P J V E D GP GC SG %), artilharia top 10, fase do time (▲▼, multiplicador 0,92–1,08), Craque da Partida (gols×3 + assistências×1,5; se 0x0, o goleiro), rodada rápida, tela de campeão.
11. **[Emenda]** Campo **"nome do técnico"** na tela inicial + **tela de campeão desenhada para print** (pôster compartilhável no WhatsApp) — é o substituto do ranking de usuários no Marco 1. Ranking online = backlog (exige backend).
12. Simulador calibrado pro Fut7 real: Poisson, média ~3-4 gols/time, mando +5%. (A rodada 1 real teve 8x4, 6x2, 5x3, 4x3 — calibração validada.)
13. Grátis, sem backend. Save via localStorage. Marca: "Legends Manager". Rodapé "Simulação — BETA".

## Dados reais — regras invioláveis
- `elencos-reais.js`: 196 jogadores, 12 times, fonte Copa10 (rodada 1, jul/2026).
- **CPF ou qualquer identificação pessoal NUNCA entra em arquivo nenhum**, mesmo que apareça na fonte.
- **Conferência do Felyp é bloqueante**: o link não vai pro grupo antes de ele validar nomes e times.
- Nome oficial do time: **Dragon Bola FC** (o v3 dizia "Dragon Bol" — corrigido pela página oficial).
- Nunca inventar ou "completar" dados de jogadores reais. Em dúvida, perguntar ao Felyp.

## Marco 2 — Mercado de Transferências (ativo)
Promovido do backlog para escopo ativo por decisão explícita do Felyp (jul/2026). Contrato completo em `spec-mercado.md`.

## Marco 3 — Séries A/B/C (ativo)
Seletor de série na capa; Série B (10 times reais, súmulas) e Série A (10 times da Kings League Brasil, risco de IP assumido pelo Felyp) somam-se à Série C. Mesmo motor, `serieBonus` desloca o nível médio por série (C=0/B=+6/A=+12, teto 90→92). Save por série (`legends-manager:save-v2:<serie>`). Contrato: `spec-multi-serie.md`.

## Marco 3.5 — Liga Viva (ativo, REVERTE a decisão travada 11 do v3)
Conecta as três séries num único mundo com promoção/rebaixamento (2 sobem/2 descem por fronteira), estilo Brasileirão/Brasfoot. Modo carreira: o técnico acompanha o time que sobe/desce — não se reescolhe time a cada temporada. **A divisão de cada time agora PERSISTE entre temporadas** (antes, tudo "voltava à série de origem"); elencos continuam reais e imutáveis. A antiga tela de campeão/"nova temporada com o mesmo time" foi substituída pela tela de Fim de Temporada (pódio + sobe/desce/permanece das três séries + hall de campeões). Kings entra na roda de acesso normalmente; Mundial de Clubes fica guardado pra depois. Contrato: `spec-liga-viva.md`.

**[Emenda]** Tabela ao vivo das 3 séries: substitui a "simulação rápida em segundo plano" original do §5 da spec (que só gerava a tabela final das outras 2 séries no fim da temporada). Agora as outras duas séries são simuladas **rodada a rodada, em paralelo com a do jogador** (`engine/simulador.js`: `iniciarSerieParalela` + `avancarRodadaSimples`, chamado a cada `finalizarRodada`), com estado leve persistido em `S.outrasSeries` (elenco/força/fase/tabela — sem mercado/torcida/orçamento, ninguém administra essas duas). A tela Tabela ganhou abas A/B/C, todas reais e atualizadas. Calendários de tamanhos diferentes (C=22, A/B=18) são tratados: a série mais curta só para de avançar; se o jogador está na mais curta, a mais longa é completada de uma vez no fim da temporada (`sincronizarSerieParalela`).

## Marco 4 — Scouting, Copa e Quiz (ativo)
Três pedidos do Felyp (jul/2026) que promovem itens da cerca do backlog pra escopo ativo, com decisões explícitas de como cada um entra sem violar as travas do motor/economia:
- **Scouting no mercado** (`Mercado.jsx`, aba "Times"): visita o elenco INTEIRO de qualquer time da própria série (não só quem está listado) e propõe por qualquer jogador (`engine/mercado.js`: `proporJogador`). Decisão: **mantém o sigilo do atributo bruto** de jogador de time alheio (spec-mercado.md §8 continua valendo — só g/a reais + valor de mercado, igual à aba Comprar). A IA vendedora só aceita propostas ≥ 1,35× o valor do jogador (⚙️); sem isso, negociação instantânea, sem contraproposta.
- **Copa cruzando as 3 séries** (`engine/copa.js`): mata-mata puro, sorteio aleatório, 32 times reais (A+B+C — chave perfeita, sem bye), 5 fases (16-avos → final). Roda em PARALELO com o campeonato de pontos corridos: 1 fase avança a cada rodada de liga concluída, EXCETO quando o jogador tem confronto pendente nela (aí espera ele jogar, na tela "Copa"). Times de fora da série do jogador vêm do mesmo estado paralelo da tabela ao vivo (`S.outrasSeries`) — a copa não cria uma segunda economia pros outros 31 times, só o jogador ganha dinheiro nela (L$80 por vitória, L$500 como campeão, ⚙️). Empate = pênaltis decididos por viés de força + sorte, sem UI extra. **Sem escalação própria**: usa a escalação atual da liga (simplificação consciente de v1 — o técnico não gerencia dois times).
- **Quiz de curiosidades** (`storage/quiz.js`): aparece com chance baixa (25% ⚙️) ao fim de cada rodada de liga, banco de perguntas de futebol (fatos públicos, não envolvem a Legends Liga fictícia), resposta certa credita L$20-40 (⚙️), errar/pular não penaliza. Deliberadamente raro e modesto pra não competir com a economia calibrada do Marco 2.

## Cerca do backlog (NÃO construir agora)
Multiplayer/link-convite, ranking online de técnicos, edição de elenco in-game, escudos reais, finanças, cartões/lesões, crônicas por IA, cards com rosto, monetização. Se parecer boa ideia no meio do caminho: **parar e perguntar, não construir.**
(Mata-mata e olheiro/scouting saíram da cerca — ver Marco 4 acima. "Scouting" aqui significa navegar o elenco de qualquer time da própria série; **NÃO** revela atributo bruto de jogador de time alheio — isso continua fora de escopo.)

## Stack
React + Vite. Sem backend. Deploy Vercel. PWA básica (manifest + ícones; sem service worker offline no Marco 1).

## Fonte da verdade de design
**`legends-manager-demo.jsx`** (nova demo, jul/2026) substitui `legends-serie-c-sorteado.jsx` como referência visual e funcional — ela já incorpora elencos reais, força interna, técnico e Arena. Divergência entre docs e demo: perguntar ao Felyp.

## Papel do Claude Code
Executar o `build-spec-marco1.md`: migrar a demo para projeto real, implementar save/continue, PWA e preparar deploy. Nada de features novas por iniciativa própria.
