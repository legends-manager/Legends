// src/components/Tabela.jsx
// Classificação (P J V E D GP GC SG %) + setas de fase (▲▼). Força não aparece.
import { SIGLA } from "../data/times";
import { SERIES } from "../data/series";
import { classificar } from "../engine/classificacao";
import { Eyebrow, Rodape, card, amber } from "./ui";

export default function Tabela({ S, meuTime, setTela, irProximaRodada, finalizarTemporadaCarreira }) {
  const linhas = classificar(S.tabela);
  const total = S.calendario.length;
  const fim = S.rodada >= total;

  return (
    <div className="pt-6">
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>Classificação</Eyebrow>
          <h2 className="text-xl font-black italic">{SERIES[S.serie].label} · Rodada {Math.min(S.rodada, total)}/{total}</h2>
        </div>
        <button onClick={() => setTela("artilharia")} className="rounded-lg px-3 py-2 text-xs font-semibold" style={card}>
          🥇 Artilharia
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden mt-3" style={card}>
        <div
          className="grid text-xs font-semibold px-2 py-2"
          style={{ gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)", color: "#A78FC7" }}
        >
          <span /><span /><span>P</span><span>J</span><span>V</span><span>E</span><span>D</span><span>GP</span><span>GC</span><span>SG</span><span>%</span>
        </div>
        {linhas.map((l, i) => (
          <div
            key={l.t}
            className="grid items-center text-xs px-2 py-1.5 tabular-nums"
            style={{
              gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)",
              background: l.t === meuTime ? "rgba(255,197,61,0.10)" : i % 2 ? "rgba(255,255,255,0.02)" : "transparent",
            }}
          >
            <span style={{ color: "#A78FC7" }}>{i + 1}</span>
            <span className="flex items-center gap-1 font-semibold truncate pr-1">
              {SIGLA[l.t]}
              <span style={{ color: S.fase[l.t] > 1.01 ? "#7FE0A8" : S.fase[l.t] < 0.99 ? "#FF5A5A" : "#6E5A92" }}>
                {S.fase[l.t] > 1.01 ? "▲" : S.fase[l.t] < 0.99 ? "▼" : "–"}
              </span>
            </span>
            <span className="font-bold">{l.P}</span><span>{l.J}</span><span>{l.V}</span><span>{l.E}</span>
            <span>{l.D}</span><span>{l.GP}</span><span>{l.GC}</span><span>{l.SG}</span><span>{l.pct}</span>
          </div>
        ))}
      </div>
      {fim ? (
        <button onClick={finalizarTemporadaCarreira} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
          🏆 Fim de temporada
        </button>
      ) : (
        <button onClick={irProximaRodada} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
          Próxima rodada →
        </button>
      )}
      <Rodape />
    </div>
  );
}
