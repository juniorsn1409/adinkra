import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "@adinkra/core", "@adinkra/button", "@adinkra/popover", "@base-ui-components/react", "react-day-picker"],
});
