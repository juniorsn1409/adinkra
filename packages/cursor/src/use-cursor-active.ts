"use client";

import * as React from "react";

/**
 * Liga o "modo cursor customizado": injeta `cursor:none` global (via
 * `<style>`, não `el.style.cursor` elemento por elemento — cobre conteúdo
 * dinâmico que ainda nem existe no mount) e devolve `true` só quando é
 * seguro desenhar o overlay. Compartilhado entre todo cursor do pacote
 * (`BigCircleCursor`, `MotionBlurCursor`, ...) pra não duplicar as mesmas
 * três checagens em cada um.
 *
 * `false` em três casos, sempre com o cursor nativo do sistema intacto:
 * - **antes de montar** (`useState`+`useEffect`, mesmo padrão do antigo
 *   `ThemeToggle`) — depende de `window`/`matchMedia`, incompatível com SSR;
 * - **toque** (`pointer: coarse`) — não existe cursor nenhum pra substituir;
 * - **`prefers-reduced-motion: reduce`** (regra 8-9 do sistema).
 *
 * Só mantenha UM cursor montado por vez — dois ao mesmo tempo disputam a
 * mesma classe `adinkra-cursor-active` no `<html>`, e desmontar um deles
 * remove essa classe mesmo com o outro ainda ativo.
 */
export function useCursorActive(): boolean {
  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const style = document.createElement("style");
    style.textContent = "html.adinkra-cursor-active, html.adinkra-cursor-active * { cursor: none !important; }";
    document.head.appendChild(style);
    document.documentElement.classList.add("adinkra-cursor-active");
    setActive(true);

    return () => {
      document.documentElement.classList.remove("adinkra-cursor-active");
      style.remove();
      setActive(false);
    };
  }, [mounted]);

  return active;
}
