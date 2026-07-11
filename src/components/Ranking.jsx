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

export default function Ranking({ setTela, mundo, sessao }) {
  const [linhas, setLinhas] = useState(undefined); // undefined = carregando
  const [publicada, setPublicada] = useState(undefined); // undefined = carregando/sem sessão, null = sem carreira publicada
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("ranking_tecnicos")
      .select("*")
      .order("pontos", { ascending: false })
      .limit(20)
      .then(({ data }) => setLinhas(data || []));
  }, []);

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

      {linhas === undefined && <div className="text-sm mt-4" style={{ color: "#A78FC7" }}>Carregando…</div>}
      {linhas && linhas.length > 0 && (
        <div className="mt-4 space-y-1">
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

      <button onClick={() => setTela("inicio")} className="w-full rounded-xl py-3 font-bold mt-5 text-sm" style={card}>
        ← Voltar
      </button>

      <Rodape />
    </div>
  );
}
