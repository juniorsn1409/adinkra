// Sem "use client": <select> nativo sem estado próprio (mesma regra do Input).
// Nativo de propósito: teclado, leitor de tela e seletor do celular já
// funcionam de graça, e nada disso precisaria ser reconstruído.
import * as React from "react";
import { cn } from "@adinkra/core";

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Rótulo acima do campo. Sempre ligado por htmlFor/id. */
  label?: string;
  /** Texto de ajuda abaixo do campo. Some quando `error` está presente. */
  help?: string;
  /** Mensagem de erro: diz o que deu errado e como resolver (decisão 6). */
  error?: string;
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, id, label, help, error, children, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const helpId = `${selectId}-help`;
    const errorId = `${selectId}-error`;

    const describedByIds =
      [error ? errorId : help ? helpId : null, describedBy].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-1.5">
        {label ? (
          <label htmlFor={selectId} className="font-display text-sm font-medium text-heading">
            {label}
          </label>
        ) : null}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedByIds}
            className={cn(
              "peer h-9 w-full cursor-pointer appearance-none rounded-control border-[length:var(--border-width)] bg-card py-0 pl-3 pr-9 text-sm text-foreground",
              "shadow-brutal transition-[border-color,box-shadow] duration-150",
              "focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[4px_4px_0_0_var(--ring)]",
              "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
              error ? "border-destructive shadow-[4px_4px_0_0_var(--destructive)]" : "border-ink",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground peer-disabled:opacity-45" />
        </div>
        {error ? (
          <p id={errorId} className="flex items-center gap-1.5 font-display text-xs font-medium text-destructive">
            <span
              aria-hidden="true"
              className="grid h-4 w-4 flex-none place-items-center rounded-full bg-destructive text-[0.6875rem] text-destructive-foreground"
            >
              !
            </span>
            {error}
          </p>
        ) : help ? (
          <p id={helpId} className="font-display text-xs text-muted-foreground">
            {help}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";

export const SelectOption = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, ...props }, ref) => <option ref={ref} className={cn("bg-surface text-foreground", className)} {...props} />,
);
SelectOption.displayName = "SelectOption";

export const SelectOptGroup = React.forwardRef<HTMLOptGroupElement, React.OptgroupHTMLAttributes<HTMLOptGroupElement>>(
  ({ className, ...props }, ref) => <optgroup ref={ref} className={cn("bg-surface text-muted-foreground", className)} {...props} />,
);
SelectOptGroup.displayName = "SelectOptGroup";
