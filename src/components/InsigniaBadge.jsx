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

// Insígnias com arte PRÓPRIA (não a genérica por tier) — hoje só as do
// patrocinador Delícias da Ana (jul/2026): a marca já vem desenhada na
// imagem, então tem prioridade sobre IMG_TIER quando `conquistaId` bate.
const IMG_CONQUISTA = {
  "patrocinio-kissassa-c": "/patrocinio/normal.webp",
  "patrocinio-kissassa-b": "/patrocinio/platina.webp",
  "patrocinio-kissassa-a": "/patrocinio/ouro.webp",
};

export default function InsigniaBadge({ tier, emoji, size = 64, conquistaId }) {
  const [erro, setErro] = useState(false);
  const src = (conquistaId && IMG_CONQUISTA[conquistaId]) || IMG_TIER[tier];
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
