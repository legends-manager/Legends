// src/components/BottomNav.jsx
// Navegação inferior persistente (padrão mobile) — aparece só nas telas de
// "consulta" durante uma temporada. Telas de fluxo (partida ao vivo,
// intervalo, resultado, fim de temporada, capa) NÃO mostram a barra: ali o
// caminho é linear de propósito.
// A aba "Jogar" é inteligente: volta pra onde o fluxo está (mercado aberto →
// mercado; temporada encerrada → tabela; senão → escalação, SEM resetar a
// escalação customizada — quem re-prepara é o irProximaRodada de sempre).
//
// Task 05.1H.1 (correção C): variante "polish" — tratamento visual grafite/
// lime congelado no Figma 05.1, usado SÓ quando `tela === "inicio"` (Central
// da Carreira). As demais telas (mercado, tabela, copa...) continuam com o
// visual "padrao" — nenhuma redesenhada por autorização desta tarefa. Mesma
// lógica de destinos/estado ativo nas duas variantes; só a apresentação muda.
import { SIGLA } from "../data/times";

const barraPadrao = {
  background: "rgba(21,10,38,0.92)",
  backdropFilter: "blur(12px)",
  borderTop: "1px solid rgba(139,105,190,0.35)",
};

// Grafite sólido (sem blur/gradiente/glow — regra do slice Polish).
const barraPolish = {
  background: "#242A31", // bg/surface
  borderTop: "1px solid #39424E", // accent/steel
};

// Ícones inline em SVG (sem emoji/caractere-texto como ícone — exigência da
// variante Polish). Traço simples, currentColor, 20x20.
const Icones = {
  inicio: (p) => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={p} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9h13v-9" />
    </svg>
  ),
  jogar: (p) => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={p} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v5M12 15.5v5M4.5 8l4.3 2.5M15.2 13.5l4.3 2.5M19.5 8l-4.3 2.5M8.8 13.5 4.5 16" />
    </svg>
  ),
  tabela: (p) => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={p} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M9.5 4v16" />
    </svg>
  ),
  copa: (p) => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={p} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><path d="M12 13v3M9 20h6M9.5 20c0-2 1-3 2.5-3s2.5 1 2.5 3" />
    </svg>
  ),
  ranking: (p) => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={p} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z" />
    </svg>
  ),
};

export default function BottomNav({ tela, setTela, irJogar, temCopa, meuTime, variante = "padrao" }) {
  const abas = [
    { id: "inicio", rotulo: "Início", icone: "inicio", onClick: () => setTela("inicio"), ativa: tela === "inicio" },
    {
      id: "jogar",
      rotulo: meuTime ? SIGLA[meuTime] : "Jogar",
      icone: "jogar",
      onClick: irJogar,
      ativa: tela === "escalacao" || tela === "mercado",
    },
    { id: "tabela", rotulo: "Tabela", icone: "tabela", onClick: () => setTela("tabela"), ativa: tela === "tabela" || tela === "artilharia" },
    ...(temCopa ? [{ id: "copa", rotulo: "Copa", icone: "copa", onClick: () => setTela("copa"), ativa: tela === "copa" }] : []),
    { id: "ranking", rotulo: "Ranking", icone: "ranking", onClick: () => setTela("ranking"), ativa: tela === "ranking" },
  ];

  const polish = variante === "polish";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40" style={polish ? barraPolish : barraPadrao}>
      <div className="max-w-md mx-auto flex" style={polish ? { paddingBottom: "max(0px, env(safe-area-inset-bottom))" } : undefined}>
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={a.onClick}
            className={polish ? "flex-1 flex flex-col items-center justify-center gap-1 active:opacity-80" : "flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 text-[10px] font-bold"}
            style={
              polish
                ? {
                    minHeight: 44, paddingTop: 8, paddingBottom: 8,
                    color: a.ativa ? "#12160A" : "#AAB4BF",
                    background: a.ativa ? "#C6FF1E" : "transparent",
                    borderRadius: a.ativa ? 10 : 0,
                    margin: a.ativa ? "4px 3px" : 0,
                    fontSize: 12, fontWeight: 800,
                  }
                : { color: a.ativa ? "#FFC53D" : "#A78FC7" }
            }
          >
            {polish ? Icones[a.icone](2) : <span className="text-base leading-none">{{
              inicio: "🏠", jogar: "⚽", tabela: "📊", copa: "🏆", ranking: "🌐",
            }[a.icone]}</span>}
            {a.rotulo}
          </button>
        ))}
      </div>
    </nav>
  );
}
