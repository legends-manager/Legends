// src/data/times.js
// Metadados de exibição dos times (sigla + cor do avatar). São constantes de UI
// da demo — nada aqui é indicador de FORÇA de time (força é 100% interna).
import { TIMES_SERIE_C } from "./elencos-reais";

// Ordem oficial dos 12 times, reexportada como TIMES para uso na UI/motor.
export const TIMES = TIMES_SERIE_C;

export const SIGLA = {
  "Real União": "RUN", "Real Elite": "RLE", "Sereno FC": "SER", "Sem Limites": "SLM",
  "Canelas": "CAN", "Marselha FC": "MAR", "Nordeste FC": "NOR", "Racha FC": "RAC",
  "Puro Osso": "PUR", "Kissassa": "KIS", "Fortaleza": "FOR", "Dragon Bola FC": "DRA",
};

export const COR = {
  "Real União": "bg-blue-600", "Real Elite": "bg-violet-600", "Sereno FC": "bg-sky-600",
  "Sem Limites": "bg-red-600", "Canelas": "bg-orange-600", "Marselha FC": "bg-cyan-600",
  "Nordeste FC": "bg-rose-600", "Racha FC": "bg-emerald-600", "Puro Osso": "bg-slate-500",
  "Kissassa": "bg-fuchsia-600", "Fortaleza": "bg-indigo-600", "Dragon Bola FC": "bg-amber-600",
};
