// src/engine/simulador.js
// Motor do jogo: Poisson calibrado pro Fut7, forças 100% internas, mando e fase.
// Toda a lógica é idêntica à da demo — apenas separada em módulos.
import { gerarElencos } from "./atributos";
import { gerarCalendario } from "./calendario";
import { ELENCOS_REAIS, TIMES_SERIE_C } from "../data/elencos-reais";
import { ORCAMENTO_INICIAL, mercadoInicial } from "./mercado";

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
// Força dos times = bolo fixo sorteado (build-spec §5), 100% interno.
// orcamentoAnterior (Marco 2, spec-mercado.md §0): em "Nova temporada" os
// elencos voltam ao real e os valores ao piso (gerarElencos), mas o orçamento
// por time é MANTIDO — passe o `S.orcamento` da temporada anterior aqui.
export function novaTemporada(orcamentoAnterior = null) {
  const elencos = gerarElencos(TIMES_SERIE_C, ELENCOS_REAIS);
  const pool = [1.22, 1.22, 1.08, 1.08, 1.08, 0.95, 0.95, 0.95, 0.95, 0.82, 0.82, 0.82]
    .sort(() => Math.random() - 0.5);
  const mult = {}, fase = {}, tabela = {}, orcamento = {};
  TIMES_SERIE_C.forEach((t, i) => {
    mult[t] = pool[i];
    fase[t] = 1;
    tabela[t] = { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 };
    orcamento[t] = orcamentoAnterior && orcamentoAnterior[t] != null ? orcamentoAnterior[t] : ORCAMENTO_INICIAL;
  });
  // Marco 2 (spec-mercado.md §4): a janela de mercado abre na pré-temporada,
  // antes da 1ª escalação — por isso a temporada já nasce com janela "pre".
  const mercado = { ...mercadoInicial(), janela: "pre" };
  return {
    elencos, mult, fase, tabela, art: {},
    calendario: gerarCalendario(TIMES_SERIE_C), rodada: 0, orcamento, mercado,
  };
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
