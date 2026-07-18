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
// "escudos reais" do backlog do CLAUDE.md só pra Série B/C, cujas artes ele
// enviou em art/serie b e art/serie c). Só entram aqui os times com arquivo
// de verdade; quem não tem (Série A, por enquanto) cai pro crachá de sigla
// via fallback do componente Crest — nunca quebra.
export const CRESTS = {
  // Série C
  "Real União": "/crests/RUN.jpeg", "Real Elite": "/crests/RLE.jpeg", "Sereno FC": "/crests/SER.jpeg",
  "Sem Limites": "/crests/SLM.jpeg", "Canelas": "/crests/CAN.jpeg", "Marselha FC": "/crests/MAR.jpeg",
  "Nordeste FC": "/crests/NOR.jpeg", "Racha FC": "/crests/RAC.jpeg", "Puro Osso": "/crests/PUR.jpeg",
  "Kissassa": "/crests/KIS.jpeg", "Fortaleza": "/crests/FOR.jpeg", "Dragon Bola FC": "/crests/DRA.jpeg",
  // Série B
  "Ousadia FC": "/crests/OUS.jpeg", "A.E. Dallas": "/crests/DAL.jpeg", "Quebrada F.C": "/crests/QUE.jpeg",
  "Villa City": "/crests/VIL.jpeg", "Tigres": "/crests/TIG.jpeg", "FORZA F.C": "/crests/FRZ.jpeg",
  "Benfica": "/crests/BEN.png", "PH FC": "/crests/PHF.jpeg", "Lanús": "/crests/LAN.jpeg",
  "Nação NH": "/crests/NNH.jpeg",
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
