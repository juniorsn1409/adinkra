// Ver a nota equivalente em packages/switch/src/switch.tsx e DECISOES.md —
// o workspace consome este arquivo-fonte direto. Precisa de "use client" por
// causa do estado do grupo (useState) e do contexto (createContext).
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Grupo de opções exclusivas sobre `<input type="radio">` NATIVOS que
 * compartilham o mesmo `name` (`appearance-none` + bolinha irmã).
 * Por isso a navegação por setas, o "roving tabindex" (Tab entra só na opção
 * marcada), o pulo dos itens desativados e o envio em `<form>` já vêm do
 * navegador, sem Base UI e sem reimplementar nada — mesmo raciocínio do
 * Select, que também fica no nativo. O grupo só guarda o valor (controlado ou
 * não, mesmo contrato do Switch: `value`/`defaultValue`/`onValueChange`) e o
 * distribui aos itens por contexto.
 *
 * Visual igual ao Checkbox/Switch: círculo com borda de tinta e sombra dura,
 * cor `--card` → `--primary` ao marcar, e a bolinha de tinta entra com um
 * respiro de escala/opacidade (150ms, `--ease-out`).
 */

const radioGroupItemVariants = cva(
  [
    "peer m-0 flex-none cursor-pointer appearance-none rounded-full",
    "border-[length:var(--border-width)] border-ink bg-card shadow-brutal",
    "transition-colors duration-150",
    "checked:bg-primary",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:shadow-none",
    "data-[invalid=true]:border-destructive data-[invalid=true]:shadow-[2px_2px_0_0_var(--destructive)]",
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

const dotVariants = cva(
  [
    "pointer-events-none absolute inset-0 m-auto rounded-full bg-ink",
    "scale-50 opacity-0 transition-[opacity,scale] duration-150 ease-[var(--ease-out)]",
    "peer-checked:scale-100 peer-checked:opacity-100",
  ],
  {
    variants: {
      size: {
        sm: "size-1.5",
        md: "size-2",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  setValue: (value: string) => void;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size: "sm" | "md" | null | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "dir">,
    VariantProps<typeof radioGroupItemVariants> {
  /** Valor da opção marcada. Presente, o grupo é controlado: quem usa decide via `onValueChange`. */
  value?: string;
  /** Opção inicial, quando não controlado. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `name` dos inputs — vai no `<form>`. Padrão: um id gerado (necessário pra o navegador agrupar as opções). */
  name?: string;
  /** Desativa todas as opções. */
  disabled?: boolean;
  /** Torna a escolha obrigatória no `<form>`. */
  required?: boolean;
  /** Disposição das opções. */
  orientation?: "vertical" | "horizontal";
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      size,
      value,
      defaultValue,
      onValueChange,
      name,
      disabled = false,
      required = false,
      orientation = "vertical",
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedName = React.useId();
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;

    const setValue = React.useCallback(
      (next: string) => {
        if (!isControlled) setUncontrolledValue(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    const invalid = ariaInvalid === true || ariaInvalid === "true";

    const context = React.useMemo<RadioGroupContextValue>(
      () => ({ name: name ?? generatedName, value: currentValue, setValue, disabled, required, invalid, size }),
      [name, generatedName, currentValue, setValue, disabled, required, invalid, size],
    );

    return (
      <RadioGroupContext.Provider value={context}>
        <div
          ref={ref}
          role="radiogroup"
          aria-invalid={ariaInvalid}
          aria-required={required || undefined}
          aria-orientation={orientation}
          data-slot="radio-group"
          className={cn(
            orientation === "horizontal" ? "flex flex-wrap gap-x-5 gap-y-2.5" : "grid gap-2.5",
            className,
          )}
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  },
);

RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "checked" | "defaultChecked" | "onChange" | "name" | "value">,
    VariantProps<typeof radioGroupItemVariants> {
  /** Valor da opção — o que `onValueChange` recebe e o que vai no `<form>`. */
  value: string;
  /** Texto ao lado da bolinha, dentro de um `<label>` (o clique no texto também marca). */
  label?: React.ReactNode;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, size, value, label, disabled, ...props }, ref) => {
    const group = React.useContext(RadioGroupContext);
    if (!group) {
      throw new Error("RadioGroupItem precisa estar dentro de um <RadioGroup>.");
    }

    const itemSize = size ?? group.size;
    const isDisabled = group.disabled || disabled;

    const radio = (
      // Opacidade no invólucro (não no input): a bolinha, irmã do input, esmaece junto.
      <span data-slot="radio-group-item" className="relative inline-flex flex-none has-[:disabled]:opacity-45">
        <input
          ref={ref}
          type="radio"
          name={group.name}
          value={value}
          checked={group.value === value}
          onChange={() => group.setValue(value)}
          disabled={isDisabled}
          required={group.required}
          data-invalid={group.invalid}
          className={cn(radioGroupItemVariants({ size: itemSize }), className)}
          {...props}
        />
        <span aria-hidden="true" className={dotVariants({ size: itemSize })} />
      </span>
    );

    if (!label) return radio;

    return (
      <label
        data-slot="radio-group-item-label"
        className={cn("group inline-flex items-center gap-2.5", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}
      >
        {radio}
        <span className="text-sm leading-5 text-foreground group-has-[:disabled]:opacity-45">{label}</span>
      </label>
    );
  },
);

RadioGroupItem.displayName = "RadioGroupItem";

export { radioGroupItemVariants };
