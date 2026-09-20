import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Alinhamento óptico: o `tracking` também deixa um vão depois da última
 * letra, então o texto parece deslocado pra esquerda dentro do selo. O
 * padding esquerdo ganha o mesmo 0.14em pra compensar.
 *
 * Toda variante leva a borda de tinta do neobrutalismo (seção 4,
 * DECISOES.md) — mas nunca a sombra dura nem os estados de hover/pressionado
 * dos componentes clicáveis: um Badge não é interativo, e simular esse
 * gesto aqui enganaria quem usa teclado ou leitor de tela.
 *
 * `--brand` (o coral de marca, `#CB5A2A`) não é uma variante daqui: no
 * texto pequeno do selo (11px), nem branco nem tinta passam no AA em cima
 * dele (regra 3, DECISOES.md). `tag-coral` usa `--tag-coral`, um coral mais
 * escuro feito exatamente para isso — ver regra 8.
 *
 * `primary` (17/09, laranja do redesign sidebar.io) virou o padrão, no
 * lugar de `accent` — pedido do usuário, mesma leva que trocou o "ligado"
 * do Toggle e o submenu aberto da Sidebar. `accent` continua disponível.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-control border-[length:var(--border-width)] border-ink py-0.5 pl-[calc(0.5rem+0.14em)] pr-2 font-display text-[0.6875rem] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-transparent text-foreground",
        "tag-coral": "bg-tag-coral text-tag-coral-foreground",
        "tag-sky": "bg-tag-sky text-tag-sky-foreground",
        "tag-mustard": "bg-tag-mustard text-tag-mustard-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
