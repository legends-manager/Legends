// src/components/Camisa.jsx
// Camisa do time (Marco de patrocínio de uniforme, jul/2026): SVG gerado por
// código a partir da cor real do time (data/times.js COR_HEX) e do escudo
// real (CRESTS) — escala pros 32 times na hora, sem precisar de 32 imagens
// desenhadas à mão. Dois espaços de patrocínio, convenção real de futebol:
// peito (patrocinador MÁSTER, grande, vendável por time) e peito direito
// do escudo (FORNECEDOR de material, menor, o mesmo pra todo mundo).
//
// v2 (jul/2026, feedback do Felyp — v1 tava "torta"): silhueta construída
// em camadas simples (torso + mangas + punhos + gola sobreposta) em vez de
// um path complexo só — muito mais fácil de acertar sem preview visual
// incremental, e ainda 100% código (zero dependência de asset novo/Figma).
import { COR_HEX, CRESTS } from "../data/times";
import { FORNECEDOR_CAMISA, patrocinadorMasterDoTime } from "../data/patrocinadoresCamisa";
import { cores } from "./entry-hub/estilos";

// Trim (gola/punho) e sombra do tecido em tom mais escuro que o cor-base do
// time — dá contraste sem precisar de uma segunda cor "oficial" por time
// (que não temos) e funciona pra qualquer hex de entrada.
function escurecer(hex, fator = 0.35) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - fator));
  const g = Math.round(((n >> 8) & 255) * (1 - fator));
  const b = Math.round((n & 255) * (1 - fator));
  return `rgb(${r},${g},${b})`;
}

export default function Camisa({ time, largura = 260 }) {
  const cor = COR_HEX[time] || cores.steel;
  const trim = escurecer(cor);
  const crestSrc = CRESTS[time];
  const master = patrocinadorMasterDoTime(time);
  const altura = largura * (360 / 300);
  const gradId = `sheen-${time.replace(/[^a-zA-Z0-9]/g, "")}`;
  const clipId = `torso-${time.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg viewBox="0 0 300 360" width={largura} height={altura} role="img" aria-label={`Camisa do ${time}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M95,70 L120,50 L180,50 L205,70 L205,320 Q205,335 190,335 L110,335 Q95,335 95,320 Z" />
        </clipPath>
      </defs>

      {/* mangas (atrás do torso, pra costura ficar por baixo) */}
      <path d="M95,70 L55,85 L50,145 L92,130 Z" fill={cor} stroke={trim} strokeWidth="2" strokeLinejoin="round" />
      <path d="M205,70 L245,85 L250,145 L208,130 Z" fill={cor} stroke={trim} strokeWidth="2" strokeLinejoin="round" />
      {/* punhos */}
      <rect x="51" y="133" width="40" height="9" rx="3" fill={trim} />
      <rect x="209" y="133" width="40" height="9" rx="3" fill={trim} />

      {/* torso — ombro reto, quadril arredondado */}
      <path
        d="M95,70 L120,50 L180,50 L205,70 L205,320 Q205,335 190,335 L110,335 Q95,335 95,320 Z"
        fill={cor}
        stroke={trim}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* friso lateral (accent lime, sutil) */}
      <rect x="101" y="90" width="5" height="230" fill={cores.lime} opacity="0.55" clipPath={`url(#${clipId})`} />
      <rect x="194" y="90" width="5" height="230" fill={cores.lime} opacity="0.55" clipPath={`url(#${clipId})`} />
      {/* sheen diagonal — dá volume de tecido sem precisar de foto */}
      <rect x="90" y="45" width="120" height="295" fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

      {/* gola — recorte no fundo do card (bgSurface) + friso por cima */}
      <ellipse cx="150" cy="58" rx="27" ry="15" fill={cores.bgSurface} />
      <ellipse cx="150" cy="58" rx="27" ry="15" fill="none" stroke={trim} strokeWidth="4" />

      {/* escudo — peito esquerdo de quem olha */}
      {crestSrc && (
        <image href={crestSrc} x="112" y="100" width="32" height="32" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
      )}

      {/* fornecedor de material — peito direito de quem olha, sempre presente */}
      <image href={FORNECEDOR_CAMISA.logo} x="158" y="103" width="26" height="26" opacity="0.95" />

      {/* patrocinador máster — centro do peito, vazio = "à venda" */}
      {master ? (
        <image href={master.logo} x="118" y="175" width="64" height="60" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
      ) : (
        <g opacity="0.55">
          <rect x="120" y="182" width="60" height="44" rx="6" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="5,4" />
          <text x="150" y="202" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fillOpacity="0.75">ESPAÇO</text>
          <text x="150" y="213" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fillOpacity="0.75">À VENDA</text>
        </g>
      )}
    </svg>
  );
}
