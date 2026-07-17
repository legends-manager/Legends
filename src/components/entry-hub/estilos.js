// Tokens visuais do slice Entry & Career Hub (Task 05.1H) — espelham as
// variáveis congeladas do Figma "Polish Language v1" (seção 05.1, página 05):
// identidade grafite + lime, sem gradiente/glow/blur, sem superfície roxa.
// Escopo: SOMENTE os componentes de src/components/entry-hub/ usam isto —
// as demais telas do app continuam com o tema atual (ui.jsx) até seus
// próprios slices chegarem.
export const cores = {
  bgBase: "#1B1F24",       // bg/base
  bgSurface: "#242A31",    // bg/surface
  bgSurface2: "#2D343D",   // bg/surface-2
  bgField: "#20262D",      // bg/field
  lime: "#C6FF1E",         // brand/lime
  limeDim: "#8FBA16",      // brand/lime-dim
  inkOnLime: "#12160A",    // ink/on-lime — NUNCA branco sobre lime
  textPrimary: "#F4F7F9",  // text/primary
  textSecondary: "#AAB4BF",// text/secondary
  textMuted: "#8793A1",    // text/muted
  danger: "#FF4D4D",       // semantic/danger
  navy: "#141A2E",         // accent/navy
  steel: "#39424E",        // accent/steel
};

// Superfícies e controles compartilhados (inline styles, convenção do projeto).
export const superficie = {
  background: cores.bgSurface,
  border: `1px solid ${cores.steel}`,
  borderRadius: 10, // radius/card
  color: cores.textPrimary,
};

export const superficie2 = { ...superficie, background: cores.bgSurface2 };

export const botaoPrimario = {
  background: cores.lime,
  color: cores.inkOnLime,
  borderRadius: 999, // pill
  minHeight: 48,     // touch-target preferred
  fontWeight: 800,
};

export const botaoSecundario = {
  background: "transparent",
  color: cores.textPrimary,
  border: `1px solid ${cores.steel}`,
  borderRadius: 999,
  minHeight: 44, // touch-target mínimo
  fontWeight: 700,
};

export const eyebrowLime = {
  color: cores.lime,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

// Página inteira do slice: grafite cobrindo o viewport, escapando do
// max-w-md/px-4 do wrapper do App via margens negativas — sem tocar no
// App.jsx (o fundo global das OUTRAS telas não muda neste slice).
export const paginaGrafite = {
  background: cores.bgBase,
  color: cores.textPrimary,
  margin: "0 -1rem",
  padding: "0 1rem 16px", // safe area ≥16px no fim do conteúdo
  minHeight: "100vh",
  position: "relative", // ancora a camada decorativa (position:absolute, atrás do conteúdo)
  overflow: "hidden",    // decoração nunca cria overflow horizontal
};

// Conteúdo funcional de cada tela entra aqui, DEPOIS de <PolishDecor/>, pra
// ficar garantidamente acima da decoração mesmo ela sendo position:absolute
// (regra de pintura do CSS: absoluto com z-index:auto pinta depois do fluxo
// normal — por isso o conteúdo também precisa de position+zIndex explícitos).
export const conteudoAcimaDaDecor = { position: "relative", zIndex: 1 };

// Badge de sigla do clube (crest textual — sem escudos reais, decisão travada).
export const crest = (sm) => ({
  width: sm ? 36 : 52,
  height: sm ? 36 : 52,
  borderRadius: 10,
  background: cores.navy,
  border: `1px solid ${cores.steel}`,
  color: cores.textPrimary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: sm ? 12 : 15,
  flexShrink: 0,
});
