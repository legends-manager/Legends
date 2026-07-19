// src/components/Camisa.jsx
// Camisa do time (Marco de patrocínio de uniforme, jul/2026): SVG gerado por
// código a partir da cor real do time (data/times.js COR_HEX) e do escudo
// real (CRESTS) — escala pros 32 times na hora, sem precisar de 32 imagens
// desenhadas à mão. Dois espaços de patrocínio, convenção real de futebol:
// peito (patrocinador MÁSTER, grande, vendável por time) e ombro direito
// do escudo (FORNECEDOR de material, menor, o mesmo pra todo mundo).
import { COR_HEX, CRESTS } from "../data/times";
import { FORNECEDOR_CAMISA, patrocinadorMasterDoTime } from "../data/patrocinadoresCamisa";
import { cores } from "./entry-hub/estilos";

export default function Camisa({ time, largura = 260 }) {
  const cor = COR_HEX[time] || cores.steel;
  const crestSrc = CRESTS[time];
  const master = patrocinadorMasterDoTime(time);
  const altura = largura * (380 / 320);

  return (
    <svg viewBox="0 0 320 380" width={largura} height={altura} role="img" aria-label={`Camisa do ${time}`}>
      {/* mangas */}
      <path d="M110,42 L58,58 L50,128 L100,116 L108,60 Z" fill={cor} stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
      <path d="M210,42 L262,58 L270,128 L220,116 L212,60 Z" fill={cor} stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
      {/* corpo, gola V */}
      <path
        d="M108,42 L132,22 L160,38 L188,22 L212,42 L212,345 Q212,362 195,362 L125,362 Q108,362 108,345 Z"
        fill={cor}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
      />
      {/* friso lateral (accent lime, sutil) */}
      <rect x="112" y="60" width="5" height="290" fill={cores.lime} opacity="0.55" />
      <rect x="203" y="60" width="5" height="290" fill={cores.lime} opacity="0.55" />

      {/* escudo — peito esquerdo (do jogador), canto superior esquerdo pra quem olha */}
      {crestSrc && (
        <image href={crestSrc} x="126" y="72" width="34" height="34" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
      )}

      {/* fornecedor de material — peito direito (do jogador), menor, sempre presente */}
      <image href={FORNECEDOR_CAMISA.logo} x="168" y="76" width="26" height="26" opacity="0.95" />

      {/* patrocinador máster — centro do peito, grande, vazio se ninguém comprou ainda */}
      {master ? (
        <image href={master.logo} x="128" y="160" width="64" height="64" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
      ) : (
        <g opacity="0.5">
          <rect x="130" y="170" width="60" height="44" rx="6" fill="none" stroke={cores.textMuted} strokeWidth="2" strokeDasharray="5,4" />
          <text x="160" y="196" textAnchor="middle" fontSize="9" fontWeight="700" fill={cores.textMuted}>ESPAÇO</text>
          <text x="160" y="207" textAnchor="middle" fontSize="9" fontWeight="700" fill={cores.textMuted}>À VENDA</text>
        </g>
      )}
    </svg>
  );
}
