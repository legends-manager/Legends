// src/engine/craque.js
// Craque da Partida (só do jogo do jogador): gols×3 + assistências×1,5 entre os
// participantes. Se 0x0, o goleiro de maior attr. Idêntico à demo.
export function calcularCraque({ evMeu, minhaEsc1, minhaEsc2, advEsc, gcMeu, gfMeu }) {
  const pts = {};
  evMeu.filter((e) => e.tipo === "gol").forEach((e) => {
    pts[e.autor.id] = (pts[e.autor.id] || 0) + 3;
    if (e.assist) pts[e.assist.id] = (pts[e.assist.id] || 0) + 1.5;
  });
  const participantes = [...new Map(
    [...minhaEsc1, ...minhaEsc2, ...advEsc].map((p) => [p.id, p])
  ).values()];

  if (gcMeu + gfMeu === 0) {
    return participantes.filter((p) => p.pos === "GOL").sort((a, b) => b.attr - a.attr)[0];
  }
  return participantes.reduce((best, p) => {
    const v = pts[p.id] || 0, bv = best ? (pts[best.id] || 0) : -1;
    return v > bv || (v === bv && best && p.attr > best.attr) ? p : best;
  }, null);
}
