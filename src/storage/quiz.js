// src/storage/quiz.js
// Quiz de curiosidades de futebol: aparece raramente ao fim de uma rodada
// (chance baixa, ⚙️ calibrável), resposta certa dá um dinheirinho modesto.
// Camada de apresentação + economia leve — não mexe no motor de simulação
// (não altera atributo, força interna, Poisson, mando ou fase). Errar não
// penaliza; é só um bônus de engajamento, não uma fonte de renda relevante.
export const CHANCE_QUIZ = 0.25; // ⚙️ por rodada concluída
export const PREMIO_MIN = 20; // L$ ⚙️
export const PREMIO_MAX = 40; // L$ ⚙️

// Nível recalibrado (pedido do Felyp, jul/2026): perguntas triviais ("quantos
// jogadores tem um time?") saíram; entram fatos que exigem conhecimento real —
// todos públicos, estáveis (nada dependente de temporada corrente) e conferíveis.
export const PERGUNTAS = [
  { pergunta: "Qual jogador é o maior artilheiro da história das Copas do Mundo, com 16 gols?", opcoes: ["Pelé", "Ronaldo Fenômeno", "Miroslav Klose", "Just Fontaine"], correta: 2 },
  { pergunta: "Qual clube tem mais títulos da Copa Libertadores da história?", opcoes: ["Boca Juniors", "Independiente", "Peñarol", "River Plate"], correta: 1 },
  { pergunta: "Quem é o maior artilheiro da história da Seleção Brasileira masculina em jogos oficiais?", opcoes: ["Pelé", "Neymar", "Romário", "Ronaldo Fenômeno"], correta: 1 },
  { pergunta: "Em que ano o Brasileirão adotou o formato de pontos corridos?", opcoes: ["1998", "2000", "2003", "2006"], correta: 2 },
  { pergunta: "Qual foi a maior goleada da história em fase final de Copa do Mundo?", opcoes: ["Alemanha 7x1 Brasil", "Hungria 10x1 El Salvador", "Iugoslávia 9x0 Zaire", "Hungria 9x0 Coreia do Sul"], correta: 1 },
  { pergunta: "O gol mais rápido da história das Copas foi de Hakan Şükür (2002). Aos quantos segundos?", opcoes: ["8", "11", "15", "23"], correta: 1 },
  { pergunta: "Quem foi o primeiro jogador da história a disputar 5 Copas do Mundo?", opcoes: ["Lothar Matthäus", "Antonio Carbajal", "Rafael Márquez", "Gianluigi Buffon"], correta: 1 },
  { pergunta: "Qual foi a primeira seleção africana a chegar às quartas de final de uma Copa?", opcoes: ["Nigéria", "Camarões", "Senegal", "Gana"], correta: 1 },
  { pergunta: "Em que ano uma Copa do Mundo foi transmitida pela TV pela primeira vez?", opcoes: ["1950", "1954", "1958", "1962"], correta: 1 },
  { pergunta: "Qual clube venceu o primeiro Mundial de Clubes organizado pela FIFA, em 2000?", opcoes: ["Real Madrid", "Corinthians", "Vasco da Gama", "Manchester United"], correta: 1 },
  { pergunta: "Qual seleção perdeu duas finais de Copa seguidas, em 1974 e 1978?", opcoes: ["Alemanha", "Holanda", "Itália", "Hungria"], correta: 1 },
  { pergunta: "Qual clube inglês terminou a Premier League 2003-04 invicto, os \"Invencíveis\"?", opcoes: ["Manchester United", "Chelsea", "Arsenal", "Liverpool"], correta: 2 },
  { pergunta: "Quem é o maior artilheiro da história da Champions League?", opcoes: ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"], correta: 1 },
  { pergunta: "Qual foi o último brasileiro a vencer a Bola de Ouro?", opcoes: ["Ronaldinho Gaúcho", "Kaká", "Rivaldo", "Neymar"], correta: 1 },
  { pergunta: "Qual seleção tem mais títulos de Copa América (até 2024)?", opcoes: ["Brasil", "Uruguai", "Argentina", "Chile"], correta: 2 },
  { pergunta: "Em que ano a FIFA foi fundada?", opcoes: ["1894", "1904", "1916", "1930"], correta: 1 },
  { pergunta: "Qual seleção eliminou o Brasil na Copa do Mundo de 2022, nos pênaltis?", opcoes: ["Argentina", "França", "Croácia", "Marrocos"], correta: 2 },
  { pergunta: "Qual é o nome do prêmio dado ao artilheiro de cada Copa do Mundo?", opcoes: ["Bola de Ouro", "Chuteira de Ouro", "Luva de Ouro", "Troféu Gerd Müller"], correta: 1 },
  { pergunta: "Quantas Copas do Mundo o Uruguai venceu?", opcoes: ["1", "2", "3", "4"], correta: 1 },
  { pergunta: "Pela regra oficial, qual o número MÍNIMO de jogadores pra uma equipe de campo seguir na partida?", opcoes: ["5", "6", "7", "8"], correta: 2 },
  { pergunta: "Quantos gols Pelé marcou em Copas do Mundo?", opcoes: ["8", "10", "12", "14"], correta: 2 },
  { pergunta: "O estádio \"La Bombonera\" é a casa de qual clube?", opcoes: ["River Plate", "Boca Juniors", "Racing", "San Lorenzo"], correta: 1 },
  { pergunta: "Quem é o maior garçom (assistências) da história das Copas do Mundo?", opcoes: ["Maradona", "Pelé", "Zidane", "Messi"], correta: 1 },
  { pergunta: "\"La Mano de Dios\" e o \"Gol do Século\" de Maradona (1986) saíram na mesma partida. Contra quem?", opcoes: ["Alemanha", "Inglaterra", "Itália", "Bélgica"], correta: 1 },
  { pergunta: "Quantas Copas do Mundo a Itália venceu?", opcoes: ["2", "3", "4", "5"], correta: 2 },
  { pergunta: "Qual seleção venceu a Eurocopa de 2016?", opcoes: ["França", "Alemanha", "Portugal", "Espanha"], correta: 2 },
  { pergunta: "Em que ano o profissionalismo foi oficializado no futebol brasileiro?", opcoes: ["1920", "1933", "1941", "1950"], correta: 1 },
  { pergunta: "Quem venceu a primeira Bola de Ouro da história, em 1956?", opcoes: ["Alfredo Di Stéfano", "Stanley Matthews", "Ferenc Puskás", "Raymond Kopa"], correta: 1 },
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
