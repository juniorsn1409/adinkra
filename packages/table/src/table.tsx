import * as React from "react";
import { cn } from "@adinkra/core";

/**
 * No espírito do https://www.neobrutalism.dev/docs/table (mesma composição do
 * shadcn — Header/Body/Footer/Row/Head/Cell/Caption), reconstruída com os
 * nossos tokens. O contêiner (não o <table>) leva a borda + sombra dura
 * padrão de todo componente único do sistema (seção 4, DECISOES.md) — o
 * <table> em si fica livre pra rolar horizontalmente sem cortar a sombra.
 *
 * Listras: `[tbody_&]:even:bg-surface` usa os pseudo-seletores nativos do
 * Tailwind (odd/even = nth-child em CSS puro) escopados só às linhas dentro
 * de <tbody> — cabeçalho e rodapé não listram. Nenhum índice é passado nem
 * contado em JS; segue o mesmo princípio da divisória de SidebarGroup
 * (:not(:first-child)) — CSS puro em vez de estado.
 *
 * Linhas de grade entre colunas (`columnLines`, ligado por padrão): borda à
 * direita em todo `th`/`td` via seletor descendente no próprio `<table>`,
 * removida na última célula de cada linha — de novo, CSS puro (nenhuma
 * TableHead/TableCell precisa saber em qual coluna está). Mesma espessura e
 * cor do contêiner/header/footer (`--border-width`/`--ink`, não
 * `--hairline`) — o usuário pediu que a linha de coluna tivesse o mesmo
 * "tamanho de borda" das outras partes estruturais da tabela, não da linha
 * fina entre as próprias linhas.
 */

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Linhas verticais entre colunas. Ligado por padrão. */
  columnLines?: boolean;
}

export function Table({ className, columnLines = true, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="w-full overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card shadow-brutal"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse text-sm",
          columnLines &&
            "[&_td]:border-r-[length:var(--border-width)] [&_td]:border-ink [&_th]:border-r-[length:var(--border-width)] [&_th]:border-ink [&_tr>:last-child]:border-r-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b-[length:var(--border-width)] border-ink [&_tr]:border-b-0", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t-[length:var(--border-width)] border-ink bg-surface font-medium text-heading",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-hairline transition-colors",
        "[tbody_&]:even:bg-surface [tbody_&]:hover:bg-secondary/50",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 whitespace-nowrap px-4 text-left align-middle font-display text-xs font-semibold uppercase tracking-wide text-heading",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      data-slot="table-cell"
      className={cn("whitespace-nowrap px-4 py-3 align-middle text-foreground", className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 px-1 text-sm text-muted-foreground caption-bottom", className)}
      {...props}
    />
  );
}
