// Helper de teste (Task 05.1G): localStorage falso e isolado pro ambiente
// node do vitest (vite.config.js: test.environment = "node" — não existe
// window). saveGame.js fala com window.localStorage; aqui instalamos um
// window mínimo com um Map por trás, e devolvemos utilitários pra inspecionar
// exatamente quais chaves foram tocadas (asserções de isolamento).
// Escopo estritamente de teste — nenhum código de produção depende disto.

export function criarFakeLocalStorage() {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
    clear: () => { dados.clear(); },
    chaves: () => [...dados.keys()],
    _dados: dados,
  };
}

// Instala window.localStorage falso; devolve { storage, restaurar }.
// Uso: const { storage, restaurar } = instalarWindowComStorage(); ... restaurar();
export function instalarWindowComStorage() {
  const storage = criarFakeLocalStorage();
  const windowOriginal = globalThis.window;
  globalThis.window = { localStorage: storage };
  return {
    storage,
    restaurar: () => {
      if (windowOriginal === undefined) delete globalThis.window;
      else globalThis.window = windowOriginal;
    },
  };
}
