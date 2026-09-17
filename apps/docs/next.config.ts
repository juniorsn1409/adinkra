import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes de componente exportam TypeScript direto de src/ (ver
  // DECISOES.md, seção 3) — o Next precisa saber para transpilar em vez de
  // tratá-los como node_modules já compilado.
  transpilePackages: [
    "@adinkra/core",
    "@adinkra/button",
    "@adinkra/card",
    "@adinkra/input",
    "@adinkra/badge",
    "@adinkra/skeleton",
    "@adinkra/sidebar",
    "@adinkra/theme-toggle",
  ],
};

export default nextConfig;
