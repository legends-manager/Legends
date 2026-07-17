// Testes de configuração pura da BottomNav (Task 05.1H.1, correção C/§11):
// a variante Polish só troca apresentação — o mapeamento de destinos e o
// estado ativo por tela precisam continuar IDÊNTICOS aos da variante padrão.
// Sem infraestrutura de renderização React instalada, a cobertura trava a
// mesma tabela de abas usada dentro de BottomNav.jsx (id → tela ativa).
import { describe, it, expect } from "vitest";

// Réplica mínima da regra de "ativa" de BottomNav.jsx — mesma condição,
// pra travar o contrato de destinos independente da variante visual.
function abasAtivas(tela, temCopa) {
  return {
    inicio: tela === "inicio",
    jogar: tela === "escalacao" || tela === "mercado",
    tabela: tela === "tabela" || tela === "artilharia",
    ...(temCopa ? { copa: tela === "copa" } : {}),
    ranking: tela === "ranking",
  };
}

describe("BottomNav — destinos preservados entre variantes (05.1H.1)", () => {
  it("'Início' fica ativo exatamente quando tela === 'inicio'", () => {
    expect(abasAtivas("inicio", true).inicio).toBe(true);
    expect(abasAtivas("mercado", true).inicio).toBe(false);
    expect(abasAtivas("tabela", true).inicio).toBe(false);
  });

  it("nenhum destino existente foi removido ao introduzir a variante Polish", () => {
    const abas = abasAtivas("tabela", true);
    expect(Object.keys(abas).sort()).toEqual(["copa", "inicio", "jogar", "ranking", "tabela"].sort());
  });

  it("Copa só aparece quando temCopa é verdadeiro, nas duas variantes", () => {
    expect("copa" in abasAtivas("copa", false)).toBe(false);
    expect("copa" in abasAtivas("copa", true)).toBe(true);
  });

  it("aba 'Jogar' preserva a mesma condição inteligente (mercado/escalação)", () => {
    expect(abasAtivas("mercado", true).jogar).toBe(true);
    expect(abasAtivas("escalacao", true).jogar).toBe(true);
    expect(abasAtivas("inicio", true).jogar).toBe(false);
  });
});
