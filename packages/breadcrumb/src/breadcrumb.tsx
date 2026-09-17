// Sem "use client": puro JSX, nenhum hook — mesmo raciocínio de
// packages/card/src/card.tsx e packages/table/src/table.tsx.
import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * No espírito do breadcrumb do neobrutalism.dev/shadcn (mesma composição:
 * Breadcrumb/List/Item/Link/Page/Separator/Ellipsis), reconstruído com os
 * nossos tokens. O ícone do separador e os três pontos da elipse são SVG
 * inline com o mesmo traço (`viewBox 16x16`, `strokeWidth 1.3-1.4`) já
 * usado no chevron do submenu da Sidebar e nos ícones do ThemeToggle — não
 * puxa nenhuma lib de ícone.
 */

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function Breadcrumb(props: React.ComponentPropsWithoutRef<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 font-display text-sm text-muted-foreground sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

export function BreadcrumbLink({ className, ...props }: BreadcrumbLinkProps) {
  return (
    <a
      data-slot="breadcrumb-link"
      className={cn(
        "rounded-control text-foreground underline-offset-4 transition-colors hover:text-heading hover:underline",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbPage({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-medium text-heading", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("flex items-center text-muted-foreground [&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronIcon />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-8 items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <DotsIcon />
      <span className="sr-only">Mais</span>
    </span>
  );
}
