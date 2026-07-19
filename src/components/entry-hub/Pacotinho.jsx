// src/components/entry-hub/Pacotinho.jsx
// Pacotinho de fim de temporada (Fase 3 item 9, PLANO_MESTRE §4.4): 1
// escolha ritual entre 6 pacotes visualmente idênticos — a escolha não
// muda a chance, é ritual (estilo "baú" do FIFA Heroes referenciado por
// Felyp: antecipação antes da revelação). Sorteio acontece de verdade no
// clique (engine/pacotinhos.js via App.jsx:escolherPacotinho), aqui é só
// a apresentação das 3 fases: escolha → antecipação → revelação.
import { useState } from "react";
import { RARIDADE_LABEL } from "../../engine/pacotinhos";
import { tocarSomTier } from "../../storage/audio";
import { cores, superficie, superficie2, botaoPrimario, corTier, glowTier, eyebrowLime } from "./estilos";

const EMOJI_RARIDADE = { comum: "📦", raro: "📦", epico: "📦", lendario: "📦" };
// Mascote GPT Image (Fase 3): só nos tiers altos — comum/raro ficam sem,
// pra não banalizar a arte num sorteio que sai 90% das vezes. Ouro
// reservado ao lendário (mesma regra do resto do app).
const MASCOTE_RARIDADE = { epico: "/mascote/comemorando-lime.webp", lendario: "/mascote/comemorando-ouro.webp" };

export default function Pacotinho({ pacotinhoPendente, escolherPacotinho, mudo }) {
  const [fase, setFase] = useState(pacotinhoPendente ? "guardado" : "escolha");
  const [resultado, setResultado] = useState(pacotinhoPendente || null);

  const escolher = () => {
    const r = escolherPacotinho();
    setResultado(r);
    setFase("antecipacao");
  };

  if (fase === "escolha") {
    return (
      <div className="mt-4">
        <span style={eyebrowLime}>Pacotinho da temporada</span>
        <p className="text-xs mt-1 mb-2" style={{ color: cores.textSecondary }}>
          Escolhe 1 — todos têm a mesma chance, é só ritual. O prêmio entra no seu elenco na
          próxima temporada.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <button
              key={i}
              onClick={escolher}
              className="rounded-xl py-4 flex items-center justify-center text-3xl active:opacity-70"
              style={{ ...superficie, border: `1px solid ${cores.steel}` }}
            >
              📦
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (fase === "antecipacao") {
    return (
      <div className="mt-4">
        <span style={eyebrowLime}>Pacotinho da temporada</span>
        <button
          onClick={() => { tocarSomTier(resultado.raridade, mudo); setFase("revelado"); }}
          className="w-full rounded-2xl py-8 mt-2 flex flex-col items-center gap-2 active:opacity-80"
          style={{ ...superficie, border: `1px solid ${corTier[resultado.raridade]}`, ...glowTier(resultado.raridade) }}
        >
          <span className="text-5xl">{EMOJI_RARIDADE[resultado.raridade]}</span>
          <span className="font-black italic" style={{ color: corTier[resultado.raridade] }}>TOQUE PRA ABRIR</span>
        </button>
      </div>
    );
  }

  if (fase === "revelado") {
    const { jogador, raridade } = resultado;
    const cor = corTier[raridade];
    const mascote = MASCOTE_RARIDADE[raridade];
    return (
      <div className="mt-4">
        <span style={eyebrowLime}>Pacotinho da temporada</span>
        <div className="rounded-2xl p-5 mt-2 text-center" style={{ ...superficie, border: `2px solid ${cor}`, ...glowTier(raridade) }}>
          {mascote && (
            <div
              className="overflow-hidden mx-auto mb-3"
              style={{ width: 140, height: 175, borderRadius: 14, border: `2px solid ${cor}` }}
            >
              <img src={mascote} alt="" className="w-full h-full block" style={{ objectFit: "cover", objectPosition: "50% 15%" }} />
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: cor }}>
            {RARIDADE_LABEL[raridade]}
          </div>
          <div className="text-xl font-black italic mt-1">{jogador.nome}</div>
          <div className="text-sm mt-1" style={{ color: cores.textSecondary }}>
            {jogador.pos} · atributo {jogador.attr}
          </div>
          {jogador.bio && (
            <p className="text-xs mt-3 text-left" style={{ color: cores.textSecondary }}>{jogador.bio}</p>
          )}
          <div className="text-xs mt-3" style={{ color: cores.textMuted }}>
            Entra no seu elenco na próxima temporada.
          </div>
        </div>
        <button
          onClick={() => setFase("guardado")}
          className="w-full rounded-xl py-3 font-bold mt-2"
          style={botaoPrimario}
        >
          Continuar
        </button>
      </div>
    );
  }

  // fase === "guardado": confirmação compacta, sem mais toque.
  const { jogador, raridade } = resultado;
  return (
    <div className="mt-4">
      <span style={eyebrowLime}>Pacotinho da temporada</span>
      <div
        className="rounded-xl px-3 py-2.5 mt-2 flex items-center gap-2"
        style={{ ...superficie2, border: `1px solid ${corTier[raridade]}` }}
      >
        <span className="text-xl">📦</span>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate">{jogador.nome}</div>
          <div className="text-xs" style={{ color: cores.textMuted }}>
            {RARIDADE_LABEL[raridade]} · entra no elenco na próxima temporada
          </div>
        </div>
      </div>
    </div>
  );
}
