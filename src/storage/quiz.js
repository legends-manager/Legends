// src/storage/quiz.js
// Quiz de curiosidades de futebol: aparece raramente ao fim de uma rodada
// (chance baixa, ⚙️ calibrável), resposta certa dá um dinheirinho modesto.
// Camada de apresentação + economia leve — não mexe no motor de simulação
// (não altera atributo, força interna, Poisson, mando ou fase). Errar não
// penaliza; é só um bônus de engajamento, não uma fonte de renda relevante.
export const CHANCE_QUIZ = 0.25; // ⚙️ por rodada concluída
export const PREMIO_MIN = 20; // L$ ⚙️
export const PREMIO_MAX = 40; // L$ ⚙️

export const PERGUNTAS = [
  { pergunta: "Quantas vezes o Brasil já foi campeão da Copa do Mundo?", opcoes: ["3", "4", "5", "6"], correta: 2 },
  { pergunta: "Em quantos jogadores por lado é disputado o futebol de campo tradicional (11 vs 11)?", opcoes: ["9", "10", "11", "12"], correta: 2 },
  { pergunta: "Qual país sediou a primeira Copa do Mundo, em 1930?", opcoes: ["Brasil", "Uruguai", "Itália", "França"], correta: 1 },
  { pergunta: "Quantos minutos dura o tempo normal de uma partida de futebol (sem prorrogação)?", opcoes: ["80", "90", "100", "120"], correta: 1 },
  { pergunta: "Qual jogador é o maior artilheiro da história das Copas do Mundo?", opcoes: ["Pelé", "Ronaldo Fenômeno", "Miroslav Klose", "Just Fontaine"], correta: 2 },
  { pergunta: "Quantos jogadores titulares uma equipe de Fut7 (society de 7) coloca em campo, goleiro incluso?", opcoes: ["5", "6", "7", "8"], correta: 2 },
  { pergunta: "Qual cor de cartão suspende o jogador da partida imediatamente?", opcoes: ["Amarelo", "Vermelho", "Azul", "Verde"], correta: 1 },
  { pergunta: "Em que ano o Brasil sediou a Copa do Mundo pela última vez (até 2026)?", opcoes: ["1950", "2014", "2002", "1970"], correta: 1 },
  { pergunta: "Qual é o nome do estádio mais famoso do Rio de Janeiro, palco de finais históricas?", opcoes: ["Mineirão", "Maracanã", "Morumbi", "Beira-Rio"], correta: 1 },
  { pergunta: "Quantos pontos vale uma vitória no sistema de pontos corridos usado no Brasileirão?", opcoes: ["1", "2", "3", "5"], correta: 2 },
  { pergunta: "Qual seleção venceu a primeira Copa do Mundo da história (1930)?", opcoes: ["Brasil", "Argentina", "Uruguai", "Itália"], correta: 2 },
  { pergunta: "Quem é considerado o \"Rei do Futebol\", tricampeão mundial pelo Brasil?", opcoes: ["Zico", "Pelé", "Romário", "Garrincha"], correta: 1 },
  { pergunta: "Qual competição de clubes sul-americana é apelidada de \"Libertadores\"?", opcoes: ["Copa Sul-Americana", "Copa Libertadores da América", "Recopa Sul-Americana", "Copa América"], correta: 1 },
  { pergunta: "Em uma cobrança de pênalti, a que distância do gol fica a marca?", opcoes: ["9 metros", "11 metros", "13 metros", "16 metros"], correta: 1 },
  { pergunta: "Qual jogador brasileiro venceu a Bola de Ouro em 1994 e 1997?", opcoes: ["Rivaldo", "Romário", "Ronaldo Fenômeno (1997)", "Ronaldinho Gaúcho"], correta: 2 },
  { pergunta: "Quantas Copas do Mundo a Alemanha já conquistou (até 2022)?", opcoes: ["2", "3", "4", "5"], correta: 2 },
  { pergunta: "Qual é o termo usado quando um jogador marca 3 gols na mesma partida?", opcoes: ["Dobradinha", "Hat-trick", "Pêntagol", "Combo"], correta: 1 },
  { pergunta: "Em que continente fica a Kings League, competição de futebol 7 criada por streamers?", opcoes: ["América do Sul", "Europa", "África", "Ásia"], correta: 1 },
  { pergunta: "Qual seleção sul-americana venceu mais Copas América na história?", opcoes: ["Brasil", "Argentina", "Uruguai", "Chile"], correta: 1 },
  { pergunta: "Quantos árbitros assistentes (bandeirinhas) uma partida oficial de campo costuma ter, além do árbitro principal?", opcoes: ["1", "2", "3", "4"], correta: 1 },
  { pergunta: "Qual posição costuma ser a única que pode usar as mãos dentro da própria grande área?", opcoes: ["Zagueiro", "Lateral", "Goleiro", "Volante"], correta: 2 },
  { pergunta: "Em que cidade paulista fica o Morumbi, estádio do São Paulo FC?", opcoes: ["Campinas", "São Paulo", "Santos", "Sorocaba"], correta: 1 },
  { pergunta: "Qual país venceu a Copa do Mundo de 2022, no Catar?", opcoes: ["França", "Croácia", "Argentina", "Marrocos"], correta: 2 },
  { pergunta: "No futebol, o que significa a sigla VAR?", opcoes: ["Vídeo Árbitro Reserva", "Assistente de Vídeo Árbitro", "Verificação Automática de Regras", "Visão de Árbitro Remoto"], correta: 1 },
];

// Evita repetir a MESMA pergunta duas vezes seguidas (`ultimaPergunta` = a
// string da pergunta anterior, ou null). Sorteia índice de resposta certa
// embaralhando as opções, pra não decorar "a certa é sempre a opção X".
export function sortearPergunta(ultimaPergunta = null) {
  const pool = ultimaPergunta ? PERGUNTAS.filter((p) => p.pergunta !== ultimaPergunta) : PERGUNTAS;
  const base = pool[Math.floor(Math.random() * pool.length)];
  const indices = base.opcoes.map((_, i) => i).sort(() => Math.random() - 0.5);
  return {
    pergunta: base.pergunta,
    opcoes: indices.map((i) => base.opcoes[i]),
    correta: indices.indexOf(base.correta),
  };
}

export function sorteiaSeAparece() {
  return Math.random() < CHANCE_QUIZ;
}

export function sortearPremio() {
  return PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
}
