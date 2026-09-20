"use client";

import * as React from "react";
import { Toggle } from "@adinkra/toggle";
import { useLang } from "./language";

// Ícones pequenos demais pra virar API pública de um pacote — moram aqui e
// o Preview (que troca o tema só da própria caixa) reaproveita.
export function SunIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.5 9.7A5.8 5.8 0 0 1 6.3 2.5a.5.5 0 0 0-.65-.6A6.3 6.3 0 1 0 14.1 10.35a.5.5 0 0 0-.6-.65Z"
      />
    </svg>
  );
}

export const THEME_STORAGE_KEY = "adinkra-theme";

/**
 * Troca o tema do site inteiro: `data-theme` no <html>, que os tokens de
 * @adinkra/tokens já sabem ler. O padrão é sempre o claro (mesmo com o
 * sistema no escuro); só a escolha explícita daqui muda isso, e fica guardada
 * no localStorage. O script em app/layout.tsx aplica o valor salvo antes do
 * primeiro paint, pra não piscar o tema claro.
 */
export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);
  const { t } = useLang();

  React.useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function handleChange(pressed: boolean) {
    setDark(pressed);
    const theme = pressed ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage bloqueado (modo privado, por exemplo): o tema vale só nesta visita.
    }
  }

  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={dark}
      onPressedChange={handleChange}
      aria-label={dark ? t("theme.toLight") : t("theme.toDark")}
    >
      {dark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Toggle>
  );
}
