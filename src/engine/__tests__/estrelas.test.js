// Testes do mercado entre divisões (Fase 2 item 7): contratarEstrela —
// multiplicador por distância, persuasão, travas (1/janela, 1 tentativa por
// jogador, goleiro único, elenco curto) e a transferência em si.
import { describe, it, expect, beforeEach } from "vitest";
import { contratarEstrela, precoPedidoEstrela, distanciaSeries, mercadoInicial, fecharJanela } from "../mercado";

const jog = (id, pos, valor, time) => ({ id, nome: `J${id}`, pos, attr: 80, valor, time, g: 0, a: 0 });

function estadoBase() {
  const elencoA = [jog("gk1", "GOL", 300, "Furia FC"), jog("gk2", "GOL", 200, "Furia FC"),
    ...Array.from({ length: 10 }, (_, i) => jog(`a${i}`, "ATA", 1000 - i * 10, "Furia FC"))];
  return {
    serie: "C",
    elencos: { "Racha FC": [jog("m1", "GOL", 100, "Racha FC"), ...Array.from({ length: 8 }, (_, i) => jog(`m${i + 2}`, "MEI", 100, "Racha FC"))] },
    orcamento: { "Racha FC": 10000 },
    tabela: { "Racha FC": { P: 10 } },
    mercado: { ...mercadoInicial(), janela: "pre" },
    rodada: 0,
    outrasSeries: { A: { elencos: { "Furia FC": elencoA } }, B: { elencos: {} } },
  };
}

describe("mercado entre divisões — contratarEstrela", () => {
  let S;
  beforeEach(() => { S = estadoBase(); });

  it("distância e multiplicador: C→B 1.8×, C→A 3.0×", () => {
    expect(distanciaSeries("C", "B")).toBe(1);
    expect(distanciaSeries("C", "A")).toBe(2);
    expect(distanciaSeries("A", "B")).toBe(-1);
    expect(precoPedidoEstrela({ valor: 1000 }, 1)).toBe(1800);
    expect(precoPedidoEstrela({ valor: 1000 }, 2)).toBe(3000);
  });

  it("recusa proposta abaixo do pedido, sem gastar a tentativa", () => {
    const r = contratarEstrela(S, "Racha FC", "A", "a0", 100, () => 0);
    expect(r.ok).toBe(false);
    expect(r.recusada).toBe(true);
    expect(S.mercado.tentativasEstrela || []).toHaveLength(0);
  });

  it("contrata com rng favorável: transfere, debita e registra histórico", () => {
    const pedido = precoPedidoEstrela(S.outrasSeries.A.elencos["Furia FC"].find((j) => j.id === "a0"), 2);
    const r = contratarEstrela(S, "Racha FC", "A", "a0", pedido, () => 0); // rng 0 = sempre aceita
    expect(r.ok).toBe(true);
    expect(S.elencos["Racha FC"].some((j) => j.id === "a0")).toBe(true);
    expect(S.outrasSeries.A.elencos["Furia FC"].some((j) => j.id === "a0")).toBe(false);
    expect(S.orcamento["Racha FC"]).toBe(10000 - pedido);
    expect(S.mercado.historico[0].de).toContain("Série A");
  });

  it("trava: só 1 contratação de fora por janela; fecharJanela reseta", () => {
    contratarEstrela(S, "Racha FC", "A", "a0", 9000, () => 0);
    const r2 = contratarEstrela(S, "Racha FC", "A", "a1", 9000, () => 0);
    expect(r2.ok).toBe(false);
    expect(r2.motivo).toContain("1 contratação");
    fecharJanela(S);
    expect(S.mercado.estrelasJanela).toBe(0);
  });

  it("persuasão negada gasta a única tentativa do jogador na janela", () => {
    const pedido = precoPedidoEstrela(S.outrasSeries.A.elencos["Furia FC"].find((j) => j.id === "a0"), 2);
    const r = contratarEstrela(S, "Racha FC", "A", "a0", pedido, () => 1); // rng 1 = sempre recusa
    expect(r.ok).toBe(false);
    expect(r.recusada).toBe(true);
    const r2 = contratarEstrela(S, "Racha FC", "A", "a0", pedido * 2, () => 0);
    expect(r2.ok).toBe(false);
    expect(r2.motivo).toContain("já recusou");
  });

  it("não desfalca goleiro único nem elenco curto do time de origem", () => {
    S.outrasSeries.A.elencos["Furia FC"] = S.outrasSeries.A.elencos["Furia FC"].filter((j) => j.id !== "gk2");
    const rGk = contratarEstrela(S, "Racha FC", "A", "gk1", 9000, () => 0);
    expect(rGk.ok).toBe(false);
    expect(rGk.motivo).toContain("goleiro");
    S.outrasSeries.A.elencos["Furia FC"] = S.outrasSeries.A.elencos["Furia FC"].slice(0, 8);
    const rCurto = contratarEstrela(S, "Racha FC", "A", "a0", 9000, () => 0);
    expect(rCurto.ok).toBe(false);
  });

  it("quem está na Série A não contrata 'de cima'", () => {
    S.serie = "A";
    const r = contratarEstrela(S, "Racha FC", "B", "x", 9000, () => 0);
    expect(r.ok).toBe(false);
  });
});
