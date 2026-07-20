// src/components/Camisa.jsx
// Camisa do time (Marco de patrocínio de uniforme, jul/2026) — v3.
// v1/v2 eram SVG desenhado à mão (Felyp: "ficou horrível"/"torta"). v3 usa
// a camisa-base real gerada por GPT Image (ghost mannequin, prompt em
// PROMPTS_GPT_IMAGE.md lote 2) — fundo removido à parte (o PNG saiu com um
// quadriculado PINTADO nos pixels, não alpha de verdade; script de remoção
// documentado no commit) — e recolorida por <canvas> com multiply blend:
// preserva dobra/sombra/textura do tecido, só troca a cor por cima, sem
// precisar de 32 imagens.
import { useEffect, useRef, useState } from "react";
import { COR_HEX, CRESTS } from "../data/times";
import { FORNECEDOR_CAMISA, patrocinadorMasterDoTime } from "../data/patrocinadoresCamisa";

const BASE_SRC = "/camisa/camisa-base.webp";
// Coordenadas no espaço nativo da camisa-base (700×700) — ajustadas a olho
// pra essa imagem específica; se a base mudar, ajustar aqui também.
const LAYOUT = {
  crest: { x: 205, y: 205, w: 60 },
  fornecedor: { x: 412, y: 218, w: 50 },
  master: { x: 265, y: 305, w: 112, h: 86 },
};

let _basePromise = null;
function carregarBase() {
  if (!_basePromise) {
    _basePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = BASE_SRC;
    });
  }
  return _basePromise;
}
function carregarImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// As artes de escudo/patrocinador vêm com fundo preto OPACO (não transparente
// de verdade — hasAlpha: false), então desenhá-las cruas na camisa parece um
// adesivo quadrado colado por cima. Aqui elas viram um "patch" de verdade:
// recorte (círculo pro escudo, cantos arredondados pros patrocinadores) +
// aro claro fino, igual bordado/emblema costurado numa camisa de verdade.
function desenharPatch(ctx, img, x, y, w, h, { circulo = false, raio = 10 } = {}) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;
  ctx.beginPath();
  if (circulo) {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x, y, w, h, raio);
  }
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  if (circulo) {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x, y, w, h, raio);
  }
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (circulo) {
    const r = Math.min(w, h) / 2 - 1;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x + 1, y + 1, w - 2, h - 2, raio);
  }
  ctx.stroke();
  ctx.restore();
}

export default function Camisa({ time, largura = 260 }) {
  const canvasRef = useRef(null);
  const [pronto, setPronto] = useState(false);
  const cor = COR_HEX[time] || "#39424E";
  const crestSrc = CRESTS[time];
  const master = patrocinadorMasterDoTime(time);

  useEffect(() => {
    let cancelado = false;
    setPronto(false);
    (async () => {
      const [base, crestImg, fornecedorImg, masterImg] = await Promise.all([
        carregarBase(),
        crestSrc ? carregarImg(crestSrc) : null,
        carregarImg(FORNECEDOR_CAMISA.logo),
        master ? carregarImg(master.logo) : null,
      ]);
      if (cancelado || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const W = base ? base.width : 700;
      const H = base ? base.height : 700;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      if (base) {
        // 1) desenha a base neutra · 2) multiplica pela cor do time
        // (preserva dobra/sombra) · 3) reclipa pro alpha original, pra
        // não sobrar nenhum resíduo de cor fora da silhueta.
        ctx.drawImage(base, 0, 0, W, H);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = cor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(base, 0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }

      if (crestImg) {
        const { x, y, w } = LAYOUT.crest;
        desenharPatch(ctx, crestImg, x, y, w, w, { circulo: true });
      }
      if (fornecedorImg) {
        const { x, y, w } = LAYOUT.fornecedor;
        const h = w * (fornecedorImg.height / fornecedorImg.width);
        desenharPatch(ctx, fornecedorImg, x, y, w, h, { raio: 6 });
      }
      if (masterImg) {
        const { x, y, w, h } = LAYOUT.master;
        desenharPatch(ctx, masterImg, x, y, w, h, { raio: 12 });
      }
      setPronto(true);
    })();
    return () => { cancelado = true; };
  }, [time, cor, crestSrc, master]);

  return (
    <div className="relative" style={{ width: largura, height: largura, opacity: pronto ? 1 : 0, transition: "opacity 0.15s" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} role="img" aria-label={`Camisa do ${time}`} />
      {!master && pronto && (
        <div
          className="absolute flex flex-col items-center justify-center text-center"
          style={{
            left: `${(LAYOUT.master.x / 700) * 100}%`,
            top: `${(LAYOUT.master.y / 700) * 100}%`,
            width: `${(LAYOUT.master.w / 700) * 100}%`,
            height: `${(LAYOUT.master.h / 700) * 100}%`,
            border: "2px dashed rgba(0,0,0,0.35)",
            borderRadius: 8,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: "rgba(0,0,0,0.55)" }}>Espaço</span>
          <span className="text-[10px] font-bold uppercase" style={{ color: "rgba(0,0,0,0.55)" }}>à venda</span>
        </div>
      )}
    </div>
  );
}
