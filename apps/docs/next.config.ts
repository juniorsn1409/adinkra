import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Base UI rc.0 chama ReactDOM.flushSync() dentro de useLayoutEffect no
  // ToastRoot para calcular alturas de animação — isso dispara um warning
  // de Strict Mode em dev ("flushSync inside lifecycle method"). Sem versão
  // mais nova disponível (rc.0 é a latest em 09/2026), desativamos o Strict
  // Mode aqui até o Base UI corrigir o problema internamente.
  reactStrictMode: false,

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
