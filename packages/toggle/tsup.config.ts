import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "@adinkra/core"],
  // "use client" já está no topo de src/toggle.tsx, não só aqui — ver
  // DECISOES.md sobre por quê (o workspace consome o .tsx direto).
});
