// src/data/lendas.js
// Lendas dos Pacotinhos (Fase 3 item 9, PLANO_MESTRE §4.4) — jogadores
// FICTÍCIOS de altíssimo nível, com biografia própria no espírito da liga
// (mesmo tom debochado/caloroso do narrador Felyp Phelps e dos técnicos
// convidados). Decisão travada (jul/2026, ver memória de sessão): nomes
// reais de craques famosos (Pelé, Ronaldinho, Maldini…) foram recusados —
// risco de imagem de terceiro que nem o Felyp pode dispensar sozinho.
// Lendas fictícias entregam a mesma emoção de "puxar um lendário" sem
// tocar em ninguém de verdade.
// attr no teto da escala (45–92, ver engine/atributos.js) — são os
// melhores jogadores que existem no universo do jogo, ponto.
export const LENDAS = [
  {
    id: "rei-da-vila",
    nome: "\"Rei da Vila\" Anacleto",
    pos: "ATA",
    attr: 92,
    bio: "Diz a lenda que ele driblou seis zagueiros, o bandeirinha e o próprio técnico do time adversário numa tarde de domingo na Vila, e ainda pediu desculpa educadamente antes de encher o gol. Nunca perdeu um pênalti — inclusive um que ele mesmo cobrou duas vezes porque o goleiro pediu bis.",
  },
  {
    id: "muralha-do-horizonte",
    nome: "\"Muralha do Horizonte\" Bezerra",
    pos: "GOL",
    attr: 92,
    bio: "Passou uma temporada inteira sem sofrer gol — e ainda reclamava que os atacantes adversários estavam \"facilitando\". Corre a história (não confirmada, mas ninguém desmente) de que uma bomba de fora da área bateu na trave, voltou, bateu nele e ele pegou de cochilo.",
  },
  {
    id: "foguinho-eterno",
    nome: "\"Foguinho Eterno\" Nascimento",
    pos: "MEI",
    attr: 91,
    bio: "Tinha um passe tão preciso que os companheiros diziam que a bola \"vinha com endereço\". Aposentou-se depois de dar uma assistência de calcanhar, sem olhar, pro próprio zagueiro que tinha subido pro ataque — ninguém mais quis jogar depois de ver aquilo, achavam que já tinha visto tudo.",
  },
  {
    id: "dona-do-meio",
    nome: "\"Dona do Meio\" Karina Aguiar",
    pos: "MEI",
    attr: 90,
    bio: "Ditava o ritmo do jogo inteiro com um cigarro apagado atrás da orelha (nunca acendeu, juram que era só estilo). Roubava bola de adversário com um olhar. Depois que se aposentou, times pediam pra ela só \"passar perto do campo\" pra intimidar o adversário.",
  },
  {
    id: "flecha-negra",
    nome: "\"Flecha Negra\" Wanderley",
    pos: "ATA",
    attr: 91,
    bio: "Corria tão rápido que o cronômetro da Arena Novo Horizonte, dizem, travou duas vezes tentando marcar o tempo dele até o gol. Fez um gol em 4 segundos de jogo — direto da saída de bola — e o locutor da época nem tinha ligado o microfone ainda.",
  },
  {
    id: "paredao-serrano",
    nome: "\"Paredão Serrano\" Otávio",
    pos: "DEF",
    attr: 91,
    bio: "Zagueiro tão grande que os atacantes adversários pediam pra jogar em outro horário. Nunca levou cartão amarelo — não porque não desarmava com força, mas porque o árbitro tinha medo de ir até ele com o cartão na mão.",
  },
  {
    id: "sombra-da-lateral",
    nome: "\"Sombra da Lateral\" Getúlio",
    pos: "DEF",
    attr: 90,
    bio: "Ninguém nunca viu ele chegar pro jogo — só percebiam que ele já estava lá, marcando o ponta adversário, quando a bola rolava. Fez tantas assistências de lateral que a torcida começou a chamá-lo de \"o outro camisa 10\", pra raiva do camisa 10 de verdade.",
  },
  {
    id: "trovao-de-limeira",
    nome: "\"Trovão de Limeira\" Adalberto",
    pos: "ATA",
    attr: 92,
    bio: "Batia tão forte que um chute dele arrebentou a rede do gol — a Arena teve que trocar a trave inteira. Diziam que quando ele pisava na bola pra bater falta, os goleiros adversários já começavam a rezar antes mesmo dele encostar.",
  },
  {
    id: "regente-camisa-8",
    nome: "\"Regente\" Camisa 8 Marimbondo",
    pos: "MEI",
    attr: 90,
    bio: "Comandava o time inteiro só com gestos de mão, tipo maestro — dizem que a torcida aprendeu a entender os gestos antes dos próprios companheiros de time. Jamais perdeu uma final. Jamais disputou uma sem ganhar antes de começar, no olhar.",
  },
  {
    id: "guardiao-eterno",
    nome: "\"Guardião Eterno\" Severino",
    pos: "GOL",
    attr: 90,
    bio: "Defendeu um pênalti batido tão forte que a bola voltou pro meio-campo sozinha. Nunca comemorou uma defesa — dizia que \"defender é o mínimo\", o que deixava os atacantes adversários ainda mais desesperados.",
  },
  {
    id: "furacao-alvinegro",
    nome: "\"Furacão Alvinegro\" Deividson",
    pos: "ATA",
    attr: 90,
    bio: "Driblava tanto que os próprios companheiros de time perdiam a paciência gritando \"toca, toca!\" — e ele tocava, no ângulo, pro fundo do gol. Fez uma temporada inteira sendo o artilheiro E o assistente-líder ao mesmo tempo, o que até hoje ninguém explicou como é matematicamente possível.",
  },
  {
    id: "capitao-de-ferro",
    nome: "\"Capitão de Ferro\" Wellington",
    pos: "DEF",
    attr: 90,
    bio: "Jogou uma temporada inteira com o braço quebrado e ninguém percebeu até ele mesmo contar, no churrasco de fim de ano. Zagueiro-artilheiro: fazia mais gol de cabeça em bola parada do que muito atacante fazia jogando.",
  },
];

export function lendaPorId(id) {
  return LENDAS.find((l) => l.id === id);
}
