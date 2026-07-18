// scripts/comprimir-escudos.mjs
// Comprime os escudos de public/crests/ pra WebP 256x256 (teto de 200KB por
// asset do REDESIGN_LEGENDS_MANAGER.md §8 — na prática ficam ~10-30KB).
// Uso: node scripts/comprimir-escudos.mjs
// Gera <SIGLA>.webp ao lado do original; a troca das extensões no mapa
// CRESTS (data/times.js) é feita junto no mesmo commit. Os originais são
// removidos depois da conversão bem-sucedida (o arquivo-fonte continua em
// art/, que é a pasta de origem do Felyp — nada se perde).
import sharp from "sharp";
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join, parse } from "node:path";

const DIR = new URL("../public/crests/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// sharp mantém o arquivo-fonte aberto em cache — no Windows isso trava o
// unlink/rename de uma fonte .webp que também é o destino (EBUSY).
sharp.cache(false);

const arquivos = readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp|jfif|jpg)$/i.test(f))
  // Já comprimido numa rodada anterior (webp pequeno): pula — o script é
  // re-executável sem re-processar o que já está no alvo.
  .filter((f) => !(/\.webp$/i.test(f) && statSync(join(DIR, f)).size < 100 * 1024));
let totalAntes = 0, totalDepois = 0;

for (const f of arquivos) {
  const origem = join(DIR, f);
  const { name, ext } = parse(f);
  const destino = join(DIR, `${name}.webp`);
  const antes = statSync(origem).size;
  totalAntes += antes;

  // "cover" num quadrado 256 — todos os crests são exibidos em 36-52px,
  // 256 dá margem de sobra pra telas 3x sem pesar.
  await sharp(origem)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destino + ".tmp");

  // sharp não sobrescreve a própria fonte; troca via fs. No Windows, rename
  // por cima de arquivo existente (fonte já .webp) dá EPERM — remove antes.
  const { renameSync, existsSync } = await import("node:fs");
  if (existsSync(destino)) unlinkSync(destino);
  renameSync(destino + ".tmp", destino);

  const depois = statSync(destino).size;
  totalDepois += depois;
  if (ext.toLowerCase() !== ".webp") unlinkSync(origem);
  console.log(`${f} → ${name}.webp: ${(antes / 1024).toFixed(0)}KB → ${(depois / 1024).toFixed(0)}KB`);
}

console.log(`\nTotal: ${(totalAntes / 1024).toFixed(0)}KB → ${(totalDepois / 1024).toFixed(0)}KB`);
