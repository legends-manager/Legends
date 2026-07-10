// src/storage/saveGame.js
// -----------------------------------------------------------------------------
// Save/Continue (localStorage) — build-spec §8 + spec-mercado.md §7 (save v2)
// + spec-multi-serie.md §1 (save por série).
//
// - Chave por série: legends-manager:save-v2:<serie> (A/B/C). O save antigo
//   de chave única (legends-manager:save-v1, sempre Série C) é migrado pra
//   chave da C na primeira leitura, sem perder a temporada em andamento.
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
//   torcida/formaRecente/comentariosTorcida (spec-marco2-polish.md §3) —
//   apresentação pura, nunca lida por fórmula de motor.
// - Save v1 (sem orcamento/mercado) migra ao carregar: orcamento L$1000,
//   valor = curva §3.2 sobre o attr salvo, timeOrigem = time atual, mercado
//   fechado com janelaUsadaMeio = (rodadaAtual > 11) — sem quebrar a
//   temporada em andamento.
// - localStorage indisponível (aba privada/quota): o app funciona sem save e
//   avisa uma vez (ver App).
// + spec-liga-viva.md §7 (Marco 3.5): mundo GLOBAL (legends-manager:mundo-v1)
//   guarda em qual série cada time está, carreira e hall de campeões —
//   separado dos saves por-série, que continuam guardando só a temporada em
//   andamento. Migração automática de quem já tinha save sem mundo.
// -----------------------------------------------------------------------------

import { valorInicial, orcamentosIniciais, mercadoInicial } from "../engine/mercado";
import { torcidaInicial } from "../engine/torcida";
import { mundoInicial } from "../engine/mundo";
import { SERIE_PADRAO, ORDEM_SERIES } from "../data/series";

// Marco 3 (spec-multi-serie.md §1): save POR SÉRIE — temporadas de séries
// diferentes nunca se misturam.
export const SAVE_KEY_LEGADO = "legends-manager:save-v1"; // era só a Série C
export const chaveSave = (serie) => `legends-manager:save-v2:${serie}`;

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

// Serializa o estado da temporada (save v2). A chave vem da série do próprio
// S (S.serie). Retorna true se salvou, false se não deu.
export function salvarJogo({ nomeTecnico, timeEscolhido, avatarId, S }) {
  if (!S || !localStorageDisponivel()) return false;
  const dados = {
    versao: 2,
    serie: S.serie || SERIE_PADRAO,
    nomeTecnico,
    timeEscolhido,
    // Avatar do técnico (spec-marco2-polish.md §5): id da galeria fixa
    // (/public/avatars/aXX.png) ou null — save antigo sem o campo cai no
    // fallback de iniciais, sem migração especial necessária.
    avatarId: avatarId ?? null,
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
    torcida: S.torcida,
    torcidaRef: S.torcidaRef,
    formaRecente: S.formaRecente,
    comentariosTorcida: S.comentariosTorcida,
    ultimaAtualizacao: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(chaveSave(dados.serie), JSON.stringify(dados));
    return true;
  } catch (e) {
    return false;
  }
}

const validarSave = (raw) => {
  if (!raw) return null;
  const d = JSON.parse(raw);
  if (!d || (d.versao !== 1 && d.versao !== 2) || !d.temporada || !d.elencos || !d.timeEscolhido) return null;
  if (!d.temporada.calendario || !d.temporada.tabela) return null;
  return d;
};

