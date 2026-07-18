// src/storage/backup.js
// Backup do save em arquivo (ideia aprovada pelo Felyp, jul/2026): o jogo é
// 100% localStorage — limpou o navegador, perdeu a carreira. Exportar gera
// um .json com TODAS as chaves do app (saves por série, mundo, conquistas,
// métricas); importar restaura por cima. Sem backend, o arquivo nasce e
// morre no aparelho do jogador (mesma filosofia dos cards de share).

const PREFIXO = "legends-manager:";
const VERSAO_BACKUP = 1;

export function exportarBackup() {
  const dados = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const chave = window.localStorage.key(i);
    if (chave && chave.startsWith(PREFIXO)) dados[chave] = window.localStorage.getItem(chave);
  }
  const blob = new Blob(
    [JSON.stringify({ app: "legends-manager", versaoBackup: VERSAO_BACKUP, em: new Date().toISOString(), dados }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `legends-manager-backup-${data}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return Object.keys(dados).length;
}

// Restaura um backup. Retorna { ok, quantas } ou { ok: false, erro }.
// Só escreve chaves com o prefixo do app — um arquivo malicioso/errado não
// consegue poluir nada fora do namespace legends-manager:*.
export async function importarBackup(arquivo) {
  try {
    const texto = await arquivo.text();
    const json = JSON.parse(texto);
    if (json?.app !== "legends-manager" || typeof json.dados !== "object" || json.dados === null) {
      return { ok: false, erro: "Esse arquivo não parece um backup do Legends Manager." };
    }
    const entradas = Object.entries(json.dados).filter(
      ([chave, valor]) => chave.startsWith(PREFIXO) && typeof valor === "string",
    );
    if (entradas.length === 0) return { ok: false, erro: "Backup vazio — nada pra restaurar." };
    entradas.forEach(([chave, valor]) => window.localStorage.setItem(chave, valor));
    return { ok: true, quantas: entradas.length };
  } catch (e) {
    return { ok: false, erro: "Não consegui ler o arquivo — confere se é o .json do backup." };
  }
}
