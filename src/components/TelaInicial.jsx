// src/components/TelaInicial.jsx
// Capa. Duas situações (spec-liga-viva.md §6):
// - SEM mundo (1ª partida de sempre, ou após "Novo jogo"): seletor de série +
//   grid de times — igual ao multi-série puro.
// - COM mundo (modo carreira / Liga Viva): mostra o time/série ATUAL do
//   jogador (a divisão persiste — não se reescolhe a cada temporada) e um
//   botão "Continuar"/"Começar temporada", em vez do seletor. "Novo jogo"
//   reinicia tudo.
import { useState, useEffect } from "react";
import { SERIES, ORDEM_SERIES } from "../data/series";
import { totalRodadas } from "../engine/calendario";
import { supabase } from "../storage/supabaseClient";
import { Eyebrow, Rodape, Avatar, card, amber } from "./ui";
import LoginOnline from "./LoginOnline";

const RESULTADO_LABEL = { subiu: "subiu", desceu: "desceu", manteve: "permaneceu" };

function Capa() {
  return (
    <img
      src="/capa.jpg"
      alt="Legends Manager"
      className="w-full rounded-2xl"
      style={{ border: "1px solid rgba(139,105,190,0.35)" }}
    />
  );
}

// Hint de instalação PWA (discreto). Android/Chrome: botão que dispara o
// prompt nativo (via beforeinstallprompt capturado no App). iOS Safari não
// tem prompt — mostra a instrução do menu Compartilhar. Se o app já roda
// instalado (display-mode standalone), não mostra nada.
function HintInstalar({ promptInstalar, instalarApp }) {
  const instalado =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  if (instalado) return null;
  if (promptInstalar) {
    return (
      <button onClick={instalarApp} className="w-full rounded-xl px-4 py-3 mt-4 text-left active:opacity-70" style={card}>
        <div className="text-sm font-bold">📲 Instalar o Legends Manager</div>
        <div className="text-xs mt-0.5" style={{ color: "#A78FC7" }}>
          Ícone na tela inicial — abre direto, sem navegador.
        </div>
      </button>
    );
  }
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  if (ios) {
    return (
      <div className="rounded-xl px-4 py-3 mt-4 text-xs" style={{ ...card, color: "#A78FC7" }}>
        📲 Pra instalar no iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
      </div>
    );
  }
  return null;
}

function CampoTecnico({ nomeTec, setNomeTec }) {
  return (
    <div className="mt-5">
      <Eyebrow>Nome do técnico</Eyebrow>
      <input
        value={nomeTec}
        onChange={(e) => setNomeTec(e.target.value)}
        placeholder="Seu nome (sai no pôster de campeão)"
        className="w-full mt-1 rounded-xl px-4 py-3 outline-none"
        style={{ ...card, color: "#F2EDFA" }}
      />
    </div>
  );
}

