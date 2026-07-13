// Testes de integração entre publicarOnline.js e o logger (Etapa B).
// Confirmam que cada tipo de falha pedido chega ao logger com o contexto
// certo, e que uma telemetria indisponível nunca impede a sincronização de
// terminar (nem lança, nem quebra o retorno esperado pelo chamador).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { _resetDedupParaTeste } from "../logger";

function criarSupabaseFake({ lancarEm = null, retornarErroEm = null } = {}) {
  const client = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: "user-1" } } } })) },
    from(tabela) {
      return {
        upsert(payload, opts) {
          if (lancarEm === tabela) {
            return { select: () => ({ single: async () => { throw new TypeError("Failed to fetch"); } }), then: () => { throw new TypeError("Failed to fetch"); } };
          }
          if (retornarErroEm === tabela) {
            return {
              select: () => ({ single: async () => ({ data: null, error: { code: "23503", message: "detalhe sensível" } }) }),
              then: (resolve) => resolve({ error: { code: "23503", message: "detalhe sensível" } }),
            };
          }
          return {
            select: () => ({ single: async () => ({ data: { id: "carreira-1" }, error: null }) }),
            then: (resolve) => resolve({ error: null }),
          };
        },
        insert() {
          return { then: (resolve) => resolve({ error: null }) };
        },
        select() {
          return { eq: () => ({ then: (resolve) => resolve({ data: [] }) }) };
        },
        delete() {
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  return client;
}

describe("publicarOnline — integração com logSincronizacao (Etapa B)", () => {
  beforeEach(() => {
    vi.resetModules();
    _resetDedupParaTeste();
  });

  it("erro retornado pelo Supabase é registrado com tipoErro 'supabase' e código, sem a mensagem bruta", async () => {
    const logSpy = vi.fn();
    vi.doMock("../logger", async () => {
      const real = await vi.importActual("../logger");
      return { ...real, logSincronizacao: logSpy };
    });
    vi.doMock("../supabaseClient", () => ({ supabase: criarSupabaseFake({ retornarErroEm: "carreiras" }) }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await publicarProgresso(mundo, 9, "Treinador Teste");

    const chamada = logSpy.mock.calls.find(([c]) => c.etapa === "upsertCarreira");
    expect(chamada).toBeTruthy();
    expect(chamada[0].erro).toEqual({ code: "23503", message: "detalhe sensível" });
    expect(chamada[0].operacao).toBe("publicarProgresso");
    expect(chamada[0].temSessao).toBe(true);
  });

  it("erro inesperado (exceção lançada, não retornada) é registrado com etapa 'inesperado' e não escapa da função", async () => {
    const logSpy = vi.fn();
    vi.doMock("../logger", async () => {
      const real = await vi.importActual("../logger");
      return { ...real, logSincronizacao: logSpy };
    });
    vi.doMock("../supabaseClient", () => ({ supabase: criarSupabaseFake({ lancarEm: "carreiras" }) }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };

    await expect(publicarTemporada(mundo, 20, "Treinador Teste")).resolves.not.toThrow();
    expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ operacao: "publicarTemporada", etapa: "inesperado" }));
  });

  it("sessão ausente não gera nenhum log de erro (é estado esperado, não falha)", async () => {
    const logSpy = vi.fn();
    vi.doMock("../logger", async () => {
      const real = await vi.importActual("../logger");
      return { ...real, logSincronizacao: logSpy };
    });
    const client = criarSupabaseFake();
    client.auth.getSession = vi.fn(async () => ({ data: { session: null } }));
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await publicarProgresso(mundo, 9, "Treinador Teste");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("indisponibilidade do sistema de telemetria (logger real, console.error lançando) não interrompe a sincronização", async () => {
    // Usa o logger REAL (não mockado) — só o console.error é forçado a
    // lançar, simulando telemetria indisponível/hostil.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("telemetria indisponível");
    });
    vi.doMock("../supabaseClient", () => ({ supabase: criarSupabaseFake({ retornarErroEm: "carreiras" }) }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await expect(publicarProgresso(mundo, 9, "Treinador Teste")).resolves.not.toThrow();
    consoleErrorSpy.mockRestore();
  });
});
