// Testes de regressão do round-trip de save (Task 05.1G, lacuna apontada na
// auditoria arquitetural 05.1F): prova que uma carreira em andamento
// sobrevive a `salvarJogo → carregarSave → reconstruirS` sem perda de dado —
// a proteção mínima exigida ANTES do slice visual do Entry & Career Hub
// (05.1H) tocar na camada de apresentação.
//
// Regras seguidas:
//  - comportamento ATUAL do repositório é a autoridade (nenhuma asserção
//    "idealizada": tudo confere contra o que saveGame.js documenta e faz);
//  - determinístico: fixtures completas (copa incluída) pra nunca cair nos
//    ramos aleatórios (iniciarCopa/iniciarSerieParalela);
//  - sem rede, sem Supabase, sem chaves de ambiente;
//  - localStorage falso e isolado por teste (helpers/fakeLocalStorage).
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  salvarJogo, carregarSave, reconstruirS, limparSave,
  chaveSave, SAVE_KEY_LEGADO, CHAVE_MUNDO,
} from "../saveGame";
import { instalarWindowComStorage } from "./helpers/fakeLocalStorage";

let storage, restaurar;
beforeEach(() => {
  ({ storage, restaurar } = instalarWindowComStorage());
});
afterEach(() => {
  restaurar();
});

// ---------- fixtures ----------
// Elencos mínimos porém com o shape real (id/nome/pos/attr + campos do
// Marco 2: valor/valorRef/timeOrigem + origem dos dados reais).
const jogador = (id, nome, pos, attr, time) => ({
  id, nome, pos, attr, valor: attr * 2, valorRef: attr * 2, timeOrigem: time, origem: "copa10",
});

function fixtureAtiva() {
  const timeA = "Real União";
  const timeB = "Sereno FC";
  return {
    nomeTecnico: "Felyp",
    timeEscolhido: timeA,
    avatarId: "a03",
    S: {
      serie: "C",
      rodada: 5,
      calendario: [
        [{ casa: timeA, fora: timeB }],
        [{ casa: timeB, fora: timeA }],
      ],
      tabela: {
        [timeA]: { P: 10, J: 5, V: 3, E: 1, D: 1, GP: 14, GC: 8 },
        [timeB]: { P: 7, J: 5, V: 2, E: 1, D: 2, GP: 9, GC: 11 },
      },
      art: { 1: { nome: "Goleador", time: timeA, g: 6 } },
      fase: { [timeA]: 1.04, [timeB]: 0.96 },
      mult: { [timeA]: 1.1, [timeB]: 0.9 },
      elencos: {
        [timeA]: [
          jogador(1, "Goleador", "LIN", 78, timeA),
          jogador(2, "Paredão", "GOL", 74, timeA),
        ],
        [timeB]: [
          jogador(3, "Artilheiro B", "LIN", 71, timeB),
          jogador(4, "Muralha B", "GOL", 69, timeB),
        ],
      },
      orcamento: { [timeA]: 1240, [timeB]: 980 },
      mercado: {
        janela: "meio",
        janelaUsadaMeio: true,
        listados: [{ idJogador: 3, preco: 200 }],
        historico: [{ tipo: "compra", idJogador: 9, preco: 150 }],
        ofertas: [{ de: timeB, idJogador: 1, preco: 300 }], // NÃO persiste (schema §2)
      },
      torcida: { [timeA]: 620, [timeB]: 480 },
      torcidaRef: { [timeA]: 600, [timeB]: 500 },
      formaRecente: { [timeA]: ["V", "V", "E"], [timeB]: ["D", "E", "V"] },
      comentariosTorcida: [{ rodada: 5, humor: "feliz", texto: "Que fase!" }],
      // Estado leve das outras 2 séries (tabela ao vivo) — persiste como está.
      outrasSeries: {
        A: { rodada: 5, tabela: { "Time A1": { P: 9 } }, marcador: "estado-A" },
        B: { rodada: 5, tabela: { "Time B1": { P: 6 } }, marcador: "estado-B" },
      },
      // Copa presente na fixture = reconstruirS nunca cai no ramo aleatório
      // de iniciarCopa (determinismo do teste).
      copa: { faseAtual: 1, campeao: null, chaves: [{ a: timeA, b: timeB, vencedor: null }] },
    },
  };
}

