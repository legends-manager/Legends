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

function criarSupabaseFake({ codigoErroEm = null, falharUpdateEm = null } = {}) {
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
          if (falharUpdateEm === tabela) {
            const erro = { code: "08006", message: "connection failure (simulada)" };
            return { eq: async () => ({ error: erro }) };
          }
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

  it("se a temporada SALVA COM SUCESSO mas o 'zerar progresso' falhar: o resultado continua salvo, sem duplicar, e uma nova tentativa recupera o estado", async () => {
    // 1ª tentativa: a gravação da temporada funciona, mas a gravação
    // seguinte (zerar o progresso em andamento) falha — ex. a conexão caiu
    // bem nesse meio-tempo, um cenário distinto do anterior (que falhava
    // JÁ na gravação da temporada).
    const tentativa1 = criarSupabaseFake({ falharUpdateEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: tentativa1.client }));
    const mod1 = await import("../publicarOnline");
    const mundo = {
      meuTime: "Nação NH", divisao: {}, temporada: 2, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [{ temporada: 1, serie: "C", time: "Nação NH", posicao: 1, resultado: "manteve" }],
    };

    await expect(mod1.publicarTemporada(mundo, 60, "Treinador Teste")).resolves.not.toThrow();

    const upsertTemporada1 = tentativa1.chamadas.find((c) => c.tabela === "carreira_temporadas" && c.tipo === "upsert");
    const updateZerar1 = tentativa1.chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "update");
    // O resultado da temporada permanece salvo — a falha foi só na etapa
    // seguinte, não desfaz o que já tinha sido gravado com sucesso.
    expect(upsertTemporada1).toBeTruthy();
    expect(upsertTemporada1.payload.temporada).toBe(1);
    expect(upsertTemporada1.payload.pontos).toBe(60 + PONTOS_TITULO); // posição 1 = bônus de título
    // A tentativa de zerar aconteceu (não foi pulada) mas falhou — sem
    // travar o app (confirmado pelo resolves.not.toThrow acima).
    expect(updateZerar1).toBeTruthy();

    // 2ª tentativa (nova sincronização — ex. próximo login ou checkpoint,
    // exatamente como acontece de verdade via vincularCarreira/
    // publicarProgresso): desta vez tudo funciona.
    vi.resetModules();
    const tentativa2 = criarSupabaseFake();
    vi.doMock("../supabaseClient", () => ({ supabase: tentativa2.client }));
    const mod2 = await import("../publicarOnline");
    await mod2.publicarTemporada(mundo, 60, "Treinador Teste");

    const upsertsTemporada2 = tentativa2.chamadas.filter((c) => c.tabela === "carreira_temporadas" && c.tipo === "upsert");
    const updateZerar2 = tentativa2.chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "update");
    // Não duplica: o cliente sempre manda o MESMO payload determinístico
    // pra mesma temporada, com o mesmo onConflict — no banco de verdade
    // isso resolve pra uma única linha (chave carreira_id+temporada),
    // nunca um segundo registro.
    expect(upsertsTemporada2).toHaveLength(1);
    expect(upsertsTemporada2[0].payload.temporada).toBe(1);
    expect(upsertsTemporada2[0].opts).toMatchObject({ onConflict: "carreira_id,temporada" });
    // Desta vez o progresso é zerado com sucesso — o estado se recupera.
    expect(updateZerar2).toBeTruthy();
    expect(updateZerar2.payload).toEqual({ pontos_temporada_atual: 0 });
  });

  it("se a PRIMEIRA gravação de publicarTemporada falhar, a segunda nunca é tentada e nenhum progresso é zerado ou sobrescrito", async () => {
    // "Primeira gravação" = o upsert inicial em `carreiras` (que também
    // busca/gera o id da carreira, necessário pra gravar a temporada
    // depois). Diferente do teste acima (que falha na SEGUNDA gravação,
    // já com a temporada salva), aqui a cadeia inteira nunca começa.
    const { client, chamadas } = criarSupabaseFake({ codigoErroEm: "carreiras" });
    vi.doMock("../supabaseClient", () => ({ supabase: client }));
    const { publicarTemporada } = await import("../publicarOnline");
    const mundo = {
      meuTime: "Nação NH", divisao: {}, temporada: 2, hallCampeoes: [], historicoAcesso: [], recordes: {},
      carreira: [{ temporada: 1, serie: "C", time: "Nação NH", posicao: 1, resultado: "manteve" }],
    };

    await expect(publicarTemporada(mundo, 60, "Treinador Teste")).resolves.not.toThrow();

    const upsertTemporada = chamadas.find((c) => c.tabela === "carreira_temporadas");
    const updateZerar = chamadas.find((c) => c.tabela === "carreiras" && c.tipo === "update");
    expect(upsertTemporada).toBeUndefined(); // a gravação da temporada nunca chega a ser tentada
    expect(updateZerar).toBeUndefined(); // nenhum progresso é zerado ou sobrescrito
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