// Lê e valida o save da série pedida. Aceita v1 (pré-Marco 2) e v2.
// Migração multi-série: o save antigo (chave única, sempre Série C) é movido
// pra chave da Série C na primeira leitura — a temporada em andamento não se
// perde. Retorna o objeto salvo ou null (sem save / inválido).
export function carregarSave(serie = SERIE_PADRAO) {
  if (!localStorageDisponivel()) return null;
  try {
    const raw = window.localStorage.getItem(chaveSave(serie));
    if (raw) return validarSave(raw);
    if (serie === "C") {
      const legado = window.localStorage.getItem(SAVE_KEY_LEGADO);
      const d = validarSave(legado);
      if (d) {
        d.serie = "C";
        window.localStorage.setItem(chaveSave("C"), JSON.stringify(d));
        window.localStorage.removeItem(SAVE_KEY_LEGADO);
        return d;
      }
    }
    return null;
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
    elencos[t] = save.elencos[t].map((j) => {
      const jogador = { valor: valorInicial(j.attr), timeOrigem: t, ...j };
      // Setinha ▲▼ (spec-marco2-polish.md §1): save sem valorRef ainda —
      // nasce igual ao valor atual, seta começa neutra.
      if (jogador.valorRef == null) jogador.valorRef = jogador.valor;
      return jogador;
    });
  });
  return {
    serie: save.serie || SERIE_PADRAO, // saves antigos são sempre da Série C
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
    // Metade derivada do calendário salvo (genérico: 11 na Série C de 22
    // rodadas), nada fixado em 11.
    mercado: save.mercado
      ? { ...save.mercado, ofertas: [] }
      : { ...mercadoInicial(), janelaUsadaMeio: save.temporada.rodadaAtual > save.temporada.calendario.length / 2 },
    // Torcida (spec-marco2-polish.md §3): save antigo sem o campo inicializa
    // 500 pra todos os times, sem forma/comentários acumulados. torcidaRef
    // ausente (save anterior à setinha) nasce igual à torcida atual — seta
    // começa neutra em vez de comparar contra um valor inexistente.
    torcida: save.torcida || torcidaInicial(times),
    torcidaRef: save.torcidaRef || save.torcida || torcidaInicial(times),
    formaRecente: save.formaRecente || {},
    comentariosTorcida: save.comentariosTorcida || [],
  };
}

export function limparSave(serie = SERIE_PADRAO) {
  try {
    window.localStorage.removeItem(chaveSave(serie));
  } catch (e) {
    /* nada a fazer */
  }
}

// ---------------- Mundo (Liga Viva — Marco 3.5, spec-liga-viva.md §7) ----------------
// Estado GLOBAL (não por-série): em qual série cada time está, carreira do
// jogador, histórico de acesso/rebaixamento, hall de campeões.
export const CHAVE_MUNDO = "legends-manager:mundo-v1";

export function salvarMundo(mundo) {
  if (!mundo || !localStorageDisponivel()) return false;
  try {
    window.localStorage.setItem(CHAVE_MUNDO, JSON.stringify(mundo));
    return true;
  } catch (e) {
    return false;
  }
}

export function carregarMundo() {
  if (!localStorageDisponivel()) return null;
  try {
    const raw = window.localStorage.getItem(CHAVE_MUNDO);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !d.divisao || !d.meuTime || typeof d.temporada !== "number") return null;
    return d;
  } catch (e) {
    return null;
  }
}

// "Novo jogo" em modo carreira: reseta o mundo E os saves por série (uma
// carreira nova começa do zero em tudo).
export function limparMundo() {
  try {
    window.localStorage.removeItem(CHAVE_MUNDO);
  } catch (e) {
    /* nada a fazer */
  }
  ORDEM_SERIES.forEach((s) => limparSave(s));
}

// Migração (§7): jogador vindo do multi-série puro (Marco 3, sem Liga Viva)
// tem save por série mas nenhum mundo ainda — cria o mundo na temporada 1
// com o time/série do save em andamento, sem perder essa temporada. Se já
// existe mundo, ou não existe save nenhum, não faz nada.
export function migrarParaMundoSeNecessario() {
  const existente = carregarMundo();
  if (existente) return existente;
  for (const serie of ORDEM_SERIES) {
    const save = carregarSave(serie);
    if (save) {
      const mundo = mundoInicial(save.timeEscolhido);
      mundo.divisao[save.timeEscolhido] = serie;
      salvarMundo(mundo);
      return mundo;
    }
  }
  return null;
}
