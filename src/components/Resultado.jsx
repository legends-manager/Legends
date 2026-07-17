// src/components/Resultado.jsx
// Tela de resultado: placar, Craque da Partida, gols e resultados da rodada.
// ARENA.label na linha de contexto com a rodada.
// Reskin "Polish Language v1" (jul/2026): grafite/lime, mesmo fluxo/lógica.
import { SIGLA } from "../data/times";
import { ARENA } from "../data/arena";
import { SERIES } from "../data/series";
import { gerarCardResultado, compartilharCard } from "../share/cards";
import {
  cores, superficie, botaoPrimario, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor, crest,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

function Crest({ time }) {
  return <div style={crest()}>{SIGLA[time] || time.slice(0, 3).toUpperCase()}</div>;
}

export default function Resultado({ resumo, serie, setTela }) {
  const r = resumo;
  const meu = r.jogos[0];
  const gols = r.evMeu.filter((e) => e.tipo === "gol").sort((a, b) => a.min - b.min);

  const compartilhar = async () => {
    // gerarCardResultado é async (carrega a moldura oficial antes de desenhar).
    const canvas = await gerarCardResultado({
      casa: meu.casa, fora: meu.fora, gc: meu.gc, gf: meu.gf,
      siglaCasa: SIGLA[meu.casa], siglaFora: SIGLA[meu.fora],
      craque: r.craque ? { nome: r.craque.nome, time: r.craque.time } : null,
      rodada: r.rodada,
      serieLabel: SERIES[serie].label,
    });
    compartilharCard(canvas, `legends-rodada-${r.rodada}`, "Resultado — Legends Manager");
  };

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="resultado" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Fim de jogo · Rodada {r.rodada}</span>
        <div className="rounded-2xl p-4 mt-2 text-center" style={superficie}>
          <div className="flex items-center justify-center gap-3">
            <Crest time={meu.casa} />
            <span className="text-4xl font-black italic tabular-nums">{meu.gc} : {meu.gf}</span>
            <Crest time={meu.fora} />
          </div>
          <div className="text-sm font-semibold mt-2">{meu.casa} x {meu.fora}</div>
          <div className="text-xs mt-1" style={{ color: cores.textMuted }}>{ARENA.label}</div>
        </div>

        {r.craque && (
          <div className="rounded-xl px-4 py-3 mt-2 flex items-center gap-3" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
            <span className="text-2xl" style={{ color: cores.lime }}>★</span>
            <div>
              <span style={eyebrowLime}>Craque da partida</span>
              <div className="font-bold">
                {r.craque.nome} <span className="text-xs font-normal" style={{ color: cores.textSecondary }}>({r.craque.time})</span>
              </div>
            </div>
          </div>
        )}

        {gols.length > 0 && (
          <div className="mt-3">
            <span style={eyebrowLime}>Gols</span>
            <div className="mt-1 space-y-1">
              {gols.map((e, i) => (
                <div key={i} className="rounded-xl px-3 py-2 text-sm" style={superficie}>
                  <span className="tabular-nums text-xs mr-2" style={{ color: cores.textMuted }}>{e.min}&#39;</span>
                  <b>{e.autor.nome}</b> ({SIGLA[e.time]})
                  {e.assist ? <span style={{ color: cores.textSecondary }}> · assist. {e.assist.nome}</span> : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {r.comentarioTorcida && (
          <div className="rounded-xl px-4 py-3 mt-2 text-sm" style={superficie}>
            <span style={eyebrowLime}>Torcida comenta</span>
            <div className="mt-1" style={{ color: cores.textSecondary }}>{r.comentarioTorcida.texto}</div>
          </div>
        )}

        <div className="mt-3">
          <span style={eyebrowLime}>Resultados da rodada</span>
          <div className="mt-1 space-y-1">
            {r.jogos.slice(1).map((x, i) => (
              <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={superficie}>
                <span>{SIGLA[x.casa]}</span>
                <span className="font-black italic tabular-nums">{x.gc} : {x.gf}</span>
                <span>{SIGLA[x.fora]}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3.5 font-bold mt-4" style={botaoPrimario}>
          Ver tabela
        </button>
        <button onClick={compartilhar} className="w-full rounded-xl py-3 font-bold mt-2 text-sm" style={botaoSecundario}>
          Compartilhar resultado
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
