import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.jsx";
import "./index.css";

// Sem StrictMode: a demo não usa, e o double-invoke de efeitos em dev poderia
// duplicar o relógio/beep da partida — mantemos o comportamento idêntico.
createRoot(document.getElementById("root")).render(<App />);

// Vercel Web Analytics: contagem de visitantes/pageviews (nenhum dado
// pessoal, só o beacon padrão da Vercel). App SPA sem rotas — 1 evento por
// sessão é esperado; não rastreia troca de tela interna (S.tela). Roda só
// em produção (mode "production", o default do inject); em dev fica mudo.
inject();
