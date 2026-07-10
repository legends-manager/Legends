// src/engine/atributos.js
// Atributos = base por posição + viés das estatísticas reais + ruído (build-spec §4)
// + serieBonus por série (Marco 3, spec-multi-serie.md §3). Re-sorteados a cada
// nova temporada. Fórmula:
//   viés  = min(15, 3·g + 2·a + 4·mvp)
//   base  = mediaKL (quando presente, ex. Série A/Kings) ou 52
//   attr  = clamp(45, 92, base + U(0,16) + viés + U(-5,+5) + serieBonus)
// serieBonus só desloca o nível médio da série (C=0 · B=+6 · A=+12); ruído e
// zebra continuam intactos. Teto sobe de 90→92 pra acomodar a Série A.

import { valorInicial } from "./mercado";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function gerarAttr(g = 0, a = 0, mvp = 0, serieBonus = 0, mediaKL = null) {
  const vies = Math.min(15, 3 * g + 2 * a + 4 * mvp);
  const base = mediaKL != null ? mediaKL : 52;
  return Math.round(clamp(base + Math.random() * 16 + vies + (Math.random() * 10 - 5) + serieBonus, 45, 92));
}

// Gera os elencos da temporada a partir dos dados reais. Preserva pos10 e origem
// no jogador (o motor não os usa, mas o save/contrato pedem origem por jogador).
// Marco 2 (spec-mercado.md §3.2): valor inicial vem da curva por qualidade +
// mispricing (valorInicial), não mais um piso fixo. timeOrigem nunca muda
// (mesmo que o jogador seja negociado no mercado).
export function gerarElencos(times, elencosReais, serieBonus = 0) {
  const elencos = {};
  times.forEach((t) => {
    elencos[t] = elencosReais[t].map((j, i) => {
      const attr = gerarAttr(j.g, j.a, j.mvp, serieBonus, j.mediaKL ?? null);
      return {
        id: `${t}|${i}`,
        nome: j.nome,
        pos: j.pos,
        pos10: j.pos10,
        attr,
        // g/a reais do Copa10 (build-spec §8, spec-mercado.md §8): é o sinal
        // mostrado no Mercado pra jogadores de OUTROS times, no lugar do
        // atributo bruto (que só é público pro próprio elenco).
        g: j.g,
        a: j.a,
        origem: j.origem,
        time: t,
        valor: valorInicial(attr),
        timeOrigem: t,
      };
    });
  });
  return elencos;
}
