import { useState, useEffect, useRef } from "react";

// =====================================================================
// LEGENDS MANAGER — demo jogável (Marco 1, single-player)
// Elencos REAIS da Série C — Legends Liga Fut7 (fonte: Copa10, rodada 1)
// Força dos times é 100% interna: sem estrelas, sem re-sortear.
// Sem save nesta demo (localStorage não roda em artifact; entra no build real).
// =====================================================================

const ARENA = "Arena Novo Horizonte — Limeira, SP";

// [nome, pos, g, a, mvp] — g/a/mvp = rodada 1 real (viés de atributo)
const RAW = {
  "Real União": [
    ["Dieniton da Silva Constâncio","GOL",0,1,0],["Bruno dos Santos Trindade","DEF"],
    ["Flávio da Silva Junior","DEF"],["Alison Henrique Araújo Ferreira","DEF"],
    ["Gustavo Oliveira","DEF",1,0,0],["Victor de Oliveira","MEI"],["Gabriel Oliveira","MEI"],
    ["Breno Henry Alves Manoel","MEI",0,2,0],["Lucas Henrique Verdeiro","MEI"],
    ["Victor Henrique Medina Pascoalino","MEI"],["Maikon Henrique da Silva Santos","MEI",1,0,0],
    ["Samuel Henrique Souza de Oliveira","MEI"],["Gabriel Felipe Ferreira","MEI",2,0,1],
    ["Jefferson Allan Penteado","ATA"],["Leonardo Vinicius Dias","ATA",0,1,0],
    ["Victor Hugo da Costa Martins","ATA"],["Luiz Carlos Rocha Campelo da Silva","ATA"],
  ],
  "Real Elite": [
    ["Gleyson","GOL"],["Renan","GOL"],["Luis","GOL"],["Marcio","DEF"],["Thierry","DEF",0,1,0],
    ["Leandro","DEF"],["Cleiton","DEF",2,1,0],["Mateus","DEF"],["José","MEI"],
    ["Kaique","MEI",1,0,0],["Heliabe","MEI"],["Willyan","MEI"],["Breno","MEI"],["Felipe","MEI"],
    ["Thiago","ATA"],["Clenilson","ATA"],["Paulo Henrique","ATA"],
  ],
  "Sereno FC": [
    ["Lucas Oliveira da Silva","GOL"],["Jean Marcel Ferreira da Silva","DEF"],
    ["Guilherme Henrique Caferro Carneiro","DEF"],["Júlio César da Silva Santos","DEF"],
    ["Antônio Carlos da Silva Junior","DEF"],["Higor Guedes Maia","MEI"],
    ["Henrique Roberto Batista","MEI",1,0,0],["Marcelo Alencar","MEI"],
    ["Claudiney do Nascimento Souza","MEI"],["Wildney Maia Ribeiro","MEI"],
    ["Ramon Rodrigo da Silva","MEI",0,1,0],["Leandro da Mota Alves","MEI",2,0,0],
    ["Cleiton Santos Gonçalves","ATA"],["Leandro de Freitas Cabral","ATA"],
  ],
  "Sem Limites": [
    ["Francisco Marcelo de Souza","GOL"],["Odair José Ivo","GOL"],
    ["Samuel Lucena de Farias","DEF",2,1,1],["Wellington Pereira Pinto","DEF"],
    ["Caio Fernando de Oliveira","DEF",0,1,0],["João Carlos Trindade","DEF"],
    ["Alysson Oliveira de Lima","MEI",1,1,0],["Nathaniel Santos da Silva","MEI",1,0,0],
    ["Matheus Rocha Zacarias","MEI",1,0,0],["Derick Gustavo Souza","MEI"],
    ["Allysson Souza de Almeida","ATA"],["Sergio Pinheiro Leite","ATA",1,1,0],
    ["João Carlos Aparecido dos Santos Silva","ATA"],["Rafael Alex Fernandes dos Anjos","ATA"],
    ["André Monteiro dos Santos","ATA",1,0,0],["Leonardo Henrique Bonfogo","ATA",1,0,0],
  ],
  "Canelas": [
    ["Maze","GOL"],["Luiz Henrique","GOL"],["Marcos Henrique","DEF"],["Silas Junior","DEF"],
    ["Murilo Henrique","DEF"],["Allan Junior","DEF"],["Antônio Wirlan Souza dos Santos","DEF"],
    ["Francisco Thiago","MEI"],["Allison Alves","MEI",0,3,0],["Matheus Leandro","MEI"],
    ["Pedro Lopes","MEI"],["Gustavo Oliveira","MEI"],["Richard Santos","MEI"],
    ["Jhonatan Gonçalves","ATA"],["Guilherme Ricardo","ATA"],["Cauã Rodrigues","ATA",2,0,0],
    ["Vital Faustino","ATA",1,0,0],["Felipe Silva Damico","ATA"],
  ],
  "Marselha FC": [
    ["Leonardo Santi de Araujo","GOL"],["Mateus de Almeida Costa","DEF"],
    ["Victor Manuel Alves do Nascimento","DEF",1,0,0],["Luiz Fernando de Souza","MEI",1,1,0],
    ["Maxwell Gomes Maia","MEI"],["Henrique Santana Santos","MEI",1,0,0],
    ["Caio Felipe Guerra","MEI",1,0,0],["Murilo Oliveira","MEI"],
    ["José Natanael Soares Pereira","ATA",0,2,0],["Iago Roberto Lopes dos Santos","ATA"],
    ["Ricardo Alexandre Theodoro Correia","ATA"],
  ],
  "Nordeste FC": [
    ["Valdecir Gomes de Oliveira","GOL"],["Izael Carlos da Silva","DEF"],
    ["José Charles Batista","DEF"],["Harry","DEF"],["Matheus Bortolan Leal","DEF"],
    ["Vinicius Gabriel dos Santos","MEI",0,1,0],["Hugo Deleon da Silva Gonçalves","MEI",1,3,0],
    ["Luciano","MEI"],["Ery Almeida dos Santos","MEI"],["Matheus Felipe da Silva Ribeiro","MEI"],
    ["Ryan Oliveira da Conceição","ATA"],["Cauan Arcanjo de Santana","ATA"],
    ["Lincoln Nascimento Campos de Lima","ATA",3,1,1],["Patrick da Silva Mendes","ATA",1,0,0],
    ["Ariberto Willami da Silva Almeida","ATA"],["Raí Marques da Cruz","ATA"],
  ],
  "Racha FC": [
    ["Diego","GOL"],["Estevão","GOL",0,1,0],["Roberto Alexandre","DEF"],
    ["Gabriel Oliveira","DEF",0,1,0],["Deyvison","DEF"],["Matheus Rosa","DEF"],
    ["Willian Cavalcante","DEF"],["Rhuan","MEI"],["Wesley","MEI",0,2,0],["Jhonata","MEI"],
    ["Matheus Henrique","MEI"],["Matheus","MEI"],["Samuel","MEI",1,0,1],
    ["Paulo Henrique","MEI",1,0,0],["Thierry","MEI",2,0,0],["Ithalo","MEI"],
    ["Walter Lemes","ATA",2,2,0],["Ryan Costa","ATA"],
  ],
  "Puro Osso": [
    ["José Felipe","GOL"],["João Guilherme","GOL"],["Kauan Rocha","DEF"],
    ["Kauan Capivara","DEF",0,1,0],["Evandro","DEF"],["Henrique","MEI"],
    ["Victor Henrique Santos","MEI"],["Gustavo Ribeiro","MEI"],["Higor","MEI"],
    ["Victor Gabriel","MEI"],["Erike","MEI"],["Cauã Henrique","ATA",0,1,0],
    ["Vitor Cunha","ATA"],["Walace Gustavo","ATA"],["Matheus Henrique","ATA"],
    ["Matheus Pietro","ATA",1,0,0],["Luis Felipe","ATA"],["Igor","ATA",1,0,0],
  ],
  "Kissassa": [
    ["Eduardo Henrique Silvério Brito","GOL"],["Ademir Gonçalves Dias Filho","GOL"],
    ["Wellington Silva","DEF"],["Jhonatan","DEF"],["Ricardo de Arruda","DEF"],
    ["Sergio Santiago","DEF",0,1,0],["Jonathan Gomes","DEF"],["Bruno","MEI"],
    ["Danyllo Campos","MEI",1,0,0],["José Ricardo Santos","MEI"],["Miguel","MEI"],
    ["Natan","MEI"],["Matheus","MEI"],["Luan Danilo Finati","ATA",1,0,0],
    ["Leo Vitor","ATA"],["Yuri Santos","ATA"],["Richard Bernardo","ATA"],
  ],
  "Fortaleza": [
    ["Riquelme Costa Sena","GOL",0,0,1],["Henrique Rodrigues","DEF"],
    ["Etory Enrique Furlan","DEF"],["Luan dos Santos","DEF"],["Bruno Henrique dos Santos","DEF"],
    ["Gabriel Henrique Sampaio","DEF"],["Victor Gabriel Ribeiro de Jesus","MEI",0,2,0],
    ["Vinicius dos Santos Pereira","MEI"],["Diego Faria","MEI"],
    ["Márcio Guilherme Campos Barbosa","MEI"],["Arnaldinho Almeida Melo","MEI"],
    ["Yago dos Santos Cardoso","MEI"],["Jonathan da Silva","ATA",1,1,0],
    ["Leandro Oliveira de Liz","ATA",3,2,0],["Diego Henrique","ATA",1,0,0],
    ["Adriano Andrade de Jesus","ATA"],
  ],
  "Dragon Bola FC": [
    ["Victor Hugo Kray de Oliveira","GOL"],["José Edson de Jesus Santana","DEF"],
    ["Rodrigo de Souza","DEF"],["Ramieri Porsolino","DEF"],["Emerson Domingos Paulo","DEF"],
    ["Fernando Grego","DEF"],["Vitor Moisés de Aguiar Rezende","MEI"],["Yuri Antônio Souza","MEI"],
    ["Maycon de Souza Oliveira","MEI"],["José Rodolfo Luciano da Silva","MEI"],
    ["Leandro César Lúcio","MEI",2,1,0],["Vítor Gabriel de Castro","MEI"],
    ["Vitor Fernando Alves","MEI"],["Gabriel dos Santos Chagas","MEI",1,0,0],
    ["Caio Felipe Alves da Silva","ATA"],["Rogério da Silva Moura","ATA"],
    ["Kevin Fermino dos Santos","ATA"],["Vitor Hugo Moreira de Lima","ATA"],
  ],
};

