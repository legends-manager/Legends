// src/engine/manchetes.js
// Manchetes de transferência (spec-marco2-polish.md §2). Geradas a partir do
// historico de UMA janela (máx. 3, tom de várzea) — camada de apresentação
// pura, não influencia nada do motor.
const LIMIAR_BOMBA = 800; // L$ ⚙️
const MAX_MANCHETES = 3; // ⚙️

// `S` só é usado pra checar o elenco atual do vendedor (regra da "joia").
// `historicoDaJanela` = entradas de S.mercado.historico da rodada corrente.
export function gerarManchetes(S, historicoDaJanela) {
  if (historicoDaJanela.length === 0) {
    return ["Janela morna: ninguém abriu o cofre"];
  }

  const manchetes = [];
  const usados = new Set();

  // BOMBA: a maior compra da janela, se passar do limiar.
  const maior = [...historicoDaJanela].sort((a, b) => b.valor - a.valor)[0];
  if (maior.valor >= LIMIAR_BOMBA) {
    manchetes.push(`💣 BOMBA: ${maior.para} contrata ${maior.jogador} por L$ ${maior.valor}!`);
    usados.add(maior);
  }

  // JOIA: o jogador vendido valia mais que qualquer um que sobrou no elenco
  // do vendedor — ele abriu mão do seu melhor ativo.
  if (manchetes.length < MAX_MANCHETES) {
    const joia = historicoDaJanela.find((h) => {
      if (usados.has(h)) return false;
      const restante = S.elencos[h.de] || [];
      const maxRestante = restante.length ? Math.max(...restante.map((j) => j.valor)) : 0;
      return h.valor > maxRestante;
    });
    if (joia) {
      manchetes.push(`${joia.de} vende a joia: ${joia.jogador} vai pro ${joia.para}`);
      usados.add(joia);
    }
  }

  // COFRE: time que mais gastou nesta janela.
  if (manchetes.length < MAX_MANCHETES) {
    const gastoPorTime = {};
    historicoDaJanela.forEach((h) => { gastoPorTime[h.para] = (gastoPorTime[h.para] || 0) + h.valor; });
    const [maisGastou] = Object.entries(gastoPorTime).sort((a, b) => b[1] - a[1]);
    if (maisGastou) manchetes.push(`${maisGastou[0]} abriu o cofre nesta janela`);
  }

  return manchetes.slice(0, MAX_MANCHETES);
}
