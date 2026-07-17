// src/components/Artilharia.jsx
// Artilharia · Top 10.
// Reskin "Polish Language v1" (jul/2026, Fase 1a): grafite/lime; 1º lugar em
// gold (pódio); emoji de bola removido (regra travada: sem emoji como ícone).
import { SIGLA } from "../data/times";
import {
  cores, superficie, superficie2, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

export default function Artilharia({ S, setTela }) {
  const top = Object.values(S.art).sort((a, b) => b.g - a.g).slice(0, 10);

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="artilharia" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Artilharia · Top 10</span>
        <div className="mt-2 space-y-1">
          {top.map((a, i) => (
            <div key={i} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={i === 0 ? { ...superficie, border: `1px solid ${cores.gold}` } : superficie}>
              <span className="w-5 text-center font-black italic tabular-nums" style={{ color: i === 0 ? cores.gold : cores.textSecondary }}>{i + 1}</span>
              <span className="flex-1 text-sm min-w-0">
                {a.nome}
                <span className="block text-xs" style={{ color: cores.textMuted }}>{a.time} ({SIGLA[a.time]})</span>
              </span>
              <span className="font-black italic tabular-nums" style={{ color: i === 0 ? cores.gold : cores.textPrimary }}>{a.g} gols</span>
            </div>
          ))}
          {top.length === 0 && <div className="text-sm" style={{ color: cores.textMuted }}>Nenhum gol ainda.</div>}
        </div>
        <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3 font-bold mt-4" style={superficie2}>
          ← Voltar à tabela
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
