import { useState, useEffect, useRef } from "react";

// =====================================================================
// LEGENDS MANAGER — Marco 1, single-player.
// Orquestração: estado da temporada (Sref), fluxo de telas e efeitos.
// Toda a lógica é a mesma da demo; motor em engine/, dados em data/,
// telas em components/. Save/PWA entram nos Passos 2 e 3.
// =====================================================================
import {
  novaTemporada, melhores, escalacaoIA, simMetade, golsDe,
} from "./engine/simulador";
import {
  creditarOrcamentos, valorizarJogadores, unionPorId,
  listarJogador, retirarListagem, comprarJogador, aceitarOferta, recusarOferta, fecharJanela, iaNegocia,
} from "./engine/mercado";
import { SIGLA } from "./data/times";
import { carregarSave, reconstruirS, salvarJogo, localStorageDisponivel } from "./storage/saveGame";

import TelaInicial from "./components/TelaInicial";
import Mercado from "./components/Mercado";
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
    // Marco 2 (spec-mercado.md §0): orçamento é mantido entre temporadas.
    const nova = novaTemporada(Sref.current ? Sref.current.orcamento : null);
    Sref.current = nova;
    setMeuTime(time);
    prepararEscalacao(time, nova);
    // Marco 2 (spec-mercado.md §4): a janela "pre" abre antes da 1ª escalação.
    // As 11 IAs já agem (§5) antes do jogador ver a tela, numa única leva.
    iaNegocia(nova, time);
    // Persiste já no início: forças/atributos sorteados não podem se perder nem
    // ser re-sorteados no meio da temporada.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: time, S: nova });
    setTela("mercado");
  };

  const continuarJogo = () => {
    if (!saveData) return;
    const s = reconstruirS(saveData);
    Sref.current = s;
    setNomeTec(saveData.nomeTecnico || "");
    setMeuTime(saveData.timeEscolhido);
    if (s.mercado.janela !== "fechada") {
      setTela("mercado"); // fechou o app com a janela aberta: retoma nela
    } else if (s.rodada >= 22) {
      setTela("tabela"); // temporada encerrada: cai na classificação final
    } else {
      prepararEscalacao(saveData.timeEscolhido, s);
      setTela("escalacao");
    }
  };

  // Fecha a janela de mercado (listagens/ofertas expiram) e segue o fluxo
  // normal: prepara a escalação e vai pra rodada.
  const fecharJanelaEIrEscalacao = () => {
    fecharJanela(S);
    prepararEscalacao(meuTime, S);
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, S });
    setTela("escalacao");
  };

  // ---------- ações de mercado (Marco 2) ----------
  const listarNoMercado = (idJogador, preco) => {
    const r = listarJogador(S, meuTime, idJogador, preco);
    if (r.ok) rerender();
    return r;
  };
  const cancelarListagem = (idJogador) => {
    retirarListagem(S, idJogador);
    rerender();
  };
  const comprarNoMercado = (idJogador) => {
    const r = comprarJogador(S, meuTime, idJogador);
    if (r.ok) rerender();
    return r;
  };
  const aceitarOfertaHumano = (oferta) => {
    const r = aceitarOferta(S, oferta);
    if (r.ok) rerender();
    return r;
  };
  const recusarOfertaHumano = (oferta) => {
    recusarOferta(S, oferta);
    rerender();
  };

  const prepararEscalacao = (time, S2) => {
    setEscolhidos(melhores(S2.elencos[time]).map((j) => j.id));
  };

  // Chamado pelo botão "Próxima rodada" da Tabela: se a janela do meio acabou
  // de abrir (pós-rodada 11), vai pro Mercado antes da escalação da rodada 12.
  const irProximaRodada = () => {
    if (S.mercado.janela !== "fechada") {
      setTela("mercado");
    } else {
      prepararEscalacao(meuTime, S);
      setTela("escalacao");
    }
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
      // escCasa/escFora ficam guardados pra valorização de jogadores no fim da rodada
      // (Marco 2 — precisa saber quem jogou em todo jogo, não só no do humano).
      return {
        ...j,
        escCasa: eC,
        escFora: eF,
        ev: [...simMetade(S, j.casa, j.fora, eC, eF, 1), ...simMetade(S, j.casa, j.fora, eC, eF, 2)],
      };
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
    // minhaEscRodada = quem entrou em campo pelo humano na rodada (titulares +
    // eventuais substitutos do intervalo), pra valorização do Marco 2.
    const minhaEscRodada = unionPorId(j.minhaEsc1, j.minhaEsc2);
    const jogos = [
      {
        casa: j.casa, fora: j.fora, ev: evMeu,
        escCasa: j.souCasa ? minhaEscRodada : j.advEsc,
        escFora: j.souCasa ? j.advEsc : minhaEscRodada,
      },
      ...j.outros.map((o) => ({ casa: o.casa, fora: o.fora, ev: o.ev, escCasa: o.escCasa, escFora: o.escFora })),
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

    // Marco 2 (spec-mercado.md §3): crédito de orçamento por resultado e
    // valorização de jogadores, para os 12 times da rodada — não só o jogo do
    // humano. valorizarJogadores também calcula o Craque da Partida de cada
    // jogo; craques[0] é o do jogo do jogador (reaproveitado no resumo).
    creditarOrcamentos(S.orcamento, jogos);
    const craques = valorizarJogadores(S.elencos, jogos);
    const craque = craques[0];

    S.rodada++;
    // Marco 2 (spec-mercado.md §4): janela do meio abre exatamente uma vez,
    // após a rodada 11 — inclusive quando ela é jogada via rodada rápida
    // (ambos os fluxos passam por finalizarRodada, não tem caminho alternativo).
    if (S.rodada === 11 && !S.mercado.janelaUsadaMeio) {
      S.mercado.janela = "meio";
      S.mercado.janelaUsadaMeio = true;
      iaNegocia(S, meuTime); // §5: as 11 IAs agem antes do jogador ver a janela
    }
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
    <div
      className="min-h-screen"
      style={{ background: "#150A26", color: "#F2EDFA", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
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
        {tela === "mercado" && S && (
          <Mercado
            S={S}
            meuTime={meuTime}
            comprarNoMercado={comprarNoMercado}
            listarNoMercado={listarNoMercado}
            cancelarListagem={cancelarListagem}
            aceitarOfertaHumano={aceitarOfertaHumano}
            recusarOfertaHumano={recusarOfertaHumano}
            fecharJanelaEIrEscalacao={fecharJanelaEIrEscalacao}
          />
        )}
        {tela === "tabela" && S && (
          <Tabela S={S} meuTime={meuTime} setTela={setTela} irProximaRodada={irProximaRodada} />
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
  );
}
