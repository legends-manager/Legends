// src/components/TelaCampeao.jsx
// Pôster de campeão pra print (build-spec §7). ARENA.label no rodapé do pôster.
import { TIMES } from "../data/times";
import { ARENA } from "../data/arena";
import { Eyebrow, Rodape, card, amber } from "./ui";

export default function TelaCampeao({ S, meuTime, nomeTec, confirmaNova, setConfirmaNova, iniciarTemporada }) {
  const linhas = TIMES.map((t) => {
    const d = S.tabela[t];
    return { t, ...d, SG: d.GP - d.GC };
  }).sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP);
  const camp = linhas[0];
  const minhaPos = linhas.findIndex((l) => l.t === meuTime) + 1;
  const souCampeao = camp.t === meuTime;

  return (
    <div className="pt-8">
      <div className="rounded-2xl p-6 text-center" style={{ background: "#1E1233", border: "2px solid #FFC53D" }}>
        <Eyebrow>Legends Liga Fut7 · Série C · 2026</Eyebrow>
        <div className="text-6xl mt-3">🏆</div>
        <div className="uppercase tracking-widest text-xs mt-2 font-bold" style={{ color: "#FFC53D" }}>Campeão</div>
        <div className="text-3xl font-black italic mt-1">{camp.t}</div>
        {souCampeao && <div className="text-sm font-semibold mt-1">Técnico: {nomeTec || "Técnico"}</div>}
        <div className="text-sm mt-3 tabular-nums" style={{ color: "#D9CCEE" }}>
          {camp.P} pts · {camp.V}V {camp.E}E {camp.D}D · saldo {camp.SG > 0 ? "+" : ""}{camp.SG}
        </div>
        <div className="text-xs mt-4" style={{ color: "#6E5A92" }}>{ARENA.label}</div>
        <div className="text-xs font-black italic mt-1" style={{ color: "#A78FC7" }}>
          LEGENDS<span style={{ color: "#FFC53D" }}>MANAGER</span>
        </div>
      </div>
      {!souCampeao && (
        <div className="rounded-xl px-4 py-3 mt-2 text-sm text-center" style={card}>
          Seu {meuTime} terminou em <b>{minhaPos}º</b> com {linhas[minhaPos - 1].P} pontos, técnico {nomeTec || "Técnico"}.
        </div>
      )}
      <div className="text-center text-xs mt-3" style={{ color: "#A78FC7" }}>
        Tira um print e manda no grupo. 📸
      </div>
      {!confirmaNova ? (
        <button onClick={() => setConfirmaNova(true)} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
          Nova temporada
        </button>
      ) : (
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmaNova(false)} className="flex-1 rounded-xl py-3 font-bold" style={card}>Cancelar</button>
          <button
            onClick={() => { setConfirmaNova(false); iniciarTemporada(meuTime); }}
            className="flex-1 rounded-xl py-3 font-bold"
            style={amber}
          >
            Confirmar
          </button>
        </div>
      )}
      <Rodape />
    </div>
  );
}