describe("salvarJogo → carregarSave → reconstruirS (round-trip)", () => {
  it("preserva os campos críticos da carreira através do round-trip completo", () => {
    const fx = fixtureAtiva();
    expect(salvarJogo(fx)).toBe(true);

    const save = carregarSave("C");
    expect(save).not.toBeNull();

    // Identidade e metadados do save (schema v2 documentado em saveGame.js).
    expect(save.versao).toBe(2);
    expect(save.serie).toBe("C");
    expect(save.nomeTecnico).toBe("Felyp");
    expect(save.timeEscolhido).toBe("Real União");
    expect(save.avatarId).toBe("a03");
    expect(save.temporada.rodadaAtual).toBe(5);
    expect(save.temporada.calendario).toEqual(fx.S.calendario);
    expect(save.temporada.tabela).toEqual(fx.S.tabela);
    expect(save.temporada.artilharia).toEqual(fx.S.art);
    expect(save.temporada.fases).toEqual(fx.S.fase);
    expect(save.temporada.multiplicadoresInternos).toEqual(fx.S.mult);
    expect(save.orcamento).toEqual(fx.S.orcamento);
    expect(save.outrasSeries).toEqual(fx.S.outrasSeries);
    expect(save.copa).toEqual(fx.S.copa);
    // ultimaAtualizacao é gerado no salvar — ISO 8601 parseável.
    expect(typeof save.ultimaAtualizacao).toBe("string");
    expect(Number.isNaN(Date.parse(save.ultimaAtualizacao))).toBe(false);

    // Estado reconstruído é utilizável pelo motor, não só JSON igual.
    const S2 = reconstruirS(save, null);
    expect(S2.serie).toBe("C");
    expect(S2.rodada).toBe(5);
    expect(S2.tabela["Real União"].P).toBe(10);
    expect(S2.tabela["Sereno FC"].GC).toBe(11);
    expect(S2.art[1].g).toBe(6);
    expect(S2.fase["Real União"]).toBeCloseTo(1.04, 5);
    expect(S2.mult["Sereno FC"]).toBeCloseTo(0.9, 5);
    expect(S2.orcamento["Real União"]).toBe(1240);
    expect(S2.calendario.length).toBe(2);
    // Elencos: todos os jogadores, com atributos e campos do Marco 2 intactos.
    expect(S2.elencos["Real União"].map((j) => j.id)).toEqual([1, 2]);
    const goleador = S2.elencos["Real União"].find((j) => j.id === 1);
    expect(goleador.nome).toBe("Goleador");
    expect(goleador.pos).toBe("LIN");
    expect(goleador.attr).toBe(78);
    expect(goleador.valor).toBe(156);
    expect(goleador.valorRef).toBe(156);
    expect(goleador.timeOrigem).toBe("Real União");
    expect(goleador.origem).toBe("copa10");
    // Mercado: janela/estado persistem; `ofertas` NUNCA persiste (schema §2,
    // documentado no cabeçalho de saveGame.js) — recomeça vazio, por design.
    expect(S2.mercado.janela).toBe("meio");
    expect(S2.mercado.janelaUsadaMeio).toBe(true);
    expect(S2.mercado.listados).toEqual([{ idJogador: 3, preco: 200 }]);
    expect(S2.mercado.historico).toEqual([{ tipo: "compra", idJogador: 9, preco: 150 }]);
    expect(S2.mercado.ofertas).toEqual([]);
    // Torcida (apresentação) persiste.
    expect(S2.torcida["Real União"]).toBe(620);
    expect(S2.torcidaRef["Sereno FC"]).toBe(500);
    expect(S2.formaRecente["Real União"]).toEqual(["V", "V", "E"]);
    expect(S2.comentariosTorcida).toHaveLength(1);
    // Copa preservada exatamente (nenhum re-sorteio quando o campo existe).
    expect(S2.copa).toEqual(fx.S.copa);
    // Sem mundo (mundo=null): outrasSeries reconstruído vazio, por contrato
    // documentado em reconstruirS ("passe undefined fora do modo carreira").
    expect(S2.outrasSeries).toEqual({});
  });

  it("usa a chave específica da divisão e mantém saves de divisões isolados entre si", () => {
    const fxC = fixtureAtiva();
    salvarJogo(fxC);
    expect(storage.getItem(chaveSave("C"))).not.toBeNull();
    expect(storage.getItem(chaveSave("A"))).toBeNull();
    expect(storage.getItem(chaveSave("B"))).toBeNull();

    // Salva uma temporada da Série B — a da C não pode ser tocada.
    const fxB = fixtureAtiva();
    fxB.S = { ...fxB.S, serie: "B", rodada: 9 };
    const antesC = storage.getItem(chaveSave("C"));
    salvarJogo(fxB);
    expect(storage.getItem(chaveSave("C"))).toBe(antesC);
    expect(JSON.parse(storage.getItem(chaveSave("B"))).temporada.rodadaAtual).toBe(9);

    // carregarSave devolve cada divisão do seu próprio slot.
    expect(carregarSave("C").serie).toBe("C");
    expect(carregarSave("B").serie).toBe("B");
  });

  it("um save mínimo válido passa pelo round-trip com os fallbacks documentados", () => {
    // Menor estrutura aceita por validarSave: versao, temporada{calendario,
    // tabela}, elencos, timeEscolhido. Campos ausentes (orcamento, mercado,
    // torcida, copa...) caem nos defaults de reconstruirS — este teste fixa
    // esses fallbacks como contrato.
    const minimo = {
      versao: 2,
      serie: "C",
      timeEscolhido: "Real União",
      nomeTecnico: "",
      temporada: {
        rodadaAtual: 0,
        calendario: [[{ casa: "Real União", fora: "Sereno FC" }]],
        tabela: {
          "Real União": { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 },
          "Sereno FC": { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 },
        },
        artilharia: {},
        fases: { "Real União": 1, "Sereno FC": 1 },
        multiplicadoresInternos: { "Real União": 1, "Sereno FC": 1 },
      },
      elencos: {
        "Real União": [{ id: 1, nome: "Paredão", pos: "GOL", attr: 70 }],
        "Sereno FC": [{ id: 2, nome: "Muralha", pos: "GOL", attr: 68 }],
      },
    };
    storage.setItem(chaveSave("C"), JSON.stringify(minimo));
    const save = carregarSave("C");
    expect(save).not.toBeNull();

    const S2 = reconstruirS(save, null);
    // Fallbacks documentados no cabeçalho de reconstruirS:
    // valor = curva sobre attr; valorRef nasce = valor; timeOrigem = time atual.
    const p = S2.elencos["Real União"][0];
    expect(typeof p.valor).toBe("number");
    expect(p.valor).toBeGreaterThan(0);
    expect(p.valorRef).toBe(p.valor);
    expect(p.timeOrigem).toBe("Real União");
    // orcamento default por time; mercado fechado (rodada 0 <= metade).
    expect(typeof S2.orcamento["Real União"]).toBe("number");
    expect(S2.mercado.janela).toBe("fechada");
    expect(S2.mercado.janelaUsadaMeio).toBe(false);
    expect(S2.mercado.ofertas).toEqual([]);
    // torcida default; comentários vazios.
    expect(typeof S2.torcida["Real União"]).toBe("number");
    expect(S2.comentariosTorcida).toEqual([]);
    // Save mínimo sem copa: reconstruirS gera uma (ramo documentado). Só a
    // PRESENÇA é assertada — o sorteio é aleatório por design.
    expect(S2.copa).toBeTruthy();
  });

  it("carregar um save inexistente devolve null (fallback documentado), sem lançar", () => {
    expect(carregarSave("A")).toBeNull();
    expect(carregarSave("B")).toBeNull();
    // Save corrompido/incompleto também vira null, não exceção.
    storage.setItem(chaveSave("C"), JSON.stringify({ versao: 2 }));
    expect(carregarSave("C")).toBeNull();
  });

  it("não mutação: salvarJogo não altera o S de entrada; reconstruirS não altera o save carregado", () => {
    const fx = fixtureAtiva();
    const fotografiaS = JSON.parse(JSON.stringify(fx.S));
    salvarJogo(fx);
    expect(fx.S).toEqual(fotografiaS);

    const save = carregarSave("C");
    const fotografiaSave = JSON.parse(JSON.stringify(save));
    reconstruirS(save, null);
    expect(save).toEqual(fotografiaSave);
  });

  it("funciona sem Supabase, sem rede e sem tocar em chaves alheias (ranking/conquistas)", () => {
    // Chaves de outros domínios pré-existentes — o save NÃO pode tocá-las.
    storage.setItem("legends-manager:conquistas-v1", JSON.stringify({ campeao: { em: "2026-01-01" } }));
    const conquistasAntes = storage.getItem("legends-manager:conquistas-v1");

    const fx = fixtureAtiva();
    salvarJogo(fx);
    const save = carregarSave("C");
    reconstruirS(save, null);
    limparSave("C");

    expect(storage.getItem("legends-manager:conquistas-v1")).toBe(conquistasAntes);
    // Inventário completo: só as chaves esperadas passaram pelo storage.
    expect(storage.chaves().sort()).toEqual(["legends-manager:conquistas-v1"]);
    // E nenhuma chave de mundo/legado foi criada por engano no round-trip.
    expect(storage.getItem(CHAVE_MUNDO)).toBeNull();
    expect(storage.getItem(SAVE_KEY_LEGADO)).toBeNull();
  });
});
