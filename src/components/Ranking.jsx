// src/components/Ranking.jsx
// Ranking online — mais uma tela do jogo (igual Tabela/Artilharia), não uma
// seção "online" à parte. Login mora aqui via LoginOnline (mesmo widget da
// capa). Vínculo é 100% automático (App.jsx: efeito de auto-vínculo +
// iniciarTemporada + publicarProgresso/publicarTemporada) — nenhum botão de
// "vincular" aqui; só "apagar minha jornada", que é ação deliberada mesmo.
// Reskin "Polish Language v1" (jul/2026, Fase 1a): grafite/lime; pódio
// 1º/2º/3º em gold/silver/bronze; nome completo do clube abaixo da sigla
// (achado 2 da auditoria mobile); aba mensal já era o padrão (REDESIGN §5.8,
// mantido). Emojis removidos.
// F1d (PLANO_MESTRE_LEGENDS_LIMEIRA.md §4.1, "Ranking 2.0 — leitura"): cada
// linha ganha "começou na X · hoje na Y" (a view agora expõe `divisao`, e a
// primeira temporada publicada dá a série de origem) e um toque abre o
// perfil do técnico com o histórico de temporadas (`carreira_temporadas`,
// já é leitura pública — buscado sob demanda via o novo `carreira_id` da
// view, não em toda a lista de uma vez). Insígnias no perfil ficam pra
// Fase 2 (dependem de `conquistas_online`, que ainda não existe — ver §4.2
// do plano). Linhas fictícias (`carreira_id` nulo) mostram o mesmo estado
// vazio de um técnico real sem temporada publicada — sem revelar a
// distinção do §6.3 do spec-fase1-fundacao-online.md.
import { useState, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import LoginOnline from "./LoginOnline";
import { apagarCarreiraOnline } from "../storage/publicarOnline";
import { SERIES } from "../data/series";
import { conquistaPorId } from "../storage/conquistas";
import {
  cores, superficie, superficie2, botaoSecundario, botaoPrimario, eyebrowLime,
  paginaGrafite, conteudoAcimaDaDecor, corTier, glowTier,
} from "./entry-hub/estilos";
import Crest from "./Crest";
import { PolishDecor } from "./entry-hub/decor";

const RESULTADO_LABEL = { subiu: "Subiu", desceu: "Desceu", manteve: "Permaneceu" };
const RESULTADO_COR = { subiu: cores.success, desceu: cores.danger, manteve: cores.textSecondary };

// Raridade pra ordenar "as mais raras primeiro" (linha do ranking mostra 3).
const PESO_TIER = { lendario: 3, epico: 2, raro: 1, comum: 0 };
const maisRaras = (idsOnline) =>
  idsOnline
    .map((id) => conquistaPorId(id))
    .filter(Boolean)
    .sort((a, b) => (PESO_TIER[b.tier] ?? 0) - (PESO_TIER[a.tier] ?? 0));

function PerfilTecnico({ linha, onFechar }) {
  const [temporadas, setTemporadas] = useState(undefined); // undefined = carregando
  const [insignias, setInsignias] = useState(undefined);

  useEffect(() => {
    if (!linha.carreira_id) { setTemporadas([]); setInsignias([]); return; }
    setTemporadas(undefined);
    setInsignias(undefined);
    supabase
      .from("carreira_temporadas")
      .select("*")
      .eq("carreira_id", linha.carreira_id)
      .order("temporada", { ascending: true })
      .then(({ data }) => setTemporadas(data || []));
    // Fase 2: insígnias públicas do técnico (conquistas_online, leitura
    // pública). ids desconhecidos (versões futuras do app) são ignorados
    // pelo filtro do maisRaras — nunca quebra.
    supabase
      .from("conquistas_online")
      .select("conquista_id, clube, temporada")
      .eq("carreira_id", linha.carreira_id)
      .then(({ data }) => setInsignias(data || []));
  }, [linha.carreira_id]);

  const serieOrigem = temporadas && temporadas.length > 0 ? temporadas[0].serie : null;
  const serieAtual = linha.divisao && linha.meu_time ? linha.divisao[linha.meu_time] : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(10,12,14,0.8)" }}
      onClick={onFechar}
      role="button"
      tabIndex={0}
    >
      <div
        className="w-full rounded-t-2xl p-4"
        style={{ ...superficie, maxWidth: 448, maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {linha.meu_time && <Crest time={linha.meu_time} sm />}
          <div className="min-w-0">
            <b className="block truncate">{linha.nome_tecnico || linha.apelido || "Técnico anônimo"}</b>
            {linha.meu_time && <span className="text-xs" style={{ color: cores.textMuted }}>{linha.meu_time}</span>}
          </div>
        </div>

        {serieOrigem && serieAtual && (
          <div className="text-xs mt-2" style={{ color: cores.textSecondary }}>
            {serieOrigem === serieAtual
              ? <>Começou e segue na <b>{SERIES[serieAtual]?.label || serieAtual}</b></>
              : <>Começou na <b>{SERIES[serieOrigem]?.label || serieOrigem}</b> · hoje na <b>{SERIES[serieAtual]?.label || serieAtual}</b></>}
          </div>
        )}

        <div className="mt-3">
          <span style={eyebrowLime}>Insígnias</span>
          {insignias === undefined && (
            <div className="text-sm mt-2" style={{ color: cores.textSecondary }}>Carregando…</div>
          )}
          {insignias && insignias.length === 0 && (
            <div className="text-sm mt-2" style={{ color: cores.textSecondary }}>
              Nenhuma insígnia publicada ainda.
            </div>
          )}
          {insignias && insignias.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {maisRaras(insignias.map((i) => i.conquista_id)).map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs"
                  style={{ ...superficie2, border: `1px solid ${corTier[c.tier]}`, ...glowTier(c.tier) }}
                >
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className="font-bold">{c.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3">
          <span style={eyebrowLime}>Histórico de temporadas</span>
          {temporadas === undefined && (
            <div className="text-sm mt-2" style={{ color: cores.textSecondary }}>Carregando…</div>
          )}
          {temporadas && temporadas.length === 0 && (
            <div className="text-sm mt-2" style={{ color: cores.textSecondary }}>
              Nenhuma temporada publicada ainda.
            </div>
          )}
          {temporadas && temporadas.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {[...temporadas].reverse().map((t, i) => (
                <div key={i} className="rounded-xl px-3 py-2 flex items-center justify-between" style={superficie2}>
                  <div className="text-sm">
                    <b>Temporada {t.temporada}</b>
                    <span style={{ color: cores.textMuted }}> · {SERIES[t.serie]?.label || t.serie} · {t.posicao}º</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: RESULTADO_COR[t.resultado] }}>
                    {RESULTADO_LABEL[t.resultado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onFechar} className="w-full rounded-xl py-3 font-bold mt-4" style={botaoPrimario}>
          Fechar
        </button>
      </div>
    </div>
  );
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const corPodio = (i) => (i === 0 ? cores.gold : i === 1 ? cores.silver : i === 2 ? cores.bronze : cores.textSecondary);

export default function Ranking({ setTela, sessao }) {
  // Ranking sazonal (retenção): aba "Este mês" zera todo dia 1º — qualquer um
  // pode ser o nº 1 do mês. "Geral" é o all-time (onde mora o elenco fictício).
  const [aba, setAba] = useState("mes");
  const [linhas, setLinhas] = useState(undefined); // undefined = carregando
  const [publicada, setPublicada] = useState(undefined); // undefined = carregando/sem sessão, null = sem carreira publicada
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);
  const [confirmaExcluirConta, setConfirmaExcluirConta] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(null);
  // carreira_id → ids de conquistas (Fase 2): carregado numa ÚNICA query
  // depois da lista, pra linha mostrar as 3 mais raras sem N+1.
  const [insigniasPorCarreira, setInsigniasPorCarreira] = useState({});

  useEffect(() => {
    if (!supabase) return;
    setLinhas(undefined);
    supabase
      .from(aba === "mes" ? "ranking_tecnicos_mes" : "ranking_tecnicos")
      .select("*")
      .order("pontos", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLinhas(data || []);
        const ids = (data || []).map((l) => l.carreira_id).filter(Boolean);
        if (ids.length === 0) { setInsigniasPorCarreira({}); return; }
        supabase
          .from("conquistas_online")
          .select("carreira_id, conquista_id")
          .in("carreira_id", ids)
          .then(({ data: cs }) => {
            const mapa = {};
            (cs || []).forEach((c) => { (mapa[c.carreira_id] = mapa[c.carreira_id] || []).push(c.conquista_id); });
            setInsigniasPorCarreira(mapa);
          });
      });
  }, [aba]);

  useEffect(() => {
    if (!sessao) { setPublicada(undefined); return; }
    supabase.from("carreiras").select("*").eq("user_id", sessao.user.id).maybeSingle()
      .then(({ data }) => setPublicada(data || null));
  }, [sessao]);

  const apagar = async () => {
    setProcessando(true);
    const { error } = await apagarCarreiraOnline(sessao.user.id);
    setProcessando(false);
    setConfirmaApagar(false);
    if (error) { setErro(error); return; }
    setPublicada(null);
  };

  // LGPD (spec-fase1-fundacao-online.md §7): apaga a conta de verdade (auth
  // + profiles + carreiras + carreira_temporadas, em cascata) — diferente de
  // "apagar minha jornada", que só tira do ranking e mantém o login.
  const excluirConta = async () => {
    setErro(null);
    setProcessando(true);
    const { error } = await supabase.functions.invoke("excluir-conta", { body: {} });
    setProcessando(false);
    setConfirmaExcluirConta(false);
    if (error) {
      const corpo = await error.context?.json?.().catch(() => null);
      setErro(corpo?.error || error.message);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <div className="pt-10" style={paginaGrafite}>
      <PolishDecor variante="ranking" />
      <div style={conteudoAcimaDaDecor}>
        <span style={eyebrowLime}>Legends Online</span>
        <h1 className="text-xl font-black italic mt-1">Ranking de técnicos</h1>
        <p className="text-sm mt-2" style={{ color: cores.textSecondary }}>
          Pontos por vitória, empate e título — a mesma carreira que você joga offline, publicada
          aqui sozinha a cada temporada fechada.
        </p>

        <div className="mt-3">
          <LoginOnline sessao={sessao} />
        </div>

        {erro && (
          <div className="rounded-xl p-3 mt-3 text-xs" style={{ ...superficie, border: `1px solid ${cores.danger}`, color: cores.danger }}>
            {erro}
          </div>
        )}

        {sessao && publicada === null && (
          <p className="text-xs mt-3 text-center" style={{ color: cores.textMuted }}>
            Assim que você jogar uma rodada, sua carreira entra no ranking sozinha.
          </p>
        )}

        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setAba("mes")}
            className="flex-1 rounded-lg py-2 text-xs font-bold"
            style={aba === "mes" ? { background: cores.lime, color: cores.inkOnLime } : superficie2}
          >
            {MESES[new Date().getMonth()]}
          </button>
          <button
            onClick={() => setAba("geral")}
            className="flex-1 rounded-lg py-2 text-xs font-bold"
            style={aba === "geral" ? { background: cores.lime, color: cores.inkOnLime } : superficie2}
          >
            Geral
          </button>
        </div>
        {aba === "mes" && (
          <p className="text-xs mt-2" style={{ color: cores.textMuted }}>
            O ranking do mês zera todo dia 1º — todo mundo recomeça, qualquer um pode terminar em 1º.
          </p>
        )}

        {linhas === undefined && <div className="text-sm mt-4" style={{ color: cores.textSecondary }}>Carregando…</div>}
        {linhas && linhas.length === 0 && (
          <div className="rounded-xl p-4 mt-3 text-sm text-center" style={{ ...superficie, color: cores.textSecondary }}>
            Ninguém pontuou em {MESES[new Date().getMonth()]} ainda — feche uma temporada e seja o 1º do mês.
          </div>
        )}
        {linhas && linhas.length > 0 && (
          <div className="mt-3 space-y-1">
            {linhas.map((l, i) => (
              <div
                key={i}
                onClick={() => setPerfilAberto(l)}
                role="button"
                tabIndex={0}
                className="rounded-xl px-3 py-2 text-sm flex items-center justify-between gap-2"
                style={i === 0 ? { ...superficie, border: `1px solid ${cores.gold}` } : superficie}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-bold" style={{ color: corPodio(i) }}>{i + 1}º</span>
                  {l.meu_time && <Crest time={l.meu_time} sm />}
                  <span className="min-w-0">
                    <b className="block truncate">
                      {l.nome_tecnico || l.apelido || "Técnico anônimo"}
                      {l.carreira_id && insigniasPorCarreira[l.carreira_id]?.length > 0 && (
                        <span className="ml-1.5 not-italic font-normal">
                          {maisRaras(insigniasPorCarreira[l.carreira_id]).slice(0, 3).map((c) => c.emoji).join("")}
                        </span>
                      )}
                    </b>
                    {l.meu_time && (
                      <span className="block text-[10px] truncate" style={{ color: cores.textMuted }}>
                        {l.meu_time}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-xs text-right shrink-0" style={{ color: cores.lime }}>
                  <b>{l.pontos} pts</b>
                  <span style={{ color: cores.textMuted }}> · {l.titulos} tít · {l.temporadas_jogadas}t</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {sessao && publicada && !confirmaApagar && (
          <button
            onClick={() => setConfirmaApagar(true)}
            className="w-full rounded-xl py-2.5 font-bold mt-4 text-xs"
            style={{ ...superficie2, color: cores.danger }}
          >
            Apagar minha jornada do ranking
          </button>
        )}
        {confirmaApagar && (
          <div className="rounded-xl p-4 mt-2" style={{ ...superficie, border: `1px solid ${cores.danger}` }}>
            <p className="text-xs" style={{ color: cores.textSecondary }}>
              Isso apaga seu histórico do <b>ranking público</b> (não mexe no seu save local). Não dá
              pra desfazer.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirmaApagar(false)} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={superficie2}>
                Cancelar
              </button>
              <button onClick={apagar} disabled={processando} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={{ background: cores.danger, color: "#FFFFFF" }}>
                Apagar
              </button>
            </div>
          </div>
        )}

        {sessao && !confirmaExcluirConta && (
          <button
            onClick={() => setConfirmaExcluirConta(true)}
            className="w-full text-xs mt-4 text-center"
            style={{ color: cores.textMuted }}
          >
            Excluir minha conta (LGPD)
          </button>
        )}
        {confirmaExcluirConta && (
          <div className="rounded-xl p-4 mt-3" style={{ ...superficie, border: `1px solid ${cores.danger}` }}>
            <p className="text-xs" style={{ color: cores.textSecondary }}>
              Isso apaga sua conta de verdade — login, perfil e todo o histórico do ranking. Diferente
              de "apagar minha jornada", aqui você é <b>desconectado</b> e precisaria criar uma conta
              nova (novo e-mail ou o mesmo, do zero) pra voltar a concorrer. Não mexe no seu save
              local offline. Não dá pra desfazer.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirmaExcluirConta(false)} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={superficie2}>
                Cancelar
              </button>
              <button onClick={excluirConta} disabled={processando} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={{ background: cores.danger, color: "#FFFFFF" }}>
                {processando ? "Excluindo…" : "Excluir conta"}
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={botaoSecundario}>
          ← Voltar
        </button>

        <p className="text-center mt-6" style={{ color: cores.textMuted, fontSize: 12 }}>
          Legends Manager · Simulação — BETA
        </p>
      </div>
      {perfilAberto && <PerfilTecnico linha={perfilAberto} onFechar={() => setPerfilAberto(null)} />}
    </div>
  );
}
