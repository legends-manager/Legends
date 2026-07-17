// src/components/TelaCopa.jsx
// Copa cruzando as 3 séries (mata-mata puro, 32 times, sorteio aleatório).
// Sem escalação própria — usa a MESMA escalação da liga (simplificação
// consciente de v1: o técnico não gerencia dois times, só um). Mostra o
// confronto pendente do jogador (se houver) e a trajetória dele na copa.
// Reskin "Polish Language v1" (jul/2026, Fase 1a): tratamento de EVENTO
// (REDESIGN_LEGENDS_MANAGER.md §5.10) — "uma partida, sem segunda chance"
// ganha cabeçalho display e CTA com glow, diferente do tom sóbrio das telas
// utilitárias. Crest em vez de avatar roxo; emojis removidos.
import { useState } from "react";
import { nomeFase, confrontoPendenteDoJogador, eliminadoDaCopa, historicoDoJogador } from "../engine/copa";
import {
  cores, superficie, superficie2, botaoPrimario, botaoPrimarioGlow, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor, crest,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

const SIGLA3 = (t) => t.slice(0, 3).toUpperCase();

function Crest({ time, sm }) {
  return <div style={crest(sm)}>{SIGLA3(time)}</div>;
}

export default function TelaCopa({ S, meuTime, jogarPartidaCopa, setTela }) {
  const [resultado, setResultado] = useState(null);
  const copa = S.copa;
  const pendente = confrontoPendenteDoJogador(copa, meuTime);
  const eliminado = eliminadoDaCopa(copa, meuTime);
  const historico = historicoDoJogador(copa, meuTime);
  const souCampeao = copa.campeao === meuTime;
  const adversarioPendente = pendente ? (pendente.a === meuTime ? pendente.b : pendente.a) : null;

  const jogar = () => setResultado(jogarPartidaCopa());

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="copa" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Copa cruzando as 3 séries</span>
        <h1 className="mt-1" style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic" }}>{nomeFase(copa.fase)}</h1>
        {!souCampeao && !eliminado && (
          <p className="text-sm mt-1" style={{ color: cores.textSecondary }}>
            Uma partida. Sem segunda chance.
          </p>
        )}

        {souCampeao && (
          <div className="rounded-2xl p-5 mt-4 text-center" style={{ ...superficie, border: `1px solid ${cores.gold}`, boxShadow: `0 0 28px rgba(255,196,0,0.35)` }}>
            <div className="font-black italic text-lg" style={{ color: cores.gold }}>Campeão da Copa!</div>
          </div>
        )}

        {!souCampeao && eliminado && !resultado && (
          <div className="rounded-xl p-3 mt-3 text-sm text-center" style={{ ...superficie, color: cores.textSecondary }}>
            Você foi eliminado da copa nesta temporada — ela segue rolando entre os outros 31 times.
          </div>
        )}

        {resultado && (
          <div
            className="rounded-2xl p-4 mt-3 text-center"
            style={{ ...superficie, border: `1px solid ${resultado.venceu ? cores.success : cores.danger}` }}
          >
            <div className="flex items-center justify-center gap-3">
              <Crest time={meuTime} />
              <span className="text-3xl font-black italic tabular-nums">
                {resultado.placarMeu} : {resultado.placarAdv}
              </span>
              <Crest time={resultado.adversario} />
            </div>
            <div className="text-xs mt-2" style={{ color: cores.textSecondary }}>
              {meuTime} x {resultado.adversario}{resultado.penaltis ? " · decidido nos pênaltis" : ""}
            </div>
            <div className="text-sm font-bold mt-2" style={{ color: resultado.campeao ? cores.gold : resultado.venceu ? cores.success : cores.danger }}>
              {resultado.campeao ? "Campeão da Copa!" : resultado.venceu ? "Classificado para a próxima fase!" : "Eliminado da copa."}
            </div>
          </div>
        )}

        {!resultado && pendente && (
          <div className="rounded-xl p-4 mt-3" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
            <span style={eyebrowLime}>Seu confronto</span>
            <div className="flex items-center gap-2 mt-2">
              <Crest time={meuTime} sm /><span className="font-bold">{meuTime}</span>
              <span style={{ color: cores.textMuted }}>x</span>
              <Crest time={adversarioPendente} sm /><span className="font-bold">{adversarioPendente}</span>
            </div>
            <p className="text-xs mt-2" style={{ color: cores.textSecondary }}>
              Joga com a escalação atual da sua liga — a copa não tem escalação própria.
            </p>
            <button onClick={jogar} className="w-full rounded-xl py-3 font-bold mt-3" style={botaoPrimarioGlow}>
              Jogar
            </button>
          </div>
        )}

        {!resultado && !pendente && !souCampeao && !eliminado && (
          <div className="rounded-xl p-3 mt-3 text-sm text-center" style={{ ...superficie, color: cores.textSecondary }}>
            Sem confronto pendente agora — volte depois da próxima rodada da liga.
          </div>
        )}

        {historico.length > 0 && (
          <div className="mt-4">
            <span style={eyebrowLime}>Sua trajetória na copa</span>
            <div className="mt-1 space-y-1">
              {historico.map((h, i) => (
                <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={superficie}>
                  <span style={{ color: cores.textSecondary }}>{h.fase}</span>
                  <span className="font-bold tabular-nums">{h.placarMeu} : {h.placarAdv}</span>
                  <span style={{ color: h.venceu ? cores.success : cores.danger }}>
                    {h.venceu ? "Venceu" : "Perdeu"}{h.penaltis ? " (pên.)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setTela("escalacao")} className="w-full rounded-xl py-3 font-bold mt-5" style={botaoSecundario}>
          ← Voltar
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
