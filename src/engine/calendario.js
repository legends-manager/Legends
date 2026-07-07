// src/engine/calendario.js
// 22 rodadas: turno pelo método do círculo (round-robin) + returno espelhado.
// Idêntico à demo.
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
