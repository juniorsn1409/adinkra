"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover";
import { cn } from "@adinkra/core";

/**
 * Extraído do `@adinkra/date-picker` (20/09/2026), onde nasceu escondido —
 * o `@adinkra/data-table` já reaproveitava esse mesmo Popover pro dropdown
 * da célula "select", então virou pacote próprio. O date-picker continua
 * re-exportando Popover/PopoverTrigger/PopoverContent do seu index.
 *
 * Mesmo padrão do @adinkra/navigation-menu: Base UI por baixo (posicionamento
 * flutuante/portal), cores e vocabulário adaptados pros nossos tokens. Painel
 * único (não repetido em grade) — leva borda+raio, mas SEM a sombra dura
 * (`shadow-brutal`) que o resto dos "cartões únicos" do sistema tem: pedido
 * do usuário, que via a sombra como uma linha estranha depois da seta de
 * navegação do Calendar. O padding padrão é 0 de propósito (Calendar,
 * listas de opções e afins trazem o próprio espaçamento) — quem quer
 * respiro passa `className="p-4"` (o `cn` resolve o conflito).
 *
 * `PopoverPrimitive.Root` não renderiza elemento DOM próprio (só contexto),
 * então o `container` do Portal (mesma armadilha do @adinkra/navigation-menu:
 * portal escapa de qualquer `data-theme` que não esteja no <html>) é achado
 * a partir do DOM do Trigger — o único pedaço da árvore garantido montado
 * antes do painel abrir. Popover aberto por código, sem Trigger, cai no
 * <body> (ou use a prop `container` do PopoverContent).
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
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Positioner>, "align" | "alignOffset" | "side" | "sideOffset"> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Portal>, "container">) {
  const ctx = React.useContext(PopoverContainerContext);
  return (
    <PopoverPrimitive.Portal container={container ?? ctx?.container ?? undefined}>
      <PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "w-auto rounded-control border-[length:var(--border-width)] border-ink bg-surface p-0 text-foreground outline-none",
            // Nasce do gatilho (origin vem do Base UI) e some mais rápido do
            // que entra — abrir é o gesto do usuário, fechar é só limpeza.
            // Tailwind v4 aplica `scale-*` na propriedade `scale` (não em
            // `transform`), então ela precisa constar da lista de transição —
            // senão só o fade anima e a escala estala.
            "origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-[var(--ease-out)]",
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

/** Título do painel — o Base UI liga ele ao `aria-labelledby` do Popup. */
function PopoverTitle({ className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Title>) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-display text-base font-semibold text-heading", className)}
      {...props}
    />
  );
}

/** Descrição do painel — vira o `aria-describedby` do Popup. */
function PopoverDescription({ className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Description>) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Fecha o painel. Sem estilo próprio: use `render={<Button ... />}`. */
function PopoverClose(props: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription, PopoverClose };
