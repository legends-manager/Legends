// src/data/times.js
// Metadados de exibição dos times (sigla + cor do avatar), de TODAS as séries
// — os mapas são globais por nome de time (nomes não colidem entre séries).
// Nada aqui é indicador de FORÇA de time (força é 100% interna).
import { TIMES_SERIE_C } from "./elencos-reais";

// Ordem oficial dos 12 times da Série C (legado; a UI multi-série usa
// SERIES[serie].times de data/series.js).
export const TIMES = TIMES_SERIE_C;

export const SIGLA = {
  // Série C
  "Real União": "RUN", "Real Elite": "RLE", "Sereno FC": "SER", "Sem Limites": "SLM",
  "Canelas": "CAN", "Marselha FC": "MAR", "Nordeste FC": "NOR", "Racha FC": "RAC",
  "Puro Osso": "PUR", "Kissassa": "KIS", "Fortaleza": "FOR", "Dragon Bola FC": "DRA",
  // Série B ("FORZA F.C" usa FRZ pra não espelhar o FOR do Fortaleza)
  "Ousadia FC": "OUS", "A.E. Dallas": "DAL", "Quebrada F.C": "QUE", "Villa City": "VIL",
  "Tigres": "TIG", "FORZA F.C": "FRZ", "Benfica": "BEN", "PH FC": "PHF",
  "Lanús": "LAN", "Nação NH": "NNH",
  // Série A (Kings League Brasil, provisória)
  "Furia FC": "FUR", "G3X FC": "G3X", "Fluxo FC": "FLX", "Nyvelados FC": "NYV",
  "DesimpaiN": "DES", "Podpah Funkbol Clube": "POD", "Dibrados FC": "DIB",
  "Dendele FC": "DEN", "Capim FC": "CAP", "LOUD SC": "LOU",
};

// Escudos reais (jul/2026, decisão explícita do Felyp — reabre a trava
// "escudos reais" do backlog do CLAUDE.md pra Série B/C (artes próprias,
// enviadas em art/serie b e art/serie c) e, num segundo passo, pra Série A
// (logos oficiais da Kings League Brasil, enviados em art/kings league —
// aqui o risco de reproduzir marca registrada de organizações reais é
// EXPLICITAMENTE do Felyp, que forneceu os arquivos ele mesmo depois de eu
// levantar a diferença pro caso B/C, que são times fictícios). Só entram
// aqui os times com arquivo de verdade; quem não tem cai pro crachá de
// sigla via fallback do componente Crest — nunca quebra.
// Todos em WebP 256px (scripts/comprimir-escudos.mjs): 2,3MB → ~460KB no
// total, dentro do teto de 200KB/asset do REDESIGN §8.
export const CRESTS = {
  // Série C
  "Real União": "/crests/RUN.webp", "Real Elite": "/crests/RLE.webp", "Sereno FC": "/crests/SER.webp",
  "Sem Limites": "/crests/SLM.webp", "Canelas": "/crests/CAN.webp", "Marselha FC": "/crests/MAR.webp",
  "Nordeste FC": "/crests/NOR.webp", "Racha FC": "/crests/RAC.webp", "Puro Osso": "/crests/PUR.webp",
  "Kissassa": "/crests/KIS.webp", "Fortaleza": "/crests/FOR.webp", "Dragon Bola FC": "/crests/DRA.webp",
  // Série B
  "Ousadia FC": "/crests/OUS.webp", "A.E. Dallas": "/crests/DAL.webp", "Quebrada F.C": "/crests/QUE.webp",
  "Villa City": "/crests/VIL.webp", "Tigres": "/crests/TIG.webp", "FORZA F.C": "/crests/FRZ.webp",
  "Benfica": "/crests/BEN.webp", "PH FC": "/crests/PHF.webp", "Lanús": "/crests/LAN.webp",
  "Nação NH": "/crests/NNH.webp",
  // Série A (Kings League Brasil)
  "Furia FC": "/crests/FUR.webp", "G3X FC": "/crests/G3X.webp", "Fluxo FC": "/crests/FLX.webp",
  "Nyvelados FC": "/crests/NYV.webp", "DesimpaiN": "/crests/DES.webp", "Podpah Funkbol Clube": "/crests/POD.webp",
  "Dibrados FC": "/crests/DIB.webp", "Dendele FC": "/crests/DEN.webp", "Capim FC": "/crests/CAP.webp",
  "LOUD SC": "/crests/LOU.webp",
};

