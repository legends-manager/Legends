# Prompt pro Claude Code — Polimento do Marco 2 (setinhas, manchetes, torcida, capa, avatares)

Coloque `spec-marco2-polish.md` (v2) na pasta do projeto. Um prompt por vez.

## Passo 0 — Assets (você, fora do Claude Code)
1. Exporte a arte v2 (jogadores estilizados) → `public/brand/capa-avatares.png`.
2. Exporte o escudo da onça → `public/brand/escudo.png`.
3. Gere no GPT Image **8–12 avatares** no mesmo estilo (bustos, render de game, PNG quadrado
   ~512px, fundo transparente ou roxo, variedade de tons de pele/cabelo/barba/boné) →
   `public/avatars/a01.png` … `a12.png`.
A arte v1 (com o rosto sósia) NÃO entra no app.

## Passo 1 — Setinhas de valorização
> "Leia spec-marco2-polish.md. Implemente a seção 1: campo valorRef por jogador (atualizado ao
> fechar janela e ao iniciar temporada) e a setinha ▲▼ ao lado do valor na Escalação e em todas
> as abas do Mercado, com tolerância ±2. Não exiba atributo bruto de outros times."

## Passo 2 — Manchetes de transferência
> "Implemente a seção 2: manchetes ao fechar cada janela a partir do historico (bomba ≥ L$800,
> venda da joia, quem mais gastou, janela morna), máximo 3, no topo de 'Movimentações da janela'."

## Passo 3 — Torcida
> "Implemente a seção 3: campo torcida por time (inicial 500; vitória +8%, empate +1%, derrota
> −6%; clamp 100–5000), exibição na Escalação com ▲▼, e comentários por humor (bom/neutro/ruim
> conforme sequência e posição), 1 por rodada no Resultado e últimos 3 na Escalação. PROIBIDO
> usar torcida em qualquer fórmula do motor (engine/). Save v2 antigo sem o campo inicializa 500."

## Passo 4 — Capa (tela inicial)
> "Implemente a seção 4: capa com a arte public/brand/capa-avatares.png como herói (overlay de
> gradiente roxo #2A0E4F→#14081F pra legibilidade), wordmark LEGENDS MANAGER, linha 'Série C ·
> Legends Liga Fut7 · 2026', input do técnico, Continuar/Nova temporada e grid dos 12 times.
> Fallback em cascata: sem capa-avatares.png usa escudo.png; sem nenhum, capa tipográfica.
> CTA continua âmbar #FFC53D. NENHUMA outra tela muda — o jogo interno permanece verde-campo."

## Passo 5 — Galeria de avatares
> "Implemente a seção 5: carrossel de avatares (public/avatars/*.png) na capa junto do nome do
> técnico; escolha salva como avatarId no save; fallback = círculo com iniciais do técnico se
> não houver escolha ou assets. Exibir o avatar no cabeçalho da Escalação e no pôster de
> campeão ao lado do nome do técnico. O app precisa funcionar sem a pasta /public/avatars."

## Passo 6 — Checklist
> "Rode o checklist da seção 6 da spec item a item, incluindo: buscar 'torcida' em src/engine/
> (não pode entrar em fórmula); capa sem os arquivos de arte (fallback em cascata); save v2
> antigo sem torcida e sem avatarId. Status de cada item, sem corrigir nada por conta própria."

## Depois
`npm run dev` → jogar 3–4 rodadas (torcida/comentários/setinhas/avatar) → fechar uma janela
(manchetes) → `npm run build`. O push só depois do teste de economia da temporada completa
(pendência anterior). Commit sugerido:
`feat: polish Marco 2 — setinhas, manchetes, torcida, capa Legends e avatares de técnico`
