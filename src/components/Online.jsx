// src/components/Online.jsx
// Fase 1 (spec-fase1-fundacao-online.md): login leve (e-mail, sem senha) pro
// modo online. Só isto por enquanto — carreira online e ranking são os
// próximos itens do checklist, ainda não têm tela. O Modo 1 (offline) nunca
// passa por aqui (doc-mãe §4).
import { useState, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import { Eyebrow, Rodape, card, amber } from "./ui";

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

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={card}>
        ← Voltar
      </button>

      <Rodape />
    </div>
  );
}
