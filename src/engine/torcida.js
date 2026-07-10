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
// rodada. Muta `torcida`, `torcidaRef` e `formaRecente` in-place. `jogos` =
// mesmo array já usado por creditarOrcamentos (precisa de casa/fora/gc/gf).
// `torcidaRef` (spec-marco2-polish.md §3) guarda o valor de ANTES desta
// atualização — é contra ele que a setinha ▲▼ compara (valor real vs rodada
// anterior, não só a direção do último resultado).
export function atualizarTorcida(torcida, torcidaRef, formaRecente, jogos) {
  jogos.forEach((x) => {
    [
      { time: x.casa, r: resultadoDe(x.gc, x.gf) },
      { time: x.fora, r: resultadoDe(x.gf, x.gc) },
    ].forEach(({ time, r }) => {
      if (torcidaRef) torcidaRef[time] = torcida[time];
      torcida[time] = Math.min(TETO_TORCIDA, Math.max(PISO_TORCIDA, Math.round(torcida[time] * DELTA[r])));
      formaRecente[time] = [...(formaRecente[time] || []), r].slice(-3);
    });
  });
}

// Tendência pra exibir ▲▼ na Escalação: compara o número atual de
// torcedores com o valor da rodada anterior (torcidaRef), com "–" se ainda
// não houve rodada nenhuma.
export function tendenciaTorcida(torcida, torcidaRef, time) {
  const atual = torcida?.[time];
  const anterior = torcidaRef?.[time];
  if (atual == null || anterior == null) return "–";
  if (atual > anterior) return "▲";
  if (atual < anterior) return "▼";
  return "–";
}

// Humor da torcida de um time: bom/neutro/ruim, conforme SEQUÊNCIA (3+
// vitórias ou derrotas seguidas) ou posição no TOP 3 / BOTTOM 3 da tabela
// (1 = líder).
export function humorTorcida(formaRecente, posicao, totalTimes) {
  const seq = formaRecente || [];
  const seguidasV = seq.length >= 3 && seq.slice(-3).every((r) => r === "V");
  const seguidasD = seq.length >= 3 && seq.slice(-3).every((r) => r === "D");
  const top3 = posicao <= 3;
  const bottom3 = posicao > totalTimes - 3;
  if (seguidasV || top3) return "bom";
  if (seguidasD || bottom3) return "ruim";
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
    "Time embalado, torcida já sonhando alto.",
    "Resenha do grupo hoje foi só elogio.",
    "Galera comprando confiança de novo.",
  ],
  neutro: [
    "Torcida segue de olho, sem euforia nem clima ruim.",
    "Resultado ok, ninguém reclamou muito.",
    "A galera ainda está avaliando a temporada.",
    "Resenha tranquila depois desse jogo.",
    "Torcida na expectativa pro próximo confronto.",
    "Clima morno na arquibancada, sem drama.",
    "Time nem ferveu nem esfriou a galera.",
    "Torcida esperando pra ver o próximo passo.",
  ],
  ruim: [
    "Torcida começando a cobrar mais.",
    "Resenha do grupo ficou tensa depois dessa.",
    "Alguns já reclamando da fase do time.",
    "Arquibancada nervosa com a sequência recente.",
    "Cobrança aumentando nos bastidores.",
    "Galera do grupo do zap perdendo a paciência.",
    "Sinal amarelo aceso com a torcida.",
    "Time sentindo o peso da cobrança agora.",
  ],
};

// `ultimoTexto` (spec-marco2-polish.md §3): evita repetir o comentário
// anterior — só filtra se sobrar pelo menos 1 frase depois de tirá-lo.
export function gerarComentario(humor, ultimoTexto = null) {
  const lista = COMENTARIOS[humor];
  const opcoes = ultimoTexto ? lista.filter((t) => t !== ultimoTexto) : lista;
  const pool = opcoes.length > 0 ? opcoes : lista;
  return pool[Math.floor(Math.random() * pool.length)];
}
