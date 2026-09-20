import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Indicador de carregamento: um anel com um arco de tinta
 * girando. É um loop FUNCIONAL (diz "estou trabalhando"), não enfeite — por
 * isso é a única animação contínua do sistema além do Skeleton.
 *
 * O anel é a própria borda: trilha em `--hairline` (decorativa, só mostra o
 * percurso) e arco em `--ink`, que passa de sobra o 3:1 de elemento gráfico
 * sobre `--background`/`--card` nos dois temas (`--ink` = `--heading`,
 * 16.2:1 no dia). Sem cor de ação: um spinner não é botão.
 *
 * Reduced motion: o `tokens.css` zera a duração de TODA animação com
 * `!important` (então `animate-spin` viraria uma tremida de 0.01ms). Um
 * `motion-reduce:animate-pulse!` — também `!important`, mas dentro de
 * `@layer utilities` — vence a regra sem camada do tokens (em `!important`
 * a ordem das camadas se inverte), e troca a rotação por um pulso suave de
 * opacidade (2s, ~50%): continua dizendo "ocupado" sem nada girando.
 *
 * Acessibilidade: `role="status"` (live region educada) + rótulo em texto
 * escondido visualmente (`sr-only`), não `aria-label` num <div> (que muitos
 * leitores ignoram). O rótulo padrão é "Carregando"; passe `label` pra ser
 * específico ("Salvando alterações").
 *
 * Sem "use client": só JSX.
 */
const spinnerVariants = cva(
  "inline-block shrink-0 rounded-full border-hairline border-t-ink motion-safe:animate-spin motion-reduce:animate-pulse!",
  {
    variants: {
      size: {
        // A borda acompanha o tamanho: 2px no menor (= --border-width),
        // um pouco mais grossa nos maiores pra manter o peso do anel.
        sm: "size-4 border-2",
        md: "size-6 border-[3px]",
        lg: "size-10 border-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof spinnerVariants> {
  /** Texto para leitores de tela. Padrão: "Carregando". */
  label?: string;
}

export function Spinner({ size, label = "Carregando", className, ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role="status"
      className={cn("inline-flex", className)}
      {...props}
    >
      <span aria-hidden="true" className={spinnerVariants({ size })} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
