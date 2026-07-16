// Testes de regressão da migração pro mundo persistente (Task 05.1G, lacuna
// apontada na auditoria 05.1F): `migrarParaMundoSeNecessario` é quem decide,
// na abertura do app, se o jogador entra em modo carreira (Liga Viva) — o
// slice visual 05.1H depende diretamente desse resultado pra escolher entre
// "Entry sem carreira" e "Entry carreira existente". Também cobre a migração
// da chave legada (save-v1 → save-v2:C) feita por carregarSave.
//
// Autoridade = comportamento atual do repositório (saveGame.js + mundo.js):
//  - prioridade de divisão segue ORDEM_SERIES = ["A", "B", "C"] (o loop de
//    migrarParaMundoSeNecessario percorre nessa ordem e para no 1º save);
//  - mundo já existente é devolvido intacto (idempotência);
//  - sem save e sem mundo → null, nada é criado;
//  - o save de origem NÃO é apagado pela migração (só a chave legada muda
//    de lugar, dentro de carregarSave).
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  migrarParaMundoSeNecessario, carregarMundo, salvarMundo, carregarSave,
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

// Save v2 válido mínimo pra uma divisão qualquer (shape aceito por validarSave).
function saveValido(serie, time) {
  return {
    versao: 2,
    serie,
    timeEscolhido: time,
    nomeTecnico: "Felyp",
    temporada: {
      rodadaAtual: 3,
      calendario: [[{ casa: time, fora: "Adversário FC" }]],
      tabela: { [time]: { P: 6, J: 3, V: 2, E: 0, D: 1, GP: 7, GC: 4 } },
      artilharia: {},
      fases: { [time]: 1 },
      multiplicadoresInternos: { [time]: 1 },
    },
    elencos: { [time]: [{ id: 1, nome: "Paredão", pos: "GOL", attr: 70 }] },
  };
}

