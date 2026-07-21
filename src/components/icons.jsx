// src/components/icons.jsx
// Ícones de sistema em SVG inline (REDESIGN_LEGENDS_MANAGER.md §4: "matar os
// emojis — prioridade máxima de percepção"). Mesmo traço do BottomNav.jsx —
// stroke simples, currentColor, viewBox 24x24 — pra herdar cor/tema em vez
// de depender do emoji pictórico da fonte do sistema (que varia entre
// Android/iOS/desktop e nunca combina com a paleta grafite/lime).
// Um arquivo único com todos, como o §4 pede — cresce conforme mais telas
// migrarem (BottomNav.jsx já tinha os seus próprios antes deste arquivo
// existir; não duplicados aqui pra não ter 2 fontes da verdade).
export function IconTrofeu({ size = 16, strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M9.5 20c0-2 1-3 2.5-3s2.5 1 2.5 3" />
    </svg>
  );
}

export function IconCaixa({ size = 32, strokeWidth = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
      <path d="M3.5 8.5v7L12 20l8.5-4.5v-7" />
      <path d="M12 13v7" />
    </svg>
  );
}

// "Permaneceu" (nem subiu, nem desceu — sóbrio de propósito, ver
// FimDeTemporada.jsx): escudo simples, sem coroa nem energia — estabilidade,
// não conquista.
export function IconEstavel({ size = 48, strokeWidth = 1.5 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" />
      <path d="M9 12h6" />
    </svg>
  );
}

// Selo da Semana Temática (C2.5, PLANO_GAMEFEEL_AAA §5): um ícone por tipo
// de semana (engine/semana.js SEMANAS), pra dar identidade visual ao evento
// rotativo — hoje era um card de texto idêntico aos outros.
export function IconBola({ size = 18, strokeWidth = 1.6 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.3 15.5 11l-1.3 4h-4.4L8.5 11 12 8.3Z" />
      <path d="M12 3.5v4.8M6.2 8.6l1.6 1M17.8 8.6l-1.6 1M9.3 19.4 10.6 15M14.7 19.4 13.4 15" />
    </svg>
  );
}

export function IconRaio({ size = 18, strokeWidth = 1.6 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3 5.5 13.5h5L11 21l7.5-10.5h-5L13 3Z" />
    </svg>
  );
}

export function IconConfete({ size = 18, strokeWidth = 1.6 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19 15.5 8.5" />
      <rect x="13.5" y="4.3" width="3.6" height="3.6" rx="0.8" transform="rotate(35 15.3 6.1)" />
      <path d="M4 13.5l2 2M17.5 3.5l2 2M18.5 12.5l1.7 1.7" />
      <circle cx="6.5" cy="9" r="1" />
      <circle cx="10.5" cy="19.5" r="1" />
    </svg>
  );
}
