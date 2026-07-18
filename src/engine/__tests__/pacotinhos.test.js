// Testes do motor de Pacotinhos (Fase 3 item 9): distribuição de raridade,
// geração de prospecto dentro da faixa, e sorteio de lenda fictícia (nunca
// nome real — trava do CLAUDE.md preservada por construção, já que LENDAS
// só contém personagens inventados).
import { describe, it, expect } from "vitest";
import { sortearRaridade, abrirPacotinho, RARIDADES, RARIDADE_LABEL } from "../pacotinhos";
import { LENDAS } from "../../data/lendas";

describe("pacotinhos — sortearRaridade", () => {
  it("respeita os pesos: rng baixo cai em comum, rng alto em lendário", () => {
    expect(sortearRaridade(() => 0)).toBe("comum");
    expect(sortearRaridade(() => 0.99999)).toBe("lendario");
  });

  it("distribuição aproximada em amostra grande bate com os pesos declarados (±3pp)", () => {
    const N = 20000;
    const contagem = { comum: 0, raro: 0, epico: 0, lendario: 0 };
    for (let i = 0; i < N; i++) contagem[sortearRaridade()]++;
    RARIDADES.forEach((r) => {
      const observado = contagem[r.id] / N;
      expect(Math.abs(observado - r.peso)).toBeLessThan(0.03);
    });
  });
});

describe("pacotinhos — abrirPacotinho", () => {
  it("comum/raro/épico geram prospecto com attr dentro da faixa e nome preenchido", () => {
    // Ponto médio da fatia acumulada de cada raridade nos pesos declarados
    // (comum [0,.70) · raro [.70,.90) · épico [.90,.98) · lendário [.98,1)) —
    // mesmo rng constante alimenta as chamadas seguintes (attr/posição),
    // sempre dentro da faixa por construção da fórmula.
    const rngPorRaridade = { comum: 0.35, raro: 0.80, epico: 0.94 };
    RARIDADES.filter((r) => r.faixaAttr).forEach((r) => {
      const { raridade, jogador } = abrirPacotinho(() => rngPorRaridade[r.id]);
      expect(raridade).toBe(r.id);
      expect(jogador.attr).toBeGreaterThanOrEqual(r.faixaAttr[0]);
      expect(jogador.attr).toBeLessThanOrEqual(r.faixaAttr[1]);
      expect(jogador.nome).toBeTruthy();
      expect(["GOL", "DEF", "MEI", "ATA"]).toContain(jogador.pos);
      expect(jogador.origem).toBe("pacotinho");
      expect(jogador.valor).toBeGreaterThan(0);
    });
  });

  it("lendário sempre vem de LENDAS (nunca nome real de jogador famoso)", () => {
    const { raridade, jogador } = abrirPacotinho(() => 0.999);
    expect(raridade).toBe("lendario");
    expect(LENDAS.some((l) => l.id === jogador.id.replace(/^pacotinho-lendario-/, "").replace(/-\d+$/, ""))).toBe(true);
    expect(jogador.bio).toBeTruthy();
    expect(jogador.attr).toBeGreaterThanOrEqual(90);
    expect(jogador.valor).toBeGreaterThan(0);
    expect(jogador.valorRef).toBe(jogador.valor);
  });

  it("todo id de RARIDADE tem rótulo em português", () => {
    RARIDADES.forEach((r) => expect(RARIDADE_LABEL[r.id]).toBeTruthy());
  });
});

describe("lendas — sem nomes reais, todas com bio e posição válida", () => {
  it("todas as lendas têm bio rica e attr no topo da escala", () => {
    LENDAS.forEach((l) => {
      expect(l.bio.length).toBeGreaterThan(40);
      expect(l.attr).toBeGreaterThanOrEqual(90);
      expect(l.attr).toBeLessThanOrEqual(92);
      expect(["GOL", "DEF", "MEI", "ATA"]).toContain(l.pos);
    });
  });

  it("cobre as 4 posições (nenhuma raridade lendária fica sem opção pra alguma posição)", () => {
    const posicoes = new Set(LENDAS.map((l) => l.pos));
    expect(posicoes).toEqual(new Set(["GOL", "DEF", "MEI", "ATA"]));
  });
});
