// src/components/InsigniaBadge.jsx
// Arte real da insígnia por tier (GPT Image, jul/2026 — prompts em
// PROMPTS_GPT_IMAGE.md, direção "esports premium"). Cai pro círculo com
// emoji de sempre se a imagem falhar ao carregar — nunca quebra, mesmo
// padrão de fallback do Crest.jsx/AvatarTecnico.
import { useState } from "react";
import { corTier, glowTier } from "./entry-hub/estilos";

const IMG_TIER = {
  comum: "/insignias/comum.webp",
  raro: "/insignias/raro.webp",
  epico: "/insignias/epico.webp",
  lendario: "/insignias/lendario.webp",
};

export default function InsigniaBadge({ tier, emoji, size = 64 }) {
  const [erro, setErro] = useState(false);
  const src = IMG_TIER[tier];
  if (src && !erro) {
    return (
      <img
        src={src}
        alt={tier}
        onError={() => setErro(true)}
        className="shrink-0"
        style={{ width: size, height: size, objectFit: "contain", ...glowTier(tier) }}
      />
    );
  }
  const cor = corTier[tier];
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: size, height: size, borderRadius: 999,
        background: "#2D343D", border: `3px solid ${cor}`,
        fontSize: size * 0.45, ...glowTier(tier),
      }}
    >
      {emoji}
    </div>
  );
}
