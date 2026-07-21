// src/components/TelaVs.jsx
// Tela VS pré-jogo (C2.1, PLANO_GAMEFEEL_AAA §2 + §6-B): momento de matchup
// antes de toda partida ao vivo — cria investimento antes do resultado
// existir (princípio do Clash Royale). Cenário do túnel de entrada; os 2
// escudos em escala, GRANDES (regra de escala §6-B: um elemento por cena
// tem direito a dominar). Só no fluxo "Jogar ao vivo" — "Rápida" (simulação
// sem assistir) continua indo direto, sem cerimônia, porque não há nada pra
// antecipar visualmente.
import { posicaoDoTime } from "../engine/mercado";
import { ARENA } from "../data/arena";
import {
  cores, superficie, botaoPrimarioGlow, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor,
} from "./entry-hub/estilos";
import Crest from "./Crest";
import Cenario from "./Cenario";

export default function TelaVs({ S, meuTime, confronto, iniciarPartida, setTela }) {
  const c = confronto();
  const souCasa = c.casa === meuTime;
  const adv = souCasa ? c.fora : c.casa;
  const minhaPos = posicaoDoTime(S, meuTime);
  const advPos = posicaoDoTime(S, adv);

  // Frase de contexto (mesmo espírito do gancho "próxima rodada" do
  // Resultado — o confronto sempre carrega uma narrativa, não só nomes).
  const contexto =
    minhaPos === 1 ? "Você é o líder — defenda a ponta."
      : advPos === 1 ? "O líder da série. Jogo grande."
        : minhaPos < advPos ? `Você está na frente na tabela — ${adv} vem atrás.`
          : minhaPos > advPos ? `${adv} está à sua frente — hora de responder.`
            : "Times próximos na tabela — cada ponto pesa.";

  return (
    <div className="pt-10" style={{ ...paginaGrafite, background: "transparent" }}>
      <Cenario src="/fundos/tunel.webp" posicao="center 40%" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Rodada {S.rodada + 1} de {S.calendario.length}</span>

        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2" style={{ width: 120 }}>
            <div style={{ transform: "scale(1.7)" }}>
              <Crest time={meuTime} />
            </div>
            <span className="font-black italic text-center text-sm mt-4 leading-tight">{meuTime}</span>
            <span className="text-xs" style={{ color: cores.textMuted }}>{minhaPos}º lugar</span>
          </div>
          <span className="font-black italic" style={{ fontSize: 28, color: cores.lime }}>VS</span>
          <div className="flex flex-col items-center gap-2" style={{ width: 120 }}>
            <div style={{ transform: "scale(1.7)" }}>
              <Crest time={adv} />
            </div>
            <span className="font-black italic text-center text-sm mt-4 leading-tight">{adv}</span>
            <span className="text-xs" style={{ color: cores.textMuted }}>{advPos}º lugar</span>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3 mt-10 text-center" style={superficie}>
          <div className="text-sm font-bold">{souCasa ? "Você manda o jogo" : "Você joga fora"}</div>
          <div className="text-xs mt-1" style={{ color: cores.textSecondary }}>{contexto}</div>
          <div className="text-xs mt-2" style={{ color: cores.textMuted }}>{ARENA.label}</div>
        </div>

        <div className="mt-8">
          <button onClick={iniciarPartida} className="w-full rounded-xl py-4 font-bold" style={botaoPrimarioGlow}>
            Entrar em campo
          </button>
          <button onClick={() => setTela("escalacao")} className="w-full rounded-xl py-3 font-bold mt-2 text-sm" style={botaoSecundario}>
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
