// src/engine/simulacaoRapida.js
// Simula uma temporada INTEIRA de uma série de uma vez só (sem clock, sem
// partida ao vivo) — usado hoje só como fallback defensivo (ex.: uma série
// paralela sem estado nenhum ainda). Desde que a tabela ao vivo das 3 séries
// existe (Liga Viva, engine/simulador.js: iniciarSerieParalela +
// avancarRodadaSimples, avançadas 1 rodada por vez em paralelo com a do
// jogador), o caminho normal de fim de temporada não passa mais por aqui —
// ele já tem a tabela acumulada rodada a rodada. Fino wrapper sobre as
// mesmas primitivas, pra não duplicar a lógica de simulação.
import { iniciarSerieParalela, sincronizarSerieParalela } from "./simulador";

export function simularTemporadaRapida(times, serieBonus) {
  const estado = iniciarSerieParalela(times, serieBonus);
  sincronizarSerieParalela(estado, estado.calendario.length);
  return estado.tabela;
}
