import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * Placeholder de carregamento, no espírito do Skeleton de
 * https://www.neobrutalism.dev/docs/skeleton (a API de tamanho/formato por
 * className é a mesma do shadcn/ui — só o visual muda): um bloco só, sem
 * variantes, mas com a borda de tinta que todo componente do sistema leva
 * (regra 9, DECISOES.md — mesmo os não-clicáveis, aqui, para ficar
 * consistente com a referência). Tamanho e formato vêm inteiramente de
 * className (`<Skeleton className="h-4 w-40 rounded-full" />`).
 *
 * A cor reaproveita --hairline: a paleta não tem um tom "neutro de
 * preenchimento" dedicado, e --hairline já é decorativo por definição
 * (DECISOES.md, seção 4) — exatamente o papel que um esqueleto precisa.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-control border-[length:var(--border-width)] border-ink bg-hairline",
        className,
      )}
      {...props}
    />
  );
}
