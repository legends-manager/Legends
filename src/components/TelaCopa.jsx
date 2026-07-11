// src/components/TelaCopa.jsx
// Copa cruzando as 3 séries (mata-mata puro, 32 times, sorteio aleatório).
// Sem escalação própria — usa a MESMA escalação da liga (simplificação
// consciente de v1: o técnico não gerencia dois times, só um). Mostra o
// confronto pendente do jogador (se houver) e a trajetória dele na copa.
import { useState } from "react";
import { nomeFase, confrontoPendenteDoJogador, eliminadoDaCopa, historicoDoJogador } from "../engine/copa";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";

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
    <div className="pt-6">
      <Eyebrow>Copa cruzando as 3 séries</Eyebrow>
      <h2 className="text-xl font-black italic">{nomeFase(copa.fase)}</h2>

      {souCampeao && (
        <div className="rounded-2xl p-4 mt-3 text-center" style={{ ...card, border: "1px solid #FFC53D" }}>
          <div className="text-4xl">🏆</div>
          <div className="font-black italic mt-1">Campeão da Copa!</div>
        </div>
      )}

      {!souCampeao && eliminado && !resultado && (
        <div className="rounded-xl p-3 mt-3 text-sm text-center" style={{ ...card, color: "#A78FC7" }}>
          Você foi eliminado da copa nesta temporada — ela segue rolando entre os outros 31 times.
        </div>
      )}

      {resultado && (
        <div
          className="rounded-2xl p-4 mt-3 text-center"
          style={{ ...card, border: resultado.venceu ? "1px solid #7FE0A8" : "1px solid #FF5A5A" }}
        >
          <div className="flex items-center justify-center gap-3">
            <Avatar t={meuTime} />
            <span className="text-3xl font-black italic tabular-nums">
              {resultado.placarMeu} : {resultado.placarAdv}
            </span>
            <Avatar t={resultado.adversario} />
          </div>
          <div className="text-xs mt-2" style={{ color: "#A78FC7" }}>
            {meuTime} x {resultado.adversario}{resultado.penaltis ? " · decidido nos pênaltis" : ""}
          </div>
          <div className="text-sm font-bold mt-2" style={{ color: resultado.venceu ? "#7FE0A8" : "#FF5A5A" }}>
            {resultado.campeao ? "🏆 Campeão da Copa!" : resultado.venceu ? "Classificado para a próxima fase!" : "Eliminado da copa."}
          </div>
        </div>
      )}

      {!resultado && pendente && (
        <div className="rounded-xl p-4 mt-3" style={card}>
          <Eyebrow>Seu confronto</Eyebrow>
          <div className="flex items-center gap-2 mt-2">
            <Avatar t={meuTime} sm /><span className="font-bold">{meuTime}</span>
            <span style={{ color: "#A78FC7" }}>x</span>
            <Avatar t={adversarioPendente} sm /><span className="font-bold">{adversarioPendente}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#A78FC7" }}>
            Joga com a escalação atual da sua liga — a copa não tem escalação própria.
          </p>
          <button onClick={jogar} className="w-full rounded-xl py-3 font-bold mt-3" style={amber}>
            ▶ Jogar
          </button>
        </div>
      )}

      {!resultado && !pendente && !souCampeao && !eliminado && (
        <div className="rounded-xl p-3 mt-3 text-sm text-center" style={{ ...card, color: "#A78FC7" }}>
          Sem confronto pendente agora — volte depois da próxima rodada da liga.
        </div>
      )}

      {historico.length > 0 && (
        <div className="mt-4">
          <Eyebrow>Sua trajetória na copa</Eyebrow>
          <div className="mt-1 space-y-1">
            {historico.map((h, i) => (
              <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
                <span style={{ color: "#A78FC7" }}>{h.fase}</span>
                <span className="font-bold tabular-nums">{h.placarMeu} : {h.placarAdv}</span>
                <span style={{ color: h.venceu ? "#7FE0A8" : "#FF5A5A" }}>
                  {h.venceu ? "Venceu" : "Perdeu"}{h.penaltis ? " (pên.)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setTela("escalacao")} className="w-full rounded-xl py-3 font-bold mt-5" style={card}>
        ← Voltar
      </button>
      <Rodape />
    </div>
  );
}
