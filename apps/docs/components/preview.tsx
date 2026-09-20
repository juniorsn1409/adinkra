"use client";

import * as React from "react";
import { Toggle } from "@adinkra/toggle";
import { useLang } from "./language";
import { MoonIcon, SunIcon } from "./theme-toggle";

// O toggle aqui embaixo controla só esta caixa (via data-theme na própria
// div, não em document.documentElement) — o do site inteiro é o ThemeToggle
// da barra do topo. Os tokens de [data-theme="dark"] em @adinkra/tokens
// servem aos dois: este preview mostra cada componente em dia e noite lado
// a lado (seção 3, DECISOES.md).

/**
 * Preview ao vivo do componente de verdade (não print), com um toggle de
 * tema — o preview de cada componente precisa mostrar dia e noite, não só
 * um dos dois (anatomia de página, DECISOES.md seção 3). Abre sempre em
 * claro, no mesmo padrão do resto do site.
 *
 * É o único bloco de documentação que precisa de "use client" de verdade
 * (useState). Fica no próprio arquivo, exportado sozinho — nunca dentro de
 * um objeto (ver comentário em mdx-components.tsx sobre por quê).
 */
export function Preview({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const { t } = useLang();

  return (
    <div className="grid gap-2">
      <div
        data-theme={theme}
        className="flex min-h-32 w-full items-start justify-start rounded-card border-[length:var(--border-width)] border-ink bg-background p-8 text-foreground shadow-brutal"
      >
        {children}
      </div>
      <div className="flex justify-end">
        <Toggle
          variant="outline"
          size="sm"
          pressed={theme === "dark"}
          onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
          aria-label={theme === "light" ? t("docs.previewToDark") : t("docs.previewToLight")}
        >
          {theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
        </Toggle>
      </div>
    </div>
  );
}
