import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Linha que separa conteúdo. Dois pesos:
 *  - `solid` (padrão): `--border-width` em `--ink`, o mesmo traço grosso que
 *    a Sidebar usa entre grupos — divide seções.
 *  - `subtle`: 1px em `--hairline`, o mesmo das divisões internas do
 *    DataTable — divide itens dentro de uma seção. `--hairline` é decorativo
 *    por definição (DECISOES.md, seção 4), então `subtle` deve ser usado
 *    com `decorative` (o padrão); não use pra marcar algo que só a linha
 *    comunica.
 *
 * Decorativo (padrão) vs. semântico: uma linha puramente visual não pode
 * aparecer na árvore de acessibilidade — vira `role="none"`. Só quando ela
 * marca uma divisão que faz sentido anunciar (ex.: entre dois grupos de uma
 * toolbar) passe `decorative={false}` e ganha `role="separator"` +
 * `aria-orientation`. (Sem `aria-orientation` a horizontal já é o padrão do
 * papel; escrevemos sempre pra ficar explícito.)
 *
 * A vertical não tem altura própria: preenche o pai (`self-stretch`) — o
 * pai precisa ser flex/grid ou ter altura definida.
 *
 * Sem "use client", sem hooks.
 */
const separatorVariants = cva("shrink-0", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "self-stretch",
    },
    weight: {
      solid: "bg-ink",
      subtle: "bg-hairline",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", weight: "solid", className: "h-[var(--border-width)]" },
    { orientation: "vertical", weight: "solid", className: "w-[var(--border-width)]" },
    { orientation: "horizontal", weight: "subtle", className: "h-px" },
    { orientation: "vertical", weight: "subtle", className: "w-px" },
  ],
  defaultVariants: { orientation: "horizontal", weight: "solid" },
});

export interface SeparatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof separatorVariants> {
  /** `true` (padrão): só visual, escondida de leitores de tela. `false`: `role="separator"`. */
  decorative?: boolean;
}

export function Separator({
  orientation = "horizontal",
  weight = "solid",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  const semantic = decorative
    ? ({ role: "none" } as const)
    : ({ role: "separator", "aria-orientation": orientation ?? "horizontal" } as const);
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      {...semantic}
      className={cn(separatorVariants({ orientation, weight }), className)}
      {...props}
    />
  );
}
