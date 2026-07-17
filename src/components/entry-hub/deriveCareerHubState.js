// Seletor PURO e somente-leitura do estado visual da Central da Carreira
// (Task 05.1H, estados 6 e 7 da família congelada). Deriva "principal" vs.
// "decisão pendente" NO MOMENTO DO RENDER, a partir de dados que já existem
// no motor — nenhum campo novo é persistido, nenhum status "pendente" é
// escrito em lugar nenhum (§10, estado 7).
//
// REGRA DE PRECEDÊNCIA/COMBINAÇÃO (documentação exigida pela ordem):
// as pendências são cumulativas, não excludentes — quando escalação
// incompleta E oferta coexistem, AMBOS os cartões aparecem, na ordem:
//   1º escalação incompleta (bloqueia a próxima rodada — mais urgente);
//   2º oferta recebida (oportunidade com prazo, não bloqueia).
// O estado é "pendente" se existir QUALQUER pendência; "principal" senão.
//
// Fontes (todas já existentes, só leitura):
//  - escalação: S.elencos[meuTime] × escolhidos (mesma regra do escValida
//    do App.jsx: 7 jogadores, exatamente 1 GOL);
//  - ofertas: S.mercado.ofertas (propostas de IA pro humano — só existem
//    com janela aberta; expiram em fecharJanela);
//  - posição: engine/classificacao.js (posicaoNaTabela — regra oficial).
import { posicaoNaTabela } from "../../engine/classificacao";

export function deriveCareerHubState(S, meuTime, escolhidos) {
  const elenco = (S.elencos && S.elencos[meuTime]) || [];
  const ids = escolhidos || [];
  const selecionados = elenco.filter((j) => ids.includes(j.id));
  const goleiros = selecionados.filter((j) => j.pos === "GOL").length;
  const escalacaoValida = selecionados.length === 7 && goleiros === 1;

  const janelaAberta = !!(S.mercado && S.mercado.janela !== "fechada");
  const temporadaEncerrada = S.rodada >= S.calendario.length;
  const ofertas = (S.mercado && S.mercado.ofertas) || [];

  const pendencias = [];
  // Escalação só é cobrada quando é o próximo passo real do fluxo (temporada
  // em andamento e janela fechada — com janela aberta o passo é o Mercado,
  // e lá as ofertas já moram).
  if (!temporadaEncerrada && !janelaAberta && !escalacaoValida) {
    pendencias.push({
      tipo: "escalacao",
      faltam: Math.max(0, 7 - selecionados.length),
      semGoleiro: goleiros === 0,
    });
  }
  if (ofertas.length > 0) {
    pendencias.push({ tipo: "oferta", quantidade: ofertas.length });
  }

  // Destino do CTA de jogo — mesma semântica do irJogar existente (App.jsx):
  // janela aberta → mercado; temporada encerrada → tabela; senão → escalação.
  const destinoJogar = janelaAberta ? "mercado" : temporadaEncerrada ? "tabela" : "escalacao";
  // Decisão travada (encerramento da 05.1F): "Nova oferta recebida" navega
  // pra tela existente do Mercado — nenhuma rota nova.
  const destinoOferta = "mercado";

  const linha = (S.tabela && S.tabela[meuTime]) || null;
  return {
    estado: pendencias.length > 0 ? "pendente" : "principal",
    pendencias,
    destinoJogar,
    destinoOferta,
    posicao: linha ? posicaoNaTabela(S.tabela, meuTime) : null,
    pontos: linha ? linha.P : null,
    orcamento: S.orcamento && typeof S.orcamento[meuTime] === "number" ? S.orcamento[meuTime] : null,
    rodadaAtual: Math.min(S.rodada + 1, S.calendario.length),
    totalRodadas: S.calendario.length,
    temporadaEncerrada,
    janelaAberta,
  };
}
