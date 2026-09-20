// Sem "use client": é um <a> nativo sem estado próprio (mesma regra do Button).
import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * Link de texto no estilo dos "SPONSOR" do sidebar.io: curto, espaçado,
 * em caixa alta por padrão. Cor `primary`, e no hover troca pra `secondary`.
 * `uppercase={false}` devolve o texto como foi escrito.
 */
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  uppercase?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, uppercase = true, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-display text-[0.6875rem] font-medium tracking-[0.14em]",
          "text-primary transition-colors duration-150 hover:text-secondary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          uppercase && "uppercase",
          className,
        )}
        {...props}
      />
    );
  },
);

Link.displayName = "Link";
