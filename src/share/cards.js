// src/share/cards.js
// Cards compartilháveis (dica 1 da pesquisa de mercado): gera um PNG via
// canvas — tema roxo/dourado da marca — e compartilha pela Web Share API
// (abre a folha nativa do celular, WhatsApp incluso). Sem backend, sem
// serviço externo: a imagem nasce e morre no aparelho. Fallback quando o
// navegador não compartilha arquivos (desktop): baixa o PNG.
import { incrementarMetrica } from "../storage/metricas";

const W = 1080, H = 1350; // 4:5 — formato que o WhatsApp mostra grande
const OURO = "#FFC53D", CLARO = "#F2EDFA", ROXO_CLARO = "#A78FC7";
const FONTE = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function novoCanvas() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  // fundo: gradiente da marca + vinheta
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2A0E4F");
  g.addColorStop(1, "#14081F");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return { c, ctx };
}

const texto = (ctx, t, x, y, { tam = 48, cor = CLARO, peso = "700", italico = false, alinh = "center" } = {}) => {
  ctx.fillStyle = cor;
  ctx.font = `${italico ? "italic " : ""}${peso} ${tam}px ${FONTE}`;
  ctx.textAlign = alinh;
  ctx.fillText(t, x, y);
};

function cabecalho(ctx, sub) {
  texto(ctx, "LEGENDS MANAGER", W / 2, 130, { tam: 64, peso: "900", italico: true });
  texto(ctx, sub, W / 2, 185, { tam: 34, cor: ROXO_CLARO, peso: "600" });
  ctx.strokeStyle = "rgba(139,105,190,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(140, 225); ctx.lineTo(W - 140, 225); ctx.stroke();
}

function rodapeCard(ctx) {
  texto(ctx, "Legends Liga Fut7 · Arena Novo Horizonte — Limeira, SP", W / 2, H - 90, { tam: 28, cor: ROXO_CLARO, peso: "600" });
  texto(ctx, "Simulação — BETA", W / 2, H - 45, { tam: 24, cor: "#6E5A92", peso: "600" });
}

// Card de resultado da rodada: placar gigante + craque da partida.
export function gerarCardResultado({ casa, fora, gc, gf, siglaCasa, siglaFora, craque, rodada, serieLabel }) {
  const { c, ctx } = novoCanvas();
  cabecalho(ctx, `${serieLabel} · Rodada ${rodada}`);

  // siglas em "escudos" redondos
  const desenhaEscudo = (sigla, x) => {
    ctx.fillStyle = "#3A1D66";
    ctx.beginPath(); ctx.arc(x, 480, 95, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OURO; ctx.lineWidth = 5; ctx.stroke();
    texto(ctx, sigla, x, 505, { tam: 62, peso: "900", italico: true });
  };
  desenhaEscudo(siglaCasa, 220);
  desenhaEscudo(siglaFora, W - 220);
  texto(ctx, `${gc} : ${gf}`, W / 2, 530, { tam: 170, cor: OURO, peso: "900", italico: true });

  texto(ctx, casa, 220, 640, { tam: 34, peso: "700" });
  texto(ctx, fora, W - 220, 640, { tam: 34, peso: "700" });

  if (craque) {
    texto(ctx, "⭐ CRAQUE DA PARTIDA", W / 2, 840, { tam: 36, cor: OURO, peso: "800" });
    texto(ctx, craque.nome, W / 2, 910, { tam: 52, peso: "900", italico: true });
    texto(ctx, craque.time, W / 2, 965, { tam: 32, cor: ROXO_CLARO, peso: "600" });
  }

  rodapeCard(ctx);
  return c;
}

// Card de fim de temporada (pôster): time, técnico, posição e destino.
export function gerarCardTemporada({ meuTime, nomeTec, temporada, serieLabel, posicao, resultadoLabel, serieDestinoLabel }) {
  const { c, ctx } = novoCanvas();
  cabecalho(ctx, `Fim de temporada ${temporada} · Liga Viva`);

  texto(ctx, "🏆", W / 2, 430, { tam: 130 });
  texto(ctx, meuTime, W / 2, 580, { tam: 84, peso: "900", italico: true });
  texto(ctx, `Técnico ${nomeTec || "Técnico"}`, W / 2, 655, { tam: 40, cor: ROXO_CLARO, peso: "700" });

  texto(ctx, `${posicao}º lugar · ${serieLabel}`, W / 2, 810, { tam: 52, peso: "800" });
  texto(ctx, resultadoLabel, W / 2, 900, { tam: 62, cor: OURO, peso: "900", italico: true });
  texto(ctx, `Próxima temporada: ${serieDestinoLabel}`, W / 2, 975, { tam: 36, cor: ROXO_CLARO, peso: "600" });

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
