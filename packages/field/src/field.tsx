// Sem "use client": só useId() (seguro em Server Components) e cloneElement —
// nenhum hook de estado. Ver o comentário equivalente em packages/input/src/input.tsx.
import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * Field envolve QUALQUER controle (Input, Select, Textarea, Checkbox,
 * RadioGroup…) com rótulo, ajuda e erro, ligando tudo por id/aria — a mesma
 * mecânica que Input e Select já trazem embutida (label + help + error), só
 * que separada do controle. Assim um Checkbox ou um RadioGroup ganha o mesmo
 * tratamento sem cada pacote reimplementar. A decisão 6 (DECISOES.md) vale
 * aqui igual: o erro diz o que deu errado e como resolver.
 */

const labelClass = "font-display text-sm font-medium leading-5 text-heading";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Só sinal visual (asterisco). Marque também o próprio controle com `required`. */
  required?: boolean;
}

/** Rótulo isolado, mesmo estilo do que Input/Select usam por dentro. */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} data-slot="label" className={cn(labelClass, className)} {...props}>
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5">
          *
        </span>
      ) : null}
    </label>
  ),
);

Label.displayName = "Label";

export type FieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-description"
      className={cn("font-display text-xs text-muted-foreground", className)}
      {...props}
    />
  ),
);

FieldDescription.displayName = "FieldDescription";

export type FieldErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/** Mensagem de erro com o ícone "!" (decisão 7: tomate nunca sozinho — sempre ícone + texto). */
export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-error"
      className={cn("flex items-center gap-1.5 font-display text-xs font-medium text-destructive", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="grid h-4 w-4 flex-none place-items-center rounded-full bg-destructive text-[0.6875rem] text-destructive-foreground"
      >
        !
      </span>
      {children}
    </p>
  ),
);

FieldError.displayName = "FieldError";

/** Props que o Field entrega ao controle (por cloneElement ou pela função em `children`). */
export interface FieldControlProps {
  /** Ausente no modo `group` — o rótulo aponta pro grupo por `aria-labelledby`. */
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo. Vira `<label htmlFor>` (ou o título do grupo, com `group`). */
  label?: React.ReactNode;
  /** Texto de ajuda. Some quando `error` está presente (igual ao Input). */
  description?: React.ReactNode;
  /** Mensagem de erro: ativa `aria-invalid` no controle e a borda em tomate. */
  error?: React.ReactNode;
  /** Só sinal visual (asterisco) no rótulo. */
  required?: boolean;
  /**
   * `vertical` (padrão): rótulo acima do controle — campos de texto.
   * `horizontal`: controle à esquerda, texto à direita — Checkbox, Switch.
   */
  orientation?: "vertical" | "horizontal";
  /**
   * O controle é um grupo (RadioGroup, lista de Checkbox): o rótulo não pode
   * ser `<label htmlFor>` (não há um input só), então o Field liga por
   * `aria-labelledby`.
   */
  group?: boolean;
  /** Id do controle. Padrão: o `id` do próprio filho, ou um gerado. */
  id?: string;
  /**
   * Um único elemento (recebe `id`/`aria-*` por cloneElement) ou uma função
   * que devolve o JSX — use a função quando o controle não é o filho direto
   * (ex. uma lista de Checkbox dentro de um `<div role="group">`).
   */
  children: React.ReactElement | ((control: FieldControlProps) => React.ReactNode);
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    { className, label, description, error, required, orientation = "vertical", group, id, children, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const childId = React.isValidElement<{ id?: string }>(children) ? children.props.id : undefined;
    const baseId = id ?? childId ?? generatedId;
    const labelId = `${baseId}-label`;
    const descriptionId = `${baseId}-description`;
    const errorId = `${baseId}-error`;

    const messageId = error ? errorId : description ? descriptionId : undefined;

    const control: FieldControlProps = {
      ...(group ? { "aria-labelledby": label ? labelId : undefined } : { id: baseId }),
      "aria-describedby": messageId,
      "aria-invalid": error ? true : undefined,
    };

    let content: React.ReactNode;
    if (typeof children === "function") {
      content = children(control);
    } else {
      const childProps = children.props as Record<string, unknown>;
      const inheritedDescribedBy = childProps["aria-describedby"] as string | undefined;
      content = React.cloneElement(children, {
        ...control,
        "aria-describedby": [messageId, inheritedDescribedBy].filter(Boolean).join(" ") || undefined,
        "aria-invalid": control["aria-invalid"] ?? childProps["aria-invalid"],
      } as Record<string, unknown>);
    }

    const labelNode = label ? (
      group ? (
        <span id={labelId} className={labelClass}>
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5">
              *
            </span>
          ) : null}
        </span>
      ) : (
        <Label htmlFor={baseId} required={required}>
          {label}
        </Label>
      )
    ) : null;

    const messages = (
      <>
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
        {!error && description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      </>
    );

    if (orientation === "horizontal") {
      return (
        <div
          ref={ref}
          data-slot="field"
          data-orientation="horizontal"
          data-invalid={error ? "" : undefined}
          className={cn("flex items-start gap-2.5", className)}
          {...props}
        >
          {/* h-5 = altura da 1ª linha do rótulo: o controle centra nela, não no bloco todo. */}
          <div className="flex h-5 flex-none items-center">{content}</div>
          <div className="grid gap-1">
            {labelNode}
            {messages}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-slot="field"
        data-orientation="vertical"
        data-invalid={error ? "" : undefined}
        className={cn("grid gap-1.5", className)}
        {...props}
      >
        {labelNode}
        {content}
        {messages}
      </div>
    );
  },
);

Field.displayName = "Field";
