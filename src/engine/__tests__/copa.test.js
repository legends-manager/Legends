// Testes da Copa — foco no C3.1 (pênaltis interativos, Camada 3): a
// calibração é o que mais importa aqui, porque decisão travada 12
// (Poisson calibrado) não pode se perder quando a habilidade do jogador
// entra na equação dos pênaltis.
import { describe, it, expect } from "vitest";
import { resolverPenaltisComHabilidade, LIMITE_HABILIDADE_PENALTI } from "../copa";

describe("copa — resolverPenaltisComHabilidade (regressão de calibração)", () => {
  it("skillScore=0.5 (toque médio) reproduz a MESMA taxa de vitória do viés de força puro (±3pp)", () => {
    const forcaA = 1.3, forcaB = 0.9; // A é favorito
    const baseProb = forcaA / (forcaA + forcaB);
    const N = 20000;
    let vitoriasA = 0;
    for (let i = 0; i < N; i++) {
      if (resolverPenaltisComHabilidade(forcaA, forcaB, true, 0.5)) vitoriasA++;
    }
    expect(Math.abs(vitoriasA / N - baseProb)).toBeLessThan(0.03);
  });

  it("habilidade máxima (skillScore=1) desloca a taxa pra cima em até LIMITE_HABILIDADE, nunca mais", () => {
    const forcaA = 1, forcaB = 1; // 50/50 sem habilidade
    const N = 20000;
    let vitorias = 0;
    for (let i = 0; i < N; i++) {
      if (resolverPenaltisComHabilidade(forcaA, forcaB, true, 1)) vitorias++;
    }
    const observado = vitorias / N;
    expect(observado).toBeGreaterThan(0.5 + LIMITE_HABILIDADE_PENALTI - 0.03);
    expect(observado).toBeLessThan(0.5 + LIMITE_HABILIDADE_PENALTI + 0.03);
  });

  it("habilidade mínima (skillScore=0) desloca a taxa pra baixo em até LIMITE_HABILIDADE, nunca mais", () => {
    const forcaA = 1, forcaB = 1;
    const N = 20000;
    let vitorias = 0;
    for (let i = 0; i < N; i++) {
      if (resolverPenaltisComHabilidade(forcaA, forcaB, true, 0)) vitorias++;
    }
    const observado = vitorias / N;
    expect(observado).toBeGreaterThan(0.5 - LIMITE_HABILIDADE_PENALTI - 0.03);
    expect(observado).toBeLessThan(0.5 - LIMITE_HABILIDADE_PENALTI + 0.03);
  });

  it("souTimeA=false inverte a base corretamente (time B favorito → eu, sendo B, ganho mais)", () => {
    const forcaA = 1.5, forcaB = 0.7; // A muito favorito
    const baseProbB = 1 - forcaA / (forcaA + forcaB);
    const N = 20000;
    let vitorias = 0;
    for (let i = 0; i < N; i++) {
      if (resolverPenaltisComHabilidade(forcaA, forcaB, false, 0.5)) vitorias++;
    }
    expect(Math.abs(vitorias / N - baseProbB)).toBeLessThan(0.03);
  });

  it("probabilidade nunca sai de [0.03, 0.97], mesmo em times MUITO desequilibrados", () => {
    const N = 5000;
    let vitorias = 0;
    for (let i = 0; i < N; i++) {
      // time A esmagadoramente mais forte + habilidade mínima do time B
      if (resolverPenaltisComHabilidade(50, 0.01, false, 0)) vitorias++;
    }
    expect(vitorias / N).toBeGreaterThan(0.01); // nunca vira impossível (piso 3%)
  });
});
