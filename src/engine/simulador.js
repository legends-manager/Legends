// src/engine/simulador.js
// Motor do jogo: Poisson calibrado pro Fut7, forças 100% internas, mando e fase.
// Toda a lógica é idêntica à da demo — apenas separada em módulos.
import { gerarElencos } from "./atributos";
import { gerarCalendario } from "./calendario";
import { SERIES, SERIE_PADRAO, ELENCOS_GLOBAIS, ORDEM_SERIES } from "../data/series";
import { ORCAMENTO_INICIAL, mercadoInicial } from "./mercado";
import { torcidaInicial } from "./torcida";
import { timesDaSerie } from "./mundo";

// ---------------- utilidades ----------------
export const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const poisson = (l) => {
  const L = Math.exp(-l);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
};
export const media = (e) => e.reduce((s, j) => s + j.attr, 0) / e.length;

export const DESC = [
  "chute colocado no canto", "bomba de fora da área", "de primeira, no ângulo",
  "aproveitou o rebote", "na saída do goleiro", "de cabeça, após cruzamento",
  "driblou o marcador e bateu cruzado", "cavadinha na medida", "toque por baixo do goleiro",
];
export const CHANCE = [
  "arriscou de longe — raspou a trave!", "cara a cara, parou no goleiro!",
  "carimbou a trave!", "cortado quase em cima da linha!", "finalizou por cima do gol!",
];

export function pesoEscolha(lista, pesos) {
  const tot = lista.reduce((s, j) => s + j.attr * (pesos[j.pos] || 1), 0);
  let r = Math.random() * tot;
  for (const j of lista) { r -= j.attr * (pesos[j.pos] || 1); if (r <= 0) return j; }
  return lista[lista.length - 1];
}

// ---------------- temporada ----------------
// Bolo fixo de multiplicadores internos (build-spec §5): perfil 2×forte,
// 3×médio-forte, 4×médio, 3×fraco em 12 times. Para séries com outro nº de
// times, distribui proporcionalmente (maior resto) — ex.: 10 times → 2/3/3/2 ⚙️.
const BOLO_REFERENCIA = [[1.22, 2], [1.08, 3], [0.95, 4], [0.82, 3]]; // p/ 12 times
export function gerarBolo(n) {
  const exatos = BOLO_REFERENCIA.map(([m, q]) => ({ m, exato: (q * n) / 12 }));
  const qtd = exatos.map((e) => Math.floor(e.exato));
  let falta = n - qtd.reduce((s, q) => s + q, 0);
  const porResto = exatos
    .map((e, i) => ({ i, resto: e.exato - qtd[i] }))
    .sort((a, b) => b.resto - a.resto);
  for (let k = 0; k < falta; k++) qtd[porResto[k].i]++;
  return exatos.flatMap((e, i) => Array(qtd[i]).fill(e.m));
}

