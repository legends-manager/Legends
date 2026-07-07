import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

// =====================================================================
// LEGENDS MANAGER — Marco 1, single-player.
// Orquestração: estado da temporada (Sref), fluxo de telas e efeitos.
// Toda a lógica é a mesma da demo; motor em engine/, dados em data/,
// telas em components/. Save/PWA entram nos Passos 2 e 3.
// =====================================================================
import {
  novaTemporada, melhores, escalacaoIA, simMetade, golsDe,
} from "./engine/simulador";
import { calcularCraque } from "./engine/craque";
import { SIGLA } from "./data/times";
import { carregarSave, reconstruirS, salvarJogo, localStorageDisponivel } from "./storage/saveGame";

import TelaInicial from "./components/TelaInicial";
import Escalacao from "./components/Escalacao";
import PartidaAoVivo from "./components/PartidaAoVivo";
import Intervalo from "./components/Intervalo";
import Resultado from "./components/Resultado";
import Tabela from "./components/Tabela";
import Artilharia from "./components/Artilharia";
import TelaCampeao from "./components/TelaCampeao";

export default function App() {
  const Sref = useRef(null);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const [tela, setTela] = useState("inicio");
  const [nomeTec, setNomeTec] = useState("");
  const [meuTime, setMeuTime] = useState(null);
  const [escolhidos, setEscolhidos] = useState([]); // escalação do jogador (7)
  const [jogo, setJogo] = useState(null);
  const [minuto, setMinuto] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [banner, setBanner] = useState(null);
  const [mudo, setMudo] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [selOut, setSelOut] = useState(null);
  const [selIn, setSelIn] = useState(null);
  const [modalNomes, setModalNomes] = useState(false);
  const [textoNomes, setTextoNomes] = useState("");
  const [confirmaNova, setConfirmaNova] = useState(false);
  const [saveData, setSaveData] = useState(null); // save encontrado na abertura
  const [avisoSemSave, setAvisoSemSave] = useState(false); // localStorage indisponível
  const anunciados = useRef(0);
  const audioCtx = useRef(null);
  const jogoRef = useRef(null);
  jogoRef.current = jogo;

  const S = Sref.current;

  const beep = () => {
    if (mudo) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current, o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square";
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.setValueAtTime(660, ctx.currentTime + 0.09);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.26);
    } catch (e) { /* sem áudio, sem drama */ }
  };

  // ---------- abertura: carregar save / detectar storage ----------
  useEffect(() => {
    if (!localStorageDisponivel()) {
      setAvisoSemSave(true); // avisa uma vez; app funciona sem save
      return;
    }
    const s = carregarSave();
    if (s) setSaveData(s);
  }, []);

  // ---------- fluxo de temporada ----------
  const iniciarTemporada = (time) => {
    const nova = novaTemporada();
    Sref.current = nova;
    setMeuTime(time);
    prepararEscalacao(time, nova);
    // Persiste já no início: forças/atributos sorteados não podem se perder nem
    // ser re-sorteados no meio da temporada.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: time, S: nova });
    setTela("escalacao");
  };

  const continuarJogo = () => {
    if (!saveData) return;
    const s = reconstruirS(saveData);
    Sref.current = s;
    setNomeTec(saveData.nomeTecnico || "");
    setMeuTime(saveData.timeEscolhido);
    if (s.rodada >= 22) {
      setTela("tabela"); // temporada encerrada: cai na classificação final
    } else {
      prepararEscalacao(saveData.timeEscolhido, s);
      setTela("escalacao");
    }
  };

  const prepararEscalacao = (time, S2) => {
    setEscolhidos(melhores(S2.elencos[time]).map((j) => j.id));
  };

  const confronto = () => {
    const rod = S.calendario[S.rodada];
    return rod.find((j) => j.casa === meuTime || j.fora === meuTime);
  };
  const outrosConfrontos = () =>
    S.calendario[S.rodada].filter((j) => j.casa !== meuTime && j.fora !== meuTime);

  const escSelecionada = () => S.elencos[meuTime].filter((j) => escolhidos.includes(j.id));
  const escValida = () => {
    const e = escSelecionada();
    return e.length === 7 && e.filter((j) => j.pos === "GOL").length === 1;
  };

  const toggleJogador = (j) => {
    if (escolhidos.includes(j.id)) { setEscolhidos(escolhidos.filter((id) => id !== j.id)); return; }
    const e = escSelecionada();
    if (j.pos === "GOL") {
      const semGks = escolhidos.filter((id) => !(S.elencos[meuTime].find((x) => x.id === id).pos === "GOL"));
      setEscolhidos([...semGks, j.id]);
    } else if (e.filter((x) => x.pos !== "GOL").length < 6) {
      setEscolhidos([...escolhidos, j.id]);
    }
  };

  const salvarNomes = (texto) => {
    const nomes = texto.split("\n").map((s) => s.trim()).filter(Boolean);
    S.elencos[meuTime].forEach((j, i) => { if (nomes[i]) j.nome = nomes[i]; });
    setModalNomes(false); rerender();
  };

  const montarJogo = () => {
    const c = confronto();
    const souCasa = c.casa === meuTime;
    const adv = souCasa ? c.fora : c.casa;
    const minhaEsc = escSelecionada();
    const advEsc = escalacaoIA(S.elencos[adv]);
    const escCasa = souCasa ? minhaEsc : advEsc;
    const escFora = souCasa ? advEsc : minhaEsc;
    const outros = outrosConfrontos().map((j) => {
      const eC = escalacaoIA(S.elencos[j.casa]), eF = escalacaoIA(S.elencos[j.fora]);
      return { ...j, ev: [...simMetade(S, j.casa, j.fora, eC, eF, 1), ...simMetade(S, j.casa, j.fora, eC, eF, 2)] };
    });
    return {
      casa: c.casa, fora: c.fora, souCasa, adv,
      minhaEsc1: minhaEsc, minhaEsc2: minhaEsc, advEsc,
      ev1: simMetade(S, c.casa, c.fora, escCasa, escFora, 1),
      ev2: null, outros, subs: 0, meiaFase: "1T",
    };
  };

  const jogarAoVivo = () => {
    const j = montarJogo();
    anunciados.current = 0;
    setJogo(j); setMinuto(0); setRodando(true); setTela("aoVivo");
  };

  const iniciarSegundoTempo = () => {
    const j = jogoRef.current;
    const escCasa = j.souCasa ? j.minhaEsc2 : j.advEsc;
    const escFora = j.souCasa ? j.advEsc : j.minhaEsc2;
    const ev2 = simMetade(S, j.casa, j.fora, escCasa, escFora, 2);
    setJogo({ ...j, ev2, meiaFase: "2T" });
    setSelOut(null); setSelIn(null);
    setRodando(true); setTela("aoVivo");
  };

  const rodadaRapida = () => {
    const j = montarJogo();
    const escCasa = j.souCasa ? j.minhaEsc1 : j.advEsc;
    const escFora = j.souCasa ? j.advEsc : j.minhaEsc1;
    j.ev2 = simMetade(S, j.casa, j.fora, escCasa, escFora, 2);
    finalizarRodada(j);
  };

  const finalizarRodada = (j) => {
    const evMeu = [...j.ev1, ...(j.ev2 || [])];
    const jogos = [
      { casa: j.casa, fora: j.fora, ev: evMeu },
      ...j.outros.map((o) => ({ casa: o.casa, fora: o.fora, ev: o.ev })),
    ].map((x) => ({ ...x, gc: golsDe(x.ev, x.casa), gf: golsDe(x.ev, x.fora) }));

    jogos.forEach((x) => {
      const tc = S.tabela[x.casa], tf = S.tabela[x.fora];
      tc.J++; tf.J++; tc.GP += x.gc; tc.GC += x.gf; tf.GP += x.gf; tf.GC += x.gc;
      if (x.gc > x.gf) {
        tc.V++; tc.P += 3; tf.D++;
        S.fase[x.casa] = Math.min(1.08, S.fase[x.casa] + 0.04);
        S.fase[x.fora] = Math.max(0.92, S.fase[x.fora] - 0.04);
      } else if (x.gf > x.gc) {
        tf.V++; tf.P += 3; tc.D++;
        S.fase[x.fora] = Math.min(1.08, S.fase[x.fora] + 0.04);
        S.fase[x.casa] = Math.max(0.92, S.fase[x.casa] - 0.04);
      } else { tc.E++; tf.E++; tc.P++; tf.P++; }
      x.ev.filter((e) => e.tipo === "gol").forEach((e) => {
        S.art[e.autor.id] = S.art[e.autor.id] || { nome: e.autor.nome, time: e.autor.time, g: 0 };
        S.art[e.autor.id].g++;
      });
    });

    // Craque da Partida (só do jogo do jogador)
    const meu = jogos[0];
    const craque = calcularCraque({
      evMeu,
      minhaEsc1: j.minhaEsc1,
      minhaEsc2: j.minhaEsc2,
      advEsc: j.advEsc,
      gcMeu: meu.gc,
      gfMeu: meu.gf,
    });

    S.rodada++;
    // Auto-save ao fim de cada rodada (build-spec §8) — nunca depende do usuário.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, S });
    setResumo({ jogos, evMeu, craque, rodada: S.rodada, casa: j.casa, fora: j.fora });
    setJogo(null);
    setTela("resultado");
    rerender();
  };

  // ---------- relógio da partida ----------
  useEffect(() => {
    if (tela !== "aoVivo" || !rodando) return;
    const id = setInterval(() => setMinuto((m) => m + 1), 170);
    return () => clearInterval(id);
  }, [tela, rodando]);

  useEffect(() => {
    if (tela !== "aoVivo" || !jogo) return;
    const evs = [...jogo.ev1, ...(jogo.ev2 || [])]
      .filter((e) => e.tipo === "gol" && e.min <= minuto)
      .sort((a, b) => a.min - b.min);
    if (evs.length > anunciados.current) {
      const e = evs[evs.length - 1];
      setBanner(`⚽ GOL DO ${SIGLA[e.time]} — ${e.autor.nome}`);
      beep();
      anunciados.current = evs.length;
      setTimeout(() => setBanner(null), 1600);
    }
    if (minuto >= 25 && jogo.meiaFase === "1T") {
      setRodando(false);
      setTela("intervalo");
    }
    if (minuto >= 50 && jogo.meiaFase === "2T") {
      setRodando(false);
      finalizarRodada(jogo);
    }
  }, [minuto, tela]); // eslint-disable-line

  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "#0B1712", color: "#ECF4EB", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className="max-w-md mx-auto px-4">
        {tela === "inicio" && (
          <TelaInicial
            nomeTec={nomeTec}
            setNomeTec={setNomeTec}
            iniciarTemporada={iniciarTemporada}
            saveData={saveData}
            continuarJogo={continuarJogo}
            avisoSemSave={avisoSemSave}
          />
        )}
        {tela === "escalacao" && S && (
          <Escalacao
            S={S}
            meuTime={meuTime}
            escolhidos={escolhidos}
            toggleJogador={toggleJogador}
            escSelecionada={escSelecionada}
            escValida={escValida}
            jogarAoVivo={jogarAoVivo}
            rodadaRapida={rodadaRapida}
            confronto={confronto}
            modalNomes={modalNomes}
            setModalNomes={setModalNomes}
            textoNomes={textoNomes}
            setTextoNomes={setTextoNomes}
            salvarNomes={salvarNomes}
          />
        )}
        {tela === "aoVivo" && S && (
          <PartidaAoVivo S={S} jogo={jogo} minuto={minuto} banner={banner} mudo={mudo} setMudo={setMudo} />
        )}
        {tela === "intervalo" && S && jogo && (
          <Intervalo
            S={S}
            meuTime={meuTime}
            jogo={jogo}
            setJogo={setJogo}
            selOut={selOut}
            setSelOut={setSelOut}
            selIn={selIn}
            setSelIn={setSelIn}
            iniciarSegundoTempo={iniciarSegundoTempo}
          />
        )}
        {tela === "resultado" && S && resumo && <Resultado resumo={resumo} setTela={setTela} />}
        {tela === "tabela" && S && (
          <Tabela S={S} meuTime={meuTime} setTela={setTela} prepararEscalacao={prepararEscalacao} />
        )}
        {tela === "artilharia" && S && <Artilharia S={S} setTela={setTela} />}
        {tela === "campeao" && S && (
          <TelaCampeao
            S={S}
            meuTime={meuTime}
            nomeTec={nomeTec}
            confirmaNova={confirmaNova}
            setConfirmaNova={setConfirmaNova}
            iniciarTemporada={iniciarTemporada}
          />
        )}
        </div>
      </div>
      <Analytics />
    </>
  );
}
