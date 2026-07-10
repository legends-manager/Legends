// src/components/HistoriaCarreira.jsx
// Liga Viva (spec-liga-viva.md §6): lista as temporadas do jogador — série,
// time, posição, subiu/desceu/permaneceu.
import { SERIES } from "../data/series";
import { Eyebrow, Rodape, card } from "./ui";

const RESULTADO_LABEL = { subiu: "🔼 Subiu", desceu: "🔽 Desceu", manteve: "➡️ Permaneceu" };
const RESULTADO_COR = { subiu: "#7FE0A8", desceu: "#FF5A5A", manteve: "#A78FC7" };

export default function HistoriaCarreira({ mundo, setTela }) {
  const carreira = [...mundo.carreira].reverse();

  return (
    <div className="pt-6">
      <Eyebrow>Carreira · {mundo.meuTime}</Eyebrow>
      <h2 className="text-xl font-black italic">Histórico de temporadas</h2>

      <div className="mt-3 space-y-1.5">
        {carreira.length === 0 && (
          <div className="text-sm text-center py-4" style={{ color: "#6E5A92" }}>
            Nenhuma temporada concluída ainda.
          </div>
        )}
        {carreira.map((c, i) => (
          <div key={i} className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={card}>
            <div>
              <div className="text-sm font-semibold">Temporada {c.temporada} · {SERIES[c.serie].label}</div>
              <div className="text-xs tabular-nums" style={{ color: "#A78FC7" }}>{c.posicao}º lugar</div>
            </div>
            <span className="text-xs font-bold" style={{ color: RESULTADO_COR[c.resultado] }}>
              {RESULTADO_LABEL[c.resultado]}
            </span>
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
