// src/data/elencos-reais.js
// =============================================================================
// Elencos REAIS da Série C — Legends Liga Fut7 (Limeira-SP)
// Fonte: Copa10, páginas individuais dos 12 times, extraídas em 06/07/2026
// (após a rodada 1). Total: 196 jogadores.
//
// PRIVACIDADE: o Copa10 exibia CPF junto de um jogador; foi REMOVIDO e não
// deve ser reintroduzido em hipótese alguma.
//
// NORMALIZAÇÃO: capitalização dos nomes foi padronizada (o site tem grafias
// mistas, ex. "Samuel lucena de farias"). Conteúdo dos nomes não foi alterado.
//
// CONFERÊNCIA (bloqueante antes do lançamento): Felyp valida os elencos —
// nomes, times e posições — antes de soltar o link no grupo. Item do checklist.
//
// Campos por jogador:
//   nome  -> nome real
//   pos   -> grupo usado pelo jogo: GOL | DEF | MEI | ATA
//   pos10 -> posição original no Copa10 (GOL/ZAG/LD/LE/VOL/MC/MD/ME/MEI/SA/PD/PE/ATA)
//            "NA" = sem posição no Copa10; o grupo foi atribuído aqui e é editável
//   g, a, mvp -> gols, assistências e prêmios de craque na rodada 1 (viés de atributo)
//   origem -> 'real' (todos, nesta versão)
//
// Mapeamento pos10 -> pos:  ZAG/LD/LE -> DEF · VOL/MC/MD/ME/MEI -> MEI · SA/PD/PE/ATA -> ATA
//
// Regras de elenco (decisões travadas):
//   - Tamanho VARIÁVEL por time (11 a 18 aqui). Nada de cortar ou inventar jogador.
//   - Mínimo funcional: >=7 jogadores e >=1 GOL (todos os 12 atendem).
//   - Times com apenas 1 goleiro NÃO têm troca de goleiro no intervalo
//     (regra "goleiro só por goleiro"): Real União, Sereno FC, Marselha FC,
//     Nordeste FC, Fortaleza, Dragon Bola FC.
//   - Fortaleza veio sem posições no Copa10 (só o goleiro); linha distribuída
//     aqui usando as estatísticas como pista (tudo pos10:"NA", editável).
// =============================================================================

const J = (nome, pos, pos10, g = 0, a = 0, mvp = 0) => ({ nome, pos, pos10, g, a, mvp, origem: "real" });

