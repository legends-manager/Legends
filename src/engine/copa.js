// src/engine/copa.js
// Copa cruzando as 3 séries — mata-mata puro, sorteio aleatório, 32 times
// (A=10 + B=10 + C=12 — chave perfeita, sem bye). Roda em PARALELO com o
// campeonato de pontos corridos: 1 fase avança a cada rodada de liga
// concluída, exceto quando o jogador tem confronto pendente na fase atual
// (aí a copa espera ele jogar). Times de fora da série do jogador vêm do
// estado paralelo já usado pela tabela ao vivo das 3 séries (S.outrasSeries)
// — a copa NÃO cria uma segunda economia pros outros 31 times; só o
// jogador ganha dinheiro nela (vitória e título), o resto é só resultado.
import { escalacaoIA, simMetade, golsDe } from "./simulador";

export const PREMIO_VITORIA_COPA = 80; // L$ ⚙️ — menor que a vitória de liga (150), pra não ofuscá-la
export const PREMIO_CAMPEAO_COPA = 500; // L$ ⚙️ — prêmio único ao ser campeão

const NOMES_FASE = ["16-avos de final", "Oitavas de final", "Quartas de final", "Semifinal", "Final"];
export const nomeFase = (indice) => NOMES_FASE[indice] || `Fase ${indice + 1}`;

// Sorteio inicial: embaralha os 32 times e forma os confrontos da 1ª fase.
export function iniciarCopa(todosOsTimes) {
  const embaralhados = [...todosOsTimes].sort(() => Math.random() - 0.5);
  const primeiraFase = [];
  for (let i = 0; i < embaralhados.length; i += 2) {
    primeiraFase.push({ a: embaralhados[i], b: embaralhados[i + 1], vencedor: null, placarA: null, placarB: null, penaltis: false });
  }
  return { fase: 0, chaves: [primeiraFase], campeao: null };
}

// Acha o "pool" (elencos/mult/fase) de um time — a série do jogador (S) ou
// uma das duas paralelas (S.outrasSeries). Todo time aparece em EXATAMENTE
// um pool a cada momento (a divisão pode mudar de temporada pra temporada,
// mas dentro de uma mesma temporada é estável).
export function poolDoTime(S, time) {
  if (S.elencos[time]) return S;
  for (const s of Object.keys(S.outrasSeries || {})) {
    if (S.outrasSeries[s].elencos[time]) return S.outrasSeries[s];
  }
  return null;
}

// Simula só o TEMPO NORMAL de 1 confronto (times de QUALQUER série, via
// poolDoTime) — não resolve pênaltis. Extraído de simularJogoCopa (abaixo)
// pra permitir a UI interativa de pênaltis (C3.1, Camada 3) rodar ENTRE a
// simulação do jogo e a decisão do vencedor, quando o confronto é do
// jogador: o tempo normal já é conhecido no momento em que a tela de
// pênaltis abre, só o desempate fica pendente. `forcaA`/`forcaB` vêm
// expostos porque são a base de calibração da cobrança interativa
// (ver resolverPenaltisComHabilidade).
export function simularTempoNormalCopa(S, timeA, timeB, escOverrideA = null, escOverrideB = null) {
  const poolA = poolDoTime(S, timeA), poolB = poolDoTime(S, timeB);
  const escA = escOverrideA || escalacaoIA(poolA.elencos[timeA]);
  const escB = escOverrideB || escalacaoIA(poolB.elencos[timeB]);
  const Slocal = {
    mult: { [timeA]: poolA.mult[timeA], [timeB]: poolB.mult[timeB] },
    fase: { [timeA]: poolA.fase[timeA], [timeB]: poolB.fase[timeB] },
  };
  const ev = [
    ...simMetade(Slocal, timeA, timeB, escA, escB, 1),
    ...simMetade(Slocal, timeA, timeB, escA, escB, 2),
  ];
  const placarA = golsDe(ev, timeA), placarB = golsDe(ev, timeB);
  const forcaA = poolA.mult[timeA] * poolA.fase[timeA];
  const forcaB = poolB.mult[timeB] * poolB.fase[timeB];
  return { placarA, placarB, ev, empatou: placarA === placarB, forcaA, forcaB };
}

// Simula 1 confronto inteiro, INCLUSIVE pênaltis (usado por IA×IA via
// avancarFaseCopa — comportamento 100% preservado, nunca mudou: viés de
// força interna + sorte, sem UI). O jogo do JOGADOR não passa mais por
// aqui quando empata — App.jsx usa simularTempoNormalCopa +
// resolverPenaltisComHabilidade pra abrir a cobrança interativa antes de
// decidir (C3.1).
export function simularJogoCopa(S, timeA, timeB, escOverrideA = null, escOverrideB = null) {
  const { placarA, placarB, ev, empatou, forcaA, forcaB } = simularTempoNormalCopa(S, timeA, timeB, escOverrideA, escOverrideB);
  let vencedor, penaltis = false;
  if (!empatou) {
    vencedor = placarA > placarB ? timeA : timeB;
  } else {
    penaltis = true;
    vencedor = Math.random() < forcaA / (forcaA + forcaB) ? timeA : timeB;
  }
  return { vencedor, placarA, placarB, penaltis, ev };
}

