// src/components/Mercado.jsx
// Marco 2 — Mercado de Transferências (spec-mercado.md §4). Três abas:
// Comprar / Vender / Ofertas. As travas §3.3 (<7 jogadores, sem goleiro,
// >18) são aplicadas no engine (engine/mercado.js) — esta tela só repassa o
// {ok, motivo} de volta pro jogador quando uma ação é bloqueada.
import { useState } from "react";
import { SIGLA } from "../data/times";
import { PISO_VALOR, buscarJogador, setinhaValor } from "../engine/mercado";
import { gerarManchetes } from "../engine/manchetes";
import { Eyebrow, Avatar, card, amber } from "./ui";

const corSetinha = (s) => (s === "▲" ? "#7FE0A8" : s === "▼" ? "#FF5A5A" : "#A78FC7");
const Setinha = ({ jogador }) => (
  <span style={{ color: corSetinha(setinhaValor(jogador)) }}>{setinhaValor(jogador)}</span>
);

const ABAS = [
  ["comprar", "Comprar"],
  ["vender", "Vender"],
  ["ofertas", "Ofertas"],
  ["times", "Times"],
];

export default function Mercado({
  S, meuTime, comprarNoMercado, listarNoMercado, cancelarListagem,
  aceitarOfertaHumano, recusarOfertaHumano, proporNoMercado, fecharJanelaEIrEscalacao,
}) {
  const [aba, setAba] = useState("comprar");
  const [erro, setErro] = useState(null);
  const [precos, setPrecos] = useState({}); // idJogador -> preço digitado (aba Vender)
  const [timeVisitado, setTimeVisitado] = useState(null); // aba Times: time cujo elenco está aberto
  const [propostas, setPropostas] = useState({}); // idJogador -> proposta digitada (aba Times)

  const janela = S.mercado.janela;
  const tituloJanela = janela === "pre" ? "Janela de pré-temporada" : "Janela do meio de temporada (única)";

  const rodar = (fn) => {
    const r = fn();
    setErro(r && r.ok === false ? r.motivo : null);
  };

  // Comprar mostra só o que é de OUTROS times — o que o próprio humano listou
  // fica visível (e cancelável) na aba Vender.
  const listados = S.mercado.listados.filter((l) => {
    const dono = buscarJogador(S.elencos, l.idJogador)?.time;
    return dono && dono !== meuTime;
  });
  const meuElenco = S.elencos[meuTime];
  const ofertas = S.mercado.ofertas;

  // §5: transferências IA↔IA desta janela (mesma rodada em que ela abriu),
  // sem envolver o humano — resumo pra visibilidade, sem participação dele.
  const historicoDaJanela = S.mercado.historico.filter((h) => h.rodada === S.rodada);
  const movimentacoesIA = historicoDaJanela.filter((h) => h.de !== meuTime && h.para !== meuTime);

  // Manchetes (spec-marco2-polish.md §2): cobrem TODA a janela (inclusive
  // movimentações do humano), recalculadas ao vivo — refletem o estado atual
  // e já valem como resumo final quando ele clica em "Fechar janela".
  const manchetes = gerarManchetes(S, historicoDaJanela);

  return (
    <div className="pt-6">
      <Eyebrow>{tituloJanela}</Eyebrow>
      <div className="flex items-center justify-between mt-1">
        <h2 className="text-xl font-black italic">Mercado</h2>
        <span className="text-xs font-bold tabular-nums" style={{ color: "#FFC53D" }}>
          Orçamento: L$ {S.orcamento[meuTime]}
        </span>
      </div>

      <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={card}>
        <Eyebrow>Movimentações da janela</Eyebrow>
        <div className="mt-1 space-y-1 font-semibold" style={{ color: "#F2EDFA" }}>
          {manchetes.map((m, i) => <div key={i}>{m}</div>)}
        </div>
        {movimentacoesIA.length > 0 && (
          <div className="mt-2 space-y-0.5" style={{ color: "#A78FC7" }}>
            {movimentacoesIA.map((h, i) => (
              <div key={i}>
                {h.jogador}: {SIGLA[h.de]} → {SIGLA[h.para]} <span style={{ color: "#FFC53D" }}>L$ {h.valor}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 mt-3">
        {ABAS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setAba(id); setErro(null); }}
            className="flex-1 rounded-lg py-2 text-xs font-bold"
            style={aba === id ? amber : card}
          >
            {label}{id === "ofertas" && ofertas.length > 0 ? ` (${ofertas.length})` : ""}
          </button>
        ))}
      </div>

      {erro && (
        <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={{ ...card, border: "1px solid #FF5A5A", color: "#FF5A5A" }}>
          {erro}
        </div>
      )}

      {aba === "comprar" && (
        <div className="mt-3 space-y-1.5">
          {listados.length === 0 && (
            <div className="text-sm text-center py-4" style={{ color: "#6E5A92" }}>Nenhum jogador à venda no momento.</div>
          )}
          {listados.map((l) => {
            const j = buscarJogador(S.elencos, l.idJogador);
            if (!j) return null;
            return (
              <div key={l.idJogador} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={card}>
                <Avatar t={j.time} sm />
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-tight truncate">{j.nome}</div>
                  {/* §8: sem atributo bruto de jogador de outro time — só o
                      preço (com mispricing) e as estatísticas reais do Copa10. */}
                  <div className="text-xs" style={{ color: "#A78FC7" }}>
                    {j.pos} · {j.g}g {j.a}a · {SIGLA[j.time]} · <Setinha jogador={j} />
                  </div>
                </div>
                <button
                  onClick={() => rodar(() => comprarNoMercado(l.idJogador))}
                  className="rounded-lg px-3 py-2 text-xs font-bold shrink-0"
                  style={amber}
                >
                  L$ {l.preco}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {aba === "vender" && (
        <div className="mt-3 space-y-1.5">
          {meuElenco.map((j) => {
            const listado = S.mercado.listados.find((l) => l.idJogador === j.id);
            const precoAtual = precos[j.id] ?? j.valor;
            return (
              <div key={j.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={card}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-tight truncate">{j.nome}</div>
                  <div className="text-xs" style={{ color: "#A78FC7" }}>
                    {j.pos} · attr {j.attr} · valor L$ {j.valor} <Setinha jogador={j} />
                  </div>
                </div>
                {listado ? (
                  <button
                    onClick={() => cancelarListagem(j.id)}
                    className="rounded-lg px-3 py-2 text-xs font-bold shrink-0 text-right"
                    style={{ ...card, border: "1px solid #FF5A5A" }}
                  >
                    à venda L$ {listado.preco}<br />retirar
                  </button>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={PISO_VALOR}
                      value={precoAtual}
                      onChange={(e) => setPrecos({ ...precos, [j.id]: e.target.value })}
                      className="w-16 rounded-lg px-2 py-2 text-xs text-right outline-none"
                      style={{ background: "#150A26", color: "#F2EDFA", border: "1px solid rgba(139,105,190,0.35)" }}
                    />
                    <button
                      onClick={() => rodar(() => listarNoMercado(j.id, Number(precoAtual) || j.valor))}
                      className="rounded-lg px-3 py-2 text-xs font-bold"
                      style={amber}
                    >
                      Vender
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {aba === "ofertas" && (
        <div className="mt-3 space-y-1.5">
          {ofertas.length === 0 && (
            <div className="text-sm text-center py-4" style={{ color: "#6E5A92" }}>Nenhuma oferta no momento.</div>
          )}
          {ofertas.map((o) => {
            const j = buscarJogador(S.elencos, o.idJogador);
            if (!j) return null;
            return (
              <div key={`${o.idJogador}-${o.timeOfertante}`} className="rounded-xl px-3 py-2.5" style={card}>
                <div className="text-sm leading-tight">
                  {j.nome} <span className="text-xs" style={{ color: "#A78FC7" }}>({j.pos})</span> <Setinha jogador={j} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#A78FC7" }}>
                  Proposta de {SIGLA[o.timeOfertante]}: <b style={{ color: "#FFC53D" }}>L$ {o.preco}</b>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => recusarOfertaHumano(o)} className="flex-1 rounded-lg py-2 text-xs font-bold" style={card}>
                    Recusar
                  </button>
                  <button onClick={() => rodar(() => aceitarOfertaHumano(o))} className="flex-1 rounded-lg py-2 text-xs font-bold" style={amber}>
                    Aceitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aba === "times" && (
        <div className="mt-3">
          {!timeVisitado ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(S.elencos).filter((t) => t !== meuTime).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeVisitado(t)}
                  className="rounded-xl px-3 py-3 flex items-center gap-2 text-left active:opacity-70"
                  style={card}
                >
                  <Avatar t={t} sm />
                  <span className="text-sm font-semibold leading-tight">{t}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => setTimeVisitado(null)}
                className="text-xs font-semibold mb-1"
                style={{ color: "#A78FC7" }}
              >
                ← Voltar aos times
              </button>
              <div className="flex items-center gap-2 mb-2">
                <Avatar t={timeVisitado} sm />
                <span className="font-bold">{timeVisitado}</span>
              </div>
              {S.elencos[timeVisitado].map((j) => (
                <div key={j.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={card}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight truncate">{j.nome}</div>
                    {/* §8: sem atributo bruto — mesmo sinal público da aba Comprar
                        (g/a reais + valor de mercado), só que pra QUALQUER
                        jogador do elenco, não só quem está listado. */}
                    <div className="text-xs" style={{ color: "#A78FC7" }}>
                      {j.pos} · {j.g}g {j.a}a · valor L$ {j.valor} <Setinha jogador={j} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={PISO_VALOR}
                      value={propostas[j.id] ?? j.valor}
                      onChange={(e) => setPropostas({ ...propostas, [j.id]: e.target.value })}
                      className="w-16 rounded-lg px-2 py-2 text-xs text-right outline-none"
                      style={{ background: "#150A26", color: "#F2EDFA", border: "1px solid rgba(139,105,190,0.35)" }}
                    />
                    <button
                      onClick={() => rodar(() => proporNoMercado(j.id, Number(propostas[j.id]) || j.valor))}
                      className="rounded-lg px-3 py-2 text-xs font-bold"
                      style={amber}
                    >
                      Propor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40" style={{ background: "linear-gradient(transparent, #150A26 30%)" }}>
        <div className="max-w-md mx-auto px-4 pb-5 pt-6">
          <button onClick={fecharJanelaEIrEscalacao} className="w-full rounded-xl py-3.5 font-bold" style={amber}>
            Fechar janela e ir pra escalação →
          </button>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
