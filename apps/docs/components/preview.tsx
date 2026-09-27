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
 *
 * Medidas do canvas (27/09/2026): a caixa ocupa a coluna inteira (987 no
 * desktop) com 377 de altura mínima (233 no mobile), padding 34 (21 no
 * mobile) e o componente centrado nos dois eixos. Altura mínima, não fixa:
 * as demos maiores (Data Table, Charts, Date Picker) crescem em vez de
 * serem cortadas. O botão dia/noite fica 8 abaixo, à direita: quadrado de
 * 34, outline com a sombra de 3, lua/sol de 13.
 *
 * `flush` tira o padding e estica o filho até as bordas, com altura fixa de
 * 377 (233 no mobile) — para demos que são uma "tela" inteira, como a
 * SidebarShowcase.
 */
export function Preview({ children, flush = false }: { children: React.ReactNode; flush?: boolean }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const { t } = useLang();

  return (
    <div className="grid gap-3">
      <div
        data-theme={theme}
        className={
          "flex w-full rounded-card border-[length:var(--border-width)] border-ink bg-background text-foreground shadow-brutal " +
          (flush
            ? "h-[233px] items-stretch justify-start overflow-hidden md:h-[377px]"
            : "min-h-[233px] items-center justify-center p-5 md:min-h-[377px] md:p-6")
        }
      >
        {children}
      </div>
      <div className="flex justify-end">
        <Toggle
          variant="outline"
          size="sm"
          className="w-[34px] px-0"
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