const TIMES = Object.keys(RAW);
const SIGLA = {
  "Real União":"RUN","Real Elite":"RLE","Sereno FC":"SER","Sem Limites":"SLM",
  "Canelas":"CAN","Marselha FC":"MAR","Nordeste FC":"NOR","Racha FC":"RAC",
  "Puro Osso":"PUR","Kissassa":"KIS","Fortaleza":"FOR","Dragon Bola FC":"DRA",
};
const COR = {
  "Real União":"bg-blue-600","Real Elite":"bg-violet-600","Sereno FC":"bg-sky-600",
  "Sem Limites":"bg-red-600","Canelas":"bg-orange-600","Marselha FC":"bg-cyan-600",
  "Nordeste FC":"bg-rose-600","Racha FC":"bg-emerald-600","Puro Osso":"bg-slate-500",
  "Kissassa":"bg-fuchsia-600","Fortaleza":"bg-indigo-600","Dragon Bola FC":"bg-amber-600",
};

// ---------------- utilidades ----------------
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const poisson = (l) => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };
const media = (e) => e.reduce((s, j) => s + j.attr, 0) / e.length;

const DESC = ["chute colocado no canto","bomba de fora da área","de primeira, no ângulo",
  "aproveitou o rebote","na saída do goleiro","de cabeça, após cruzamento",
  "driblou o marcador e bateu cruzado","cavadinha na medida","toque por baixo do goleiro"];
