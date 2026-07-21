// src/components/PartidaAoVivo.jsx
// Partida ao vivo: relógio minuto a minuto, faixa de gol compacta no topo,
// eventos narrados e placares dos outros jogos. ARENA.label discreto sob o placar.
//
// Cenografia de Arena (PLANO_GAMEFEEL_AAA §6-B, C2.6): esta tela é um LUGAR —
// a arquibancada da Arena Novo Horizonte à noite (fundo celebracao-wide.webp
// com scrim + vinheta), com o placar como "placar de estádio" (score bug de
// transmissão: navy, luz descendo do topo, logo oficial da liga num chip
// branco como marca de broadcast). Antecipação de gol (perigo) pulsa a borda
// do placar; gol do meu time dá um soco (shake) no card — nunca na tela toda.
import { golsDe, NARRADOR } from "../engine/simulador";
import { SIGLA } from "../data/times";
import { ARENA } from "../data/arena";
import { PlacaPatrocinio } from "./ui";
import {
  cores, superficie, superficie2, eyebrowLime, paginaGrafite,
  conteudoAcimaDaDecor, glowLime,
} from "./entry-hub/estilos";
import Crest from "./Crest";
import Cenario from "./Cenario";

const siglaDe = (time) => SIGLA[time] || time.slice(0, 3).toUpperCase();

