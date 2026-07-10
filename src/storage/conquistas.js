// src/storage/conquistas.js
// Conquistas locais (dica 2 da pesquisa de mercado): badges que dão meta e
// memória pro single-player, guardadas em localStorage — fora do save por
// série e fora do mundo ("Novo jogo" apaga a carreira, não as medalhas do
// técnico). Camada 100% de apresentação: nada aqui alimenta o motor.
const CHAVE = "legends-manager:conquistas-v1";

export const CONQUISTAS = [
  { id: "primeira-vitoria", emoji: "🥇", titulo: "Primeira vitória", desc: "Vença sua primeira partida." },
  { id: "goleada", emoji: "🔥", titulo: "Goleada", desc: "Vença por 5+ gols de diferença." },
  { id: "campeao", emoji: "🏆", titulo: "Campeão", desc: "Seja campeão de qualquer série." },
  { id: "acesso", emoji: "🔼", titulo: "Acesso!", desc: "Suba de divisão com seu time." },
  { id: "serie-a", emoji: "👑", titulo: "Entre os grandes", desc: "Dispute uma partida na Série A." },
  { id: "tri", emoji: "💎", titulo: "Tricampeão", desc: "Conquiste 3 títulos na carreira." },
];

export function carregarConquistas() {
  try {
    const raw = window.localStorage.getItem(CHAVE);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Desbloqueia (idempotente). Retorna true só na PRIMEIRA vez — quem chama
// decide se mostra aviso.
export function desbloquear(id) {
  try {
    const c = carregarConquistas();
    if (c[id]) return false;
    c[id] = { em: new Date().toISOString() };
    window.localStorage.setItem(CHAVE, JSON.stringify(c));
    return true;
  } catch (e) {
    return false;
  }
}
