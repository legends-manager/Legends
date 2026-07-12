// src/components/BottomNav.jsx
// Navegação inferior persistente (padrão mobile) — aparece só nas telas de
// "consulta" durante uma temporada. Telas de fluxo (partida ao vivo,
// intervalo, resultado, fim de temporada, capa) NÃO mostram a barra: ali o
// caminho é linear de propósito.
// A aba "Jogar" é inteligente: volta pra onde o fluxo está (mercado aberto →
// mercado; temporada encerrada → tabela; senão → escalação, SEM resetar a
// escalação customizada — quem re-prepara é o irProximaRodada de sempre).
import { SIGLA } from "../data/times";

const barra = {
  background: "rgba(21,10,38,0.92)",
  backdropFilter: "blur(12px)",
  borderTop: "1px solid rgba(139,105,190,0.35)",
};

export default function BottomNav({ tela, setTela, irJogar, temCopa, meuTime }) {
  const abas = [
    { id: "inicio", rotulo: "Início", icone: "🏠", onClick: () => setTela("inicio"), ativa: false },
    {
      id: "jogar",
      rotulo: meuTime ? SIGLA[meuTime] : "Jogar",
      icone: "⚽",
      onClick: irJogar,
      ativa: tela === "escalacao" || tela === "mercado",
    },
    { id: "tabela", rotulo: "Tabela", icone: "📊", onClick: () => setTela("tabela"), ativa: tela === "tabela" || tela === "artilharia" },
    ...(temCopa ? [{ id: "copa", rotulo: "Copa", icone: "🏆", onClick: () => setTela("copa"), ativa: tela === "copa" }] : []),
    { id: "ranking", rotulo: "Ranking", icone: "🌐", onClick: () => setTela("ranking"), ativa: tela === "ranking" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40" style={barra}>
      <div className="max-w-md mx-auto flex">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={a.onClick}
            className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 text-[10px] font-bold"
            style={{ color: a.ativa ? "#FFC53D" : "#A78FC7" }}
          >
            <span className="text-base leading-none">{a.icone}</span>
            {a.rotulo}
          </button>
        ))}
      </div>
    </nav>
  );
}
