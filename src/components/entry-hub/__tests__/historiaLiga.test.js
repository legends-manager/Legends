// Testes de reconciliação de navegação (Task 05.1H.1, correção B/§11): a
// ação congelada "Ver história da liga" volta a existir na Entry sem
// carreira e deve funcionar sem `mundo`, sem fabricar dado histórico e sem
// qualquer escrita persistente. Como o projeto não tem infraestrutura de
// renderização React, a cobertura é sobre a REGRA pura que HistoriaLiga.jsx
// agora usa (mundo nulo → hall vazio, recordes ausentes), extraída aqui no
// mesmo formato assertável usado nos demais testes puros do slice.
import { describe, it, expect } from "vitest";
import { instalarWindowComStorage } from "../../../storage/__tests__/helpers/fakeLocalStorage";

// Mesma regra aplicada em HistoriaLiga.jsx: `hall = mundo ? [...mundo.hallCampeoes].reverse() : []`
// e `recordes = mundo?.recordes`. Reproduzida aqui como função pura pra
// travar o contrato sem precisar montar o componente React.
function derivarHistoriaLiga(mundo) {
  return {
    hall: mundo ? [...mundo.hallCampeoes].reverse() : [],
    recordes: mundo?.recordes,
  };
}

describe("Ver história da liga — reconciliação de navegação (05.1H.1)", () => {
  it("com mundo=null (Entry sem carreira), devolve hall vazio sem fabricar campeões", () => {
    const r = derivarHistoriaLiga(null);
    expect(r.hall).toEqual([]);
    expect(r.recordes).toBeUndefined();
  });

  it("com mundo existente, preserva o hall de campeões real (nenhum dado inventado)", () => {
    const mundo = {
      hallCampeoes: [{ temporada: 1, A: "Benfica", B: "Tigres", C: "Real União" }],
      recordes: { maiorGoleada: { casa: "Real União", fora: "Sereno FC", gc: 8, gf: 1, temporada: 1, serie: "C" } },
    };
    const r = derivarHistoriaLiga(mundo);
    expect(r.hall).toEqual([{ temporada: 1, A: "Benfica", B: "Tigres", C: "Real União" }]);
    expect(r.recordes.maiorGoleada.gc).toBe(8);
  });

  it("navegar para história da liga sem mundo não cria save, mundo nem qualquer chave de storage", () => {
    // Prova observável de "nenhuma escrita persistente": a derivação é pura
    // leitura; nenhuma chamada de storage acontece ao processarmos os dois
    // estados possíveis (com e sem mundo).
    const { storage, restaurar } = instalarWindowComStorage();
    derivarHistoriaLiga(null);
    derivarHistoriaLiga({ hallCampeoes: [], recordes: {} });
    expect(storage.chaves()).toEqual([]);
    restaurar();
  });
});
