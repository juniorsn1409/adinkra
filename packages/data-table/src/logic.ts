// Regras puras da tabela (sem React): valor de célula, filtro, ordenação,
// busca, agregação e formatação. Separadas do componente pra dar pra ler
// cada regra sozinha — o componente só encadeia: busca → filtros → ordenação.
import type {
  Aggregate,
  ColumnType,
  DataTableColumn,
  DataTableFilter,
  DataTableRow,
  DataTableSort,
  FilterOperator,
  SelectOption,
  StatusOption,
} from "./types";

export const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function columnOptions(column: DataTableColumn): (SelectOption | StatusOption)[] {
  return column.options ?? [];
}

/**
 * Fórmula com sobrescrita manual (pedido do usuário, 27/09 — "todo campo é
 * pra ser editável"): o que a pessoa digita vai pra `row[column.id]`;
 * enquanto houver valor salvo ali (não vazio), ele VENCE o calculado.
 * Apagar o campo grava `undefined` e a fórmula volta a valer.
 */
export function isFormulaOverridden(column: DataTableColumn, row: DataTableRow): boolean {
  if (column.type !== "formula") return false;
  const saved = row[column.id];
  return saved !== undefined && saved !== null && saved !== "";
}

/** Só o calculado, ignorando a sobrescrita (a edição usa pra saber se algo mudou de fato). */
export function computedFormula(column: DataTableColumn, row: DataTableRow): number | string | undefined {
  return column.formula ? column.formula(row) : undefined;
}

/**
 * Valor EFETIVO da célula: fórmula = sobrescrita manual se houver, senão o
 * calculado; o resto lê do row. Filtro, ordenação, busca e agregação passam
 * todos por aqui, então usam o efetivo automaticamente.
 */
export function cellValue(column: DataTableColumn, row: DataTableRow): unknown {
  if (column.type === "formula") return isFormulaOverridden(column, row) ? row[column.id] : computedFormula(column, row);
  return row[column.id];
}

/** Colunas cujo valor é número (entram em soma/média/mín./máx.). */
export function isNumericColumn(column: DataTableColumn): boolean {
  return column.type === "number" || (column.type === "formula" && column.format !== undefined);
}

export function isCurrencyColumn(column: DataTableColumn): boolean {
  return (column.type === "number" && !!column.currency) || (column.type === "formula" && column.format === "currency");
}

export function formatNumber(column: DataTableColumn, value: number): string {
  return isCurrencyColumn(column) ? currencyFormatter.format(value) : numberFormatter.format(value);
}

