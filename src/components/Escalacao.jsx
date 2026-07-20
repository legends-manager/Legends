// src/components/Escalacao.jsx
// Escalação: 7 titulares = 1 GOL + 6 de linha. Tamanho de elenco é variável.
// Inclui o modal de correção de nomes (✏️).
// Reskin "Polish Language v1" (jul/2026): grafite/lime; CTA "Jogar ao vivo"
// ganhou glow (maior compromisso da tela — abre a partida).
import { tendenciaTorcida } from "../engine/torcida";
import { setinhaValor } from "../engine/mercado";
import { confrontoPendenteDoJogador } from "../engine/copa";
import { semanaTematica } from "../engine/semana";
import { provocacaoDoTecnico } from "../data/tecnicos";
import { ORDEM_FORMACOES } from "../data/formacoes";
import { AvatarTecnico } from "./ui";
import {
  cores, superficie, superficie2, botaoPrimario, botaoPrimarioGlow, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";
import Crest from "./Crest";

const corSetinha = (s) => (s === "▲" ? cores.success : s === "▼" ? cores.danger : cores.textMuted);

const primeiroNome = (nome) => nome.trim().split(/\s+/)[0];

// Campinho: mostra a escalação selecionada em campo (GOL embaixo, DEF/MEI/ATA
// subindo) pra facilitar a visualização enquanto monta o time. Só leitura —
// a seleção continua sendo feita na lista abaixo. Gramado permanece verde
// (autenticidade esportiva); só a moldura/badges seguem o tema grafite/lime.
function Campinho({ escalados }) {
  const linhas = [
    { pos: "ATA", top: "14%" },
    { pos: "MEI", top: "40%" },
    { pos: "DEF", top: "66%" },
    { pos: "GOL", top: "87%" },
  ];
  return (
    <div
      className="relative rounded-2xl overflow-hidden mt-3"
      style={{
        height: 300,
        background: "linear-gradient(#1E7A3C, #16612E)",
        border: `1px solid ${cores.steel}`,
      }}
    >
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 37px, rgba(255,255,255,0.05) 37px, rgba(255,255,255,0.05) 75px)" }} />
      <div className="absolute inset-x-0" style={{ top: "50%", height: 2, background: "rgba(255,255,255,0.35)" }} />
      <div className="absolute rounded-full" style={{ top: "50%", left: "50%", width: 76, height: 76, transform: "translate(-50%,-50%)", border: "2px solid rgba(255,255,255,0.35)" }} />
      <div className="absolute" style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", width: 150, height: 44, border: "2px solid rgba(255,255,255,0.35)", borderBottom: "none" }} />
      <div className="absolute" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 150, height: 44, border: "2px solid rgba(255,255,255,0.35)", borderTop: "none" }} />

      {linhas.map(({ pos, top }) => {
        const fila = escalados.filter((j) => j.pos === pos);
        if (fila.length === 0) return null;
        return (
          <div key={pos} className="absolute inset-x-0 flex justify-evenly px-2" style={{ top, transform: "translateY(-50%)" }}>
            {fila.map((j) => (
              <div key={j.id} className="flex flex-col items-center" style={{ maxWidth: 76 }}>
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow"
                  style={{
                    background: pos === "GOL" ? cores.lime : cores.textPrimary,
                    color: cores.inkOnLime,
                  }}
                >
                  {j.attr}
                </span>
                <span className="text-[10px] font-semibold mt-0.5 text-center leading-tight truncate w-full" style={{ color: "#FFFFFF", textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}>
                  {primeiroNome(j.nome)}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// Seletor de formação (pedido do Felyp, jul/2026): troca o shape DEF/MEI/ATA
// dos 6 de linha. A escolha já reaplica os melhores nomes pra essa formação
// (App.jsx: escolherFormacao) e fica salva automaticamente — sem botão
// separado de "salvar", igual ao resto do jogo (save automático).
function FormacaoSeletor({ formacaoAtual, escolherFormacao }) {
  return (
    <div className="mt-3">
      <span style={eyebrowLime}>Formação</span>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {ORDEM_FORMACOES.map((id) => {
          const ativa = id === formacaoAtual;
          return (
            <button
              key={id}
              onClick={() => escolherFormacao(id)}
              className="rounded-lg py-2 text-xs font-bold active:opacity-70"
              style={{
                ...superficie2,
                border: `1px solid ${ativa ? cores.lime : cores.steel}`,
                color: ativa ? cores.lime : cores.textPrimary,
              }}
            >
              {id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModalNomes({ meuTime, textoNomes, setTextoNomes, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: cores.bgSurface2, color: cores.textPrimary }}>
        <span style={eyebrowLime}>Corrigir nomes — {meuTime}</span>
        <p className="text-xs mt-1" style={{ color: cores.textSecondary }}>
          Um nome por linha, na mesma ordem. Posições e atributos são mantidos.
        </p>
        <textarea
          value={textoNomes}
          onChange={(e) => setTextoNomes(e.target.value)}
          rows={10}
          className="w-full mt-2 rounded-xl p-3 text-sm outline-none"
          style={{ background: cores.bgField, color: cores.textPrimary, border: `1px solid ${cores.steel}` }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} className="flex-1 rounded-xl py-3 font-bold" style={botaoSecundario}>Cancelar</button>
          <button onClick={onSave} className="flex-1 rounded-xl py-3 font-bold" style={botaoPrimario}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function Escalacao({
  S, meuTime, nomeTec, avatarId, escolhidos, toggleJogador, escSelecionada, escValida,
  formacaoAtual, escolherFormacao,
  jogarAoVivo, rodadaRapida, confronto, setTela,
  modalNomes, setModalNomes, textoNomes, setTextoNomes, salvarNomes,
}) {
  const c = confronto();
  const souCasa = c.casa === meuTime;
  const adv = souCasa ? c.fora : c.casa;
  const elenco = S.elencos[meuTime];
  const grupos = ["GOL", "DEF", "MEI", "ATA"];
  const nLinha = escSelecionada().filter((j) => j.pos !== "GOL").length;
  const nGol = escSelecionada().filter((j) => j.pos === "GOL").length;
  const pendenteCopa = S.copa ? confrontoPendenteDoJogador(S.copa, meuTime) : null;

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="escalacao" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Rodada {S.rodada + 1} de {S.calendario.length}</span>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => setTela("uniforme")} className="active:opacity-70" aria-label="Ver uniforme">
            <Crest time={meuTime} />
          </button>
          <div className="flex-1">
            <div className="font-black italic">{meuTime}</div>
            <div className="text-xs" style={{ color: cores.textSecondary }}>
              vs {adv} · {souCasa ? "mandante" : "visitante"}
            </div>
          </div>
          <AvatarTecnico avatarId={avatarId} nome={nomeTec} size={32} />
          <button
            onClick={() => { setTextoNomes(elenco.map((j) => j.nome).join("\n")); setModalNomes(true); }}
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={superficie2}
          >
            nomes
          </button>
        </div>

        {S.copa && (
          <button
            onClick={() => setTela("copa")}
            className="w-full rounded-xl px-3 py-2 mt-3 text-xs font-bold flex items-center justify-between active:opacity-70"
            style={pendenteCopa ? { ...superficie, border: `1px solid ${cores.lime}` } : superficie}
          >
            <span>Copa cruzando as 3 séries</span>
            <span style={{ color: pendenteCopa ? cores.lime : cores.textMuted }}>{pendenteCopa ? "jogo pendente!" : "ver"}</span>
          </button>
        )}

        {/* Semana Temática: evento rotativo de 7 dias (engine/semana.js) —
            mesma semana pra liga inteira, derivada da data real. */}
        <div className="rounded-xl px-3 py-2 mt-3 text-xs" style={{ ...superficie, border: `1px solid ${cores.lime}` }}>
          <span style={eyebrowLime}>{semanaTematica().titulo}</span>
          <div className="mt-0.5" style={{ color: cores.textSecondary }}>{semanaTematica().desc}</div>
        </div>

        {/* Técnico convidado: provocação do técnico fictício adversário. */}
        {(() => {
          const p = provocacaoDoTecnico(adv, meuTime, S.rodada);
          return p ? (
            <div className="rounded-xl px-3 py-2 mt-2 text-xs flex items-center gap-2" style={superficie}>
              <img
                src="/mascote/confiante-lime.webp"
                alt=""
                className="mascote-idle shrink-0"
                style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover", objectPosition: "50% 12%" }}
              />
              <div className="min-w-0">
                <span style={{ color: cores.textMuted }}>{p.tecnico} · técnico do {adv} ({p.estilo})</span>
                <div className="mt-0.5 italic" style={{ color: cores.textSecondary }}>{p.frase}</div>
              </div>
            </div>
          ) : null;
        })()}

        <div className="rounded-xl px-3 py-2 mt-2 text-xs flex justify-between" style={superficie}>
          <span>Orçamento</span>
          <span className="font-bold tabular-nums" style={{ color: cores.lime }}>L$ {S.orcamento[meuTime]}</span>
        </div>

        <div className="rounded-xl px-3 py-2 mt-2 text-xs flex justify-between" style={superficie}>
          <span>Torcida</span>
          <span className="font-bold tabular-nums">
            {S.torcida[meuTime]} torcedores{" "}
            <span style={{ color: corSetinha(tendenciaTorcida(S.torcida, S.torcidaRef, meuTime)) }}>
              {tendenciaTorcida(S.torcida, S.torcidaRef, meuTime)}
            </span>
          </span>
        </div>

        {S.comentariosTorcida.length > 0 && (
          <div className="rounded-xl px-3 py-2 mt-2 text-xs" style={superficie}>
            <span style={eyebrowLime}>Torcida comenta</span>
            <div className="mt-1 space-y-1" style={{ color: cores.textSecondary }}>
              {S.comentariosTorcida.slice(-3).reverse().map((c, i) => (
                <div key={i}>· {c.texto}</div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl px-3 py-2 mt-2 text-xs flex justify-between" style={superficie}>
          <span>Escalados: <b className="tabular-nums">{nGol}</b> GOL + <b className="tabular-nums">{nLinha}</b>/6 linha</span>
          <span style={{ color: escValida() ? cores.success : cores.lime }}>{escValida() ? "pronto" : "ajuste a escalação"}</span>
        </div>

        <Campinho escalados={escSelecionada()} />

        <FormacaoSeletor formacaoAtual={formacaoAtual} escolherFormacao={escolherFormacao} />

        {grupos.map((gp) => (
          <div key={gp} className="mt-4">
            <span style={eyebrowLime}>{gp}</span>
            <div className="mt-1 space-y-1">
              {elenco.filter((j) => j.pos === gp).sort((a, b) => b.attr - a.attr).map((j) => {
                const sel = escolhidos.includes(j.id);
                return (
                  <button
                    key={j.id}
                    onClick={() => toggleJogador(j)}
                    className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2 text-left active:opacity-70"
                    style={{ ...superficie, ...(sel ? { border: `1px solid ${cores.lime}`, background: cores.bgSurface2 } : {}) }}
                  >
                    <span className="text-xs w-4 text-center" style={{ color: sel ? cores.lime : cores.textMuted }}>{sel ? "●" : "○"}</span>
                    <span className="flex-1 text-sm leading-tight">{j.nome}</span>
                    <span className="text-xs tabular-nums shrink-0" style={{ color: cores.textSecondary }}>
                      L$ {j.valor} <span style={{ color: corSetinha(setinhaValor(j)) }}>{setinhaValor(j)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-12 h-1.5 rounded-full overflow-hidden inline-block" style={{ background: cores.steel }}>
                        <span className="h-full block rounded-full" style={{ width: `${j.attr}%`, background: cores.lime }} />
                      </span>
                      <span className="tabular-nums text-xs" style={{ color: cores.textSecondary }}>{j.attr}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* bottom-16: fica ACIMA do BottomNav fixo (App.jsx) — as duas barras
            sempre coexistem aqui (Escalação exige S, que é exatamente quando o
            BottomNav aparece), então a posição é sempre relativa a ele, não a
            uma condição própria.
            Bug histórico documentado (AUDITORIA_VISUAL_MOBILE.md achado 1 /
            REDESIGN_LEGENDS_MANAGER.md §5.1): a barra fixa cobria o último
            jogador da lista porque o espaçador abaixo não incluía
            env(safe-area-inset-bottom) — em iPhones com home indicator o
            cálculo ficava justo demais. Corrigido: espaçador em calc() com a
            margem de segurança do sistema somada, não mais um valor fixo. */}
        <div
          className="fixed bottom-16 inset-x-0 z-40"
          style={{ background: `linear-gradient(transparent, ${cores.bgBase} 30%)`, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-md mx-auto px-4 pb-5 pt-6 flex gap-2">
            <button
              disabled={!escValida()}
              onClick={jogarAoVivo}
              className="flex-1 rounded-xl py-3.5 font-bold disabled:opacity-40"
              style={botaoPrimarioGlow}
            >
              Jogar ao vivo
            </button>
            <button
              disabled={!escValida()}
              onClick={rodadaRapida}
              className="rounded-xl px-4 py-3.5 font-bold disabled:opacity-40"
              style={superficie2}
            >
              Rápida
            </button>
          </div>
        </div>
        <div style={{ height: "calc(10rem + env(safe-area-inset-bottom))" }} />

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
    </div>
  );
}
