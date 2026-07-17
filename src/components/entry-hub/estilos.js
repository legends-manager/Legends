// Tokens visuais "Polish Language v1" — grafite + lime, sem superfície roxa.
// Nasceu no slice Entry & Career Hub (Task 05.1H) e agora é reaproveitado
// por outros slices conforme cada um migra (jul/2026: também usado por
// Escalação/Partida ao vivo/Intervalo/Resultado). Import direto de outras
// pastas de components/ é esperado — o nome da pasta "entry-hub" é histórico,
// não uma restrição de escopo.
// Glow (jul/2026, decisão de Felyp): a trava "sem gradiente/glow/blur" foi
// revogada — GLOW liberado, com escopo restrito a momentos de destaque
// (hero art, CTA de confirmação de carreira, celebração), nunca em telas de
// uso rotineiro (listas, tabelas). Gradiente/blur não foram mencionados na
// liberação — não presumir que também valem sem confirmar.
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
  success: "#2ECC71",      // semantic/success — distinto do lime da marca
  gold: "#FFC400",         // SOMENTE conquista: troféu, título, campeão, 1º
  silver: "#C0C8D0",       // 2º lugar
  bronze: "#CD8A4B",       // 3º lugar
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

// Variante com glow — reservada pro CTA de maior compromisso da jornada
// ("Iniciar carreira" na Confirmação). Não usar em botões de rotina.
export const botaoPrimarioGlow = {
  ...botaoPrimario,
  boxShadow: `0 0 28px rgba(198,255,30,0.45), 0 0 8px rgba(198,255,30,0.6)`,
};

// Glow de moldura — usado atrás de hero art (Entry) e do crest em telas de
// celebração. Raio contido pra não virar um "brilho" genérico de fundo.
export const glowLime = (raio = 36) => ({
  boxShadow: `0 0 ${raio}px rgba(198,255,30,0.35)`,
});

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
