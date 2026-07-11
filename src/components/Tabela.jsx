// src/components/Tabela.jsx
// Classificação (P J V E D GP GC SG %) + setas de fase (▲▼). Força não aparece.
// Liga Viva: abas A/B/C — a série do jogador é ao vivo (join normal, rodada a
// rodada); as outras duas vêm de S.outrasSeries, simuladas em paralelo pela
// mesma engine (engine/simulador.js: iniciarSerieParalela/avancarRodadaSimples)
// — reais e atualizadas, não uma prévia estática.
import { useState } from "react";
import { SIGLA } from "../data/times";
import { SERIES, ORDEM_SERIES } from "../data/series";
import { classificar } from "../engine/classificacao";
import { Eyebrow, Rodape, card, amber } from "./ui";

function Classificacao({ tabela, fase, meuTime }) {
  const linhas = classificar(tabela);
  return (
    <div className="rounded-2xl overflow-hidden mt-3" style={card}>
      <div
        className="grid text-xs font-semibold px-2 py-2"
        style={{ gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)", color: "#A78FC7" }}
      >
        <span /><span /><span>P</span><span>J</span><span>V</span><span>E</span><span>D</span><span>GP</span><span>GC</span><span>SG</span><span>%</span>
      </div>
      {linhas.map((l, i) => (
        <div
          key={l.t}
          className="grid items-center text-xs px-2 py-1.5 tabular-nums"
          style={{
            gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)",
            background: l.t === meuTime ? "rgba(255,197,61,0.10)" : i % 2 ? "rgba(255,255,255,0.02)" : "transparent",
          }}
        >
          <span style={{ color: "#A78FC7" }}>{i + 1}</span>
          <span className="flex items-center gap-1 font-semibold truncate pr-1">
            {SIGLA[l.t] || l.t}
            <span style={{ color: fase[l.t] > 1.01 ? "#7FE0A8" : fase[l.t] < 0.99 ? "#FF5A5A" : "#6E5A92" }}>
              {fase[l.t] > 1.01 ? "▲" : fase[l.t] < 0.99 ? "▼" : "–"}
            </span>
          </span>
          <span className="font-bold">{l.P}</span><span>{l.J}</span><span>{l.V}</span><span>{l.E}</span>
          <span>{l.D}</span><span>{l.GP}</span><span>{l.GC}</span><span>{l.SG}</span><span>{l.pct}</span>
        </div>
      ))}
    </div>
  );
}

export default function Tabela({ S, meuTime, setTela, irProximaRodada, finalizarTemporadaCarreira }) {
  const [abaSerie, setAbaSerie] = useState(S.serie);
  const total = S.calendario.length;
  const fim = S.rodada >= total;
  const temOutrasSeries = S.outrasSeries && Object.keys(S.outrasSeries).length > 0;

  // Dados da série em exibição: a do jogador vem de S direto (ao vivo, com o
  // clock); as outras duas vêm do estado paralelo (mesma forma, sem clock).
  const verMinhaSerie = abaSerie === S.serie;
  const estadoAba = verMinhaSerie ? S : S.outrasSeries[abaSerie];
  const rodadaAba = verMinhaSerie ? Math.min(S.rodada, total) : estadoAba.rodada;
  const totalAba = verMinhaSerie ? total : estadoAba.calendario.length;

  return (
    <div className="pt-6">
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>Classificação</Eyebrow>
          <h2 className="text-xl font-black italic">{SERIES[abaSerie].label} · Rodada {rodadaAba}/{totalAba}</h2>
        </div>
        {verMinhaSerie && (
          <button onClick={() => setTela("artilharia")} className="rounded-lg px-3 py-2 text-xs font-semibold" style={card}>
            🥇 Artilharia
          </button>
        )}
      </div>

      {temOutrasSeries && (
        <div className="flex gap-1 mt-3">
          {ORDEM_SERIES.map((s) => (
            <button
              key={s}
              onClick={() => setAbaSerie(s)}
              className="flex-1 rounded-lg py-2 text-xs font-bold"
              style={abaSerie === s ? amber : card}
            >
              {SERIES[s].label}{s === S.serie ? " (você)" : ""}
            </button>
          ))}
        </div>
      )}

      <Classificacao tabela={estadoAba.tabela} fase={estadoAba.fase} meuTime={meuTime} />

      {!verMinhaSerie && (
        <div className="text-xs text-center mt-2" style={{ color: "#6E5A92" }}>
          Simulada automaticamente — você não disputa esta série nesta temporada.
        </div>
      )}

      {verMinhaSerie && (
        fim ? (
          <button onClick={finalizarTemporadaCarreira} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
            🏆 Fim de temporada
          </button>
        ) : (
          <button onClick={irProximaRodada} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
            Próxima rodada →
          </button>
        )
      )}
      <Rodape />
    </div>
  );
}
