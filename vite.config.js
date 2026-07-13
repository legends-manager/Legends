import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Versão do app exposta em runtime como __APP_VERSION__ (Etapa B da
// auditoria técnica — logs de sincronização incluem a versão pra saber em
// qual build um erro relatado aconteceu). Lida de package.json direto, sem
// depender de import.meta.env (que só cobre VITE_* do .env).
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: "node",
  },
});
