import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Marca do alerta: uma pastilha com borda de tinta e um ícone de FORMATO
 * próprio por variante (balão, círculo, triângulo, octógono). É o que impede
 * o alerta de depender só da cor (regra 7, DECISOES.md: `--destructive`
 * nunca sozinho; e ~1 em 12 homens é daltônico — decisão 5).
 *
 * O corpo do alerta fica sempre em `--card` com `--foreground`/`--heading`
 * (texto com contraste de sobra nos dois temas); a cor de estado mora só
 * na pastilha, onde cada par fundo/ícone é o par de contraste que o sistema
 * já mediu: `--tag-sky`/`--tag-mustard` com o texto escuro deles (5.5 e
 * 8.1), `--destructive` com `--destructive-foreground` (5.69 no dia, 4.96
 * no noite) e, no padrão, `--heading` com `--background` (invertem juntos).
 * Não há variante "sucesso": o sistema não tem verde (DECISOES.md, seção 9).
 *
 * Sem "use client": só <svg>/<span>, e este arquivo é importado também pelo
 * @adinkra/toast.
 */
const alertIconVariants = cva(
  "inline-flex size-8 shrink-0 items-center justify-center rounded-control border-[length:var(--border-width)] border-ink",
  {
    variants: {
      variant: {
        default: "bg-heading text-background",
        info: "bg-tag-sky text-tag-sky-foreground",
        warning: "bg-tag-mustard text-tag-mustard-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type AlertVariant = NonNullable<VariantProps<typeof alertIconVariants>["variant"]>;

const svgProps = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "size-4",
} as const;

// Um formato por variante — nunca só a cor diferencia.
const glyphs: Record<AlertVariant, React.ReactNode> = {
  // balão de fala
  default: (
    <svg {...svgProps}>
      <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
    </svg>
  ),
  // círculo com "i"
  info: (
    <svg {...svgProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v3.5M8 5v.01" />
    </svg>
  ),
  // triângulo com "!"
  warning: (
    <svg {...svgProps}>
      <path d="M8 2.5 14 13H2z" />
      <path d="M8 6.5v3M8 11.2v.01" />
    </svg>
  ),
  // octógono com "!" (placa de pare)
  destructive: (
    <svg {...svgProps}>
      <path d="M5.2 2h5.6L14 5.2v5.6L10.8 14H5.2L2 10.8V5.2z" />
      <path d="M8 5v3.5M8 10.7v.01" />
    </svg>
  ),
};

export interface AlertIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: AlertVariant | null;
}

/** Pastilha com o ícone da variante. Decorativa (`aria-hidden`): o texto do alerta já diz tudo. */
export function AlertIcon({ variant, className, children, ...props }: AlertIconProps) {
  const v = variant ?? "default";
  return (
    <span
      data-slot="alert-icon"
      aria-hidden="true"
      className={cn(alertIconVariants({ variant: v }), className)}
      {...props}
    >
      {children ?? glyphs[v]}
    </span>
  );
}