// ---------------- Modo carreira (com mundo) ----------------
function TelaCarreira({
  mundo, nomeTec, setNomeTec, saveData, continuarJogo, retomarCarreiraSemSave, novoJogo, setTela,
  promptInstalar, instalarApp, sessao,
}) {
  const [confirmaNovoJogo, setConfirmaNovoJogo] = useState(false);
  const minhaSerie = mundo.divisao[mundo.meuTime];
  const serieAtiva = SERIES[minhaSerie];
  const ultimaTemporada = mundo.carreira[mundo.carreira.length - 1];

  const totalSalvo = saveData ? saveData.temporada.calendario.length : 0;
  const rodadaSalva = saveData ? Math.min(saveData.temporada.rodadaAtual + 1, totalSalvo) : 0;
  const encerrada = saveData && saveData.temporada.rodadaAtual >= totalSalvo;

  return (
    <div className="pt-6">
      <Capa />
      <div className="mt-3">
        <Eyebrow>Legends Liga Fut7 · {serieAtiva.label} · 2026</Eyebrow>
      </div>

      <div className="rounded-xl p-4 mt-3" style={{ ...card, border: "1px solid #FFC53D" }}>
        <div className="flex items-center gap-3">
          <Avatar t={mundo.meuTime} />
          <div className="flex-1">
            <div className="font-black italic">{mundo.meuTime}</div>
            <div className="text-xs" style={{ color: "#A78FC7" }}>
              {serieAtiva.label} · Temporada {mundo.temporada}
            </div>
          </div>
        </div>
        {ultimaTemporada && (
          <div className="text-xs mt-2" style={{ color: "#D9CCEE" }}>
            Temporada {ultimaTemporada.temporada}: {ultimaTemporada.posicao}º na {SERIES[ultimaTemporada.serie].label} —{" "}
            {RESULTADO_LABEL[ultimaTemporada.resultado]}
          </div>
        )}
      </div>

      {saveData ? (
        <button
          onClick={continuarJogo}
          className="w-full rounded-xl px-4 py-3 mt-3 text-left active:opacity-70"
          style={{ ...card, border: "1px solid #FFC53D" }}
        >
          <div className="font-bold">▶ Continuar</div>
          <div className="text-xs mt-0.5" style={{ color: "#A78FC7" }}>
            Técnico {saveData.nomeTecnico || "Técnico"} ·{" "}
            {encerrada ? "temporada encerrada" : `rodada ${rodadaSalva}/${totalSalvo}`}
          </div>
        </button>
      ) : (
        <button onClick={retomarCarreiraSemSave} className="w-full rounded-xl py-3.5 font-bold mt-3" style={amber}>
          ▶ Começar temporada {mundo.temporada}
        </button>
      )}

      <CampoTecnico nomeTec={nomeTec} setNomeTec={setNomeTec} />

      <div className="flex gap-2 mt-5">
        <button onClick={() => setTela("historiaCarreira")} className="flex-1 rounded-xl py-3 font-bold text-sm" style={card}>
          📖 Minha carreira
        </button>
        <button onClick={() => setTela("historiaLiga")} className="flex-1 rounded-xl py-3 font-bold text-sm" style={card}>
          🏆 História da Liga
        </button>
      </div>

      <button
        onClick={() => setConfirmaNovoJogo(true)}
        className="w-full rounded-xl py-3 font-bold mt-5 text-sm"
        style={card}
      >
        Novo jogo
      </button>
      <p className="text-xs mt-1 text-center" style={{ color: "#6E5A92" }}>
        Apaga a carreira inteira (todas as séries) e volta a escolher time.
      </p>

      {sessao === null && (
        <div className="mt-3">
          <LoginOnline sessao={sessao} />
        </div>
      )}
      <button onClick={() => setTela("ranking")} className="w-full rounded-xl py-3 font-bold mt-3 text-sm" style={card}>
        🏆 Ranking online
      </button>

      <HintInstalar promptInstalar={promptInstalar} instalarApp={instalarApp} />

      <Rodape />

      {confirmaNovoJogo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: "#1E1233" }}>
            <Eyebrow>Novo jogo</Eyebrow>
            <p className="text-sm mt-2" style={{ color: "#D9CCEE" }}>
              Isso apaga sua carreira com o <b>{mundo.meuTime}</b> ({mundo.temporada - 1} temporada
              {mundo.temporada - 1 === 1 ? "" : "s"} disputada{mundo.temporada - 1 === 1 ? "" : "s"}) e todos os
              saves. Não dá pra desfazer.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirmaNovoJogo(false)} className="flex-1 rounded-xl py-3 font-bold" style={card}>
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmaNovoJogo(false); novoJogo(); }}
                className="flex-1 rounded-xl py-3 font-bold"
                style={amber}
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

