import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Todo irmão @adinkra/* fica de fora do bundle (são dependências próprias).
  external: ["react", /^@adinkra\//, "@base-ui-components/react"],
});
