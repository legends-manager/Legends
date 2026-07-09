// src/components/Artilharia.jsx
// Artilharia · Top 10.
import { SIGLA } from "../data/times";
import { Eyebrow, Rodape, card } from "./ui";

export default function Artilharia({ S, setTela }) {
  const top = Object.values(S.art).sort((a, b) => b.g - a.g).slice(0, 10);

  return (
    <div className="pt-6">
      <Eyebrow>Artilharia · Top 10</Eyebrow>
      <div className="mt-2 space-y-1">
        {top.map((a, i) => (
          <div key={i} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={card}>
            <span className="w-5 text-center font-black italic tabular-nums" style={{ color: i === 0 ? "#FFC53D" : "#A78FC7" }}>{i + 1}</span>
            <span className="flex-1 text-sm">{a.nome} <span className="text-xs" style={{ color: "#A78FC7" }}>({SIGLA[a.time]})</span></span>
            <span className="font-black italic tabular-nums">{a.g} ⚽</span>
          </div>
        ))}
        {top.length === 0 && <div className="text-sm" style={{ color: "#6E5A92" }}>Nenhum gol ainda.</div>}
      </div>
      <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3 font-bold mt-4" style={card}>← Voltar à tabela</button>
      <Rodape />
    </div>
  );
}
