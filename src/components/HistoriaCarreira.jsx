// src/components/HistoriaCarreira.jsx
// Liga Viva (spec-liga-viva.md §6): lista as temporadas do jogador — série,
// time, posição, subiu/desceu/permaneceu.
// Reskin "Polish Language v1" (jul/2026, Fase 1a): grafite/lime; setas
// success/danger em vez de emoji.
// Fase 1c: galeria de insígnias com cor/glow por tier (comum→lendário);
// bloqueadas ficam em silhueta (opacidade baixa, sem cor de tier) — desejo
// visível reforça retenção, sem revelar o emoji de conquistas muito raras
// antes da hora (o emoji de cada conquista é dado de conteúdo em
// storage/conquistas.js).
import { SERIES } from "../data/series";
import { CONQUISTAS, carregarConquistas } from "../storage/conquistas";
import InsigniaBadge from "./InsigniaBadge";
import {
  cores, superficie, botaoSecundario, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
  corTier, glowTier,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

const RESULTADO_LABEL = { subiu: "Subiu", desceu: "Desceu", manteve: "Permaneceu" };
const RESULTADO_COR = { subiu: cores.success, desceu: cores.danger, manteve: cores.textSecondary };

export default function HistoriaCarreira({ mundo, setTela }) {
  const carreira = [...mundo.carreira].reverse();
  const desbloqueadas = carregarConquistas();

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="historia" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Carreira · {mundo.meuTime}</span>
        <h2 className="text-xl font-black italic">Histórico de temporadas</h2>

        <div className="mt-3 space-y-1.5">
          {carreira.length === 0 && (
            <div className="text-sm text-center py-4" style={{ color: cores.textMuted }}>
              Nenhuma temporada concluída ainda.
            </div>
          )}
          {carreira.map((c, i) => (
            <div key={i} className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={superficie}>
              <div>
                <div className="text-sm font-semibold">Temporada {c.temporada} · {SERIES[c.serie].label}</div>
                <div className="text-xs tabular-nums" style={{ color: cores.textSecondary }}>{c.posicao}º lugar</div>
              </div>
              <span className="text-xs font-bold" style={{ color: RESULTADO_COR[c.resultado] }}>
                {RESULTADO_LABEL[c.resultado]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span style={eyebrowLime}>Insígnias</span>
            <span className="text-xs tabular-nums" style={{ color: cores.textMuted }}>
              {Object.keys(desbloqueadas).length}/{CONQUISTAS.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CONQUISTAS.map((c) => {
              const tem = !!desbloqueadas[c.id];
              const cor = corTier[c.tier];
              return (
                <div
                  key={c.id}
                  className="rounded-xl px-3 py-2.5"
                  style={tem ? { ...superficie, border: `1px solid ${cor}`, ...glowTier(c.tier) } : { ...superficie, opacity: 0.4 }}
                >
                  <div className="flex items-center gap-1.5">
                    {tem ? (
                      <InsigniaBadge tier={c.tier} emoji={c.emoji} size={28} conquistaId={c.id} />
                    ) : (
                      <span className="text-lg leading-none">?</span>
                    )}
                    <span className="text-sm font-bold leading-tight">{c.titulo}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: cores.textSecondary }}>{c.desc}</div>
                  <div className="text-[10px] mt-1 font-bold uppercase tracking-wide" style={{ color: tem ? cor : cores.textMuted }}>
                    {c.tier}
                    {/* Contexto de desbloqueio (C2.3, PLANO_GAMEFEEL_AAA §5 —
                        Pokémon GO grava onde/quando): clube+temporada já são
                        salvos desde sempre (storage/conquistas.js desbloquear())
                        — só faltava exibir. */}
                    {tem && desbloqueadas[c.id]?.clube && (
                      <span className="normal-case font-normal" style={{ color: cores.textMuted }}>
                        {" · "}{desbloqueadas[c.id].clube}
                        {desbloqueadas[c.id].temporada ? `, T${desbloqueadas[c.id].temporada}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-4" style={botaoSecundario}>
          ← Voltar
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
