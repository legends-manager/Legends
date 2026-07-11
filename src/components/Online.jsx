// src/components/Online.jsx
// Fase 1 (spec-fase1-fundacao-online.md): login leve (e-mail, sem senha),
// carreira online (server-side, via Edge Functions) e ranking — os 3 itens
// finais do checklist da fase. O Modo 1 (offline) nunca passa por aqui
// (doc-mãe §4); o servidor sempre simula o fechamento de temporada (§0).
import { useState, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import { TODOS_OS_TIMES } from "../data/series";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";

const RESULTADO_LABEL = { subiu: "subiu", desceu: "desceu", manteve: "permaneceu" };

function CarreiraOnline({ sessao }) {
  const [carreira, setCarreira] = useState(undefined); // undefined = carregando, null = nenhuma
  const [meuTime, setMeuTime] = useState(TODOS_OS_TIMES[0]);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [ultimoResultado, setUltimoResultado] = useState(null);

  const carregarCarreira = async () => {
    const { data } = await supabase
      .from("carreiras")
      .select("*")
      .eq("user_id", sessao.user.id)
      .eq("ativa", true)
      .maybeSingle();
    setCarreira(data || null);
  };

  useEffect(() => { carregarCarreira(); }, [sessao.user.id]); // eslint-disable-line

  const criarCarreira = async () => {
    setErro(null);
    setProcessando(true);
    const { data, error } = await supabase.functions.invoke("criar-carreira", { body: { meuTime } });
    setProcessando(false);
    if (error) { setErro(error.message); return; }
    setCarreira(data.carreira);
    setUltimoResultado(null);
  };

  const fecharTemporada = async () => {
    setErro(null);
    setProcessando(true);
    const { data, error } = await supabase.functions.invoke("fechar-temporada", { body: {} });
    setProcessando(false);
    if (error) { setErro(error.message); return; }
    setCarreira(data.carreira);
    setUltimoResultado(data);
  };

  if (carreira === undefined) {
    return <div className="text-sm mt-4" style={{ color: "#A78FC7" }}>Carregando carreira…</div>;
  }

  return (
    <div className="mt-4">
      {erro && (
        <div className="rounded-xl p-3 mb-3 text-xs" style={{ ...card, border: "1px solid #FF5A5A", color: "#FF5A5A" }}>
          {erro}
        </div>
      )}

      {!carreira && (
        <div className="rounded-xl p-4" style={card}>
          <Eyebrow>Carreira online</Eyebrow>
          <p className="text-xs mt-1" style={{ color: "#A78FC7" }}>
            Escolha um time — o servidor simula as temporadas e alimenta o ranking.
          </p>
          <select
            value={meuTime}
            onChange={(e) => setMeuTime(e.target.value)}
            className="w-full mt-3 rounded-xl px-4 py-3 outline-none"
            style={{ ...card, color: "#F2EDFA" }}
          >
            {TODOS_OS_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={criarCarreira}
            disabled={processando}
            className="w-full rounded-xl py-3.5 font-bold mt-3 disabled:opacity-50"
            style={amber}
          >
            {processando ? "Criando…" : "Criar carreira"}
          </button>
        </div>
      )}

      {carreira && (
        <div className="rounded-xl p-4" style={{ ...card, border: "1px solid #FFC53D" }}>
          <div className="flex items-center gap-3">
            <Avatar t={carreira.meu_time} />
            <div className="flex-1">
              <div className="font-black italic">{carreira.meu_time}</div>
              <div className="text-xs" style={{ color: "#A78FC7" }}>
                Série {carreira.divisao[carreira.meu_time]} · Temporada {carreira.temporada_atual}
              </div>
            </div>
          </div>

          {ultimoResultado && (
            <div className="text-xs mt-3 rounded-lg p-2" style={{ background: "#150A26" }}>
              Temporada {ultimoResultado.temporadaFechada}: {ultimoResultado.minhaPosicao}º na Série{" "}
              {ultimoResultado.minhaSerie} — {RESULTADO_LABEL[ultimoResultado.meuResultado]}, vai pra Série{" "}
              {ultimoResultado.serieDestino}.
            </div>
          )}

          <button
            onClick={fecharTemporada}
            disabled={processando}
            className="w-full rounded-xl py-3.5 font-bold mt-3 disabled:opacity-50"
            style={amber}
          >
            {processando ? "Simulando no servidor…" : `Fechar temporada ${carreira.temporada_atual}`}
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: "#6E5A92" }}>
            O servidor simula as 3 séries inteiras e decide o resultado — sem escalação, sem partida ao vivo.
          </p>
        </div>
      )}
    </div>
  );
}