const CHANCE = ["arriscou de longe — raspou a trave!","cara a cara, parou no goleiro!",
  "carimbou a trave!","cortado quase em cima da linha!","finalizou por cima do gol!"];

function pesoEscolha(lista, pesos) {
  const tot = lista.reduce((s, j) => s + j.attr * (pesos[j.pos] || 1), 0);
  let r = Math.random() * tot;
  for (const j of lista) { r -= j.attr * (pesos[j.pos] || 1); if (r <= 0) return j; }
  return lista[lista.length - 1];
}

function gerarCalendario(ts) {
  let l = [...ts]; const ida = []; const n = l.length;
  for (let r = 0; r < n - 1; r++) {
    const jogos = [];
    for (let i = 0; i < n / 2; i++) {
      const a = l[i], b = l[n - 1 - i];
      jogos.push((r + i) % 2 === 0 ? { casa: a, fora: b } : { casa: b, fora: a });
    }
    ida.push(jogos);
    l = [l[0], l[n - 1], ...l.slice(1, n - 1)];
  }
  return [...ida, ...ida.map(rod => rod.map(x => ({ casa: x.fora, fora: x.casa })))];
}

function novaTemporada() {
  const elencos = {};
  TIMES.forEach(t => {
    elencos[t] = RAW[t].map((r, i) => {
      const [nome, pos, g = 0, a = 0, m = 0] = r;
      const vies = Math.min(15, 3 * g + 2 * a + 4 * m);
      const attr = Math.round(clamp(52 + Math.random() * 16 + vies + (Math.random() * 10 - 5), 45, 90));
      return { id: `${t}|${i}`, nome, pos, attr, time: t };
    });
  });
  const pool = [1.22,1.22,1.08,1.08,1.08,0.95,0.95,0.95,0.95,0.82,0.82,0.82].sort(() => Math.random() - 0.5);
  const mult = {}, fase = {}, tabela = {};
  TIMES.forEach((t, i) => { mult[t] = pool[i]; fase[t] = 1; tabela[t] = { P:0,J:0,V:0,E:0,D:0,GP:0,GC:0 }; });
  return { elencos, mult, fase, tabela, art: {}, calendario: gerarCalendario(TIMES), rodada: 0 };
}

const melhores = (elenco) => {
  const gks = elenco.filter(j => j.pos === "GOL").sort((a, b) => b.attr - a.attr);
  const linha = elenco.filter(j => j.pos !== "GOL").sort((a, b) => b.attr - a.attr);
  return [gks[0], ...linha.slice(0, 6)];
};

const escalacaoIA = (elenco) => {
  const gks = elenco.filter(j => j.pos === "GOL").sort((a, b) => b.attr - a.attr);
  let gol = gks[0];
  if (gks.length > 1 && Math.random() < 0.2) gol = gks[1];
  const linha = elenco.filter(j => j.pos !== "GOL").sort((a, b) => b.attr - a.attr);
  const tit = linha.slice(0, 6), banco = linha.slice(6);
  const trocas = Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0;
  for (let i = 0; i < trocas && banco.length; i++) {
    const ti = ri(0, tit.length - 1), bi = ri(0, banco.length - 1);
    const tmp = tit[ti]; tit[ti] = banco[bi]; banco[bi] = tmp;
  }
  return [gol, ...tit];
};

function simMetade(S, casa, fora, escCasa, escFora, metade) {
  const ini = metade === 1 ? 1 : 26, fim = metade === 1 ? 25 : 50;
  const ev = [];
  const lam = (t, esc, mando) => 1.7 * S.mult[t] * S.fase[t] * (media(esc) / 64) * (mando ? 1.05 : 1);
  [{ t: casa, esc: escCasa, mando: true }, { t: fora, esc: escFora, mando: false }].forEach(l => {
    const g = poisson(lam(l.t, l.esc, l.mando));
    for (let i = 0; i < g; i++) {
      const autor = pesoEscolha(l.esc, { ATA: 3, MEI: 1.6, DEF: 0.5, GOL: 0.05 });
      let assist = null;
      if (Math.random() < 0.65) {
        const cands = l.esc.filter(j => j.id !== autor.id);
        assist = pesoEscolha(cands, { MEI: 2.5, ATA: 1.5, DEF: 1, GOL: 0.3 });
      }
      ev.push({ min: ri(ini, fim), tipo: "gol", time: l.t, autor, assist, desc: DESC[ri(0, DESC.length - 1)] });
    }
    for (let i = 0, n = ri(1, 2); i < n; i++) {
      const q = pesoEscolha(l.esc.filter(j => j.pos !== "GOL"), { ATA: 2.5, MEI: 1.5, DEF: 0.6 });
      ev.push({ min: ri(ini, fim), tipo: "chance", time: l.t, autor: q, desc: CHANCE[ri(0, CHANCE.length - 1)] });
    }
  });
  return ev.sort((a, b) => a.min - b.min || (a.tipo === "gol" ? -1 : 1));
}