// Força dos times = bolo sorteado, 100% interno.
// serieId (Marco 3): qual série a temporada roda; `times` (Liga Viva, Marco
// 3.5) é a lista de quem está NESSA série NESTA temporada — pode diferir de
// SERIES[serieId].times depois de acessos/rebaixamentos (mundo.divisao é a
// fonte da verdade; ver engine/mundo.js). Sem Liga Viva ativa, passe
// undefined e cai no padrão (times de origem da série). Os elencos vêm
// SEMPRE de ELENCOS_GLOBAIS (busca por nome, independente da série atual —
// spec-liga-viva.md §2), nunca de SERIES[serieId].elencos diretamente.
// orcamentoAnterior (Marco 2, spec-mercado.md §0): em "Nova temporada" os
// elencos voltam ao real e os valores são recalculados (gerarElencos), mas o
// orçamento por time é MANTIDO — passe o `S.orcamento` da temporada anterior.
// Com a Liga Viva, um time promovido/rebaixado LEVA o caixa junto (o mapa é
// por nome de time); quem não estiver no mapa cai no default L$1000.
// `mundo` (Liga Viva): usado só pra gerar o estado paralelo das OUTRAS duas
// séries (ver outrasSeries abaixo) — passe undefined fora do modo carreira.
export function novaTemporada(serieId = SERIE_PADRAO, times = null, orcamentoAnterior = null, mundo = null) {
  const { serieBonus } = SERIES[serieId];
  const timesDaTemporada = times || SERIES[serieId].times;
  const elencos = gerarElencos(timesDaTemporada, ELENCOS_GLOBAIS, serieBonus);
  const pool = gerarBolo(timesDaTemporada.length).sort(() => Math.random() - 0.5);
  const mult = {}, fase = {}, tabela = {}, orcamento = {};
  timesDaTemporada.forEach((t, i) => {
    mult[t] = pool[i];
    fase[t] = 1;
    tabela[t] = { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 };
    orcamento[t] = orcamentoAnterior && orcamentoAnterior[t] != null ? orcamentoAnterior[t] : ORCAMENTO_INICIAL;
  });
  // Marco 2 (spec-mercado.md §4): a janela de mercado abre na pré-temporada,
  // antes da 1ª escalação — por isso a temporada já nasce com janela "pre".
  const mercado = { ...mercadoInicial(), janela: "pre" };
  // Torcida (spec-marco2-polish.md §3): recomeça em 500 a cada temporada,
  // como fase — não é persistida entre temporadas como o orçamento.
  const torcida = torcidaInicial(timesDaTemporada);
  // torcidaRef (spec-marco2-polish.md §3): referência pra setinha ▲▼ — nasce
  // igual a torcida, então a seta começa neutra ("–").
  const torcidaRef = torcidaInicial(timesDaTemporada);
  const formaRecente = {};

  // Tabela ao vivo das 3 séries (Liga Viva): as outras duas séries que o
  // jogador NÃO está disputando ganham um estado leve (elenco/força/tabela,
  // SEM mercado/torcida/orçamento — ninguém administra essas, só acompanha a
  // classificação) e avançam 1 rodada por vez, em paralelo, cada vez que o
  // jogador termina uma rodada da sua (ver avancarRodadaSimples, chamado do
  // App). Sem `mundo` (não deveria acontecer — Liga Viva sempre cria o mundo
  // antes de qualquer temporada), fica vazio e a UI ignora.
  const outrasSeries = {};
  if (mundo) {
    ORDEM_SERIES.filter((s) => s !== serieId).forEach((s) => {
      outrasSeries[s] = iniciarSerieParalela(timesDaSerie(mundo, s), SERIES[s].serieBonus);
    });
  }

  return {
    serie: serieId, elencos, mult, fase, tabela, art: {},
    calendario: gerarCalendario(timesDaTemporada), rodada: 0, orcamento, mercado,
    torcida, torcidaRef, formaRecente, comentariosTorcida: [], outrasSeries,
  };
}

// ---------------- séries paralelas (tabela ao vivo das 3, sem clock) ----------------
// Estado leve de UMA série que o jogador não disputa nesta temporada: mesma
// engine de força interna/fase/Poisson, mas sem partida ao vivo, mercado,
// torcida ou orçamento (ninguém gerencia essas séries — só acompanha a
// tabela). elencos vêm sempre de ELENCOS_GLOBAIS por nome (Liga Viva §2).
export function iniciarSerieParalela(times, serieBonus) {
  const elencos = gerarElencos(times, ELENCOS_GLOBAIS, serieBonus);
  const pool = gerarBolo(times.length).sort(() => Math.random() - 0.5);
  const mult = {}, fase = {}, tabela = {};
  times.forEach((t, i) => {
    mult[t] = pool[i];
    fase[t] = 1;
    tabela[t] = { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 };
  });
  return { elencos, mult, fase, tabela, art: {}, calendario: gerarCalendario(times), rodada: 0 };
}

// Avança EXATAMENTE 1 rodada de uma série paralela (noop se já encerrou —
// calendário mais curto que o da série do jogador, ex. jogador na C/22
// rodadas com A ou B/18: elas terminam antes e ficam paradas no resultado
// final). Muta `estado` in-place, mesmo padrão do resto do motor.
export function avancarRodadaSimples(estado) {
  if (estado.rodada >= estado.calendario.length) return;
  const rodada = estado.calendario[estado.rodada];
  const Slocal = { mult: estado.mult, fase: estado.fase };
  rodada.forEach(({ casa, fora }) => {
    const escCasa = escalacaoIA(estado.elencos[casa]);
    const escFora = escalacaoIA(estado.elencos[fora]);
    const ev = [
      ...simMetade(Slocal, casa, fora, escCasa, escFora, 1),
      ...simMetade(Slocal, casa, fora, escCasa, escFora, 2),
    ];
    const gc = golsDe(ev, casa), gf = golsDe(ev, fora);
    const tc = estado.tabela[casa], tf = estado.tabela[fora];
    tc.J++; tf.J++; tc.GP += gc; tc.GC += gf; tf.GP += gf; tf.GC += gc;
    if (gc > gf) {
      tc.V++; tc.P += 3; tf.D++;
      estado.fase[casa] = Math.min(1.08, estado.fase[casa] + 0.04);
      estado.fase[fora] = Math.max(0.92, estado.fase[fora] - 0.04);
    } else if (gf > gc) {
      tf.V++; tf.P += 3; tc.D++;
      estado.fase[fora] = Math.min(1.08, estado.fase[fora] + 0.04);
      estado.fase[casa] = Math.max(0.92, estado.fase[casa] - 0.04);
    } else { tc.E++; tf.E++; tc.P++; tf.P++; }
    ev.filter((e) => e.tipo === "gol").forEach((e) => {
      estado.art[e.autor.id] = estado.art[e.autor.id] || { nome: e.autor.nome, time: e.autor.time, g: 0 };
      estado.art[e.autor.id].g++;
    });
  });
  estado.rodada++;
}

