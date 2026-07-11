// src/components/Online.jsx
// Fase 1 (spec-fase1-fundacao-online.md, pivô): login leve (e-mail, sem
// senha) e ranking público que espelha a carreira offline DE VERDADE — sem
// simulação paralela. Escalação, mercado e partida ao vivo continuam 100%
// locais (App.jsx); esta tela só publica o resultado já decidido lá.
import { useState, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import { vincularCarreira, apagarCarreiraOnline } from "../storage/publicarOnline";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";

const RESULTADO_LABEL = { subiu: "subiu", desceu: "desceu", manteve: "permaneceu" };

function CarreiraOnline({ sessao, mundo }) {
  const [publicada, setPublicada] = useState(undefined); // undefined = carregando, null = nenhuma ainda
  const [nomeTecnico, setNomeTecnico] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);

  const carregar = async () => {
    const { data: perfil } = await supabase.from("profiles").select("nome_tecnico").eq("id", sessao.user.id).maybeSingle();
    if (perfil?.nome_tecnico) setNomeTecnico(perfil.nome_tecnico);
    const { data } = await supabase.from("carreiras").select("*").eq("user_id", sessao.user.id).maybeSingle();
    setPublicada(data || null);
  };

  useEffect(() => { carregar(); }, [sessao.user.id]); // eslint-disable-line

  const vincular = async () => {
    setErro(null);
    setProcessando(true);
    const { error: erroPerfil } = await supabase
      .from("profiles")
      .upsert({ id: sessao.user.id, nome_tecnico: nomeTecnico }, { onConflict: "id" });
    if (erroPerfil) { setProcessando(false); setErro(erroPerfil.message); return; }
    const { carreira, error } = await vincularCarreira(mundo);
    setProcessando(false);
    if (error) { setErro(error); return; }
    setPublicada(carreira);
  };

  const apagar = async () => {
    setProcessando(true);
    const { error } = await apagarCarreiraOnline(sessao.user.id);
    setProcessando(false);
    setConfirmaApagar(false);
    if (error) { setErro(error); return; }
    setPublicada(null);
  };

  if (publicada === undefined) {
    return <div className="text-sm mt-4" style={{ color: "#A78FC7" }}>Carregando…</div>;
  }

  if (!mundo) {
    return (
      <div className="rounded-xl p-4 mt-4" style={card}>
        <Eyebrow>Ranking online</Eyebrow>
        <p className="text-xs mt-1" style={{ color: "#A78FC7" }}>
          Você ainda não tem uma carreira offline em andamento. Volta pra capa, escolhe um time e joga
          normalmente — quando quiser, volta aqui e vincula ao ranking.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {erro && (
        <div className="rounded-xl p-3 mb-3 text-xs" style={{ ...card, border: "1px solid #FF5A5A", color: "#FF5A5A" }}>
          {erro}
        </div>
      )}

      <div className="rounded-xl p-4" style={{ ...card, border: publicada ? "1px solid #FFC53D" : undefined }}>
        <Eyebrow>{publicada ? "Sua jornada" : "Vincular ao ranking online"}</Eyebrow>
        <div className="flex items-center gap-3 mt-2">
          <Avatar t={mundo.meuTime} />
          <div className="flex-1">
            <div className="font-black italic">{mundo.meuTime}</div>
            <div className="text-xs" style={{ color: "#A78FC7" }}>
              Série {mundo.divisao[mundo.meuTime]} · Temporada {mundo.temporada}
              {mundo.carreira.length > 0 && ` · ${mundo.carreira.length} temporada${mundo.carreira.length === 1 ? "" : "s"} disputada${mundo.carreira.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        <input
          value={nomeTecnico}
          onChange={(e) => setNomeTecnico(e.target.value)}
          placeholder="Nome do técnico (aparece no ranking)"
          className="w-full mt-3 rounded-xl px-4 py-3 outline-none"
          style={{ ...card, color: "#F2EDFA" }}
        />

        <button
          onClick={vincular}
          disabled={processando || !nomeTecnico.trim()}
          className="w-full rounded-xl py-3.5 font-bold mt-3 disabled:opacity-50"
          style={amber}
        >
          {processando ? "Publicando…" : publicada ? "Atualizar ranking" : "Vincular ao ranking"}
        </button>
        {!publicada && (
          <p className="text-xs mt-2 text-center" style={{ color: "#6E5A92" }}>
            A partir daqui, toda vez que você fechar uma temporada no jogo (jogando normal, com
            escalação e tudo), o resultado é publicado aqui automaticamente.
          </p>
        )}
      </div>

      {publicada && !confirmaApagar && (
        <button
          onClick={() => setConfirmaApagar(true)}
          className="w-full rounded-xl py-3 font-bold mt-3 text-sm"
          style={{ ...card, color: "#FF5A5A" }}
        >
          Apagar minha jornada do ranking
        </button>
      )}
      {confirmaApagar && (
        <div className="rounded-xl p-4 mt-3" style={{ ...card, border: "1px solid #FF5A5A" }}>
          <p className="text-xs" style={{ color: "#D9CCEE" }}>
            Isso apaga seu histórico do <b>ranking público</b> (não mexe no seu save local — o jogo
            offline continua de onde parou). Não dá pra desfazer.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setConfirmaApagar(false)} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={card}>
              Cancelar
            </button>
            <button onClick={apagar} disabled={processando} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={{ background: "#FF5A5A", color: "#1A1607" }}>
              Apagar
            </button>
          </div>
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
        <div className="text-sm mt-2" style={{ color: "#A78FC7" }}>Ninguém publicou uma temporada ainda — seja o primeiro.</div>
      )}
      {linhas && linhas.length > 0 && (
        <div className="mt-2 space-y-1">
          {linhas.map((l, i) => (
            <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
              <span>
                <span style={{ color: "#A78FC7" }}>{i + 1}º</span>{" "}
                <b>{l.nome_tecnico || l.apelido || "Técnico anônimo"}</b>
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

export default function Online({ setTela, mundo }) {
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
        Login leve, sem senha — sua carreira continua sendo jogada offline igual sempre; aqui só
        publicamos o resultado de cada temporada num ranking público de técnicos.
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

      {supabase && sessao && <CarreiraOnline sessao={sessao} mundo={mundo} />}

      <Ranking />

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={card}>
        ← Voltar
      </button>

      <Rodape />
    </div>
  );
}
