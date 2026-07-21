// src/components/FimDeTemporada.jsx
// Liga Viva (Marco 3.5, spec-liga-viva.md §6): pódio + SOBE/DESCE/PERMANECE
// das três séries + destino do jogador. Substitui a antiga TelaCampeao (que
// mostrava só a própria série e voltava pro mesmo time — a Liga Viva reverte
// isso: agora o técnico acompanha o time pra onde ele for).
// Reskin "Polish Language v1" (F1b do PLANO_MESTRE_LEGENDS_LIMEIRA.md): esta
// é a tela "funil" do §3.3 — ganha hero art por resultado (subiu/desceu) nos
// moldes do "momento de celebração" do FIFA Heroes, além do grafite/lime já
// usado no resto do app. "Permaneceu" fica sóbrio (sem hero) — não é nem
// vitória nem derrota, não merece o mesmo destaque.
import { useEffect } from "react";
import { SERIES } from "../data/series";
import { gerarCardTemporada, compartilharCard } from "../share/cards";
import { tocarSfx } from "../storage/audio";
import { AvatarTecnico, PlacaPatrocinio } from "./ui";
import {
  cores, superficie, botaoPrimario, botaoPrimarioGlow, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor, glowLime,
} from "./entry-hub/estilos";
import { PolishDecor } from "./entry-hub/decor";
import Pacotinho from "./entry-hub/Pacotinho";
import { IconTrofeu, IconEstavel } from "./icons";

const RESULTADO_LABEL = { subiu: "Subiu", desceu: "Desceu", manteve: "Permaneceu" };
const RESULTADO_COR = { subiu: cores.success, desceu: cores.danger, manteve: cores.textSecondary };
const HERO_ART = { subiu: "/art/hero-comemoracao.jpg", desceu: "/art/rebaixamento.jpg" };

