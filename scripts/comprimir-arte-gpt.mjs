// scripts/comprimir-arte-gpt.mjs
// Comprime as artes do GPT Image (insígnias/mascote/fundos/avatares) pra
// WebP, mesmo padrão do scripts/comprimir-escudos.mjs. Fundos ficam maiores
// (usados full-bleed); o resto cabe em 512px (maior uso na tela é ~150px,
// margem pra telas 3x).
import sharp from "sharp";
import { readdirSync, statSync, unlinkSync, existsSync, renameSync } from "node:fs";
import { join, parse } from "node:path";

sharp.cache(false);

const ALVOS = [
  { dir: "public/insignias", largura: 512 },
  { dir: "public/mascote", largura: 768 },
  { dir: "public/fundos", largura: 1600 },
  { dir: "public/avatars", largura: 512 },
];

for (const { dir, largura } of ALVOS) {
  const base = new URL(`../${dir}/`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const arquivos = readdirSync(base).filter((f) => /\.(jpe?g|png)$/i.test(f));
  let totalAntes = 0, totalDepois = 0;
  for (const f of arquivos) {
    const origem = join(base, f);
    const { name } = parse(f);
    const destino = join(base, `${name}.webp`);
    const antes = statSync(origem).size;
    totalAntes += antes;
    await sharp(origem)
      .resize(largura, largura, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destino + ".tmp");
    if (existsSync(destino)) unlinkSync(destino);
    renameSync(destino + ".tmp", destino);
    unlinkSync(origem);
    const depois = statSync(destino).size;
    totalDepois += depois;
    console.log(`${dir}/${f} → ${name}.webp: ${(antes / 1024).toFixed(0)}KB → ${(depois / 1024).toFixed(0)}KB`);
  }
  console.log(`  ${dir}: ${(totalAntes / 1024).toFixed(0)}KB → ${(totalDepois / 1024).toFixed(0)}KB\n`);
}
