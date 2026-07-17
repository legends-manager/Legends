// src/components/Tabela.jsx
// Classificação (P J V E D GP GC SG %) + setas de fase (▲▼). Força não aparece.
// Liga Viva: abas A/B/C — a série do jogador é ao vivo (join normal, rodada a
// rodada); as outras duas vêm de S.outrasSeries, simuladas em paralelo pela
// mesma engine (engine/simulador.js: iniciarSerieParalela/avancarRodadaSimples)
// — reais e atualizadas, não uma prévia estática.
// Reskin "Polish Language v1" (jul/2026, Fase 1a do PLANO_MESTRE): grafite/
// lime; nome completo do clube abaixo da sigla em cada linha, sem truncar
// (achado 2 da auditoria mobile — a grade de 9 colunas numéricas não deixa
// espaço pro nome completo na MESMA linha em 320px, então ele ganha uma
// segunda linha, nunca cortado com reticências); pódio 1º/2º/3º em
// gold/silver/bronze; nota na rodada 0 em vez de parecer tabela quebrada
// (REDESIGN_LEGENDS_MANAGER.md §5.9).
import { useState } from "react";
import { SIGLA } from "../data/times";
import { SERIES, ORDEM_SERIES } from "../data/series";
import { classificar } from "../engine/classificacao";
import {
  cores, superficie, botaoPrimario, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

const corPodio = (i) => (i === 0 ? cores.gold : i === 1 ? cores.silver : i === 2 ? cores.bronze : cores.textMuted);

function Classificacao({ tabela, fase, meuTime }) {
  const linhas = classificar(tabela);
  return (
    <div className="rounded-2xl overflow-hidden mt-3" style={superficie}>
      <div
        className="grid text-xs font-semibold px-2 py-2"
        style={{ gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)", color: cores.textSecondary }}
      >
        <span /><span /><span>P</span><span>J</span><span>V</span><span>E</span><span>D</span><span>GP</span><span>GC</span><span>SG</span><span>%</span>
      </div>
      {linhas.map((l, i) => (
        <div
          key={l.t}
          className="px-2 py-1.5"
          style={{ background: l.t === meuTime ? "rgba(198,255,30,0.08)" : i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}
        >
          <div
            className="grid items-center text-xs tabular-nums"
            style={{ gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)" }}
          >
            <span className="font-bold" style={{ color: corPodio(i) }}>{i + 1}</span>
            <span className="flex items-center gap-1 font-semibold">
              {SIGLA[l.t] || l.t}
              <span style={{ color: fase[l.t] > 1.01 ? cores.success : fase[l.t] < 0.99 ? cores.danger : cores.textMuted }}>
                {fase[l.t] > 1.01 ? "▲" : fase[l.t] < 0.99 ? "▼" : "–"}
              </span>
            </span>
            <span className="font-bold" style={{ color: cores.lime }}>{l.P}</span><span>{l.J}</span><span>{l.V}</span><span>{l.E}</span>
            <span>{l.D}</span><span>{l.GP}</span><span>{l.GC}</span><span>{l.SG}</span><span>{l.pct}</span>
          </div>
          {/* Nome completo do clube — nunca truncado (regra travada); linha
              própria porque a grade de 9 colunas não deixa espaço ao lado
              da sigla em 320px sem cortar. */}
          <div className="pl-6 text-[11px]" style={{ color: l.t === meuTime ? cores.lime : cores.textMuted }}>
            {l.t}{l.t === meuTime ? " (você)" : ""}
          </div>
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
  const rodadaZero = verMinhaSerie && S.rodada === 0;

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="tabela" />
      <div style={conteudoAcimaDaDecor}>
        <div className="flex items-end justify-between">
          <div>
            <span style={eyebrowLime}>Classificação</span>
            <h2 className="text-xl font-black italic">{SERIES[abaSerie].label} · Rodada {rodadaAba}/{totalAba}</h2>
          </div>
          {verMinhaSerie && (
            <button onClick={() => setTela("artilharia")} className="rounded-lg px-3 py-2 text-xs font-semibold" style={superficie}>
              Artilharia
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
                style={abaSerie === s ? { background: cores.lime, color: cores.inkOnLime } : superficie}
              >
                {SERIES[s].label}{s === S.serie ? " (você)" : ""}
              </button>
            ))}
          </div>
        )}

        {rodadaZero && (
          <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={{ ...superficie, border: `1px solid ${cores.steel}`, color: cores.textSecondary }}>
            Ordem inicial por sorteio — a temporada começa na rodada 1.
          </div>
        )}

        <Classificacao tabela={estadoAba.tabela} fase={estadoAba.fase} meuTime={meuTime} />

        {!verMinhaSerie && (
          <div className="text-xs text-center mt-2" style={{ color: cores.textMuted }}>
            Simulada automaticamente — você não disputa esta série nesta temporada.
          </div>
        )}

        {verMinhaSerie && (
          fim ? (
            <button onClick={finalizarTemporadaCarreira} className="w-full rounded-xl py-3.5 font-bold mt-4" style={botaoPrimario}>
              Fim de temporada
            </button>
          ) : (
            <button onClick={irProximaRodada} className="w-full rounded-xl py-3.5 font-bold mt-4" style={botaoPrimario}>
              Próxima rodada →
            </button>
          )
        )}
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
