// O banner do tsup.config.ts não cobre o consumo direto do workspace
// (package.json aponta "exports" pra src/index.ts) — a diretiva precisa
// estar aqui também. Ver a armadilha equivalente em
// packages/sidebar/src/sidebar.tsx e DECISOES.md.
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Botão de dois estados que persiste (Negrito/Itálico numa barra de
 * ferramentas, por exemplo) — diferente de um clique disparando uma ação.
 * Por isso o gesto "sobe no hover, afunda ao pressionar" da mecânica
 * neobrutalista (seção 4, DECISOES.md) aqui não é passageiro: `data-state`
 * decide se o botão fica "afundado" (borda de tinta, fundo `--primary`
 * laranja — 17/09, era `--secondary` — deslocado, sem sombra) o tempo
 * todo, não só durante o clique. Desligado, o
 * variant `default` descansa como o `ghost` do Button (sem borda) até o
 * hover convidar ao clique.
 */

const toggleVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-control",
    "border-[length:var(--border-width)]",
    "font-display text-sm font-medium",
    "transition-[transform,box-shadow,background-color,border-color] duration-150",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "data-[state=on]:border-ink data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
    "data-[state=on]:translate-x-0.5 data-[state=on]:translate-y-0.5 data-[state=on]:shadow-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-transparent text-foreground",
          "data-[state=off]:hover:border-ink data-[state=off]:hover:bg-surface data-[state=off]:hover:shadow-brutal",
          "data-[state=off]:hover:-translate-x-px data-[state=off]:hover:-translate-y-px",
        ],
        outline: [
          "border-ink bg-transparent text-foreground shadow-brutal",
          "data-[state=off]:hover:bg-surface data-[state=off]:hover:shadow-brutal-hover",
          "data-[state=off]:hover:-translate-x-px data-[state=off]:hover:-translate-y-px",
        ],
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        md: "h-9 px-3 text-sm",
        lg: "h-11 px-4 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof toggleVariants> {
  /** Estado controlado. Quando presente, quem usa decide o próximo valor via `onPressedChange`. */
  pressed?: boolean;
  /** Estado inicial, quando não controlado. */
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      variant,
      size,
      pressed,
      defaultPressed = false,
      onPressedChange,
      onClick,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const [uncontrolledPressed, setUncontrolledPressed] = React.useState(defaultPressed);
    const isControlled = pressed !== undefined;
    const isPressed = isControlled ? pressed : uncontrolledPressed;

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !isPressed;
      if (!isControlled) setUncontrolledPressed(next);
      onPressedChange?.(next);
    }

    return (
      <button
        ref={ref}
        type={type}
        data-slot="toggle"
        data-state={isPressed ? "on" : "off"}
        aria-pressed={isPressed}
        className={cn(toggleVariants({ variant, size }), className)}
        onClick={handleClick}
        {...props}
      />
    );
  },
);

Toggle.displayName = "Toggle";

export { toggleVariants };
