"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * true abaixo de 768px. Começa `false` (não `undefined`) de propósito — a
 * primeira renderização no servidor não tem como saber a largura da tela,
 * então assume desktop; o efeito corrige depois de montar, no cliente. Numa
 * tela pequena isso pode gerar um instante de layout de desktop antes de
 * trocar pra gaveta — o mesmo compromisso que o hook equivalente do
 * shadcn/ui assume.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
