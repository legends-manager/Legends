// src/data/patrocinadoresCamisa.js
// Patrocínio de uniforme (jul/2026, ideia do Felyp): a camisa de cada time
// tem 2 espaços, igual futebol de verdade — peito (patrocinador MÁSTER,
// grande, vendável por time) e manga/ombro (FORNECEDOR de material, menor,
// o mesmo pra todo mundo). Configuração pura — o componente Camisa.jsx só
// lê daqui, nunca decide sozinho quem patrocina o quê.

// Fornecedor oficial de material esportivo — fixo pros 32 times (Sport+,
// é quem fornece as camisas de verdade da liga).
export const FORNECEDOR_CAMISA = {
  nome: "Sport+",
  logo: "/fornecedores/sportmais.webp",
};

// Patrocinador máster por time — vazio por padrão (o espaço fica "à venda",
// mostrado como disponível na tela de Uniforme). Dono do Delícias da Ana é
// também dono do Kissassa (decisão do Felyp, jul/2026): o Kissassa já sai
// com o espaço ocupado.
export const PATROCINADOR_MASTER = {
  "Kissassa": { nome: "Delícias da Ana", logo: "/brand/patrocinio.png" },
};

export function patrocinadorMasterDoTime(time) {
  return PATROCINADOR_MASTER[time] || null;
}