export const ELENCOS_REAIS = {
  "Real União": [
    J("Dieniton da Silva Constâncio", "GOL", "GOL", 0, 1, 0),
    J("Bruno dos Santos Trindade", "DEF", "ZAG"),
    J("Flávio da Silva Junior", "DEF", "ZAG"),
    J("Alison Henrique Araújo Ferreira", "DEF", "ZAG"),
    J("Gustavo Oliveira", "DEF", "ZAG", 1, 0, 0),
    J("Victor de Oliveira", "MEI", "MEI"),
    J("Gabriel Oliveira", "MEI", "MEI"),
    J("Breno Henry Alves Manoel", "MEI", "MEI", 0, 2, 0),
    J("Lucas Henrique Verdeiro", "MEI", "MEI"),
    J("Victor Henrique Medina Pascoalino", "MEI", "MEI"),
    J("Maikon Henrique da Silva Santos", "MEI", "MEI", 1, 0, 0),
    J("Samuel Henrique Souza de Oliveira", "MEI", "MEI"),
    J("Gabriel Felipe Ferreira", "MEI", "MEI", 2, 0, 1),
    J("Jefferson Allan Penteado", "ATA", "ATA"),
    J("Leonardo Vinicius Dias", "ATA", "ATA", 0, 1, 0),
    J("Victor Hugo da Costa Martins", "ATA", "ATA"),
    J("Luiz Carlos Rocha Campelo da Silva", "ATA", "ATA"),
  ],

  "Real Elite": [
    J("Gleyson", "GOL", "GOL"),
    J("Renan", "GOL", "GOL"),
    J("Luis", "GOL", "GOL"),
    J("Marcio", "DEF", "NA"),
    J("Thierry", "DEF", "ZAG", 0, 1, 0),
    J("Leandro", "DEF", "ZAG"),
    J("Cleiton", "DEF", "LD", 2, 1, 0),
    J("Mateus", "DEF", "LE"),
    J("José", "MEI", "NA"),
    J("Kaique", "MEI", "VOL", 1, 0, 0),
    J("Heliabe", "MEI", "MC"),
    J("Willyan", "MEI", "MD"),
    J("Breno", "MEI", "MEI"),
    J("Felipe", "MEI", "MEI"),
    J("Thiago", "ATA", "NA"),
    J("Clenilson", "ATA", "ATA"),
    J("Paulo Henrique", "ATA", "ATA"),
  ],

  "Sereno FC": [
    J("Lucas Oliveira da Silva", "GOL", "GOL"),
    J("Jean Marcel Ferreira da Silva", "DEF", "ZAG"),
    J("Guilherme Henrique Caferro Carneiro", "DEF", "ZAG"),
    J("Júlio César da Silva Santos", "DEF", "ZAG"),
    J("Antônio Carlos da Silva Junior", "DEF", "ZAG"),
    J("Higor Guedes Maia", "MEI", "ME"),
    J("Henrique Roberto Batista", "MEI", "ME", 1, 0, 0),
    J("Marcelo Alencar", "MEI", "ME"),
    J("Claudiney do Nascimento Souza", "MEI", "ME"),
    J("Wildney Maia Ribeiro", "MEI", "ME"),
    J("Ramon Rodrigo da Silva", "MEI", "MEI", 0, 1, 0),
    J("Leandro da Mota Alves", "MEI", "MEI", 2, 0, 0),
    J("Cleiton Santos Gonçalves", "ATA", "ATA"),
    J("Leandro de Freitas Cabral", "ATA", "ATA"),
  ],

  "Sem Limites": [
    J("Francisco Marcelo de Souza", "GOL", "GOL"),
    J("Odair José Ivo", "GOL", "GOL"),
    J("Samuel Lucena de Farias", "DEF", "ZAG", 2, 1, 1),
    J("Wellington Pereira Pinto", "DEF", "ZAG"),
    J("Caio Fernando de Oliveira", "DEF", "ZAG", 0, 1, 0),
    J("João Carlos Trindade", "DEF", "ZAG"),
    J("Alysson Oliveira de Lima", "MEI", "MC", 1, 1, 0),
    J("Nathaniel Santos da Silva", "MEI", "MC", 1, 0, 0),
    J("Matheus Rocha Zacarias", "MEI", "MEI", 1, 0, 0),
    J("Derick Gustavo Souza", "MEI", "MEI"),
    J("Allysson Souza de Almeida", "ATA", "SA"),
    J("Sergio Pinheiro Leite", "ATA", "SA", 1, 1, 0),
    J("João Carlos Aparecido dos Santos Silva", "ATA", "SA"),
    J("Rafael Alex Fernandes dos Anjos", "ATA", "ATA"),
    J("André Monteiro dos Santos", "ATA", "ATA", 1, 0, 0),
    J("Leonardo Henrique Bonfogo", "ATA", "ATA", 1, 0, 0),
  ],

  "Canelas": [
    J("Maze", "GOL", "GOL"),
    J("Luiz Henrique", "GOL", "GOL"),
    J("Marcos Henrique", "DEF", "NA"),
    J("Silas Junior", "DEF", "ZAG"),
    J("Murilo Henrique", "DEF", "ZAG"),
    J("Allan Junior", "DEF", "ZAG"),
    J("Antônio Wirlan Souza dos Santos", "DEF", "ZAG"),
    J("Francisco Thiago", "MEI", "MEI"),
    J("Allison Alves", "MEI", "MEI", 0, 3, 0),
    J("Matheus Leandro", "MEI", "MEI"),
    J("Pedro Lopes", "MEI", "MEI"),
    J("Gustavo Oliveira", "MEI", "MEI"),
    J("Richard Santos", "MEI", "MEI"),
    J("Jhonatan Gonçalves", "ATA", "ATA"),
    J("Guilherme Ricardo", "ATA", "ATA"),
    J("Cauã Rodrigues", "ATA", "ATA", 2, 0, 0),
    J("Vital Faustino", "ATA", "ATA", 1, 0, 0),
    J("Felipe Silva Damico", "ATA", "ATA"),
  ],

  "Marselha FC": [
    J("Leonardo Santi de Araujo", "GOL", "GOL"),
    J("Mateus de Almeida Costa", "DEF", "ZAG"),
    J("Victor Manuel Alves do Nascimento", "DEF", "ZAG", 1, 0, 0),
    J("Luiz Fernando de Souza", "MEI", "MC", 1, 1, 0),
    J("Maxwell Gomes Maia", "MEI", "MC"),
    J("Henrique Santana Santos", "MEI", "MC", 1, 0, 0),
    J("Caio Felipe Guerra", "MEI", "MC", 1, 0, 0),
    J("Murilo Oliveira", "MEI", "MD"),
    J("José Natanael Soares Pereira", "ATA", "ATA", 0, 2, 0),
    J("Iago Roberto Lopes dos Santos", "ATA", "ATA"),
    J("Ricardo Alexandre Theodoro Correia", "ATA", "ATA"),
  ],

  "Nordeste FC": [
    J("Valdecir Gomes de Oliveira", "GOL", "GOL"),
    J("Izael Carlos da Silva", "DEF", "ZAG"),
    J("José Charles Batista", "DEF", "ZAG"),
    J("Harry", "DEF", "ZAG"),
    J("Matheus Bortolan Leal", "DEF", "ZAG"),
    J("Vinicius Gabriel dos Santos", "MEI", "VOL", 0, 1, 0),
    J("Hugo Deleon da Silva Gonçalves", "MEI", "VOL", 1, 3, 0),
    J("Luciano", "MEI", "VOL"),
    J("Ery Almeida dos Santos", "MEI", "MC"),
    J("Matheus Felipe da Silva Ribeiro", "MEI", "MEI"),
    J("Ryan Oliveira da Conceição", "ATA", "PD"),
    J("Cauan Arcanjo de Santana", "ATA", "PD"),
    J("Lincoln Nascimento Campos de Lima", "ATA", "PE", 3, 1, 1),
    J("Patrick da Silva Mendes", "ATA", "ATA", 1, 0, 0),
    J("Ariberto Willami da Silva Almeida", "ATA", "ATA"),
    J("Raí Marques da Cruz", "ATA", "ATA"),
  ],

  "Racha FC": [
    J("Diego", "GOL", "GOL"),
    J("Estevão", "GOL", "GOL", 0, 1, 0),
    J("Roberto Alexandre", "DEF", "ZAG"),
    J("Gabriel Oliveira", "DEF", "ZAG", 0, 1, 0),
    J("Deyvison", "DEF", "ZAG"),
    J("Matheus Rosa", "DEF", "ZAG"),
    J("Willian Cavalcante", "DEF", "ZAG"),
    J("Rhuan", "MEI", "VOL"),
    J("Wesley", "MEI", "VOL", 0, 2, 0),
    J("Jhonata", "MEI", "VOL"),
    J("Matheus Henrique", "MEI", "MC"),
    J("Matheus", "MEI", "MD"),
    J("Samuel", "MEI", "MD", 1, 0, 1),
    J("Paulo Henrique", "MEI", "ME", 1, 0, 0),
    J("Thierry", "MEI", "ME", 2, 0, 0),
    J("Ithalo", "MEI", "ME"),
    J("Walter Lemes", "ATA", "ATA", 2, 2, 0),
    J("Ryan Costa", "ATA", "ATA"),
  ],

  // Fortaleza: Copa10 só marcava a posição do goleiro. A distribuição de linha
  // abaixo foi atribuída aqui (pos10:"NA"), usando as estatísticas como pista.
  "Fortaleza": [
    J("Riquelme Costa Sena", "GOL", "GOL", 0, 0, 1),
    J("Henrique Rodrigues", "DEF", "NA"),
    J("Etory Enrique Furlan", "DEF", "NA"),
    J("Luan dos Santos", "DEF", "NA"),
    J("Bruno Henrique dos Santos", "DEF", "NA"),
    J("Gabriel Henrique Sampaio", "DEF", "NA"),
    J("Victor Gabriel Ribeiro de Jesus", "MEI", "NA", 0, 2, 0),
    J("Vinicius dos Santos Pereira", "MEI", "NA"),
    J("Diego Faria", "MEI", "NA"),
    J("Márcio Guilherme Campos Barbosa", "MEI", "NA"),
    J("Arnaldinho Almeida Melo", "MEI", "NA"),
    J("Yago dos Santos Cardoso", "MEI", "NA"),
    J("Jonathan da Silva", "ATA", "NA", 1, 1, 0),
    J("Leandro Oliveira de Liz", "ATA", "NA", 3, 2, 0),
    J("Diego Henrique", "ATA", "NA", 1, 0, 0),
    J("Adriano Andrade de Jesus", "ATA", "NA"),
  ],

  "Dragon Bola FC": [
    J("Victor Hugo Kray de Oliveira", "GOL", "GOL"),
    J("José Edson de Jesus Santana", "DEF", "ZAG"),
    J("Rodrigo de Souza", "DEF", "ZAG"),
    J("Ramieri Porsolino", "DEF", "ZAG"),
    J("Emerson Domingos Paulo", "DEF", "ZAG"),
    J("Fernando Grego", "DEF", "ZAG"),
    J("Vitor Moisés de Aguiar Rezende", "MEI", "VOL"),
    J("Yuri Antônio Souza", "MEI", "VOL"),
    J("Maycon de Souza Oliveira", "MEI", "VOL"),
    J("José Rodolfo Luciano da Silva", "MEI", "VOL"),
    J("Leandro César Lúcio", "MEI", "ME", 2, 1, 0),
    J("Vítor Gabriel de Castro", "MEI", "ME"),
    J("Vitor Fernando Alves", "MEI", "ME"),
    J("Gabriel dos Santos Chagas", "MEI", "MEI", 1, 0, 0),
    J("Caio Felipe Alves da Silva", "ATA", "PD"),
    J("Rogério da Silva Moura", "ATA", "ATA"),
    J("Kevin Fermino dos Santos", "ATA", "ATA"),
    J("Vitor Hugo Moreira de Lima", "ATA", "ATA"),
  ],

  "Kissassa": [
    J("Eduardo Henrique Silvério Brito", "GOL", "GOL"),
    J("Ademir Gonçalves Dias Filho", "GOL", "GOL"),
    J("Wellington Silva", "DEF", "ZAG"),
    J("Jhonatan", "DEF", "ZAG"),
    J("Ricardo de Arruda", "DEF", "ZAG"),
    J("Sergio Santiago", "DEF", "ZAG", 0, 1, 0),
    J("Jonathan Gomes", "DEF", "ZAG"),
    J("Bruno", "MEI", "VOL"),
    J("Danyllo Campos", "MEI", "VOL", 1, 0, 0),
    J("José Ricardo Santos", "MEI", "MC"),
    J("Miguel", "MEI", "MC"),
    J("Natan", "MEI", "MC"),
    J("Matheus", "MEI", "MD"),
    J("Luan Danilo Finati", "ATA", "ATA", 1, 0, 0),
    J("Leo Vitor", "ATA", "ATA"),
    J("Yuri Santos", "ATA", "ATA"),
    J("Richard Bernardo", "ATA", "ATA"),
  ],

  "Puro Osso": [
    J("José Felipe", "GOL", "GOL"),
    J("João Guilherme", "GOL", "GOL"),
    J("Kauan Rocha", "DEF", "ZAG"),
    J("Kauan Capivara", "DEF", "ZAG", 0, 1, 0),
    J("Evandro", "DEF", "LE"),
    J("Henrique", "MEI", "MC"),
    J("Victor Henrique Santos", "MEI", "MC"),
    J("Gustavo Ribeiro", "MEI", "MC"),
    J("Higor", "MEI", "MC"),
    J("Victor Gabriel", "MEI", "MEI"),
    J("Erike", "MEI", "MEI"),
    J("Cauã Henrique", "ATA", "PD", 0, 1, 0),
    J("Vitor Cunha", "ATA", "PD"),
    J("Walace Gustavo", "ATA", "PE"),
    J("Matheus Henrique", "ATA", "ATA"),
    J("Matheus Pietro", "ATA", "ATA", 1, 0, 0),
    J("Luis Felipe", "ATA", "ATA"),
    J("Igor", "ATA", "ATA", 1, 0, 0),
  ],
};

// Ordem oficial dos 12 times (grafias como no Copa10).
// Obs.: o v3 do projeto dizia "Dragon Bol"; a página oficial usa "Dragon Bola FC".
export const TIMES_SERIE_C = [
  "Real União", "Real Elite", "Sereno FC", "Sem Limites", "Canelas", "Marselha FC",
  "Nordeste FC", "Racha FC", "Puro Osso", "Kissassa", "Fortaleza", "Dragon Bola FC",
];

// Resultados reais da rodada 1 (contexto/conferência — não usados pelo simulador):
// Sereno FC 3x4 Real União · Canelas 3x3 Real Elite · Sem Limites 8x4 Marselha FC
// Kissassa 2x5 Nordeste FC · Racha FC 6x2 Puro Osso · Fortaleza 5x3 Dragon Bola FC