const shortMonths = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "21 set 2026" — o formato curto do desenho (cabe numa coluna de 144). */
export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${shortMonths[date.getMonth()]} ${date.getFullYear()}`;
}

export function parseISODate(value: unknown): Date | undefined {
  return typeof value === "string" && value ? new Date(`${value}T00:00:00`) : undefined;
}

/** Texto plano da célula — usado na busca, no "contém" e na ordenação de texto. */
export function cellText(column: DataTableColumn, row: DataTableRow): string {
  const value = cellValue(column, row);
  if (column.type === "select" || column.type === "status" || (column.type === "relation" && column.options)) {
    const values = Array.isArray(value) ? (value as string[]) : value ? [String(value)] : [];
    return columnOptions(column)
      .filter((option) => values.includes(option.value))
      .map((option) => option.label)
      .join(" ");
  }
  if (column.type === "checkbox") return "";
  if (value === undefined || value === null) return "";
  return String(value);
}

// Busca e "contém" ignoram maiúscula e acento ("sao" acha "São").
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesSearch(columns: DataTableColumn[], row: DataTableRow, query: string): boolean {
  const needle = normalizeText(query.trim());
  if (!needle) return true;
  return columns.some((column) => normalizeText(cellText(column, row)).includes(needle));
}

// ─── Filtros ─────────────────────────────────────────────────────────

/**
 * Operadores por tipo (pedido do redesenho): texto contém/não contém/é/está
 * vazio; número =, >, <; seleção/status é/não é; data é/antes/depois;
 * checkbox marcado/desmarcado. Relação segue o texto (o valor dela é o
 * rótulo), fórmula segue o número quando tem `format` e o texto quando não.
 */
export function operatorsFor(column: DataTableColumn): FilterOperator[] {
  const type: ColumnType = column.type === "formula" ? (column.format ? "number" : "text") : column.type;
  switch (type) {
    case "number":
      return ["eq", "gt", "lt"];
    case "select":
    case "status":
      return ["is", "isNot"];
    case "relation":
      // Relação com `options` filtra como seleção; sem, como texto.
      return column.options ? ["is", "isNot"] : ["contains", "notContains", "is", "isEmpty"];
    case "date":
      return ["is", "before", "after"];
    case "checkbox":
      return ["checked", "unchecked"];
    default:
      return ["contains", "notContains", "is", "isEmpty"];
  }
}

/** Rótulo do operador. Em select multi, "é/não é" lê como "contém/não contém" (o desenho: "Tags: não contém …"). */
export function operatorLabel(operator: FilterOperator, column?: DataTableColumn): string {
  if (column?.type === "select" && column.multi) {
    if (operator === "is") return "contém";
    if (operator === "isNot") return "não contém";
  }
  const labels: Record<FilterOperator, string> = {
    contains: "contém",
    notContains: "não contém",
    is: "é",
    isNot: "não é",
    isEmpty: "está vazio",
    eq: "=",
    gt: ">",
    lt: "<",
    before: "antes de",
    after: "depois de",
    checked: "marcado",
    unchecked: "desmarcado",
  };
  return labels[operator];
}

export function operatorNeedsValue(operator: FilterOperator): boolean {
  return operator !== "isEmpty" && operator !== "checked" && operator !== "unchecked";
}

/** Regra ainda sem valor não filtra nada (senão "contém ''" esconderia tudo enquanto a pessoa monta a regra). */
export function isFilterActive(filter: DataTableFilter): boolean {
  if (!operatorNeedsValue(filter.operator)) return true;
  return filter.value !== undefined && filter.value !== "";
}

export function matchesFilter(column: DataTableColumn, row: DataTableRow, filter: DataTableFilter): boolean {
  const value = cellValue(column, row);
  const target = filter.value;
  switch (filter.operator) {
    case "checked":
      return value === true;
    case "unchecked":
      return value !== true;
    case "isEmpty":
      return cellText(column, row).trim() === "";
    case "eq":
    case "gt":
    case "lt": {
      const numeric = typeof value === "number" ? value : Number(value);
      const wanted = Number(target);
      if (Number.isNaN(numeric) || Number.isNaN(wanted)) return false;
      return filter.operator === "eq" ? numeric === wanted : filter.operator === "gt" ? numeric > wanted : numeric < wanted;
    }
    case "before":
    case "after": {
      if (typeof value !== "string" || !value) return false;
      return filter.operator === "before" ? value < String(target) : value > String(target);
    }
    case "is":
    case "isNot": {
      let hit: boolean;
      if (column.type === "select" || column.type === "status" || (column.type === "relation" && column.options)) {
        const values = Array.isArray(value) ? (value as string[]) : value ? [String(value)] : [];
        hit = values.includes(String(target));
      } else if (column.type === "date") {
        hit = value === target;
      } else {
        hit = normalizeText(cellText(column, row)) === normalizeText(String(target));
      }
      return filter.operator === "is" ? hit : !hit;
    }
    case "contains":
    case "notContains": {
      const hit = normalizeText(cellText(column, row)).includes(normalizeText(String(target)));
      return filter.operator === "contains" ? hit : !hit;
    }
  }
}

export function applyFilters(columns: DataTableColumn[], rows: DataTableRow[], filters: DataTableFilter[]): DataTableRow[] {
  const active = filters.filter(isFilterActive);
  if (active.length === 0) return rows;
  const byId = new Map(columns.map((column) => [column.id, column]));
  // Todas as regras juntas ("e"), como no desenho ("onde … e … e …").
  return rows.filter((row) =>
    active.every((filter) => {
      const column = byId.get(filter.columnId);
      return column ? matchesFilter(column, row, filter) : true;
    }),
  );
}

// ─── Ordenação ───────────────────────────────────────────────────────

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function compareCells(column: DataTableColumn, a: DataTableRow, b: DataTableRow): number {
  const va = cellValue(column, a);
  const vb = cellValue(column, b);
  if (column.type === "number" || (column.type === "formula" && typeof va === "number" && typeof vb === "number")) {
    return (Number(va) || 0) - (Number(vb) || 0);
  }
  if (column.type === "checkbox") return Number(va === true) - Number(vb === true);
  if (column.type === "date") return String(va ?? "").localeCompare(String(vb ?? ""));
  // Status/select single ordenam pela ORDEM das opções (Pendente antes de
  // Sincronizado se foi assim que quem configurou listou), não pelo rótulo.
  if ((column.type === "status" || column.type === "select" || (column.type === "relation" && column.options)) && !column.multi) {
    const order = columnOptions(column).map((option) => option.value);
    const ia = order.indexOf(String(va ?? ""));
    const ib = order.indexOf(String(vb ?? ""));
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  }
  return collator.compare(cellText(column, a), cellText(column, b));
}

export function applySorts(columns: DataTableColumn[], rows: DataTableRow[], sorts: DataTableSort[]): DataTableRow[] {
  if (sorts.length === 0) return rows;
  const byId = new Map(columns.map((column) => [column.id, column]));
  // `[...rows].sort` é estável: empate mantém a ordem original do array.
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const column = byId.get(sort.columnId);
      if (!column) continue;
      const result = compareCells(column, a, b);
      if (result !== 0) return sort.direction === "asc" ? result : -result;
    }
    return 0;
  });
}

// ─── Agregação ───────────────────────────────────────────────────────

export const aggregateLabels: Record<Aggregate, string> = {
  none: "Nenhuma",
  sum: "Soma",
  avg: "Média",
  min: "Mínimo",
  max: "Máximo",
  count: "Contar valores",
};

/** Rótulo curto do rodapé ("Soma", "Média", "Contagem"). */
export function aggregateShortLabel(aggregate: Aggregate): string {
  return aggregate === "count" ? "Contagem" : aggregateLabels[aggregate];
}

export function aggregatesFor(column: DataTableColumn): Aggregate[] {
  return isNumericColumn(column) ? ["none", "sum", "avg", "min", "max", "count"] : ["none", "count"];
}

/** Resultado numérico da agregação sobre as linhas VISÍVEIS (depois de busca e filtro). */
export function computeAggregate(column: DataTableColumn, rows: DataTableRow[], aggregate: Aggregate): number | undefined {
  if (aggregate === "none") return undefined;
  if (aggregate === "count") {
    return rows.filter((row) => {
      if (column.type === "checkbox") return cellValue(column, row) === true;
      return cellText(column, row).trim() !== "";
    }).length;
  }
  const values = rows.map((row) => cellValue(column, row)).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return aggregate === "sum" ? 0 : undefined;
  switch (aggregate) {
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "avg":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
  }
}

/** Linha nova com o valor vazio certo por tipo (antes era função interna do componente). */
export function createEmptyRow(columns: DataTableColumn[]): DataTableRow {
  const row: DataTableRow = { id: crypto.randomUUID() };
  for (const column of columns) {
    if (column.type === "formula") continue;
    row[column.id] =
      column.type === "select" ? (column.multi ? [] : "") : column.type === "number" ? 0 : column.type === "checkbox" ? false : "";
  }
  return row;
}

/** Coluna principal: a marcada com `primary`, senão a primeira de texto. */
export function primaryColumnOf(columns: DataTableColumn[]): DataTableColumn | undefined {
  return columns.find((column) => column.primary) ?? columns.find((column) => column.type === "text");
}
