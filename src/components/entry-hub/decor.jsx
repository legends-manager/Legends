// Camada decorativa "Polish — Background layer" (Task 05.1H.1, correção A) —
// espelha em código os papéis de opacidade congelados no Figma 05.1 (seção
// "Systemic Decorative Opacity Correction", 05.1C): estruturas grafite/navy
// sólidas, diagonais lime/steel restritas, geometria de campo apagada e anéis
// de destaque em volta do crest. 100% apresentação: position:absolute,
// pointer-events:none, sem gradiente/glow/blur, sem asset externo.
//
// Papéis de opacidade (mesma tabela da 05.1C, aplicada aqui via CSS opacity):
//   A estrutural=1.00 · B overlay de cabeçalho=0.60 · C spotlight-zone=0.60 ·
//   D geometria de campo apagada=0.08 · E accent lime primário=0.35 ·
//   F accent lime secundário=0.20 · G accent steel=0.35 ·
//   H anel lime=0.18 · I anel steel/crest=0.50
import { cores } from "./estilos";

const base = { position: "absolute", pointerEvents: "none" };

function Superficie({ altura, cor, opacidade }) {
  // Papel A/B/C: superfície estrutural ou overlay de cabeçalho/spotlight.
  return (
    <div style={{ ...base, top: 0, left: 0, right: 0, height: altura, background: cor, opacity: opacidade, zIndex: 0 }} />
  );
}

function Diagonal({ cor, opacidade, top = -16, right = -18, largura = 4, altura = 140, rotacao = -24 }) {
  // Papel E/F/G: accent de energia — linha diagonal restrita, canto superior
  // direito (mesma posição relativa do vetor original no Figma).
  return (
    <div
      style={{
        ...base, top, right, width: largura, height: altura,
        background: cor, opacity: opacidade, borderRadius: 2,
        transform: `rotate(${rotacao}deg)`, zIndex: 0,
      }}
    />
  );
}

function Anel({ diametro, cor, opacidade, top, right, left }) {
  // Papel D/H/I: geometria de campo apagada ou anel de destaque — círculo só
  // com borda (sem preenchimento), nunca alvo de clique.
  return (
    <div
      style={{
        ...base, top, right, left, width: diametro, height: diametro, borderRadius: "50%",
        border: `2px solid ${cor}`, opacity: opacidade, zIndex: 0,
      }}
    />
  );
}

// Um invólucro por variante — cada tela chama exatamente uma vez, como
// primeiro filho do container relative+overflow:hidden.
export function PolishDecor({ variante }) {
  switch (variante) {
    case "entry-sem-carreira":
      return (
        <>
          <Superficie altura={220} cor={cores.navy} opacidade={1} />
          {/* Papel D — pitch circle, quase invisível, canto superior direito. */}
          <Anel diametro={160} cor={cores.textMuted} opacidade={0.08} top={-60} right={-40} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={0} right={40} />
          <Diagonal cor={cores.lime} opacidade={0.2} top={20} right={20} altura={100} />
        </>
      );
    case "entry-existente":
      return (
        <>
          <Superficie altura={140} cor={cores.navy} opacidade={1} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-10} right={30} />
          {/* Papel I — anel de crest, concêntrico ao badge do clube (ver telas.jsx: crest fica no topo-esquerda). */}
          <Anel diametro={68} cor={cores.steel} opacidade={0.5} top={22} left={20} />
        </>
      );
    case "divisao":
    case "clube":
      return (
        <>
          <Superficie altura={96} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-10} right={30} altura={90} />
        </>
      );
    case "confirmacao":
      return (
        <>
          <Superficie altura={190} cor={cores.navy} opacidade={0.6} />
          {/* Papéis H/I — anéis concêntricos em volta do crest (topo-esquerda). */}
          <Anel diametro={72} cor={cores.lime} opacidade={0.18} top={70} left={16} />
          <Anel diametro={62} cor={cores.steel} opacidade={0.5} top={75} left={21} />
        </>
      );
    case "hub-principal":
      return (
        <>
          <Superficie altura={108} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "hub-pendente":
      return (
        <>
          <Superficie altura={108} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.steel} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "escalacao":
      return (
        <>
          <Superficie altura={100} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "partida":
      return (
        <>
          <Superficie altura={100} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "intervalo":
      return (
        <>
          <Superficie altura={90} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.steel} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "resultado":
      return (
        <>
          <Superficie altura={90} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "mercado":
      return (
        <>
          <Superficie altura={90} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "tabela":
      return (
        <>
          <Superficie altura={80} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "artilharia":
      return (
        <>
          <Superficie altura={80} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.2} top={-20} right={30} altura={90} />
        </>
      );
    case "copa":
      // Tratamento de evento (REDESIGN_LEGENDS_MANAGER.md §5.10): superfície
      // mais alta e accent mais forte que as demais telas utilitárias — a
      // Copa é "uma partida, sem segunda chance".
      return (
        <>
          <Superficie altura={130} cor={cores.navy} opacidade={0.7} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={110} />
          <Diagonal cor={cores.lime} opacidade={0.2} top={0} right={10} altura={80} />
        </>
      );
    case "ranking":
      return (
        <>
          <Superficie altura={90} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.35} top={-20} right={30} altura={90} />
        </>
      );
    case "historia":
      return (
        <>
          <Superficie altura={80} cor={cores.navy} opacidade={0.6} />
          <Diagonal cor={cores.lime} opacidade={0.2} top={-20} right={30} altura={90} />
        </>
      );
    default:
      return null;
  }
}
