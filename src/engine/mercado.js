// src/engine/mercado.js
// Economia do Marco 2 (spec-mercado.md §2 e §3) — camada por cima da força
// interna e do atributo. NÃO altera atributo nem multiplicador interno.
import { calcularCraque } from "./craque";
import { posicaoNaTabela } from "./classificacao";

export const ORCAMENTO_INICIAL = 1000; // L$ ⚙️
export const PISO_VALOR = 50; // L$ ⚙️
export const TETO_VALOR = 2000; // L$ ⚙️
export const TETO_ELENCO = 20; // ⚙️ o maior elenco real (Marco 3: Furia FC/Dibrados FC na Série A, 20)

const CREDITO = { vitoria: 150, empate: 50, derrota: -30 }; // L$ ⚙️
const VALORIZACAO = { gol: 20, assistencia: 10, craque: 30, vitoriaTitular: 5 }; // L$ ⚙️
const TETO_VALORIZACAO_RODADA = 60; // L$ ⚙️
const PENALIDADE_OCIOSIDADE = -5; // L$ ⚙️

// §3.2 — valor inicial por qualidade (curva convexa "perfil BRUTAL") + leve
// mispricing (ruído no preço — o valor é um sinal IMPERFEITO do atributo).
// Nunca revela a força interna do time, só o atributo do próprio jogador
// (já visível na escalação). Recalculado a cada nova temporada, junto com o
// re-sorteio de atributos (gerarElencos chama isso pra cada jogador).
const CURVA_K = 1.2; // ⚙️
const CURVA_EXP = 1.9; // ⚙️
const MISPRICING = 0.15; // ⚙️ m — preço varia U(1−m, 1+m) sobre a base

export function valorInicial(attr) {
  const base = PISO_VALOR + CURVA_K * Math.pow(Math.max(0, attr - 45), CURVA_EXP);
  const ruido = 1 + (Math.random() * 2 - 1) * MISPRICING; // U(1-m, 1+m)
  return Math.round(Math.min(TETO_VALOR, Math.max(PISO_VALOR, base * ruido)));
}

export function orcamentosIniciais(times) {
  const o = {};
  times.forEach((t) => { o[t] = ORCAMENTO_INICIAL; });
  return o;
}

const unionPorId = (...listas) => [...new Map(listas.flat().map((p) => [p.id, p])).values()];
export { unionPorId };

// §3.1 — Crédito de orçamento por resultado, para os 12 times da rodada.
// Muta `orcamento` (mapa time -> L$) in-place. Nunca fica negativo.
export function creditarOrcamentos(orcamento, jogos) {
  const delta = (a, b) => (a > b ? CREDITO.vitoria : a < b ? CREDITO.derrota : CREDITO.empate);
  jogos.forEach((x) => {
    orcamento[x.casa] = Math.max(0, orcamento[x.casa] + delta(x.gc, x.gf));
    orcamento[x.fora] = Math.max(0, orcamento[x.fora] + delta(x.gf, x.gc));
  });
}

// §3.2 — Valorização por desempenho, para os 12 times da rodada. Muta os
// jogadores de `elencos` in-place (campo `valor`). `jogos` precisa trazer
// `escCasa`/`escFora` (quem jogou) além de `ev`/`gc`/`gf`.
// Retorna o craque de cada jogo, na mesma ordem de `jogos` (jogos[0] = jogo
// do humano), para reaproveitamento na tela de Resultado sem recalcular.
export function valorizarJogadores(elencos, jogos) {
  return jogos.map((x) => {
    const vitoriaCasa = x.gc > x.gf, vitoriaFora = x.gf > x.gc;
    const craque = calcularCraque({
      evMeu: x.ev,
      minhaEsc1: x.escCasa,
      minhaEsc2: x.escFora,
      advEsc: [],
      gcMeu: x.gc,
      gfMeu: x.gf,
    });

    const ganho = {};
    const add = (id, v) => { ganho[id] = (ganho[id] || 0) + v; };
    x.ev.filter((e) => e.tipo === "gol").forEach((e) => {
      add(e.autor.id, VALORIZACAO.gol);
      if (e.assist) add(e.assist.id, VALORIZACAO.assistencia);
    });
    if (craque) add(craque.id, VALORIZACAO.craque);
    if (vitoriaCasa) x.escCasa.forEach((j) => add(j.id, VALORIZACAO.vitoriaTitular));
    if (vitoriaFora) x.escFora.forEach((j) => add(j.id, VALORIZACAO.vitoriaTitular));

    const titularesCasa = new Set(x.escCasa.map((j) => j.id));
    const titularesFora = new Set(x.escFora.map((j) => j.id));
    const aplicar = (time, titulares) => {
      elencos[time].forEach((j) => {
        if (titulares.has(j.id)) {
          j.valor = Math.max(PISO_VALOR, j.valor + Math.min(TETO_VALORIZACAO_RODADA, ganho[j.id] || 0));
        } else {
          j.valor = Math.max(PISO_VALOR, j.valor + PENALIDADE_OCIOSIDADE);
        }
      });
    };
    aplicar(x.casa, titularesCasa);
    aplicar(x.fora, titularesFora);

    return craque;
  });
}

