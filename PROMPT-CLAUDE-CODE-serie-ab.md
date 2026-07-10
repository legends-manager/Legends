# Prompt pro Claude Code — Marco 3: Séries A/B/C

Coloque na pasta: `spec-multi-serie.md` e `elencos-reais-serie-b.js`. Um prompt por vez.

## Passo 1 — Calendário dinâmico
> "Leia spec-multi-serie.md. Ajuste engine/calendario.js para derivar o nº de rodadas do nº de
> times: N times → 2·(N−1) rodadas (ida e volta). Série C (12 times) continua 22; a base fica
> genérica. Sem quebrar a Série C atual."

## Passo 2 — Camada multi-série
> "Implemente a seção 1 e 2: seletor Série A/B/C na capa e isolamento por série (times, elencos,
> tabela, artilharia, mercado e SAVE por série na chave legends-manager:save-v2:<serie>).
> Importe elencos-reais-serie-b.js. Migração: o save v2 atual (só Série C) vira o save da Série C
> sem perder a temporada em andamento."

## Passo 3 — Força por série
> "Implemente a seção 3: parâmetro serieBonus em engine/atributos.js (C=0, B=+6, A=+12), teto do
> atributo 90→92. Só desloca o nível médio; ruído e zebra intactos."

## Passo 4 — Série A (placeholder por enquanto)
> "Crie src/data/elencos-serie-a.js com os 8 times da Kings League confirmados (Furia FC, G3X FC,
> Dendele FC, DesimpaiN, Podpah Funkbol Clube, Nyvelados FC, Dibrados FC, Capim FC) e 2 slots
> 'A definir'. Elencos: por ora, gere placeholders (origem:'placeholder') — os elencos reais/
> fictícios entram depois por decisão do Felyp. NÃO use nomes de pessoas reais."

## Passo 5 — Checklist
> "Rode o checklist da seção 6 da spec item a item. Teste explícito: jogar 1 rodada na Série B e
> 1 na Série C e confirmar que save, tabela e artilharia não se misturam. Status de cada item."

## Depois
`npm run dev` → testar troca de série → `npm run build`. Push só depois do teste. A conferência
dos nomes da Série B (Felyp, contra os grupos) é BLOQUEANTE antes de publicar.
