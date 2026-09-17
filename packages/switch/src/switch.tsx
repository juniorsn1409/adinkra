// Ver a nota equivalente em packages/toggle/src/toggle.tsx e DECISOES.md —
// o workspace consome este arquivo-fonte direto, então a diretiva precisa
// estar aqui, não só no comentário do tsup.config.ts.
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Alternativa a uma checkbox — um `<button role="switch">` de verdade (não
 * um `<input type="checkbox">` disfarçado), seguindo o padrão de switch da
 * WAI-ARIA APG. A trilha nunca perde a borda/sombra dura (mesmo tratamento
 * quieto do Input — sem o gesto de "subir no hover", pequeno demais pra
 * isso), só troca de cor; o polegar desliza via `translate-x`, calculado
 * pra bater exatamente na escala de espaçamento do Tailwind (sem valor
 * arbitrário): a trilha tem `px-[3px]` de respiro interno, e o percurso do
 * polegar é (largura útil − seu próprio tamanho), que dá 12px no `sm` e
 * 16px no `md` — por isso `translate-x-3`/`translate-x-4`, não números
 * soltos.
 */

const switchVariants = cva(
  [
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full px-[3px]",
    "border-[length:var(--border-width)] border-ink shadow-brutal",
    "transition-colors duration-150",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "data-[state=unchecked]:bg-card data-[state=checked]:bg-primary",
  ],
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const switchThumbVariants = cva(
  [
    "pointer-events-none block rounded-full bg-ink",
    "transition-transform duration-150",
    "data-[state=unchecked]:translate-x-0",
  ],
  {
    variants: {
      size: {
        sm: "size-3 data-[state=checked]:translate-x-3",
        md: "size-4 data-[state=checked]:translate-x-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof switchVariants> {
  /** Estado controlado. Quando presente, quem usa decide o próximo valor via `onCheckedChange`. */
  checked?: boolean;
  /** Estado inicial, quando não controlado. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { className, size, checked, defaultChecked = false, onCheckedChange, onClick, type = "button", ...props },
    ref,
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolledChecked;
    const state = isChecked ? "checked" : "unchecked";

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !isChecked;
      if (!isControlled) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    }

    return (
      <button
        ref={ref}
        type={type}
        role="switch"
        aria-checked={isChecked}
        data-slot="switch"
        data-state={state}
        className={cn(switchVariants({ size }), className)}
        onClick={handleClick}
        {...props}
      >
        <span data-slot="switch-thumb" data-state={state} className={switchThumbVariants({ size })} />
      </button>
    );
  },
);

Switch.displayName = "Switch";

export { switchVariants, switchThumbVariants };
