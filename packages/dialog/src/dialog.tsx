"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";
import { cn } from "@adinkra/core";

/**
 * Janela modal (20/09/2026). Base UI por baixo: foco preso enquanto aberta,
 * Esc fecha, clique no fundo fecha, o resto da página fica inerte e o foco
 * volta pro gatilho ao fechar. Nada disso é reimplementado aqui.
 *
 * Visual: "cartão único" do sistema — borda `--border-width` de tinta, raio
 * `rounded-card` e sombra dura de 5 (`shadow-brutal-hover`), sobre `bg-card`.
 * Medidas φ (27/09/2026): largura 610, padding 34, título 26/34, descrição
 * 16/26, ações com gap 13, "X" = botão ghost só-ícone de 34. Sem estados de
 * hover/pressionado no painel (não é uma superfície clicável). O fundo
 * (backdrop) é tinta a 61.8% (`bg-ink/[0.618]`, 1/φ) — sem inventar cor fora
 * dos tokens; `--ink` inverte com o tema.
 *
 * Movimento (frequência: ocasional, propósito: evitar a troca brusca):
 * fade + escala 0.96→1 em 200ms com `--ease-out`; saída em 150ms (fechar é só
 * limpeza). Diferente do Popover, o painel NÃO nasce do gatilho — modal fica
 * centralizado, então a origem da escala é o centro. O fundo só faz fade.
 * `prefers-reduced-motion` já é tratado globalmente em @adinkra/tokens.
 *
 * `Dialog.Root` não renderiza DOM próprio, então o `container` do Portal
 * (armadilha 4, DECISOES.md: o portal escapa de qualquer `data-theme` que não
 * esteja no <html>) é achado a partir do DOM do Trigger via
 * `.closest("[data-theme]")` — mesmo truque do @adinkra/popover. Dialog
 * controlado e aberto por código, sem Trigger, cai no <body>; nesse caso use
 * a prop `container` do DialogContent.
 */
const DialogContainerContext = React.createContext<{
  container: HTMLElement | null;
  register: (node: HTMLElement | null) => void;
} | null>(null);

function Dialog({
  children,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "children"> & { children?: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const register = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <DialogPrimitive.Root {...props}>
      <DialogContainerContext.Provider value={{ container, register }}>{children}</DialogContainerContext.Provider>
    </DialogPrimitive.Root>
  );
}

function DialogTrigger({ ref, ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const ctx = React.useContext(DialogContainerContext);
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      ref={(node: HTMLElement | null) => {
        ctx?.register(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      {...props}
    />
  );
}

// Mesmo traço (viewBox 16x16, strokeWidth 1.3) dos outros ícones de controle.
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DialogContent({
  className,
  children,
  container,
  showClose = true,
  closeLabel = "Fechar",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> &
  Pick<React.ComponentProps<typeof DialogPrimitive.Portal>, "container"> & {
    /** Mostra o botão "X" no canto. Desligue só se houver outra saída óbvia (um DialogClose no rodapé). */
    showClose?: boolean;
    /** Nome acessível do botão "X". */
    closeLabel?: string;
  }) {
  const ctx = React.useContext(DialogContainerContext);
  return (
    <DialogPrimitive.Portal container={container ?? ctx?.container ?? undefined}>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className={cn(
          "fixed inset-0 z-50 bg-ink/[0.618]",
          "transition-opacity duration-200 ease-[var(--ease-out)]",
          "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-150",
        )}
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Centralizado com `translate` (propriedade própria no Tailwind v4) —
          // não briga com o `scale` da animação abaixo.
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "grid w-[calc(100%-42px)] max-w-[610px] gap-5 max-h-[calc(100dvh-42px)] overflow-y-auto",
          "rounded-card border-[length:var(--border-width)] border-ink bg-card p-6 text-foreground shadow-brutal-hover outline-none",
          // Só `opacity` e `scale` animam (nunca layout). Tailwind v4 aplica
          // `scale-*` na propriedade `scale`, por isso ela está na lista.
          "transition-[opacity,scale] duration-200 ease-[var(--ease-out)]",
          "data-starting-style:scale-[0.96] data-starting-style:opacity-0",
          "data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-150",
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            data-slot="dialog-close-icon"
            aria-label={closeLabel}
            className={cn(
              "absolute right-4 top-4 inline-flex size-6 items-center justify-center rounded-control text-foreground",
              "transition-colors hover:bg-surface",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
            )}
          >
            <CloseIcon />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  // `pr-5` (21) reserva o espaço do "X" (34, a 13 da borda: invade 13 além
  // do padding de 34) pro título longo não passar por baixo dele.
  return <div data-slot="dialog-header" className={cn("grid gap-3 pr-5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-display text-xl font-semibold text-heading", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  // No celular os botões empilham com a ação principal por cima (col-reverse
  // + a ordem do DOM: cancelar antes, confirmar depois); de sm pra cima
  // ficam em linha, alinhados à direita.
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/** Fecha o diálogo. Sem estilo próprio: use `render={<Button variant="outline" />}`. */
function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };
