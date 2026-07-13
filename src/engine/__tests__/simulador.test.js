// Requisito 11 (Etapa A / PLANO_CORRECOES_AUDITORIA.md): pontuação, empates,
// vitórias e bônus permanecem iguais às regras atuais. Testa a regra de
// pontuação do motor (3 pontos por vitória, 1 por empate, sem gols
// aleatórios envolvidos — Poisson não entra aqui) de forma determinística.
import { describe, it, expect } from "vitest";
import { aplicarResultado } from "../simulador";

function estadoVazio(casa, fora) {
  return {
    tabela: {
      [casa]: { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 },
      [fora]: { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 },
    },
    fase: { [casa]: 1, [fora]: 1 },
    art: {},
  };
}

describe("aplicarResultado — regra de pontuação (Fut7, Legends Manager)", () => {
  it("vitória em casa: 3 pontos pro vencedor, 0 pro perdedor, sem empate contabilizado", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 3, 1, []);
    expect(estado.tabela["Nação NH"]).toMatchObject({ P: 3, V: 1, E: 0, D: 0, J: 1, GP: 3, GC: 1 });
    expect(estado.tabela["Real União"]).toMatchObject({ P: 0, V: 0, E: 0, D: 1, J: 1, GP: 1, GC: 3 });
  });

  it("vitória fora de casa: 3 pontos pro visitante, 0 pro mandante", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 1, 2, []);
    expect(estado.tabela["Real União"]).toMatchObject({ P: 3, V: 1, D: 0 });
    expect(estado.tabela["Nação NH"]).toMatchObject({ P: 0, V: 0, D: 1 });
  });

  it("empate: 1 ponto para os dois times, nenhum V/D", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 2, 2, []);
    expect(estado.tabela["Nação NH"]).toMatchObject({ P: 1, V: 0, E: 1, D: 0 });
    expect(estado.tabela["Real União"]).toMatchObject({ P: 1, V: 0, E: 1, D: 0 });
  });

  it("goleada 0x0 conta como empate (1 ponto pra cada), não como derrota dupla", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 0, 0, []);
    expect(estado.tabela["Nação NH"].P).toBe(1);
    expect(estado.tabela["Real União"].P).toBe(1);
  });

  it("acumula pontos corretamente ao longo de várias rodadas (3 vitórias seguidas = 9 pontos)", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 2, 0, []);
    aplicarResultado(estado, "Nação NH", "Real União", 1, 0, []);
    aplicarResultado(estado, "Nação NH", "Real União", 3, 1, []);
    expect(estado.tabela["Nação NH"].P).toBe(9);
    expect(estado.tabela["Nação NH"].V).toBe(3);
    expect(estado.tabela["Nação NH"].J).toBe(3);
  });

  it("fase do vencedor sobe (máx. 1.08) e do perdedor desce (mín. 0.92)", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    aplicarResultado(estado, "Nação NH", "Real União", 2, 0, []);
    expect(estado.fase["Nação NH"]).toBeCloseTo(1.04);
    expect(estado.fase["Real União"]).toBeCloseTo(0.96);
  });

  it("artilharia soma 1 gol por evento do tipo 'gol', ignora outros tipos de evento", () => {
    const estado = estadoVazio("Nação NH", "Real União");
    const autor = { id: "j1", nome: "Fulano", time: "Nação NH" };
    const ev = [
      { tipo: "gol", autor },
      { tipo: "chance", autor },
      { tipo: "gol", autor },
    ];
    aplicarResultado(estado, "Nação NH", "Real União", 2, 0, ev);
    expect(estado.art["j1"].g).toBe(2);
  });
});
