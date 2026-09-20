// Ver a nota equivalente em packages/switch/src/switch.tsx e DECISOES.md —
// o workspace consome este arquivo-fonte direto, então a diretiva precisa
// estar aqui. Aqui o hook é useLayoutEffect (sincroniza `indeterminate`, que
// só existe como propriedade do DOM, nunca como atributo HTML).
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Caixa de seleção sobre um `<input type="checkbox">` NATIVO (com
 * `appearance-none`) — diferente do Switch, que é um `<button role="switch">`.
 * Aqui o nativo é a escolha certa: teclado (Espaço), leitor de tela
 * (`aria-checked="mixed"` sai sozinho do estado indeterminado do DOM),
 * envio em `<form>` e `:checked`/`:indeterminate` de graça. O check e o traço
 * são SVGs irmãos do input (`peer-*`), porque `<input>` não aceita filhos.
 *
 * Mesmo tratamento quieto do Input/Switch: borda de tinta + sombra dura sempre,
 * sem o gesto de "subir no hover" — pequena demais pra isso. Só a cor muda
 * (`--card` → `--primary`) e o ícone entra com um respiro de escala/opacidade
 * (150ms, `--ease-out`): é feedback do toque, sem chegar a chamar atenção.
 */

const checkboxVariants = cva(
  [
    "peer m-0 flex-none cursor-pointer appearance-none rounded-control",
    "border-[length:var(--border-width)] border-ink bg-card shadow-brutal",
    "transition-colors duration-150",
    "checked:bg-primary indeterminate:bg-primary",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_0_var(--destructive)]",
  ],
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const iconVariants = cva(
  [
    "pointer-events-none absolute inset-0 m-auto text-primary-foreground",
    "scale-50 opacity-0 transition-[opacity,scale] duration-150 ease-[var(--ease-out)]",
  ],
  {
    variants: {
      size: {
        sm: "size-2.5",
        md: "size-3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "checked" | "defaultChecked" | "onChange">,
    VariantProps<typeof checkboxVariants> {
  /** Estado controlado. Quando presente, quem usa decide o próximo valor via `onCheckedChange`. */
  checked?: boolean;
  /** Estado inicial, quando não controlado. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Estado "misto" (ex.: "selecionar tudo" com só parte marcada). Vence o
   * `checked` na aparência e é anunciado como `mixed`. Quem usa decide quando
   * ligar/desligar — o clique do usuário só chama `onCheckedChange`.
   */
  indeterminate?: boolean;
  /** Texto ao lado da caixa, dentro de um `<label>` (o clique no texto também alterna). */
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, size, checked, defaultChecked, onCheckedChange, indeterminate = false, label, disabled, ...props },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // `indeterminate` não é atributo HTML: só dá pra ligar pela propriedade do DOM.
    React.useLayoutEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    });

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      onCheckedChange?.(event.target.checked);
      // O navegador apaga o estado misto ao clicar; devolvemos o que a prop diz.
      // Se quem usa mudar a prop, o effect acima acerta no mesmo render.
      event.target.indeterminate = indeterminate;
    }

    const box = (
      // Opacidade no invólucro (não no input): o check/traço, irmãos do input, esmaecem junto.
      <span data-slot="checkbox" className="relative inline-flex flex-none has-[:disabled]:opacity-45">
        <input
          ref={setRefs}
          type="checkbox"
          checked={checked}
          defaultChecked={checked === undefined ? (defaultChecked ?? false) : undefined}
          disabled={disabled}
          onChange={handleChange}
          className={cn(checkboxVariants({ size }), className)}
          {...props}
        />
        {/* Check: some no estado misto (o traço assume). `:not(:indeterminate)` é o que separa os dois. */}
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn(
            iconVariants({ size }),
            "peer-[:checked:not(:indeterminate)]:scale-100 peer-[:checked:not(:indeterminate)]:opacity-100",
          )}
        >
          <path d="M2 6.5 4.75 9.25 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn(iconVariants({ size }), "peer-indeterminate:scale-100 peer-indeterminate:opacity-100")}
        >
          <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );

    if (!label) return box;

    return (
      <label
        data-slot="checkbox-label"
        className={cn("group inline-flex items-center gap-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}
      >
        {box}
        <span className="text-sm leading-5 text-foreground group-has-[:disabled]:opacity-45">{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { checkboxVariants };
