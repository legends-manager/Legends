// src/components/ui.jsx
// Primitivas visuais e constantes de estilo compartilhadas pelas telas.
// Extraídas da demo sem alteração visual.
import { useState } from "react";
import { SIGLA, COR } from "../data/times";

export const card = { background: "#1E1233", border: "1px solid rgba(139,105,190,0.35)" };
export const amber = { background: "#FFC53D", color: "#1A1607" };

export const Eyebrow = ({ children }) => (
  <div className="uppercase tracking-widest text-xs font-semibold" style={{ color: "#A78FC7" }}>
    {children}
  </div>
);

export const Rodape = () => (
  <div className="text-center text-xs mt-8 pb-6" style={{ color: "#6E5A92" }}>
    Simulação — BETA · Legends Manager
  </div>
);

export const Avatar = ({ t, sm }) => (
  <span
    className={`${COR[t]} ${sm ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"} rounded-full inline-flex items-center justify-center font-black italic shrink-0 text-white`}
  >
    {SIGLA[t]}
  </span>
);

// Avatar do técnico: PNG da galeria se `avatarId` existir e carregar; senão
// (ausente, "sem avatar" ou 404 — pasta /public/avatars pode nem existir)
// cai pro círculo com as iniciais do nome. Nunca quebra.
export const AvatarTecnico = ({ avatarId, nome, size = 40 }) => {
  const [erro, setErro] = useState(false);
  if (avatarId && !erro) {
    return (
      <img
        src={`/avatars/${avatarId}.png`}
        alt={nome || avatarId}
        onError={() => setErro(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: "1px solid rgba(139,105,190,0.35)" }}
      />
    );
  }
  const iniciais =
    (nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
  return (
    <span
      className="rounded-full inline-flex items-center justify-center font-black italic shrink-0 text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: "#7C4FCC" }}
    >
      {iniciais}
    </span>
  );
};

// Placa de patrocínio (estilo placa de estádio). Dois pontos de exibição,
// escolhidos pelo alcance: partida ao vivo (tela onde o jogador passa mais
// tempo) e pôster de Fim de Temporada (o print que circula no WhatsApp da
// liga — marca ali alcança quem nem joga). Quando houver patrocinador real,
// Felyp salva o logo em /public/brand/patrocinio.png (horizontal, ~800x200)
// e a placa passa a exibi-lo automaticamente; sem o arquivo, mostra o
// convite "seu logo aqui". Nunca quebra sem o asset.
export const PlacaPatrocinio = ({ compacta }) => {
  const [temLogo, setTemLogo] = useState(true);
  if (temLogo) {
    return (
      <img
        src="/brand/patrocinio.png"
        alt="Patrocinador oficial"
        onError={() => setTemLogo(false)}
        className="w-full rounded-lg object-contain"
        style={{ maxHeight: compacta ? 40 : 56, background: "#1B1F24", border: "1px solid #39424E" }}
      />
    );
  }
  return (
    <div
      className={`rounded-lg text-center ${compacta ? "px-3 py-1.5" : "px-3 py-2.5"}`}
      style={{
        background: "repeating-linear-gradient(-45deg, #1B1F24, #1B1F24 12px, #242A31 12px, #242A31 24px)",
        border: "1px dashed #39424E",
      }}
    >
      <div className={`font-black italic tracking-widest uppercase ${compacta ? "text-[10px]" : "text-xs"}`} style={{ color: "#C6FF1E" }}>
        Seu logo aqui
      </div>
      {!compacta && (
        <div className="text-[10px] mt-0.5" style={{ color: "#8793A1" }}>
          Patrocine a Legends Liga Fut7 · fale com a organização
        </div>
      )}
    </div>
  );
};

export const Barra = ({ v }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="w-12 h-1.5 rounded-full overflow-hidden inline-block" style={{ background: "#2E1D4C" }}>
      <span className="h-full block rounded-full" style={{ width: `${v}%`, background: v >= 75 ? "#FFC53D" : "#9B6FDF" }} />
    </span>
    <span className="tabular-nums text-xs" style={{ color: v >= 75 ? "#FFC53D" : "#A78FC7" }}>{v}</span>
  </span>
);
