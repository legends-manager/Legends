// src/components/Intervalo.jsx
// Substituições só no intervalo, máx. 3, goleiro só por goleiro. Times com 1
// goleiro não têm troca de goleiro (aviso curto).
// Reskin "Polish Language v1" (jul/2026): grafite/lime, mesmo fluxo/lógica.
import { golsDe } from "../engine/simulador";
import { SIGLA } from "../data/times";
import { TATICAS, ORDEM_TATICAS } from "../data/taticas";
import {
  cores, superficie, superficie2, botaoPrimario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import Cenario from "./Cenario";

// Decisão tática de intervalo (C2.2, PLANO_GAMEFEEL_AAA §4-B): primeira
// agência do jogador DENTRO da partida, além da escalação. Mesmo padrão
// visual do FormacaoSeletor (Escalacao.jsx) — grid de botões, ativo em lime,
// e mostra o efeito escolhido embaixo pra decisão ter peso percebido.
function TaticaSeletor({ tatica, escolherTatica }) {
  const t = TATICAS[tatica] || TATICAS.equilibrado;
  return (
    <div className="mt-4">
      <span style={eyebrowLime}>2º tempo — instrução tática</span>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {ORDEM_TATICAS.map((id) => {
          const ativa = id === tatica;
          return (
            <button
              key={id}
              onClick={() => escolherTatica(id)}
              className="rounded-lg py-2 px-1 text-xs font-bold active:opacity-70 leading-tight"
              style={{
                ...superficie2,
                border: `1px solid ${ativa ? cores.lime : cores.steel}`,
                color: ativa ? cores.lime : cores.textPrimary,
              }}
            >
              {TATICAS[id].label}
            </button>
          );
        })}
      </div>
      <div className="text-xs mt-1.5" style={{ color: cores.textSecondary }}>{t.desc}</div>
    </div>
  );
}

export default function Intervalo({
  S, meuTime, jogo, setJogo, selOut, setSelOut, selIn, setSelIn, iniciarSegundoTempo,
  tatica, escolherTatica,
}) {
  const j = jogo;
  const emCampo = j.minhaEsc2;
  const banco = S.elencos[meuTime].filter((p) => !emCampo.some((e) => e.id === p.id));
  const umGoleiro = S.elencos[meuTime].filter((p) => p.pos === "GOL").length === 1;
  const podeTrocar = selOut && selIn && j.subs < 3 &&
    ((selOut.pos === "GOL") === (selIn.pos === "GOL"));
  const trocar = () => {
    const novaEsc = emCampo.map((p) => (p.id === selOut.id ? selIn : p));
    setJogo({ ...j, minhaEsc2: novaEsc, subs: j.subs + 1 });
    setSelOut(null); setSelIn(null);
  };
  const gc = golsDe(j.ev1, j.casa), gf = golsDe(j.ev1, j.fora);

  return (
    <div className="pt-10" style={{ ...paginaGrafite, background: "transparent" }}>
      {/* Mesmo vestiário da Escalação (C2.7): o jogador nunca saiu do lugar,
          só trocou a prancheta pelo intervalo — coerência de cena entre as
          duas telas mais próximas no fluxo. */}
      <Cenario src="/fundos/vestiario.webp" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Intervalo · Rodada {S.rodada + 1}</span>
        <div className="rounded-2xl p-4 mt-2 text-center" style={superficie}>
          <div className="text-3xl font-black italic tabular-nums">{SIGLA[j.casa]} {gc} : {gf} {SIGLA[j.fora]}</div>
          <div className="text-xs mt-1" style={{ color: cores.textSecondary }}>Substituições: {j.subs}/3 · goleiro só por goleiro</div>
          {umGoleiro && (
            <div className="text-xs mt-1" style={{ color: cores.lime }}>Seu time tem 1 goleiro — troca de goleiro indisponível.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <span style={eyebrowLime}>Sai</span>
            <div className="mt-1 space-y-1">
              {emCampo.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelOut(selOut?.id === p.id ? null : p)}
                  className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                  style={{ ...superficie, ...(selOut?.id === p.id ? { border: `1px solid ${cores.danger}` } : {}) }}
                >
                  <span style={{ color: cores.textSecondary }}>{p.pos}</span> {p.nome}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span style={eyebrowLime}>Entra</span>
            <div className="mt-1 space-y-1">
              {banco.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelIn(selIn?.id === p.id ? null : p)}
                  className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                  style={{ ...superficie, ...(selIn?.id === p.id ? { border: `1px solid ${cores.lime}` } : {}) }}
                >
                  <span style={{ color: cores.textSecondary }}>{p.pos} {p.attr}</span> {p.nome}
                </button>
              ))}
              {banco.length === 0 && <div className="text-xs" style={{ color: cores.textMuted }}>Sem banco disponível.</div>}
            </div>
          </div>
        </div>

        <TaticaSeletor tatica={tatica} escolherTatica={escolherTatica} />

        <div className="flex gap-2 mt-4">
          <button
            disabled={!podeTrocar}
            onClick={trocar}
            className="rounded-xl px-4 py-3 font-bold text-sm disabled:opacity-40"
            style={superficie2}
          >
            Substituir
          </button>
          <button onClick={iniciarSegundoTempo} className="flex-1 rounded-xl py-3 font-bold" style={botaoPrimario}>
            Começar 2º tempo
          </button>
        </div>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
