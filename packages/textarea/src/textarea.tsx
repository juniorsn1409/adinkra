// Sem "use client": só repasse de props nativas, nenhum hook (mesma regra do Input).
import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * Campo de texto de várias linhas — mesma gramática do Input (borda de tinta,
 * sombra dura, sem gesto de "pressionar": digitar não é um clique), só que com
 * altura mínima e redimensionável na vertical. Não traz rótulo nem mensagem
 * próprios: envolva com `<Field>` de `@adinkra/field` (ele injeta
 * `id`/`aria-describedby`/`aria-invalid`), ou use `aria-label`. O estado de
 * erro sai de `aria-invalid`, então funciona com ou sem o Field.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="textarea"
      className={cn(
        // min-h-20 (80px): cabe ~3 linhas de text-sm; `rows` só cresce a partir daí.
        "block min-h-20 w-full resize-y rounded-control border-[length:var(--border-width)] border-ink bg-card px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "shadow-brutal transition-[border-color,box-shadow] duration-150",
        // Mesmo anel de Button/Input/Select (outline --ring com respiro de 2px).
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:resize-none disabled:opacity-45 disabled:shadow-none",
        // Erro: mesma proporção do Input (sombra de 2px em tomate).
        "aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_0_var(--destructive)]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
