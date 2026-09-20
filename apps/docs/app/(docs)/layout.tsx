import type { ReactNode } from "react";
import { DocsShell } from "../../components/docs-shell";

// Layout compartilhado por Introduction, Getting Started, Símbolos e
// Componentes: a sidebar vive aqui, então persiste entre essas rotas em vez
// de desmontar e remontar a cada navegação.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
