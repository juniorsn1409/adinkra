"use client";

import * as React from "react";
import { Toggle } from "@adinkra/toggle";

// Ícones locais, só pra este botão — pequenos demais pra virar API pública
// de um pacote. O toggle aqui embaixo controla só esta caixa (via
// data-theme na própria div, não em document.documentElement): desde que
// @adinkra/theme-toggle foi apagado (15/09/2026, pedido do usuário — não
// sobrou nenhum jeito de trocar o tema do SITE inteiro), este é o único
// toggle de tema que resta, e é local de propósito. Os tokens de
// [data-theme="dark"] continuam em @adinkra/tokens porque este preview
// depende deles pra mostrar cada componente em dia e noite lado a lado
// (seção 3, DECISOES.md) — não foram apagados junto com o pacote.
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.3" />
      <path
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        d="M8 1v1.2M8 13.8V15M15 8h-1.2M2.2 8H1M12.6 3.4l-.85.85M4.25 11.75l-.85.85M12.6 12.6l-.85-.85M4.25 4.25l-.85-.85"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.5 9.7A5.8 5.8 0 0 1 6.3 2.5a.5.5 0 0 0-.65-.6A6.3 6.3 0 1 0 14.1 10.35a.5.5 0 0 0-.6-.65Z"
      />
    </svg>
  );
}

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
          aria-label={theme === "light" ? "Mostrar esta caixa no escuro" : "Mostrar esta caixa no claro"}
        >
          {theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
        </Toggle>
      </div>
    </div>
  );
}
