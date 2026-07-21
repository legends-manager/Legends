// src/data/taticas.js
// Decisão tática de intervalo (C2.2, PLANO_GAMEFEEL_AAA §4-B): a primeira
// agência do jogador DENTRO da partida, além da escalação. Efeito pequeno e
// transparente — mesma família matemática do mando +5% e da fase 0,92–1,08
// (decisão travada 12 do CLAUDE.md: Poisson calibrado, zebra viva). Não
// muda a filosofia do motor, só modula o lambda do 2º tempo:
//   ataque = multiplica meu próprio lambda (quanto eu crio de perigo)
//   defesa = multiplica o lambda do ADVERSÁRIO contra mim (quão exposto fico)
// "equilibrado" é matematicamente idêntico a não escolher nada — ninguém é
// penalizado por não decidir.
export const TATICAS = {
  pressionar: { ataque: 1.06, defesa: 1.04, label: "Pressão alta", desc: "Mais ataque, mais espaço nas costas." },
  equilibrado: { ataque: 1, defesa: 1, label: "Equilibrado", desc: "Sem ajuste — joga como o time já é." },
  segurar: { ataque: 0.94, defesa: 0.96, label: "Segurar o resultado", desc: "Menos risco, defesa mais fechada." },
};

export const ORDEM_TATICAS = ["pressionar", "equilibrado", "segurar"];
export const TATICA_PADRAO = "equilibrado";
