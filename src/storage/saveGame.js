// src/storage/saveGame.js
// -----------------------------------------------------------------------------
// Save/Continue (localStorage) — build-spec §8.
//
// - Chave única: legends-manager:save-v1
// - Auto-save ao fim de cada rodada (e no início da temporada), nunca dependendo
//   do usuário salvar.
// - Guarda o estado interno do motor (elencos com attrs sorteados + origem,
//   forças internas, fases, tabela, artilharia, calendário e rodada atual).
//   O novo sorteio de forças/atributos só acontece em nova temporada — aqui só
//   persistimos/reidratamos o que já foi sorteado.
// - localStorage indisponível (aba privada/quota): o app funciona sem save e
//   avisa uma vez (ver App).
// -----------------------------------------------------------------------------

export const SAVE_KEY = "legends-manager:save-v1";

// Testa se o localStorage está utilizável (pode lançar em aba privada/quota).
export function localStorageDisponivel() {
  try {
    const k = "__lm_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

// Serializa o estado da temporada. Retorna true se salvou, false se não deu.
export function salvarJogo({ nomeTecnico, timeEscolhido, S }) {
  if (!S || !localStorageDisponivel()) return false;
  const dados = {
    versao: 1,
    nomeTecnico,
    timeEscolhido,
    temporada: {
      rodadaAtual: S.rodada,
      calendario: S.calendario,
      tabela: S.tabela,
      artilharia: S.art,
      fases: S.fase,
      multiplicadoresInternos: S.mult,
    },
    elencos: S.elencos,
    ultimaAtualizacao: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(dados));
    return true;
  } catch (e) {
    return false;
  }
}

// Lê e valida o save. Retorna o objeto salvo ou null (sem save / inválido).
export function carregarSave() {
  if (!localStorageDisponivel()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.versao !== 1 || !d.temporada || !d.elencos || !d.timeEscolhido) return null;
    if (!d.temporada.calendario || !d.temporada.tabela) return null;
    return d;
  } catch (e) {
    return null;
  }
}

// Reidrata o estado interno do motor (S) a partir de um save válido.
export function reconstruirS(save) {
  return {
    elencos: save.elencos,
    mult: save.temporada.multiplicadoresInternos,
    fase: save.temporada.fases,
    tabela: save.temporada.tabela,
    art: save.temporada.artilharia,
    calendario: save.temporada.calendario,
    rodada: save.temporada.rodadaAtual,
  };
}

export function limparSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* nada a fazer */
  }
}
