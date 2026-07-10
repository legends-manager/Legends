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
import {
  creditarOrcamentos, valorizarJogadores, unionPorId,
  listarJogador, retirarListagem, comprarJogador, aceitarOferta, recusarOferta, fecharJanela, iaNegocia,
  posicaoDoTime,
} from "./engine/mercado";
import { atualizarTorcida, humorTorcida, gerarComentario } from "./engine/torcida";
import { simularTemporadaRapida } from "./engine/simulacaoRapida";
import { mundoInicial, timesDaSerie, calcularAcessoRebaixamento, fecharTemporada } from "./engine/mundo";
import { SIGLA } from "./data/times";
import { SERIE_PADRAO, SERIES, ORDEM_SERIES } from "./data/series";
import {
  carregarSave, reconstruirS, salvarJogo, localStorageDisponivel, limparSave,
  carregarMundo, salvarMundo, migrarParaMundoSeNecessario, limparMundo,
} from "./storage/saveGame";

import TelaInicial from "./components/TelaInicial";
import HistoriaCarreira from "./components/HistoriaCarreira";
import HistoriaLiga from "./components/HistoriaLiga";
import Mercado from "./components/Mercado";
import Escalacao from "./components/Escalacao";
import PartidaAoVivo from "./components/PartidaAoVivo";
import Intervalo from "./components/Intervalo";
import Resultado from "./components/Resultado";
import Tabela from "./components/Tabela";
import Artilharia from "./components/Artilharia";
import FimDeTemporada from "./components/FimDeTemporada";

