// src/components/Escalacao.jsx
// Escalação: 7 titulares = 1 GOL + 6 de linha. Tamanho de elenco é variável.
// Inclui o modal de correção de nomes (✏️).
import { tendenciaTorcida } from "../engine/torcida";
import { setinhaValor } from "../engine/mercado";
import { Eyebrow, Rodape, Avatar, AvatarTecnico, Barra, card, amber } from "./ui";

const corSetinha = (s) => (s === "▲" ? "#7FE0A8" : s === "▼" ? "#FF5A5A" : "#A78FC7");

function ModalNomes({ meuTime, textoNomes, setTextoNomes, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: "#1E1233" }}>
        <Eyebrow>Corrigir nomes — {meuTime}</Eyebrow>
        <p className="text-xs mt-1" style={{ color: "#A78FC7" }}>
          Um nome por linha, na mesma ordem. Posições e atributos são mantidos.
        </p>
        <textarea
          value={textoNomes}
          onChange={(e) => setTextoNomes(e.target.value)}
          rows={10}
          className="w-full mt-2 rounded-xl p-3 text-sm outline-none"
          style={{ background: "#150A26", color: "#F2EDFA", border: "1px solid rgba(139,105,190,0.35)" }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} className="flex-1 rounded-xl py-3 font-bold" style={card}>Cancelar</button>
          <button onClick={onSave} className="flex-1 rounded-xl py-3 font-bold" style={amber}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function Escalacao({
  S, meuTime, nomeTec, avatarId, escolhidos, toggleJogador, escSelecionada, escValida,
  jogarAoVivo, rodadaRapida, confronto,
  modalNomes, setModalNomes, textoNomes, setTextoNomes, salvarNomes,
}) {
  const c = confronto();
  const souCasa = c.casa === meuTime;
  const adv = souCasa ? c.fora : c.casa;
  const elenco = S.elencos[meuTime];
  const grupos = ["GOL", "DEF", "MEI", "ATA"];
  const nLinha = escSelecionada().filter((j) => j.pos !== "GOL").length;
  const nGol = escSelecionada().filter((j) => j.pos === "GOL").length;

  return (
    <div className="pt-6">
      <Eyebrow>Rodada {S.rodada + 1} de {S.calendario.length}</Eyebrow>
      <div className="flex items-center gap-2 mt-2">
        <Avatar t={meuTime} />
        <div className="flex-1">
          <div className="font-black italic">{meuTime}</div>
          <div className="text-xs" style={{ color: "#A78FC7" }}>
            vs {adv} · {souCasa ? "mandante" : "visitante"}
          </div>
        </div>
        <AvatarTecnico avatarId={avatarId} nome={nomeTec} size={32} />
        <button
          onClick={() => { setTextoNomes(elenco.map((j) => j.nome).join("\n")); setModalNomes(true); }}
          className="rounded-lg px-3 py-2 text-xs font-semibold"
          style={card}
        >
          ✏️ nomes
        </button>
      </div>

      <div className="rounded-xl px-3 py-2 mt-3 text-xs flex justify-between" style={card}>
        <span>Orçamento</span>
        <span className="font-bold tabular-nums" style={{ color: "#FFC53D" }}>L$ {S.orcamento[meuTime]}</span>
      </div>

      <div className="rounded-xl px-3 py-2 mt-2 text-xs flex justify-between" style={card}>
        <span>Torcida</span>
        <span className="font-bold tabular-nums">
          🏟️ {S.torcida[meuTime]} torcedores{" "}
          <span style={{ color: corSetinha(tendenciaTorcida(S.torcida, S.torcidaRef, meuTime)) }}>
            {tendenciaTorcida(S.torcida, S.torcidaRef, meuTime)}
          </span>
        </span>
      </div>

      {S.comentariosTorcida.length > 0 && (
        <div className="rounded-xl px-3 py-2 mt-2 text-xs" style={card}>
          <Eyebrow>Torcida comenta</Eyebrow>
          <div className="mt-1 space-y-1" style={{ color: "#D9CCEE" }}>
            {S.comentariosTorcida.slice(-3).reverse().map((c, i) => (
              <div key={i}>· {c.texto}</div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl px-3 py-2 mt-2 text-xs flex justify-between" style={card}>
        <span>Escalados: <b className="tabular-nums">{nGol}</b> GOL + <b className="tabular-nums">{nLinha}</b>/6 linha</span>
        <span style={{ color: escValida() ? "#7FE0A8" : "#FFC53D" }}>{escValida() ? "pronto" : "ajuste a escalação"}</span>
      </div>

      {grupos.map((gp) => (
        <div key={gp} className="mt-4">
          <Eyebrow>{gp}</Eyebrow>
          <div className="mt-1 space-y-1">
            {elenco.filter((j) => j.pos === gp).sort((a, b) => b.attr - a.attr).map((j) => {
              const sel = escolhidos.includes(j.id);
              return (
                <button
                  key={j.id}
                  onClick={() => toggleJogador(j)}
                  className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2 text-left active:opacity-70"
                  style={{ ...card, ...(sel ? { border: "1px solid #FFC53D", background: "#2B1A4A" } : {}) }}
                >
                  <span className="text-xs w-4 text-center">{sel ? "●" : "○"}</span>
                  <span className="flex-1 text-sm leading-tight">{j.nome}</span>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: "#A78FC7" }}>
                    L$ {j.valor} <span style={{ color: corSetinha(setinhaValor(j)) }}>{setinhaValor(j)}</span>
                  </span>
                  <Barra v={j.attr} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 inset-x-0 z-40" style={{ background: "linear-gradient(transparent, #150A26 30%)" }}>
        <div className="max-w-md mx-auto px-4 pb-5 pt-6 flex gap-2">
          <button
            disabled={!escValida()}
            onClick={jogarAoVivo}
            className="flex-1 rounded-xl py-3.5 font-bold disabled:opacity-40"
            style={amber}
          >
            ▶ Jogar ao vivo
          </button>
          <button
            disabled={!escValida()}
            onClick={rodadaRapida}
            className="rounded-xl px-4 py-3.5 font-bold disabled:opacity-40"
            style={card}
          >
            ⏩ Rápida
          </button>
        </div>
      </div>
      <div className="h-24" />

      {modalNomes && (
        <ModalNomes
          meuTime={meuTime}
          textoNomes={textoNomes}
          setTextoNomes={setTextoNomes}
          onCancel={() => setModalNomes(false)}
          onSave={() => salvarNomes(textoNomes)}
        />
      )}
    </div>
  );
}
