// src/storage/conquistas.js
// Conquistas locais (dica 2 da pesquisa de mercado, promovida a Fase 1c do
// PLANO_MESTRE_LEGENDS_LIMEIRA.md — sistema de insígnias estilo Pokémon GO):
// badges que dão meta e memória pro single-player, guardadas em localStorage
// — fora do save por série e fora do mundo ("Novo jogo" apaga a carreira,
// não as medalhas do técnico). Camada 100% de apresentação: nada aqui
// alimenta o motor.
//
// Tiers (jul/2026): comum → raro → épico → lendário, com tratamento visual
// crescente (ver entry-hub/estilos.js corTier / glowTier). "Da C ao Topo" é
// a lendária de estreia — decisão travada: começar com QUALQUER clube da
// Série C e ser campeão da Série A com o MESMO clube.
const CHAVE = "legends-manager:conquistas-v1";

export const TIERS = ["comum", "raro", "epico", "lendario"];

export const CONQUISTAS = [
  { id: "primeira-vitoria", emoji: "🥇", titulo: "Primeira vitória", desc: "Vença sua primeira partida.", tier: "comum" },
  { id: "primeira-temporada", emoji: "📅", titulo: "Primeira temporada", desc: "Complete sua primeira temporada.", tier: "comum" },
  { id: "primeira-contratacao", emoji: "🤝", titulo: "Primeira contratação", desc: "Compre seu primeiro jogador no mercado.", tier: "comum" },
  { id: "goleada", emoji: "🔥", titulo: "Goleada", desc: "Vença por 5+ gols de diferença.", tier: "raro" },
  { id: "acesso", emoji: "🔼", titulo: "Acesso!", desc: "Suba de divisão com seu time.", tier: "raro" },
  { id: "serie-a", emoji: "👑", titulo: "Entre os grandes", desc: "Dispute uma partida na Série A.", tier: "raro" },
  { id: "artilheiro-temporada", emoji: "⚡", titulo: "Artilheiro", desc: "Termine a temporada com o artilheiro do seu time.", tier: "raro" },
  { id: "campeao", emoji: "🏆", titulo: "Campeão", desc: "Seja campeão de qualquer série.", tier: "epico" },
  { id: "campeao-copa", emoji: "🏆", titulo: "Campeão da Copa", desc: "Vença a copa mata-mata cruzando as 3 séries.", tier: "epico" },
  { id: "tri", emoji: "💎", titulo: "Tricampeão", desc: "Conquiste 3 títulos na carreira.", tier: "lendario" },
  { id: "da-c-ao-topo", emoji: "🐆", titulo: "Da C ao Topo", desc: "Comece na Série C e seja campeão da Série A com o mesmo clube.", tier: "lendario" },
  // Insígnias do patrocinador (Delícias da Ana, jul/2026 — ideia do Felyp:
  // o dono do patrocinador é dono do Kissassa). Arte própria da marca em
  // InsigniaBadge.jsx (IMG_CONQUISTA, não a arte genérica por tier) — o
  // `tier` aqui só decide o fallback de cor/glow se a imagem falhar e a
  // posição no "mais raras" do Ranking.
  { id: "patrocinio-kissassa-c", emoji: "🍰", titulo: "Campeão com o Kissassa", desc: "Seja campeão da Série C com o Kissassa — o time do nosso patrocinador.", tier: "raro" },
  { id: "patrocinio-kissassa-b", emoji: "🍰", titulo: "Campeão com o Kissassa (Série B)", desc: "Seja campeão da Série B com o Kissassa.", tier: "epico" },
  { id: "patrocinio-kissassa-a", emoji: "🍰", titulo: "Campeão com o Kissassa (Série A)", desc: "Seja campeão da Série A com o Kissassa — o topo da liga.", tier: "lendario" },
];

export const conquistaPorId = (id) => CONQUISTAS.find((c) => c.id === id);

export function carregarConquistas() {
  try {
    const raw = window.localStorage.getItem(CHAVE);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Desbloqueia (idempotente). Retorna true só na PRIMEIRA vez — quem chama
// decide se mostra celebração. `contexto` (opcional): { clube, temporada } —
// registra em que carreira/temporada a insígnia saiu, como o decisão travada
// pede ("data, clube e contexto da carreira").
export function desbloquear(id, contexto = {}) {
  try {
    const c = carregarConquistas();
    if (c[id]) return false;
    c[id] = { em: new Date().toISOString(), ...contexto };
    window.localStorage.setItem(CHAVE, JSON.stringify(c));
    return true;
  } catch (e) {
    return false;
  }
}
