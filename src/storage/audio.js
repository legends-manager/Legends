// src/storage/audio.js
// Camada de áudio compartilhada (Fase 3 item 10, PLANO_MESTRE §5): efeitos
// reais em public/sfx/ (ElevenLabs, jul/2026) pra gol/apito/chute; um
// "ding" leve sintetizado via Web Audio pra desbloqueios comuns/raros —
// não vale gastar um arquivo real de torcida pra um evento tão frequente,
// e o contraste (ding sintético vs. torcida real gravada) já reforça a
// raridade tanto quanto a cor/glow visual fazem. Tudo respeita o mudo;
// nunca lança (autoplay bloqueado, AudioContext indisponível etc. são
// engolidos, mesmo contrato do tocarSfx que já existia em App.jsx).
export function tocarSfx(caminho, mudo, volume = 1) {
  if (mudo) return;
  try {
    const a = new Audio(caminho);
    a.volume = volume;
    a.play().catch(() => {});
  } catch (e) { /* sem áudio, sem drama */ }
}

let _ctx = null;
function contexto() {
  if (_ctx) return _ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  _ctx = new AC();
  return _ctx;
}

// "Ding" ascendente de 2 notas — feedback leve pra desbloqueios comuns/raros,
// sem depender de nenhum arquivo.
export function tocarDing(mudo) {
  if (mudo) return;
  try {
    const ctx = contexto();
    if (!ctx) return;
    const tocarNota = (freq, inicio, duracao) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + duracao);
    };
    tocarNota(660, 0, 0.15);
    tocarNota(880, 0.1, 0.25);
  } catch (e) { /* sem áudio, sem drama */ }
}

// Haptics (C1.5, PLANO_GAMEFEEL_AAA §3.4): vibração tátil onde suportado
// (Android/Chrome; iOS ignora em silêncio — fallback natural). Decisão de
// projeto já estabelecida no gol (App.jsx beep): mudo silencia SOM, não
// tato — vibração é canal separado, então não recebe `mudo`.
// Padrões: 15 = tick de toggle; [30,50,80] = celebração épico/lendário.
export function vibrar(padrao) {
  try {
    if (navigator.vibrate) navigator.vibrate(padrao);
  } catch (e) { /* sem vibração, sem drama */ }
}

// Som por raridade/tier (insígnias e pacotinhos, Fase 3 item 10): comum/raro
// = ding sintético; épico/lendário = torcida real gravada + vibração de
// celebração — quanto mais raro o momento, mais físico o feedback.
export function tocarSomTier(tier, mudo) {
  if (tier === "epico" || tier === "lendario") {
    tocarSfx("/sfx/torcida-gol.mp3", mudo, 0.8);
    vibrar([30, 50, 80]);
  } else {
    tocarDing(mudo);
  }
}
