// src/components/Resultado.jsx
// Tela de resultado: placar, Craque da Partida, gols e resultados da rodada.
// ARENA.label na linha de contexto com a rodada.
// Reskin "Polish Language v1" (jul/2026): grafite/lime, mesmo fluxo/lógica.
import { useState } from "react";
import { ARENA } from "../data/arena";
import LoginOnline from "./LoginOnline";
import { SIGLA } from "../data/times";
import { SERIES } from "../data/series";
import { gerarCardResultado, compartilharCard } from "../share/cards";
import {
  cores, superficie, botaoPrimario, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";
import Crest from "./Crest";
import { IconTrofeu } from "./icons";

// Convite de login pós-vitória (ideia principal aprovada pelo Felyp,
// jul/2026): a maioria da liga joga 100% offline e nunca entra no ranking
// (só 3 contas vinculadas até jul/2026). O momento de euforia — acabou de
// vencer — é a melhor hora pra convidar. Regras anti-chatice: só em
// vitória, só deslogado, e se dispensar não volta por 3 dias.
const CHAVE_CTA_LOGIN = "legends-manager:cta-login-dispensado";
const DIAS_SILENCIO = 3;

function ctaLoginDispensadoRecentemente() {
  try {
    const em = window.localStorage.getItem(CHAVE_CTA_LOGIN);
    return em != null && Date.now() - Number(em) < DIAS_SILENCIO * 86400000;
  } catch (e) { return true; }
}

export default function Resultado({ resumo, serie, setTela, sessao, irProximaRodada }) {
  const r = resumo;
  const meu = r.jogos[0];
  const gols = r.evMeu.filter((e) => e.tipo === "gol").sort((a, b) => a.min - b.min);
  const [ctaFechado, setCtaFechado] = useState(false);
  // `venci` vem pronto do App.jsx (que sabe qual lado é o do humano).
  const mostrarCtaLogin = r.venci && !sessao && !ctaFechado && !ctaLoginDispensadoRecentemente();

  // Vitória ≠ derrota (C1.3, PLANO_GAMEFEEL_AAA §1): as duas emoções mais
  // opostas do jogo não podem ser a mesma tela. Vitória = lime + glow;
  // derrota = danger sóbrio (sem glow — energia é pra celebração); empate =
  // neutro. Muda moldura e rótulo, não o layout (leitura continua idêntica).
  const tom = r.venci
    ? { rotulo: "VITÓRIA", cor: cores.lime, borda: cores.lime, glow: { boxShadow: "0 0 28px rgba(198,255,30,0.3)" } }
    : r.empate
      ? { rotulo: "EMPATE", cor: cores.textSecondary, borda: cores.steel, glow: {} }
      : { rotulo: "DERROTA", cor: cores.danger, borda: cores.danger, glow: {} };

  // Gancho "mais uma rodada" (C1.4): narrativa de 1 linha derivada da tabela.
  const p = r.proxima;
  const gapLider = p ? p.pontosLider - p.meusPontos : 0;
  const fraseProxima = !p
    ? null
    : p.minhaPos === 1
      ? "Você é o líder — agora é defender a ponta."
      : p.advPos === 1
        ? "O líder te espera. Jogo grande."
        : gapLider <= 3
          ? "Vitória te coloca na briga direta pela ponta."
          : `Você está a ${gapLider} pontos do líder.`;

  const dispensarCta = () => {
    try { window.localStorage.setItem(CHAVE_CTA_LOGIN, String(Date.now())); } catch (e) { /* sem storage, só fecha */ }
    setCtaFechado(true);
  };

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
        <div
          className="rounded-2xl p-5 mt-2 text-center"
          style={{ ...superficie, border: `2px solid ${tom.borda}`, ...tom.glow }}
        >
          <div className="font-black italic text-sm uppercase tracking-widest" style={{ color: tom.cor }}>
            {tom.rotulo}
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Crest time={meu.casa} />
            <span className="font-black italic tabular-nums" style={{ fontSize: 44, lineHeight: 1 }}>{meu.gc} : {meu.gf}</span>
            <Crest time={meu.fora} />
          </div>
          <div className="text-sm font-semibold mt-2">{meu.casa} x {meu.fora}</div>
          <div className="text-xs mt-1" style={{ color: cores.textMuted }}>{ARENA.label}</div>
        </div>

        {/* Craque da Partida como momento gold de verdade (F1b do
            PLANO_MESTRE, finalmente): estrela grande, moldura gold com glow —
            é conquista, então gold é permitido pela regra da paleta. */}
        {r.craque && (
          <div
            className="rounded-xl px-4 py-4 mt-2 flex items-center gap-3"
            style={{ ...superficie, border: `1px solid ${cores.gold}`, boxShadow: "0 0 24px rgba(255,196,0,0.35)" }}
          >
            <span style={{ color: cores.gold, fontSize: 34, lineHeight: 1 }}>★</span>
            <div>
              <span style={{ ...eyebrowLime, color: cores.gold }}>Craque da partida</span>
              <div className="font-black italic text-lg leading-tight">
                {r.craque.nome}
              </div>
              <div className="text-xs" style={{ color: cores.textSecondary }}>{r.craque.time}</div>
            </div>
          </div>
        )}

        {mostrarCtaLogin && (
          <div className="rounded-xl px-4 py-3 mt-2" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-bold">Essa vitória merecia valer no ranking da liga!</div>
              <button onClick={dispensarCta} className="text-xs shrink-0" style={{ color: cores.textMuted }}>
                agora não
              </button>
            </div>
            <p className="text-xs mt-1 mb-2" style={{ color: cores.textSecondary }}>
              Entra com seu e-mail e sua carreira passa a contar no ranking de técnicos — automático, sem cadastro chato.
            </p>
            <LoginOnline sessao={sessao} />
          </div>
        )}

        {/* Recorde da carreira (C2.5, PLANO_GAMEFEEL_AAA §5): App.jsx só
            marca isso quando o PRÓPRIO jogo do jogador bateu o recorde de
            goleada da liga — nunca o de outro time da rodada. */}
        {r.novoRecordeGoleada && (
          <div
            className="rounded-xl px-4 py-3 mt-2 flex items-center gap-3"
            style={{ ...superficie, border: `1px solid ${cores.gold}`, boxShadow: "0 0 24px rgba(255,196,0,0.35)" }}
          >
            <span style={{ color: cores.gold }}><IconTrofeu size={26} strokeWidth={1.8} /></span>
            <div>
              <span style={{ ...eyebrowLime, color: cores.gold }}>Novo recorde da sua carreira</span>
              <div className="font-black italic text-sm mt-0.5">Maior goleada da liga!</div>
            </div>
          </div>
        )}

        {r.bonusSemana && (
          <div className="rounded-xl px-4 py-3 mt-2 text-sm" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
            <span style={eyebrowLime}>{r.bonusSemana.titulo}</span>
            <div className="mt-1" style={{ color: cores.textSecondary }}>
              {r.bonusSemana.resumo} — <b style={{ color: cores.lime }}>+L$ {r.bonusSemana.valor}</b>
            </div>
          </div>
        )}

        {gols.length > 0 && (
          <div className="mt-3">
            <span style={eyebrowLime}>Gols</span>
            <div className="mt-1 space-y-1 lista-stagger">
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

        {/* Gancho "mais uma rodada" (C1.4): o CTA primário aponta pra próxima
            história. Sem próxima rodada (temporada acabou), volta ao fluxo
            antigo — "Ver tabela" reassume o posto de primário. */}
        {p && (
          <div className="rounded-xl px-4 py-3 mt-4" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
            <span style={eyebrowLime}>Próxima rodada</span>
            <div className="flex items-center gap-2 mt-2">
              <Crest time={p.adversario} sm />
              <div className="min-w-0">
                <div className="font-bold text-sm leading-tight">
                  vs {p.adversario} <span className="font-normal" style={{ color: cores.textMuted }}>({p.advPos}º)</span>
                </div>
                <div className="text-xs" style={{ color: cores.textSecondary }}>
                  {p.souCasa ? "mandante" : "visitante"} · {fraseProxima}
                </div>
              </div>
            </div>
          </div>
        )}
        {p ? (
          <>
            <button onClick={irProximaRodada} className="w-full rounded-xl py-3.5 font-bold mt-3" style={botaoPrimario}>
              Próxima rodada
            </button>
            <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3 font-bold mt-2 text-sm" style={botaoSecundario}>
              Ver tabela
            </button>
          </>
        ) : (
          <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3.5 font-bold mt-4" style={botaoPrimario}>
            Ver tabela
          </button>
        )}
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
