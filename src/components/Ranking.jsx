// src/components/Ranking.jsx
// Ranking online — mais uma tela do jogo (igual Tabela/Artilharia), não uma
// seção "online" à parte. Login mora aqui via LoginOnline (mesmo widget da
// capa). Vincular/apagar continuam existindo só pra quem já tinha carreira
// offline ANTES de logar — quem loga e escolhe time depois já nasce vinculado
// automaticamente (App.jsx, iniciarTemporada).
import { useState, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import LoginOnline from "./LoginOnline";
import { vincularCarreira, apagarCarreiraOnline } from "../storage/publicarOnline";
import { Eyebrow, Rodape, card, amber } from "./ui";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export default function Ranking({ setTela, mundo, sessao }) {
  // Ranking sazonal (retenção): aba "Este mês" zera todo dia 1º — qualquer um
  // pode ser o nº 1 do mês. "Geral" é o all-time (onde mora o elenco fictício).
  const [aba, setAba] = useState("mes");
  const [linhas, setLinhas] = useState(undefined); // undefined = carregando
  const [publicada, setPublicada] = useState(undefined); // undefined = carregando/sem sessão, null = sem carreira publicada
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);
  const [confirmaExcluirConta, setConfirmaExcluirConta] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    setLinhas(undefined);
    supabase
      .from(aba === "mes" ? "ranking_tecnicos_mes" : "ranking_tecnicos")
      .select("*")
      .order("pontos", { ascending: false })
      .limit(20)
      .then(({ data }) => setLinhas(data || []));
  }, [aba]);

  useEffect(() => {
    if (!sessao) { setPublicada(undefined); return; }
    supabase.from("carreiras").select("*").eq("user_id", sessao.user.id).maybeSingle()
      .then(({ data }) => setPublicada(data || null));
  }, [sessao]);

  const vincular = async () => {
    setErro(null);
    setProcessando(true);
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
    <div className="pt-6">
      <Eyebrow>Legends Online</Eyebrow>
      <h1 className="text-xl font-black italic mt-1">🏆 Ranking de técnicos</h1>
      <p className="text-sm mt-2" style={{ color: "#A78FC7" }}>
        Pontos por vitória, empate e título — a mesma carreira que você joga offline, publicada
        aqui sozinha a cada temporada fechada.
      </p>

      <div className="mt-3">
        <LoginOnline sessao={sessao} />
      </div>

      {erro && (
        <div className="rounded-xl p-3 mt-3 text-xs" style={{ ...card, border: "1px solid #FF5A5A", color: "#FF5A5A" }}>
          {erro}
        </div>
      )}

      {/* Só aparece pra quem já tinha carreira offline ANTES de logar — quem
          começa depois desta versão já nasce vinculado automaticamente. */}
      {sessao && mundo && publicada === null && (
        <button
          onClick={vincular}
          disabled={processando}
          className="w-full rounded-xl py-3 font-bold mt-3 text-sm disabled:opacity-50"
          style={amber}
        >
          {processando ? "Vinculando…" : "Vincular minha carreira ao ranking"}
        </button>
      )}

      <div className="flex gap-1 mt-4">
        <button
          onClick={() => setAba("mes")}
          className="flex-1 rounded-lg py-2 text-xs font-bold"
          style={aba === "mes" ? amber : card}
        >
          🗓️ {MESES[new Date().getMonth()]}
        </button>
        <button
          onClick={() => setAba("geral")}
          className="flex-1 rounded-lg py-2 text-xs font-bold"
          style={aba === "geral" ? amber : card}
        >
          🏆 Geral
        </button>
      </div>
      {aba === "mes" && (
        <p className="text-xs mt-2" style={{ color: "#6E5A92" }}>
          O ranking do mês zera todo dia 1º — todo mundo recomeça, qualquer um pode terminar em 1º.
        </p>
      )}

      {linhas === undefined && <div className="text-sm mt-4" style={{ color: "#A78FC7" }}>Carregando…</div>}
      {linhas && linhas.length === 0 && (
        <div className="rounded-xl p-4 mt-3 text-sm text-center" style={{ ...card, color: "#A78FC7" }}>
          Ninguém pontuou em {MESES[new Date().getMonth()]} ainda — feche uma temporada e seja o 1º do mês.
        </div>
      )}
      {linhas && linhas.length > 0 && (
        <div className="mt-3 space-y-1">
          {linhas.map((l, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-2 text-sm flex items-center justify-between"
              style={i === 0 ? { ...card, border: "1px solid #FFC53D" } : card}
            >
              <span>
                <span style={{ color: "#A78FC7" }}>{i + 1}º</span>{" "}
                <b>{l.nome_tecnico || l.apelido || "Técnico anônimo"}</b>
              </span>
              <span className="text-xs text-right" style={{ color: "#FFC53D" }}>
                <b>{l.pontos} pts</b>
                <span style={{ color: "#6E5A92" }}> · 🏆{l.titulos} · {l.temporadas_jogadas}t</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {sessao && publicada && !confirmaApagar && (
        <button
          onClick={() => setConfirmaApagar(true)}
          className="w-full rounded-xl py-2.5 font-bold mt-4 text-xs"
          style={{ ...card, color: "#FF5A5A" }}
        >
          Apagar minha jornada do ranking
        </button>
      )}
      {confirmaApagar && (
        <div className="rounded-xl p-4 mt-2" style={{ ...card, border: "1px solid #FF5A5A" }}>
          <p className="text-xs" style={{ color: "#D9CCEE" }}>
            Isso apaga seu histórico do <b>ranking público</b> (não mexe no seu save local). Não dá
            pra desfazer.
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

      {sessao && !confirmaExcluirConta && (
        <button
          onClick={() => setConfirmaExcluirConta(true)}
          className="w-full text-xs mt-4 text-center"
          style={{ color: "#6E5A92" }}
        >
          Excluir minha conta (LGPD)
        </button>
      )}
      {confirmaExcluirConta && (
        <div className="rounded-xl p-4 mt-3" style={{ ...card, border: "1px solid #FF5A5A" }}>
          <p className="text-xs" style={{ color: "#D9CCEE" }}>
            Isso apaga sua conta de verdade — login, perfil e todo o histórico do ranking. Diferente
            de "apagar minha jornada", aqui você é <b>desconectado</b> e precisaria criar uma conta
            nova (novo e-mail ou o mesmo, do zero) pra voltar a concorrer. Não mexe no seu save
            local offline. Não dá pra desfazer.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setConfirmaExcluirConta(false)} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={card}>
              Cancelar
            </button>
            <button onClick={excluirConta} disabled={processando} className="flex-1 rounded-xl py-2.5 font-bold text-sm" style={{ background: "#FF5A5A", color: "#1A1607" }}>
              {processando ? "Excluindo…" : "Excluir conta"}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={card}>
        ← Voltar
      </button>

      <Rodape />
    </div>
  );
}
