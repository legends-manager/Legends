// src/components/TelaInicial.jsx
// Capa / Entry & Career Hub — Task 05.1H (slice visual "Polish Language v1").
// Três situações:
// - SEM mundo: onboarding em 4 passos congelados no Figma 05.1 —
//   Entry → Escolha de divisão → Escolha de clube → Confirmação. Estado do
//   onboarding é 100% efêmero (reducer puro em entry-hub/onboarding.js);
//   nenhum save/mundo é criado antes de "Iniciar carreira", que chama o
//   iniciarTemporada() EXISTENTE exatamente uma vez.
// - COM mundo e SEM temporada carregada (S=null, app recém-aberto): Entry de
//   carreira existente — continuar/começar temporada, históricos, ranking,
//   "Novo jogo" destrutivo (fluxo antigo preservado, separado do onboarding).
// - COM mundo e COM temporada carregada (S vivo — ex.: voltou pra "Início"
//   pelo BottomNav no meio da temporada): Central da Carreira (estado
//   principal ou decisão pendente, derivado em tempo de render pelo seletor
//   puro entry-hub/deriveCareerHubState.js — nada é escrito pra isso).
// Comportamento preservado (05.1F/05.1G): LoginOnline (magic link) na capa,
// pré-preenchimento do nome do técnico via profiles, hint de instalação PWA,
// aviso de localStorage indisponível, destinos historiaCarreira/historiaLiga/
// ranking, semântica destrutiva do "Novo jogo".
import { useReducer, useEffect } from "react";
import { supabase } from "../storage/supabaseClient";
import { superficie, cores } from "./entry-hub/estilos";
import LoginOnline from "./LoginOnline";
import {
  PASSOS, estadoInicialOnboarding, onboardingReducer,
} from "./entry-hub/onboarding";
import { deriveCareerHubState } from "./entry-hub/deriveCareerHubState";
import {
  EntryNoCareer, DivisionSelection, ClubSelection, ClubConfirmation,
  EntryExistingCareer, CareerHub,
} from "./entry-hub/telas";

// Hint de instalação PWA (comportamento preservado da versão anterior).
// Android/Chrome: prompt nativo via beforeinstallprompt; iOS: instrução do
// menu Compartilhar; app já instalado: nada.
function HintInstalar({ promptInstalar, instalarApp }) {
  const instalado =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  if (instalado) return null;
  if (promptInstalar) {
    return (
      <button onClick={instalarApp} className="w-full rounded-xl px-4 py-3 mt-4 text-left active:opacity-70" style={superficie}>
        <div className="text-sm font-bold">Instalar o Legends Manager</div>
        <div className="text-xs mt-0.5" style={{ color: cores.textMuted }}>
          Ícone na tela inicial — abre direto, sem navegador.
        </div>
      </button>
    );
  }
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  if (ios) {
    return (
      <div className="rounded-xl px-4 py-3 mt-4 text-xs" style={{ ...superficie, color: cores.textMuted }}>
        Pra instalar no iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
      </div>
    );
  }
  return null;
}

export default function TelaInicial({
  serie, setSerie, nomeTec, setNomeTec, iniciarTemporada, saveData, continuarJogo, avisoSemSave,
  mundo, novoJogo, retomarCarreiraSemSave, setTela, promptInstalar, instalarApp, sessao,
  S, escolhidos,
}) {
  const [onboarding, dispatch] = useReducer(onboardingReducer, estadoInicialOnboarding);

  // Mundo mudou por fora (carreira criada, "Novo jogo", migração): o estado
  // efêmero do onboarding zera (§11 da ordem — reset em mudança externa).
  useEffect(() => {
    dispatch({ tipo: "RESETAR" });
  }, [mundo]);

  // Pré-preenchimento do nome do técnico a partir do perfil online já
  // cadastrado — comportamento preservado byte-a-byte da versão anterior
  // ("tudo uma coisa só", não pede o mesmo nome duas vezes).
  useEffect(() => {
    if (!supabase || !sessao || nomeTec) return;
    supabase.from("profiles").select("nome_tecnico").eq("id", sessao.user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome_tecnico) setNomeTec(data.nome_tecnico); });
  }, [sessao]); // eslint-disable-line

  const loginSlot = <LoginOnline sessao={sessao} />;
  const hintSlot = <HintInstalar promptInstalar={promptInstalar} instalarApp={instalarApp} />;

  // ---------- COM mundo ----------
  if (mundo) {
    // Temporada viva (S carregado): Central da Carreira — principal ou
    // decisão pendente, derivado só de leitura.
    if (S) {
      const hub = deriveCareerHubState(S, mundo.meuTime, escolhidos);
      let proximoJogo = null;
      if (!hub.temporadaEncerrada) {
        const rod = S.calendario[S.rodada] || [];
        proximoJogo = rod.find((j) => j.casa === mundo.meuTime || j.fora === mundo.meuTime) || null;
      }
      return (
        <CareerHub
          mundo={mundo}
          nomeTec={nomeTec}
          hub={hub}
          proximoJogo={proximoJogo}
          setTela={setTela}
        />
      );
    }
    // App recém-aberto com carreira existente: Entry de boas-vindas.
    return (
      <EntryExistingCareer
        mundo={mundo}
        nomeTec={nomeTec}
        saveData={saveData}
        continuarJogo={continuarJogo}
        retomarCarreiraSemSave={retomarCarreiraSemSave}
        verHistoricoCarreira={() => setTela("historiaCarreira")}
        verHistoriaLiga={() => setTela("historiaLiga")}
        verRanking={() => setTela("ranking")}
        onNovoJogo={novoJogo}
        loginSlot={loginSlot}
        hintSlot={hintSlot}
      />
    );
  }

  // ---------- SEM mundo: onboarding em 4 passos ----------
  if (onboarding.passo === PASSOS.DIVISAO) {
    return (
      <DivisionSelection
        divisaoSelecionada={onboarding.divisao}
        onEscolherDivisao={(id) => {
          // A série do App continua sendo a fonte única usada por
          // iniciarTemporada — sincronizada aqui, no momento da escolha
          // (mesma semântica das abas da capa anterior).
          setSerie(id);
          dispatch({ tipo: "ESCOLHER_DIVISAO", divisao: id });
        }}
        onAvancar={() => dispatch({ tipo: "AVANCAR_PARA_CLUBE" })}
        onVoltar={() => dispatch({ tipo: "VOLTAR" })}
      />
    );
  }
  if (onboarding.passo === PASSOS.CLUBE) {
    return (
      <ClubSelection
        divisao={onboarding.divisao || serie}
        onEscolherClube={(t) => dispatch({ tipo: "ESCOLHER_CLUBE", clube: t })}
        onVoltar={() => dispatch({ tipo: "VOLTAR" })}
      />
    );
  }
  if (onboarding.passo === PASSOS.CONFIRMACAO) {
    return (
      <ClubConfirmation
        divisao={onboarding.divisao || serie}
        clube={onboarding.clube}
        nomeTec={nomeTec}
        setNomeTec={setNomeTec}
        avisoSemSave={avisoSemSave}
        onIniciar={(clube) => iniciarTemporada(clube)}
        onTrocarClube={() => dispatch({ tipo: "TROCAR_CLUBE" })}
      />
    );
  }
  return (
    <EntryNoCareer
      onComecar={() => dispatch({ tipo: "COMECAR" })}
      verHistoriaLiga={() => setTela("historiaLiga")}
      verRanking={() => setTela("ranking")}
      loginSlot={loginSlot}
      hintSlot={hintSlot}
      avisoSemSave={avisoSemSave}
    />
  );
}
