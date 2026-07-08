// src/storage/saveGame.js
// -----------------------------------------------------------------------------
// Save/Continue (localStorage) — build-spec §8 + spec-mercado.md §7 (save v2).
//
// - Chave única: legends-manager:save-v1 (nome mantido; quem versiona é o
//   campo `versao` dentro do JSON — v2 escreve por cima do mesmo slot).
// - Auto-save ao fim de cada rodada e ao fechar cada janela de mercado, nunca
//   dependendo do usuário salvar.
// - v2 guarda, além do estado v1 (elencos com attrs sorteados + origem,
//   forças internas, fases, tabela, artilharia, calendário e rodada atual):
//   orcamento por time (persiste entre temporadas) e o estado do mercado
//   (janela, janelaUsadaMeio, listados, historico — schema da spec §2).
//   `valor`/`timeOrigem` já vêm dentro de cada jogador em `elencos`, nada
//   especial a fazer pra persisti-los.
//   `mercado.ofertas` (propostas de IA) NÃO é persistido — não está no schema
//   oficial (§2) e é regenerado a cada abertura de janela; um reload no meio
//   de uma janela aberta perde só as ofertas pendentes, não listagens/compras.
// - Save v1 (sem orcamento/mercado) migra ao carregar: orcamento L$1000,
//   valor = curva §3.2 sobre o attr salvo, timeOrigem = time atual, mercado
//   fechado com janelaUsadaMeio = (rodadaAtual > 11) — sem quebrar a
//   temporada em andamento.
// - localStorage indisponível (aba privada/quota): o app funciona sem save e
//   avisa uma vez (ver App).
// -----------------------------------------------------------------------------

import { valorInicial, orcamentosIniciais, mercadoInicial } from "../engine/mercado";

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

// Serializa o estado da temporada (save v2). Retorna true se salvou, false se não deu.
export function salvarJogo({ nomeTecnico, timeEscolhido, S }) {
  if (!S || !localStorageDisponivel()) return false;
  const dados = {
    versao: 2,
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
    orcamento: S.orcamento,
    mercado: {
      janela: S.mercado.janela,
      janelaUsadaMeio: S.mercado.janelaUsadaMeio,
      listados: S.mercado.listados,
      historico: S.mercado.historico,
    },
    ultimaAtualizacao: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(dados));
    return true;
  } catch (e) {
    return false;
  }
}

// Lê e valida o save. Aceita v1 (pré-Marco 2) e v2. Retorna o objeto salvo ou
// null (sem save / inválido).
export function carregarSave() {
  if (!localStorageDisponivel()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || (d.versao !== 1 && d.versao !== 2) || !d.temporada || !d.elencos || !d.timeEscolhido) return null;
    if (!d.temporada.calendario || !d.temporada.tabela) return null;
    return d;
  } catch (e) {
    return null;
  }
}

// Reidrata o estado interno do motor (S) a partir de um save válido (v1 ou v2).
// Saves v1 não têm orcamento/valor/timeOrigem/mercado — os defaults abaixo
// migram pros valores da spec-mercado.md §7 sem quebrar a temporada em andamento.
// `valor` usa a curva (§3.2) sobre o `attr` já salvo, não mais um piso fixo —
// consistente com como um jogador novo é precificado.
export function reconstruirS(save) {
  const times = Object.keys(save.elencos);
  const elencos = {};
  times.forEach((t) => {
    elencos[t] = save.elencos[t].map((j) => ({
      valor: valorInicial(j.attr),
      timeOrigem: t,
      ...j,
    }));
  });
  return {
    elencos,
    mult: save.temporada.multiplicadoresInternos,
    fase: save.temporada.fases,
    tabela: save.temporada.tabela,
    art: save.temporada.artilharia,
    calendario: save.temporada.calendario,
    rodada: save.temporada.rodadaAtual,
    orcamento: save.orcamento || orcamentosIniciais(times),
    // `ofertas` nunca é persistido (ver cabeçalho) — sempre começa vazio,
    // mesmo reidratando um save v2 recente.
    mercado: save.mercado
      ? { ...save.mercado, ofertas: [] }
      : { ...mercadoInicial(), janelaUsadaMeio: save.temporada.rodadaAtual > 11 },
  };
}

export function limparSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* nada a fazer */
  }
}
