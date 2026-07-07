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

## Cerca do backlog (NÃO construir agora)
Multiplayer/link-convite, ranking online de técnicos, mercado/transferências, edição de elenco in-game, escudos reais, Séries A/B, finanças, carreira multi-temporada, cartões/lesões, mata-mata, olheiro/crônicas por IA, cards com rosto, monetização. Se parecer boa ideia no meio do caminho: **parar e perguntar, não construir.**

## Stack
React + Vite. Sem backend. Deploy Vercel. PWA básica (manifest + ícones; sem service worker offline no Marco 1).

## Fonte da verdade de design
**`legends-manager-demo.jsx`** (nova demo, jul/2026) substitui `legends-serie-c-sorteado.jsx` como referência visual e funcional — ela já incorpora elencos reais, força interna, técnico e Arena. Divergência entre docs e demo: perguntar ao Felyp.

## Papel do Claude Code
Executar o `build-spec-marco1.md`: migrar a demo para projeto real, implementar save/continue, PWA e preparar deploy. Nada de features novas por iniciativa própria.
