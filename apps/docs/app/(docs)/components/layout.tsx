import type { ReactNode } from "react";
import { GlitchCursor } from "@adinkra/cursor";

// GlitchCursor já é "use client" por conta própria — este layout continua
// Server Component, mesmo raciocínio do BigCircleCursor na home
// (app/page.tsx): o cursor customizado fica restrito à seção de
// componentes, não o site inteiro, com limpeza automática ao sair da
// rota (useEffect do próprio GlitchCursor). Cores default (--primary
// laranja / --brand coral) não precisam de override.
export default function ComponentsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GlitchCursor />
      {children}
    </>
  );
}
