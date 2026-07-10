// src/engine/classificacao.js
// Classificação a partir de uma `tabela` (P/J/V/E/D/GP/GC por time) — mesmo
// critério de desempate usado em toda a UI (P, saldo, gols pró, nome).
// Extraído de Tabela.jsx/TelaCampeao.jsx/mercado.js (estava duplicado em 3
// lugares); agora é a fonte única, reaproveitada também pela Liga Viva
// (Marco 3.5) pra calcular quem sobe/desce/permanece.
export function classificar(tabela) {
  return Object.keys(tabela)
    .map((t) => {
      const d = tabela[t];
      return { t, ...d, SG: d.GP - d.GC, pct: d.J ? Math.round((d.P / (d.J * 3)) * 100) : 0 };
    })
    .sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP || a.t.localeCompare(b.t));
}

export function posicaoNaTabela(tabela, time) {
  return classificar(tabela).findIndex((l) => l.t === time) + 1;
}
