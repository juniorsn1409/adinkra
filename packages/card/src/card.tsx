import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Contêiner com a mecânica neobrutalista padrão (seção 4, DECISOES.md):
 * borda de tinta + sombra dura sempre — é o que dá a "cara" de cartão neste
 * sistema, diferente de shadcn puro. Sem elas seria só uma caixa arredondada.
 *
 * `interactive` liga os três estados do Button (sobe no hover, afunda ao
 * pressionar) — para cards que na prática são um link/botão grande, um
 * cartão de produto clicável, por exemplo. Sem `interactive`, o cartão é só
 * um contêiner: quem for torná-lo clicável embrulha o conteúdo num link e
 * decide o próprio comportamento de foco.
 */
const cardVariants = cva(
  [
    "flex flex-col gap-6 rounded-card border-[length:var(--border-width)] border-ink",
    "bg-card py-6 text-foreground shadow-brutal",
    "transition-[transform,box-shadow] duration-150",
  ],
  {
    variants: {
      interactive: {
        true: [
          "cursor-pointer",
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover",
          "active:translate-x-1 active:translate-y-1 active:shadow-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        ],
        false: "",
      },
    },
    defaultVariants: { interactive: false },
  },
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    tabIndex={interactive ? 0 : undefined}
    className={cn(cardVariants({ interactive }), className)}
    {...props}
  />
));
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min grid-cols-[1fr_auto] items-start gap-1.5 px-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-display text-base font-semibold leading-none text-heading", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Slot opcional no canto superior direito do CardHeader (um menu, um botão de fechar). */
export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-2 px-6", className)} {...props} />;
}
