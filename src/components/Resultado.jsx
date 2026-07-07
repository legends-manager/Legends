// src/components/Resultado.jsx
// Tela de resultado: placar, Craque da Partida, gols e resultados da rodada.
// ARENA.label na linha de contexto com a rodada.
import { SIGLA } from "../data/times";
import { ARENA } from "../data/arena";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";

export default function Resultado({ resumo, setTela }) {
  const r = resumo;
  const meu = r.jogos[0];
  const gols = r.evMeu.filter((e) => e.tipo === "gol").sort((a, b) => a.min - b.min);

  return (
    <div className="pt-6">
      <Eyebrow>Fim de jogo · Rodada {r.rodada}</Eyebrow>
      <div className="rounded-2xl p-4 mt-2 text-center" style={card}>
        <div className="flex items-center justify-center gap-3">
          <Avatar t={meu.casa} />
          <span className="text-4xl font-black italic tabular-nums">{meu.gc} : {meu.gf}</span>
          <Avatar t={meu.fora} />
        </div>
        <div className="text-sm font-semibold mt-2">{meu.casa} x {meu.fora}</div>
        <div className="text-xs mt-1" style={{ color: "#5E7767" }}>{ARENA.label}</div>
      </div>

      {r.craque && (
        <div className="rounded-xl px-4 py-3 mt-2 flex items-center gap-3" style={{ ...card, border: "1px solid #FFC53D" }}>
          <span className="text-2xl">⭐</span>
          <div>
            <Eyebrow>Craque da partida</Eyebrow>
            <div className="font-bold">
              {r.craque.nome} <span className="text-xs font-normal" style={{ color: "#93AF9B" }}>({r.craque.time})</span>
            </div>
          </div>
        </div>
      )}

      {gols.length > 0 && (
        <div className="mt-3">
          <Eyebrow>Gols</Eyebrow>
          <div className="mt-1 space-y-1">
            {gols.map((e, i) => (
              <div key={i} className="rounded-xl px-3 py-2 text-sm" style={card}>
                <span className="tabular-nums text-xs mr-2" style={{ color: "#93AF9B" }}>{e.min}&#39;</span>
                <b>{e.autor.nome}</b> ({SIGLA[e.time]})
                {e.assist ? <span style={{ color: "#93AF9B" }}> · assist. {e.assist.nome}</span> : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <Eyebrow>Resultados da rodada</Eyebrow>
        <div className="mt-1 space-y-1">
          {r.jogos.slice(1).map((x, i) => (
            <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
              <span>{SIGLA[x.casa]}</span>
              <span className="font-black italic tabular-nums">{x.gc} : {x.gf}</span>
              <span>{SIGLA[x.fora]}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
        Ver tabela
      </button>
      <Rodape />
    </div>
  );
}
