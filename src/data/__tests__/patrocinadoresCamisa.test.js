// Testes do patrocínio de uniforme: config pura, sem tocar em UI.
import { describe, it, expect } from "vitest";
import { FORNECEDOR_CAMISA, PATROCINADOR_MASTER, patrocinadorMasterDoTime } from "../patrocinadoresCamisa";
import { COR_HEX } from "../times";
import { TODOS_OS_TIMES } from "../series";

describe("patrocínio de uniforme", () => {
  it("fornecedor de material é fixo e tem nome+logo", () => {
    expect(FORNECEDOR_CAMISA.nome).toBe("Sport+");
    expect(FORNECEDOR_CAMISA.logo).toMatch(/^\/fornecedores\//);
  });

  it("Kissassa já sai com o patrocinador máster (Delícias da Ana)", () => {
    const m = patrocinadorMasterDoTime("Kissassa");
    expect(m).toBeTruthy();
    expect(m.nome).toBe("Delícias da Ana");
  });

  it("time sem patrocinador máster retorna null (espaço à venda)", () => {
    expect(patrocinadorMasterDoTime("Real União")).toBeNull();
    expect(patrocinadorMasterDoTime("Time Que Não Existe")).toBeNull();
  });

  it("todo time real tem uma cor hex válida (nunca undefined)", () => {
    TODOS_OS_TIMES.forEach((t) => {
      expect(COR_HEX[t]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
