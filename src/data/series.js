// src/data/series.js
// Registro das séries (Marco 3, spec-multi-serie.md §1, §2, §3) + Liga Viva
// (Marco 3.5, spec-liga-viva.md §2): "Os elencos vêm sempre dos arquivos
// reais por NOME do time — independem da série atual." Por isso ELENCOS_GLOBAIS
// é uma busca por nome cobrindo as três séries: um time promovido/rebaixado
// continua com o MESMO elenco real, só muda em qual série ele compete.
import { ELENCOS_REAIS, TIMES_SERIE_C } from "./elencos-reais";
import { ELENCOS_SERIE_B, TIMES_SERIE_B } from "./elencos-reais-serie-b";
import { ELENCOS_SERIE_A, TIMES_SERIE_A, PRESIDENTES_SERIE_A } from "./elencos-serie-a";

export const SERIES = {
  A: {
    id: "A",
    label: "Série A",
    // Kings League Brasil (provisória) — risco de IP assumido pelo Felyp
    // (ver CLAUDE.md/roadmap). Quando a Série A real da Legends existir,
    // estes times "sobem" pro Mundial de Clubes (roadmap, guardado por ora).
    times: TIMES_SERIE_A,
    elencos: ELENCOS_SERIE_A,
    presidentes: PRESIDENTES_SERIE_A,
    serieBonus: 12, // spec-multi-serie.md §3
    disponivel: true,
  },
  B: {
    id: "B",
    label: "Série B",
    times: TIMES_SERIE_B,
    elencos: ELENCOS_SERIE_B,
    serieBonus: 6,
    disponivel: true,
  },
  C: {
    id: "C",
    label: "Série C",
    times: TIMES_SERIE_C,
    elencos: ELENCOS_REAIS,
    serieBonus: 0,
    disponivel: true,
  },
};

export const ORDEM_SERIES = ["A", "B", "C"];
export const SERIE_PADRAO = "C";

// Busca de elenco real por NOME do time, independente de em qual série ele
// está jogando agora (Liga Viva, §2). Nomes não colidem entre séries.
export const ELENCOS_GLOBAIS = {
  ...SERIES.A.elencos,
  ...SERIES.B.elencos,
  ...SERIES.C.elencos,
};

// Série de ORIGEM de um time (onde seus dados reais moram) — não muda nunca,
// mesmo que ele suba/desça. Útil pra saber, por exemplo, se um time é "da
// Kings" independente de onde está competindo agora.
export const SERIE_ORIGEM = {};
ORDEM_SERIES.forEach((s) => { SERIES[s].times.forEach((t) => { SERIE_ORIGEM[t] = s; }); });

// Todos os 34 times do mundo (união das três séries), fonte da divisão
// inicial da Liga Viva.
export const TODOS_OS_TIMES = ORDEM_SERIES.flatMap((s) => SERIES[s].times);
