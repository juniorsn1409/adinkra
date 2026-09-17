import type { BadgeProps } from "@adinkra/badge";

/**
 * Cores de etiqueta reaproveitadas do `@adinkra/badge` (nenhuma cor nova
 * inventada aqui) — "outline" fica de fora de propósito: é o visual
 * "sem cor" do Badge, não faz sentido como opção de select colorido.
 */
export type SelectColor = Exclude<NonNullable<BadgeProps["variant"]>, "outline">;

export interface SelectOption {
  value: string;
  label: string;
  color: SelectColor;
}

export type ColumnType = "text" | "select" | "number" | "date";

export interface DataTableColumn {
  id: string;
  header: string;
  type: ColumnType;
  /** Só pra type "select". */
  options?: SelectOption[];
  /** Só pra type "select" — várias etiquetas por célula (tags) em vez de uma só (status). */
  multi?: boolean;
  /** Só pra type "number" — formata como R$ (Intl, pt-BR) em vez de número cru. */
  currency?: boolean;
}

export interface DataTableRow {
  id: string;
  [columnId: string]: unknown;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  onRowsChange: (rows: DataTableRow[]) => void;
  /** Linhas verticais entre colunas (mesmo padrão do @adinkra/table). Ligado por padrão. */
  columnLines?: boolean;
  className?: string;
}