// ---------------- Estado do mercado (§2) ----------------
// `ofertas` (propostas de IA por jogadores do humano) não está no schema de
// save da spec — é gerado por janela (Passo 3) e vive só em memória até o
// fechamento; não precisa sobreviver a um reload.
export function mercadoInicial() {
  return { janela: "fechada", janelaUsadaMeio: false, listados: [], historico: [], ofertas: [] };
}

// ---------------- Travas §3.3 (valem pra humano e IA) ----------------
// Verifica se dá pra tirar `idJogador` do elenco sem violar <7 jogadores ou
// ficar sem goleiro.
export function podeRemover(elenco, idJogador) {
  const jogador = elenco.find((j) => j.id === idJogador);
  if (!jogador) return { ok: false, motivo: "Jogador não encontrado no elenco." };
  const restante = elenco.filter((j) => j.id !== idJogador);
  if (restante.length < 7) return { ok: false, motivo: "O time ficaria com menos de 7 jogadores." };
  if (jogador.pos === "GOL" && !restante.some((j) => j.pos === "GOL")) {
    return { ok: false, motivo: "Esse é o único goleiro do time." };
  }
  return { ok: true, motivo: null };
}

// Verifica se dá pra acrescentar mais um jogador sem estourar o teto de 18.
export function podeAdicionar(elenco) {
  if (elenco.length >= TETO_ELENCO) {
    return { ok: false, motivo: `O elenco já está no teto de ${TETO_ELENCO} jogadores.` };
  }
  return { ok: true, motivo: null };
}

export function donoDoJogador(elencos, idJogador) {
  return Object.keys(elencos).find((t) => elencos[t].some((j) => j.id === idJogador)) || null;
}

export function buscarJogador(elencos, idJogador) {
  for (const t of Object.keys(elencos)) {
    const j = elencos[t].find((x) => x.id === idJogador);
    if (j) return j;
  }
  return null;
}

// Posição de `time` na tabela (1 = líder) — é informação PÚBLICA, ao
// contrário do multiplicador interno (§1, força não pode vazar por aqui).
// Exportada pra engine/torcida.js reaproveitar (humor por posição, §3).
export function posicaoDoTime(S, time) {
  return posicaoNaTabela(S.tabela, time);
}

// ---------------- Operações de mercado (§4) ----------------
// Todas mutam `S` in-place (mesmo estilo do resto do motor) e devolvem
// { ok, motivo } pra UI mostrar o erro quando bloqueado.

// Lista um jogador do próprio elenco à venda.
export function listarJogador(S, time, idJogador, preco) {
  const chk = podeRemover(S.elencos[time], idJogador);
  if (!chk.ok) return chk;
  if (S.mercado.listados.some((l) => l.idJogador === idJogador)) {
    return { ok: false, motivo: "Esse jogador já está à venda." };
  }
  S.mercado.listados.push({ idJogador, preco: Math.max(PISO_VALOR, Math.round(preco)) });
  return { ok: true, motivo: null };
}

export function retirarListagem(S, idJogador) {
  S.mercado.listados = S.mercado.listados.filter((l) => l.idJogador !== idJogador);
}