const golsDe = (evs, time, ateMin = 99) =>
  evs.filter(e => e.tipo === "gol" && e.time === time && e.min <= ateMin).length;

// ---------------- componente ----------------
export default function LegendsManager() {
  const Sref = useRef(null);
  const [, force] = useState(0);
  const rerender = () => force(x => x + 1);

  const [tela, setTela] = useState("inicio");
  const [nomeTec, setNomeTec] = useState("");
  const [meuTime, setMeuTime] = useState(null);
  const [escolhidos, setEscolhidos] = useState([]);   // escalação do jogador (7)
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

  // ---------- fluxo de temporada ----------
  const iniciarTemporada = (time) => {
    Sref.current = novaTemporada();
    setMeuTime(time);
    prepararEscalacao(time, Sref.current);
    setTela("escalacao");
  };

  const prepararEscalacao = (time, S2) => {
    setEscolhidos(melhores(S2.elencos[time]).map(j => j.id));
  };

  const confronto = () => {
    const rod = S.calendario[S.rodada];
    return rod.find(j => j.casa === meuTime || j.fora === meuTime);
  };
  const outrosConfrontos = () => S.calendario[S.rodada].filter(j => j.casa !== meuTime && j.fora !== meuTime);

  const escSelecionada = () => S.elencos[meuTime].filter(j => escolhidos.includes(j.id));
  const escValida = () => {
    const e = escSelecionada();
    return e.length === 7 && e.filter(j => j.pos === "GOL").length === 1;
  };

  const toggleJogador = (j) => {
    if (escolhidos.includes(j.id)) { setEscolhidos(escolhidos.filter(id => id !== j.id)); return; }
    const e = escSelecionada();
    if (j.pos === "GOL") {
      const semGks = escolhidos.filter(id => !(S.elencos[meuTime].find(x => x.id === id).pos === "GOL"));
      setEscolhidos([...semGks, j.id]);
    } else if (e.filter(x => x.pos !== "GOL").length < 6) {
      setEscolhidos([...escolhidos, j.id]);
    }
  };

  const montarJogo = () => {
    const c = confronto();
    const souCasa = c.casa === meuTime;
    const adv = souCasa ? c.fora : c.casa;
    const minhaEsc = escSelecionada();
    const advEsc = escalacaoIA(S.elencos[adv]);
    const escCasa = souCasa ? minhaEsc : advEsc;
    const escFora = souCasa ? advEsc : minhaEsc;
    const outros = outrosConfrontos().map(j => {
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
      ...j.outros.map(o => ({ casa: o.casa, fora: o.fora, ev: o.ev })),
    ].map(x => ({ ...x, gc: golsDe(x.ev, x.casa), gf: golsDe(x.ev, x.fora) }));

    jogos.forEach(x => {
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
      x.ev.filter(e => e.tipo === "gol").forEach(e => {
        S.art[e.autor.id] = S.art[e.autor.id] || { nome: e.autor.nome, time: e.autor.time, g: 0 };
        S.art[e.autor.id].g++;
      });
    });

    // Craque da Partida (só do jogo do jogador)
    const pts = {};
    evMeu.filter(e => e.tipo === "gol").forEach(e => {
      pts[e.autor.id] = (pts[e.autor.id] || 0) + 3;
      if (e.assist) pts[e.assist.id] = (pts[e.assist.id] || 0) + 1.5;
    });
    const participantes = [...new Map(
      [...j.minhaEsc1, ...j.minhaEsc2, ...j.advEsc].map(p => [p.id, p])
    ).values()];
    let craque;
    const meu = jogos[0];
    if (meu.gc + meu.gf === 0) {
      craque = participantes.filter(p => p.pos === "GOL").sort((a, b) => b.attr - a.attr)[0];
    } else {
      craque = participantes.reduce((best, p) => {
        const v = pts[p.id] || 0, bv = best ? (pts[best.id] || 0) : -1;
        return v > bv || (v === bv && best && p.attr > best.attr) ? p : best;
      }, null);
    }

    S.rodada++;
    setResumo({ jogos, evMeu, craque, rodada: S.rodada, casa: j.casa, fora: j.fora });
    setJogo(null);
    setTela("resultado");
    rerender();
  };

  // ---------- relógio da partida ----------
  useEffect(() => {
    if (tela !== "aoVivo" || !rodando) return;
    const id = setInterval(() => setMinuto(m => m + 1), 170);
    return () => clearInterval(id);
  }, [tela, rodando]);

  useEffect(() => {
    if (tela !== "aoVivo" || !jogo) return;
    const evs = [...jogo.ev1, ...(jogo.ev2 || [])]
      .filter(e => e.tipo === "gol" && e.min <= minuto)
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

  // ---------- estilos base ----------
  const card = { background: "#13251A", border: "1px solid rgba(88,124,99,0.35)" };
  const amber = { background: "#FFC53D", color: "#1A1607" };
  const Eyebrow = ({ children }) => (
    <div className="uppercase tracking-widest text-xs font-semibold" style={{ color: "#93AF9B" }}>{children}</div>
  );
  const Rodape = () => (
    <div className="text-center text-xs mt-8 pb-6" style={{ color: "#5E7767" }}>
      Simulação — BETA · Legends Manager
    </div>
  );
  const Avatar = ({ t, sm }) => (
    <span className={`${COR[t]} ${sm ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"} rounded-full inline-flex items-center justify-center font-black italic shrink-0 text-white`}>
      {SIGLA[t]}
    </span>
  );
  const Barra = ({ v }) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-12 h-1.5 rounded-full overflow-hidden inline-block" style={{ background: "#24402F" }}>
        <span className="h-full block rounded-full" style={{ width: `${v}%`, background: v >= 75 ? "#FFC53D" : "#6FA57F" }} />
      </span>
      <span className="tabular-nums text-xs" style={{ color: v >= 75 ? "#FFC53D" : "#93AF9B" }}>{v}</span>
    </span>
  );

  // ---------- telas ----------
  const TelaInicio = () => (
    <div className="pt-10">
      <Eyebrow>Legends Liga Fut7 · Série C · 2026</Eyebrow>
      <h1 className="text-4xl font-black italic tracking-tight mt-1">LEGENDS<span style={{ color: "#FFC53D" }}>MANAGER</span></h1>
      <p className="mt-2 text-sm" style={{ color: "#93AF9B" }}>
        Escolha seu time, monte a escalação e dispute as 22 rodadas com os elencos reais da Série C.
      </p>
      <div className="rounded-xl p-3 mt-4 text-xs" style={{ ...card, color: "#C8D8CC" }}>
        Elencos reais (Copa10 · pós-rodada 1). Achou nome errado? Corrige em ✏️ na tela de escalação.
      </div>
      <div className="mt-5">
        <Eyebrow>Nome do técnico</Eyebrow>
        <input
          value={nomeTec}
          onChange={e => setNomeTec(e.target.value)}
          placeholder="Seu nome (sai no pôster de campeão)"
          className="w-full mt-1 rounded-xl px-4 py-3 outline-none"
          style={{ ...card, color: "#ECF4EB" }}
        />
      </div>
      <div className="mt-5">
        <Eyebrow>Escolha seu time</Eyebrow>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TIMES.map(t => (
            <button key={t} onClick={() => iniciarTemporada(t)}
              className="rounded-xl px-3 py-3 flex items-center gap-2 text-left active:opacity-70"
              style={card}>
              <Avatar t={t} sm />
              <span className="text-sm font-semibold leading-tight">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <Rodape />
    </div>
  );

  const TelaEscalacao = () => {
    const c = confronto();
    const souCasa = c.casa === meuTime;
    const adv = souCasa ? c.fora : c.casa;
    const elenco = S.elencos[meuTime];
    const grupos = ["GOL", "DEF", "MEI", "ATA"];
    const nLinha = escSelecionada().filter(j => j.pos !== "GOL").length;
    const nGol = escSelecionada().filter(j => j.pos === "GOL").length;
    return (
      <div className="pt-6">
        <Eyebrow>Rodada {S.rodada + 1} de 22</Eyebrow>
        <div className="flex items-center gap-2 mt-2">
          <Avatar t={meuTime} />
          <div className="flex-1">
            <div className="font-black italic">{meuTime}</div>
            <div className="text-xs" style={{ color: "#93AF9B" }}>
              vs {adv} · {souCasa ? "mandante" : "visitante"}
            </div>
          </div>
          <button onClick={() => { setTextoNomes(elenco.map(j => j.nome).join("\n")); setModalNomes(true); }}
            className="rounded-lg px-3 py-2 text-xs font-semibold" style={card}>✏️ nomes</button>
        </div>

        <div className="rounded-xl px-3 py-2 mt-3 text-xs flex justify-between" style={card}>
          <span>Escalados: <b className="tabular-nums">{nGol}</b> GOL + <b className="tabular-nums">{nLinha}</b>/6 linha</span>
          <span style={{ color: escValida() ? "#8FD9A0" : "#FFC53D" }}>{escValida() ? "pronto" : "ajuste a escalação"}</span>
        </div>

        {grupos.map(gp => (
          <div key={gp} className="mt-4">
            <Eyebrow>{gp}</Eyebrow>
            <div className="mt-1 space-y-1">
              {elenco.filter(j => j.pos === gp).sort((a, b) => b.attr - a.attr).map(j => {
                const sel = escolhidos.includes(j.id);
                return (
                  <button key={j.id} onClick={() => toggleJogador(j)}
                    className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2 text-left active:opacity-70"
                    style={{ ...card, ...(sel ? { border: "1px solid #FFC53D", background: "#1B2F20" } : {}) }}>
                    <span className="text-xs w-4 text-center">{sel ? "●" : "○"}</span>
                    <span className="flex-1 text-sm leading-tight">{j.nome}</span>
                    <Barra v={j.attr} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="fixed bottom-0 inset-x-0 z-40" style={{ background: "linear-gradient(transparent, #0B1712 30%)" }}>
          <div className="max-w-md mx-auto px-4 pb-5 pt-6 flex gap-2">
            <button disabled={!escValida()} onClick={jogarAoVivo}
              className="flex-1 rounded-xl py-3.5 font-bold disabled:opacity-40" style={amber}>
              ▶ Jogar ao vivo
            </button>
            <button disabled={!escValida()} onClick={rodadaRapida}
              className="rounded-xl px-4 py-3.5 font-bold disabled:opacity-40" style={card}>
              ⏩ Rápida
            </button>
          </div>
        </div>
        <div className="h-24" />
      </div>
    );
  };

  const TelaAoVivo = () => {
    const j = jogo;
    if (!j) return null;
    const evs = [...j.ev1, ...(j.ev2 || [])];
    const gc = golsDe(evs, j.casa, minuto), gf = golsDe(evs, j.fora, minuto);
    const visiveis = evs.filter(e => e.min <= minuto).sort((a, b) => b.min - a.min);
    return (
      <div className="pt-6">
        {banner && (
          <div className="fixed top-0 inset-x-0 z-50">
            <div className="max-w-md mx-auto m-2 rounded-xl px-4 py-3 font-black italic text-sm shadow-lg" style={amber}>
              {banner}
            </div>
          </div>
        )}
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center justify-between">
            <Eyebrow>Rodada {S.rodada + 1}</Eyebrow>
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#FF5A5A" }}>
              <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: "#FF5A5A" }} />AO VIVO
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-col items-center gap-1 w-20">
              <Avatar t={j.casa} /><span className="text-xs font-bold">{SIGLA[j.casa]}</span>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black italic tabular-nums tracking-tight">{gc}<span style={{ color: "#93AF9B" }}> : </span>{gf}</div>
              <div className="text-sm font-bold tabular-nums mt-1" style={{ color: "#FFC53D" }}>{Math.min(minuto, 50)}&#39;</div>
            </div>
            <div className="flex flex-col items-center gap-1 w-20">
              <Avatar t={j.fora} /><span className="text-xs font-bold">{SIGLA[j.fora]}</span>
            </div>
          </div>
          <div className="text-center text-xs mt-3" style={{ color: "#5E7767" }}>{ARENA}</div>
        </div>

        <div className="flex justify-end mt-2">
          <button onClick={() => setMudo(!mudo)} className="text-xs rounded-lg px-3 py-1.5" style={card}>
            {mudo ? "🔇 mudo" : "🔊 som"}
          </button>
        </div>

        <div className="mt-2 space-y-1.5">
          {visiveis.map((e, i) => (
            <div key={i} className="rounded-xl px-3 py-2 text-sm flex gap-2" style={card}>
              <span className="tabular-nums text-xs w-8 shrink-0 pt-0.5" style={{ color: "#93AF9B" }}>{e.min}&#39;</span>
              {e.tipo === "gol" ? (
                <span><b style={{ color: "#FFC53D" }}>GOL do {SIGLA[e.time]}!</b> {e.autor.nome}, {e.desc}{e.assist ? <span style={{ color: "#93AF9B" }}> (assist. {e.assist.nome})</span> : ""}</span>
              ) : (
                <span style={{ color: "#C8D8CC" }}>{e.autor.nome} {e.desc}</span>
              )}
            </div>
          ))}
          {visiveis.length === 0 && <div className="text-center text-sm py-4" style={{ color: "#5E7767" }}>Bola rolando na Arena…</div>}
        </div>

        <div className="mt-4">
          <Eyebrow>Outros jogos da rodada</Eyebrow>
          <div className="mt-1 space-y-1">
            {j.outros.map((o, i) => (
              <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
                <span className="font-semibold">{SIGLA[o.casa]}</span>
                <span className="font-black italic tabular-nums">{golsDe(o.ev, o.casa, minuto)} : {golsDe(o.ev, o.fora, minuto)}</span>
                <span className="font-semibold">{SIGLA[o.fora]}</span>
              </div>
            ))}
          </div>
        </div>
        <Rodape />
      </div>
    );
  };

  const TelaIntervalo = () => {
    const j = jogo;
    const emCampo = j.minhaEsc2;
    const banco = S.elencos[meuTime].filter(p => !emCampo.some(e => e.id === p.id));
    const umGoleiro = S.elencos[meuTime].filter(p => p.pos === "GOL").length === 1;
    const podeTrocar = selOut && selIn && j.subs < 3 &&
      ((selOut.pos === "GOL") === (selIn.pos === "GOL"));
    const trocar = () => {
      const novaEsc = emCampo.map(p => p.id === selOut.id ? selIn : p);
      setJogo({ ...j, minhaEsc2: novaEsc, subs: j.subs + 1 });
      setSelOut(null); setSelIn(null);
    };
    const gc = golsDe(j.ev1, j.casa), gf = golsDe(j.ev1, j.fora);
    return (
      <div className="pt-6">
        <Eyebrow>Intervalo · Rodada {S.rodada + 1}</Eyebrow>
        <div className="rounded-2xl p-4 mt-2 text-center" style={card}>
          <div className="text-3xl font-black italic tabular-nums">{SIGLA[j.casa]} {gc} : {gf} {SIGLA[j.fora]}</div>
          <div className="text-xs mt-1" style={{ color: "#93AF9B" }}>Substituições: {j.subs}/3 · goleiro só por goleiro</div>
          {umGoleiro && <div className="text-xs mt-1" style={{ color: "#FFC53D" }}>Seu time tem 1 goleiro — troca de goleiro indisponível.</div>}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <Eyebrow>Sai</Eyebrow>
            <div className="mt-1 space-y-1">
              {emCampo.map(p => (
                <button key={p.id} onClick={() => setSelOut(selOut?.id === p.id ? null : p)}
                  className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                  style={{ ...card, ...(selOut?.id === p.id ? { border: "1px solid #FF5A5A" } : {}) }}>
                  <span style={{ color: "#93AF9B" }}>{p.pos}</span> {p.nome}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Entra</Eyebrow>
            <div className="mt-1 space-y-1">
              {banco.map(p => (
                <button key={p.id} onClick={() => setSelIn(selIn?.id === p.id ? null : p)}
                  className="w-full rounded-lg px-2 py-2 text-left text-xs leading-tight active:opacity-70"
                  style={{ ...card, ...(selIn?.id === p.id ? { border: "1px solid #8FD9A0" } : {}) }}>
                  <span style={{ color: "#93AF9B" }}>{p.pos} {p.attr}</span> {p.nome}
                </button>
              ))}
              {banco.length === 0 && <div className="text-xs" style={{ color: "#5E7767" }}>Sem banco disponível.</div>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button disabled={!podeTrocar} onClick={trocar}
            className="rounded-xl px-4 py-3 font-bold text-sm disabled:opacity-40" style={card}>
            🔁 Substituir
          </button>
          <button onClick={iniciarSegundoTempo} className="flex-1 rounded-xl py-3 font-bold" style={amber}>
            Começar 2º tempo
          </button>
        </div>
        <Rodape />
      </div>
    );
  };

  const TelaResultado = () => {
    const r = resumo;
    const meu = r.jogos[0];
    const gols = r.evMeu.filter(e => e.tipo === "gol").sort((a, b) => a.min - b.min);
    return (
      <div className="pt-6">
        <Eyebrow>Fim de jogo · Rodada {r.rodada}</Eyebrow>
        <div className="rounded-2xl p-4 mt-2 text-center" style={card}>
          <div className="flex items-center justify-center gap-3">
            <Avatar t={meu.casa} />
            <span className="text-4xl font-black italic tabular-nums">{meu.gc} : {meu.gf}</span>
            <Avatar t={meu.fora} />
          </div>
          <div className="text-sm font-semibold mt-2">{meu.casa} x {meu.fora}</div>
          <div className="text-xs mt-1" style={{ color: "#5E7767" }}>{ARENA}</div>
        </div>

        {r.craque && (
          <div className="rounded-xl px-4 py-3 mt-2 flex items-center gap-3" style={{ ...card, border: "1px solid #FFC53D" }}>
            <span className="text-2xl">⭐</span>
            <div>
              <Eyebrow>Craque da partida</Eyebrow>
              <div className="font-bold">{r.craque.nome} <span className="text-xs font-normal" style={{ color: "#93AF9B" }}>({r.craque.time})</span></div>
            </div>
          </div>
        )}

        {gols.length > 0 && (
          <div className="mt-3">
            <Eyebrow>Gols</Eyebrow>
            <div className="mt-1 space-y-1">
              {gols.map((e, i) => (
                <div key={i} className="rounded-xl px-3 py-2 text-sm" style={card}>
                  <span className="tabular-nums text-xs mr-2" style={{ color: "#93AF9B" }}>{e.min}&#39;</span>
                  <b>{e.autor.nome}</b> ({SIGLA[e.time]}){e.assist ? <span style={{ color: "#93AF9B" }}> · assist. {e.assist.nome}</span> : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <Eyebrow>Resultados da rodada</Eyebrow>
          <div className="mt-1 space-y-1">
            {r.jogos.slice(1).map((x, i) => (
              <div key={i} className="rounded-xl px-3 py-2 text-sm flex items-center justify-between" style={card}>
                <span>{SIGLA[x.casa]}</span>
                <span className="font-black italic tabular-nums">{x.gc} : {x.gf}</span>
                <span>{SIGLA[x.fora]}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
          Ver tabela
        </button>
        <Rodape />
      </div>
    );
  };

  const TelaTabela = () => {
    const linhas = TIMES.map(t => {
      const d = S.tabela[t];
      return { t, ...d, SG: d.GP - d.GC, pct: d.J ? Math.round((d.P / (d.J * 3)) * 100) : 0 };
    }).sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP || a.t.localeCompare(b.t));
    const fim = S.rodada >= 22;
    return (
      <div className="pt-6">
        <div className="flex items-end justify-between">
          <div>
            <Eyebrow>Classificação</Eyebrow>
            <h2 className="text-xl font-black italic">Série C · Rodada {Math.min(S.rodada, 22)}/22</h2>
          </div>
          <button onClick={() => setTela("artilharia")} className="rounded-lg px-3 py-2 text-xs font-semibold" style={card}>
            🥇 Artilharia
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden mt-3" style={card}>
          <div className="grid text-xs font-semibold px-2 py-2" style={{ gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)", color: "#93AF9B" }}>
            <span /><span /><span>P</span><span>J</span><span>V</span><span>E</span><span>D</span><span>GP</span><span>GC</span><span>SG</span><span>%</span>
          </div>
          {linhas.map((l, i) => (
            <div key={l.t} className="grid items-center text-xs px-2 py-1.5 tabular-nums"
              style={{
                gridTemplateColumns: "1.5rem 1fr repeat(9, 1.55rem)",
                background: l.t === meuTime ? "rgba(255,197,61,0.10)" : i % 2 ? "rgba(255,255,255,0.02)" : "transparent",
              }}>
              <span style={{ color: "#93AF9B" }}>{i + 1}</span>
              <span className="flex items-center gap-1 font-semibold truncate pr-1">
                {SIGLA[l.t]}
                <span style={{ color: S.fase[l.t] > 1.01 ? "#8FD9A0" : S.fase[l.t] < 0.99 ? "#FF5A5A" : "#5E7767" }}>
                  {S.fase[l.t] > 1.01 ? "▲" : S.fase[l.t] < 0.99 ? "▼" : "–"}
                </span>
              </span>
              <span className="font-bold">{l.P}</span><span>{l.J}</span><span>{l.V}</span><span>{l.E}</span>
              <span>{l.D}</span><span>{l.GP}</span><span>{l.GC}</span><span>{l.SG}</span><span>{l.pct}</span>
            </div>
          ))}
        </div>
        {fim ? (
          <button onClick={() => setTela("campeao")} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
            🏆 Ver campeão
          </button>
        ) : (
          <button onClick={() => { prepararEscalacao(meuTime, S); setTela("escalacao"); }}
            className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
            Próxima rodada →
          </button>
        )}
        <Rodape />
      </div>
    );
  };

  const TelaArtilharia = () => {
    const top = Object.values(S.art).sort((a, b) => b.g - a.g).slice(0, 10);
    return (
      <div className="pt-6">
        <Eyebrow>Artilharia · Top 10</Eyebrow>
        <div className="mt-2 space-y-1">
          {top.map((a, i) => (
            <div key={i} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={card}>
              <span className="w-5 text-center font-black italic tabular-nums" style={{ color: i === 0 ? "#FFC53D" : "#93AF9B" }}>{i + 1}</span>
              <span className="flex-1 text-sm">{a.nome} <span className="text-xs" style={{ color: "#93AF9B" }}>({SIGLA[a.time]})</span></span>
              <span className="font-black italic tabular-nums">{a.g} ⚽</span>
            </div>
          ))}
          {top.length === 0 && <div className="text-sm" style={{ color: "#5E7767" }}>Nenhum gol ainda.</div>}
        </div>
        <button onClick={() => setTela("tabela")} className="w-full rounded-xl py-3 font-bold mt-4" style={card}>← Voltar à tabela</button>
        <Rodape />
      </div>
    );
  };

  const TelaCampeao = () => {
    const linhas = TIMES.map(t => {
      const d = S.tabela[t];
      return { t, ...d, SG: d.GP - d.GC };
    }).sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP);
    const camp = linhas[0];
    const minhaPos = linhas.findIndex(l => l.t === meuTime) + 1;
    const souCampeao = camp.t === meuTime;
    return (
      <div className="pt-8">
        <div className="rounded-2xl p-6 text-center" style={{ background: "#13251A", border: "2px solid #FFC53D" }}>
          <Eyebrow>Legends Liga Fut7 · Série C · 2026</Eyebrow>
          <div className="text-6xl mt-3">🏆</div>
          <div className="uppercase tracking-widest text-xs mt-2 font-bold" style={{ color: "#FFC53D" }}>Campeão</div>
          <div className="text-3xl font-black italic mt-1">{camp.t}</div>
          {souCampeao && <div className="text-sm font-semibold mt-1">Técnico: {nomeTec || "Técnico"}</div>}
          <div className="text-sm mt-3 tabular-nums" style={{ color: "#C8D8CC" }}>
            {camp.P} pts · {camp.V}V {camp.E}E {camp.D}D · saldo {camp.SG > 0 ? "+" : ""}{camp.SG}
          </div>
          <div className="text-xs mt-4" style={{ color: "#5E7767" }}>{ARENA}</div>
          <div className="text-xs font-black italic mt-1" style={{ color: "#93AF9B" }}>LEGENDS<span style={{ color: "#FFC53D" }}>MANAGER</span></div>
        </div>
        {!souCampeao && (
          <div className="rounded-xl px-4 py-3 mt-2 text-sm text-center" style={card}>
            Seu {meuTime} terminou em <b>{minhaPos}º</b> com {linhas[minhaPos - 1].P} pontos, técnico {nomeTec || "Técnico"}.
          </div>
        )}
        <div className="text-center text-xs mt-3" style={{ color: "#93AF9B" }}>
          Tira um print e manda no grupo. 📸
        </div>
        {!confirmaNova ? (
          <button onClick={() => setConfirmaNova(true)} className="w-full rounded-xl py-3.5 font-bold mt-4" style={amber}>
            Nova temporada
          </button>
        ) : (
          <div className="flex gap-2 mt-4">
            <button onClick={() => setConfirmaNova(false)} className="flex-1 rounded-xl py-3 font-bold" style={card}>Cancelar</button>
            <button onClick={() => { setConfirmaNova(false); iniciarTemporada(meuTime); }}
              className="flex-1 rounded-xl py-3 font-bold" style={amber}>Confirmar</button>
          </div>
        )}
        <Rodape />
      </div>
    );
  };

  const ModalNomes = () => (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-2xl p-4" style={{ background: "#13251A" }}>
        <Eyebrow>Corrigir nomes — {meuTime}</Eyebrow>
        <p className="text-xs mt-1" style={{ color: "#93AF9B" }}>Um nome por linha, na mesma ordem. Posições e atributos são mantidos.</p>
        <textarea value={textoNomes} onChange={e => setTextoNomes(e.target.value)} rows={10}
          className="w-full mt-2 rounded-xl p-3 text-sm outline-none"
          style={{ background: "#0B1712", color: "#ECF4EB", border: "1px solid rgba(88,124,99,0.35)" }} />
        <div className="flex gap-2 mt-3">
          <button onClick={() => setModalNomes(false)} className="flex-1 rounded-xl py-3 font-bold" style={card}>Cancelar</button>
          <button onClick={() => {
            const nomes = textoNomes.split("\n").map(s => s.trim()).filter(Boolean);
            S.elencos[meuTime].forEach((j, i) => { if (nomes[i]) j.nome = nomes[i]; });
            setModalNomes(false); rerender();
          }} className="flex-1 rounded-xl py-3 font-bold" style={amber}>Salvar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0B1712", color: "#ECF4EB", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="max-w-md mx-auto px-4">
        {tela === "inicio" && <TelaInicio />}
        {tela === "escalacao" && S && <TelaEscalacao />}
        {tela === "aoVivo" && S && <TelaAoVivo />}
        {tela === "intervalo" && S && jogo && <TelaIntervalo />}
        {tela === "resultado" && S && resumo && <TelaResultado />}
        {tela === "tabela" && S && <TelaTabela />}
        {tela === "artilharia" && S && <TelaArtilharia />}
        {tela === "campeao" && S && <TelaCampeao />}
      </div>
      {modalNomes && <ModalNomes />}
    </div>
  );
}
