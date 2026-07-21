// src/components/AlbumLendas.jsx
// Álbum de Lendas (C2.3, PLANO_GAMEFEEL_AAA §5 — princípio Pokémon GO da
// "silhueta de desejo": o que falta é visível e nomeado). Grid das 12
// lendas fictícias de data/lendas.js — hoje a lenda some da vista assim que
// a temporada acaba (só dura 1 temporada no elenco); o álbum é a memória
// permanente da carreira, e dá uma razão de longo prazo pra abrir
// pacotinho mesmo sabendo que lendário é raro (2%): "faltam N pra
// completar", não "só mais um sorteio".
// Zero mudança de economia — é uma tela de LEITURA sobre mundo.lendasObtidas
// (App.jsx já grava isso em escolherPacotinho, engine/pacotinhos.js).
import { LENDAS } from "../data/lendas";
import {
  cores, superficie, botaoSecundario, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

const POS_LABEL = { GOL: "Goleiro", DEF: "Zagueiro", MEI: "Meio-campo", ATA: "Atacante" };

export default function AlbumLendas({ mundo, setTela }) {
  const obtidas = mundo?.lendasObtidas || [];

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="historia" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Coleção · {mundo?.meuTime}</span>
        <div className="flex items-center justify-between mt-1">
          <h2 className="text-xl font-black italic">Álbum de Lendas</h2>
          <span className="text-xs tabular-nums" style={{ color: cores.textMuted }}>
            {obtidas.length}/{LENDAS.length}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: cores.textSecondary }}>
          Cada lenda puxada em algum pacotinho fica registrada aqui pra sempre — mesmo depois que ela
          sai do seu elenco no fim da temporada.
        </p>

        <div className="mt-3 space-y-2">
          {LENDAS.map((l) => {
            const tem = obtidas.includes(l.id);
            return (
              <div
                key={l.id}
                className="rounded-xl px-4 py-3"
                style={tem
                  ? { ...superficie, border: `1px solid ${cores.gold}`, boxShadow: "0 0 20px rgba(255,196,0,0.28)" }
                  : { ...superficie, opacity: 0.45 }}
              >
                {tem ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-black italic" style={{ color: cores.gold }}>{l.nome}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: cores.textMuted }}>
                        {POS_LABEL[l.pos]} · {l.attr}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: cores.textSecondary }}>{l.bio}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="shrink-0 rounded-full flex items-center justify-center font-black"
                      style={{ width: 28, height: 28, border: `1px solid ${cores.steel}`, color: cores.textMuted }}
                    >
                      ?
                    </span>
                    <span className="text-sm font-bold" style={{ color: cores.textMuted }}>Lenda ainda não obtida</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-4" style={botaoSecundario}>
          ← Voltar
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
