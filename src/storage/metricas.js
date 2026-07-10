// src/storage/metricas.js
// Métricas locais deste aparelho — matéria-prima do mídia kit pra
// patrocinadores (dica 7 da pesquisa de mercado). SEM backend: cada aparelho
// conta o próprio uso e o Felyp agrega manualmente perguntando no grupo /
// olhando o próprio celular. Nunca sai do localStorage, nenhum dado pessoal.
const CHAVE = "legends-manager:metricas-v1";

const VAZIO = { partidasJogadas: 0, temporadasConcluidas: 0, printsCompartilhados: 0 };

export function carregarMetricas() {
  try {
    const raw = window.localStorage.getItem(CHAVE);
    return raw ? { ...VAZIO, ...JSON.parse(raw) } : { ...VAZIO };
  } catch (e) {
    return { ...VAZIO };
  }
}

export function incrementarMetrica(nome) {
  try {
    const m = carregarMetricas();
    m[nome] = (m[nome] || 0) + 1;
    window.localStorage.setItem(CHAVE, JSON.stringify(m));
  } catch (e) {
    /* sem storage, sem métrica — o jogo segue */
  }
}
