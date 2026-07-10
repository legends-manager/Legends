// src/components/PartidaAoVivo.jsx
// Partida ao vivo: relógio minuto a minuto, faixa de gol compacta no topo,
// eventos narrados e placares dos outros jogos. ARENA.label discreto sob o placar.
import { golsDe } from "../engine/simulador";
import { SIGLA } from "../data/times";
import { ARENA } from "../data/arena";
import { Eyebrow, Rodape, Avatar, PlacaPatrocinio, card, amber } from "./ui";

export default function PartidaAoVivo({ S, jogo, minuto, banner, mudo, setMudo }) {
  const j = jogo;
  if (!j) return null;
  const evs = [...j.ev1, ...(j.ev2 || [])];
  const gc = golsDe(evs, j.casa, minuto), gf = golsDe(evs, j.fora, minuto);
  const visiveis = evs.filter((e) => e.min <= minuto).sort((a, b) => b.min - a.min);

  return (
    <div className="pt-6">
      {banner && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="max-w-md mx-auto m-2 rounded-xl px-4 py-3 font-black italic text-sm shadow-lg" style={amber}>
            {banner}
          </div>
        </div>
      )}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between">
          <Eyebrow>Rodada {S.rodada + 1}</Eyebrow>
          <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#FF5A5A" }}>
            <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: "#FF5A5A" }} />AO VIVO
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col items-center gap-1 w-20">
            <Avatar t={j.casa} /><span className="text-xs font-bold">{SIGLA[j.casa]}</span>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black italic tabular-nums tracking-tight">
              {gc}<span style={{ color: "#A78FC7" }}> : </span>{gf}
            </div>
            <div className="text-sm font-bold tabular-nums mt-1" style={{ color: "#FFC53D" }}>{Math.min(minuto, 50)}&#39;</div>
          </div>
          <div className="flex flex-col items-center gap-1 w-20">
            <Avatar t={j.fora} /><span className="text-xs font-bold">{SIGLA[j.fora]}</span>
          </div>
        </div>
        <div className="text-center text-xs mt-3" style={{ color: "#6E5A92" }}>{ARENA.label}</div>
        {/* Placa de estádio: o espaço de patrocínio de maior exposição do app
            (fica na tela a partida inteira, ~50 ticks de relógio). */}
        <div className="mt-3">
          <PlacaPatrocinio compacta />
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button onClick={() => setMudo(!mudo)} className="text-xs rounded-lg px-3 py-1.5" style={card}>
          {mudo ? "🔇 mudo" : "🔊 som"}
        </button>
      </div>

      <div className="mt-2 space-y-1.5">
        {visiveis.map((e, i) => (
          <div key={i} className="rounded-xl px-3 py-2 text-sm flex gap-2" style={card}>
            <span className="tabular-nums text-xs w-8 shrink-0 pt-0.5" style={{ color: "#A78FC7" }}>{e.min}&#39;</span>
            {e.tipo === "gol" ? (
              <span>
                <b style={{ color: "#FFC53D" }}>GOL do {SIGLA[e.time]}!</b> {e.autor.nome}, {e.desc}
                {e.assist ? <span style={{ color: "#A78FC7" }}> (assist. {e.assist.nome})</span> : ""}
              </span>
            ) : (
              <span style={{ color: "#D9CCEE" }}>{e.autor.nome} {e.desc}</span>
            )}
          </div>
        ))}
        {visiveis.length === 0 && (
          <div className="text-center text-sm py-4" style={{ color: "#6E5A92" }}>Bola rolando na Arena…</div>
        )}
      </div>

      <div className="mt-4">
        <Eyebrow>Outros jogos da rodada</Eyebrow>
        <div className="mt-1 space-y-1">
          {j.outros.map((o, i) => (
            <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
              <span className="font-semibold">{SIGLA[o.casa]}</span>
              <span className="font-black italic tabular-nums">{golsDe(o.ev, o.casa, minuto)} : {golsDe(o.ev, o.fora, minuto)}</span>
              <span className="font-semibold">{SIGLA[o.fora]}</span>
            </div>
          ))}
        </div>
      </div>
      <Rodape />
    </div>
  );
}