export default function PartidaAoVivo({ S, jogo, minuto, banner, mudo, setMudo, perigo, shake }) {
  const j = jogo;
  if (!j) return null;
  const evs = [...j.ev1, ...(j.ev2 || [])];
  const gc = golsDe(evs, j.casa, minuto), gf = golsDe(evs, j.fora, minuto);
  const visiveis = evs.filter((e) => e.min <= minuto).sort((a, b) => b.min - a.min);

  return (
    <div className="pt-10" style={{ ...paginaGrafite, background: "transparent" }}>
      <Cenario src="/fundos/celebracao-wide.webp" posicao="center 30%" />
      <div style={conteudoAcimaDaDecor}>
        {/* Faixa de gol: cartão com presença de jogador + glow lime — o
            "momento alto" da tela. */}
        {banner && (
          <div className="fixed top-0 inset-x-0 z-50">
            <div
              className="max-w-md mx-auto m-2 rounded-xl overflow-hidden flex items-center"
              style={{ ...superficie, border: `1px solid ${cores.lime}`, ...glowLime(24) }}
            >
              <img
                src="/art/hero-pointing.jpg"
                alt=""
                className="block shrink-0"
                style={{ width: 64, height: 64, objectFit: "cover", objectPosition: "50% 15%" }}
              />
              <div className="px-3 py-2 font-black italic text-sm" style={{ color: cores.lime }}>
                {banner}
              </div>
            </div>
          </div>
        )}

        {/* Placar de estádio (score bug de transmissão) — o herói da cena.
            Perigo iminente pulsa a borda (antecipação); gol do meu time soca
            o card (placar-shake). */}
        <div
          className={`rounded-2xl p-4 relative overflow-hidden${shake ? " placar-shake" : ""}${perigo ? " perigo-pulse" : ""}`}
          style={{
            background: cores.navy,
            border: `1px solid ${perigo ? cores.lime : cores.steel}`,
            color: cores.textPrimary,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          }}
        >
          {/* Luz de estádio descendo do topo do placar */}
          <div
            className="absolute inset-x-0 top-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(rgba(198,255,30,0.12), transparent)" }}
            aria-hidden
          />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {/* Chip de broadcast: logo oficial da Legends Liga Fut7 (arte
                  real da liga, fundo claro — vira chip como em score bug de
                  TV, sem precisar recortar). */}
              <img
                src="/brand/liga-legends.webp"
                alt="Legends Liga Fut7"
                className="rounded-md block"
                style={{ width: 26, height: 26, objectFit: "cover" }}
              />
              <span style={eyebrowLime}>Rodada {S.rodada + 1}</span>
            </span>
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: cores.danger }}>
              <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: cores.danger }} />AO VIVO
            </span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-col items-center gap-1.5 w-20">
              <Crest time={j.casa} /><span className="text-xs font-bold">{siglaDe(j.casa)}</span>
            </div>
            <div className="text-center">
              <div className="font-black italic tabular-nums tracking-tight" style={{ color: cores.textPrimary, fontSize: 56, lineHeight: 1 }}>
                {gc}<span style={{ color: cores.textMuted }}> : </span>{gf}
              </div>
              <div className="text-sm font-bold tabular-nums mt-2" style={{ color: cores.lime }}>{Math.min(minuto, 50)}&#39;</div>
            </div>
            <div className="flex flex-col items-center gap-1.5 w-20">
              <Crest time={j.fora} /><span className="text-xs font-bold">{siglaDe(j.fora)}</span>
            </div>
          </div>
          <div className="text-center text-xs mt-3" style={{ color: cores.textMuted }}>{ARENA.label}</div>
          <div className="text-center text-xs mt-1" style={{ color: cores.textMuted }}>
            Narração: <b style={{ color: cores.textSecondary }}>{NARRADOR}</b>
          </div>
          {/* Placa de estádio: o espaço de patrocínio de maior exposição do app
              (fica na tela a partida inteira, ~50 ticks de relógio). */}
          <div className="mt-3">
            <PlacaPatrocinio compacta />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={() => setMudo(!mudo)}
            className="text-xs rounded-lg px-3 py-1.5"
            style={superficie2}
          >
            {mudo ? "Mudo" : "Som"}
          </button>
        </div>

        <div className="mt-2 space-y-1.5">
          {/* key estável por evento (não por índice): quando um evento novo
              entra no topo, só ELE anima — os antigos não re-montam. */}
          {visiveis.map((e) => (
            <div key={`${e.min}-${e.tipo}-${e.autor?.nome}-${e.time || ""}`} className="rounded-xl px-3 py-2 text-sm flex gap-2 evento-entra" style={superficie}>
              <span className="tabular-nums text-xs w-8 shrink-0 pt-0.5" style={{ color: cores.textMuted }}>{e.min}&#39;</span>
              {e.tipo === "gol" ? (
                <span>
                  <b style={{ color: cores.lime }}>GOL do {siglaDe(e.time)}!</b> {e.autor.nome}, {e.desc}
                  {e.assist ? <span style={{ color: cores.textMuted }}> (assist. {e.assist.nome})</span> : ""}
                </span>
              ) : (
                <span style={{ color: cores.textSecondary }}>{e.autor.nome} {e.desc}</span>
              )}
            </div>
          ))}
          {visiveis.length === 0 && (
            <div className="text-center text-sm py-4" style={{ color: cores.textMuted }}>Bola rolando na Arena…</div>
          )}
        </div>

        <div className="mt-4">
          <span style={eyebrowLime}>Outros jogos da rodada</span>
          <div className="mt-1 space-y-1">
            {j.outros.map((o, i) => {
              // Flash de gol (C1.6): quando um placar paralelo muda, a linha
              // acende por ~2 ticks — a rodada inteira parece viva.
              const golAgora = o.ev.some((e) => e.tipo === "gol" && (e.min === minuto || e.min === minuto - 1));
              return (
                <div
                  key={i}
                  className="rounded-xl px-3 py-2 text-sm flex items-center justify-between"
                  style={{
                    ...superficie,
                    ...(golAgora ? { border: `1px solid ${cores.lime}`, background: cores.bgSurface2 } : {}),
                    transition: "border-color 0.3s, background 0.3s",
                  }}
                >
                  <span className="font-semibold">{siglaDe(o.casa)}</span>
                  <span className="font-black italic tabular-nums" style={golAgora ? { color: cores.lime } : {}}>
                    {golsDe(o.ev, o.casa, minuto)} : {golsDe(o.ev, o.fora, minuto)}
                  </span>
                  <span className="font-semibold">{siglaDe(o.fora)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
