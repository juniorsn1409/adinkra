// Sem "use client": puro JSX, nenhum hook — mesmo raciocínio de
// packages/card/src/card.tsx, packages/table/src/table.tsx e
// packages/breadcrumb/src/breadcrumb.tsx. Quem usa decide href/onClick e a
// lógica de qual página está ativa; este pacote só estiliza.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * No espírito da pagination do neobrutalism.dev/shadcn (mesma composição:
 * Pagination/Content/Item/Link/Previous/Next/Ellipsis), reconstruída com os
 * nossos tokens. `PaginationLink` não reaproveita `buttonVariants` do
 * `@adinkra/button` — é um chip quadrado, não um botão de ação —, mas usa o
 * mesmo vocabulário visual (borda de tinta, sombra dura, `--secondary` pra
 * "selecionado"). A página ativa fica com a mesma cara "afundada" (borda +
 * fundo `--secondary`, sem o convite de hover) que o `Toggle` usa pro
 * estado ligado — aqui não é um estado que alguém liga/desliga, é só "você
 * está aqui".
 *
 * Ícones (setas do Previous/Next, três pontos da elipse) são SVG inline com
 * o mesmo traço já usado no chevron do submenu da Sidebar, no Breadcrumb e
 * no ThemeToggle — nenhuma lib de ícone nova.
 */

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="3.5" cy="8" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="12.5" cy="8" r="1.3" />
    </svg>
  );
}

export function Pagination({ className, ...props }: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul data-slot="pagination-content" className={cn("flex flex-row flex-wrap items-center gap-1.5", className)} {...props} />
  );
}

export function PaginationItem(props: React.ComponentPropsWithoutRef<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

const paginationLinkVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 rounded-control",
    "border-[length:var(--border-width)] border-transparent",
    "font-display text-sm font-medium text-foreground",
    "transition-[transform,box-shadow,background-color,border-color] duration-150",
    "hover:border-ink hover:bg-surface hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "aria-disabled:pointer-events-none aria-disabled:opacity-45",
  ],
  {
    variants: {
      isActive: {
        true: [
          "border-ink bg-secondary text-secondary-foreground shadow-brutal",
          "hover:translate-x-0 hover:translate-y-0 hover:bg-secondary hover:shadow-brutal",
        ],
        false: "",
      },
      size: {
        icon: "h-9 w-9",
        default: "h-9 px-3.5",
      },
    },
    defaultVariants: { isActive: false, size: "icon" },
  },
);

export interface PaginationLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof paginationLinkVariants> {}

export function PaginationLink({ className, isActive, size, ...props }: PaginationLinkProps) {
  return (
    <a
      data-slot="pagination-link"
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(paginationLinkVariants({ isActive, size }), className)}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, children, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Página anterior" size="default" className={cn("pl-2.5", className)} {...props}>
      <ChevronLeftIcon />
      <span>{children ?? "Anterior"}</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, children, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Próxima página" size="default" className={cn("pr-2.5", className)} {...props}>
      <span>{children ?? "Próxima"}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <DotsIcon />
      <span className="sr-only">Mais páginas</span>
    </span>
  );
}

export { paginationLinkVariants };
