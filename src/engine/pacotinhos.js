// src/engine/pacotinhos.js
// Pacotinhos de fim de temporada (Fase 3 item 9, PLANO_MESTRE §4.4).
// Momento único por temporada: escolha ritual entre 6 pacotes visualmente
// idênticos (a escolha não muda a chance — é ritual, não estratégia).
// Conteúdo: 1 jogador gerado por raridade sorteada.
//
// Trava de balanceamento (decisão explícita do plano): o prêmio SÓ entra
// no elenco na temporada seguinte (App.jsx injeta depois de novaTemporada).
// Como o motor já regenera elencos do zero a cada temporada (nada persiste
// entre temporadas pra ninguém, nem compras de mercado), o jogador do
// pacotinho dura exatamente 1 temporada "de graça" — a mesma trava que o
// plano pedia (idade/contrato de 1 temporada), só que a régua já existia
// no motor, não precisou de mecanismo novo.
import { LENDAS } from "../data/lendas";
import { valorInicial } from "./mercado";

export const RARIDADES = [
  { id: "comum", peso: 0.70, faixaAttr: [55, 65] },
  { id: "raro", peso: 0.20, faixaAttr: [66, 75] },
  { id: "epico", peso: 0.08, faixaAttr: [76, 85] },
  { id: "lendario", peso: 0.02, faixaAttr: null }, // vem de LENDAS, não gerado
];

const PRIMEIROS_NOMES = [
  "Bruno", "Caio", "Diego", "Emerson", "Fábio", "Gustavo", "Hélio", "Igor",
  "João", "Kaique", "Lucas", "Marcelo", "Nathan", "Otávio", "Paulo",
  "Rafael", "Sérgio", "Thiago", "Vinícius", "Wesley",
];
const SOBRENOMES = [
  "Alves", "Barbosa", "Cardoso", "Dutra", "Ferraz", "Gomes", "Henrique",
  "Lopes", "Martins", "Nogueira", "Oliveira", "Pereira", "Ramos", "Souza",
  "Teixeira", "Vieira",
];
// Distribuição de posição dos prospectos gerados: menos goleiro (times só
// trocam 1), mais linha — espelha a demanda real de um elenco.
const POSICOES_PESO = [["GOL", 0.12], ["DEF", 0.32], ["MEI", 0.32], ["ATA", 0.24]];

function escolherPorPeso(lista, chavePeso, rng) {
  const total = lista.reduce((s, x) => s + x[chavePeso], 0);
  let r = rng() * total;
  for (const x of lista) { r -= x[chavePeso]; if (r <= 0) return x; }
  return lista[lista.length - 1];
}

export function sortearRaridade(rng = Math.random) {
  const r = escolherPorPeso(RARIDADES, "peso", rng);
  return r.id;
}

function gerarNomeProspecto(rng) {
  const p = PRIMEIROS_NOMES[Math.floor(rng() * PRIMEIROS_NOMES.length)];
  const s = SOBRENOMES[Math.floor(rng() * SOBRENOMES.length)];
  return `${p} ${s}`;
}

function gerarProspecto(raridadeId, rng) {
  const r = RARIDADES.find((x) => x.id === raridadeId);
  const [min, max] = r.faixaAttr;
  const attr = Math.round(min + rng() * (max - min));
  const pos = escolherPorPeso(POSICOES_PESO.map(([pos, peso]) => ({ pos, peso })), "peso", rng).pos;
  const valor = valorInicial(attr);
  return {
    id: `pacotinho-${raridadeId}-${Date.now()}-${Math.floor(rng() * 100000)}`,
    nome: gerarNomeProspecto(rng),
    pos,
    attr,
    valor, valorRef: valor,
    g: 0, a: 0,
    origem: "pacotinho",
  };
}

// Abre 1 pacotinho: sorteia raridade e gera o jogador (ou puxa uma lenda,
// se `lendarioForcado` não vier null — usado só em teste/depuração).
// `lendaId` (C2.3, PLANO_GAMEFEEL_AAA §5): id ORIGINAL da lenda em
// data/lendas.js, só presente pra raridade "lendario" — permite ao chamador
// registrar a coleção (Álbum de Lendas) sem precisar fazer parsing do id
// sintético do jogador (que carrega o timestamp de quando foi puxado).
export function abrirPacotinho(rng = Math.random) {
  const raridade = sortearRaridade(rng);
  if (raridade === "lendario") {
    const lenda = LENDAS[Math.floor(rng() * LENDAS.length)];
    const valor = valorInicial(lenda.attr);
    return {
      raridade,
      lendaId: lenda.id,
      jogador: { ...lenda, id: `pacotinho-lendario-${lenda.id}-${Date.now()}`, valor, valorRef: valor, g: 0, a: 0, origem: "pacotinho-lendario" },
    };
  }
  return { raridade, jogador: gerarProspecto(raridade, rng) };
}

export const RARIDADE_LABEL = { comum: "Comum", raro: "Raro", epico: "Épico", lendario: "Lendário" };
