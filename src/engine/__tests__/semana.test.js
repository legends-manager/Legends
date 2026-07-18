// Testes da Semana Temática (engine/semana.js): rotação determinística por
// semana ISO e regras de bônus — premiação pura, sem tocar no motor.
import { describe, it, expect } from "vitest";
import { SEMANAS, semanaISO, semanaTematica, bonusDaSemana } from "../semana";

describe("semana temática", () => {
  it("semana ISO é determinística e conhecida", () => {
    expect(semanaISO(new Date(2026, 0, 5))).toBe(2); // 5/jan/2026 = semana 2
    expect(semanaISO(new Date(2026, 6, 18))).toBe(29); // 18/jul/2026 = semana 29
  });

  it("mesma data → mesma semana temática; rotação cobre todos os temas", () => {
    const d = new Date(2026, 6, 18);
    expect(semanaTematica(d).id).toBe(semanaTematica(d).id);
    const ids = new Set();
    for (let i = 0; i < SEMANAS.length; i++) {
      ids.add(semanaTematica(new Date(2026, 0, 5 + i * 7)).id);
    }
    expect(ids.size).toBe(SEMANAS.length);
  });

  it("semana do artilheiro paga por gol; zero gols = sem bônus", () => {
    const dataArtilheiro = new Date(2026, 0, 5 + SEMANAS.findIndex((s) => s.id === "artilheiro") * 7 - 7);
    // Acha uma data cujo tema é artilheiro procurando nas 4 semanas seguintes.
    let d = new Date(2026, 0, 5);
    while (semanaTematica(d).id !== "artilheiro") d = new Date(d.getTime() + 7 * 86400000);
    const ctx = { meusGols: 3, golsAdv: 1, venceu: true, advAcimaNaTabela: false };
    const b = bonusDaSemana(ctx, d);
    expect(b.valor).toBe(18);
    expect(bonusDaSemana({ ...ctx, meusGols: 0 }, d)).toBeNull();
  });

  it("semana da zebra exige vitória E adversário acima na tabela", () => {
    let d = new Date(2026, 0, 5);
    while (semanaTematica(d).id !== "zebra") d = new Date(d.getTime() + 7 * 86400000);
    expect(bonusDaSemana({ meusGols: 2, golsAdv: 1, venceu: true, advAcimaNaTabela: true }, d).valor).toBe(45);
    expect(bonusDaSemana({ meusGols: 2, golsAdv: 1, venceu: true, advAcimaNaTabela: false }, d)).toBeNull();
    expect(bonusDaSemana({ meusGols: 1, golsAdv: 2, venceu: false, advAcimaNaTabela: true }, d)).toBeNull();
  });

  it("toda semana tem id/título/descrição e funções de bônus", () => {
    SEMANAS.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.titulo).toBeTruthy();
      expect(s.desc).toBeTruthy();
      expect(typeof s.bonus).toBe("function");
    });
  });
});
