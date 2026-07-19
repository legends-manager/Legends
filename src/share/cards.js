// src/share/cards.js
// Cards compartilháveis (dica 1 da pesquisa de mercado): gera um PNG via
// canvas e compartilha pela Web Share API (abre a folha nativa do celular,
// WhatsApp incluso). Sem backend, sem serviço externo: a imagem nasce e
// morre no aparelho. Fallback quando o navegador não compartilha arquivos
// (desktop): baixa o PNG.
//
// Tema (jul/2026, decisão de Felyp): grafite/lime "Polish Language v1",
// dourado reservado pra esta tela — é o único lugar do app onde ouro é
// regra, não exceção (conquista/pódio). O pôster de fim de temporada usa a
// moldura oficial da onça (public/art/poster-frame-onca.jpg — asset real da
// marca, não placeholder) como fundo. Glow liberado por Felyp (revogação da
// trava "sem gradiente/glow/blur"), usado aqui via shadowBlur do canvas,
// restrito ao troféu e ao resultado — não em todo o cartão.
import { incrementarMetrica } from "../storage/metricas";

const W = 1080, H = 1350; // 4:5 — formato que o WhatsApp mostra grande
const GRAFITE = "#1B1F24", SURFACE = "#242A31", LIME = "#C6FF1E", OURO = "#FFC400";
const CLARO = "#F4F7F9", CINZA_CLARO = "#AAB4BF", CINZA_MUTED = "#8793A1";
const FONTE = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Moldura oficial (crest da onça + bordas em raios lime) — carregada uma vez
// e reaproveitada; se falhar (offline/arquivo ausente), os cards caem no
// fundo grafite sólido sem quebrar o compartilhamento.
let _molduraPromise = null;
function carregarMoldura() {
  if (!_molduraPromise) {
    _molduraPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/art/poster-frame-onca.jpg";
    });
  }
  return _molduraPromise;
}

// Loader genérico com cache (Fase 3, artes do GPT Image: insígnias/
// mascote) — mesmo padrão do carregarMoldura, generalizado pra qualquer src.
const _imagens = new Map();
function carregarImagem(src) {
  if (!_imagens.has(src)) {
    _imagens.set(src, new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }
  return _imagens.get(src);
}

async function novoCanvas() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = GRAFITE;
  ctx.fillRect(0, 0, W, H);
  const moldura = await carregarMoldura();
  if (moldura) ctx.drawImage(moldura, 0, 0, W, H);
  return { c, ctx };
}

// Glow restrito (shadowBlur nativo do canvas) — aplica só ao redor do
// próximo desenho/texto e desliga em seguida, pra não vazar pro resto do card.
function comGlow(ctx, cor, raio, fn) {
  ctx.save();
  ctx.shadowColor = cor;
  ctx.shadowBlur = raio;
  fn();
  ctx.restore();
}

const texto = (ctx, t, x, y, { tam = 48, cor = CLARO, peso = "700", italico = false, alinh = "center" } = {}) => {
  ctx.fillStyle = cor;
  ctx.font = `${italico ? "italic " : ""}${peso} ${tam}px ${FONTE}`;
  ctx.textAlign = alinh;
  ctx.fillText(t, x, y);
};

// Cabeçalho posicionado pra nunca colidir com o crest da moldura (canto
// superior direito da imagem, aprox. x>820) — título centralizado mas
// contido à esquerda dessa faixa.
function cabecalho(ctx, sub) {
  texto(ctx, "LEGENDS MANAGER", W / 2 - 60, 120, { tam: 56, peso: "900", italico: true });
  texto(ctx, sub, W / 2 - 60, 168, { tam: 30, cor: CINZA_CLARO, peso: "600" });
}

function rodapeCard(ctx) {
  texto(ctx, "Legends Liga Fut7 · Arena Novo Horizonte — Limeira, SP", W / 2, H - 90, { tam: 26, cor: CINZA_CLARO, peso: "600" });
  texto(ctx, "Simulação — BETA", W / 2, H - 45, { tam: 22, cor: CINZA_MUTED, peso: "600" });
}

