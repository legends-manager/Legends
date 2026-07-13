// Testes de observabilidade (Etapa B, PLANO_CORRECOES_AUDITORIA.md /
// CORRECOES_TECNICAS_LEGENDS.md). Cobrem classificação de erro, sanitização
// (nenhum dado pessoal chega ao console), dedup de log repetido, e garantia
// de que o próprio logger nunca lança — nem quando o "transporte"
// (console.error) está indisponível/instrumentado para falhar.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logSincronizacao, classificarErro, _resetDedupParaTeste } from "../logger";

describe("classificarErro — diferencia falha esperada de rede de erro inesperado", () => {
  it("erro com .code (retornado pelo Supabase/Postgrest) é classificado como 'supabase'", () => {
    const erro = { code: "23503", message: "Key (user_id)=(algum-uuid) is not present in table profiles" };
    expect(classificarErro(erro)).toEqual({ tipoErro: "supabase", codigoErro: "23503" });
  });

  it("TypeError (típico de fetch falhando) é classificado como 'rede', sem código real", () => {
    const erro = new TypeError("Failed to fetch");
    expect(classificarErro(erro)).toEqual({ tipoErro: "rede", codigoErro: "sem_conexao" });
  });

  it("erro genérico sem .code e sem indício de rede é classificado como 'inesperado'", () => {
    const erro = new Error("algo que não deveria ter acontecido");
    expect(classificarErro(erro)).toEqual({ tipoErro: "inesperado", codigoErro: "sem_codigo" });
  });

  it("valor não-erro (undefined/null) não quebra a classificação", () => {
    expect(classificarErro(undefined)).toEqual({ tipoErro: "inesperado", codigoErro: "sem_codigo" });
    expect(classificarErro(null)).toEqual({ tipoErro: "inesperado", codigoErro: "sem_codigo" });
  });
});

describe("logSincronizacao — sanitização e contexto seguro", () => {
  let consoleErrorSpy;
  beforeEach(() => {
    _resetDedupParaTeste();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("registra contexto com operação, etapa, presença de sessão, código sanitizado, timestamp e versão", () => {
    logSincronizacao({ operacao: "publicarProgresso", etapa: "upsertCarreira", temSessao: true, erro: { code: "PGRST116" } });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [, contexto] = consoleErrorSpy.mock.calls[0];
    expect(contexto).toMatchObject({
      operacao: "publicarProgresso",
      etapa: "upsertCarreira",
      temSessao: true,
      tipoErro: "supabase",
      codigoErro: "PGRST116",
    });
    expect(contexto.versao).toBeTruthy();
    expect(typeof contexto.timestamp).toBe("string");
    expect(() => new Date(contexto.timestamp).toISOString()).not.toThrow();
  });

  it("NUNCA inclui a mensagem bruta do erro (pode ecoar valor de coluna/dado pessoal)", () => {
    const erroComDadoSensivel = {
      code: "23503",
      message: "Key (email)=(fulano.real@example.com) violates foreign key constraint",
    };
    logSincronizacao({ operacao: "vincularCarreira", etapa: "upsertCarreira", temSessao: true, erro: erroComDadoSensivel });
    const [, contexto] = consoleErrorSpy.mock.calls[0];
    const serializado = JSON.stringify(contexto);
    expect(serializado).not.toContain("fulano.real@example.com");
    expect(serializado).not.toContain("message");
  });

  it("NUNCA recebe nem repassa nome de técnico, e-mail, apelido ou id de usuário — só o contexto explícito", () => {
    // O contrato da função nem aceita esses campos — o teste documenta que
    // só as chaves esperadas chegam ao console, nada além delas.
    logSincronizacao({ operacao: "publicarTemporada", etapa: "garantirPerfil", temSessao: true, erro: new Error("falha") });
    const [, contexto] = consoleErrorSpy.mock.calls[0];
    const chaves = Object.keys(contexto).sort();
    expect(chaves).toEqual(["codigoErro", "etapa", "operacao", "temSessao", "timestamp", "tipoErro", "versao"]);
  });

  it("nunca lança, mesmo se o próprio console.error estiver indisponível/lançando (telemetria indisponível)", () => {
    consoleErrorSpy.mockImplementation(() => {
      throw new Error("telemetria fora do ar");
    });
    expect(() => logSincronizacao({ operacao: "publicarProgresso", etapa: "x", temSessao: true, erro: new Error("y") })).not.toThrow();
  });

  it("nunca lança mesmo com argumentos ausentes/malformados", () => {
    expect(() => logSincronizacao({})).not.toThrow();
    expect(() => logSincronizacao(undefined)).not.toThrow();
  });
});

describe("logSincronizacao — prevenção de logs duplicados/loop de envio", () => {
  let consoleErrorSpy;
  beforeEach(() => {
    _resetDedupParaTeste();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("suprime a mesma falha (mesma operação+etapa+tipo+código) repetida em sequência rápida", () => {
    const evento = { operacao: "publicarProgresso", etapa: "upsertCarreira", temSessao: true, erro: { code: "23503" } };
    logSincronizacao(evento);
    logSincronizacao(evento);
    logSincronizacao(evento);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("NÃO suprime eventos com etapa ou operação diferentes (não é um silenciador geral)", () => {
    logSincronizacao({ operacao: "publicarProgresso", etapa: "upsertCarreira", temSessao: true, erro: { code: "23503" } });
    logSincronizacao({ operacao: "publicarProgresso", etapa: "garantirPerfil", temSessao: true, erro: { code: "23503" } });
    logSincronizacao({ operacao: "vincularCarreira", etapa: "upsertCarreira", temSessao: true, erro: { code: "23503" } });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
  });
});
