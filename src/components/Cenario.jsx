// src/components/Cenario.jsx
// Camada de cenário compartilhada (PLANO_GAMEFEEL_AAA §6-B, C2.7): fundo fixo
// atrás de todo o conteúdo de uma tela-palco — a tela vira um LUGAR, não uma
// lista sobre grafite chapado. Scrim garante contraste AA (REDESIGN §5.6);
// vinheta radial foca o olho no herói da cena. Extraído da CenarioArena
// original da Partida ao vivo (C2.6) pra ser reusado por Escalação/Intervalo
// (vestiário), VS pré-jogo (túnel) e Copa (palco) — mesma gramática de cena
// em toda tela-palco, uma única linguagem visual.
export default function Cenario({ src, posicao = "center" }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: posicao }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(rgba(16,19,23,0.82), rgba(16,19,23,0.9) 55%, rgba(16,19,23,0.97))" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 90% 60% at 50% 32%, transparent, rgba(10,12,14,0.55))" }}
      />
    </div>
  );
}
