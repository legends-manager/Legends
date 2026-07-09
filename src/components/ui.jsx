// src/components/ui.jsx
// Primitivas visuais e constantes de estilo compartilhadas pelas telas.
// Extraídas da demo sem alteração visual.
import { SIGLA, COR } from "../data/times";

export const card = { background: "#1E1233", border: "1px solid rgba(139,105,190,0.35)" };
export const amber = { background: "#FFC53D", color: "#1A1607" };

export const Eyebrow = ({ children }) => (
  <div className="uppercase tracking-widest text-xs font-semibold" style={{ color: "#A78FC7" }}>
    {children}
  </div>
);

export const Rodape = () => (
  <div className="text-center text-xs mt-8 pb-6" style={{ color: "#6E5A92" }}>
    Simulação — BETA · Legends Manager
  </div>
);

export const Avatar = ({ t, sm }) => (
  <span
    className={`${COR[t]} ${sm ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"} rounded-full inline-flex items-center justify-center font-black italic shrink-0 text-white`}
  >
    {SIGLA[t]}
  </span>
);

export const Barra = ({ v }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="w-12 h-1.5 rounded-full overflow-hidden inline-block" style={{ background: "#2E1D4C" }}>
      <span className="h-full block rounded-full" style={{ width: `${v}%`, background: v >= 75 ? "#FFC53D" : "#9B6FDF" }} />
    </span>
    <span className="tabular-nums text-xs" style={{ color: v >= 75 ? "#FFC53D" : "#A78FC7" }}>{v}</span>
  </span>
);
