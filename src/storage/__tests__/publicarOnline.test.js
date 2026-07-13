// Testes de regressão/sincronização (Etapa A, PLANO_CORRECOES_AUDITORIA.md).
// Cobrem, com mocks controlados (nenhuma chamada real ao Supabase):
//  - T-01: perfil sempre é garantido antes de gravar carreira (não pode voltar);
//  - reabertura por usuário antigo (backfill de temporadas fechadas);
//  - envio duplicado (idempotência via upsert com onConflict);
//  - falha de rede / Supabase indisponível não interrompe a carreira offline;
//  - retentativa após falha anterior (checkpoint periódico se auto-cura);
//  - preservação de dados locais (o módulo nunca toca em localStorage).
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- fábrica de um client Supabase falso, com histórico de chamadas -------
// Cada tabela tem seu próprio conjunto de linhas "existentes" (pra simular
// backfill) e cada chamada é registrada em `chamadas` pra asserção.
function criarSupabaseFake({ falharEm = null, existentes = {} } = {}) {
  const chamadas = [];
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: "user-real-1" } } } })),
    },
    from(tabela) {
      return {
        upsert(payload, opts) {
          chamadas.push({ tipo: "upsert", tabela, payload, opts });
          if (falharEm === tabela) {
            return {
              select: () => ({ single: async () => ({ data: null, error: { message: `falha simulada em ${tabela}` } }) }),
              // upsert sem .select() encadeado (usado por publicarProgresso)
              then: (resolve) => resolve({ error: { message: `falha simulada em ${tabela}` } }),
            };
          }
          return {
            select: () => ({
              single: async () => ({ data: { id: "carreira-1", user_id: "user-real-1" }, error: null }),
            }),
            then: (resolve) => resolve({ error: null }),
          };
        },
        insert(linhas) {
          chamadas.push({ tipo: "insert", tabela, linhas });
          if (falharEm === tabela) return { then: (resolve) => resolve({ error: { message: "falha simulada" } }) };
          return { then: (resolve) => resolve({ error: null }) };
        },
        select() {
          return {
            eq: () => ({
              then: undefined,
              // usado como `await supabase.from(...).select(...).eq(...)`
              [Symbol.toPrimitive]: undefined,
              // vitest/mocks: implementar como thenable simples
              then: (resolve) => resolve({ data: (existentes[tabela] || []) }),
            }),
          };
        },
        delete() {
          return { eq: async () => ({ error: falharEm === tabela ? { message: "falha" } : null }) };
        },
      };
    },
  };
  return { client, chamadas };
}

