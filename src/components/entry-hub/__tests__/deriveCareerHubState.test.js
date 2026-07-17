// Testes do seletor puro da Central da Carreira (Task 05.1H §16, itens
// 8-11): estado principal vs. decisão pendente derivado só de leitura —
// nenhum campo persistido, nenhuma escrita.
import { describe, it, expect } from "vitest";
import { deriveCareerHubState } from "../deriveCareerHubState";

const TIME = "Real União";
const RIVAL = "Sereno FC";

// S mínimo e determinístico com a mesma forma do motor real.
function fixtureS({ escolhidosCompletos = true, ofertas = [], janela = "fechada", rodada = 4 } = {}) {
  const elenco = [
    { id: 1, nome: "Paredão", pos: "GOL", attr: 74 },
    { id: 2, nome: "L2", pos: "LIN", attr: 70 },
    { id: 3, nome: "L3", pos: "LIN", attr: 69 },
    { id: 4, nome: "L4", pos: "LIN", attr: 68 },
    { id: 5, nome: "L5", pos: "LIN", attr: 67 },
    { id: 6, nome: "L6", pos: "LIN", attr: 66 },
    { id: 7, nome: "L7", pos: "LIN", attr: 65 },
    { id: 8, nome: "L8", pos: "LIN", attr: 64 },
  ];
  return {
    S: {
      serie: "C",
      rodada,
      calendario: Array.from({ length: 22 }, () => [{ casa: TIME, fora: RIVAL }]),
      tabela: {
        [TIME]: { P: 9, J: 4, V: 3, E: 0, D: 1, GP: 12, GC: 6 },
        [RIVAL]: { P: 12, J: 4, V: 4, E: 0, D: 0, GP: 15, GC: 4 },
      },
      elencos: { [TIME]: elenco, [RIVAL]: [] },
      orcamento: { [TIME]: 1180, [RIVAL]: 900 },
      mercado: { janela, janelaUsadaMeio: false, listados: [], historico: [], ofertas },
    },
    escolhidos: escolhidosCompletos ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5],
  };
}

describe("deriveCareerHubState", () => {
  it("retorna estado principal quando não há nenhuma pendência", () => {
    const { S, escolhidos } = fixtureS();
    const hub = deriveCareerHubState(S, TIME, escolhidos);
    expect(hub.estado).toBe("principal");
    expect(hub.pendencias).toEqual([]);
    // Resumo somente-leitura vindo das estruturas existentes.
    expect(hub.pontos).toBe(9);
    expect(hub.posicao).toBe(2); // atrás do rival com 12 pontos
    expect(hub.orcamento).toBe(1180);
    expect(hub.rodadaAtual).toBe(5);
    expect(hub.totalRodadas).toBe(22);
    expect(hub.destinoJogar).toBe("escalacao");
  });

  it("identifica escalação incompleta (mesma regra do escValida: 7 com 1 GOL)", () => {
    const { S, escolhidos } = fixtureS({ escolhidosCompletos: false });
    const hub = deriveCareerHubState(S, TIME, escolhidos);
    expect(hub.estado).toBe("pendente");
    expect(hub.pendencias).toHaveLength(1);
    expect(hub.pendencias[0]).toEqual({ tipo: "escalacao", faltam: 2, semGoleiro: false });
  });

  it("identifica ofertas de mercado existentes e resolve a ação pra tela do Mercado", () => {
    const { S, escolhidos } = fixtureS({
      janela: "meio",
      ofertas: [{ de: RIVAL, idJogador: 2, preco: 250 }],
    });
    const hub = deriveCareerHubState(S, TIME, escolhidos);
    expect(hub.estado).toBe("pendente");
    const oferta = hub.pendencias.find((p) => p.tipo === "oferta");
    expect(oferta).toEqual({ tipo: "oferta", quantidade: 1 });
    // Decisão travada (encerramento 05.1F): destino = tela existente do
    // Mercado via setTela("mercado") — nenhuma rota nova.
    expect(hub.destinoOferta).toBe("mercado");
    // Com janela aberta, o passo de jogo também é o mercado (semântica do
    // irJogar preservada).
    expect(hub.destinoJogar).toBe("mercado");
  });

  it("regra de combinação documentada: escalação e oferta coexistem, escalação primeiro", () => {
    // Janela fechada mas com ofertas residuais + escalação incompleta: os
    // dois cartões aparecem, escalação (bloqueante) antes da oferta.
    const { S, escolhidos } = fixtureS({
      escolhidosCompletos: false,
      ofertas: [{ de: RIVAL, idJogador: 2, preco: 250 }, { de: RIVAL, idJogador: 3, preco: 180 }],
    });
    const hub = deriveCareerHubState(S, TIME, escolhidos);
    expect(hub.estado).toBe("pendente");
    expect(hub.pendencias.map((p) => p.tipo)).toEqual(["escalacao", "oferta"]);
    expect(hub.pendencias[1].quantidade).toBe(2);
  });

  it("temporada encerrada: sem cobrança de escalação, CTA aponta pra tabela", () => {
    const { S, escolhidos } = fixtureS({ escolhidosCompletos: false, rodada: 22 });
    const hub = deriveCareerHubState(S, TIME, escolhidos);
    expect(hub.temporadaEncerrada).toBe(true);
    expect(hub.pendencias.find((p) => p.tipo === "escalacao")).toBeUndefined();
    expect(hub.destinoJogar).toBe("tabela");
    expect(hub.rodadaAtual).toBe(22); // nunca passa do total
  });

  it("é somente-leitura: não muta S nem escolhidos", () => {
    const { S, escolhidos } = fixtureS({ escolhidosCompletos: false, ofertas: [{ de: RIVAL, idJogador: 2, preco: 100 }] });
    const fotoS = JSON.parse(JSON.stringify(S));
    const fotoEsc = [...escolhidos];
    deriveCareerHubState(S, TIME, escolhidos);
    expect(S).toEqual(fotoS);
    expect(escolhidos).toEqual(fotoEsc);
  });
});