// Compra um jogador listado: transfere, ajusta orçamentos, registra histórico.
export function comprarJogador(S, timeComprador, idJogador) {
  const listagem = S.mercado.listados.find((l) => l.idJogador === idJogador);
  if (!listagem) return { ok: false, motivo: "Essa listagem não existe mais (pode ter expirado)." };
  const timeVendedor = donoDoJogador(S.elencos, idJogador);
  if (!timeVendedor) return { ok: false, motivo: "Jogador não encontrado em nenhum elenco." };
  if (timeVendedor === timeComprador) return { ok: false, motivo: "Esse jogador já é seu." };

  // §3.2 — efeito contexto: comprador em posição pior que o vendedor leva -10%.
  // Só na janela do meio (na pré-temporada a tabela está zerada) e só com a
  // posição pública na tabela — nunca o multiplicador interno.
  let preco = listagem.preco;
  if (S.mercado.janela === "meio" && posicaoDoTime(S, timeComprador) > posicaoDoTime(S, timeVendedor)) {
    preco = Math.round(preco * 0.9);
  }

  if (S.orcamento[timeComprador] < preco) return { ok: false, motivo: "Orçamento insuficiente." };
  const chkSai = podeRemover(S.elencos[timeVendedor], idJogador);
  if (!chkSai.ok) return chkSai;
  const chkEntra = podeAdicionar(S.elencos[timeComprador]);
  if (!chkEntra.ok) return chkEntra;

  const jogador = S.elencos[timeVendedor].find((j) => j.id === idJogador);
  S.elencos[timeVendedor] = S.elencos[timeVendedor].filter((j) => j.id !== idJogador);
  jogador.time = timeComprador;
  S.elencos[timeComprador] = [...S.elencos[timeComprador], jogador];
  S.orcamento[timeComprador] -= preco;
  S.orcamento[timeVendedor] += preco;
  S.mercado.listados = S.mercado.listados.filter((l) => l.idJogador !== idJogador);
  S.mercado.historico.push({
    jogador: jogador.nome, de: timeVendedor, para: timeComprador, valor: preco, rodada: S.rodada,
  });
  return { ok: true, motivo: null };
}

// Aceita uma oferta de IA por um jogador do humano.
// oferta: { idJogador, timeOfertante, preco }
export function aceitarOferta(S, oferta) {
  const timeVendedor = donoDoJogador(S.elencos, oferta.idJogador);
  if (!timeVendedor) return { ok: false, motivo: "Jogador não encontrado." };
  if (S.orcamento[oferta.timeOfertante] < oferta.preco) {
    return { ok: false, motivo: "Esse time não tem mais orçamento pra essa oferta." };
  }
  const chkSai = podeRemover(S.elencos[timeVendedor], oferta.idJogador);
  if (!chkSai.ok) return chkSai;
  const chkEntra = podeAdicionar(S.elencos[oferta.timeOfertante]);
  if (!chkEntra.ok) return chkEntra;

  const jogador = S.elencos[timeVendedor].find((j) => j.id === oferta.idJogador);
  S.elencos[timeVendedor] = S.elencos[timeVendedor].filter((j) => j.id !== oferta.idJogador);
  jogador.time = oferta.timeOfertante;
  S.elencos[oferta.timeOfertante] = [...S.elencos[oferta.timeOfertante], jogador];
  S.orcamento[oferta.timeOfertante] -= oferta.preco;
  S.orcamento[timeVendedor] += oferta.preco;
  S.mercado.ofertas = S.mercado.ofertas.filter((o) => o.idJogador !== oferta.idJogador);
  S.mercado.historico.push({
    jogador: jogador.nome, de: timeVendedor, para: oferta.timeOfertante, valor: oferta.preco, rodada: S.rodada,
  });
  return { ok: true, motivo: null };
}

export function recusarOferta(S, oferta) {
  S.mercado.ofertas = S.mercado.ofertas.filter(
    (o) => !(o.idJogador === oferta.idJogador && o.timeOfertante === oferta.timeOfertante)
  );
}

// Fecha a janela: listagens e ofertas expiram (§4). A janela do meio não reabre
// (quem chama já marcou janelaUsadaMeio=true ao abri-la).
export function fecharJanela(S) {
  S.mercado.listados = [];
  S.mercado.ofertas = [];
  S.mercado.janela = "fechada";
}

// ---------------- Comportamento das IAs (§5) ----------------
const LIMITE_ELENCO_EXCEDENTE = 10; // ⚙️ titulares(7) + 3 de banco
const MULT_ANTIEXPLOIT = 1.2; // ⚙️ IA só compra se preço ≤ valor × 1,2
const CHANCE_OFERTA = 0.3; // ⚙️
const OFERTA_MULT_MIN = 1.0, OFERTA_MULT_SPAN = 0.3; // ⚙️ U(1,0–1,3)