describe("migrarParaMundoSeNecessario (mundo persistente / Liga Viva)", () => {
  it("cria o mundo persistente a partir de um save existente, exatamente uma vez", () => {
    storage.setItem(chaveSave("C"), JSON.stringify(saveValido("C", "Real União")));

    const mundo = migrarParaMundoSeNecessario();
    expect(mundo).not.toBeNull();
    // Preservados do save de origem: clube gerenciado + divisão dele.
    expect(mundo.meuTime).toBe("Real União");
    expect(mundo.divisao["Real União"]).toBe("C");
    // Derivados/default de mundoInicial (NÃO vêm do save — distinção exigida
    // pela ordem da tarefa): temporada 1, histórico e hall vazios.
    expect(mundo.temporada).toBe(1);
    expect(mundo.carreira).toEqual([]);
    expect(mundo.historicoAcesso).toEqual([]);
    expect(mundo.hallCampeoes).toEqual([]);
    expect(mundo.recordes).toEqual({});
    // Persistido de verdade na chave do mundo.
    expect(JSON.parse(storage.getItem(CHAVE_MUNDO)).meuTime).toBe("Real União");
    // O save de origem permanece intacto — migrar não apaga a temporada.
    expect(carregarSave("C")).not.toBeNull();
    expect(carregarSave("C").temporada.rodadaAtual).toBe(3);
  });

  it("é idempotente: mundo já existente é devolvido intacto, sem entrada duplicada na carreira", () => {
    const mundoExistente = {
      temporada: 4,
      divisao: { "Real União": "B" },
      meuTime: "Real União",
      carreira: [{ temporada: 3, serie: "C", time: "Real União", posicao: 1, resultado: "subiu" }],
      historicoAcesso: [{ temporada: 3 }],
      hallCampeoes: [{ temporada: 3, C: "Real União" }],
      recordes: { maiorGoleada: { gc: 8, gf: 1 } },
    };
    salvarMundo(mundoExistente);
    // Um save também presente NÃO pode disparar recriação do mundo.
    storage.setItem(chaveSave("B"), JSON.stringify(saveValido("B", "Real União")));
    const fotografia = storage.getItem(CHAVE_MUNDO);

    const r1 = migrarParaMundoSeNecessario();
    const r2 = migrarParaMundoSeNecessario();
    expect(r1).toEqual(mundoExistente);
    expect(r2).toEqual(mundoExistente);
    expect(r1.carreira).toHaveLength(1); // nenhuma duplicação de histórico
    expect(storage.getItem(CHAVE_MUNDO)).toBe(fotografia); // byte a byte igual
  });

  it("sem save e sem mundo: devolve null e não fabrica carreira nenhuma", () => {
    const resultado = migrarParaMundoSeNecessario();
    expect(resultado).toBeNull();
    expect(carregarMundo()).toBeNull();
    expect(storage.getItem(CHAVE_MUNDO)).toBeNull();
    expect(storage.chaves()).toEqual([]); // nenhuma chave criada por engano
  });

  it("com saves em várias divisões, segue a prioridade atual: ORDEM_SERIES (A antes de B antes de C)", () => {
    // Regra documentada: o loop percorre ORDEM_SERIES = ["A","B","C"] e usa
    // o PRIMEIRO save encontrado. Com A e C presentes, vence a Série A.
    storage.setItem(chaveSave("C"), JSON.stringify(saveValido("C", "Time da C")));
    storage.setItem(chaveSave("A"), JSON.stringify(saveValido("A", "Time da A")));

    const mundo = migrarParaMundoSeNecessario();
    expect(mundo.meuTime).toBe("Time da A");
    expect(mundo.divisao["Time da A"]).toBe("A");
    // O save da C continua lá, intocado — só não foi o escolhido.
    expect(carregarSave("C").timeEscolhido).toBe("Time da C");
  });

  it("migra a chave legada (save-v1) pro slot da Série C e cria o mundo a partir dela", () => {
    // Save v1 (pré-Marco 2): sem `serie`, sem orcamento/mercado — carregarSave
    // move pra chave v2 da C e remove a legada; a migração de mundo consome
    // esse resultado normalmente.
    const legado = {
      versao: 1,
      timeEscolhido: "Real União",
      nomeTecnico: "Felyp",
      temporada: {
        rodadaAtual: 12,
        calendario: [[{ casa: "Real União", fora: "Sereno FC" }]],
        tabela: { "Real União": { P: 24, J: 12, V: 8, E: 0, D: 4, GP: 30, GC: 18 } },
        artilharia: {},
        fases: { "Real União": 1 },
        multiplicadoresInternos: { "Real União": 1 },
      },
      elencos: { "Real União": [{ id: 1, nome: "Paredão", pos: "GOL", attr: 70 }] },
    };
    storage.setItem(SAVE_KEY_LEGADO, JSON.stringify(legado));

    const mundo = migrarParaMundoSeNecessario();
    expect(mundo).not.toBeNull();
    expect(mundo.meuTime).toBe("Real União");
    expect(mundo.divisao["Real União"]).toBe("C");
    // Chave legada removida; slot v2 da C ganhou o save com serie="C".
    expect(storage.getItem(SAVE_KEY_LEGADO)).toBeNull();
    const migrado = JSON.parse(storage.getItem(chaveSave("C")));
    expect(migrado.serie).toBe("C");
    expect(migrado.temporada.rodadaAtual).toBe(12);
  });

  it("não toca em chaves de outros domínios (conquistas) nem chama qualquer sistema online", () => {
    // saveGame.js não importa supabase/publicarOnline — a prova observável é
    // que a migração funciona sem window.fetch, sem env e sem rede, e que o
    // inventário final de chaves contém APENAS o esperado.
    storage.setItem("legends-manager:conquistas-v1", JSON.stringify({ acesso: { em: "2026-06-01" } }));
    storage.setItem(chaveSave("C"), JSON.stringify(saveValido("C", "Real União")));

    migrarParaMundoSeNecessario();

    expect(JSON.parse(storage.getItem("legends-manager:conquistas-v1"))).toEqual({ acesso: { em: "2026-06-01" } });
    expect(storage.chaves().sort()).toEqual([
      CHAVE_MUNDO,
      "legends-manager:conquistas-v1",
      chaveSave("C"),
    ].sort());
  });
});
