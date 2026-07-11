// src/components/QuizModal.jsx
// Quiz de curiosidades: modal simples (mesmo padrão bottom-sheet do resto do
// app), aparece por cima de qualquer tela quando sorteado. Responder certo
// credita o prêmio (via onResponder); pular ou responder errado não penaliza.
import { useState } from "react";
import { Eyebrow, card, amber } from "./ui";

export default function QuizModal({ quiz, onResponder, onFechar }) {
  const [escolhida, setEscolhida] = useState(null);
  const [resultado, setResultado] = useState(null); // { correta, premio } após responder

  const escolher = (i) => {
    if (resultado) return;
    setEscolhida(i);
    const correta = i === quiz.correta;
    const premio = onResponder(correta);
    setResultado({ correta, premio });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: "#1E1233" }}>
        <Eyebrow>🧠 Quiz de curiosidades</Eyebrow>
        <p className="text-sm font-semibold mt-2">{quiz.pergunta}</p>
        <div className="mt-3 space-y-1.5">
          {quiz.opcoes.map((op, i) => {
            const respondida = resultado != null;
            const estaCorreta = respondida && i === quiz.correta;
            const estaErrada = respondida && i === escolhida && i !== quiz.correta;
            return (
              <button
                key={i}
                disabled={respondida}
                onClick={() => escolher(i)}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm active:opacity-70"
                style={{
                  ...card,
                  ...(estaCorreta ? { border: "1px solid #7FE0A8", background: "#123822" } : {}),
                  ...(estaErrada ? { border: "1px solid #FF5A5A" } : {}),
                }}
              >
                {op}
              </button>
            );
          })}
        </div>
        {resultado && (
          <div className="text-sm font-semibold mt-3 text-center" style={{ color: resultado.correta ? "#7FE0A8" : "#FF5A5A" }}>
            {resultado.correta ? `Certa! +L$ ${resultado.premio}` : "Não foi dessa vez."}
          </div>
        )}
        <button onClick={onFechar} className="w-full rounded-xl py-3 font-bold mt-3" style={amber}>
          {resultado ? "Fechar" : "Pular"}
        </button>
      </div>
    </div>
  );
}
