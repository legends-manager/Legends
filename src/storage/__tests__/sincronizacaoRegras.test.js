// Requisitos 1, 2 e 5 (Etapa A): sessão só é reconhecida quando disponível,
// vínculo automático só dispara uma vez por (usuário, time), e a
// periodicidade de sincronização é exatamente a cada 3 rodadas.
import { describe, it, expect } from "vitest";
import { chaveVinculo, deveExecutarVinculoAutomatico, deveSincronizarProgresso } from "../sincronizacaoRegras";

describe("chaveVinculo — depende de sessão disponível", () => {
  it("retorna null sem userId (sessão ainda não carregada/indisponível)", () => {
    expect(chaveVinculo(undefined, "Nação NH")).toBeNull();
    expect(chaveVinculo(null, "Nação NH")).toBeNull();
  });

  it("retorna null sem time (mundo/carreira ainda não carregada)", () => {
    expect(chaveVinculo("user-123", null)).toBeNull();
  });

  it("combina userId + time quando ambos existem (sessão disponível)", () => {
    expect(chaveVinculo("user-123", "Nação NH")).toBe("user-123|Nação NH");
  });
});

describe("deveExecutarVinculoAutomatico — vínculo automático ao ranking", () => {
  it("executa na primeira vez (nenhum vínculo anterior registrado)", () => {
    expect(deveExecutarVinculoAutomatico(null, "user-123|Nação NH")).toBe(true);
  });

  it("não executa de novo para a mesma chave (evita repetir a cada re-render)", () => {
    expect(deveExecutarVinculoAutomatico("user-123|Nação NH", "user-123|Nação NH")).toBe(false);
  });

  it("executa de novo se o time mudou (ex. 'Novo jogo' com outro time)", () => {
    expect(deveExecutarVinculoAutomatico("user-123|Nação NH", "user-123|Real União")).toBe(true);
  });

  it("executa de novo se o usuário mudou (outra conta logou)", () => {
    expect(deveExecutarVinculoAutomatico("user-123|Nação NH", "user-456|Nação NH")).toBe(true);
  });

  it("não executa sem chave atual válida (sessão/mundo ainda não prontos)", () => {
    expect(deveExecutarVinculoAutomatico(null, null)).toBe(false);
  });
});

describe("deveSincronizarProgresso — periodicidade do checkpoint (a cada 3 rodadas)", () => {
  it("sincroniza exatamente nas rodadas múltiplas de 3", () => {
    const chamadas = [];
    for (let rodada = 1; rodada <= 22; rodada++) {
      if (deveSincronizarProgresso(rodada)) chamadas.push(rodada);
    }
    expect(chamadas).toEqual([3, 6, 9, 12, 15, 18, 21]);
  });

  it("não sincroniza em rodadas fora do múltiplo de 3", () => {
    expect(deveSincronizarProgresso(1)).toBe(false);
    expect(deveSincronizarProgresso(2)).toBe(false);
    expect(deveSincronizarProgresso(4)).toBe(false);
  });
});