// ---------------- Sem mundo: seletor de série + time (1ª vez / pós "Novo jogo") ----------------
function TelaEscolha({
  serie, setSerie, nomeTec, setNomeTec, iniciarTemporada, avisoSemSave,
  promptInstalar, instalarApp, setTela, sessao,
}) {
  const serieAtiva = SERIES[serie];

  // Se já logado antes (ex.: voltou depois de "Novo jogo") e o nome ainda
  // está vazio, pré-preenche com o nome já cadastrado no perfil online —
  // "tudo uma coisa só", não pede o mesmo nome duas vezes.
  useEffect(() => {
    if (!supabase || !sessao || nomeTec) return;
    supabase.from("profiles").select("nome_tecnico").eq("id", sessao.user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome_tecnico) setNomeTec(data.nome_tecnico); });
  }, [sessao]); // eslint-disable-line

  return (
    <div className="pt-6">
      <Capa />
      <div className="mt-3">
        <Eyebrow>Legends Liga Fut7 · {serieAtiva.label} · 2026</Eyebrow>
      </div>

      <div className="flex gap-1 mt-2">
        {ORDEM_SERIES.map((id) => {
          const s = SERIES[id];
          const ativa = serie === id;
          return (
            <button
              key={id}
              disabled={!s.disponivel}
              onClick={() => setSerie(id)}
              className="flex-1 rounded-lg py-2 text-xs font-bold disabled:opacity-40"
              style={ativa ? amber : card}
            >
              {s.label}{!s.disponivel ? " · em breve" : ""}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-sm" style={{ color: "#A78FC7" }}>
        Escolha seu time, monte a escalação e dispute as {totalRodadas(serieAtiva.times.length)} rodadas
        com os elencos reais da {serieAtiva.label}. Depois disso a Liga Viva assume: seu time sobe e desce
        de divisão conforme o desempenho, temporada após temporada.
      </p>

      {avisoSemSave && (
        <div className="rounded-xl p-3 mt-4 text-xs" style={{ ...card, border: "1px solid #FFC53D", color: "#FFC53D" }}>
          Não consegui acessar o armazenamento deste navegador (aba privada?). Dá pra jogar
          normalmente, mas o progresso <b>não será salvo</b> ao fechar.
        </div>
      )}

      <div className="mt-5">
        <Eyebrow>{sessao ? "Concorrendo no ranking online" : "Ranking online (opcional)"}</Eyebrow>
        <p className="text-xs mt-1 mb-2" style={{ color: "#A78FC7" }}>
          {sessao
            ? "Sua carreira vai publicar pontos aqui sozinha a cada temporada."
            : "Entra com e-mail e sua carreira já nasce concorrendo — sem senha, opcional, o jogo funciona igual sem isso."}
        </p>
        <LoginOnline sessao={sessao} />
      </div>

      <CampoTecnico nomeTec={nomeTec} setNomeTec={setNomeTec} />

      <div className="mt-5">
        <Eyebrow>Escolha seu time</Eyebrow>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {serieAtiva.times.map((t) => (
            <button
              key={t}
              onClick={() => iniciarTemporada(t)}
              className="rounded-xl px-3 py-3 flex items-center gap-2 text-left active:opacity-70"
              style={card}
            >
              <Avatar t={t} sm />
              <span className="text-sm font-semibold leading-tight">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-3 mt-4 text-xs" style={{ ...card, color: "#D9CCEE" }}>
        Elencos reais (Copa10). Achou nome errado? Corrige em ✏️ na tela de escalação.
      </div>

      <button onClick={() => setTela("ranking")} className="w-full rounded-xl py-3 font-bold mt-3 text-sm" style={card}>
        🏆 Ver ranking online
      </button>

      <HintInstalar promptInstalar={promptInstalar} instalarApp={instalarApp} />

      <Rodape />
    </div>
  );
}

export default function TelaInicial({
  serie, setSerie, nomeTec, setNomeTec, iniciarTemporada, saveData, continuarJogo, avisoSemSave,
  mundo, novoJogo, retomarCarreiraSemSave, setTela, promptInstalar, instalarApp, sessao,
}) {
  if (mundo) {
    return (
      <TelaCarreira
        mundo={mundo}
        nomeTec={nomeTec}
        setNomeTec={setNomeTec}
        saveData={saveData}
        continuarJogo={continuarJogo}
        retomarCarreiraSemSave={retomarCarreiraSemSave}
        novoJogo={novoJogo}
        setTela={setTela}
        promptInstalar={promptInstalar}
        instalarApp={instalarApp}
        sessao={sessao}
      />
    );
  }
  return (
    <TelaEscolha
      serie={serie}
      setSerie={setSerie}
      nomeTec={nomeTec}
      setNomeTec={setNomeTec}
      iniciarTemporada={iniciarTemporada}
      avisoSemSave={avisoSemSave}
      promptInstalar={promptInstalar}
      instalarApp={instalarApp}
      setTela={setTela}
      sessao={sessao}
    />
  );
}