// Migração/sincronização: saves antigos (sem outrasSeries) ou uma série
// recém-criada precisam "alcançar" a rodada atual do jogador de uma vez só,
// na hora de carregar — mesma lógica de avançar, só que em loop instantâneo
// (barato, ver spec-liga-viva.md §5). Também cobre o fim de temporada quando
// a série paralela tem calendário MAIS LONGO que o do jogador (ex. jogador
// na A/18 rodadas, C ainda tem 4 pra jogar quando a temporada dele acaba).
export function sincronizarSerieParalela(estado, ateRodada) {
  const alvo = Math.min(ateRodada, estado.calendario.length);
  while (estado.rodada < alvo) avancarRodadaSimples(estado);
}

// ---------------- escalações ----------------
export const melhores = (elenco) => {
  const gks = elenco.filter((j) => j.pos === "GOL").sort((a, b) => b.attr - a.attr);
  const linha = elenco.filter((j) => j.pos !== "GOL").sort((a, b) => b.attr - a.attr);
  return [gks[0], ...linha.slice(0, 6)];
};

export const escalacaoIA = (elenco) => {
  const gks = elenco.filter((j) => j.pos === "GOL").sort((a, b) => b.attr - a.attr);
  let gol = gks[0];
  if (gks.length > 1 && Math.random() < 0.2) gol = gks[1];
  const linha = elenco.filter((j) => j.pos !== "GOL").sort((a, b) => b.attr - a.attr);
  const tit = linha.slice(0, 6), banco = linha.slice(6);
  const trocas = Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0;
  for (let i = 0; i < trocas && banco.length; i++) {
    const ti = ri(0, tit.length - 1), bi = ri(0, banco.length - 1);
    const tmp = tit[ti]; tit[ti] = banco[bi]; banco[bi] = tmp;
  }
  return [gol, ...tit];
};

// ---------------- simulação de uma metade ----------------
export function simMetade(S, casa, fora, escCasa, escFora, metade) {
  const ini = metade === 1 ? 1 : 26, fim = metade === 1 ? 25 : 50;
  const ev = [];
  const lam = (t, esc, mando) => 1.7 * S.mult[t] * S.fase[t] * (media(esc) / 64) * (mando ? 1.05 : 1);
  [{ t: casa, esc: escCasa, mando: true }, { t: fora, esc: escFora, mando: false }].forEach((l) => {
    const g = poisson(lam(l.t, l.esc, l.mando));
    for (let i = 0; i < g; i++) {
      const autor = pesoEscolha(l.esc, { ATA: 3, MEI: 1.6, DEF: 0.5, GOL: 0.05 });
      let assist = null;
      if (Math.random() < 0.65) {
        const cands = l.esc.filter((j) => j.id !== autor.id);
        assist = pesoEscolha(cands, { MEI: 2.5, ATA: 1.5, DEF: 1, GOL: 0.3 });
      }
      ev.push({ min: ri(ini, fim), tipo: "gol", time: l.t, autor, assist, desc: DESC[ri(0, DESC.length - 1)] });
    }
    for (let i = 0, n = ri(1, 2); i < n; i++) {
      const q = pesoEscolha(l.esc.filter((j) => j.pos !== "GOL"), { ATA: 2.5, MEI: 1.5, DEF: 0.6 });
      ev.push({ min: ri(ini, fim), tipo: "chance", time: l.t, autor: q, desc: CHANCE[ri(0, CHANCE.length - 1)] });
    }
  });
  return ev.sort((a, b) => a.min - b.min || (a.tipo === "gol" ? -1 : 1));
}

export const golsDe = (evs, time, ateMin = 99) =>
  evs.filter((e) => e.tipo === "gol" && e.time === time && e.min <= ateMin).length;
