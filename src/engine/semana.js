// src/engine/semana.js
// Semana Temática (ideia aprovada pelo Felyp, jul/2026): evento rotativo de
// 7 dias que muda a REGRA DE PREMIAÇÃO em L$ — nunca o motor da simulação
// (Poisson, força, fase ficam intocados; spec-mercado.md continua valendo).
// A semana é derivada da data real (semana ISO), então todo mundo da liga
// vive o mesmo tema ao mesmo tempo — assunto pro grupo do WhatsApp.
// Funções puras; o crédito acontece em finalizarRodada (App.jsx).

export const SEMANAS = [
  {
    id: "artilheiro",
    titulo: "Semana do Artilheiro",
    desc: "Cada gol do seu time paga bônus extra.",
    // ⚙️ calibrável — modesto de propósito pra não competir com a economia
    // do Marco 2 (mesma disciplina do Quiz).
    bonus: (ctx) => ctx.meusGols * 6,
    resumo: (ctx) => (ctx.meusGols > 0 ? `${ctx.meusGols} gol(s) na Semana do Artilheiro` : null),
  },
  {
    id: "muralha",
    titulo: "Semana da Muralha",
    desc: "Não sofrer gol na rodada paga bônus.",
    bonus: (ctx) => (ctx.golsAdv === 0 ? 35 : 0),
    resumo: (ctx) => (ctx.golsAdv === 0 ? "Jogo sem sofrer gol na Semana da Muralha" : null),
  },
  {
    id: "zebra",
    titulo: "Semana da Zebra",
    desc: "Vencer um time acima de você na tabela paga dobrado.",
    // "Acima na tabela" é informação pública (classificação), nunca o
    // atributo interno de força — trava do CLAUDE.md preservada.
    bonus: (ctx) => (ctx.venceu && ctx.advAcimaNaTabela ? 45 : 0),
    resumo: (ctx) => (ctx.venceu && ctx.advAcimaNaTabela ? "Zebra confirmada na Semana da Zebra" : null),
  },
  {
    id: "festa",
    titulo: "Semana da Festa",
    desc: "Vencer por 3+ gols de diferença paga bônus.",
    bonus: (ctx) => (ctx.venceu && ctx.meusGols - ctx.golsAdv >= 3 ? 40 : 0),
    resumo: (ctx) => (ctx.venceu && ctx.meusGols - ctx.golsAdv >= 3 ? "Show de bola na Semana da Festa" : null),
  },
];

// Número da semana ISO (1-53) — determinístico a partir da data, sem estado.
export function semanaISO(data = new Date()) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
}

export function semanaTematica(data = new Date()) {
  return SEMANAS[semanaISO(data) % SEMANAS.length];
}

// Contexto do jogo do humano → bônus da semana vigente (0 se não cumpriu).
export function bonusDaSemana(ctx, data = new Date()) {
  const s = semanaTematica(data);
  const valor = s.bonus(ctx);
  return valor > 0 ? { valor, titulo: s.titulo, resumo: s.resumo(ctx) } : null;
}
