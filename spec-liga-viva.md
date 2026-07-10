# spec-liga-viva.md — Marco 3.5: Liga Viva (acesso e rebaixamento entre A/B/C)

> EMENDA DE ESCOPO aprovada pelo Felyp. Conecta as três séries num único "mundo Legends" com
> promoção/rebaixamento ao estilo Brasileirão. REVERTE uma decisão travada (ver §1). Só construir
> depois de Marco 2 (mercado) e Marco 3 (multi-série, Passos 1-4) fecharem. Números ⚙️ calibráveis.

## 0. Decisões travadas
- As TRÊS séries conectadas (Série A = Kings incluída na roda de subir/descer).
- **Liga viva:** ao fim de cada temporada, **2 sobem e 2 descem** entre séries adjacentes (⚙️).
- **Modo carreira:** o técnico (humano) ACOMPANHA seu time. Rebaixado → começa a próxima
  temporada na série de baixo; campeão/promovido → sobe junto. O jogador não reescolhe time a
  cada temporada (pode trocar só via "novo jogo").
- Mundial de Clubes (Kings) fica GUARDADO para depois (não descartado).

## 1. Reversão de decisão travada (consciente)
- **Antes (v3/multi-série):** a cada temporada os times "voltam ao real" e à sua série de origem.
- **Agora:** a **divisão de cada time PERSISTE** entre temporadas. O que reseta continua sendo:
  atributos (re-sorteados), valores de mercado (recalculados), tabela/artilharia. O que passa a
  persistir: **em qual série cada time está** e o histórico de acesso/rebaixamento.
- **Elencos continuam reais e imutáveis** — os jogadores do Ousadia são sempre os do Ousadia.
  Só muda a série onde o Ousadia joga. A fidelidade (o fosso) é preservada.

## 2. Modelo de dados (o "mundo")
Novo estado global persistente (não por-série), chave `legends-manager:mundo-v1`:
```
mundo: {
  temporada: 3,                          // contador global
  divisao: { "Ousadia FC":"A", "Real União":"C", "Furia FC":"A", ... },  // série atual de cada time
  meuTime: "Ousadia FC",
  carreira: [                            // histórico do jogador
    { temporada:1, serie:"C", time:"Ousadia FC", posicao:2, resultado:"subiu" },
    { temporada:2, serie:"B", time:"Ousadia FC", posicao:9, resultado:"manteve" },
  ],
  historicoAcesso: [ { temporada:2, sobe:["X","Y"], desce:["W","Z"], serie:"B->A" }, ... ]
}
```
- `divisao` é a fonte da verdade de quem joga onde. Os elencos vêm sempre dos arquivos reais
  (C/B/A) por NOME do time — independem da série atual.
- Contagem de times por série muda ao longo do tempo (ver §4). O calendário já é dinâmico
  (N times → 2·(N−1) rodadas), então isso "só funciona".

## 3. Fim de temporada — cálculo de acesso/rebaixamento
Ao terminar as rodadas de TODAS as séries da temporada (ver §5 sobre simular as outras séries):
- **Série A:** os **2 últimos** descem para B. (Topo: campeão; sem série acima.)
- **Série B:** os **2 primeiros** sobem para A; os **2 últimos** descem para C.
- **Série C:** os **2 primeiros** sobem para B. (Base: sem série abaixo; lanterna não cai.)
- Empates de fronteira resolvidos pelos critérios da tabela (pts, SG, GP) já existentes.
- **Quem PERMANECE:** todo time fora das 2 zonas (subida/queda) mantém a divisão. A atualização
  da temporada nova é explícita nas TRÊS categorias, igual Brasfoot/vida real:
  **SUBIU · DESCEU · PERMANECEU**.
- Atualiza `mundo.divisao`, `historicoAcesso`, `hallCampeoes` (§3.1) e a `carreira` do jogador.
- Tela "Fim de Temporada" mostra, por série: campeão, os 2 que SOBEM, os 2 que DESCEM, e o bloco
  "PERMANECEM" (o meio da tabela) — além do destino do time do jogador.

