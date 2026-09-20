"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover";
import { cn } from "@adinkra/core";

/**
 * Mesmo padrão do @adinkra/navigation-menu: Base UI por baixo (posicionamento
 * flutuante/portal), cores e vocabulário adaptados pros nossos tokens. Painel
 * único (não repetido em grade) — leva borda+raio, mas SEM a sombra dura
 * (`shadow-brutal`) que o resto dos "cartões únicos" do sistema tem: pedido
 * do usuário, que via a sombra como uma linha estranha depois da seta de
 * navegação do Calendar (confirmado com print — "depois da arrow tem uma
 * linha da pra tirar ela?"). Como o Popover é compartilhado, isso também
 * tira a sombra do dropdown do `@adinkra/data-table` (`SelectCell`), não só
 * dos date pickers.
 *
 * `PopoverPrimitive.Root` não renderiza elemento DOM próprio (só contexto),
 * então o `container` do Portal (mesma armadilha do @adinkra/navigation-menu:
 * portal escapa de qualquer `data-theme` que não esteja no <html>) é achado
 * a partir do DOM do Trigger — o único pedaço da árvore garantido montado
 * antes do painel abrir.
 */
const PopoverContainerContext = React.createContext<{
  container: HTMLElement | null;
  register: (node: HTMLElement | null) => void;
} | null>(null);

function Popover({
  children,
  ...props
}: Omit<React.ComponentProps<typeof PopoverPrimitive.Root>, "children"> & { children?: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const register = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <PopoverPrimitive.Root data-slot="popover" {...props}>
      <PopoverContainerContext.Provider value={{ container, register }}>{children}</PopoverContainerContext.Provider>
    </PopoverPrimitive.Root>
  );
}

function PopoverTrigger({ ref, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const ctx = React.useContext(PopoverContainerContext);
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      ref={(node: HTMLElement | null) => {
        ctx?.register(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Positioner>, "align" | "alignOffset" | "side" | "sideOffset">) {
  const ctx = React.useContext(PopoverContainerContext);
  return (
    <PopoverPrimitive.Portal container={ctx?.container ?? undefined}>
      <PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "w-auto rounded-control border-[length:var(--border-width)] border-ink bg-surface p-0 text-foreground outline-none",
            // Nasce do gatilho (origin vem do Base UI) e some mais rápido do
            // que entra — abrir é o gesto do usuário, fechar é só limpeza.
            "origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-[var(--ease-out)]",
            "data-starting-style:scale-[0.96] data-starting-style:opacity-0",
            "data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-100",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
