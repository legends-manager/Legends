// src/components/ui.jsx
// Primitivas visuais e constantes de estilo compartilhadas pelas telas.
// Extraídas da demo sem alteração visual.
import { useState } from "react";
import { SIGLA, COR } from "../data/times";

// Galeria de avatares do técnico (spec-marco2-polish.md §5): 12 slots fixos
// em /public/avatars/aXX.png — pré-gerados pelo Felyp, mesmo estilo da capa.
// Podem não existir ainda; tudo aqui funciona sem os arquivos (fallback).
export const AVATAR_IDS = [
  "a01", "a02", "a03", "a04", "a05", "a06",
  "a07", "a08", "a09", "a10", "a11", "a12",
];

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

// Avatar do técnico: PNG da galeria se `avatarId` existir e carregar; senão
// (ausente, "sem avatar" ou 404 — pasta /public/avatars pode nem existir)
// cai pro círculo com as iniciais do nome. Nunca quebra.
export const AvatarTecnico = ({ avatarId, nome, fallback, size = 40 }) => {
  const [erro, setErro] = useState(false);
  if (avatarId && !erro) {
    return (
      <img
        src={`/avatars/${avatarId}.png`}
        alt={nome || avatarId}
        onError={() => setErro(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: "1px solid rgba(139,105,190,0.35)" }}
      />
    );
  }
  const iniciais =
    fallback ||
    (nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") ||
    "?";
  return (
    <span
      className="rounded-full inline-flex items-center justify-center font-black italic shrink-0 text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: "#7C4FCC" }}
    >
      {iniciais}
    </span>
  );
};

export const Barra = ({ v }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="w-12 h-1.5 rounded-full overflow-hidden inline-block" style={{ background: "#2E1D4C" }}>
      <span className="h-full block rounded-full" style={{ width: `${v}%`, background: v >= 75 ? "#FFC53D" : "#9B6FDF" }} />
    </span>
    <span className="tabular-nums text-xs" style={{ color: v >= 75 ? "#FFC53D" : "#A78FC7" }}>{v}</span>
  </span>
);
