// src/components/TelaInicial.jsx
// Nome do técnico + escolha de time. Com save válido: "Continuar" + "Nova
// temporada" (nova pede confirmação antes de sobrescrever). Aviso único quando
// o localStorage está indisponível.
import { useState } from "react";
import { TIMES } from "../data/times";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";

export default function TelaInicial({
  nomeTec, setNomeTec, iniciarTemporada, saveData, continuarJogo, avisoSemSave,
}) {
  const [pendente, setPendente] = useState(null); // time aguardando confirmação

  const escolherTime = (t) => {
    if (saveData) setPendente(t); // há save: confirmar antes de apagar
    else iniciarTemporada(t);
  };

  const rodadaSalva = saveData ? Math.min(saveData.temporada.rodadaAtual + 1, 22) : 0;
  const encerrada = saveData && saveData.temporada.rodadaAtual >= 22;

  return (
    <div className="pt-10">
      <Eyebrow>Legends Liga Fut7 · Série C · 2026</Eyebrow>
      <h1 className="text-4xl font-black italic tracking-tight mt-1">
        LEGENDS<span style={{ color: "#FFC53D" }}>MANAGER</span>
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#93AF9B" }}>
        Escolha seu time, monte a escalação e dispute as 22 rodadas com os elencos reais da Série C.
      </p>

      {avisoSemSave && (
        <div className="rounded-xl p-3 mt-4 text-xs" style={{ ...card, border: "1px solid #FFC53D", color: "#FFC53D" }}>
          Não consegui acessar o armazenamento deste navegador (aba privada?). Dá pra jogar
          normalmente, mas o progresso <b>não será salvo</b> ao fechar.
        </div>
      )}

      {saveData && (
        <div className="mt-4">
          <Eyebrow>Temporada salva</Eyebrow>
          <button
            onClick={continuarJogo}
            className="w-full rounded-xl px-4 py-3 mt-1 flex items-center gap-3 text-left active:opacity-70"
            style={{ ...card, border: "1px solid #FFC53D" }}
          >
            <Avatar t={saveData.timeEscolhido} />
            <div className="flex-1">
              <div className="font-bold">▶ Continuar — {saveData.timeEscolhido}</div>
              <div className="text-xs" style={{ color: "#93AF9B" }}>
                Técnico {saveData.nomeTecnico || "Técnico"} ·{" "}
                {encerrada ? "temporada encerrada" : `rodada ${rodadaSalva}/22`}
              </div>
            </div>
          </button>
        </div>
      )}

      <div className="mt-5">
        <Eyebrow>Nome do técnico</Eyebrow>
        <input
          value={nomeTec}
          onChange={(e) => setNomeTec(e.target.value)}
          placeholder="Seu nome (sai no pôster de campeão)"
          className="w-full mt-1 rounded-xl px-4 py-3 outline-none"
          style={{ ...card, color: "#ECF4EB" }}
        />
      </div>

      <div className="mt-5">
        <Eyebrow>{saveData ? "Nova temporada — escolha seu time" : "Escolha seu time"}</Eyebrow>
        {saveData && (
          <p className="text-xs mt-1" style={{ color: "#93AF9B" }}>
            Começar uma nova temporada apaga a salva acima.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TIMES.map((t) => (
            <button
              key={t}
              onClick={() => escolherTime(t)}
              className="rounded-xl px-3 py-3 flex items-center gap-2 text-left active:opacity-70"
              style={card}
            >
              <Avatar t={t} sm />
              <span className="text-sm font-semibold leading-tight">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-3 mt-4 text-xs" style={{ ...card, color: "#C8D8CC" }}>
        Elencos reais (Copa10 · pós-rodada 1). Achou nome errado? Corrige em ✏️ na tela de escalação.
      </div>

      <Rodape />

      {pendente && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: "#13251A" }}>
            <Eyebrow>Nova temporada</Eyebrow>
            <p className="text-sm mt-2" style={{ color: "#C8D8CC" }}>
              Isso apaga a temporada salva de <b>{saveData.timeEscolhido}</b> (
              {encerrada ? "encerrada" : `rodada ${rodadaSalva}/22`}) e começa uma nova com{" "}
              <b>{pendente}</b>. Continuar?
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setPendente(null)} className="flex-1 rounded-xl py-3 font-bold" style={card}>
                Cancelar
              </button>
              <button
                onClick={() => { const t = pendente; setPendente(null); iniciarTemporada(t); }}
                className="flex-1 rounded-xl py-3 font-bold"
                style={amber}
              >
                Apagar e começar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
