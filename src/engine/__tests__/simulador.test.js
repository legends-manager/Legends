// Requisito 11 (Etapa A / PLANO_CORRECOES_AUDITORIA.md): pontuação, empates,
// vitórias e bônus permanecem iguais às regras atuais. Testa a regra de
// pontuação do motor (3 pontos por vitória, 1 por empate, sem gols
// aleatórios envolvidos — Poisson não entra aqui) de forma determinística.
import { describe, it, expect } from "vitest";
import { aplicarResultado, simMetade, golsDe } from "../simulador";

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

// Regressão de calibração pro Lance Decisivo (C3.2, PLANO_GAMEFEEL_AAA §4-C
// — "exige teste de regressão de média de gols antes de ligar"). O motor
// precisa continuar gerando a mesma média de gols/time (~3-4, decisão
// travada 12 do CLAUDE.md) mesmo quando o 2º tempo é simulado em dois
// pedaços (26-39 + 40-50) com um carve-out de lambda pro QTE — a regra
// "anti-inflação" do plano.
function elencoFicticio(n = 7) {
  const posicoes = ["GOL", "DEF", "DEF", "MEI", "MEI", "ATA", "ATA"];
  return Array.from({ length: n }, (_, i) => ({ id: `j${i}`, nome: `Jogador ${i}`, pos: posicoes[i % posicoes.length], attr: 65 }));
}
function estadoSimulacao(casa, fora) {
  return { mult: { [casa]: 1, [fora]: 1 }, fase: { [casa]: 1, [fora]: 1 } };
}

describe("simMetade — faixaOverride/reducaoAbsoluta (regressão de calibração do Lance Decisivo)", () => {
  it("faixaOverride ausente = comportamento idêntico ao de antes (fração de duração = 1)", () => {
    // Sanity check do refactor: sem os parâmetros novos, nada muda pra
    // quem já chama simMetade sem eles (todo o resto do motor).
    const S = estadoSimulacao("A", "B");
    const escA = elencoFicticio(), escB = elencoFicticio();
    const N = 3000;
    let totalPadrao = 0, totalExplicito = 0;
    for (let i = 0; i < N; i++) totalPadrao += golsDe(simMetade(S, "A", "B", escA, escB, 2), "A", 50);
    for (let i = 0; i < N; i++) totalExplicito += golsDe(simMetade(S, "A", "B", escA, escB, 2, {}, [26, 50]), "A", 50);
    const mediaPadrao = totalPadrao / N, mediaExplicito = totalExplicito / N;
    expect(Math.abs(mediaPadrao - mediaExplicito)).toBeLessThan(0.15);
  });

  it("dividir a metade em 2 pedaços (sem redução) preserva o total esperado de gols (Poisson é aditivo)", () => {
    const S = estadoSimulacao("A", "B");
    const escA = elencoFicticio(), escB = elencoFicticio();
    const N = 4000;
    let totalInteiro = 0, totalDividido = 0;
    for (let i = 0; i < N; i++) {
      totalInteiro += golsDe(simMetade(S, "A", "B", escA, escB, 2), "A", 50);
    }
    for (let i = 0; i < N; i++) {
      const parte1 = simMetade(S, "A", "B", escA, escB, 2, {}, [26, 39]);
      const parte2 = simMetade(S, "A", "B", escA, escB, 2, {}, [40, 50]);
      totalDividido += golsDe([...parte1, ...parte2], "A", 50);
    }
    const mediaInteiro = totalInteiro / N, mediaDividido = totalDividido / N;
    // Tolerância generosa (±0.15 gol) — são duas amostras Monte Carlo
    // independentes da mesma distribuição, não o mesmo cálculo determinístico.
    expect(Math.abs(mediaInteiro - mediaDividido)).toBeLessThan(0.15);
  });

  it("reducaoAbsoluta carve-out reduz a média de gols do time em ~exatamente o valor retirado", () => {
    const S = estadoSimulacao("A", "B");
    const escA = elencoFicticio(), escB = elencoFicticio();
    const N = 4000;
    const CARVE_OUT = 0.5; // valor esperado assumido do Lance Decisivo (⚙️)
    let semReducao = 0, comReducao = 0;
    for (let i = 0; i < N; i++) {
      semReducao += golsDe(simMetade(S, "A", "B", escA, escB, 2, {}, [40, 50]), "A", 50);
      comReducao += golsDe(simMetade(S, "A", "B", escA, escB, 2, { A: { reducaoAbsoluta: CARVE_OUT } }, [40, 50]), "A", 50);
    }
    const diferenca = semReducao / N - comReducao / N;
    // A regra anti-inflação promete: o que sai do Poisson (diferenca) mais o
    // valor esperado do QTE (CARVE_OUT, creditado à parte pela UI quando o
    // jogador acerta) devolve a média original — ou seja, `diferenca` deve
    // bater com CARVE_OUT dentro de uma tolerância Monte Carlo.
    expect(Math.abs(diferenca - CARVE_OUT)).toBeLessThan(0.15);
  });

  it("reducaoAbsoluta nunca deixa o lambda negativo (times fracos não ficam com Poisson negativo)", () => {
    const S = { mult: { A: 0.5, B: 1 }, fase: { A: 0.92, B: 1 } }; // A bem fraco
    const escA = elencoFicticio().map((j) => ({ ...j, attr: 45 })), escB = elencoFicticio();
    // reducaoAbsoluta gigante — maior que qualquer lambda plausível pro time fraco.
    const evs = simMetade(S, "A", "B", escA, escB, 2, { A: { reducaoAbsoluta: 99 } }, [40, 50]);
    expect(golsDe(evs, "A", 50)).toBe(0); // Math.max(0, ...) segura a base
  });
});
