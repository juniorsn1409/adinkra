import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "@adinkra/core"],
  // "use client" já está escrito no topo de src/sidebar.tsx, não só aqui —
  // ver o comentário lá sobre por quê (o workspace consome o .tsx direto,
  // sem passar pelo build).
});
