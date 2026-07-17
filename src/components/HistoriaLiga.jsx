// src/components/HistoriaLiga.jsx
// Liga Viva (spec-liga-viva.md §3.1): hall de campeões — temporada a
// temporada, os campeões das três séries. É a memória que faz a liga viva
// importar (igual a lista de campeões brasileiros por ano).
import { SIGLA } from "../data/times";
import { carregarMetricas } from "../storage/metricas";
import { Eyebrow, Rodape, card } from "./ui";

export default function HistoriaLiga({ mundo, setTela }) {
  // Task 05.1H.1: alcançável a partir da Entry sem carreira (mundo=null) —
  // nenhum hall/recorde é fabricado; a tabela mostra o mesmo estado vazio
  // que já existia pra "nenhuma temporada concluída ainda", e os blocos de
  // recordes simplesmente não aparecem (mesma condição que já os escondia
  // quando o mundo existia mas ainda não tinha nenhum recorde registrado).
  const hall = mundo ? [...mundo.hallCampeoes].reverse() : [];
  const recordes = mundo?.recordes;
  const metricas = carregarMetricas();

  return (
    <div className="pt-6">
      <Eyebrow>Legends Liga Fut7</Eyebrow>
      <h2 className="text-xl font-black italic">História da Liga</h2>

      <div className="rounded-2xl overflow-hidden mt-3" style={card}>
        <div
          className="grid text-xs font-semibold px-3 py-2"
          style={{ gridTemplateColumns: "3rem 1fr 1fr 1fr", color: "#A78FC7" }}
        >
          <span>Temp.</span><span>Série A</span><span>Série B</span><span>Série C</span>
        </div>
        {hall.length === 0 && (
          <div className="text-sm text-center py-4" style={{ color: "#6E5A92" }}>
            Nenhuma temporada concluída ainda.
          </div>
        )}
        {hall.map((h, i) => (
          <div
            key={h.temporada}
            className="grid items-center text-xs px-3 py-2"
            style={{ gridTemplateColumns: "3rem 1fr 1fr 1fr", background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}
          >
            <span className="tabular-nums" style={{ color: "#A78FC7" }}>{h.temporada}</span>
            <span className="truncate pr-1">{SIGLA[h.A] || h.A}</span>
            <span className="truncate pr-1">{SIGLA[h.B] || h.B}</span>
            <span className="truncate pr-1">{SIGLA[h.C] || h.C}</span>
          </div>
        ))}
      </div>

      {/* Recordes históricos do mundo (dica 2) — das séries que o técnico
          disputou (as simuladas em segundo plano não têm eventos por jogador). */}
      {(recordes?.maiorGoleada || recordes?.artilheiroTemporada) && (
        <div className="mt-4">
          <Eyebrow>Recordes</Eyebrow>
          <div className="mt-2 space-y-1.5">
            {recordes.maiorGoleada && (
              <div className="rounded-xl px-3 py-2.5" style={card}>
                <div className="text-sm font-bold">
                  💥 Maior goleada: {SIGLA[recordes.maiorGoleada.casa] || recordes.maiorGoleada.casa}{" "}
                  {recordes.maiorGoleada.gc} x {recordes.maiorGoleada.gf}{" "}
                  {SIGLA[recordes.maiorGoleada.fora] || recordes.maiorGoleada.fora}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#A78FC7" }}>
                  Temporada {recordes.maiorGoleada.temporada} · Série {recordes.maiorGoleada.serie}
                </div>
              </div>
            )}
            {recordes.artilheiroTemporada && (
              <div className="rounded-xl px-3 py-2.5" style={card}>
                <div className="text-sm font-bold">
                  🥇 Artilheiro recorde: {recordes.artilheiroTemporada.nome} — {recordes.artilheiroTemporada.gols} gols
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#A78FC7" }}>
                  {recordes.artilheiroTemporada.time} · Temporada {recordes.artilheiroTemporada.temporada} · Série{" "}
                  {recordes.artilheiroTemporada.serie}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métricas locais deste aparelho (dica 7 — mídia kit pra patrocinador).
          Nada sai do celular; o Felyp agrega manualmente. */}
      <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={{ ...card, color: "#6E5A92" }}>
        📊 Neste aparelho: {metricas.partidasJogadas} partidas · {metricas.temporadasConcluidas} temporada
        {metricas.temporadasConcluidas === 1 ? "" : "s"} · {metricas.printsCompartilhados} print
        {metricas.printsCompartilhados === 1 ? "" : "s"} compartilhado{metricas.printsCompartilhados === 1 ? "" : "s"}
      </div>

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-4" style={card}>
        ← Voltar
      </button>
      <Rodape />
    </div>
  );
}
