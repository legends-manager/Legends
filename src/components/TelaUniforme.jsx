// src/components/TelaUniforme.jsx
// Tela de Uniforme (Marco de patrocínio de camisa, jul/2026): mostra a
// camisa do time (Camisa.jsx), o fornecedor de material (Sport+, fixo) e o
// patrocinador máster do peito (vendável por time — vazio = "à venda").
import Camisa from "./Camisa";
import { FORNECEDOR_CAMISA, patrocinadorMasterDoTime } from "../data/patrocinadoresCamisa";
import {
  cores, superficie, botaoSecundario, eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";

export default function TelaUniforme({ meuTime, setTela }) {
  const master = patrocinadorMasterDoTime(meuTime);

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="escalacao" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Uniforme oficial</span>
        <h2 className="text-xl font-black italic mt-1">{meuTime}</h2>

        <div className="rounded-2xl p-6 mt-3 flex items-center justify-center" style={superficie}>
          <Camisa time={meuTime} largura={220} />
        </div>

        <div className="rounded-xl px-4 py-3 mt-3 flex items-center gap-3" style={superficie}>
          <img src={FORNECEDOR_CAMISA.logo} alt={FORNECEDOR_CAMISA.nome} style={{ width: 36, height: 36, objectFit: "contain" }} />
          <div>
            <div className="text-xs" style={{ color: cores.textMuted }}>Material esportivo fornecido por</div>
            <div className="font-bold text-sm">{FORNECEDOR_CAMISA.nome}</div>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3 mt-2" style={superficie}>
          {master ? (
            <div className="flex items-center gap-3">
              <img src={master.logo} alt={master.nome} style={{ width: 36, height: 36, objectFit: "contain" }} />
              <div>
                <div className="text-xs" style={{ color: cores.textMuted }}>Patrocinador máster</div>
                <div className="font-bold text-sm">{master.nome}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-1">
              <div className="text-sm font-bold" style={{ color: cores.textSecondary }}>
                Espaço do peito ainda disponível
              </div>
              <div className="text-xs mt-1" style={{ color: cores.textMuted }}>
                Todo time pode ter um patrocinador máster estampado na camisa.
              </div>
            </div>
          )}
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
