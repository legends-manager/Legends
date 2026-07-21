// src/engine/mundo.js
// Liga Viva (Marco 3.5, spec-liga-viva.md). Estado GLOBAL persistente (fora
// dos saves por-série): em qual série cada time está, histórico de acesso/
// rebaixamento, carreira do jogador, hall de campeões. Reverte a decisão
// "times voltam à série de origem" (multi-série puro) — agora a DIVISÃO
// persiste entre temporadas; elencos continuam reais e imutáveis (vêm sempre
// dos arquivos por NOME do time, via ELENCOS_GLOBAIS em data/series.js).
import { SERIES, ORDEM_SERIES, TODOS_OS_TIMES } from "../data/series";
import { classificar } from "./classificacao";

const QTD_ACESSO = 2; // ⚙️ 2 sobem / 2 descem por fronteira (§0, §3)

export function mundoInicial(meuTime) {
  const divisao = {};
  ORDEM_SERIES.forEach((s) => { SERIES[s].times.forEach((t) => { divisao[t] = s; }); });
  return {
    temporada: 1,
    divisao,
    meuTime,
    carreira: [],
    historicoAcesso: [],
    hallCampeoes: [],
    // Recordes históricos do mundo (dica 2): só das séries que o jogador
    // disputa (as simuladas em segundo plano não geram eventos por jogador).
    recordes: {},
    // Álbum de Lendas (C2.3, PLANO_GAMEFEEL_AAA §5): ids de data/lendas.js já
    // puxados em algum pacotinho lendário, ao longo de TODA a carreira (não
    // reseta por temporada, diferente do prêmio em si — que dura só 1). Dá
    // uma razão de longo prazo pra abrir pacotinho ("faltam N pra completar").
    lendasObtidas: [],
  };
}

// Recorde de maior goleada: olha os jogos de uma rodada da série do jogador
// (diferença de gols; empate de diferença → mais gols no total vence). Muta
// mundo.recordes in-place; mundo antigo sem `recordes` ganha o campo aqui.
export function atualizarRecordeGoleada(mundo, jogos, temporada, serie) {
  mundo.recordes = mundo.recordes || {};
  jogos.forEach((x) => {
    const dif = Math.abs(x.gc - x.gf);
    if (dif === 0) return;
    const atual = mundo.recordes.maiorGoleada;
    const atualDif = atual ? Math.abs(atual.gc - atual.gf) : -1;
    const atualTotal = atual ? atual.gc + atual.gf : -1;
    if (dif > atualDif || (dif === atualDif && x.gc + x.gf > atualTotal)) {
      mundo.recordes.maiorGoleada = { casa: x.casa, fora: x.fora, gc: x.gc, gf: x.gf, temporada, serie };
    }
  });
}

// Recorde de artilheiro numa temporada: no fechamento, compara o artilheiro
// da série do jogador com o recorde histórico.
export function atualizarRecordeArtilheiro(mundo, art, temporada, serie) {
  mundo.recordes = mundo.recordes || {};
  const melhor = Object.values(art).sort((a, b) => b.g - a.g)[0];
  if (!melhor) return;
  const atual = mundo.recordes.artilheiroTemporada;
  if (!atual || melhor.g > atual.gols) {
    mundo.recordes.artilheiroTemporada = { nome: melhor.nome, time: melhor.time, gols: melhor.g, temporada, serie };
  }
}

// Times que estão HOJE numa série, segundo o mundo — não a composição
// original de SERIES[serieId].times (essa é só o ponto de partida, temporada
// 1). Ordem estável (segue TODOS_OS_TIMES), independente da ordem interna de
// mundo.divisao.
export function timesDaSerie(mundo, serieId) {
  return TODOS_OS_TIMES.filter((t) => mundo.divisao[t] === serieId);
}

// §3 — Calcula o fim de temporada a partir das 3 tabelas finais (uma por
// série, já com os times ATUAIS daquela série). Não muta nada — devolve, por
// série: campeão, classificação completa, quem sobe, quem desce, quem
// permanece. Série A não tem pra quem subir (topo); Série C não tem pra quem
// descer (base) — arrays vazios nesses casos, como a spec pede.
export function calcularAcessoRebaixamento(tabelasPorSerie) {
  const resultado = {};
  ORDEM_SERIES.forEach((s) => {
    const linhas = classificar(tabelasPorSerie[s]);
    const n = linhas.length;
    const sobem = s === "C" || s === "B" ? linhas.slice(0, QTD_ACESSO).map((l) => l.t) : [];
    const descem = s === "A" || s === "B" ? linhas.slice(n - QTD_ACESSO, n).map((l) => l.t) : [];
    const zonaEspecial = new Set([...sobem, ...descem]);
    const permanecem = linhas.filter((l) => !zonaEspecial.has(l.t)).map((l) => l.t);
    resultado[s] = { campeao: linhas[0].t, classificacao: linhas, sobem, descem, permanecem };
  });
  return resultado;
}

// Aplica o resultado calculado acima: atualiza divisao, historicoAcesso,
// hallCampeoes e carreira (posição do time do jogador na própria série).
// Muta `mundo` in-place (mesmo estilo do resto do motor) e devolve pra onde
// o time do jogador vai na temporada seguinte.
export function fecharTemporada(mundo, resultado, meuTime, minhaSerie) {
  const novaDivisao = { ...mundo.divisao };
  resultado.C.sobem.forEach((t) => { novaDivisao[t] = "B"; });
  resultado.B.sobem.forEach((t) => { novaDivisao[t] = "A"; });
  resultado.B.descem.forEach((t) => { novaDivisao[t] = "C"; });
  resultado.A.descem.forEach((t) => { novaDivisao[t] = "B"; });

  const minhaPosicao = resultado[minhaSerie].classificacao.findIndex((l) => l.t === meuTime) + 1;
  const meuResultado =
    resultado[minhaSerie].sobem.includes(meuTime) ? "subiu" :
    resultado[minhaSerie].descem.includes(meuTime) ? "desceu" : "manteve";

  mundo.divisao = novaDivisao;
  mundo.historicoAcesso = [
    ...mundo.historicoAcesso,
    {
      temporada: mundo.temporada,
      "C->B": resultado.C.sobem,
      "B->A": resultado.B.sobem,
      "B->C": resultado.B.descem,
      "A->B": resultado.A.descem,
    },
  ];
  mundo.hallCampeoes = [
    ...mundo.hallCampeoes,
    { temporada: mundo.temporada, A: resultado.A.campeao, B: resultado.B.campeao, C: resultado.C.campeao },
  ];
  mundo.carreira = [
    ...mundo.carreira,
    { temporada: mundo.temporada, serie: minhaSerie, time: meuTime, posicao: minhaPosicao, resultado: meuResultado },
  ];
  mundo.temporada += 1;

  return { serieDestino: novaDivisao[meuTime], resultado: meuResultado, minhaPosicao };
}
