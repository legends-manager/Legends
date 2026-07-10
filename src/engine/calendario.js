// src/engine/calendario.js
// Turno pelo método do círculo (round-robin) + returno espelhado.
// GENÉRICO (Marco 3, spec-multi-serie.md §2): N times → 2·(N−1) rodadas.
// Série C (12 times) → 22 rodadas · Série B (10 times) → 18 rodadas.
// O total de rodadas de uma temporada é SEMPRE calendario.length — nada de
// fixar 22 fora daqui.
export function gerarCalendario(ts) {
  let l = [...ts];
  const ida = [];
  const n = l.length;
  for (let r = 0; r < n - 1; r++) {
    const jogos = [];
    for (let i = 0; i < n / 2; i++) {
      const a = l[i], b = l[n - 1 - i];
      jogos.push((r + i) % 2 === 0 ? { casa: a, fora: b } : { casa: b, fora: a });
    }
    ida.push(jogos);
    l = [l[0], l[n - 1], ...l.slice(1, n - 1)];
  }
  return [...ida, ...ida.map((rod) => rod.map((x) => ({ casa: x.fora, fora: x.casa })))];
}

// Nº de rodadas para N times (ida e volta). Útil pra UI/save sem gerar o calendário.
export const totalRodadas = (nTimes) => 2 * (nTimes - 1);
