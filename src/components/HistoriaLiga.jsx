// src/components/HistoriaLiga.jsx
// Liga Viva (spec-liga-viva.md §3.1): hall de campeões — temporada a
// temporada, os campeões das três séries. É a memória que faz a liga viva
// importar (igual a lista de campeões brasileiros por ano).
import { SIGLA } from "../data/times";
import { Eyebrow, Rodape, card } from "./ui";

export default function HistoriaLiga({ mundo, setTela }) {
  const hall = [...mundo.hallCampeoes].reverse();

  return (
    <div className="pt-6">
      <Eyebrow>Legends Liga Fut7</Eyebrow>
      <h2 className="text-xl font-black italic">História da Liga</h2>

      <div className="rounded-2xl overflow-hidden mt-3" style={card}>
        <div
          className="grid text-xs font-semibold px-3 py-2"
          style={{ gridTemplateColumns: "3rem 1fr 1fr 1fr", color: "#A78FC7" }}
        >
          <span>Temp.</span><span>Série A</span><span>Série B</span><span>Série C</span>
        </div>
        {hall.length === 0 && (
          <div className="text-sm text-center py-4" style={{ color: "#6E5A92" }}>
            Nenhuma temporada concluída ainda.
          </div>
        )}
        {hall.map((h, i) => (
          <div
            key={h.temporada}
            className="grid items-center text-xs px-3 py-2"
            style={{ gridTemplateColumns: "3rem 1fr 1fr 1fr", background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}
          >
            <span className="tabular-nums" style={{ color: "#A78FC7" }}>{h.temporada}</span>
            <span className="truncate pr-1">{SIGLA[h.A] || h.A}</span>
            <span className="truncate pr-1">{SIGLA[h.B] || h.B}</span>
            <span className="truncate pr-1">{SIGLA[h.C] || h.C}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-4" style={card}>
        ← Voltar
      </button>
      <Rodape />
    </div>
  );
}
