// src/components/Intervalo.jsx
// Substituições só no intervalo, máx. 3, goleiro só por goleiro. Times com 1
// goleiro não têm troca de goleiro (aviso curto).
import { golsDe } from "../engine/simulador";
import { SIGLA } from "../data/times";
import { Eyebrow, Rodape, card, amber } from "./ui";

export default function Intervalo({
  S, meuTime, jogo, setJogo, selOut, setSelOut, selIn, setSelIn, iniciarSegundoTempo,
}) {
  const j = jogo;
  const emCampo = j.minhaEsc2;
  const banco = S.elencos[meuTime].filter((p) => !emCampo.some((e) => e.id === p.id));
  const umGoleiro = S.elencos[meuTime].filter((p) => p.pos === "GOL").length === 1;
  const podeTrocar = selOut && selIn && j.subs < 3 &&
    ((selOut.pos === "GOL") === (selIn.pos === "GOL"));
  const trocar = () => {
    const novaEsc = emCampo.map((p) => (p.id === selOut.id ? selIn : p));
    setJogo({ ...j, minhaEsc2: novaEsc, subs: j.subs + 1 });
    setSelOut(null); setSelIn(null);
  };
  const gc = golsDe(j.ev1, j.casa), gf = golsDe(j.ev1, j.fora);

  return (
    <div className="pt-6">
      <Eyebrow>Intervalo · Rodada {S.rodada + 1}</Eyebrow>
      <div className="rounded-2xl p-4 mt-2 text-center" style={card}>
        <div className="text-3xl font-black italic tabular-nums">{SIGLA[j.casa]} {gc} : {gf} {SIGLA[j.fora]}</div>
        <div className="text-xs mt-1" style={{ color: "#A78FC7" }}>Substituições: {j.subs}/3 · goleiro só por goleiro</div>
        {umGoleiro && (
          <div className="text-xs mt-1" style={{ color: "#FFC53D" }}>Seu time tem 1 goleiro — troca de goleiro indisponível.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <Eyebrow>Sai</Eyebrow>
          <div className="mt-1 space-y-1">
            {emCampo.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelOut(selOut?.id === p.id ? null : p)}
                className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                style={{ ...card, ...(selOut?.id === p.id ? { border: "1px solid #FF5A5A" } : {}) }}
              >
                <span style={{ color: "#A78FC7" }}>{p.pos}</span> {p.nome}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Eyebrow>Entra</Eyebrow>
          <div className="mt-1 space-y-1">
            {banco.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelIn(selIn?.id === p.id ? null : p)}
                className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                style={{ ...card, ...(selIn?.id === p.id ? { border: "1px solid #7FE0A8" } : {}) }}
              >
                <span style={{ color: "#A78FC7" }}>{p.pos} {p.attr}</span> {p.nome}
              </button>
            ))}
            {banco.length === 0 && <div className="text-xs" style={{ color: "#6E5A92" }}>Sem banco disponível.</div>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          disabled={!podeTrocar}
          onClick={trocar}
          className="rounded-xl px-4 py-3 font-bold text-sm disabled:opacity-40"
          style={card}
        >
          🔁 Substituir
        </button>
        <button onClick={iniciarSegundoTempo} className="flex-1 rounded-xl py-3 font-bold" style={amber}>
          Começar 2º tempo
        </button>
      </div>
      <Rodape />
    </div>
  );
}