describe("publicarOnline — sincronização com Supabase (mocks, sem rede real)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("T-01 não pode voltar: garante o perfil ANTES de gravar em carreiras, mesmo sem nomeTecnico", async () => {
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { vincularCarreira } = await import("../publicarOnline");

    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };
    await vincularCarreira(mundo, 0, ""); // nomeTecnico vazio — cenário exato do bug real

    const idxPerfil = chamadas.findIndex((c) => c.tabela === "profiles");
    const idxCarreira = chamadas.findIndex((c) => c.tabela === "carreiras");
    expect(idxPerfil).toBeGreaterThanOrEqual(0);
    expect(idxCarreira).toBeGreaterThan(idxPerfil);
    // upsert de profiles não deve incluir nome_tecnico vazio sobrescrevendo um nome já salvo
    expect(chamadas[idxPerfil].payload).not.toHaveProperty("nome_tecnico");
  });

  it("garante perfil também em publicarProgresso e publicarTemporada (defesa em profundidade)", async () => {
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso, publicarTemporada } = await import("../publicarOnline");

    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [{ temporada: 1, serie: "B", time: "Nação NH", posicao: 1, resultado: "manteve" }] };
    await publicarProgresso(mundo, 15, "Treinador Teste");
    expect(chamadas.some((c) => c.tabela === "profiles")).toBe(true);
    chamadas.length = 0;
    await publicarTemporada(mundo, 30, "Treinador Teste");
    expect(chamadas.some((c) => c.tabela === "profiles")).toBe(true);
  });

  it("usuário antigo reabrindo o app: vincularCarreira publica APENAS as temporadas fechadas ainda não publicadas", async () => {
    const { client, chamadas } = criarSupabaseFake({ existentes: { carreira_temporadas: [{ temporada: 1 }] } });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { vincularCarreira } = await import("../publicarOnline");

    const mundo = {
      meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 3, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [
        { temporada: 1, serie: "B", time: "Nação NH", posicao: 3, resultado: "manteve" },
        { temporada: 2, serie: "B", time: "Nação NH", posicao: 1, resultado: "subiu" },
      ],
    };
    await vincularCarreira(mundo, 10, "Treinador Teste");

    const insertCarreiraTemporadas = chamadas.find((c) => c.tipo === "insert" && c.tabela === "carreira_temporadas");
    expect(insertCarreiraTemporadas).toBeTruthy();
    expect(insertCarreiraTemporadas.linhas).toHaveLength(1); // só a temporada 2, a 1 já existia
    expect(insertCarreiraTemporadas.linhas[0].temporada).toBe(2);
    expect(insertCarreiraTemporadas.linhas[0].pontos).toBe(50); // campeão (posicao 1) = bônus de título
  });

  it("envio duplicado de temporada fechada: upsert usa onConflict carreira_id,temporada (idempotente)", async () => {
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");

    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 2, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [{ temporada: 1, serie: "B", time: "Nação NH", posicao: 1, resultado: "manteve" }] };
    await publicarTemporada(mundo, 40, "Treinador Teste");
    await publicarTemporada(mundo, 40, "Treinador Teste"); // reenvio (ex. retry de rede)

    const upsertsTemporada = chamadas.filter((c) => c.tipo === "upsert" && c.tabela === "carreira_temporadas");
    expect(upsertsTemporada).toHaveLength(2);
    upsertsTemporada.forEach((c) => expect(c.opts).toMatchObject({ onConflict: "carreira_id,temporada" }));
  });

  it("falha de rede no upsert de carreiras não lança exceção (publicarProgresso é best-effort)", async () => {
    const { client } = criarSupabaseFake({ falharEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await expect(publicarProgresso(mundo, 10, "Treinador Teste")).resolves.not.toThrow();
  });

  it("falha de rede no upsert de carreiras não lança exceção (publicarTemporada é best-effort)", async () => {
    const { client } = criarSupabaseFake({ falharEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };

    await expect(publicarTemporada(mundo, 10, "Treinador Teste")).resolves.not.toThrow();
  });

  it("Supabase indisponível (client null, ex. env vars ausentes): todas as funções são no-op seguro", async () => {
    vi.doMock("../supabaseClient", () => ({ supabase: null }));
    const { publicarProgresso, publicarTemporada, vincularCarreira, apagarCarreiraOnline } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };

    await expect(publicarProgresso(mundo, 10, "x")).resolves.toBeUndefined();
    await expect(publicarTemporada(mundo, 10, "x")).resolves.toBeUndefined();
    const r = await vincularCarreira(mundo, 10, "x");
    expect(r).toEqual({ error: "Modo online não configurado" });
    const r2 = await apagarCarreiraOnline("user-1");
    expect(r2).toEqual({ error: "Modo online não configurado" });
  });

  it("sessão ausente (getSession retorna null): não tenta gravar nada (evita corromper com sessão parcial)", async () => {
    const { client, chamadas } = criarSupabaseFake();
    client.auth.getSession = vi.fn(async () => ({ data: { session: null } }));
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso, publicarTemporada } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };

    await publicarProgresso(mundo, 10, "x");
    await publicarTemporada(mundo, 10, "x");
    expect(chamadas).toHaveLength(0);
  });

  it("retentativa após falha anterior: o checkpoint periódico (publicarProgresso) tenta de novo mesmo se o vínculo inicial falhou", async () => {
    // Reproduz o cenário real: 1ª tentativa (equivalente ao vínculo automático)
    // falha; a 2ª tentativa, 3 rodadas depois (publicarProgresso), deve
    // conseguir gravar normalmente — é o mecanismo de autocorreção descrito
    // no comentário BUGFIX de App.jsx.
    const falho = criarSupabaseFake({ falharEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: falho.client }));
    const mod1 = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };
    await expect(mod1.publicarProgresso(mundo, 6, "Treinador Teste")).resolves.not.toThrow();

    vi.resetModules();
    const ok = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: ok.client }));
    const mod2 = await import("../publicarOnline");
    await mod2.publicarProgresso(mundo, 9, "Treinador Teste");
    expect(ok.chamadas.some((c) => c.tabela === "carreiras" && c.tipo === "upsert")).toBe(true);
  });

  it("nunca toca em localStorage (preserva dados locais mesmo se a sincronização falhar)", async () => {
    // Ambiente de teste é "node" (sem DOM/Storage global — proposital, ver
    // CORRECOES_TECNICAS_LEGENDS.md: evita a dependência pesada do jsdom).
    // Instala um localStorage global mínimo só pra provar, por espionagem,
    // que publicarOnline.js nunca o chama, mesmo em cenário de falha total.
    const fakeLocalStorage = {
      getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(),
    };
    const originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = fakeLocalStorage;

    const { client } = criarSupabaseFake({ falharEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso, publicarTemporada, vincularCarreira } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: { "Nação NH": "B" }, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {}, carreira: [] };

    await publicarProgresso(mundo, 10, "x");
    await publicarTemporada(mundo, 10, "x");
    await vincularCarreira(mundo, 10, "x");

    expect(fakeLocalStorage.getItem).not.toHaveBeenCalled();
    expect(fakeLocalStorage.setItem).not.toHaveBeenCalled();
    expect(fakeLocalStorage.removeItem).not.toHaveBeenCalled();

    globalThis.localStorage = originalLocalStorage;
  });
});
