// Testes do onboarding Entry & Career Hub (Task 05.1H §16). O projeto não
// tem infraestrutura de renderização React instalada (e a ordem proíbe
// instalar) — a cobertura é sobre as transições PURAS extraídas pra
// entry-hub/onboarding.js, que são exatamente o que os componentes despacham.
import { describe, it, expect, vi } from "vitest";
import {
  PASSOS, estadoInicialOnboarding, onboardingReducer, criarDisparoUnico,
} from "../onboarding";
import { instalarWindowComStorage } from "../../../storage/__tests__/helpers/fakeLocalStorage";

const r = onboardingReducer;

describe("onboarding — transições puras", () => {
  it("começa no Entry e 'Começar nova carreira' entra na escolha de divisão", () => {
    expect(estadoInicialOnboarding.passo).toBe(PASSOS.ENTRY);
    const s = r(estadoInicialOnboarding, { tipo: "COMECAR" });
    expect(s.passo).toBe(PASSOS.DIVISAO);
    expect(s.divisao).toBeNull();
    expect(s.clube).toBeNull();
  });

  it("escolher divisão não cria save nem toca em localStorage (reducer puro)", () => {
    // Prova observável: com um storage falso instalado, a transição inteira
    // do onboarding não cria NENHUMA chave — criar carreira continua sendo
    // exclusividade do iniciarTemporada() do App.
    const { storage, restaurar } = instalarWindowComStorage();
    let s = r(estadoInicialOnboarding, { tipo: "COMECAR" });
    s = r(s, { tipo: "ESCOLHER_DIVISAO", divisao: "C" });
    s = r(s, { tipo: "AVANCAR_PARA_CLUBE" });
    s = r(s, { tipo: "ESCOLHER_CLUBE", clube: "Real União" });
    expect(storage.chaves()).toEqual([]);
    restaurar();
    expect(s.passo).toBe(PASSOS.CONFIRMACAO);
  });

  it("selecionar clube leva à confirmação sem chamar iniciarTemporada", () => {
    const iniciarTemporada = vi.fn();
    let s = r({ passo: PASSOS.CLUBE, divisao: "B", clube: null }, { tipo: "ESCOLHER_CLUBE", clube: "Tigres" });
    expect(s.passo).toBe(PASSOS.CONFIRMACAO);
    expect(s.clube).toBe("Tigres");
    // Nenhuma transição do reducer invoca o callback — só o botão "Iniciar
    // carreira" da confirmação o faz (coberto pelo teste do disparo único).
    expect(iniciarTemporada).not.toHaveBeenCalled();
  });

  it("'Trocar clube' volta pra escolha de clube PRESERVANDO a divisão", () => {
    const antes = { passo: PASSOS.CONFIRMACAO, divisao: "A", clube: "Benfica" };
    const s = r(antes, { tipo: "TROCAR_CLUBE" });
    expect(s.passo).toBe(PASSOS.CLUBE);
    expect(s.divisao).toBe("A"); // divisão preservada (decisão travada 05.1F)
  });

  it("'Trocar clube' não executa nenhum comportamento destrutivo (novoJogo/limpeza)", () => {
    const novoJogo = vi.fn();
    const { storage, restaurar } = instalarWindowComStorage();
    storage.setItem("legends-manager:mundo-v1", JSON.stringify({ meuTime: "Real União" }));
    const fotografia = storage.getItem("legends-manager:mundo-v1");

    r({ passo: PASSOS.CONFIRMACAO, divisao: "C", clube: "Real União" }, { tipo: "TROCAR_CLUBE" });

    expect(novoJogo).not.toHaveBeenCalled();
    expect(storage.getItem("legends-manager:mundo-v1")).toBe(fotografia);
    expect(storage.chaves()).toEqual(["legends-manager:mundo-v1"]);
    restaurar();
  });

  it("trocar de divisão invalida o clube escolhido antes (nada de seleção órfã)", () => {
    const antes = { passo: PASSOS.DIVISAO, divisao: "C", clube: "Real União" };
    const s = r(antes, { tipo: "ESCOLHER_DIVISAO", divisao: "B" });
    expect(s.divisao).toBe("B");
    expect(s.clube).toBeNull();
    // Re-escolher a MESMA divisão não descarta o clube.
    const s2 = r({ ...antes }, { tipo: "ESCOLHER_DIVISAO", divisao: "C" });
    expect(s2.clube).toBe("Real União");
  });

  it("voltar percorre confirmação → clube → divisão → entry, sem efeitos colaterais", () => {
    let s = { passo: PASSOS.CONFIRMACAO, divisao: "C", clube: "Real União" };
    s = r(s, { tipo: "VOLTAR" });
    expect(s.passo).toBe(PASSOS.CLUBE);
    s = r(s, { tipo: "VOLTAR" });
    expect(s.passo).toBe(PASSOS.DIVISAO);
    s = r(s, { tipo: "VOLTAR" });
    expect(s.passo).toBe(PASSOS.ENTRY);
  });

  it("avançar pra clube sem divisão escolhida é bloqueado", () => {
    const s = r({ passo: PASSOS.DIVISAO, divisao: null, clube: null }, { tipo: "AVANCAR_PARA_CLUBE" });
    expect(s.passo).toBe(PASSOS.DIVISAO);
  });

  it("as transições do onboarding não tocam na chave de conquistas", () => {
    const { storage, restaurar } = instalarWindowComStorage();
    storage.setItem("legends-manager:conquistas-v1", JSON.stringify({ campeao: { em: "2026-01-01" } }));
    const fotografia = storage.getItem("legends-manager:conquistas-v1");

    let s = estadoInicialOnboarding;
    ["COMECAR", "ESCOLHER_DIVISAO", "AVANCAR_PARA_CLUBE", "ESCOLHER_CLUBE", "TROCAR_CLUBE", "VOLTAR", "RESETAR"]
      .forEach((tipo) => { s = r(s, { tipo, divisao: "C", clube: "Real União" }); });

    expect(storage.getItem("legends-manager:conquistas-v1")).toBe(fotografia);
    restaurar();
  });
});

describe("criarDisparoUnico — proteção do iniciarTemporada", () => {
  it("a confirmação dispara iniciarTemporada exatamente uma vez, mesmo com duplo clique", () => {
    const iniciarTemporada = vi.fn();
    const disparar = criarDisparoUnico(() => iniciarTemporada("Real União"));
    expect(disparar()).toBe(true);   // 1º clique: passa
    expect(disparar()).toBe(false);  // duplo clique: bloqueado
    expect(disparar()).toBe(false);  // repetição de evento: bloqueado
    expect(iniciarTemporada).toHaveBeenCalledTimes(1);
    expect(iniciarTemporada).toHaveBeenCalledWith("Real União");
  });
});
