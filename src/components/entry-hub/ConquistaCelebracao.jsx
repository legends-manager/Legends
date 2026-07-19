// src/components/entry-hub/ConquistaCelebracao.jsx
// Celebração de insígnia desbloqueada — tela cheia, não um toast (Fase 1c do
// PLANO_MESTRE_LEGENDS_LIMEIRA.md, inspirada na tela "Subir de nível" do
// FIFA Heroes referenciada por Felyp). Fica por cima de qualquer tela,
// pausa a navegação até o toque em "Continuar" — a única ação possível é
// fechar; nada de gameplay acontece aqui.
import { useEffect } from "react";
import { conquistaPorId, carregarConquistas } from "../../storage/conquistas";
import { gerarCardInsignia, compartilharCard } from "../../share/cards";
import { tocarSomTier } from "../../storage/audio";
import InsigniaBadge from "../InsigniaBadge";
import { cores, corTier, botaoPrimario, botaoSecundario } from "./estilos";

const TIER_LABEL = { comum: "Comum", raro: "Raro", epico: "Épico", lendario: "Lendário" };

export default function ConquistaCelebracao({ conquistaId, onFechar, mudo }) {
  const c = conquistaPorId(conquistaId);
  // Som por raridade (Fase 3 item 10): dispara uma vez, quando a tela
  // aparece — hook precisa vir ANTES do early return pra não violar a
  // regra dos hooks se `c` vier nulo (conquistaId desconhecido).
  useEffect(() => {
    if (c) tocarSomTier(c.tier, mudo);
  }, [conquistaId]); // eslint-disable-line
  if (!c) return null;
  const cor = corTier[c.tier];

  // Compartilhar (F-ideias jul/2026): gera o card PNG e abre a folha nativa
  // (WhatsApp incluso) — contexto (clube) vem do que foi salvo no desbloqueio.
  const compartilhar = async (e) => {
    e.stopPropagation();
    const contexto = carregarConquistas()[conquistaId] || {};
    const canvas = await gerarCardInsignia({
      emoji: c.emoji, titulo: c.titulo, desc: c.desc, tier: c.tier, clube: contexto.clube,
    });
    compartilharCard(canvas, `legends-insignia-${c.id}`, "Insígnia desbloqueada — Legends Manager");
  };

  // Fundo de arena (Fase 3, GPT Image) só nos tiers altos — comum/raro
  // ficam no scrim liso de sempre, energia reservada pros momentos raros.
  const temFundo = c.tier === "epico" || c.tier === "lendario";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{
        background: temFundo
          ? `linear-gradient(rgba(10,12,14,0.75), rgba(10,12,14,0.9)), url(/fundos/celebracao-poster.webp)`
          : "rgba(10,12,14,0.92)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={onFechar}
      role="button"
      tabIndex={0}
    >
      <div className="text-center" style={{ maxWidth: 320 }}>
        <div style={{ ...eyebrowCentro, color: cor }}>Insígnia desbloqueada</div>
        <div className="mx-auto mt-5" style={{ width: 128 }}>
          <InsigniaBadge tier={c.tier} emoji={c.emoji} size={128} />
        </div>
        <div className="mt-5 font-black italic" style={{ fontSize: 26, color: cores.textPrimary }}>
          {c.titulo}
        </div>
        <div className="mt-1 font-bold text-xs uppercase tracking-widest" style={{ color: cor }}>
          {TIER_LABEL[c.tier]}
        </div>
        <p className="mt-3 text-sm" style={{ color: cores.textSecondary }}>
          {c.desc}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onFechar(); }}
          className="w-full mt-7 px-4"
          style={{ ...botaoPrimario, paddingTop: 12, paddingBottom: 12 }}
        >
          Continuar
        </button>
        <button
          onClick={compartilhar}
          className="w-full mt-2 px-4"
          style={{ ...botaoSecundario, paddingTop: 10, paddingBottom: 10 }}
        >
          Compartilhar no grupo
        </button>
      </div>
    </div>
  );
}

const eyebrowCentro = {
  fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
};
