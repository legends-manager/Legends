// src/components/HistoriaCarreira.jsx
// Liga Viva (spec-liga-viva.md §6): lista as temporadas do jogador — série,
// time, posição, subiu/desceu/permaneceu.
// Reskin "Polish Language v1" (jul/2026, Fase 1a): grafite/lime; setas
// success/danger em vez de emoji; grade de conquistas em superfície
// grafite com borda gold quando desbloqueada (o emoji de cada conquista é
// dado de conteúdo em storage/conquistas.js, fora do escopo deste reskin de
// camada visual — ver assets-legends-mapeamento.md pra revisão futura).
import { SERIES } from "../data/series";
import { CONQUISTAS, carregarConquistas } from "../storage/conquistas";
import {
  cores, superficie, botaoSecundario, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
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
          <span style={eyebrowLime}>Conquistas</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CONQUISTAS.map((c) => {
              const tem = !!desbloqueadas[c.id];
              return (
                <div
                  key={c.id}
                  className="rounded-xl px-3 py-2.5"
                  style={{ ...superficie, ...(tem ? { border: `1px solid ${cores.gold}` } : { opacity: 0.45 }) }}
                >
                  <div className="text-sm font-bold">{c.emoji} {c.titulo}</div>
                  <div className="text-xs mt-0.5" style={{ color: cores.textSecondary }}>{c.desc}</div>
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
