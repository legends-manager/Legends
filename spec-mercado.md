# spec-mercado.md — Mercado de Transferências (Marco 2) — v2 revisada

> Promovido do backlog (Seção 6 do v3) para escopo ativo por decisão explícita do Felyp,
> ciente de que o v3 recomendava esperar a leitura da liga. Esta spec é o contrato do Claude Code.
> Moeda fictícia: **L$** (Legends). Números marcados com ⚙️ são calibráveis.

## 0. Decisões travadas
- Compra e venda entre os 12 times via janela de mercado. **Humano + as 11 IAs** negociam.
- **Economia em dinheiro fictício (L$)**, orçamento por time, alimentado por resultados.
- **Valor inicial diferenciado por qualidade** (curva convexa: os melhores custam muito mais),
  com leve **mispricing** — o preço é um sinal IMPERFEITO da qualidade, então dá pra errar a
  contratação. Depois o valor sobe/desce jogando. (Isto substitui a decisão anterior "todos no
  piso": os atributos de jogador já são visíveis na escalação; o que segue oculto é a FORÇA
  INTERNA DE TIME — o multiplicador sorteado —, que o preço não revela. Ver §1 e §3.2.)
- Janela abre na **pré-temporada** e reabre **uma vez após a rodada 11**. Fora disso, fechada.
- **Virada de temporada (padrão ⚙️): as transferências valem pela temporada.** Em "Nova
  temporada", os elencos voltam ao real (fonte: elencos-reais.js), os valores são **recalculados pela curva** sobre os novos atributos sorteados
  e o **orçamento é mantido** — administrar bem numa temporada dá poder de fogo na seguinte.
  Motivo: preserva a identidade dos elencos reais (o fosso) e casa com a arquitetura atual
  (novaTemporada re-sorteia tudo). Se o Felyp preferir transferências permanentes, isso vira
  mudança de escopo explícita (persistir elencos no save entre temporadas).
- **A estrela ⭐ NÃO entra nesta versão** — só valor. A ⭐ conquistada (artilheiro/limiar) fica
  para versão seguinte. Idem destaque de craques e presidentes: anotados para depois.

## 1. O que NÃO muda (invioláveis do v3)
- Elencos reais, tamanho variável, nada de inventar/duplicar jogador. CPF nunca entra.
- Força de time 100% interna, sem estrelas na UI, sem re-sortear. **Nenhum mecanismo do
  mercado pode usar a força interna de forma observável pelo jogador** (ver 3.2).
- Atributo = base + viés real + ruído (zebra viva). O mercado **não** altera atributo;
  é uma camada econômica por cima.
- Single-player, 22 rodadas, save local, PWA, rodapé "Simulação — BETA".

## 2. Modelo de dados (adições)
Por **time**: `orcamento: number` (L$; persiste entre temporadas via save).
Por **jogador**: `valor: number` (começa no piso) e `timeOrigem: string` (time real; nunca muda).
Estado de **mercado**:
```
mercado: {
  janela: "fechada" | "pre" | "meio",
  janelaUsadaMeio: boolean,          // a do meio abre só uma vez por temporada
  listados: [{ idJogador, preco }],  // à venda (IA e humano); expiram ao fechar a janela
  historico: [{ jogador, de, para, valor, rodada }]
}
```

## 3. Economia
### 3.1 Orçamento por resultado (após cada rodada, todos os 12 times)
- Vitória **+L$150** ⚙️ · Empate **+L$50** ⚙️ · Derrota **−L$30** ⚙️ (orçamento nunca negativo).
- Orçamento inicial (1ª temporada): **L$1000** ⚙️. Entre temporadas: mantido (ver 0).

### 3.2 Valor do jogador
**Valor inicial (por qualidade, com mispricing):**
```
base   = piso + K · (attr − 45)^EXP
valor  = clamp(piso, teto, round( base · U(1−m, 1+m) ))
⚙️ piso=50 · teto=2000 · K=1.2 · EXP=1.9 · m=0.15   (perfil BRUTAL)
```
- Curva convexa AGRESSIVA → os melhores custam MUITO mais. Tabela de referência:
  attr 45 ≈ L$50 · 55 ≈ L$145 · 65 ≈ L$405 · 70 ≈ L$595 · 80 ≈ L$1080 · 90 ≈ L$1700.
  Com orçamento inicial de L$1000, um craque de elite é INACESSÍVEL na largada — exige vender,
  vencer várias rodadas ou juntar entre temporadas. Comprar um craque é uma aposta grande.
- O fator `U(1−m,1+m)` é o **mispricing**: o preço é um sinal imperfeito do atributo real,
  logo dá pra pagar caro num dud ou achar pechincha. Com m=0.15 o preço engana mais — errar dói.
- Recalculado a cada nova temporada (atributos re-sorteados → novo spread). Nunca abaixo do piso,
  nunca acima do teto.

**Drift durante a temporada (sobre o valor inicial):**
- Quem **jogou**: gol **+20** ⚙️ · assistência **+10** ⚙️ · craque **+30** ⚙️ ·
  vitória do time **+5** ⚙️ por titular. Teto de valorização **+L$60/rodada** ⚙️.
