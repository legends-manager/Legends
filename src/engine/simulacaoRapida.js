// src/engine/simulacaoRapida.js
// Simula uma temporada INTEIRA de uma série que o jogador não está disputando
// (Liga Viva, spec-liga-viva.md §5) — só IA vs IA, sem partida ao vivo, pra
// gerar a tabela final. Mesma engine de força interna (simMetade/escalacaoIA
// de engine/simulador.js); guarda só a classificação, não o detalhe dos jogos
// (nem orçamento/mercado/torcida — não fazem sentido pra série "em segundo
// plano", ninguém vai ver). Custa milissegundos porque não desenha nada.
import { gerarElencos } from "./atributos";
import { gerarCalendario } from "./calendario";
import { gerarBolo, escalacaoIA, simMetade, golsDe } from "./simulador";
import { ELENCOS_GLOBAIS } from "../data/series";

export function simularTemporadaRapida(times, serieBonus) {
  const elencos = gerarElencos(times, ELENCOS_GLOBAIS, serieBonus);
  const pool = gerarBolo(times.length).sort(() => Math.random() - 0.5);
  const fase = {}, tabela = {};
  const S = { mult: {}, fase }; // simMetade só lê S.mult/S.fase
  times.forEach((t, i) => {
    S.mult[t] = pool[i];
    fase[t] = 1;
    tabela[t] = { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 };
  });

  gerarCalendario(times).forEach((rodada) => {
    rodada.forEach(({ casa, fora }) => {
      const escCasa = escalacaoIA(elencos[casa]);
      const escFora = escalacaoIA(elencos[fora]);
      const ev = [
        ...simMetade(S, casa, fora, escCasa, escFora, 1),
        ...simMetade(S, casa, fora, escCasa, escFora, 2),
      ];
      const gc = golsDe(ev, casa), gf = golsDe(ev, fora);
      const tc = tabela[casa], tf = tabela[fora];
      tc.J++; tf.J++; tc.GP += gc; tc.GC += gf; tf.GP += gf; tf.GC += gc;
      if (gc > gf) {
        tc.V++; tc.P += 3; tf.D++;
        fase[casa] = Math.min(1.08, fase[casa] + 0.04);
        fase[fora] = Math.max(0.92, fase[fora] - 0.04);
      } else if (gf > gc) {
        tf.V++; tf.P += 3; tc.D++;
        fase[fora] = Math.min(1.08, fase[fora] + 0.04);
        fase[casa] = Math.max(0.92, fase[casa] - 0.04);
      } else {
        tc.E++; tf.E++; tc.P++; tf.P++;
      }
    });
  });

  return tabela;
}
