// Testes da proteção mínima de integridade do ranking (Etapa C,
// ANALISE_INTEGRIDADE_RANKING.md / PLANO_CORRECOES_AUDITORIA.md).
// Revisados após auditoria técnica independente — ver
// CORRECOES_TECNICAS_LEGENDS.md, seção "Etapa C — Revisão técnica
// independente e ajustes aplicados", para o histórico de cada mudança.
//
// A validação em si (faixa de pontos, piso de temporada) é feita pelo
// BANCO (ver supabase/migrations/20260713120000_protecao_minima_ranking.sql
// — CHECK constraints, ainda não aplicadas em produção), não pelo cliente.
// Este arquivo testa 3 coisas do lado do cliente:
//   1. que a mudança de código (parar de mandar `atualizado_em` do
//      navegador) realmente aconteceu e não volta sem um teste falhar;
//   2. que o app se comporta bem (não quebra, não perde o save local)
//      quando o banco REJEITA uma escrita por violar a constraint de
//      pontos — mesmo antes dela existir de fato em produção, simulamos a
//      resposta que o Postgres daria;
//   3. que `publicarTemporada` só zera o progresso em andamento DEPOIS de
//      confirmar que a temporada fechada foi salva com sucesso — o ajuste
//      feito depois da revisão técnica encontrar que a ordem antiga podia
//      perder o resultado de uma temporada sem motivo.
//
// Os testes "canário" (que comparam o teto de pontos com o que o jogo
// realmente pode gerar) IMPORTAM os valores reais do motor/da constante de
// pontuação, em vez de repetir números fixos — a versão anterior desses
// testes comparava um número digitado à mão com outro número digitado à
// mão, o que nunca detectaria uma mudança real de regra. Corrigido aqui.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { totalRodadas } from "../../engine/calendario";
import { SERIES } from "../../data/series";
import { PONTOS_TITULO } from "../publicarOnline";

function criarSupabaseFake({ codigoErroEm = null } = {}) {
  const chamadas = [];
  const client = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: "user-1" } } } })) },
    from(tabela) {
      return {
        upsert(payload, opts) {
          chamadas.push({ tipo: "upsert", tabela, payload, opts });
          if (codigoErroEm === tabela) {
            const erro = { code: "23514", message: "new row for relation violates check constraint" };
            return {
              select: () => ({ single: async () => ({ data: null, error: erro }) }),
              then: (resolve) => resolve({ error: erro }),
            };
          }
          return {
            select: () => ({ single: async () => ({ data: { id: "carreira-1" }, error: null }) }),
            then: (resolve) => resolve({ error: null }),
          };
        },
        update(payload) {
          chamadas.push({ tipo: "update", tabela, payload });
          return { eq: async () => ({ error: null }) };
        },
        insert() {
          return { then: (resolve) => resolve({ error: null }) };
        },
        select() {
          return { eq: () => ({ then: (resolve) => resolve({ data: [] }) }) };
        },
      };
    },
  };
  return { client, chamadas };
}

describe("publicarOnline — data de atividade definida pelo servidor (não pelo cliente)", () => {
  beforeEach(() => vi.resetModules());

  it("publicarProgresso NÃO envia mais 'atualizado_em' calculado no navegador", async () => {
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await publicarProgresso(mundo, 9, "Treinador Teste");

    const upsertCarreiras = chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "upsert");
    expect(upsertCarreiras).toBeTruthy();
    expect(upsertCarreiras.payload).not.toHaveProperty("atualizado_em");
  });
});