// Espelha `melhores()` de engine/simulador.js (não importamos de lá pra evitar
// import circular — simulador.js já importa deste arquivo). Usado só pra
// definir quem são os "titulares valiosos" do humano, alvo de oferta (§5.3).
const melhorEscalacao = (elenco) => {
  const gks = elenco.filter((j) => j.pos === "GOL").sort((a, b) => b.attr - a.attr);
  const linha = elenco.filter((j) => j.pos !== "GOL").sort((a, b) => b.attr - a.attr);
  return [gks[0], ...linha.slice(0, 6)].filter(Boolean);
};

// §5.1 — Vende excedente: elenco > 10 lista 1–2 de menor valor (empate: menor attr).
function iaVendeExcedente(S, time) {
  const elenco = S.elencos[time];
  if (elenco.length <= LIMITE_ELENCO_EXCEDENTE) return;
  const qtd = Math.random() < 0.5 ? 1 : 2;
  const candidatos = [...elenco].sort((a, b) => a.valor - b.valor || a.attr - b.attr);
  let listados = 0;
  for (const j of candidatos) {
    if (listados >= qtd) break;
    if (S.mercado.listados.some((l) => l.idJogador === j.id)) continue;
    if (!podeRemover(elenco, j.id).ok) continue;
    S.mercado.listados.push({ idJogador: j.id, preco: j.valor });
    listados++;
  }
}

// Posição (GOL/DEF/MEI/ATA) com a menor média de atributo no elenco do time
// (posição sem nenhum jogador conta como a mais fraca possível).
function posicaoMaisFraca(elenco) {
  let pior = null, piorMedia = Infinity;
  ["GOL", "DEF", "MEI", "ATA"].forEach((g) => {
    const jogadores = elenco.filter((j) => j.pos === g);
    const media = jogadores.length
      ? jogadores.reduce((s, j) => s + j.attr, 0) / jogadores.length
      : -1;
    if (media < piorMedia) { piorMedia = media; pior = g; }
  });
  return pior;
}

// §5.2 — Reforça a posição mais fraca: compra de `listados` o melhor atributo
// daquela posição que couber no orçamento, mas só se preço ≤ valor × 1,2
// (anti-exploit: sem isso, o humano lista qualquer jogador por preço absurdo
// e a IA paga). Passa por comprarJogador, então herda 3.3 e o efeito contexto.
function iaReforca(S, time) {
  const posAlvo = posicaoMaisFraca(S.elencos[time]);
  const candidatos = S.mercado.listados
    .map((l) => ({ listagem: l, jogador: buscarJogador(S.elencos, l.idJogador) }))
    .filter(({ jogador }) => jogador && jogador.pos === posAlvo && jogador.time !== time)
    .sort((a, b) => b.jogador.attr - a.jogador.attr);

  for (const { listagem, jogador } of candidatos) {
    if (listagem.preco > jogador.valor * MULT_ANTIEXPLOIT) continue;
    if (S.orcamento[time] < listagem.preco) continue;
    if (comprarJogador(S, time, jogador.id).ok) break; // reforça 1 jogador por janela
  }
}

// §5.3 — Oferta pelo humano: ~30% de chance por titular valioso do humano,
// preço = valor × U(1,0–1,3).
function iaOfertaPeloHumano(S, timeIA, meuTime) {
  const titulares = melhorEscalacao(S.elencos[meuTime]);
  titulares.forEach((j) => {
    if (Math.random() >= CHANCE_OFERTA) return;
    if (S.mercado.ofertas.some((o) => o.idJogador === j.id && o.timeOfertante === timeIA)) return;
    const preco = Math.round(j.valor * (OFERTA_MULT_MIN + Math.random() * OFERTA_MULT_SPAN));
    if (S.orcamento[timeIA] < preco) return;
    S.mercado.ofertas.push({ idJogador: j.id, timeOfertante: timeIA, preco });
  });
}

// Roda o comportamento das 11 IAs numa janela, em ordem aleatória (§5).
// Chamado uma vez, exatamente quando a janela abre (pre ou meio).
export function iaNegocia(S, meuTime) {
  const times = Object.keys(S.elencos).filter((t) => t !== meuTime);
  const ordem = [...times].sort(() => Math.random() - 0.5);
  ordem.forEach((time) => {
    iaVendeExcedente(S, time);
    iaReforca(S, time);
    iaOfertaPeloHumano(S, time, meuTime);
  });
}
