// src/storage/sincronizacaoRegras.js
// Regras puras de QUANDO sincronizar com o ranking online — extraídas de
// App.jsx (auditoria técnica, Etapa A: testes de regressão/sincronização)
// para poderem ser testadas sem montar a árvore de componentes. Mesma
// semântica exata que já existia inline; nenhum comportamento novo.

// Chave que identifica "este usuário jogando com este time" — usada pelo
// guard de vínculo automático (App.jsx) pra não repetir a mesma chamada a
// cada re-render.
export function chaveVinculo(userId, meuTime) {
  if (!userId || !meuTime) return null;
  return `${userId}|${meuTime}`;
}

// Guard do vínculo automático: só deve executar se a chave atual for
// diferente da última chave já processada (inclui o caso "nunca processou
// nada ainda", chaveAnterior === null). Mesma lógica que estava inline no
// useEffect de App.jsx: `if (autoVinculadoRef.current === chave) return;`.
export function deveExecutarVinculoAutomatico(chaveAnterior, chaveAtual) {
  if (!chaveAtual) return false;
  return chaveAnterior !== chaveAtual;
}

// Periodicidade do checkpoint de progresso: a cada 3 rodadas fechadas.
// Mesma condição, byte-a-byte, que estava inline em finalizarRodada:
// `S.rodada % 3 === 0` — chamada sempre DEPOIS de `S.rodada++`, então na
// prática nunca é avaliada em rodada 0, mas a função preserva o mesmo
// comportamento do original para qualquer valor de entrada.
export function deveSincronizarProgresso(rodada) {
  return rodada % 3 === 0;
}