function Ranking() {
  const [linhas, setLinhas] = useState(undefined); // undefined = carregando

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("ranking_tecnicos")
      .select("*")
      .order("titulos", { ascending: false })
      .limit(20)
      .then(({ data }) => setLinhas(data || []));
  }, []);

  if (!supabase) return null;

  return (
    <div className="mt-5">
      <Eyebrow>Ranking de técnicos</Eyebrow>
      {linhas === undefined && <div className="text-sm mt-2" style={{ color: "#A78FC7" }}>Carregando…</div>}
      {linhas && linhas.length === 0 && (
        <div className="text-sm mt-2" style={{ color: "#A78FC7" }}>Ninguém fechou uma temporada ainda — seja o primeiro.</div>
      )}
      {linhas && linhas.length > 0 && (
        <div className="mt-2 space-y-1">
          {linhas.map((l, i) => (
            <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
              <span>
                <span style={{ color: "#A78FC7" }}>{i + 1}º</span>{" "}
                <b>{l.nome_tecnico || l.apelido}</b>
              </span>
              <span className="text-xs" style={{ color: "#FFC53D" }}>
                🏆 {l.titulos} · {l.temporadas_jogadas} temporada{l.temporadas_jogadas === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Online({ setTela }) {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando, null = deslogado
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!supabase) { setSessao(null); return; }
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => setSessao(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const enviarLink = async (e) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setEnviando(false);
    if (error) setErro(error.message);
    else setEnviado(true);
  };

  const sair = async () => {
    await supabase.auth.signOut();
    setEnviado(false);
    setEmail("");
  };

  return (
    <div className="pt-6">
      <Eyebrow>Legends Online · Fase 1 (beta)</Eyebrow>
      <h1 className="text-xl font-black italic mt-1">Entrar</h1>
      <p className="text-sm mt-2" style={{ color: "#A78FC7" }}>
        Login leve, sem senha — só pra identificar seu técnico no ranking online.
        O jogo offline (Ligas Oficiais) continua funcionando sem isso.
      </p>

      {!supabase && (
        <div className="rounded-xl p-4 mt-4 text-sm" style={{ ...card, border: "1px solid #FFC53D", color: "#FFC53D" }}>
          Modo online não configurado neste build (faltam as chaves do Supabase).
        </div>
      )}

      {supabase && sessao === undefined && (
        <div className="text-sm mt-4" style={{ color: "#A78FC7" }}>Carregando…</div>
      )}

      {supabase && sessao === null && !enviado && (
        <form onSubmit={enviarLink} className="mt-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{ ...card, color: "#F2EDFA" }}
          />
          {erro && <p className="text-xs mt-2" style={{ color: "#FF5A5A" }}>{erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl py-3.5 font-bold mt-3 disabled:opacity-50"
            style={amber}
          >
            {enviando ? "Enviando…" : "Enviar link mágico"}
          </button>
        </form>
      )}

      {supabase && sessao === null && enviado && (
        <div className="rounded-xl p-4 mt-4 text-sm" style={{ ...card, border: "1px solid #FFC53D" }}>
          📩 Link enviado pra <b>{email}</b>. Abre o e-mail e clica no link pra entrar — pode fechar esta aba.
        </div>
      )}

      {supabase && sessao && (
        <div className="rounded-xl p-4 mt-4" style={{ ...card, border: "1px solid #FFC53D" }}>
          <div className="text-sm">
            Logado como <b>{sessao.user.email}</b>
          </div>
          <button onClick={sair} className="w-full rounded-xl py-3 font-bold mt-3 text-sm" style={card}>
            Sair
          </button>
        </div>
      )}

      {supabase && sessao && <CarreiraOnline sessao={sessao} />}

      <Ranking />

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={card}>
        ← Voltar
      </button>

      <Rodape />
    </div>
  );
}