## 3.1 Hall de campeões (memória do mundo)
Toda temporada, ao fechar, grava o campeão de CADA série:
```
hallCampeoes: [
  { temporada:1, A:"DesimpaiN", B:"Ousadia FC", C:"Real União" },
  { temporada:2, A:"DesimpaiN", B:"Villa City", C:"Sereno FC" },
]
```
- Tela "História da Liga": lista temporada a temporada os campeões das três séries — é a memória
  que faz a liga viva importar (igual ver a lista de campeões brasileiros por ano).
- Guardar também artilheiro-campeão da série do jogador por temporada (opcional ⚙️).

## 4. Times por série ao longo do tempo
- Início: A=10 (Kings), B=10, C=12 (34 times, fixo — ninguém entra nem sai do mundo).
- Como 2 sobem e 2 descem entre pares adjacentes, os TOTAIS por série se mantêm estáveis
  (A troca 2 com B; B troca 2 com A e 2 com C; C troca 2 com B). Confere: A=10, B=10, C=12 sempre.
- Portanto o calendário de cada série é estável no nº de rodadas (A/B=18, C=22), mas os NOMES
  dos times mudam a cada temporada. Nenhum time some do mundo.
- **Comportamento ESPERADO (não é bug):** com a liga viva ligada, depois de algumas temporadas
  pode não sobrar NENHUM time da Kings na Série A (todos rebaixados) — e times reais de Limeira
  podem dominar o topo. Isso é o "igual vida real" funcionando. Se o Felyp quiser que a Kings
  seja um teto fixo, é outra decisão (hoje: Kings entra na roda normalmente).

## 5. Simular as séries que o jogador NÃO disputa
Para acesso/rebaixamento fazer sentido, as outras duas séries precisam ter uma tabela final a
cada temporada, mesmo sem o jogador. Opção adotada (barata): **simulação rápida em segundo plano**
— ao fim da temporada do jogador, rodar as outras duas séries via Monte Carlo simplificado
(mesma engine de força interna, sem partida ao vivo) e gerar as tabelas finais. Guardar só o
resultado (classificação), não o detalhe. Custa ~ milissegundos; sem UI ao vivo.

## 6. Telas afetadas
- **Nova — Fim de Temporada:** pódio + faixa "SOBEM / DESCEM" das três séries + "seu destino".
- **Capa:** em modo carreira, mostra o time/série atual do jogador e o botão "Próxima temporada"
  (em vez de reescolher). "Novo jogo" reinicia o mundo e reescolhe.
- **Histórico de carreira:** lista as temporadas do jogador (série, time, posição, subiu/desceu).
- Tabela/mercado/torcida: inalterados; passam a operar sobre a série ATUAL do time do jogador.

## 7. Save / migração
- Novo `mundo-v1` global + os saves por série continuam guardando a temporada em andamento.
- Migração: jogador vindo do multi-série (sem `mundo`) → criar `mundo` com o time/série atuais
  na temporada 1, sem perder a temporada em andamento.
- "Novo jogo" limpa `mundo` e os saves por série.

## 8. Checklist
- [ ] Ao fim da temporada, 2 sobem/2 descem em cada fronteira; totais por série estáveis (10/10/12).
- [ ] Divisão de cada time persiste na temporada seguinte; elencos continuam reais e corretos.
- [ ] Jogador rebaixado começa a próxima na série de baixo; promovido, na de cima (carreira).
- [ ] Séries não disputadas têm tabela final gerada (simulação rápida) todo fim de temporada.
- [ ] Um time da Kings pode cair pra B e um time real pode subir pra A — sem quebrar elenco.
- [ ] Histórico de carreira e de acesso/rebaixamento corretos ao longo de 3+ temporadas.
- [ ] "Novo jogo" reseta o mundo; migração do save antigo não perde a temporada em andamento.
- [ ] serieBonus (A+12/B+6/C=0) segue a série ATUAL do time, não a de origem.
- [ ] Tela de Fim de Temporada mostra SUBIU / DESCEU / PERMANECEU nas três séries.
- [ ] Hall de campeões grava o campeão das 3 séries por temporada; tela "História da Liga" lista.
- [ ] Após várias temporadas, Kings pode não estar mais na A — sem crash; comportamento esperado.
