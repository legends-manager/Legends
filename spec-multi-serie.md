# spec-multi-serie.md — Marco 3: Séries A, B e C

> Adiciona seleção de série ao jogo. NÃO altera o motor (Poisson, força interna, mercado, torcida).
> Cada série roda a mesma temporada de 22 rodadas, isolada. Números ⚙️ calibráveis.

## 1. Seleção de série (capa)
- Na capa, antes de escolher o time: seletor **Série A · Série B · Série C**.
- Cada série tem seus próprios: lista de times, elencos, tabela, artilharia, mercado e save.
- **Save por série:** chave `legends-manager:save-v2:<serie>` (não misturar temporadas de séries
  diferentes). Continuar/Nova temporada operam sobre a série selecionada.

## 2. Dados por série
- **Série C:** `elencos-reais.js` (12 times) — já existe, intacto.
- **Série B:** `elencos-reais-serie-b.js` (10 times) — entregue. 22 rodadas com 10 times = returno
  duplo? Não: 10 times → 18 rodadas no returno simples (9 ida + 9 volta). AJUSTE: o calendário
  deve derivar o nº de rodadas do nº de times (N times → 2·(N−1) rodadas), não fixar 22.
  Série C segue 22 (12 times), Série B fica 18 (10 times).
- **Série A:** `elencos-serie-a.js` — times da Kings League Brasil (ver §4).

## 3. Força por série (Série B "um pouco mais forte")
- Novo parâmetro `serieBonus` no cálculo de atributo (engine/atributos.js):
  `attr = clamp(45, 92, base + ruído + viés + serieBonus)`.
  ⚙️ Série C = 0 · Série B = +6 · Série A = +12 (KL, mais forte ainda).
- Só desloca o nível médio da série; ruído e zebra permanecem. Teto sobe de 90→92 p/ acomodar.
- Isso é intra-série (todos os times da B sobem juntos). Não afeta partidas entre séries (não há).

## 4. Série A — Kings League Brasil (provisória) + gancho do Mundial
- **Decisão do Felyp:** usar os times da Kings League Brasil como Série A provisória até os times
  reais da Série A da Legends existirem; quando existirem, os times KL "sobem" para um **Mundial
  de Clubes** disputado pelo campeão da Série A. Felyp assumiu o risco de IP conscientemente.
- **Times KL confirmados na pesquisa (8):** Furia FC, G3X FC, Dendele FC, DesimpaiN,
  Podpah Funkbol Clube, Nyvelados FC, Dibrados FC, Capim FC. Faltam 2 (a competição tem 10) —
  Felyp confirma os nomes; NÃO inventar.
- **Elencos KL: NÃO temos os jogadores** (a pesquisa web trouxe times/presidentes, não elencos).
  Duas opções pra Felyp decidir (ver pergunta ao final da conversa):
  (a) Felyp envia as escalações reais (súmula/print), mesmo processo verificado da B; ou
  (b) gerar elencos FICTÍCIOS de "craques genéricos" (sem usar nomes de pessoas reais como
      Neymar/Falcão/Ferrão — reduz risco de imagem, mantém o clima).
- **Nomes de pessoas reais** (jogadores/presidentes famosos): recomendação forte de NÃO embutir
  no app mesmo assumindo o risco das marcas — direito de imagem individual é risco à parte.
- Gancho Mundial de Clubes: registrado no roadmap; implementação quando a Série A real chegar.

## 5. Telas afetadas
- Capa: seletor de série + grid de times da série escolhida.
- Tabela/Artilharia/Mercado: já funcionam por temporada; só passam a ler a série ativa.
- Ambientação: Arena Novo Horizonte/Limeira permanece (todas as séries jogam lá, por ora).

## 6. Checklist
- [ ] Trocar de série troca times, tabela, artilharia e save corretamente (sem vazar dados entre séries).
- [ ] Calendário deriva rodadas do nº de times (C=22, B=18); nada hardcoded em 22.
- [ ] serieBonus aplicado (B visivelmente mais forte que C em teste), teto 92 respeitado.
- [ ] Save por série isolado; migração de save v2 (série C única) → v2 multi-série sem perder a temporada em andamento da C.
- [ ] Placeholders da Nação NH aparecem como "(a definir)"; nada quebra.
- [ ] Nenhum CPF; nenhum nome de pessoa real famosa embutido na Série A sem decisão explícita.
