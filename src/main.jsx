import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Sem StrictMode: a demo não usa, e o double-invoke de efeitos em dev poderia
// duplicar o relógio/beep da partida — mantemos o comportamento idêntico.
createRoot(document.getElementById("root")).render(<App />);