function BlocoSerie({ serieId, dados, meuTime }) {
  return (
    <div className="rounded-xl p-3 mt-3" style={superficie}>
      <div className="flex items-center justify-between">
        <span style={eyebrowLime}>{SERIES[serieId].label}</span>
        <span className="text-xs inline-flex items-center gap-1" style={{ color: cores.gold }}>
          <IconTrofeu size={13} strokeWidth={2} />{dados.campeao}
        </span>
      </div>
      {dados.sobem.length > 0 && (
        <div className="text-xs mt-2">
          <span style={{ color: cores.success }}>▲ Sobem: </span>
          <span style={{ color: cores.textSecondary }}>
            {dados.sobem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
          </span>
        </div>
      )}
      {dados.descem.length > 0 && (
        <div className="text-xs mt-1">
          <span style={{ color: cores.danger }}>▼ Descem: </span>
          <span style={{ color: cores.textSecondary }}>
            {dados.descem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
          </span>
        </div>
      )}
      <div className="text-xs mt-1" style={{ color: cores.textMuted }}>
        Permanecem: {dados.permanecem.map((t) => (t === meuTime ? `${t} (você)` : t)).join(", ")}
      </div>
    </div>
  );
}

export default function FimDeTemporada({
  resumo, meuTime, nomeTec, avatarId, temporada, proximaTemporadaCarreira,
  pacotinhoPendente, escolherPacotinho, mudo,
}) {
  const { resultado, serieDestino, meuResultado, minhaPosicao, minhaSerie } = resumo;
  const heroSrc = HERO_ART[meuResultado];
  // Campeão (Fase 3, mascote GPT Image): ouro é reservado SÓ pra conquista
  // de verdade (mesma regra do resto do app) — a mascote em ouro entra
  // exatamente aqui, o momento mais alto da temporada, sobrepondo o hero
  // padrão de "subiu" (ser campeão já implica subir, quando não está na A).
  const campeao = minhaPosicao === 1;

  // Som de celebração (Fase 3 item 10): torcida real pra campeão/acesso —
  // o momento mais alto da temporada. "Permaneceu"/"desceu" ficam em
  // silêncio, mesma sobriedade já aplicada ao hero visual (F1b).
  useEffect(() => {
    if (minhaPosicao === 1 || meuResultado === "subiu") tocarSfx("/sfx/torcida-gol.mp3", mudo, 0.8);
  }, []); // eslint-disable-line

  const compartilhar = async () => {
    // gerarCardTemporada é async (carrega a moldura oficial antes de desenhar).
    const canvas = await gerarCardTemporada({
      meuTime, nomeTec, temporada,
      serieLabel: SERIES[minhaSerie].label,
      posicao: minhaPosicao,
      resultadoLabel: RESULTADO_LABEL[meuResultado],
      serieDestinoLabel: SERIES[serieDestino].label,
    });
    compartilharCard(canvas, `legends-temporada-${temporada}`, "Fim de temporada — Legends Manager");
  };

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="fim-de-temporada" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Fim de temporada · Liga Viva</span>

        <div
          className="rounded-2xl p-6 mt-2 text-center"
          style={{ ...superficie, border: `2px solid ${RESULTADO_COR[meuResultado]}` }}
        >
          {campeao ? (
            <div
              className="overflow-hidden mx-auto mascote-comemorando"
              style={{ width: 160, height: 200, borderRadius: 16, border: `3px solid ${cores.gold}`, boxShadow: "0 0 40px rgba(255,196,0,0.5)" }}
            >
              <img src="/mascote/comemorando-ouro.webp" alt="" className="w-full h-full block" style={{ objectFit: "cover", objectPosition: "50% 15%" }} />
            </div>
          ) : heroSrc ? (
            <div
              className="overflow-hidden mx-auto"
              style={{ width: 128, height: 128, borderRadius: 999, border: `3px solid ${RESULTADO_COR[meuResultado]}`, ...glowLime(32) }}
            >
              <img src={heroSrc} alt="" className="w-full h-full block" style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <span style={{ color: cores.textMuted, display: "inline-block" }}>
              <IconEstavel size={64} strokeWidth={1.3} />
            </span>
          )}
          <div className="text-2xl font-black italic mt-3">{meuTime}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <AvatarTecnico avatarId={avatarId} nome={nomeTec} size={48} />
            <div className="text-sm font-semibold">Técnico {nomeTec || "Técnico"}</div>
          </div>
          <div className="text-sm mt-3 tabular-nums" style={{ color: cores.textSecondary }}>
            {SERIES[minhaSerie].label} · {minhaPosicao}º lugar
          </div>
          <div className="text-lg font-black italic mt-2" style={{ color: RESULTADO_COR[meuResultado] }}>
            {RESULTADO_LABEL[meuResultado]}
          </div>
          <div className="text-sm mt-1" style={{ color: cores.textSecondary }}>
            Próxima temporada: <b>{SERIES[serieDestino].label}</b>
          </div>
          {/* Patrocínio DENTRO do card do pôster: este é o print que circula no
              WhatsApp da liga — a marca sai junto em todo compartilhamento. */}
          <div className="mt-4">
            <PlacaPatrocinio />
          </div>
        </div>

        {/* Recorde de artilheiro (C2.5): App.jsx só marca isso quando o
            NOVO artilheiro recorde histórico da liga é do PRÓPRIO time do
            jogador — nunca de outro time que também disputou a série. */}
        {resumo.novoRecordeArtilheiro && (
          <div
            className="rounded-2xl p-4 mt-3 text-center"
            style={{ ...superficie, border: `1px solid ${cores.gold}`, boxShadow: "0 0 24px rgba(255,196,0,0.35)" }}
          >
            <span style={{ color: cores.gold, display: "inline-block" }}><IconTrofeu size={22} strokeWidth={1.8} /></span>
            <div className="font-black italic mt-1" style={{ color: cores.gold }}>Novo recorde da sua carreira</div>
            <div className="text-sm mt-0.5" style={{ color: cores.textSecondary }}>
              {resumo.novoRecordeArtilheiro.nome} é agora o maior artilheiro de temporada já visto na liga —{" "}
              {resumo.novoRecordeArtilheiro.gols} gols
            </div>
          </div>
        )}

        <div className="mt-4">
          <span style={eyebrowLime}>Resultado das três séries</span>
          {["A", "B", "C"].map((s) => (
            <BlocoSerie key={s} serieId={s} dados={resultado[s]} meuTime={meuTime} />
          ))}
        </div>

        <Pacotinho pacotinhoPendente={pacotinhoPendente} escolherPacotinho={escolherPacotinho} mudo={mudo} />

        <button onClick={proximaTemporadaCarreira} className="w-full rounded-xl py-3.5 font-bold mt-4" style={botaoPrimarioGlow}>
          Próxima temporada →
        </button>
        <button onClick={compartilhar} className="w-full rounded-xl py-3 font-bold mt-2 text-sm" style={botaoSecundario}>
          Compartilhar pôster no grupo
        </button>
        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
    </div>
  );
}