describe("publicarOnline — resiliência à constraint de pontos do banco", () => {
  beforeEach(() => vi.resetModules());

  it("se o banco rejeitar pontos fora da faixa (CHECK) em publicarProgresso, não quebra o app", async () => {
    const { client } = criarSupabaseFake({ codigoErroEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarProgresso } = await import("../publicarOnline");
    const mundo = { meuTime: "Nação NH", divisao: {}, temporada: 1, hallCampeoes: [], historicoAcesso: [], recordes: {} };

    await expect(publicarProgresso(mundo, 9, "Treinador Teste")).resolves.not.toThrow();
  });

  it("uma temporada com número muito alto (ex. 25) NÃO é mais rejeitada por teto de temporada — só o piso (>= 1) existe agora", async () => {
    // Regressão do ajuste pós-revisão: a versão anterior desta migration
    // tinha um teto de 20 temporadas, removido por poder bloquear um
    // jogador veterano legítimo (a Liga Viva não tem fim de carreira).
    // Este teste simula uma carreira longa e confirma que o cliente não
    // trata isso como um erro esperado — não há mais CHECK de teto pra
    // simular rejeitando esse valor.
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = {
      meuTime: "Nação NH", divisao: {}, temporada: 26, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [{ temporada: 25, serie: "C", time: "Nação NH", posicao: 3, resultado: "manteve" }],
    };

    await publicarTemporada(mundo, 40, "Treinador Teste");

    const upsertTemporada = chamadas.find((c) => c.tabela === "carreira_temporadas" && c.tipo === "upsert");
    expect(upsertTemporada).toBeTruthy();
    expect(upsertTemporada.payload.temporada).toBe(25);
  });
});

describe("publicarOnline — ordem segura de gravação em publicarTemporada", () => {
  beforeEach(() => vi.resetModules());

  it("zera o progresso (pontos_temporada_atual) SÓ DEPOIS de salvar a temporada fechada com sucesso", async () => {
    const { client, chamadas } = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = {
      meuTime: "Nação NH", divisao: {}, temporada: 2, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [{ temporada: 1, serie: "C", time: "Nação NH", posicao: 1, resultado: "manteve" }],
    };

    await publicarTemporada(mundo, 60, "Treinador Teste");

    const upsertCarreiraInicial = chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "upsert");
    const upsertTemporada = chamadas.find((c) => c.tabela === "carreira_temporadas" && c.tipo === "upsert");
    const updateZerar = chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "update");

    // O upsert inicial de `carreiras` não zera mais pontos_temporada_atual
    // diretamente — isso só acontece no `update` separado, no final.
    expect(upsertCarreiraInicial.payload).not.toHaveProperty("pontos_temporada_atual");
    expect(upsertTemporada).toBeTruthy();
    expect(updateZerar).toBeTruthy();
    expect(updateZerar.payload).toEqual({ pontos_temporada_atual: 0 });
  });

  it("se salvar a temporada fechada FALHAR, o progresso NÃO é zerado (evita perder o resultado sem motivo)", async () => {
    const { client, chamadas } = criarSupabaseFake({ codigoErroEm: "carreira_temporadas" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = {
      meuTime: "Nação NH", divisao: {}, temporada: 2, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [{ temporada: 1, serie: "C", time: "Nação NH", posicao: 1, resultado: "manteve" }],
    };

    await publicarTemporada(mundo, 60, "Treinador Teste");

    const updateZerar = chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "update");
    expect(updateZerar).toBeUndefined();
  });
});

describe("publicarOnline — teste canário: valores reais do jogo cabem na faixa proposta", () => {
  it("o máximo de pontos possível numa temporada (maior série, campeão invicto + bônus) cabe em 0-150", () => {
    // Importa os valores REAIS do motor e da constante de bônus, em vez de
    // repeti-los como literais — se o calendário ou o bônus de título
    // mudarem, este teste passa a refletir o novo valor automaticamente e
    // avisa se ele estourar a faixa proposta no banco.
    const maiorCalendario = Math.max(
      ...Object.values(SERIES).map((s) => totalRodadas(s.times.length)),
    );
    const PONTOS_POR_VITORIA = 3; // regra de pontuação (3/vitória) — não exportada do motor, documentada aqui
    const maximoTeorico = maiorCalendario * PONTOS_POR_VITORIA + PONTOS_TITULO;

    expect(maiorCalendario).toBe(22); // Série C, 12 times — documenta o valor real hoje
    expect(maximoTeorico).toBeLessThanOrEqual(150);
  });
});
