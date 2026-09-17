// Sem "use client": é um <button> nativo sem estado próprio. Quem chama
// decide o limite cliente/servidor (ex.: um onClick só existe se vier de
// dentro de uma árvore já client). Marcar aqui transformaria até
// buttonVariants (uma função pura) numa referência de cliente, impedindo
// chamá-la direto de um Server Component.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Decisão 4 (DECISOES.md): um só botão "primary" por tela — ele é a única
 * variante reservada à ação principal. As outras cobrem o resto da
 * hierarquia sem competir com ela.
 *
 * Direção neobrutalista (seção 4, DECISOES.md): toda variante, menos
 * "ghost", leva borda + sombra dura + três estados — padrão, hover (sobe e
 * a sombra cresce) e pressionado (desce e a sombra some). "ghost" fica de
 * propósito sem nada disso: é a válvula de escape para ação terciária.
 */
const brutal =
  "border-[length:var(--border-width)] border-ink shadow-brutal " +
  "hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-hover " +
  "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-display font-medium tracking-[0.05em]",
    "rounded-control",
    "transition-[transform,box-shadow,background-color,filter] duration-150",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  ],
  {
    variants: {
      variant: {
        primary: cn(brutal, "bg-primary text-primary-foreground hover:bg-primary-hover"),
        secondary: cn(brutal, "bg-secondary text-secondary-foreground hover:brightness-95"),
        outline: cn(brutal, "bg-transparent text-foreground hover:bg-surface"),
        destructive: cn(brutal, "bg-destructive text-destructive-foreground hover:brightness-90"),
        ghost: "border-transparent bg-transparent text-foreground hover:bg-surface",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
