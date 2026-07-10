// src/engine/torcida.js
// Torcida por time (spec-marco2-polish.md §3). Camada de APRESENTAÇÃO pura:
// mede clima/humor da torcida a partir de resultados públicos (V/E/D,
// posição na tabela). PROIBIDO qualquer fórmula do motor (Poisson, força
// interna em simulador.js, economia em mercado.js) ler ou depender de
// torcida — ela nunca influencia quem ganha, quem compra, ou quanto vale.
import { posicaoDoTime } from "./mercado";

export const TORCIDA_INICIAL = 500;
const PISO_TORCIDA = 100;
const TETO_TORCIDA = 5000;
const DELTA = { V: 1.08, E: 1.01, D: 0.94 }; // vitória +8% · empate +1% · derrota −6%

export function torcidaInicial(times) {
  const t = {};
  times.forEach((time) => { t[time] = TORCIDA_INICIAL; });
  return t;
}

const resultadoDe = (gp, gc) => (gp > gc ? "V" : gp < gc ? "D" : "E");

// Atualiza torcida + forma recente (últimos 3 resultados) pros times da
// rodada. Muta `torcida` e `formaRecente` in-place. `jogos` = mesmo array já
// usado por creditarOrcamentos (precisa de casa/fora/gc/gf).
export function atualizarTorcida(torcida, formaRecente, jogos) {
  jogos.forEach((x) => {
    [
      { time: x.casa, r: resultadoDe(x.gc, x.gf) },
      { time: x.fora, r: resultadoDe(x.gf, x.gc) },
    ].forEach(({ time, r }) => {
      torcida[time] = Math.min(TETO_TORCIDA, Math.max(PISO_TORCIDA, Math.round(torcida[time] * DELTA[r])));
      formaRecente[time] = [...(formaRecente[time] || []), r].slice(-3);
    });
  });
}

// Tendência pra exibir ▲▼ na Escalação: reflete o resultado mais recente
// (vitória/empate sobem a torcida, derrota desce — bate com DELTA acima).
export function tendenciaTorcida(formaRecente) {
  const ultimo = (formaRecente || [])[formaRecente?.length - 1];
  if (!ultimo) return "–";
  return ultimo === "D" ? "▼" : "▲";
}

// Humor da torcida de um time: bom/neutro/ruim, conforme sequência recente
// (últimos 3 resultados) + posição na tabela (1 = líder).
export function humorTorcida(formaRecente, posicao, totalTimes) {
  const seq = formaRecente || [];
  const vitorias = seq.filter((r) => r === "V").length;
  const derrotas = seq.filter((r) => r === "D").length;
  const terco = totalTimes / 3;
  if (vitorias >= 2 && posicao <= terco) return "bom";
  if (derrotas >= 2 && posicao > totalTimes - terco) return "ruim";
  if (vitorias > derrotas) return "bom";
  if (derrotas > vitorias) return "ruim";
  return "neutro";
}

export function humorDoTime(S, time) {
  return humorTorcida(S.formaRecente[time], posicaoDoTime(S, time), Object.keys(S.tabela).length);
}

const COMENTARIOS = {
  bom: [
    "A torcida está eufórica com essa sequência!",
    "Galera enchendo o grupo do WhatsApp de elogio.",
    "Confiança lá em cima depois dessas atuações.",
    "Todo mundo comentando o time bom que virou.",
    "Arquibancada cantando o nome do time.",
  ],
  neutro: [
    "Torcida segue de olho, sem euforia nem clima ruim.",
    "Resultado ok, ninguém reclamou muito.",
    "A galera ainda está avaliando a temporada.",
    "Resenha tranquila depois desse jogo.",
  ],
  ruim: [
    "Torcida começando a cobrar mais.",
    "Resenha do grupo ficou tensa depois dessa.",
    "Alguns já reclamando da fase do time.",
    "Arquibancada nervosa com a sequência recente.",
    "Cobrança aumentando nos bastidores.",
  ],
};

export function gerarComentario(humor) {
  const lista = COMENTARIOS[humor];
  return lista[Math.floor(Math.random() * lista.length)];
}
