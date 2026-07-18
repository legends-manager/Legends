import { useState, useEffect, useRef } from "react";

// =====================================================================
// LEGENDS MANAGER — Marco 1, single-player.
// Orquestração: estado da temporada (Sref), fluxo de telas e efeitos.
// Toda a lógica é a mesma da demo; motor em engine/, dados em data/,
// telas em components/. Save/PWA entram nos Passos 2 e 3.
// =====================================================================
import {
  novaTemporada, melhores, escalacaoIA, simMetade, golsDe,
  avancarRodadaSimples, sincronizarSerieParalela,
} from "./engine/simulador";
import {
  creditarOrcamentos, valorizarJogadores, unionPorId,
  listarJogador, retirarListagem, comprarJogador, aceitarOferta, recusarOferta, fecharJanela, iaNegocia,
  proporJogador,
  posicaoDoTime,
} from "./engine/mercado";
import { atualizarTorcida, humorTorcida, gerarComentario } from "./engine/torcida";
import {
  mundoInicial, timesDaSerie, calcularAcessoRebaixamento, fecharTemporada,
  atualizarRecordeGoleada, atualizarRecordeArtilheiro,
} from "./engine/mundo";
import { desbloquear, carregarConquistas } from "./storage/conquistas";
import ConquistaCelebracao from "./components/entry-hub/ConquistaCelebracao";
import {
  iniciarCopa, avancarFaseCopa, confrontoPendenteDoJogador, eliminadoDaCopa,
  historicoDoJogador, simularJogoCopa, nomeFase, PREMIO_VITORIA_COPA, PREMIO_CAMPEAO_COPA,
} from "./engine/copa";
import { SIGLA } from "./data/times";
import { SERIE_PADRAO, SERIES, ORDEM_SERIES, TODOS_OS_TIMES } from "./data/series";
import {
  carregarSave, reconstruirS, salvarJogo, localStorageDisponivel, limparSave,
  carregarMundo, salvarMundo, migrarParaMundoSeNecessario, limparMundo,
} from "./storage/saveGame";
import { incrementarMetrica } from "./storage/metricas";
import { sorteiaSeAparece, sortearPergunta, sortearPremio } from "./storage/quiz";
import { bonusDaSemana, semanaTematica } from "./engine/semana";
import { publicarTemporada, publicarProgresso, vincularCarreira, publicarConquistas } from "./storage/publicarOnline";
import { chaveVinculo, deveExecutarVinculoAutomatico, deveSincronizarProgresso } from "./storage/sincronizacaoRegras";

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
import QuizModal from "./components/QuizModal";
import TelaCopa from "./components/TelaCopa";
import Ranking from "./components/Ranking";
import BottomNav from "./components/BottomNav";
import { cores } from "./components/entry-hub/estilos";
import { supabase } from "./storage/supabaseClient";

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
  const [promptInstalar, setPromptInstalar] = useState(null); // evento beforeinstallprompt (PWA)
  const [quizAtual, setQuizAtual] = useState(null); // pergunta sorteada (quiz de curiosidades), ou null
  const [ultimaPerguntaQuiz, setUltimaPerguntaQuiz] = useState(null); // evita repetir a mesma 2x seguidas
  const [fimDeTemporadaResumo, setFimDeTemporadaResumo] = useState(null);
  // Fila de celebração de insígnias (Fase 1c): cada desbloqueio novo entra
  // aqui; a tela cheia mostra uma de cada vez e avança ao fechar. Fica por
  // cima de QUALQUER tela, sem interferir na navegação por trás dela.
  const [celebracoesPendentes, setCelebracoesPendentes] = useState([]);
  // Sessão online (Fase 1): fonte única, controlada aqui e passada pra quem
  // precisa (TelaInicial, Ranking) — undefined = carregando, null = deslogado.
  const [sessao, setSessao] = useState(undefined);
  const anunciados = useRef(0);
  const anunciadosChance = useRef(0);
  const jogoRef = useRef(null);
  jogoRef.current = jogo;

  const S = Sref.current;

  // Desbloqueia 1+ insígnias e enfileira a celebração de tela cheia pra cada
  // uma que for NOVA (desbloquear() já é idempotente — só entra na fila na
  // primeira vez). Sempre passa contexto (clube/temporada) quando disponível,
  // por cima do que o chamador decidiu, sem mudar a assinatura de desbloquear.
  const desbloquearComCelebracao = (ids, contexto = {}) => {
    const lista = Array.isArray(ids) ? ids : [ids];
    const novas = lista.filter((id) => desbloquear(id, contexto));
    if (novas.length > 0) {
      setCelebracoesPendentes((fila) => [...fila, ...novas]);
      // Fase 2 (insígnias online): espelha no ranking público — best-effort,
      // sem sessão é no-op silencioso, igual publicarProgresso.
      publicarConquistas(carregarConquistas());
    }
  };

  // Efeitos sonoros reais (ElevenLabs, jul/2026 — substituem o "beep"
  // sintetizado anterior). Arquivos em public/sfx/, respeitam o botão de mudo.
  const tocarSfx = (caminho, volume = 1) => {
    if (mudo) return;
    try {
      const a = new Audio(caminho);
      a.volume = volume;
      a.play().catch(() => {}); // autoplay bloqueado em algum navegador: silenciosamente ignora
    } catch (e) { /* sem áudio, sem drama */ }
  };

  // Som de gol: torcida vibrando + vibração tátil (independente do mudo —
  // mudo silencia som, não tato). Padrão curto "gol-gol": ignorado por
  // navegadores sem suporte a vibração.
  const beep = () => {
    try { if (navigator.vibrate) navigator.vibrate([70, 40, 110]); } catch (e) { /* sem vibração */ }
    tocarSfx("/sfx/torcida-gol.mp3");
  };
  const apito = () => tocarSfx("/sfx/apito.mp3");
  const chute = () => tocarSfx("/sfx/chute.mp3", 0.7);

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

  // ---------- instalação PWA (hint na capa) ----------
  // Chrome/Android dispara beforeinstallprompt quando o app é instalável e
  // ainda não foi instalado; guardamos o evento pra disparar o prompt no
  // clique do botão da capa. Quem abre o link do WhatsApp fica no navegador —
  // o ícone na tela inicial é o principal canal de retorno.
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPromptInstalar(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const instalarApp = async () => {
    if (!promptInstalar) return;
    promptInstalar.prompt();
    await promptInstalar.userChoice;
    setPromptInstalar(null); // aceito ou não, o evento só serve uma vez
  };

  // ---------- sessão online (Fase 1) ----------
  useEffect(() => {
    if (!supabase) { setSessao(null); return; }
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Vínculo automático ao ranking (pedido do Felyp: "coloca o nome, joga e
  // já entra automaticamente" — nada de botão "Vincular" manual). Dispara
  // sozinho assim que sessão + carreira em andamento coexistem: cobre login
  // no meio de uma carreira já rolando, e também o caso de abrir o app já
  // logado com uma carreira carregada do localStorage. iniciarTemporada
  // (carreira NOVA) já vincula na hora de escolher o time; este efeito é o
  // reforço pros outros dois casos. Guardado por ref pra não repetir a cada
  // re-render — só re-sincroniza se a sessão ou o time mudar de verdade.
  // BUGFIX (jul/2026): antes, o perfil só era criado se `nomeTec` já
  // estivesse preenchido — o que falha pra quase todo mundo, porque o login
  // aparece na capa ANTES do jogador clicar "Continuar" (que é quem repõe
  // nomeTec do save). Sem perfil, TODA escrita em carreiras falha por chave
  // estrangeira, em silêncio. Agora garantirPerfil() roda DENTRO de
  // vincularCarreira/publicarProgresso/publicarTemporada — não depende mais
  // de nomeTec estar certo neste exato instante; se estiver vazio aqui, o
  // próximo checkpoint de 3 rodadas (que também passa nomeTec) corrige sozinho.
  const autoVinculadoRef = useRef(null);
  useEffect(() => {
    if (!sessao || !mundo) return;
    const chave = chaveVinculo(sessao.user.id, mundo.meuTime);
    if (!deveExecutarVinculoAutomatico(autoVinculadoRef.current, chave)) return;
    autoVinculadoRef.current = chave;
    const pontosAtuais = S && meuTime ? (S.tabela[meuTime]?.P ?? 0) : 0;
    // Conquistas: backfill DEPOIS do vínculo (publicarConquistas precisa da
    // linha de carreiras existir) — cobre quem desbloqueou offline antes
    // de logar. Best-effort encadeado, nunca trava o jogo.
    vincularCarreira(mundo, pontosAtuais, nomeTec).then(() => publicarConquistas(carregarConquistas()));
  }, [sessao, mundo]); // eslint-disable-line

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
    const nova = novaTemporada(serie, times, null, novoMundo); // carreira nova: orçamento sempre do zero
    // Copa cruzando as 3 séries: sorteio novo a cada temporada, 32 times reais.
    nova.copa = iniciarCopa(TODOS_OS_TIMES);
    Sref.current = nova;
    setMeuTime(time);
    prepararEscalacao(time, nova);
    // Marco 2 (spec-mercado.md §4): a janela "pre" abre antes da 1ª escalação.
    // As 11 IAs já agem (§5) antes do jogador ver a tela, numa única leva.
    iaNegocia(nova, time);
    // Persiste já no início: forças/atributos sorteados não podem se perder nem
    // ser re-sorteados no meio da temporada.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: time, avatarId, S: nova });
    // Ranking online (Fase 1): o efeito de vínculo automático (acima) cuida
    // de vincular + sincronizar o nome assim que `mundo` mudar — nada a
    // fazer aqui além de deixar setMundo(novoMundo) já ter sido chamado.
    setTela("mercado");
  };

  // ---------- Liga Viva (Marco 3.5, spec-liga-viva.md §3) ----------
  // Fim da temporada do jogador: as OUTRAS duas séries já vêm sendo
  // simuladas rodada a rodada, em paralelo, desde o início (S.outrasSeries —
  // tabela ao vivo, não mais um "simula tudo de uma vez no fim"). Se alguma
  // tiver calendário mais LONGO que o do jogador (ex. ele na A/18 rodadas e
  // a C ainda tem rodadas 19-22 pra jogar), completa o resto agora, instantâneo.
  const finalizarTemporadaCarreira = () => {
    const minhaSerie = S.serie;
    const tabelasPorSerie = { [minhaSerie]: S.tabela };
    ORDEM_SERIES.filter((s) => s !== minhaSerie).forEach((s) => {
      const estado = S.outrasSeries[s];
      sincronizarSerieParalela(estado, estado.calendario.length);
      tabelasPorSerie[s] = estado.tabela;
    });
    const resultado = calcularAcessoRebaixamento(tabelasPorSerie);
    // Recorde de artilheiro usa a temporada ainda corrente (fecharTemporada
    // incrementa o contador logo abaixo).
    atualizarRecordeArtilheiro(mundo, S.art, mundo.temporada, minhaSerie);
    const { serieDestino, resultado: meuResultado, minhaPosicao } =
      fecharTemporada(mundo, resultado, meuTime, minhaSerie);
    // Conquistas de fim de temporada (a carreira já inclui a temporada fechada).
    const novasConquistas = ["primeira-temporada"];
    if (minhaPosicao === 1) novasConquistas.push("campeao");
    if (meuResultado === "subiu") novasConquistas.push("acesso");
    if (mundo.carreira.filter((c) => c.posicao === 1).length >= 3) novasConquistas.push("tri");
    // "Da C ao Topo" (lendária de estreia, Fase 1c): a PRIMEIRA temporada da
    // carreira foi na Série C e agora ela é campeã da Série A com o mesmo
    // clube — mundo.meuTime nunca muda dentro de uma carreira, só a divisão.
    const primeiraTemporada = mundo.carreira[0];
    if (primeiraTemporada?.serie === "C" && minhaSerie === "A" && minhaPosicao === 1) {
      novasConquistas.push("da-c-ao-topo");
    }
    // Artilheiro: o topo de S.art (ainda a temporada corrente) é do meu time.
    const melhorArtilheiro = Object.values(S.art).sort((a, b) => b.g - a.g)[0];
    if (melhorArtilheiro && melhorArtilheiro.time === meuTime) novasConquistas.push("artilheiro-temporada");
    desbloquearComCelebracao(novasConquistas, { clube: meuTime, temporada: mundo.temporada });
    salvarMundo(mundo);
    // Ranking online (Fase 1, spec-fase1-fundacao-online.md): melhor esforço,
    // nunca bloqueia o fluxo local — sem login, é um no-op silencioso.
    // Pontos vêm de S.tabela AGORA, antes de S sumir na próxima temporada.
    publicarTemporada(mundo, S.tabela[meuTime].P, nomeTec);
    // A temporada foi processada: o save dela vira lixo perigoso — se ficasse,
    // reabrir o app oferecia "Continuar" nela e o Fim de Temporada podia rodar
    // DE NOVO (temporada dupla no mundo). Limpo já; quem fechar o app agora
    // cai em "Começar temporada" (retomarCarreiraSemSave), que é o correto.
    limparSave(minhaSerie);
    setSaveData(null);
    incrementarMetrica("temporadasConcluidas"); // mídia kit (métrica local)
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
    const nova = novaTemporada(serieDestino, times, S.orcamento, mundo);
    nova.copa = iniciarCopa(TODOS_OS_TIMES); // sorteio novo a cada temporada
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
    const nova = novaTemporada(minhaSerieAgora, times, null, mundo);
    nova.copa = iniciarCopa(TODOS_OS_TIMES); // sorteio novo a cada temporada
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
    const s = reconstruirS(saveData, mundo);
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
    if (r.ok) {
      desbloquearComCelebracao("primeira-contratacao", { clube: meuTime, temporada: mundo?.temporada });
      rerender();
    }
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
  const proporNoMercado = (idJogador, preco) => {
    const r = proporJogador(S, meuTime, idJogador, preco);
    if (r.ok) rerender();
    return r;
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

  // Aba "Jogar" do BottomNav: volta pra onde o fluxo está, sem resetar a
  // escalação customizada (diferente do irProximaRodada, que re-prepara —
  // aqui é só navegação de consulta, o fluxo de rodada continua o mesmo).
  const irJogar = () => {
    if (!S) return;
    if (S.mercado.janela !== "fechada") setTela("mercado");
    else if (S.rodada >= S.calendario.length) setTela("tabela");
    else setTela("escalacao");
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
    anunciadosChance.current = 0;
    setJogo(j); setMinuto(0); setRodando(true); setTela("aoVivo");
    apito();
  };

  const iniciarSegundoTempo = () => {
    const j = jogoRef.current;
    const escCasa = j.souCasa ? j.minhaEsc2 : j.advEsc;
    const escFora = j.souCasa ? j.advEsc : j.minhaEsc2;
    const ev2 = simMetade(S, j.casa, j.fora, escCasa, escFora, 2);
    setJogo({ ...j, ev2, meiaFase: "2T" });
    setSelOut(null); setSelIn(null);
    setRodando(true); setTela("aoVivo");
    apito();
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

    // Ranking online (Fase 1, pedido do Felyp): publica o progresso a cada 3
    // rodadas, sem esperar a temporada fechar — melhor esforço, nunca trava
    // o jogo. Não força vínculo: se o técnico nunca vinculou a carreira, é
    // um no-op silencioso (ver publicarProgresso).
    if (mundo && deveSincronizarProgresso(S.rodada)) publicarProgresso(mundo, S.tabela[meuTime].P, nomeTec);

    // Tabela ao vivo das 3 séries: avança 1 rodada de CADA série paralela
    // junto com a do jogador (noop pra quem já encerrou — calendário mais
    // curto, ex. A/B com 18 rodadas quando o jogador está na C com 22).
    if (S.outrasSeries) Object.values(S.outrasSeries).forEach(avancarRodadaSimples);

    // Copa cruzando as 3 séries: avança a fase inteira SE o jogador não tiver
    // confronto pendente nela (senão, ela espera — ele precisa jogar o dele
    // primeiro, na tela Copa, antes de todo mundo mais avançar junto).
    if (S.copa && !S.copa.campeao && !confrontoPendenteDoJogador(S.copa, meuTime)) {
      avancarFaseCopa(S.copa, S);
    }

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
    incrementarMetrica("partidasJogadas"); // mídia kit (métrica local)

    // Recordes do mundo + conquistas (dica 2) — apresentação pura, nada volta
    // pro motor. Goleada recorde olha TODOS os jogos da rodada da série.
    if (mundo) {
      atualizarRecordeGoleada(mundo, jogos, mundo.temporada, S.serie);
      salvarMundo(mundo);
    }
    const meuJogo = jogos[0];
    const souCasaMeu = meuJogo.casa === meuTime;
    const meusGols = souCasaMeu ? meuJogo.gc : meuJogo.gf;
    const golsAdv = souCasaMeu ? meuJogo.gf : meuJogo.gc;
    const conquistasDaRodada = [];
    if (meusGols > golsAdv) {
      conquistasDaRodada.push("primeira-vitoria");
      if (meusGols - golsAdv >= 5) conquistasDaRodada.push("goleada");
    }
    if (S.serie === "A") conquistasDaRodada.push("serie-a");
    desbloquearComCelebracao(conquistasDaRodada, { clube: meuTime, temporada: mundo?.temporada });

    // Semana Temática (engine/semana.js): bônus de L$ pela regra da semana
    // vigente — só premiação, o motor da simulação não muda. O adversário
    // "acima na tabela" é medido ANTES desta rodada ter sido aplicada? Não:
    // a tabela já foi atualizada acima; usamos a posição pós-rodada mesmo,
    // consistente com o que o jogador vê na tela de tabela em seguida.
    const meuAdversario = souCasaMeu ? meuJogo.fora : meuJogo.casa;
    const bonusSemana = bonusDaSemana({
      meusGols, golsAdv,
      venceu: meusGols > golsAdv,
      advAcimaNaTabela: posicaoDoTime(S, meuAdversario) < posicaoDoTime(S, meuTime),
    });
    if (bonusSemana) S.orcamento[meuTime] += bonusSemana.valor;

    // Auto-save ao fim de cada rodada (build-spec §8) — nunca depende do usuário.
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S });
    setResumo({ jogos, evMeu, craque, rodada: S.rodada, casa: j.casa, fora: j.fora, comentarioTorcida: comentario, bonusSemana, venci: meusGols > golsAdv });
    setJogo(null);
    setTela("resultado");

    // Quiz de curiosidades: chance baixa por rodada concluída, camada de
    // apresentação/economia leve — não mexe no motor. Aparece por cima da
    // tela de Resultado que acabou de abrir.
    if (sorteiaSeAparece()) {
      const p = sortearPergunta(ultimaPerguntaQuiz);
      setUltimaPerguntaQuiz(p.pergunta);
      setQuizAtual(p);
    }
    rerender();
  };

  // Resposta do quiz: crédito só se acertar (sem penalidade por errar/pular).
  // Retorna o prêmio pra o modal mostrar o valor exato.
  const responderQuiz = (correta) => {
    if (!correta) return 0;
    const premio = sortearPremio();
    S.orcamento[meuTime] += premio;
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S });
    rerender();
    return premio;
  };

  // ---------- Copa cruzando as 3 séries ----------
  // Joga o confronto pendente do jogador na fase atual, com a escalação
  // ATUAL dele (a mesma da liga — a copa não tem tela de escalação própria,
  // simplificação consciente de v1). Resolve o resto da fase em seguida
  // (avancarFaseCopa) e credita prêmio de vitória/título. Retorna o
  // resultado pra TelaCopa mostrar o placar sem precisar reler o estado.
  const jogarPartidaCopa = () => {
    const c = confrontoPendenteDoJogador(S.copa, meuTime);
    if (!c) return null;
    const souA = c.a === meuTime;
    const timeAdv = souA ? c.b : c.a;
    const minhaEsc = escSelecionada();
    const r = souA
      ? simularJogoCopa(S, meuTime, timeAdv, minhaEsc, null)
      : simularJogoCopa(S, timeAdv, meuTime, null, minhaEsc);
    c.vencedor = r.vencedor; c.placarA = r.placarA; c.placarB = r.placarB; c.penaltis = r.penaltis;

    const venceu = r.vencedor === meuTime;
    if (venceu) S.orcamento[meuTime] += PREMIO_VITORIA_COPA;
    avancarFaseCopa(S.copa, S); // resolve o resto da fase (não envolve o jogador) e avança
    const campeao = S.copa.campeao === meuTime;
    if (campeao) {
      S.orcamento[meuTime] += PREMIO_CAMPEAO_COPA;
      desbloquearComCelebracao("campeao-copa", { clube: meuTime, temporada: mundo?.temporada });
    }
    salvarJogo({ nomeTecnico: nomeTec, timeEscolhido: meuTime, avatarId, S });
    rerender();
    return {
      adversario: timeAdv,
      placarMeu: souA ? r.placarA : r.placarB,
      placarAdv: souA ? r.placarB : r.placarA,
      venceu, campeao, penaltis: r.penaltis,
    };
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
    const evsChance = [...jogo.ev1, ...(jogo.ev2 || [])]
      .filter((e) => e.tipo === "chance" && e.min <= minuto)
      .sort((a, b) => a.min - b.min);
    if (evsChance.length > anunciadosChance.current) {
      chute();
      anunciadosChance.current = evsChance.length;
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

  // BottomNav só nas telas de consulta durante uma temporada — nunca no fluxo
  // linear (capa, partida ao vivo, intervalo, resultado, fim de temporada).
  // "inicio" entra na lista (Task 05.1H): com S vivo, a capa vira a Central
  // da Carreira (Figma 05.1) e mantém o BottomNav com "Início" ativo. Sem S
  // (Entry/onboarding), mostrarNav já é falso por !!S — nada muda lá.
  const TELAS_COM_NAV = ["inicio", "escalacao", "mercado", "tabela", "artilharia", "copa", "ranking", "historiaCarreira", "historiaLiga"];
  const mostrarNav = !!S && TELAS_COM_NAV.includes(tela);

  return (
    <div
      className="min-h-screen"
      style={{ background: cores.bgBase, color: cores.textPrimary, fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* key={tela} re-monta o wrapper a cada troca de tela → re-dispara a
          animação de entrada (micro-interação, index.css). pb extra quando o
          BottomNav está visível, pra nada ficar escondido atrás da barra. */}
      <div key={tela} className={`max-w-md mx-auto px-4 tela-entra${mostrarNav ? " pb-16" : ""}`}>
        {tela === "inicio" && (
          <TelaInicial
            serie={serie}
            setSerie={setSerie}
            nomeTec={nomeTec}
            setNomeTec={setNomeTec}
            promptInstalar={promptInstalar}
            instalarApp={instalarApp}
            iniciarTemporada={iniciarTemporada}
            saveData={saveData}
            continuarJogo={continuarJogo}
            avisoSemSave={avisoSemSave}
            mundo={mundo}
            novoJogo={novoJogo}
            retomarCarreiraSemSave={retomarCarreiraSemSave}
            setTela={setTela}
            sessao={sessao}
            S={S}
            escolhidos={escolhidos}
          />
        )}
        {tela === "ranking" && <Ranking setTela={setTela} sessao={sessao} />}
        {tela === "historiaCarreira" && mundo && <HistoriaCarreira mundo={mundo} setTela={setTela} />}
        {/* Task 05.1H.1: "Ver história da liga" volta a ser alcançável a
            partir da Entry sem carreira (mundo=null) — HistoriaLiga.jsx
            trata mundo ausente com um estado vazio honesto, sem fabricar
            hall de campeões nem recordes. */}
        {tela === "historiaLiga" && <HistoriaLiga mundo={mundo} setTela={setTela} />}
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
            setTela={setTela}
            modalNomes={modalNomes}
            setModalNomes={setModalNomes}
            textoNomes={textoNomes}
            setTextoNomes={setTextoNomes}
            salvarNomes={salvarNomes}
          />
        )}
        {tela === "copa" && S && S.copa && (
          <TelaCopa S={S} meuTime={meuTime} jogarPartidaCopa={jogarPartidaCopa} setTela={setTela} />
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
        {tela === "resultado" && S && resumo && <Resultado resumo={resumo} serie={S.serie} setTela={setTela} sessao={sessao} />}
        {tela === "mercado" && S && (
          <Mercado
            S={S}
            meuTime={meuTime}
            comprarNoMercado={comprarNoMercado}
            listarNoMercado={listarNoMercado}
            cancelarListagem={cancelarListagem}
            aceitarOfertaHumano={aceitarOfertaHumano}
            recusarOfertaHumano={recusarOfertaHumano}
            proporNoMercado={proporNoMercado}
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
            temporada={mundo ? mundo.temporada - 1 : 1}
            proximaTemporadaCarreira={proximaTemporadaCarreira}
          />
        )}
      </div>
      {mostrarNav && (
        <BottomNav
          tela={tela}
          setTela={setTela}
          irJogar={irJogar}
          temCopa={!!(S && S.copa)}
          meuTime={meuTime}
        />
      )}
      {quizAtual && (
        <QuizModal
          quiz={quizAtual}
          onResponder={responderQuiz}
          onFechar={() => setQuizAtual(null)}
        />
      )}
      {/* Celebração de insígnia (Fase 1c): fica por cima de qualquer tela,
          uma por vez — fechar avança a fila sem mexer na navegação de baixo. */}
      {celebracoesPendentes.length > 0 && (
        <ConquistaCelebracao
          conquistaId={celebracoesPendentes[0]}
          onFechar={() => setCelebracoesPendentes((fila) => fila.slice(1))}
        />
      )}
    </div>
  );
}
