// Telas de apresentação do slice Entry & Career Hub (Task 05.1H) —
// implementação visual da família congelada "Polish Language v1" (Figma
// 05.1, nodes 184:3/184:15/184:33/184:43/184:91/184:119/184:141).
// Camada 100% de apresentação: todo comportamento vem por props do
// TelaInicial/App (callbacks existentes); nenhum acesso a storage, rede ou
// motor além de leituras de dados já carregados.
import { useState, useMemo } from "react";
import { SERIES, ORDEM_SERIES, TODOS_OS_TIMES } from "../../data/series";
import { SIGLA } from "../../data/times";
import { totalRodadas } from "../../engine/calendario";
import { ORCAMENTO_INICIAL } from "../../engine/mercado";
import {
  cores, superficie, superficie2, botaoPrimario, botaoPrimarioGlow, botaoSecundario,
  eyebrowLime, paginaGrafite, conteudoAcimaDaDecor, glowLime,
} from "./estilos";
import { criarDisparoUnico } from "./onboarding";
import { PolishDecor } from "./decor";
import Crest from "../Crest";

const siglaDe = (time) => SIGLA[time] || time.slice(0, 3).toUpperCase();

// ---------- blocos compartilhados ----------
function EyebrowLime({ children }) {
  return <div style={eyebrowLime}>{children}</div>;
}

function BotaoPrimario({ children, onClick, disabled, glow }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 active:opacity-80 disabled:opacity-50"
      style={glow ? botaoPrimarioGlow : botaoPrimario}
    >
      {children}
    </button>
  );
}

function BotaoTexto({ children, onClick, cor = cores.textPrimary }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 text-left active:opacity-70"
      style={{ minHeight: 44, color: cor, fontWeight: 700, background: "transparent" }}
    >
      {children}
    </button>
  );
}

// Rodapé padrão do produto (mesmo texto do ui.jsx, na paleta do slice).
function RodapeSlice() {
  return (
    <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
      Legends Manager · Simulação — BETA
    </p>
  );
}

// ---------- Estado 1 — Entry sem carreira (Figma 184:3) ----------
export function EntryNoCareer({
  onComecar, verHistoriaLiga, verRanking, loginSlot, hintSlot, avisoSemSave,
}) {
  const serieC = SERIES.C;
  const rodadas = totalRodadas(serieC.times.length);
  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="entry-sem-carreira" />
      <div style={conteudoAcimaDaDecor}>
        <EyebrowLime>Liga Fut7 · Série C</EyebrowLime>

        {/* Capa oficial (jul/2026): asset de marca com o logo real (onça +
            coroa) e a marca "Legends Manager" já desenhados na imagem — por
            isso o H1 de texto foi removido daqui, pra não duplicar o nome
            do app duas vezes na mesma tela. */}
        <div
          className="mt-3 overflow-hidden"
          style={{ borderRadius: 10, border: `1px solid ${cores.lime}`, ...glowLime(28) }}
        >
          <img
            src="/art/capa-legends.jpg"
            alt="Legends Manager"
            className="w-full block"
            style={{ aspectRatio: "3/2", objectFit: "cover" }}
          />
        </div>

        <p className="mt-3" style={{ color: cores.textSecondary, fontSize: 15 }}>
          Assuma um clube real da Legends Liga Fut7 e comande a temporada:
          escalação, mercado e a briga pelo título.
        </p>

        <div className="mt-3 p-4 text-center" style={{ ...superficie, background: cores.navy }}>
          <div style={{ fontSize: 18, fontWeight: 900, fontStyle: "italic" }}>
            {TODOS_OS_TIMES.length} CLUBES REAIS
          </div>
          <div className="mt-1" style={{ color: cores.textSecondary, fontSize: 13 }}>
            Séries A, B e C · {rodadas} rodadas na Série C · pontos corridos, ida e volta
          </div>
        </div>

        {avisoSemSave && (
          <div className="mt-4 p-3" style={{ ...superficie, borderColor: cores.danger, color: cores.danger, fontSize: 12 }}>
            Não consegui acessar o armazenamento deste navegador (aba privada?). Dá pra
            jogar normalmente, mas o progresso não será salvo ao fechar.
          </div>
        )}

        {loginSlot && <div className="mt-5">{loginSlot}</div>}

        <div className="mt-6">
          <BotaoPrimario onClick={onComecar}>Começar nova carreira</BotaoPrimario>
        </div>
        <div className="mt-2">
          {/* Ação congelada restaurada (05.1H.1): história da liga permanece
              acessível mesmo sem carreira, com estado vazio honesto (ver
              HistoriaLiga.jsx). Ranking continua acessível separadamente
              logo abaixo, sem substituir esta ação. */}
          <BotaoTexto onClick={verHistoriaLiga}>Ver história da liga</BotaoTexto>
        </div>
        <div className="mt-1">
          <BotaoTexto onClick={verRanking} cor={cores.textMuted}>Ver ranking online</BotaoTexto>
        </div>

        {hintSlot}
        <RodapeSlice />
      </div>
    </div>
  );
}

