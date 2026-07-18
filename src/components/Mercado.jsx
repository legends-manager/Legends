// src/components/Mercado.jsx
// Marco 2 — Mercado de Transferências (spec-mercado.md §4). Três abas:
// Comprar / Vender / Ofertas / Times. As travas §3.3 (<7 jogadores, sem
// goleiro, >18) são aplicadas no engine (engine/mercado.js) — esta tela só
// repassa o {ok, motivo} de volta pro jogador quando uma ação é bloqueada.
// Reskin "Polish Language v1" (jul/2026, Fase 1a do PLANO_MESTRE): grafite/
// lime; nome completo do clube ao lado da sigla (achado 2 da auditoria
// mobile); barra fixa com env(safe-area-inset-bottom) (mesmo bug do achado 1,
// corrigido aqui também).
import { useState } from "react";
import { SIGLA } from "../data/times";
import { PISO_VALOR, buscarJogador, setinhaValor } from "../engine/mercado";
import { gerarManchetes } from "../engine/manchetes";
import {
  cores, superficie, superficie2, botaoPrimario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";
import Crest from "./Crest";

const corSetinha = (s) => (s === "▲" ? cores.success : s === "▼" ? cores.danger : cores.textMuted);
const Setinha = ({ jogador }) => (
  <span style={{ color: corSetinha(setinhaValor(jogador)) }}>{setinhaValor(jogador)}</span>
);

const ABAS = [
  ["comprar", "Comprar"],
  ["vender", "Vender"],
  ["ofertas", "Ofertas"],
  ["times", "Times"],
];

const InputPreco = ({ value, onChange }) => (
  <input
    type="number"
    min={PISO_VALOR}
    value={value}
    onChange={onChange}
    className="w-16 rounded-lg px-2 py-2 text-xs text-right outline-none"
    style={{ background: cores.bgField, color: cores.textPrimary, border: `1px solid ${cores.steel}` }}
  />
);

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
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="mercado" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>{tituloJanela}</span>
        <div className="flex items-center justify-between mt-1">
          <h2 className="text-xl font-black italic">Mercado</h2>
          <span className="text-xs font-bold tabular-nums" style={{ color: cores.lime }}>
            Orçamento: L$ {S.orcamento[meuTime]}
          </span>
        </div>

        <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={superficie}>
          <span style={eyebrowLime}>Movimentações da janela</span>
          <div className="mt-1 space-y-1 font-semibold" style={{ color: cores.textPrimary }}>
            {manchetes.map((m, i) => <div key={i}>{m}</div>)}
          </div>
          {movimentacoesIA.length > 0 && (
            <div className="mt-2 space-y-0.5" style={{ color: cores.textSecondary }}>
              {movimentacoesIA.map((h, i) => (
                <div key={i}>
                  {h.jogador}: {h.de} ({SIGLA[h.de]}) → {h.para} ({SIGLA[h.para]}) <span style={{ color: cores.lime }}>L$ {h.valor}</span>
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
              style={aba === id ? { background: cores.lime, color: cores.inkOnLime } : superficie2}
            >
              {label}{id === "ofertas" && ofertas.length > 0 ? ` (${ofertas.length})` : ""}
            </button>
          ))}
        </div>

        {erro && (
          <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={{ ...superficie, border: `1px solid ${cores.danger}`, color: cores.danger }}>
            {erro}
          </div>
        )}

        {aba === "comprar" && (
          <div className="mt-3 space-y-1.5">
            {listados.length === 0 && (
              <div className="text-sm text-center py-4" style={{ color: cores.textMuted }}>Nenhum jogador à venda no momento.</div>
            )}
            {listados.map((l) => {
              const j = buscarJogador(S.elencos, l.idJogador);
              if (!j) return null;
              return (
                <div key={l.idJogador} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={superficie}>
                  <Crest time={j.time} sm />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight">{j.nome}</div>
                    {/* §8: sem atributo bruto de jogador de outro time — só o
                        preço (com mispricing) e as estatísticas reais do Copa10. */}
                    <div className="text-xs" style={{ color: cores.textSecondary }}>
                      {j.pos} · {j.g}g {j.a}a · {j.time} · <Setinha jogador={j} />
                    </div>
                  </div>
                  <button
                    onClick={() => rodar(() => comprarNoMercado(l.idJogador))}
                    className="rounded-lg px-3 py-2 text-xs font-bold shrink-0"
                    style={{ background: cores.lime, color: cores.inkOnLime }}
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
                <div key={j.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={superficie}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight">{j.nome}</div>
                    <div className="text-xs" style={{ color: cores.textSecondary }}>
                      {j.pos} · attr {j.attr} · valor L$ {j.valor} <Setinha jogador={j} />
                    </div>
                  </div>
                  {listado ? (
                    <button
                      onClick={() => cancelarListagem(j.id)}
                      className="rounded-lg px-3 py-2 text-xs font-bold shrink-0 text-right"
                      style={{ ...superficie2, border: `1px solid ${cores.danger}` }}
                    >
                      à venda L$ {listado.preco}<br />retirar
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <InputPreco value={precoAtual} onChange={(e) => setPrecos({ ...precos, [j.id]: e.target.value })} />
                      <button
                        onClick={() => rodar(() => listarNoMercado(j.id, Number(precoAtual) || j.valor))}
                        className="rounded-lg px-3 py-2 text-xs font-bold"
                        style={{ background: cores.lime, color: cores.inkOnLime }}
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
              <div className="text-sm text-center py-4" style={{ color: cores.textMuted }}>Nenhuma oferta no momento.</div>
            )}
            {ofertas.map((o) => {
              const j = buscarJogador(S.elencos, o.idJogador);
              if (!j) return null;
              return (
                <div key={`${o.idJogador}-${o.timeOfertante}`} className="rounded-xl px-3 py-2.5" style={superficie}>
                  <div className="text-sm leading-tight">
                    {j.nome} <span className="text-xs" style={{ color: cores.textSecondary }}>({j.pos})</span> <Setinha jogador={j} />
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: cores.textSecondary }}>
                    Proposta de {o.timeOfertante} ({SIGLA[o.timeOfertante]}): <b style={{ color: cores.lime }}>L$ {o.preco}</b>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => recusarOfertaHumano(o)} className="flex-1 rounded-lg py-2 text-xs font-bold" style={superficie2}>
                      Recusar
                    </button>
                    <button onClick={() => rodar(() => aceitarOfertaHumano(o))} className="flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: cores.lime, color: cores.inkOnLime }}>
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
                    style={superficie}
                  >
                    <Crest time={t} sm />
                    <span className="text-sm font-semibold leading-tight">{t}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={() => setTimeVisitado(null)}
                  className="text-xs font-semibold mb-1"
                  style={{ color: cores.textSecondary }}
                >
                  ← Voltar aos times
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Crest time={timeVisitado} sm />
                  <span className="font-bold">{timeVisitado}</span>
                </div>
                {S.elencos[timeVisitado].map((j) => (
                  <div key={j.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={superficie}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-tight">{j.nome}</div>
                      {/* §8: sem atributo bruto — mesmo sinal público da aba Comprar
                          (g/a reais + valor de mercado), só que pra QUALQUER
                          jogador do elenco, não só quem está listado. */}
                      <div className="text-xs" style={{ color: cores.textSecondary }}>
                        {j.pos} · {j.g}g {j.a}a · valor L$ {j.valor} <Setinha jogador={j} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <InputPreco value={propostas[j.id] ?? j.valor} onChange={(e) => setPropostas({ ...propostas, [j.id]: e.target.value })} />
                      <button
                        onClick={() => rodar(() => proporNoMercado(j.id, Number(propostas[j.id]) || j.valor))}
                        className="rounded-lg px-3 py-2 text-xs font-bold"
                        style={{ background: cores.lime, color: cores.inkOnLime }}
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

        {/* bottom-16: fica ACIMA do BottomNav fixo (App.jsx) — Mercado sempre
            exige S, mesma condição que faz o BottomNav aparecer.
            Mesmo bug do achado 1 (AUDITORIA_VISUAL_MOBILE.md), corrigido
            aqui também: espaçador em calc() com env(safe-area-inset-bottom). */}
        <div
          className="fixed bottom-16 inset-x-0 z-40"
          style={{ background: `linear-gradient(transparent, ${cores.bgBase} 30%)`, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-md mx-auto px-4 pb-5 pt-6">
            <button onClick={fecharJanelaEIrEscalacao} className="w-full rounded-xl py-3.5 font-bold" style={botaoPrimario}>
              Fechar janela e ir pra escalação →
            </button>
          </div>
        </div>
        <div style={{ height: "calc(10rem + env(safe-area-inset-bottom))" }} />
      </div>
    </div>
  );
}
