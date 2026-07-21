// src/components/LanceDecisivo.jsx
// Lance Decisivo (C3.2, PLANO_GAMEFEEL_AAA §4-C — Camada 3, mesma decisão do
// Felyp que liberou os pênaltis interativos: "habilidade do jogador pode
// influenciar o resultado da partida"). Minutos finais, jogo empatado ou
// perdendo por 1: UMA cobrança de reflexo — relógio pausado, uma barra em
// vaivém, um toque só. Acerto = gol de verdade (autor sorteado do time);
// erro = "quase", narrado como chance perdida. O carve-out de lambda que
// torna isso possível sem inflar a média de gols está em App.jsx
// (iniciarSegundoTempo) + engine/simulador.js (simMetade reducaoAbsoluta),
// com regressão de calibração em engine/__tests__/simulador.test.js.
import { useEffect, useRef, useState } from "react";
import { cores, botaoPrimarioGlow } from "./entry-hub/estilos";

const DURACAO_IDA = 850; // ms — mais rápido que os pênaltis: é UM lance, sob pressão
const ZONA_LARGURA = 20;

export default function LanceDecisivo({ minuto, meuTime, onResolver }) {
  const [fase, setFase] = useState("aviso"); // aviso | ativo | feedback
  const [pos, setPos] = useState(0);
  const [zona] = useState(25 + Math.random() * 50);
  const [acertou, setAcertou] = useState(null);
  const posRef = useRef(0);
  const t0Ref = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (fase !== "ativo") return undefined;
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
  }, [fase]);

  const chutar = () => {
    if (fase !== "ativo") return;
    cancelAnimationFrame(rafRef.current);
    const dist = Math.abs(posRef.current - zona);
    const gol = dist <= ZONA_LARGURA / 2;
    setAcertou(gol);
    setFase("feedback");
    setTimeout(() => onResolver(gol), 900);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" style={{ background: "rgba(10,12,14,0.92)" }}>
      <div className="w-full text-center" style={{ maxWidth: 320 }}>
        <div className="font-black italic" style={{ fontSize: 26, color: cores.gold, letterSpacing: "-0.01em" }}>
          LANCE DECISIVO!
        </div>
        <p className="text-sm mt-2" style={{ color: cores.textSecondary }}>
          {minuto}' — última chance do {meuTime} de virar o jogo nesta partida.
        </p>

        {fase === "aviso" && (
          <button onClick={() => setFase("ativo")} className="w-full rounded-xl py-4 font-bold mt-5" style={botaoPrimarioGlow}>
            Encarar o lance
          </button>
        )}

        {(fase === "ativo" || fase === "feedback") && (
          <div className="mt-5">
            <div className="relative rounded-full overflow-hidden" style={{ height: 16, background: cores.bgField, border: `1px solid ${cores.steel}` }}>
              <div
                className="absolute inset-y-0 rounded-full"
                style={{ left: `${Math.max(0, zona - ZONA_LARGURA / 2)}%`, width: `${ZONA_LARGURA}%`, background: "rgba(198,255,30,0.35)" }}
              />
              <div
                className="absolute rounded-full"
                style={{ top: -3, width: 22, height: 22, left: `calc(${pos}% - 11px)`, background: cores.textPrimary, boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
              />
            </div>
            <button
              disabled={fase !== "ativo"}
              onClick={chutar}
              className="w-full rounded-xl py-4 font-black italic mt-4 disabled:opacity-50"
              style={botaoPrimarioGlow}
            >
              CHUTAR!
            </button>
            {fase === "feedback" && (
              <div className="font-black italic mt-3" style={{ fontSize: 22, color: acertou ? cores.lime : cores.danger }}>
                {acertou ? "GOOOL!" : "QUASE! NÃO FOI DESSA VEZ"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
