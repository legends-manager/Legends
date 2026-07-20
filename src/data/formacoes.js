// src/data/formacoes.js
// Formações táticas (pedido do Felyp, jul/2026): shape dos 6 jogadores de
// linha por posição real (DEF/MEI/ATA) — o goleiro é sempre 1, fora da
// formação. Soma de cada formação é sempre 6, pra caber nos 7 titulares
// (regra travada: 1 GOL + 6 de linha).
export const FORMACOES = {
  "2-3-1": { DEF: 2, MEI: 3, ATA: 1 },
  "3-2-1": { DEF: 3, MEI: 2, ATA: 1 },
  "1-4-1": { DEF: 1, MEI: 4, ATA: 1 },
  "2-2-2": { DEF: 2, MEI: 2, ATA: 2 },
  "3-1-2": { DEF: 3, MEI: 1, ATA: 2 },
  "1-3-2": { DEF: 1, MEI: 3, ATA: 2 },
};

export const ORDEM_FORMACOES = Object.keys(FORMACOES);
export const FORMACAO_PADRAO = "2-3-1";

export function formacaoValida(id) {
  return Boolean(FORMACOES[id]);
}
