// src/engine/atributos.js
// Atributos = base por posição + viés das estatísticas reais + ruído (build-spec §4).
// Re-sorteados a cada nova temporada. Fórmula idêntica à da demo:
//   viés = min(15, 3·g + 2·a + 4·mvp)
//   attr = clamp(45, 90, 52 + U(0,16) + viés + U(-5,+5))

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function gerarAttr(g = 0, a = 0, mvp = 0) {
  const vies = Math.min(15, 3 * g + 2 * a + 4 * mvp);
  return Math.round(clamp(52 + Math.random() * 16 + vies + (Math.random() * 10 - 5), 45, 90));
}

// Gera os elencos da temporada a partir dos dados reais. Preserva pos10 e origem
// no jogador (o motor não os usa, mas o save/contrato pedem origem por jogador).
export function gerarElencos(times, elencosReais) {
  const elencos = {};
  times.forEach((t) => {
    elencos[t] = elencosReais[t].map((j, i) => ({
      id: `${t}|${i}`,
      nome: j.nome,
      pos: j.pos,
      pos10: j.pos10,
      attr: gerarAttr(j.g, j.a, j.mvp),
      origem: j.origem,
      time: t,
    }));
  });
  return elencos;
}