// Pênaltis interativos (C3.1, PLANO_GAMEFEEL_AAA §4-A — Camada 3, liberada
// por decisão explícita do Felyp: "habilidade do jogador pode influenciar
// o resultado da partida"). A probabilidade de vitória do time do JOGADOR
// continua ancorada no MESMO viés de força que decidia tudo sozinho antes
// (forcaA/(forcaA+forcaB)) — habilidade (skillScore, 0 a 1, vindo da
// precisão das cobranças interativas) desloca essa probabilidade em até
// ±LIMITE_HABILIDADE, nunca mais. skillScore=0.5 ("toque médio") reproduz
// EXATAMENTE a taxa de vitória antiga — é o que o teste de regressão
// confirma (1000 pênaltis com toque médio ≈ taxa de vitória do viés puro).
export const LIMITE_HABILIDADE_PENALTI = 0.12;

export function resolverPenaltisComHabilidade(forcaA, forcaB, souTimeA, skillScore, rng = Math.random) {
  const baseProb = forcaA / (forcaA + forcaB); // prob. de A vencer, sem habilidade nenhuma
  const probBase = souTimeA ? baseProb : 1 - baseProb;
  const ajuste = (Math.min(1, Math.max(0, skillScore)) - 0.5) * (LIMITE_HABILIDADE_PENALTI * 2);
  const probFinal = Math.min(0.97, Math.max(0.03, probBase + ajuste));
  return rng() < probFinal; // true = o time do JOGADOR venceu os pênaltis
}

// Resolve TODOS os confrontos pendentes da fase atual (menos os que já têm
// vencedor definido — ex. o jogo do próprio jogador, resolvido via UI antes
// de chamar isso) e monta a próxima fase. Se sobrar 1 só, vira campeão.
export function avancarFaseCopa(copa, S) {
  if (copa.campeao) return;
  const atual = copa.chaves[copa.fase];
  const vencedores = atual.map((c) => {
    if (c.vencedor) return c.vencedor;
    const r = simularJogoCopa(S, c.a, c.b);
    c.vencedor = r.vencedor; c.placarA = r.placarA; c.placarB = r.placarB; c.penaltis = r.penaltis;
    return r.vencedor;
  });
  if (vencedores.length === 1) { copa.campeao = vencedores[0]; return; }
  const proxima = [];
  for (let i = 0; i < vencedores.length; i += 2) {
    proxima.push({ a: vencedores[i], b: vencedores[i + 1], vencedor: null, placarA: null, placarB: null, penaltis: false });
  }
  copa.fase++;
  copa.chaves.push(proxima);
}

// Confronto pendente do jogador na fase atual (null se já decidido nesta
// fase, se ele já foi eliminado, ou se a copa já tem campeão).
export function confrontoPendenteDoJogador(copa, meuTime) {
  if (copa.campeao) return null;
  const atual = copa.chaves[copa.fase];
  return atual.find((c) => (c.a === meuTime || c.b === meuTime) && !c.vencedor) || null;
}

// O jogador já foi eliminado em alguma fase anterior (perdeu e não é mais
// campeão)? Percorre as chaves já resolvidas procurando ele como perdedor.
export function eliminadoDaCopa(copa, meuTime) {
  if (copa.campeao === meuTime) return false;
  for (const chave of copa.chaves) {
    const c = chave.find((x) => x.a === meuTime || x.b === meuTime);
    if (c && c.vencedor && c.vencedor !== meuTime) return true;
  }
  return false;
}

// Histórico do jogador na copa: uma linha por fase já disputada por ele
// (fase, adversário, placar, se venceu, se foi de pênaltis).
export function historicoDoJogador(copa, meuTime) {
  const linhas = [];
  copa.chaves.forEach((chave, i) => {
    const c = chave.find((x) => x.a === meuTime || x.b === meuTime);
    if (!c || !c.vencedor) return;
    const souA = c.a === meuTime;
    linhas.push({
      fase: nomeFase(i),
      adversario: souA ? c.b : c.a,
      placarMeu: souA ? c.placarA : c.placarB,
      placarAdv: souA ? c.placarB : c.placarA,
      venceu: c.vencedor === meuTime,
      penaltis: c.penaltis,
    });
  });
  return linhas;
}
