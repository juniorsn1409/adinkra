// Sem "use client": useId() é seguro em Server Components (é um dos hooks
// pensados para SSR), e o resto é repasse de props nativas. Ver o
// comentário equivalente em packages/button/src/button.tsx.
import * as React from "react";
import { cn } from "@adinkra/core";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo acima do campo. Sempre ligado por htmlFor/id — nunca placeholder-only. */
  label?: string;
  /** Texto de ajuda abaixo do campo. Some quando `error` está presente. */
  help?: string;
  /**
   * Mensagem de erro. Decisão 6 (DECISOES.md): diz o que deu errado e como
   * resolver ("Falta o final do e-mail, como ana@exemplo.com"), nunca só
   * "campo inválido". Ativa aria-invalid e a borda dupla em tomate.
   */
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, help, error, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;

    const describedByIds =
      [error ? errorId : help ? helpId : null, describedBy].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="font-display text-sm font-medium text-heading">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          className={cn(
            // h-9: mesma altura do Button md e do Select (antes o py-2 dava ~40px e desalinhava linhas de formulário).
            "h-9 w-full rounded-control border-[length:var(--border-width)] bg-card px-3 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "shadow-brutal transition-[border-color,box-shadow] duration-150",
            // Sem "pressionar": digitar não é um clique, não precisa do gesto tátil do botão.
            // Mesmo anel dos botões (outline --ring com respiro de 2px). Trocar só a cor da
            // borda de tinta pra --ring (marinho, quase igual à tinta) e crescer a sombra
            // não passava de 3:1 entre foco e repouso — ficava quase invisível.
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
            error ? "border-destructive shadow-[2px_2px_0_0_var(--destructive)]" : "border-ink",
            className,
          )}
          {...props}
        />
        {error ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 font-display text-xs font-medium text-destructive"
          >
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

Input.displayName = "Input";