// Cartão translúcido atrás do conteúdo central — melhora a leitura sobre a
// moldura sem esconder a arte (mesma superfície grafite do resto do app).
function scrim(ctx, y0, y1) {
  ctx.fillStyle = "rgba(27,31,36,0.62)";
  const r = 28, x0 = 60, x1 = W - 60;
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.arcTo(x1, y0, x1, y1, r);
  ctx.arcTo(x1, y1, x0, y1, r);
  ctx.arcTo(x0, y1, x0, y0, r);
  ctx.arcTo(x0, y0, x1, y0, r);
  ctx.closePath();
  ctx.fill();
}

// Card de resultado da rodada: placar gigante + craque da partida.
export async function gerarCardResultado({ casa, fora, gc, gf, siglaCasa, siglaFora, craque, rodada, serieLabel }) {
  const { c, ctx } = await novoCanvas();
  cabecalho(ctx, `${serieLabel} · Rodada ${rodada}`);
  scrim(ctx, 300, 1020);

  // siglas em "escudos" redondos
  const desenhaEscudo = (sigla, x) => {
    ctx.fillStyle = SURFACE;
    ctx.beginPath(); ctx.arc(x, 480, 95, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = LIME; ctx.lineWidth = 5; ctx.stroke();
    texto(ctx, sigla, x, 505, { tam: 62, peso: "900", italico: true });
  };
  desenhaEscudo(siglaCasa, 220);
  desenhaEscudo(siglaFora, W - 220);
  comGlow(ctx, "rgba(198,255,30,0.55)", 30, () => {
    texto(ctx, `${gc} : ${gf}`, W / 2, 530, { tam: 170, cor: LIME, peso: "900", italico: true });
  });

  texto(ctx, casa, 220, 640, { tam: 34, peso: "700" });
  texto(ctx, fora, W - 220, 640, { tam: 34, peso: "700" });

  if (craque) {
    texto(ctx, "★ CRAQUE DA PARTIDA", W / 2, 840, { tam: 36, cor: OURO, peso: "800" });
    texto(ctx, craque.nome, W / 2, 910, { tam: 52, peso: "900", italico: true });
    texto(ctx, craque.time, W / 2, 965, { tam: 32, cor: CINZA_CLARO, peso: "600" });
  }

  rodapeCard(ctx);
  return c;
}

// Card de fim de temporada (pôster): time, técnico, posição e destino.
// Usa a moldura oficial da onça como fundo (novoCanvas) — este é o pôster
// que circula no grupo da liga, então é o cartão com mais capricho visual:
// scrim translúcido pra legibilidade, dourado no resultado (única tela do
// app onde ouro é a regra, não a exceção), glow lime restrito ao troféu.
export async function gerarCardTemporada({ meuTime, nomeTec, temporada, serieLabel, posicao, resultadoLabel, serieDestinoLabel }) {
  const { c, ctx } = await novoCanvas();
  cabecalho(ctx, `Fim de temporada ${temporada} · Liga Viva`);
  scrim(ctx, 300, 1080);

  comGlow(ctx, "rgba(255,196,0,0.6)", 40, () => {
    texto(ctx, "🏆", W / 2, 440, { tam: 130 });
  });
  texto(ctx, meuTime, W / 2, 590, { tam: 78, peso: "900", italico: true });
  texto(ctx, `Técnico ${nomeTec || "Técnico"}`, W / 2, 660, { tam: 38, cor: CINZA_CLARO, peso: "700" });

  texto(ctx, `${posicao}º lugar · ${serieLabel}`, W / 2, 810, { tam: 50, peso: "800" });
  comGlow(ctx, "rgba(255,196,0,0.5)", 24, () => {
    texto(ctx, resultadoLabel, W / 2, 900, { tam: 60, cor: OURO, peso: "900", italico: true });
  });
  texto(ctx, `Próxima temporada: ${serieDestinoLabel}`, W / 2, 975, { tam: 34, cor: CINZA_CLARO, peso: "600" });

  rodapeCard(ctx);
  return c;
}

// Card de insígnia desbloqueada (F-ideias jul/2026): medalhão da conquista
// (arte real do GPT Image desde jul/2026, cai pro emoji em círculo se a
// imagem não carregar) + título + descrição — o "tier lendário circulando
// no grupo é propaganda grátis". Mesma moldura da onça.
const COR_TIER_CARD = { comum: "#8793A1", raro: LIME, epico: "#E4FF54", lendario: OURO };
const TIER_LABEL_CARD = { comum: "COMUM", raro: "RARO", epico: "ÉPICO", lendario: "LENDÁRIO" };
const IMG_TIER_CARD = {
  comum: "/insignias/comum.webp", raro: "/insignias/raro.webp",
  epico: "/insignias/epico.webp", lendario: "/insignias/lendario.webp",
};
// Insígnias do patrocinador Delícias da Ana (jul/2026) têm arte própria,
// com a marca desenhada na imagem — prioridade sobre a arte genérica por
// tier (mesmo critério do InsigniaBadge.jsx).
const IMG_CONQUISTA_CARD = {
  "patrocinio-kissassa-c": "/patrocinio/normal.webp",
  "patrocinio-kissassa-b": "/patrocinio/platina.webp",
  "patrocinio-kissassa-a": "/patrocinio/ouro.webp",
};

export async function gerarCardInsignia({ emoji, titulo, desc, tier, nomeTec, clube, conquistaId }) {
  const { c, ctx } = await novoCanvas();
  const cor = COR_TIER_CARD[tier] || LIME;
  cabecalho(ctx, "Insígnia desbloqueada");
  scrim(ctx, 300, 1080);

  // Medalhão central com a cor do tier (glow proporcional à raridade).
  const raioGlow = tier === "lendario" ? 60 : tier === "epico" ? 40 : 18;
  const badge = await carregarImagem(IMG_CONQUISTA_CARD[conquistaId] || IMG_TIER_CARD[tier]);
  if (badge) {
    comGlow(ctx, cor, raioGlow, () => {
      ctx.drawImage(badge, W / 2 - 170, 350, 340, 340);
    });
  } else {
    comGlow(ctx, cor, raioGlow, () => {
      ctx.fillStyle = SURFACE;
      ctx.beginPath(); ctx.arc(W / 2, 500, 150, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = cor; ctx.lineWidth = 10; ctx.stroke();
    });
    texto(ctx, emoji, W / 2, 555, { tam: 150 });
  }

  texto(ctx, titulo, W / 2, 780, { tam: 72, peso: "900", italico: true });
  comGlow(ctx, cor, 20, () => {
    texto(ctx, TIER_LABEL_CARD[tier] || "", W / 2, 850, { tam: 40, cor, peso: "900" });
  });
  texto(ctx, desc, W / 2, 930, { tam: 34, cor: CINZA_CLARO, peso: "600" });
  if (nomeTec || clube) {
    texto(ctx, [nomeTec && `Técnico ${nomeTec}`, clube].filter(Boolean).join(" · "), W / 2, 1010, { tam: 32, cor: CINZA_MUTED, peso: "600" });
  }

  rodapeCard(ctx);
  return c;
}

// Compartilha o canvas como PNG: folha nativa (mobile) ou download (fallback).
// Retorna true se o card saiu (share ou download) — quem chama mostra o erro.
export async function compartilharCard(canvas, nomeArquivo, titulo) {
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return false;
  const file = new File([blob], `${nomeArquivo}.png`, { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: titulo });
      incrementarMetrica("printsCompartilhados");
      return true;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return false; // usuário desistiu — sem download por cima
  }
  // Desktop / navegador sem share de arquivo: baixa o PNG.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${nomeArquivo}.png`;
  a.click();
  URL.revokeObjectURL(url);
  incrementarMetrica("printsCompartilhados");
  return true;
}
