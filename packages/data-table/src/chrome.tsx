"use client";

// Peças em volta da grade (redesenho φ, 27/09): barra superior (visões,
// ferramentas, busca, slot de ações), linha de chips de ordenação/filtro,
// construtor de filtros, menu da coluna, menu da agregação e a lista de
// colunas visíveis. Tudo reaproveita os irmãos do sistema — Tabs, Button,
// Input, Select nativo, Popover e DropdownMenu — em vez de redesenhar.
import * as React from "react";
import { Button } from "@adinkra/button";
import { cn } from "@adinkra/core";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adinkra/dropdown-menu";
import { Input } from "@adinkra/input";
import { Popover, PopoverContent, PopoverTrigger } from "@adinkra/popover";
import { Select, SelectOption as NativeOption } from "@adinkra/select";
import { Tabs, TabsList, TabsTrigger } from "@adinkra/tabs";
import { ColumnTypeIcon, Glyph, PlusIcon } from "./glyphs";
import {
  aggregateLabels,
  aggregatesFor,
  columnOptions,
  isFilterActive,
  operatorLabel,
  operatorNeedsValue,
  operatorsFor,
} from "./logic";
import type { Aggregate, DataTableColumn, DataTableFilter, DataTableSort, DataTableView } from "./types";

// ─── Barra superior ──────────────────────────────────────────────────

/**
 * Botão-ferramenta de 34 da barra superior. Ligado (filtro/ordenação ativos,
 * busca aberta) = céu com borda de tinta, o mesmo "ligado" dos chips — é
 * estado, não ação, então o céu é permitido aqui (regra 6).
 */
const ToolButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }>(
  ({ on, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      className={cn(
        "flex size-6 flex-none items-center justify-center rounded-control border-[length:var(--border-width)] text-heading",
        "transition-[background-color,border-color] duration-150 ease-[var(--ease-out)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
        on ? "border-ink bg-secondary text-secondary-foreground" : "border-transparent hover:bg-surface",
        className,
      )}
      {...props}
    />
  ),
);
ToolButton.displayName = "ToolButton";

/** Lista de colunas com caixa de marcar — é o único caminho de volta pra uma coluna escondida pelo menu dela. */
export function ColumnsVisibilityMenu({
  columns,
  isHidden,
  onToggle,
  trigger,
}: {
  columns: DataTableColumn[];
  isHidden: (column: DataTableColumn) => boolean;
  onToggle: (column: DataTableColumn, visible: boolean) => void;
  trigger: React.ReactElement<Record<string, unknown>>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-mono uppercase tracking-[0.13em]">Colunas visíveis</DropdownMenuLabel>
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={!isHidden(column)}
            onCheckedChange={(checked) => onToggle(column, checked)}
            closeOnClick={false}
          >
            <span className="text-muted-foreground">
              <ColumnTypeIcon type={column.type} />
            </span>
            {column.header || column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * `@adinkra/tabs` de verdade (lista de 42, abas de 34): a visão ativa é
 * estado, então quem usa decide o que cada uma mostra via `onViewChange`
 * — a tabela não troca linhas sozinha. Sem `TabsContent`: o "painel" é a
 * própria grade embaixo (ou, no `DataTableViews`, a visão ativa inteira).
 */
export function ViewTabs({
  views,
  activeView,
  onViewChange,
}: {
  views: DataTableView[];
  activeView?: string;
  onViewChange?: (viewId: string) => void;
}) {
  return (
    <Tabs value={activeView ?? views[0]?.id} onValueChange={(value) => onViewChange?.(String(value))} className="min-w-0 gap-0">
      <TabsList aria-label="Visões">
        {views.map((view) => (
          <TabsTrigger key={view.id} value={view.id} className="gap-3 px-4">
            {view.icon}
            {view.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function TopBar({
  views,
  activeView,
  onViewChange,
  toolbar,
  searchable,
  search,
  onSearchChange,
  filterOn,
  sortOn,
  onFilterClick,
  sortMenu,
  columnsMenu,
}: {
  views?: DataTableView[];
  activeView?: string;
  onViewChange?: (viewId: string) => void;
  toolbar?: React.ReactNode;
  searchable?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filterOn: boolean;
  sortOn: boolean;
  onFilterClick: () => void;
  sortMenu: (trigger: React.ReactElement<Record<string, unknown>>) => React.ReactNode;
  columnsMenu: (trigger: React.ReactElement<Record<string, unknown>>) => React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = React.useState(search !== "");

  return (
    <div className="flex min-h-[55px] flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-2">
      {views && views.length > 0 ? <ViewTabs views={views} activeView={activeView} onViewChange={onViewChange} /> : <span />}
      <div className="flex flex-wrap items-center gap-2">
        {searchable && searchOpen ? (
          <div className="w-[233px]">
            <Input
              aria-label="Buscar"
              placeholder="Buscar"
              autoFocus
              value={search}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onSearchChange("");
                  setSearchOpen(false);
                }
              }}
              className="h-[34px] px-3 text-sm shadow-none"
            />
          </div>
        ) : null}
        <ToolButton aria-label="Filtros" on={filterOn} onClick={onFilterClick}>
          <Glyph name="filter" size={16} />
        </ToolButton>
        {sortMenu(
          <ToolButton aria-label="Ordenação" on={sortOn}>
            <Glyph name="sort" size={16} />
          </ToolButton>,
        )}
        {searchable ? (
          <ToolButton
            aria-label="Buscar"
            on={searchOpen}
            onClick={() => {
              if (searchOpen) onSearchChange("");
              setSearchOpen(!searchOpen);
            }}
          >
            <Glyph name="search" size={16} />
          </ToolButton>
        ) : null}
        {columnsMenu(
          <ToolButton aria-label="Colunas visíveis">
            <Glyph name="eye" size={16} />
          </ToolButton>,
        )}
        {toolbar ? (
          <>
            <span aria-hidden="true" className="mx-3 h-5 w-px bg-hairline" />
            {toolbar}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Chips ───────────────────────────────────────────────────────────

/** Chip de 26 do desenho: ativo = céu com borda de tinta; neutro = sem borda. */
const Chip = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; lead?: React.ReactNode; caret?: boolean; label: React.ReactNode; keyLabel?: string }
>(({ on, lead, caret = true, label, keyLabel, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex h-[26px] max-w-[233px] flex-none items-center gap-2 whitespace-nowrap rounded-control border-[length:var(--border-width)] px-3 text-sm font-medium",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
      on ? "border-ink bg-secondary text-secondary-foreground" : "border-transparent text-heading hover:bg-surface",
      className,
    )}
    {...props}
  >
    {lead ? <span className="inline-flex">{lead}</span> : null}
    {keyLabel ? <span className="font-semibold">{keyLabel}</span> : null}
    <span className="truncate">{label}</span>
    {caret ? <Glyph name="chevDown" /> : null}
  </button>
));
Chip.displayName = "Chip";

function filterValueLabel(column: DataTableColumn, filter: DataTableFilter): string {
  if (!operatorNeedsValue(filter.operator)) return operatorLabel(filter.operator, column);
  let value = filter.value === undefined ? "" : String(filter.value);
  if (column.type === "select" || column.type === "status" || (column.type === "relation" && column.options)) {
    value = columnOptions(column).find((option) => option.value === value)?.label ?? value;
  }
  return `${operatorLabel(filter.operator, column)} ${value}`;
}

export function ChipsBar({
  columns,
  sorts,
  onSortsChange,
  filters,
  builderOpen,
  onBuilderOpenChange,
  onAddFilter,
  builder,
  extra,
}: {
  columns: DataTableColumn[];
  sorts: DataTableSort[];
  onSortsChange: (sorts: DataTableSort[]) => void;
  filters: DataTableFilter[];
  builderOpen: boolean;
  onBuilderOpenChange: (open: boolean) => void;
  onAddFilter: () => void;
  builder: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const activeFilters = filters.filter(isFilterActive);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-hairline p-4">
      {sorts.map((sort) => {
        const column = byId.get(sort.columnId);
        if (!column) return null;
        return (
          <DropdownMenu key={sort.columnId}>
            <DropdownMenuTrigger
              render={<Chip on lead={<Glyph name={sort.direction === "asc" ? "sortUp" : "sortDown"} strokeWidth={2.5} />} label={column.header} />}
            />
            <DropdownMenuContent>
              <DropdownMenuLabel className="font-mono uppercase tracking-[0.13em]">Ordenar {column.header}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort.direction}
                onValueChange={(direction) =>
                  onSortsChange(sorts.map((s) => (s.columnId === sort.columnId ? { ...s, direction: direction as DataTableSort["direction"] } : s)))
                }
              >
                <DropdownMenuRadioItem value="asc">Crescente</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Decrescente</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onSortsChange(sorts.filter((s) => s.columnId !== sort.columnId))}>
                Remover ordenação
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      {sorts.length > 0 && filters.length > 0 ? <span aria-hidden="true" className="h-5 w-px bg-hairline" /> : null}
      {/*
        Um Popover só pro construtor, ancorado no chip-resumo ("N regras").
        Os chips de cada regra e o "+ Filtro" só abrem ESSE mesmo popover —
        editar uma regra é sempre no construtor inteiro, como no desenho
        (o chip mostra a regra, o construtor é onde ela muda).
      */}
      {filters.length > 0 ? (
        <Popover open={builderOpen} onOpenChange={onBuilderOpenChange}>
          <PopoverTrigger
            render={
              <Chip
                on={activeFilters.length > 0}
                lead={<Glyph name="filter" />}
                label={`${filters.length} ${filters.length === 1 ? "regra" : "regras"}`}
              />
            }
          />
          <PopoverContent align="start" className="w-[610px] max-w-[calc(100vw-26px)]">
            {builder}
          </PopoverContent>
        </Popover>
      ) : null}
      {activeFilters.map((filter) => {
        const column = byId.get(filter.columnId);
        if (!column) return null;
        return (
          <Chip
            key={filter.id}
            on
            lead={<ColumnTypeIcon type={column.type} />}
            keyLabel={`${column.header}:`}
            label={filterValueLabel(column, filter)}
            onClick={() => onBuilderOpenChange(true)}
          />
        );
      })}
      <Chip lead={<PlusIcon />} caret={false} label="Filtro" className="text-muted-foreground" onClick={onAddFilter} />
      {extra}
    </div>
  );
}

// ─── Construtor de filtros ───────────────────────────────────────────

// Select nativo do sistema (`@adinkra/select`) na altura 34 das regras do
// desenho — a de 42 é a do formulário; aqui é controle denso de ferramenta.
const ruleControl = "h-[34px] text-sm shadow-none pl-3";

export function FilterBuilder({
  columns,
  filters,
  onFiltersChange,
  onAddRule,
}: {
  columns: DataTableColumn[];
  filters: DataTableFilter[];
  onFiltersChange: (filters: DataTableFilter[]) => void;
  onAddRule: () => void;
}) {
  const byId = new Map(columns.map((column) => [column.id, column]));

  function patch(id: string, next: Partial<DataTableFilter>) {
    onFiltersChange(filters.map((filter) => (filter.id === id ? { ...filter, ...next } : filter)));
  }

  return (
    <div className="grid gap-4 p-5">
      <p className="font-display text-base font-semibold text-heading">Filtros</p>
      {filters.map((filter, index) => {
        const column = byId.get(filter.columnId) ?? columns[0];
        if (!column) return null;
        const operators = operatorsFor(column);
        return (
          <div key={filter.id} className="flex items-center gap-3">
            <span className="w-6 flex-none font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">{index === 0 ? "onde" : "e"}</span>
            <div className="w-9 flex-none">
              <Select
                aria-label="Coluna"
                value={column.id}
                onChange={(event) => {
                  const nextColumn = byId.get(event.currentTarget.value);
                  if (!nextColumn) return;
                  // Trocar a coluna zera operador e valor: os operadores dependem do tipo.
                  patch(filter.id, { columnId: nextColumn.id, operator: operatorsFor(nextColumn)[0], value: undefined });
                }}
                className={ruleControl}
              >
                {columns.map((c) => (
                  <NativeOption key={c.id} value={c.id}>
                    {c.header || c.id}
                  </NativeOption>
                ))}
              </Select>
            </div>
            <div className="w-9 flex-none">
              <Select
                aria-label="Operador"
                value={filter.operator}
                onChange={(event) => patch(filter.id, { operator: event.currentTarget.value as DataTableFilter["operator"] })}
                className={ruleControl}
              >
                {operators.map((operator) => (
                  <NativeOption key={operator} value={operator}>
                    {operatorLabel(operator, column)}
                  </NativeOption>
                ))}
              </Select>
            </div>
            <div className="w-9 flex-none">
              <FilterValueInput column={column} filter={filter} onChange={(value) => patch(filter.id, { value })} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remover regra"
              onClick={() => onFiltersChange(filters.filter((f) => f.id !== filter.id))}
              className="w-[34px] px-0"
            >
              <Glyph name="x" />
            </Button>
          </div>
        );
      })}
      <div className="flex items-center justify-between border-t border-hairline pt-3">
        <Button variant="ghost" size="sm" onClick={onAddRule}>
          <PlusIcon />
          Adicionar regra
        </Button>
        <Button variant="outline" size="sm" onClick={() => onFiltersChange([])}>
          Limpar tudo
        </Button>
      </div>
    </div>
  );
}

function FilterValueInput({
  column,
  filter,
  onChange,
}: {
  column: DataTableColumn;
  filter: DataTableFilter;
  onChange: (value: string | number | undefined) => void;
}) {
  if (!operatorNeedsValue(filter.operator)) {
    return (
      <div aria-hidden="true" className="flex h-[34px] items-center rounded-control border-[length:var(--border-width)] border-hairline px-3 text-sm text-muted-foreground">
        —
      </div>
    );
  }
  if (column.type === "select" || column.type === "status" || (column.type === "relation" && column.options)) {
    return (
      <Select aria-label="Valor" value={filter.value === undefined ? "" : String(filter.value)} onChange={(event) => onChange(event.currentTarget.value || undefined)} className={ruleControl}>
        <NativeOption value="">—</NativeOption>
        {columnOptions(column).map((option) => (
          <NativeOption key={option.value} value={option.value}>
            {option.label}
          </NativeOption>
        ))}
      </Select>
    );
  }
  const numeric = column.type === "number" || column.type === "formula";
  return (
    <Input
      aria-label="Valor"
      type={column.type === "date" ? "date" : numeric ? "number" : "text"}
      step={numeric ? "0.01" : undefined}
      value={filter.value === undefined ? "" : String(filter.value)}
      onChange={(event) => {
        const raw = event.currentTarget.value;
        onChange(raw === "" ? undefined : numeric ? Number(raw) : raw);
      }}
      className="h-[34px] px-3 text-sm shadow-none"
    />
  );
}

// ─── Menu da coluna ──────────────────────────────────────────────────

/**
 * Menu do cabeçalho (`@adinkra/dropdown-menu`, 233): ordenar crescente/
 * decrescente, filtrar, congelar, esconder. O desenho tem ainda "Tipo:" e
 * "Excluir coluna" — ficaram de fora de propósito: mudar tipo e excluir
 * coluna continuam fora do escopo do componente (colunas vêm de quem usa).
 */
export function ColumnMenu({
  column,
  sortDirection,
  frozen,
  onSort,
  onFilter,
  onToggleFrozen,
  onHide,
  children,
  className,
}: {
  column: DataTableColumn;
  sortDirection?: DataTableSort["direction"];
  frozen: boolean;
  onSort: (direction: DataTableSort["direction"]) => void;
  onFilter: () => void;
  onToggleFrozen: () => void;
  onHide: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const check = <span className="ml-auto text-xs" aria-hidden="true">✓</span>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} aria-label={`Opções da coluna ${column.header || column.id}`}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="font-mono uppercase tracking-[0.13em]">Coluna {column.header}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSort("asc")}>
          <Glyph name="chevUp" />
          Ordenar crescente
          {sortDirection === "asc" ? check : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort("desc")}>
          <Glyph name="chevDown" />
          Ordenar decrescente
          {sortDirection === "desc" ? check : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFilter}>
          <Glyph name="filter" />
          Filtrar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleFrozen}>
          <Glyph name="pin" />
          {frozen ? "Descongelar" : "Congelar"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onHide}>
          <Glyph name="minus" />
          Esconder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Menu "Ordenação" da barra: escolhe a coluna; clicar de novo inverte a direção. */
export function SortMenu({
  columns,
  sorts,
  onSortsChange,
  trigger,
}: {
  columns: DataTableColumn[];
  sorts: DataTableSort[];
  onSortsChange: (sorts: DataTableSort[]) => void;
  trigger: React.ReactElement<Record<string, unknown>>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-mono uppercase tracking-[0.13em]">Ordenar por</DropdownMenuLabel>
        {columns.map((column) => {
          const current = sorts.find((sort) => sort.columnId === column.id);
          return (
            <DropdownMenuItem
              key={column.id}
              onClick={() =>
                onSortsChange(
                  current
                    ? sorts.map((s) => (s.columnId === column.id ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" } : s))
                    : [...sorts, { columnId: column.id, direction: "asc" }],
                )
              }
            >
              <span className="text-muted-foreground">
                <ColumnTypeIcon type={column.type} />
              </span>
              {column.header || column.id}
              {current ? <Glyph name={current.direction === "asc" ? "sortUp" : "sortDown"} className="ml-auto" /> : null}
            </DropdownMenuItem>
          );
        })}
        {sorts.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onSortsChange([])}>
              Remover ordenação
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Menu da agregação (célula do rodapé): Nenhuma/Soma/Média/Mínimo/Máximo/Contar valores. */
export function AggregateMenu({
  column,
  value,
  onChange,
  children,
  className,
}: {
  column: DataTableColumn;
  value: Aggregate;
  onChange: (aggregate: Aggregate) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} aria-label={`Agregação da coluna ${column.header || column.id}`}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-mono uppercase tracking-[0.13em]">Agregar {column.header}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as Aggregate)}>
          {aggregatesFor(column).map((aggregate) => (
            <DropdownMenuRadioItem key={aggregate} value={aggregate}>
              {aggregateLabels[aggregate]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