- Quem **não jogou**: **−L$5** ⚙️ (ociosidade deprecia — buy-high/sell-low é risco real).

**Efeito contexto:** ao ser comprado por time em **posição pior na tabela** no momento da compra,
valor cai **−10%** ⚙️. Usa SÓ a posição na tabela (pública) — **nunca a força interna** (usar o
multiplicador vazaria a força pela variação de preço, quebrando a §1). Não se aplica na janela
pré-temporada (tabela zerada), só na do meio.

### 3.3 Regras de elenco no mercado (valem pra TODOS, humano incluso)
- Nenhum time pode ficar com **<7 jogadores** ou **sem goleiro**: vendas/aceites que
  violariam isso são bloqueados na UI e na IA. Ninguém vende o único goleiro.
- Teto de elenco: **18 jogadores** ⚙️ (o maior elenco real). Compra acima disso é bloqueada.

## 4. Janela de mercado (fluxo)
Abre na **pré-temporada** (antes da rodada 1) e **uma vez após a rodada 11** — inclusive quando
a rodada 11 for jogada via "rodada rápida". Tela "Mercado", três abas:
1. **Comprar** — `listados` com preço. Compra: transfere o jogador, debita/credita orçamentos,
   registra no `historico`, respeita 3.3.
2. **Vender** — elenco do humano; ele lista jogadores com preço (default = `valor`).
   Listagens não vendidas **expiram ao fechar a janela**.
3. **Ofertas** — propostas das IAs por jogadores do humano (aceitar/recusar; aceite respeita 3.3).
Fechar a janela = seguir o fluxo normal (escalação/rodada). A do meio não reabre.

## 5. Comportamento das IAs (por janela, ordem aleatória)
1. **Vende excedente:** se elenco > 10 (titulares+3) ⚙️, lista 1–2 de menor `valor`
   (empate: menor atributo).
2. **Reforça a posição mais fraca:** compra de `listados` o melhor atributo daquela posição
   que couber no orçamento — **mas só se preço ≤ valor × 1,2** ⚙️ (anti-exploit: sem isso,
   o humano lista qualquer jogador por preço absurdo e a IA paga).
3. **Oferta pelo humano:** ~30% ⚙️ de chance, 1 oferta por titular valioso, preço = valor × U(1,0–1,3) ⚙️.
- IA respeita 3.3 sempre. Com o spread de valor, os craques ficam caros e só os times com
  mais orçamento (que venceram mais) alcançam — competição emergente, sem regra extra.
- Transferências IA↔IA entram no `historico` e num resumo "Movimentações da janela" ao humano.

## 6. Salvaguarda de identidade
`timeOrigem` gravado em todo jogador, imutável. Somado ao padrão "transferências valem pela
temporada" (Seção 0), garante que a Série C real reaparece intacta a cada temporada — e permite
ativar um modo "só reservas negociáveis" no futuro sem perder dado.

## 7. Save / migração
- Bump **v1 → v2**. Save v2 guarda: `orcamento` por time (persiste entre temporadas),
  `valor`/`timeOrigem` por jogador, estado `mercado`.
- Save v1 (sem mercado) ao carregar: inicializar `orcamento` L$1000, `valor` = piso,
  `timeOrigem` = time atual, `mercado` fechado (`janelaUsadaMeio` = rodadaAtual > 11) —
  sem quebrar a temporada em andamento.
- Auto-save após cada rodada e ao fechar cada janela.

## 8. Telas afetadas
- **Nova:** `Mercado.jsx` (3 abas + resumo de movimentações).
- **Fluxo:** janela "pre" antes da 1ª escalação da temporada; janela "meio" disparada uma vez
  após a rodada 11 (mesmo via rodada rápida).
- **Escalação:** mostrar `valor` (L$) por jogador e `orcamento` do time no topo. O atributo do
  PRÓPRIO elenco segue visível (como hoje).
- **Mercado (aba Comprar):** mostrar de cada jogador o `valor` (preço) + as estatísticas reais
  do Copa10 (g/a). **NÃO mostrar o atributo bruto** de jogadores de outros times — o preço
  (com mispricing) é o sinal de decisão; scouting completo é backlog (olheiro).
- **Resultado:** linha curta "valorizações da rodada".
- Arena, pôster, força interna: **sem alteração**.

## 9. Checklist de pronto
- [ ] Nenhuma operação (compra, venda, aceite, IA↔IA) deixa QUALQUER time com <7 jogadores,
      sem goleiro, ou com >18 jogadores.
- [ ] Orçamentos nunca negativos; valores nunca abaixo do piso.
- [ ] Janela do meio abre exatamente uma vez — testado também jogando a rodada 11 via "rodada rápida".
- [ ] IA não compra nada acima de valor × 1,2 (testar listando um jogador por preço absurdo).
- [ ] Efeito contexto usa apenas posição na tabela; buscar por `mult` no código do mercado
      não pode retornar nada (força interna intocada e não-observável).
- [ ] "Nova temporada": elencos voltam ao real, valores ao piso, orçamento mantido.
- [ ] Save v1 antigo migra pra v2 sem crash e sem perder a temporada.
- [ ] `timeOrigem` preservado após qualquer transferência.
- [ ] Nenhum CPF/dado pessoal introduzido.