// ---------- Estado 3 — Escolha de divisão (Figma 184:33) ----------
const DESCRICAO_DIVISAO = {
  C: { titulo: "Série C — início recomendado", corpo: "Onde tudo começa: elencos equilibrados e briga direta pelo acesso." },
  B: { titulo: "Série B — desafio intermediário", corpo: "10 clubes reais, elencos mais fortes. Para quem já conhece o motor do jogo." },
  A: { titulo: "Série A — competição avançada", corpo: "Nível Kings League Brasil. Times de elite, temporada mais disputada." },
};

export function DivisionSelection({ divisaoSelecionada, onEscolherDivisao, onAvancar, onVoltar }) {
  // Ordem de exibição: C primeiro (recomendada), depois B e A — mas TODAS as
  // divisões disponíveis são escolhíveis livremente (nada força a Série C).
  const ordem = ["C", "B", "A"].filter((id) => SERIES[id].disponivel);
  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="divisao" />
      <div style={conteudoAcimaDaDecor}>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic" }}>Escolha sua divisão</h1>
        <p className="mt-2" style={{ color: cores.textSecondary, fontSize: 14 }}>
          Cada série tem 10–12 clubes reais. Você pode trocar de divisão em carreiras futuras.
        </p>

        <div className="mt-5 space-y-3">
          {ordem.map((id) => {
            const ativa = divisaoSelecionada === id;
            const d = DESCRICAO_DIVISAO[id];
            return (
              <button
                key={id}
                onClick={() => onEscolherDivisao(id)}
                className="w-full p-4 text-left active:opacity-80"
                style={{
                  ...superficie,
                  border: `1px solid ${ativa ? cores.lime : cores.steel}`,
                  minHeight: 44,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15, color: ativa ? cores.lime : cores.textPrimary }}>
                  {d.titulo}
                </div>
                <div className="mt-1" style={{ color: ativa ? cores.limeDim : cores.textSecondary, fontSize: 13 }}>
                  {d.corpo}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <BotaoPrimario onClick={onAvancar} disabled={!divisaoSelecionada}>
            Escolher clube
          </BotaoPrimario>
        </div>
        <div className="mt-2">
          <BotaoTexto onClick={onVoltar}>Voltar</BotaoTexto>
        </div>
      </div>
    </div>
  );
}

// ---------- Estado 4 — Escolha de clube (Figma 184:43) ----------
export function ClubSelection({ divisao, onEscolherClube, onVoltar }) {
  const serie = SERIES[divisao];
  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="clube" />
      <div style={conteudoAcimaDaDecor}>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic" }}>Escolha seu clube</h1>
        <p className="mt-2" style={{ color: cores.textSecondary, fontSize: 14 }}>
          {serie.label} · {serie.times.length} clubes reais da Legends Liga Fut7
        </p>

        <div className="mt-5 space-y-2">
          {serie.times.map((t) => (
            <button
              key={t}
              onClick={() => onEscolherClube(t)}
              className="w-full p-3 flex items-center gap-3 text-left active:opacity-80"
              style={{ ...superficie, minHeight: 44 }}
            >
              <Crest time={t} sm />
              <span className="min-w-0 flex-1">
                {/* Nome real do clube: nunca truncar (regra travada) */}
                <span className="block" style={{ fontWeight: 800, fontSize: 15 }}>{t}</span>
                <span className="block" style={{ color: cores.textMuted, fontSize: 12 }}>
                  {siglaDe(t)} · {serie.label} · {serie.elencos[t] ? `${serie.elencos[t].length} jogadores` : "elenco real"}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <BotaoTexto onClick={onVoltar}>Voltar</BotaoTexto>
        </div>
      </div>
    </div>
  );
}

// ---------- Estado 5 — Confirmação do clube (Figma 184:91) ----------
export function ClubConfirmation({
  divisao, clube, onIniciar, onTrocarClube, nomeTec, setNomeTec, avisoSemSave,
}) {
  const serie = SERIES[divisao];
  const rodadas = totalRodadas(serie.times.length);
  const elenco = serie.elencos[clube] || [];
  const goleiros = elenco.filter((j) => j.pos === "GOL").length;
  // Proteção de disparo único (§10 estado 5): iniciarTemporada é chamado no
  // máximo UMA vez por montagem desta tela, mesmo com duplo clique — o
  // estado `iniciando` também desabilita o botão visualmente.
  const [iniciando, setIniciando] = useState(false);
  const dispararUmaVez = useMemo(
    () => criarDisparoUnico(() => { setIniciando(true); onIniciar(clube); }),
    [clube] // eslint-disable-line
  );

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="confirmacao" />
      <div style={conteudoAcimaDaDecor}>
        <EyebrowLime>Último passo</EyebrowLime>
        <div className="mt-3 flex items-center gap-3">
          <Crest time={clube} />
          <div className="min-w-0">
            <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic" }}>{clube}</div>
            <div style={{ color: cores.textSecondary, fontSize: 13 }}>
              {serie.label} · {elenco.length} jogadores no elenco real
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>L$ {ORCAMENTO_INICIAL}</div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Orçamento inicial</div>
          </div>
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
              {goleiros} GOL
            </div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>
              {goleiros === 1 ? "Sem troca de goleiro" : "Goleiros no elenco"}
            </div>
          </div>
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>{rodadas}</div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Rodadas na temporada</div>
          </div>
        </div>

        <div className="mt-4 p-4" style={superficie}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>O que te espera na {serie.label}</div>
          <ul className="mt-2 space-y-2" style={{ color: cores.textSecondary, fontSize: 13 }}>
            <li>• {rodadas} rodadas, pontos corridos, ida e volta.</li>
            <li>• {serie.times.length - 1} adversários controlados por IA — favoritos existem, zebras acontecem.</li>
            <li>• Todas as partidas na Arena Novo Horizonte, Limeira-SP.</li>
          </ul>
        </div>

        <div className="mt-4">
          <label style={{ ...eyebrowLime, color: cores.textMuted }}>Nome do técnico</label>
          <input
            value={nomeTec}
            onChange={(e) => setNomeTec(e.target.value)}
            placeholder="Seu nome (sai no pôster de campeão)"
            className="w-full mt-1 px-4 py-3 outline-none"
            style={{ ...superficie, background: cores.bgField, fontSize: 14 }}
          />
        </div>

        <p className="mt-3" style={{ color: cores.textMuted, fontSize: 12 }}>
          {avisoSemSave
            ? "Sem armazenamento neste navegador: dá pra jogar, mas o progresso não será salvo."
            : "O progresso é salvo automaticamente neste dispositivo."}
        </p>

        <div className="mt-5">
          <BotaoPrimario onClick={dispararUmaVez} disabled={iniciando} glow>
            {iniciando ? "Criando carreira…" : "Iniciar carreira"}
          </BotaoPrimario>
        </div>
        <div className="mt-2">
          {/* Decisão travada: volta pra escolha de clube preservando a divisão.
              NUNCA novoJogo(), NUNCA limpa storage, NUNCA toca no mundo. */}
          <BotaoTexto onClick={onTrocarClube}>Trocar clube</BotaoTexto>
        </div>
      </div>
    </div>
  );
}

// ---------- Estado 2 — Entry carreira existente (Figma 184:15) ----------
export function EntryExistingCareer({
  mundo, nomeTec, saveData, continuarJogo, retomarCarreiraSemSave,
  verHistoricoCarreira, verHistoriaLiga, onNovoJogo, loginSlot, hintSlot, verRanking,
  verAlbumLendas,
}) {
  const minhaSerie = mundo.divisao[mundo.meuTime];
  const serie = SERIES[minhaSerie];
  const [confirmaNovoJogo, setConfirmaNovoJogo] = useState(false);

  // Resumo honesto a partir do que JÁ está salvo (nunca fabricar): posição
  // não é recalculada aqui — mostramos pontos e rodada do save; posição só
  // aparece dentro da temporada (Career Hub) ou no histórico.
  const totalSalvo = saveData ? saveData.temporada.calendario.length : 0;
  const rodadaSalva = saveData ? Math.min(saveData.temporada.rodadaAtual + 1, totalSalvo) : 0;
  const encerrada = saveData && saveData.temporada.rodadaAtual >= totalSalvo;
  const pontosSalvos = saveData?.temporada?.tabela?.[mundo.meuTime]?.P;
  const orcamentoSalvo = saveData?.orcamento?.[mundo.meuTime];

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="entry-existente" />
      <div style={conteudoAcimaDaDecor}>
        <EyebrowLime>Bem-vindo de volta</EyebrowLime>
        <div className="mt-3 flex items-center gap-3">
          <Crest time={mundo.meuTime} />
          <div className="min-w-0">
            <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic" }}>{mundo.meuTime}</div>
            <div style={{ color: cores.textSecondary, fontSize: 13 }}>
              {serie.label} · Temporada {mundo.temporada}
              {nomeTec ? ` · Técnico ${nomeTec}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
              {saveData ? `${rodadaSalva}/${totalSalvo}` : "—"}
            </div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Rodada</div>
          </div>
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
              {typeof pontosSalvos === "number" ? pontosSalvos : "—"}
            </div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Pontos</div>
          </div>
          <div className="p-3" style={superficie2}>
            <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
              {typeof orcamentoSalvo === "number" ? `L$ ${orcamentoSalvo}` : "—"}
            </div>
            <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Orçamento</div>
          </div>
        </div>

        {saveData ? (
          <div className="mt-5">
            <BotaoPrimario onClick={continuarJogo}>Continuar carreira</BotaoPrimario>
            <p className="mt-2 text-center" style={{ color: cores.textMuted, fontSize: 12 }}>
              {encerrada ? "Temporada encerrada — veja a classificação final." : `Temporada ${mundo.temporada}, rodada ${rodadaSalva} de ${totalSalvo}.`}
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <BotaoPrimario onClick={retomarCarreiraSemSave}>
              Começar temporada {mundo.temporada}
            </BotaoPrimario>
          </div>
        )}

        <div className="mt-3">
          <BotaoTexto onClick={verHistoricoCarreira}>Ver histórico da carreira</BotaoTexto>
          <BotaoTexto onClick={verAlbumLendas}>Álbum de Lendas</BotaoTexto>
          <BotaoTexto onClick={verHistoriaLiga}>Ver história da liga</BotaoTexto>
          <BotaoTexto onClick={verRanking}>Ranking online</BotaoTexto>
          <BotaoTexto onClick={() => setConfirmaNovoJogo(true)} cor={cores.textMuted}>
            Começar nova carreira
          </BotaoTexto>
        </div>

        {loginSlot && <div className="mt-3">{loginSlot}</div>}
        {hintSlot}
        <RodapeSlice />
      </div>

      {confirmaNovoJogo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: cores.bgSurface2, color: cores.textPrimary }}>
            <EyebrowLime>Nova carreira</EyebrowLime>
            <p className="mt-2" style={{ color: cores.textSecondary, fontSize: 14 }}>
              Isso apaga sua carreira com o <b>{mundo.meuTime}</b> ({mundo.temporada - 1} temporada
              {mundo.temporada - 1 === 1 ? "" : "s"} disputada{mundo.temporada - 1 === 1 ? "" : "s"}) e
              todos os saves. Não dá pra desfazer.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmaNovoJogo(false)}
                className="flex-1 px-4 active:opacity-80"
                style={botaoSecundario}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmaNovoJogo(false); onNovoJogo(); }}
                className="flex-1 px-4 active:opacity-80"
                style={{ ...botaoPrimario, background: cores.danger, color: "#FFFFFF" }}
              >
                Apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Estados 6 e 7 — Career Hub (Figma 184:119 / 184:141) ----------
export function CareerHub({ mundo, nomeTec, hub, proximoJogo, setTela }) {
  const minhaSerie = mundo.divisao[mundo.meuTime];
  const serie = SERIES[minhaSerie];
  const pendente = hub.estado === "pendente";

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante={pendente ? "hub-pendente" : "hub-principal"} />
      <div style={conteudoAcimaDaDecor}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <EyebrowLime>{mundo.meuTime} · {serie.label}</EyebrowLime>
          <h1 className="mt-1" style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic" }}>
            Central da Carreira
          </h1>
          <div className="mt-1" style={{ color: cores.textSecondary, fontSize: 13 }}>
            Temporada {mundo.temporada} · Rodada {hub.rodadaAtual} de {hub.totalRodadas}
            {nomeTec ? ` · Técnico ${nomeTec}` : ""}
          </div>
        </div>
        {hub.posicao != null && (
          <div
            aria-label={`Posição atual: ${hub.posicao}º`}
            style={{
              width: 52, height: 52, borderRadius: 999, flexShrink: 0,
              border: `2px solid ${cores.lime}`, color: cores.lime,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 17, background: cores.bgSurface,
            }}
          >
            {hub.posicao}º
          </div>
        )}
      </div>

      {pendente && (
        <div className="mt-4">
          <div style={{ color: cores.danger, fontWeight: 800, fontSize: 13, letterSpacing: "0.06em" }}>
            AÇÃO NECESSÁRIA
          </div>
          {hub.pendencias.map((p, i) =>
            p.tipo === "escalacao" ? (
              <div key={i} className="mt-2 p-4" style={{ ...superficie, borderColor: cores.danger }}>
                <div style={{ color: cores.danger, fontWeight: 800, fontSize: 15 }}>Escalação incompleta</div>
                <div className="mt-1" style={{ color: cores.textSecondary, fontSize: 13 }}>
                  {p.semGoleiro
                    ? "Falta escalar um goleiro para a próxima rodada."
                    : `Faltam ${p.faltam} titular${p.faltam === 1 ? "" : "es"} para a próxima rodada. Complete antes do início da partida.`}
                </div>
                <div className="mt-3">
                  <BotaoPrimario onClick={() => setTela("escalacao")}>Ir para escalação</BotaoPrimario>
                </div>
              </div>
            ) : (
              <button
                key={i}
                onClick={() => setTela(hub.destinoOferta)}
                className="w-full mt-2 p-4 text-left active:opacity-80"
                style={superficie}
              >
                <div style={{ fontWeight: 800, fontSize: 15 }}>Nova oferta recebida</div>
                <div className="mt-1" style={{ color: cores.textSecondary, fontSize: 13 }}>
                  {p.quantidade === 1
                    ? "Um clube fez uma proposta por um jogador seu. Toque para ver no Mercado."
                    : `${p.quantidade} clubes fizeram propostas por jogadores seus. Toque para ver no Mercado.`}
                </div>
              </button>
            )
          )}
        </div>
      )}

      {!pendente && proximoJogo && (
        <div className="mt-4 p-4" style={{ ...superficie, background: cores.navy }}>
          <div className="flex items-center justify-between">
            <span style={eyebrowLime}>{serie.label} — Legends Liga</span>
            <span style={{ color: cores.textSecondary, fontSize: 12, fontWeight: 700 }}>
              Rodada {hub.rodadaAtual} de {hub.totalRodadas}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="text-center">
              <Crest time={proximoJogo.casa} sm />
              <div className="mt-1" style={{ fontSize: 12, fontWeight: 700 }}>{proximoJogo.casa}</div>
            </div>
            <span style={{ color: cores.textMuted, fontWeight: 900 }}>×</span>
            <div className="text-center">
              <Crest time={proximoJogo.fora} sm />
              <div className="mt-1" style={{ fontSize: 12, fontWeight: 700 }}>{proximoJogo.fora}</div>
            </div>
          </div>
          <div className="mt-2 text-center" style={{ color: cores.textMuted, fontSize: 12 }}>
            Arena Novo Horizonte — Limeira, SP
          </div>
          <div className="mt-3">
            <BotaoPrimario onClick={() => setTela(hub.destinoJogar)}>Ver detalhes</BotaoPrimario>
          </div>
        </div>
      )}

      {!pendente && !proximoJogo && (
        <div className="mt-4 p-4" style={superficie}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            {hub.temporadaEncerrada ? "Temporada encerrada" : "Elenco pronto para a rodada"}
          </div>
          <div className="mt-1" style={{ color: cores.textSecondary, fontSize: 13 }}>
            {hub.temporadaEncerrada
              ? "Veja a classificação final na Tabela para fechar a temporada."
              : "Escalação titular completa. Boa rodada!"}
          </div>
          <div className="mt-3">
            <BotaoPrimario onClick={() => setTela(hub.destinoJogar)}>
              {hub.temporadaEncerrada ? "Ver classificação final" : hub.janelaAberta ? "Ir para o mercado" : "Ir para escalação"}
            </BotaoPrimario>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="p-3" style={superficie2}>
          <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
            {hub.posicao != null ? `${hub.posicao}º` : "—"}
          </div>
          <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Posição</div>
        </div>
        <div className="p-3" style={superficie2}>
          <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
            {hub.pontos != null ? hub.pontos : "—"}
          </div>
          <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Pontos</div>
        </div>
        <div className="p-3" style={superficie2}>
          <div style={{ color: cores.lime, fontWeight: 900, fontSize: 16 }}>
            {hub.orcamento != null ? `L$ ${hub.orcamento}` : "—"}
          </div>
          <div className="mt-1" style={{ color: cores.textMuted, fontSize: 12 }}>Orçamento</div>
        </div>
      </div>

      {/* Correção (jul/2026): antes só dava pra ver o histórico/galeria de
          insígnias na tela de abertura, antes de S carregar — uma vez dentro
          da temporada não tinha mais como chegar lá. */}
      <div className="mt-3">
        <BotaoTexto onClick={() => setTela("historiaCarreira")}>Ver histórico e insígnias</BotaoTexto>
        <BotaoTexto onClick={() => setTela("albumLendas")}>Álbum de Lendas</BotaoTexto>
      </div>

      <RodapeSlice />
      </div>
    </div>
  );
}
