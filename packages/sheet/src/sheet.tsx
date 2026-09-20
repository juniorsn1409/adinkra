"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui-components/react/dialog";
import { cn } from "@adinkra/core";

/**
 * Gaveta lateral (20/09/2026) — o mesmo Dialog do Base UI (foco preso, Esc,
 * clique no fundo, inerte no resto da página) só que colada numa borda da
 * tela. Serve pra conteúdo secundário que não merece uma página: filtros,
 * carrinho, detalhes de um item, menu no celular.
 *
 * Nota: a gaveta mobile do @adinkra/sidebar tem implementação própria e NÃO
 * foi refatorada pra usar esta — fica pra uma rodada futura.
 *
 * Visual: borda de tinta só na aresta voltada pro conteúdo (as outras três
 * encostam na tela), sem sombra dura — uma sombra deslocada pra baixo/direita
 * ficaria cortada pela borda da janela. Fundo `bg-card`.
 *
 * Movimento (frequência: ocasional, propósito: consistência espacial — sai
 * de onde entrou): desliza em `translate` de 100% do próprio tamanho (nunca
 * pixels fixos, então serve pra qualquer largura/altura) com `--ease-drawer`.
 * Entra em 300ms, sai em 250ms. O fundo só faz fade. Só `translate`/`opacity`
 * animam. `prefers-reduced-motion` já é tratado globalmente em @adinkra/tokens.
 *
 * Mesmo truque de container do @adinkra/dialog/popover (armadilha 4,
 * DECISOES.md): o Portal é levado pro ancestral `[data-theme]` do Trigger.
 */
const SheetContainerContext = React.createContext<{
  container: HTMLElement | null;
  register: (node: HTMLElement | null) => void;
} | null>(null);

function Sheet({
  children,
  ...props
}: Omit<React.ComponentProps<typeof SheetPrimitive.Root>, "children"> & { children?: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const register = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <SheetPrimitive.Root {...props}>
      <SheetContainerContext.Provider value={{ container, register }}>{children}</SheetContainerContext.Provider>
    </SheetPrimitive.Root>
  );
}

function SheetTrigger({ ref, ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  const ctx = React.useContext(SheetContainerContext);
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      ref={(node: HTMLElement | null) => {
        ctx?.register(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      {...props}
    />
  );
}

/**
 * Cada lado: onde gruda, qual aresta leva a borda e pra onde escorrega
 * (`data-starting-style` = antes de entrar, `data-ending-style` = ao sair —
 * os dois apontam pra mesma borda, então entra e sai pelo mesmo caminho).
 */
const sheetSides = {
  right: cn(
    "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l-[length:var(--border-width)]",
    "data-starting-style:translate-x-full data-ending-style:translate-x-full",
  ),
  left: cn(
    "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r-[length:var(--border-width)]",
    "data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
  ),
  top: cn(
    "inset-x-0 top-0 h-auto max-h-[85dvh] border-b-[length:var(--border-width)]",
    "data-starting-style:-translate-y-full data-ending-style:-translate-y-full",
  ),
  bottom: cn(
    "inset-x-0 bottom-0 h-auto max-h-[85dvh] border-t-[length:var(--border-width)]",
    "data-starting-style:translate-y-full data-ending-style:translate-y-full",
  ),
} as const;

type SheetSide = keyof typeof sheetSides;

// Mesmo traço (viewBox 16x16, strokeWidth 1.3) dos outros ícones de controle.
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  container,
  showClose = true,
  closeLabel = "Fechar",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Popup> &
  Pick<React.ComponentProps<typeof SheetPrimitive.Portal>, "container"> & {
    /** Borda da tela onde a gaveta gruda — e por onde entra e sai. */
    side?: SheetSide;
    /** Mostra o botão "X" no canto. */
    showClose?: boolean;
    /** Nome acessível do botão "X". */
    closeLabel?: string;
  }) {
  const ctx = React.useContext(SheetContainerContext);
  return (
    <SheetPrimitive.Portal container={container ?? ctx?.container ?? undefined}>
      <SheetPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className={cn(
          "fixed inset-0 z-50 bg-background/80",
          "transition-opacity duration-300 ease-[var(--ease-out)]",
          "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-250",
        )}
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto",
          "border-ink bg-card p-6 text-foreground outline-none",
          "transition-[translate] duration-300 ease-[var(--ease-drawer)] data-ending-style:duration-250",
          sheetSides[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <SheetPrimitive.Close
            data-slot="sheet-close-icon"
            aria-label={closeLabel}
            className={cn(
              "absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-control text-foreground",
              "transition-colors hover:bg-surface",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <CloseIcon />
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  // `pr-8` reserva o espaço do "X" pro título longo não passar por baixo dele.
  return <div data-slot="sheet-header" className={cn("grid gap-1.5 pr-8", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-xl font-semibold leading-snug text-heading", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  // `mt-auto` empurra o rodapé pro fim da gaveta lateral, que tem a altura toda.
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/** Fecha a gaveta. Sem estilo próprio: use `render={<Button variant="outline" />}`. */
function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose };
