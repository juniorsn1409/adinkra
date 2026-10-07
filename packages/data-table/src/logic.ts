// Regras puras da tabela (sem React): valor de célula, filtro, ordenação,
// busca, agregação, agrupamento e formatação. Separadas do componente pra dar
// pra ler cada regra sozinha — o componente só encadeia: busca → filtros →
// ordenação → grupos.
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

/** Coluna cujo valor é `value` de uma lista de opções (select, status, relação com `options`). */
export function hasOptions(column: DataTableColumn): boolean {
  return column.type === "select" || column.type === "status" || (column.type === "relation" && !!column.options);
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

/** Valores marcados de uma coluna com opções (single vira lista de um). */
export function optionValues(column: DataTableColumn, value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  return value ? [String(value)] : [];
}

/** Texto plano da célula — usado na busca, no "contém" e na ordenação de texto. */
export function cellText(column: DataTableColumn, row: DataTableRow): string {
  const value = cellValue(column, row);
  if (hasOptions(column)) {
    const values = optionValues(column, value);
    return columnOptions(column)
      .filter((option) => values.includes(option.value))
      .map((option) => option.label)
      .join(" ");
  }
  if (column.type === "checkbox") return "";
  if (value === undefined || value === null) return "";
  return String(value);
}

/**
 * Vazio de verdade, por tipo: lista sem item, caixa desmarcada, texto em
 * branco. Número 0 NÃO é vazio (é um valor). Base de "está vazio",
 * "não vazios"/"vazios" do rodapé e do "Vazio" das células.
 */
export function isCellEmpty(column: DataTableColumn, row: DataTableRow): boolean {
  if (column.type === "checkbox") return cellValue(column, row) !== true;
  if (hasOptions(column)) return optionValues(column, cellValue(column, row)).length === 0;
  const value = cellValue(column, row);
  if (typeof value === "number") return Number.isNaN(value);
  return cellText(column, row).trim() === "";
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
 * Operadores por tipo (redesenho da tabela, 07/10 — todo tipo ganhou "está
 * vazio/não está vazio"): texto contém/não contém/é/não é; número
 * =, ≠, >, <, ≥, ≤; seleção/status é/não é (multi: contém/não contém); data
 * é/é antes de/é depois de; caixa marcado/desmarcado. Relação segue a
 * seleção quando tem `options` e o texto quando não; fórmula segue o número
 * quando tem `format` e o texto quando não.
 */
export function operatorsFor(column: DataTableColumn): FilterOperator[] {
  const type: ColumnType = column.type === "formula" ? (column.format ? "number" : "text") : column.type;
  const empty: FilterOperator[] = ["isEmpty", "isNotEmpty"];
  switch (type) {
    case "number":
      return ["eq", "neq", "gt", "lt", "gte", "lte", ...empty];
    case "select":
    case "status":
      return ["is", "isNot", ...empty];
    case "relation":
      return column.options ? ["is", "isNot", ...empty] : ["contains", "notContains", "is", "isNot", ...empty];
    case "date":
      return ["is", "before", "after", ...empty];
    case "checkbox":
      return ["checked", "unchecked"];
    default:
      return ["contains", "notContains", "is", "isNot", ...empty];
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
    isNotEmpty: "não está vazio",
    eq: "=",
    neq: "≠",
    gt: ">",
    lt: "<",
    gte: "≥",
    lte: "≤",
    before: "é antes de",
    after: "é depois de",
    checked: "marcado",
    unchecked: "desmarcado",
  };
  return labels[operator];
}

export function operatorNeedsValue(operator: FilterOperator): boolean {
  return operator !== "isEmpty" && operator !== "isNotEmpty" && operator !== "checked" && operator !== "unchecked";
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
      return isCellEmpty(column, row);
    case "isNotEmpty":
      return !isCellEmpty(column, row);
    case "eq":
    case "neq":
    case "gt":
    case "lt":
    case "gte":
    case "lte": {
      const numeric = typeof value === "number" ? value : Number(value);
      const wanted = Number(target);
      if (Number.isNaN(numeric) || Number.isNaN(wanted)) return false;
      switch (filter.operator) {
        case "eq":
          return numeric === wanted;
        case "neq":
          return numeric !== wanted;
        case "gt":
          return numeric > wanted;
        case "lt":
          return numeric < wanted;
        case "gte":
          return numeric >= wanted;
        default:
          return numeric <= wanted;
      }
    }
    case "before":
    case "after": {
      if (typeof value !== "string" || !value) return false;
      return filter.operator === "before" ? value < String(target) : value > String(target);
    }
    case "is":
    case "isNot": {
      let hit: boolean;
      if (hasOptions(column)) {
        hit = optionValues(column, value).includes(String(target));
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

/**
 * Valores que uma linha NOVA precisa pra passar nos filtros ativos (desenho
 * de 07/10: criar com "Mês é Setembro" ativo já nasce em Setembro). Só os
 * filtros que dão um valor inequívoco: "é" em opção/texto, "contém" em
 * multi (vira a lista com aquele item), "contém" em texto e "marcado".
 */
export function filterPreset(columns: DataTableColumn[], filters: DataTableFilter[]): Partial<DataTableRow> {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const preset: Partial<DataTableRow> = {};
  for (const filter of filters.filter(isFilterActive)) {
    const column = byId.get(filter.columnId);
    if (!column || column.type === "formula") continue;
    const value = filter.value;
    if (filter.operator === "checked" && column.type === "checkbox") preset[column.id] = true;
    else if (filter.operator === "is" && hasOptions(column)) preset[column.id] = column.multi ? [String(value)] : String(value);
    else if (filter.operator === "is" && column.type === "date") preset[column.id] = String(value);
    else if (filter.operator === "eq" && column.type === "number") preset[column.id] = Number(value);
    else if ((filter.operator === "is" || filter.operator === "contains") && (column.type === "text" || column.type === "relation")) {
      preset[column.id] = String(value);
    }
  }
  return preset;
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
  // Status/select ordenam pela ORDEM das opções (Pendente antes de
  // Sincronizado se foi assim que quem configurou listou), não pelo rótulo.
  // Multi ordena pela primeira etiqueta.
  if (hasOptions(column)) {
    const order = columnOptions(column).map((option) => option.value);
    const ia = order.indexOf(optionValues(column, va)[0] ?? "");
    const ib = order.indexOf(optionValues(column, vb)[0] ?? "");
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

/** Ciclo do menu "Ordenar por" (desenho de 07/10): sem → crescente → decrescente → sem. */
export function cycleSort(sorts: DataTableSort[], columnId: string): DataTableSort[] {
  const current = sorts.find((sort) => sort.columnId === columnId);
  if (!current) return [...sorts, { columnId, direction: "asc" }];
  if (current.direction === "asc") return sorts.map((sort) => (sort.columnId === columnId ? { ...sort, direction: "desc" } : sort));
  return sorts.filter((sort) => sort.columnId !== columnId);
}

// ─── Agrupamento ─────────────────────────────────────────────────────

/** Tipos que dá pra agrupar: os de valor discreto (opções, caixa) e texto/relação livres. */
export function isGroupable(column: DataTableColumn): boolean {
  return hasOptions(column) || column.type === "checkbox" || column.type === "text" || column.type === "relation";
}

export interface RowGroup {
  /** `""` = linhas sem valor ("Sem …"). Em caixa: "true"/"false". */
  key: string;
  label: string;
  rows: DataTableRow[];
}

/**
 * Grupos na ordem das opções (os sem valor por último). Multi: a linha
 * entra em CADA grupo das suas etiquetas (como no desenho). Texto/relação
 * livres agrupam pelo texto, em ordem alfabética.
 */
export function groupRows(column: DataTableColumn, rows: DataTableRow[]): RowGroup[] {
  const map = new Map<string, DataTableRow[]>();
  const add = (key: string, row: DataTableRow) => {
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  };
  for (const row of rows) {
    const value = cellValue(column, row);
    if (column.type === "checkbox") add(value === true ? "true" : "false", row);
    else if (hasOptions(column)) {
      const values = optionValues(column, value);
      if (values.length === 0) add("", row);
      else for (const v of values) add(v, row);
    } else add(cellText(column, row).trim(), row);
  }
  const options = columnOptions(column);
  const order = options.map((option) => option.value);
  const keys = [...map.keys()].sort((a, b) => {
    if (a === b) return 0;
    if (a === "") return 1;
    if (b === "") return -1;
    if (column.type === "checkbox") return a === "true" ? -1 : 1;
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    return collator.compare(a, b);
  });
  return keys.map((key) => {
    let label = key;
    if (key === "") label = `Sem ${(column.header || column.id).toLowerCase()}`;
    else if (column.type === "checkbox") label = key === "true" ? "Marcada" : "Desmarcada";
    else label = options.find((option) => option.value === key)?.label ?? key;
    return { key, label, rows: map.get(key) ?? [] };
  });
}

/** Valor que uma linha nova criada DENTRO do grupo `key` recebe na coluna do grupo. */
export function groupPreset(column: DataTableColumn, key: string): Partial<DataTableRow> {
  if (key === "" || column.type === "formula") return {};
  if (column.type === "checkbox") return { [column.id]: key === "true" };
  if (column.type === "select" && column.multi) return { [column.id]: [key] };
  return { [column.id]: key };
}

// ─── Agregação ───────────────────────────────────────────────────────

export const aggregateLabels: Record<Aggregate, string> = {
  none: "Nenhum",
  count: "Contagem",
  filled: "Não vazios",
  empty: "Vazios",
  percentFilled: "% não vazios",
  sum: "Soma",
  avg: "Média",
  median: "Mediana",
  min: "Mín.",
  max: "Máx.",
  range: "Amplitude",
  checked: "Marcadas",
  unchecked: "Desmarcadas",
  percentChecked: "% marcadas",
  earliest: "Mais antiga",
  latest: "Mais recente",
};

/** Rótulo curto do rodapé (o mesmo do menu). */
export function aggregateShortLabel(aggregate: Aggregate): string {
  return aggregateLabels[aggregate];
}

export function aggregatesFor(column: DataTableColumn): Aggregate[] {
  if (column.type === "checkbox") return ["none", "count", "checked", "unchecked", "percentChecked"];
  const base: Aggregate[] = ["none", "count", "filled", "empty", "percentFilled"];
  if (isNumericColumn(column)) return [...base, "sum", "avg", "median", "min", "max", "range"];
  if (column.type === "date") return [...base, "earliest", "latest"];
  return base;
}

/** Resultado numérico da agregação (sobre as linhas recebidas). Datas e porcentagens saem por `formatAggregate`. */
export function computeAggregate(column: DataTableColumn, rows: DataTableRow[], aggregate: Aggregate): number | undefined {
  const total = rows.length;
  const filled = () => rows.filter((row) => !isCellEmpty(column, row)).length;
  const checked = () => rows.filter((row) => cellValue(column, row) === true).length;
  switch (aggregate) {
    case "none":
    case "earliest":
    case "latest":
      return undefined;
    case "count":
      return total;
    case "filled":
      return filled();
    case "empty":
      return total - filled();
    case "percentFilled":
      return total ? Math.round((filled() / total) * 100) : 0;
    case "checked":
      return checked();
    case "unchecked":
      return total - checked();
    case "percentChecked":
      return total ? Math.round((checked() / total) * 100) : 0;
  }
  const values = rows.map((row) => cellValue(column, row)).filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (values.length === 0) return aggregate === "sum" ? 0 : undefined;
  switch (aggregate) {
    case "sum":
      return values.reduce((sum, value) => sum + value, 0);
    case "avg":
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case "median": {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
    }
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "range":
      return Math.max(...values) - Math.min(...values);
  }
}

const COUNT_AGGREGATES = new Set<Aggregate>(["count", "filled", "empty", "checked", "unchecked"]);
const PERCENT_AGGREGATES = new Set<Aggregate>(["percentFilled", "percentChecked"]);

/**
 * Texto pronto do rodapé: contagens como número cru, porcentagens com "%",
 * datas no formato curto, o resto no formato da coluna (R$ quando moeda).
 * `negative` pinta de destructive (só fórmula, a regra de sempre).
 */
export function formatAggregate(
  column: DataTableColumn,
  rows: DataTableRow[],
  aggregate: Aggregate,
): { text: string; negative: boolean } | undefined {
  if (aggregate === "none") return undefined;
  if (aggregate === "earliest" || aggregate === "latest") {
    const dates = rows
      .map((row) => cellValue(column, row))
      .filter((value): value is string => typeof value === "string" && !!value)
      .sort();
    const picked = aggregate === "earliest" ? dates[0] : dates[dates.length - 1];
    const date = parseISODate(picked);
    return { text: date ? formatShortDate(date) : "—", negative: false };
  }
  const result = computeAggregate(column, rows, aggregate);
  if (result === undefined) return { text: "—", negative: false };
  if (COUNT_AGGREGATES.has(aggregate)) return { text: String(result), negative: false };
  if (PERCENT_AGGREGATES.has(aggregate)) return { text: `${result}%`, negative: false };
  return { text: formatNumber(column, result), negative: column.type === "formula" && result < 0 };
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

/**
 * Cores pra opção criada na hora (seletor com "Criar …"): giram nesta
 * ordem, a partir de quantas opções a coluna já tem — mesmo ciclo do desenho.
 */
const NEW_OPTION_COLORS = ["tag-sky", "tag-mustard", "tag-coral", "tag-navy", "mist", "primary", "secondary", "gray"] as const;

export function nextOptionColor(column: DataTableColumn): SelectOption["color"] {
  return NEW_OPTION_COLORS[columnOptions(column).length % NEW_OPTION_COLORS.length] ?? "tag-sky";
}