export default function App() {
  const Sref = useRef(null);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const [tela, setTela] = useState("inicio");
  const [serie, setSerie] = useState(SERIE_PADRAO); // série selecionada na capa (Marco 3)
  const [nomeTec, setNomeTec] = useState("");
  const [avatarId, setAvatarId] = useState(null); // galeria fixa (spec-marco2-polish.md §5)
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
  const [saveData, setSaveData] = useState(null); // save encontrado na abertura
  const [avisoSemSave, setAvisoSemSave] = useState(false); // localStorage indisponível
  const [mundo, setMundo] = useState(null); // Liga Viva (Marco 3.5) — null = sem carreira ainda
  const [fimDeTemporadaResumo, setFimDeTemporadaResumo] = useState(null);
  const anunciados = useRef(0);
  const audioCtx = useRef(null);
  const jogoRef = useRef(null);
  jogoRef.current = jogo;

  const S = Sref.current;

  // Som de gol: "explosão de torcida" sintetizada (pedido do Felyp — algo
  // como um grito rápido de gol, não um bip). Rajada de ruído branco com
  // filtro passa-banda subindo (o "UUURRA" da arquibancada) + um sopro grave
  // curto no ataque (a bola estufando a rede). Sem arquivo de áudio, tudo
  // Web Audio — continua funcionando offline e respeitando o botão de mudo.
  const beep = () => {
    if (mudo) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current, t = ctx.currentTime;

      // Torcida: ruído branco ~0,9s, filtro subindo 350→1400Hz, ataque rápido
      // e cauda longa (grito que explode e vai morrendo).
      const dur = 0.9;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(350, t);
      bp.frequency.exponentialRampToValueAtTime(1400, t + 0.15);
      bp.frequency.exponentialRampToValueAtTime(500, t + dur);
      const gN = ctx.createGain();
      gN.gain.setValueAtTime(0.0001, t);
      gN.gain.exponentialRampToValueAtTime(0.22, t + 0.06); // explosão
      gN.gain.exponentialRampToValueAtTime(0.001, t + dur); // morrendo
      noise.connect(bp); bp.connect(gN); gN.connect(ctx.destination);
      noise.start(t); noise.stop(t + dur);

      // Rede: sopro grave curtíssimo no primeiro instante (bola batendo na rede).
      const o = ctx.createOscillator(), gO = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      gO.gain.setValueAtTime(0.15, t);
      gO.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(gO); gO.connect(ctx.destination);
      o.start(t); o.stop(t + 0.15);
    } catch (e) { /* sem áudio, sem drama */ }
  };

  // ---------- abertura: mundo (Liga Viva) tem prioridade sobre o seletor ----------
  // Se existe mundo (ou um save antigo migra pra um), a série deixa de ser
  // escolha do jogador — vira mundo.divisao[mundo.meuTime] (spec-liga-viva.md
  // §6: "em modo carreira, mostra o time/série atual... em vez de reescolher").
  useEffect(() => {
    if (!localStorageDisponivel()) {
      setAvisoSemSave(true); // avisa uma vez; app funciona sem save
      return;
    }
    const m = migrarParaMundoSeNecessario() || carregarMundo();
    if (m) {
      setMundo(m);
      setSerie(m.divisao[m.meuTime]);
      setMeuTime(m.meuTime);
    }
  }, []);

  // ---------- carregar save da série ativa ----------
  useEffect(() => {
    if (!localStorageDisponivel()) return;
    // Recarrega sempre que a série muda (cada série tem seu save).
    setSaveData(carregarSave(serie) || null);
  }, [serie]);

  // ---------- fluxo de temporada ----------
  // Só é chamada a partir do seletor da capa — ou seja, só quando NÃO existe
  // mundo ainda (1ª partida de sempre, ou depois de "Novo jogo"). Cria a
  // carreira (Liga Viva, spec-liga-viva.md §2) nascendo na série escolhida.
  const iniciarTemporada = (time) => {
    const novoMundo = mundoInicial(time);
    setMundo(novoMundo);
    salvarMundo(novoMundo);

    const times = timesDaSerie(novoMundo, serie);
    const nova = novaTemporada(serie, times, null); // carreira nova: orçamento sempre do zero
    Sref.current = nova;
    setMeuTime(time);
    prepararEscalacao(time, nova);
    // Marco 2 (spec-mercado.md §4): a janela "pre" abre antes da 1ª escalação.
    // As 11 IAs já agem (§5) antes do jogador ver a tela, numa única leva.
    iaNegocia(nova, time);
    // Persiste já no início: forças/atributos sorteados não podem se perder nem
    // ser re-sorteados no meio da temporada.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: time, avatarId, S: nova });
    setTela("mercado");
  };

  // ---------- Liga Viva (Marco 3.5, spec-liga-viva.md §3) ----------
  // Fim da temporada do jogador: simula as OUTRAS duas séries em segundo
  // plano (§5), calcula quem sobe/desce/permanece nas três, atualiza o mundo
  // (divisão, hall de campeões, carreira) e mostra a tela de Fim de Temporada.
  const finalizarTemporadaCarreira = () => {
    const minhaSerie = S.serie;
    const tabelasPorSerie = { [minhaSerie]: S.tabela };
    ORDEM_SERIES.filter((s) => s !== minhaSerie).forEach((s) => {
      const times = timesDaSerie(mundo, s);
      tabelasPorSerie[s] = simularTemporadaRapida(times, SERIES[s].serieBonus);
    });
    const resultado = calcularAcessoRebaixamento(tabelasPorSerie);
    const { serieDestino, resultado: meuResultado, minhaPosicao } =
      fecharTemporada(mundo, resultado, meuTime, minhaSerie);
    salvarMundo(mundo);
    // A temporada foi processada: o save dela vira lixo perigoso — se ficasse,
    // reabrir o app oferecia "Continuar" nela e o Fim de Temporada podia rodar
    // DE NOVO (temporada dupla no mundo). Limpo já; quem fechar o app agora
    // cai em "Começar temporada" (retomarCarreiraSemSave), que é o correto.
    limparSave(minhaSerie);
    setSaveData(null);
    setMundo({ ...mundo });
    setFimDeTemporadaResumo({ resultado, serieDestino, meuResultado, minhaPosicao, minhaSerie });
    setTela("fimDeTemporada");
  };

  // Botão "Próxima temporada" da tela de Fim de Temporada: gera a nova
  // temporada automaticamente na série de destino (sem re-escolher time —
  // "o técnico acompanha o time", §0), com o elenco ATUAL daquela série.
  const proximaTemporadaCarreira = () => {
    const { serieDestino } = fimDeTemporadaResumo;
    // spec-mercado.md §0: o orçamento POR TIME persiste entre temporadas
    // ("administrar bem numa temporada dá poder de fogo na seguinte") — passa
    // o mapa inteiro, não só o do humano. Times que chegam de OUTRA série não
    // estão no S antigo e caem no default L$1000 dentro de novaTemporada (as
    // séries de fundo não simulam economia, não há valor melhor a herdar).
    const times = timesDaSerie(mundo, serieDestino);
    const nova = novaTemporada(serieDestino, times, S.orcamento);
    Sref.current = nova;
    setSerie(serieDestino);
    prepararEscalacao(meuTime, nova);
    iaNegocia(nova, meuTime);
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S: nova });
    setFimDeTemporadaResumo(null);
    setTela("mercado");
  };

  // Caso de borda: o app foi fechado entre "Fim de Temporada" (mundo já
  // atualizado e salvo) e o clique em "Próxima temporada" — fimDeTemporadaResumo
  // é só estado React, não sobrevive a um reload. Retoma a carreira direto do
  // mundo persistido (sem o resumo daquela transição; orçamento reinicia).
  const retomarCarreiraSemSave = () => {
    const minhaSerieAgora = mundo.divisao[mundo.meuTime];
    const times = timesDaSerie(mundo, minhaSerieAgora);
    const nova = novaTemporada(minhaSerieAgora, times, null);
    Sref.current = nova;
    setSerie(minhaSerieAgora);
    setMeuTime(mundo.meuTime);
    prepararEscalacao(mundo.meuTime, nova);
    iaNegocia(nova, mundo.meuTime);
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: mundo.meuTime, avatarId, S: nova });
    setTela("mercado");
  };

  // "Novo jogo": reinicia o mundo inteiro (spec-liga-viva.md §6) — volta pro
  // seletor de série/time da capa.
  const novoJogo = () => {
    limparMundo();
    Sref.current = null;
    setMundo(null);
    setMeuTime(null);
    setSerie(SERIE_PADRAO);
    setAvatarId(null);
    setSaveData(null);
    setFimDeTemporadaResumo(null);
    setTela("inicio");
  };

  const continuarJogo = () => {
    if (!saveData) return;
    const s = reconstruirS(saveData);
    Sref.current = s;
    setSerie(s.serie); // mantém o seletor alinhado à temporada retomada
    setNomeTec(saveData.nomeTecnico || "");
    setAvatarId(saveData.avatarId || null);
    setMeuTime(saveData.timeEscolhido);
    if (s.mercado.janela !== "fechada") {
      setTela("mercado"); // fechou o app com a janela aberta: retoma nela
    } else if (s.rodada >= s.calendario.length) {
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
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S });
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

    // Torcida (spec-marco2-polish.md §3): atualiza pra todos os times da
    // rodada (camada de apresentação, nunca entra em fórmula do motor). O
    // comentário (1 por rodada) é só do time do humano.
    atualizarTorcida(S.torcida, S.torcidaRef, S.formaRecente, jogos);
    const humor = humorTorcida(S.formaRecente[meuTime], posicaoDoTime(S, meuTime), Object.keys(S.tabela).length);
    const ultimoTexto = S.comentariosTorcida[S.comentariosTorcida.length - 1]?.texto ?? null;
    const comentario = { rodada: S.rodada, humor, texto: gerarComentario(humor, ultimoTexto) };
    S.comentariosTorcida.push(comentario);

    // Marco 2 (spec-mercado.md §4): janela do meio abre exatamente uma vez,
    // após a rodada do meio — inclusive quando ela é jogada via rodada rápida
    // (ambos os fluxos passam por finalizarRodada, não tem caminho alternativo).
    // Genérico (Marco 3): metade = calendario.length/2 → 11 na Série C (22
    // rodadas), 9 na Série B (18).
    if (S.rodada === S.calendario.length / 2 && !S.mercado.janelaUsadaMeio) {
      S.mercado.janela = "meio";
      S.mercado.janelaUsadaMeio = true;
      iaNegocia(S, meuTime); // §5: as 11 IAs agem antes do jogador ver a janela
    }
    // Auto-save ao fim de cada rodada (build-spec §8) — nunca depende do usuário.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S });
    setResumo({ jogos, evMeu, craque, rodada: S.rodada, casa: j.casa, fora: j.fora, comentarioTorcida: comentario });
    setJogo(null);
    setTela("resultado");
    rerender();
  };

  // ---------- relógio da partida ----------
  useEffect(() => {
    if (tela !== "aoVivo" || !rodando) return;
    // ~250ms por minuto de jogo (pedido do Felyp: "um pouco mais lento" que
    // os 170ms anteriores) → cada tempo de 25min dura ~6s.
    const id = setInterval(() => setMinuto((m) => m + 1), 250);
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
            serie={serie}
            setSerie={setSerie}
            nomeTec={nomeTec}
            setNomeTec={setNomeTec}
            avatarId={avatarId}
            setAvatarId={setAvatarId}
            iniciarTemporada={iniciarTemporada}
            saveData={saveData}
            continuarJogo={continuarJogo}
            avisoSemSave={avisoSemSave}
            mundo={mundo}
            novoJogo={novoJogo}
            retomarCarreiraSemSave={retomarCarreiraSemSave}
            setTela={setTela}
          />
        )}
        {tela === "historiaCarreira" && mundo && <HistoriaCarreira mundo={mundo} setTela={setTela} />}
        {tela === "historiaLiga" && mundo && <HistoriaLiga mundo={mundo} setTela={setTela} />}
        {tela === "escalacao" && S && (
          <Escalacao
            S={S}
            meuTime={meuTime}
            nomeTec={nomeTec}
            avatarId={avatarId}
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
          <Tabela
            S={S}
            meuTime={meuTime}
            setTela={setTela}
            irProximaRodada={irProximaRodada}
            finalizarTemporadaCarreira={finalizarTemporadaCarreira}
          />
        )}
        {tela === "artilharia" && S && <Artilharia S={S} setTela={setTela} />}
        {tela === "fimDeTemporada" && fimDeTemporadaResumo && (
          <FimDeTemporada
            resumo={fimDeTemporadaResumo}
            meuTime={meuTime}
            nomeTec={nomeTec}
            avatarId={avatarId}
            proximaTemporadaCarreira={proximaTemporadaCarreira}
          />
        )}
        <Analytics />
      </div>
    </div>
  );
}
