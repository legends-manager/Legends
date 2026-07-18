// src/components/Crest.jsx
// Escudo do time — mostra a arte real quando existe (data/times.js: CRESTS,
// só Série B/C por enquanto, enviados por Felyp jul/2026), cai pro crachá
// com a sigla (data/times.js: SIGLA) quando não existe ainda (Série A, ou
// qualquer time sem asset) — nunca quebra, mesmo se o arquivo falhar ao
// carregar. Substitui os ~10 `<div style={crest(sm)}>{SIGLA...}</div>`
// espalhados pelas telas por um único componente.
import { useState } from "react";
import { SIGLA, CRESTS } from "../data/times";
import { crest } from "./entry-hub/estilos";

export default function Crest({ time, sm }) {
  const [erro, setErro] = useState(false);
  const src = CRESTS[time];
  if (src && !erro) {
    return (
      <img
        src={src}
        alt={time}
        onError={() => setErro(true)}
        style={{ ...crest(sm), objectFit: "contain" }}
      />
    );
  }
  const sigla = SIGLA[time] || (time || "").slice(0, 3).toUpperCase();
  return <div style={crest(sm)}>{sigla}</div>;
}
