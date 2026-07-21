// src/components/PenaltisCopa.jsx
// Pênaltis interativos (C3.1, PLANO_GAMEFEEL_AAA §4-A — Camada 3, liberada
// por decisão explícita do Felyp: "habilidade do jogador pode influenciar
// o resultado da partida"). 5 cobranças do jogador: uma barra desliza em
// vaivém (onda triangular, calculada por tempo — não por CSS puro, pra
// poder ler a posição exata no instante do toque), o jogador toca "BATER!"
// quando o marcador estiver na zona lime; a precisão média das 5 vira
// `skillScore` (0 a 1), enviado pro pai via `onConcluir`.
//
// Decisão de design: NÃO mostramos uma "corrida" de cobranças do
// adversário lado a lado — só o placar final da decisão viria de
// `engine/copa.js:resolverPenaltisComHabilidade`, então uma sequência
// numérica do rival poderia CONTRADIZER o veredito real (ex.: mostrar o
// rival "acertando mais" mas o jogador ainda vencer, por causa do viés de
// força). Em vez disso, cada cobrança minha tem feedback real e imediato
// (GOL/DEFENDEU, genuíno — vem do toque de verdade); o rival fica como
// pano de fundo narrativo ("o goleiro deles também está mandando bem"),
// nunca como número que possa desmentir o resultado.
import { useEffect, useRef, useState } from "react";
import {
  cores, superficie, botaoPrimarioGlow, eyebrowLime,
} from "./entry-hub/estilos";
import Crest from "./Crest";

const RODADAS = 5;
const DURACAO_IDA = 1000; // ms — 1 trecho da onda triangular (ida OU volta)
const ZONA_LARGURA = 22; // meio-largura da zona "GOL" (0-100), ⚙️ dificuldade

function novaZona() {
  // Nunca cola nas bordas — centro sempre entre 25 e 75, pra a onda sempre
  // cruzar a zona em algum ponto do trajeto (nunca fica impossível).
  return 25 + Math.random() * 50;
}

export default function PenaltisCopa({ meuTime, adversario, placarMeu, placarAdv, onConcluir }) {
  const [fase, setFase] = useState("intro"); // intro | rodada | feedback | fim
  const [rodada, setRodada] = useState(1);
  const [pos, setPos] = useState(0);
  const [zona, setZona] = useState(novaZona());
  const [ultimoFeedback, setUltimoFeedback] = useState(null); // { gol, precisao }
  const precisoesRef = useRef([]);
  const posRef = useRef(0);
  const t0Ref = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (fase !== "rodada") return undefined;
    t0Ref.current = performance.now();
    const tick = (agora) => {
      const decorrido = agora - t0Ref.current;
      const ciclo = decorrido % (DURACAO_IDA * 2);
      const p = ciclo <= DURACAO_IDA ? (ciclo / DURACAO_IDA) * 100 : (2 - ciclo / DURACAO_IDA) * 100;
      posRef.current = p;
      setPos(p);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fase, rodada]);

  const iniciarRodada = () => {
    setZona(novaZona());
    setFase("rodada");
  };

  const bater = () => {
    if (fase !== "rodada") return;
    cancelAnimationFrame(rafRef.current);
    const dist = Math.abs(posRef.current - zona);
    const precisao = Math.max(0, 1 - dist / (ZONA_LARGURA * 2));
    const gol = dist <= ZONA_LARGURA / 2;
    precisoesRef.current.push(precisao);
    setUltimoFeedback({ gol, precisao });
    setFase("feedback");
    setTimeout(() => {
      if (rodada >= RODADAS) {
        const skillScore = precisoesRef.current.reduce((s, x) => s + x, 0) / precisoesRef.current.length;
        setFase("fim");
        setTimeout(() => onConcluir(skillScore), 500);
      } else {
        setRodada((r) => r + 1);
        iniciarRodada();
      }
    }, 750);
  };

  return (
    <div className="rounded-2xl p-4 mt-3" style={{ ...superficie, border: `1px solid ${cores.gold}`, boxShadow: "0 0 24px rgba(255,196,0,0.3)" }}>
      <div className="flex items-center justify-between">
        <span style={{ ...eyebrowLime, color: cores.gold }}>Pênaltis</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: cores.textMuted }}>
          {placarMeu} : {placarAdv} no tempo normal
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 mt-2">
        <Crest time={meuTime} sm />
        <span className="text-xs" style={{ color: cores.textMuted }}>x</span>
        <Crest time={adversario} sm />
      </div>

      {fase === "intro" && (
        <div className="text-center mt-4">
          <p className="text-sm" style={{ color: cores.textSecondary }}>
            {RODADAS} cobranças. Toque em <b>BATER!</b> quando a bola estiver na faixa lime.
          </p>
          <button onClick={iniciarRodada} className="w-full rounded-xl py-3.5 font-bold mt-3" style={botaoPrimarioGlow}>
            Começar cobranças
          </button>
        </div>
      )}

      {(fase === "rodada" || fase === "feedback") && (
        <div className="mt-4">
          <div className="text-center text-xs font-bold" style={{ color: cores.textMuted }}>
            COBRANÇA {rodada}/{RODADAS}
          </div>
          <div className="relative mt-3 rounded-full overflow-hidden" style={{ height: 14, background: cores.bgField, border: `1px solid ${cores.steel}` }}>
            <div
              className="absolute inset-y-0 rounded-full"
              style={{ left: `${Math.max(0, zona - ZONA_LARGURA / 2)}%`, width: `${ZONA_LARGURA}%`, background: "rgba(198,255,30,0.35)" }}
            />
            <div
              className="absolute rounded-full"
              style={{ top: -3, width: 20, height: 20, left: `calc(${pos}% - 10px)`, background: cores.textPrimary, boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
            />
          </div>
          <button
            disabled={fase !== "rodada"}
            onClick={bater}
            className="w-full rounded-xl py-3.5 font-black italic mt-3 disabled:opacity-50"
            style={botaoPrimarioGlow}
          >
            BATER!
          </button>
          {fase === "feedback" && ultimoFeedback && (
            <div
              className="text-center font-black italic mt-2"
              style={{ color: ultimoFeedback.gol ? cores.lime : cores.danger }}
            >
              {ultimoFeedback.gol ? "GOL!" : "DEFENDEU!"}
            </div>
          )}
        </div>
      )}

      {fase === "fim" && (
        <div className="text-center mt-4 text-sm font-bold" style={{ color: cores.textSecondary }}>
          Apurando o resultado…
        </div>
      )}
    </div>
  );
}