// Hex real por classe Tailwind usada em COR (paleta padrão v3) — pro SVG da
// camisa (Marco: patrocínio de uniforme, jul/2026), que precisa de cor de
// verdade, não classe utilitária.
const TAILWIND_HEX = {
  "bg-blue-600": "#2563eb", "bg-blue-700": "#1d4ed8",
  "bg-violet-600": "#7c3aed", "bg-violet-700": "#6d28d9",
  "bg-sky-600": "#0284c7", "bg-sky-700": "#0369a1",
  "bg-red-600": "#dc2626", "bg-red-700": "#b91c1c",
  "bg-orange-600": "#ea580c", "bg-orange-700": "#c2410c",
  "bg-cyan-600": "#0891b2", "bg-cyan-700": "#0e7490",
  "bg-rose-600": "#e11d48", "bg-rose-700": "#be123c",
  "bg-emerald-600": "#059669", "bg-emerald-700": "#047857",
  "bg-slate-500": "#64748b", "bg-slate-700": "#334155",
  "bg-fuchsia-600": "#c026d3", "bg-fuchsia-700": "#a21caf",
  "bg-indigo-600": "#4f46e5", "bg-indigo-700": "#4338ca",
  "bg-amber-600": "#d97706", "bg-amber-700": "#b45309",
  "bg-stone-500": "#78716c",
  "bg-teal-600": "#0d9488",
  "bg-yellow-600": "#ca8a04",
  "bg-lime-600": "#65a30d",
  "bg-purple-600": "#9333ea",
  "bg-pink-600": "#db2777",
  "bg-gray-600": "#4b5563",
  "bg-green-600": "#16a34a",
};

export const COR = {
  // Série C
  "Real União": "bg-blue-600", "Real Elite": "bg-violet-600", "Sereno FC": "bg-sky-600",
  "Sem Limites": "bg-red-600", "Canelas": "bg-orange-600", "Marselha FC": "bg-cyan-600",
  "Nordeste FC": "bg-rose-600", "Racha FC": "bg-emerald-600", "Puro Osso": "bg-slate-500",
  "Kissassa": "bg-fuchsia-600", "Fortaleza": "bg-indigo-600", "Dragon Bola FC": "bg-amber-600",
  // Série B
  "Ousadia FC": "bg-red-700", "A.E. Dallas": "bg-blue-700", "Quebrada F.C": "bg-stone-500",
  "Villa City": "bg-teal-600", "Tigres": "bg-yellow-600", "FORZA F.C": "bg-lime-600",
  "Benfica": "bg-rose-700", "PH FC": "bg-purple-600", "Lanús": "bg-pink-600",
  "Nação NH": "bg-gray-600",
  // Série A
  "Furia FC": "bg-green-600", "G3X FC": "bg-sky-700", "Fluxo FC": "bg-cyan-700",
  "Nyvelados FC": "bg-orange-700", "DesimpaiN": "bg-violet-700", "Podpah Funkbol Clube": "bg-amber-700",
  "Dibrados FC": "bg-emerald-700", "Dendele FC": "bg-fuchsia-700", "Capim FC": "bg-indigo-700",
  "LOUD SC": "bg-slate-700",
};

// Cor hex de verdade por time, derivada de COR — pro SVG da camisa.
export const COR_HEX = Object.fromEntries(
  Object.entries(COR).map(([time, classe]) => [time, TAILWIND_HEX[classe] || "#39424E"]),
);
