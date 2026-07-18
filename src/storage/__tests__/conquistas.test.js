// Testes de regressão do sistema de insígnias (Fase 1c do
// PLANO_MESTRE_LEGENDS_LIMEIRA.md): tiers em todas as conquistas, contexto
// opcional no desbloqueio, idempotência preservada.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CONQUISTAS, TIERS, conquistaPorId, carregarConquistas, desbloquear } from "../conquistas";
import { instalarWindowComStorage } from "./helpers/fakeLocalStorage";

let restaurar;
beforeEach(() => { ({ restaurar } = instalarWindowComStorage()); });
afterEach(() => { restaurar(); });

describe("conquistas — tiers e contexto (Fase 1c)", () => {
  it("toda conquista tem um tier válido", () => {
    CONQUISTAS.forEach((c) => {
      expect(TIERS).toContain(c.tier);
    });
  });

  it("inclui a lendária de estreia 'Da C ao Topo'", () => {
    const c = conquistaPorId("da-c-ao-topo");
    expect(c).toBeTruthy();
    expect(c.tier).toBe("lendario");
  });

  it("conquistaPorId encontra qualquer id existente e não quebra em id inexistente", () => {
    expect(conquistaPorId("primeira-vitoria").titulo).toBe("Primeira vitória");
    expect(conquistaPorId("nao-existe")).toBeUndefined();
  });

  it("desbloquear grava contexto (clube/temporada) junto com a data", () => {
    desbloquear("campeao", { clube: "Real União", temporada: 3 });
    const salvas = carregarConquistas();
    expect(salvas.campeao.clube).toBe("Real União");
    expect(salvas.campeao.temporada).toBe(3);
    expect(typeof salvas.campeao.em).toBe("string");
  });

  it("permanece idempotente: segunda chamada com contexto diferente não sobrescreve", () => {
    desbloquear("acesso", { clube: "Time A", temporada: 1 });
    const primeiraVez = carregarConquistas().acesso;
    const resultado = desbloquear("acesso", { clube: "Time B", temporada: 5 });
    expect(resultado).toBe(false);
    expect(carregarConquistas().acesso).toEqual(primeiraVez);
  });

  it("desbloquear sem contexto continua funcionando (compatibilidade com chamadas antigas)", () => {
    const resultado = desbloquear("tri");
    expect(resultado).toBe(true);
    expect(carregarConquistas().tri.em).toBeTruthy();
  });
});
