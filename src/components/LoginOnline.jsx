// src/components/LoginOnline.jsx
// Widget de login compacto (magic link), reaproveitado na capa e no ranking
// — uma única porta de entrada pro modo online, em vez de tela própria.
// `sessao` é controlada por quem usa (App.jsx tem a fonte da verdade via
// supabase.auth.onAuthStateChange) — este componente só lê e envia o link.
// Reskin "Polish Language v1" (F1e, auditoria da Fase 1): era o widget mais
// visível ainda no roxo/âmbar antigo (aparece na Entry e no Ranking, ambas
// já grafite/lime) — grafite/lime aqui também.
import { useState } from "react";
import { supabase } from "../storage/supabaseClient";
import { cores, superficie, botaoPrimario } from "./entry-hub/estilos";

export default function LoginOnline({ sessao }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);

  if (!supabase || sessao === undefined) return null;

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

  if (sessao) {
    return (
      <div className="rounded-xl px-4 py-2.5 flex items-center justify-between" style={superficie}>
        <span className="text-xs" style={{ color: cores.textSecondary }}>
          Logado como <b style={{ color: cores.textPrimary }}>{sessao.user.email}</b>
        </span>
        <button onClick={sair} className="text-xs font-bold" style={{ color: cores.danger }}>
          Sair
        </button>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="rounded-xl p-3 text-xs" style={{ ...superficie, border: `1px solid ${cores.lime}`, color: cores.textSecondary }}>
        Link enviado pra <b style={{ color: cores.textPrimary }}>{email}</b> — confere seu e-mail e clica pra entrar.
      </div>
    );
  }

  return (
    <form onSubmit={enviarLink}>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com — entra e concorre no ranking"
          className="flex-1 rounded-xl px-3 py-2.5 outline-none text-sm"
          style={{ ...superficie, color: cores.textPrimary }}
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl px-4 py-2.5 font-bold text-sm disabled:opacity-50 shrink-0"
          style={botaoPrimario}
        >
          {enviando ? "…" : "Entrar"}
        </button>
      </div>
      {erro && <p className="text-xs mt-1.5" style={{ color: cores.danger }}>{erro}</p>}
    </form>
  );
}
