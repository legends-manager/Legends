// src/data/tecnicos.js
// Técnico convidado (ideia aprovada pelo Felyp, jul/2026): cada time da IA
// tem um técnico FICTÍCIO com nome, estilo e provocações — camada 100% de
// apresentação (manchetes/pré-jogo). Nenhum nome real: são personagens
// inventados, sem relação com pessoas da liga (elencos reais continuam
// intocáveis; isto é só tempero de narrativa).
// O estilo NÃO revela força interna — é personalidade, não atributo.

export const TECNICOS = {
  // Série C
  "Real União": { nome: "Seu Barros", estilo: "veterano calculista" },
  "Real Elite": { nome: "Dudu Malta", estilo: "motivador incansável" },
  "Sereno FC": { nome: "Profeta Lima", estilo: "zen até o apito final" },
  "Sem Limites": { nome: "Turbo Teixeira", estilo: "ataque total" },
  "Canelas": { nome: "Canhoto Régis", estilo: "raiz, prancheta de papel" },
  "Marselha FC": { nome: "Monsieur Tavares", estilo: "estiloso na beira do campo" },
  "Nordeste FC": { nome: "Cabra Josué", estilo: "garra acima de tudo" },
  "Racha FC": { nome: "Pereba Silva", estilo: "futebol de várzea com orgulho" },
  "Puro Osso": { nome: "Magrão Duarte", estilo: "defesa de ferro" },
  "Kissassa": { nome: "Rei Momo Nascimento", estilo: "festa e futebol" },
  "Fortaleza": { nome: "Muralha Bezerra", estilo: "ninguém passa" },
  "Dragon Bola FC": { nome: "Mestre Kame Oliveira", estilo: "treino, treino e treino" },
  // Série B
  "Ousadia FC": { nome: "Loko Vargas", estilo: "imprevisível por natureza" },
  "A.E. Dallas": { nome: "Xerife Amaral", estilo: "disciplina texana" },
  "Quebrada F.C": { nome: "Mano Griffo", estilo: "futebol de rua refinado" },
  "Villa City": { nome: "Lorde Peçanha", estilo: "posse de bola elegante" },
  "Tigres": { nome: "Garra Medeiros", estilo: "pressão o jogo inteiro" },
  "FORZA F.C": { nome: "Comandante Bruni", estilo: "intensidade italiana" },
  "Benfica": { nome: "Velho Águia Costa", estilo: "tradição e raça" },
  "PH FC": { nome: "Doutor Prado", estilo: "cada jogada calculada" },
  "Lanús": { nome: "Hermano Quintero", estilo: "malícia sul-americana" },
  "Nação NH": { nome: "Pastor Eduardo", estilo: "fé no contra-ataque" },
  // Série A
  "Furia FC": { nome: "General Franco Dias", estilo: "guerra em cada lance" },
  "G3X FC": { nome: "Gamer Toledo", estilo: "estatística e frieza" },
  "Fluxo FC": { nome: "MC Betão", estilo: "vestiário sempre animado" },
  "Nyvelados FC": { nome: "Nivelador Antunes", estilo: "equilíbrio obsessivo" },
  "DesimpaiN": { nome: "Sensei Kuroda", estilo: "disciplina silenciosa" },
  "Podpah Funkbol Clube": { nome: "Locutor Farias", estilo: "fala mais que treina" },
  "Dibrados FC": { nome: "Ginga Moreira", estilo: "drible até no aquecimento" },
  "Dendele FC": { nome: "Chef Baiano", estilo: "tempero no futebol" },
  "Capim FC": { nome: "Jardineiro Neves", estilo: "cuida do gramado e do time" },
  "LOUD SC": { nome: "Streamer Falcão", estilo: "jogo pra torcida ver" },
};

const PROVOCACOES = [
  (adv) => `"Respeito o ${adv}, mas quem manda no jogo somos nós."`,
  (adv) => `"O ${adv} que se prepare — a gente não veio passear."`,
  (adv) => `"Já assisti os jogos do ${adv}. Não perco sono, não."`,
  (adv) => `"Contra o ${adv}? Três pontos. Anota aí."`,
  (adv) => `"O ${adv} joga bonito... até tomar o primeiro gol."`,
  (adv) => `"Meu time tá voando. Pena que o ${adv} vai sentir isso na pele."`,
];

// Provocação do técnico adversário antes do jogo — determinística por
// rodada (mesma frase se recarregar a tela; muda a cada rodada).
export function provocacaoDoTecnico(timeAdversario, meuTime, rodada) {
  const t = TECNICOS[timeAdversario];
  if (!t) return null;
  const frase = PROVOCACOES[(rodada + timeAdversario.length) % PROVOCACOES.length](meuTime);
  return { tecnico: t.nome, estilo: t.estilo, frase };
}
