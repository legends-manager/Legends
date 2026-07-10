// src/components/FimDeTemporada.jsx
// Liga Viva (Marco 3.5, spec-liga-viva.md §6): pódio + SOBE/DESCE/PERMANECE
// das três séries + destino do jogador. Substitui a antiga TelaCampeao (que
// mostrava só a própria série e voltava pro mesmo time — a Liga Viva reverte
// isso: agora o técnico acompanha o time pra onde ele for).
import { SERIES } from "../data/series";
import { Eyebrow, Rodape, card, amber } from "./ui";

const RESULTADO_LABEL = { subiu: "🔼 Subiu", desceu: "🔽 Desceu", manteve: "➡️ Permaneceu" };
const RESULTADO_COR = { subiu: "#7FE0A8", desceu: "#FF5A5A", manteve: "#A78FC7" };

function BlocoSerie({ serieId, dados, meuTime }) {
  return (
    <div className="rounded-xl p-3 mt-3" style={card}>
      <div className="flex items-center justify-between">
        <Eyebrow>{SERIES[serieId].label}</Eyebrow>
        <span className="text-xs" style={{ color: "#FFC53D" }}>🏆 {dados.campeao}</span>
      </div>
      {dados.sobem.length > 0 && (
        <div className="text-xs mt-2">
          <span style={{ color: "#7FE0A8" }}>▲ Sobem: </span>
          {dados.sobem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
        </div>
      )}
      {dados.descem.length > 0 && (
        <div className="text-xs mt-1">
          <span style={{ color: "#FF5A5A" }}>▼ Descem: </span>
          {dados.descem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
        </div>
      )}
      <div className="text-xs mt-1" style={{ color: "#6E5A92" }}>
        Permanecem: {dados.permanecem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
      </div>
    </div>
  );
}

export default function FimDeTemporada({ resumo, meuTime, nomeTec, proximaTemporadaCarreira }) {
  const { resultado, serieDestino, meuResultado, minhaPosicao, minhaSerie } = resumo;

  return (
    <div className="pt-8">
      <div className="rounded-2xl p-6 text-center" style={{ background: "#1E1233", border: "2px solid #FFC53D" }}>
        <Eyebrow>Fim de temporada · Liga Viva</Eyebrow>
        <div className="text-5xl mt-3">📋</div>
        <div className="text-2xl font-black italic mt-2">{meuTime}</div>
        <div className="text-sm font-semibold mt-1" style={{ color: "#F2EDFA" }}>
          Técnico {nomeTec || "Técnico"}
        </div>
        <div className="text-sm mt-3 tabular-nums" style={{ color: "#D9CCEE" }}>
          {SERIES[minhaSerie].label} · {minhaPosicao}º lugar
        </div>
        <div className="text-lg font-black italic mt-2" style={{ color: RESULTADO_COR[meuResultado] }}>
          {RESULTADO_LABEL[meuResultado]}
        </div>
        <div className="text-sm mt-1" style={{ color: "#A78FC7" }}>
          Próxima temporada: <b>{SERIES[serieDestino].label}</b>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#A78FC7" }}>
          Resultado das três séries
        </div>
        {["A", "B", "C"].map((s) => (
          <BlocoSerie key={s} serieId={s} dados={resultado[s]} meuTime={meuTime} />
        ))}
      </div>

      <button onClick={proximaTemporadaCarreira} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
        Próxima temporada →
      </button>
      <Rodape />
    </div>
  );
}
