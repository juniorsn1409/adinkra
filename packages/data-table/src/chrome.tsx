"use client";

// Peças em volta da grade: barra de visões (abas em texto, ferramentas,
// busca, slot de ações, "Novo"), barra de filtros (chip de ordenação, um chip
// por regra, atalhos de propriedade, "+ Filtro", contagem), barra de seleção
// e os popovers — filtro, ordenação, propriedades, menu da coluna, nova
// propriedade e cálculo do rodapé.
//
// Redesenho plano (07/10/2026, arquivo "Data table · Adinkra φ"): a tabela
// sai do neobrutalismo — sem borda de tinta nem sombra dura, linhas de 1px
// `--hairline`, abas só em texto, chips de raio 13 e menus no `--card` sem
// borda, com sombra suave. Cores só dos tokens. Medidas do arquivo
// arredondadas pra escala φ (pedido do usuário): 28 → 26, 44 → 42, 30 → 34,
// 14/20 → 13/21, raio 6 → 5.
import * as React from "react";
import { cn } from "@adinkra/core";
import { Popover, PopoverContent, PopoverTrigger } from "@adinkra/popover";
import { ColumnTypeIcon, Glyph, PlusIcon } from "./glyphs";
import {
  aggregateLabels,
  aggregatesFor,
  columnOptions,
  cycleSort,
  formatShortDate,
  hasOptions,
  isFilterActive,
  isGroupable,
  operatorLabel,
  operatorNeedsValue,
  operatorsFor,
  parseISODate,
} from "./logic";
import type {
  Aggregate,
  ColumnType,
  DataTableBulkAction,
  DataTableColumn,
  DataTableFilter,
  DataTableSort,
  DataTableView,
  SelectOption,
  StatusOption,
} from "./types";

type Trigger = React.ReactElement<Record<string, unknown>>;

// ─── Tons do redesenho plano (todos misturados de tokens) ────────────

/** Véu de hover: 5% da tinta. */
export const hoverBg = "hover:bg-[color-mix(in_srgb,var(--heading)_5%,transparent)]";
/** Fundo de "ligado" fixo (aba ativa, item marcado). */
export const activeBg = "bg-[color-mix(in_srgb,var(--heading)_5%,transparent)]";
/** Chip completo: céu a 21%, texto em tinta. */
export const chipBg = "bg-[color-mix(in_srgb,var(--secondary)_21%,transparent)] text-heading";
/** Sombra suave dos menus e do painel: contorno de 1px + difusa de 8/21. */
export const softShadow = "shadow-[0_0_0_1px_var(--hairline),0_8px_21px_color-mix(in_srgb,#1B1D26_21%,transparent)]";
/** Anel de foco do sistema. */
export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

// ─── Peças de menu ───────────────────────────────────────────────────

/** Painel dos popovers: cartão sem borda, raio 5, sombra suave, padding 5, itens colados. */
export const menuPanel = cn("grid gap-px rounded-control border-0 bg-card p-2 text-sm text-foreground", softShadow);

/** Item de 34: ícone de 13 em cinza, texto em tinta, hover no véu. */
export const menuItem = cn(
  "flex min-h-[34px] w-full items-center gap-3 rounded-[3px] px-3 py-1 text-left text-sm text-heading outline-none",
  hoverBg,
  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
);

/** Rótulo de 10 em caixa-alta (rodapé, notas do painel). */
export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-xs uppercase tracking-[0.06em] text-muted-foreground", className)}>{children}</span>;
}

/** Cabeçalho de seção dos menus: 10, peso 500, cinza, sem caixa-alta. */
export function MenuCaption({ children }: { children: React.ReactNode }) {
  return <span className="block px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{children}</span>;
}

export function MenuSeparator() {
  return <div aria-hidden="true" className="my-[3px] h-px bg-hairline" />;
}

export function MenuCheck({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className={cn("ml-auto inline-flex text-heading", on ? "opacity-100" : "opacity-0")}>
      <Glyph name="check" size={13} />
    </span>
  );
}

/** Ícone do tipo num quadro de 16 (alinha os textos da lista mesmo com glifos de larguras diferentes). */
export function TypeIcon({ column }: { column: Pick<DataTableColumn, "type" | "multi"> }) {
  return (
    <span className="inline-flex w-4 flex-none justify-center text-muted-foreground">
      <ColumnTypeIcon type={column.type} multi={column.multi} />
    </span>
  );
}

/**
 * Caixa de marcar nativa com `accent-color` primária (o arquivo usa a
 * nativa: o `@adinkra/checkbox`, de borda de tinta, destoa da tabela plana).
 * `indeterminate` só existe como propriedade do DOM, então vai pelo ref.
 */
export const NativeCheckbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
    indeterminate?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ indeterminate = false, onCheckedChange, className, ...props }, ref) => {
  const inner = React.useRef<HTMLInputElement | null>(null);
  React.useLayoutEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  });
  return (
    <input
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="checkbox"
      onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
      className={cn("m-0 size-4 flex-none cursor-pointer accent-[var(--primary)] disabled:cursor-default disabled:opacity-[0.382]", focusRing, className)}
      {...props}
    />
  );
});
NativeCheckbox.displayName = "NativeCheckbox";

/**
 * Chip de 26, raio 13: completo = céu a 21% com texto em tinta; incompleto =
 * contorno de 1px `--hairline`; atalho = só texto cinza.
 */
const Chip = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "on" | "pending" | "ghost";
    lead?: React.ReactNode;
    caret?: boolean;
    label: React.ReactNode;
    keyLabel?: string;
  }
>(({ tone = "ghost", lead, caret = true, label, keyLabel, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex h-[26px] max-w-[288px] flex-none items-center gap-2 whitespace-nowrap rounded-[13px] px-3 text-sm",
      focusRing,
      tone === "on" && chipBg,
      tone === "pending" && "border border-hairline text-heading",
      tone === "ghost" && cn("text-muted-foreground hover:text-heading", hoverBg),
      className,
    )}
    {...props}
  >
    {lead ? <span className="inline-flex flex-none">{lead}</span> : null}
    {keyLabel ? <span className="flex-none">{keyLabel}</span> : null}
    <span className="truncate">{label}</span>
    {caret ? <Glyph name="chevDown" size={10} /> : null}
  </button>
));
Chip.displayName = "Chip";

/** Chip de escolha (operador, "Agrupar por"): ligado = céu a 21%, desligado = contorno fino. */
function ChoiceChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-[26px] items-center whitespace-nowrap rounded-[13px] px-3 text-sm",
        focusRing,
        on ? chipBg : cn("border border-hairline text-foreground", hoverBg),
      )}
    >
      {children}
    </button>
  );
}

const fieldInput = cn(
  "h-[34px] w-full rounded-control border border-hairline bg-surface px-3 text-sm text-heading outline-none placeholder:text-muted-foreground",
  "focus-visible:border-ring",
);

// ─── Barra de visões ─────────────────────────────────────────────────

/** Ferramenta de 26 sem borda: ligada pinta o ícone de `--link`; o fundo só no hover. */
const ToolButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }>(
  ({ on, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      className={cn(
        "flex size-[26px] flex-none items-center justify-center rounded-control",
        "transition-colors duration-150 ease-[var(--ease-out)]",
        focusRing,
        hoverBg,
        on ? "text-link" : "text-muted-foreground hover:text-heading",
        className,
      )}
      {...props}
    />
  ),
);
ToolButton.displayName = "ToolButton";

/**
 * Abas só em texto (o arquivo novo): a ativa ganha o véu e peso 600, as
 * outras ficam em cinza. `role="tablist"` com setas ←/→ entre elas — o
 * `@adinkra/tabs` (lista de tinta, aba primária) é o oposto do desenho, por
 * isso não é usado aqui.
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
  const active = activeView ?? views[0]?.id;
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    const view = views[next];
    if (!view) return;
    onViewChange?.(view.id);
    refs.current[next]?.focus();
  }
  return (
    <div role="tablist" aria-label="Visões" className="flex min-w-0 flex-wrap items-center gap-1">
      {views.map((view, index) => {
        const on = view.id === active;
        return (
          <button
            key={view.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onViewChange?.(view.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex h-[26px] items-center gap-2 whitespace-nowrap rounded-control px-2 text-sm",
              focusRing,
              hoverBg,
              on ? cn(activeBg, "font-semibold text-heading") : "font-medium text-muted-foreground",
            )}
          >
            {view.icon}
            {view.label}
          </button>
        );
      })}
    </div>
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
  sortPopover,
  propertiesPopover,
  onNew,
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
  sortPopover: (trigger: Trigger) => React.ReactNode;
  propertiesPopover: (trigger: Trigger) => React.ReactNode;
  onNew?: () => void;
}) {
  const [searchOpen, setSearchOpen] = React.useState(search !== "");

  return (
    <div className="flex min-h-[42px] flex-wrap items-center justify-between gap-3 border-b border-hairline py-1">
      {views && views.length > 0 ? <ViewTabs views={views} activeView={activeView} onViewChange={onViewChange} /> : <span />}
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton aria-label="Filtros" on={filterOn} onClick={onFilterClick}>
          <Glyph name="filter" size={16} />
        </ToolButton>
        {sortPopover(
          <ToolButton aria-label="Ordenação" on={sortOn}>
            <Glyph name="sort" size={16} />
          </ToolButton>,
        )}
        {searchable && searchOpen ? (
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar…"
            autoFocus
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onSearchChange("");
                setSearchOpen(false);
              }
            }}
            className={cn(fieldInput, "h-[26px] w-[233px]")}
          />
        ) : null}
        {searchable ? (
          <ToolButton
            aria-label="Buscar"
            on={searchOpen || search !== ""}
            onClick={() => {
              if (searchOpen) onSearchChange("");
              setSearchOpen(!searchOpen);
            }}
          >
            <Glyph name="search" size={16} />
          </ToolButton>
        ) : null}
        {propertiesPopover(
          <ToolButton aria-label="Propriedades e agrupamento">
            <Glyph name="sliders" size={16} />
          </ToolButton>,
        )}
        {toolbar}
        {onNew ? (
          <button
            type="button"
            onClick={onNew}
            className={cn(
              "ml-1 inline-flex h-[26px] items-center gap-2 rounded-control bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover",
              focusRing,
            )}
          >
            Novo
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Barra de filtros ────────────────────────────────────────────────

function filterRuleLabel(column: DataTableColumn, filter: DataTableFilter): string {
  const operator = operatorLabel(filter.operator, column);
  if (!operatorNeedsValue(filter.operator)) return operator;
  if (filter.value === undefined || filter.value === "") return `${operator} …`;
  let value = String(filter.value);
  if (hasOptions(column)) value = columnOptions(column).find((option) => option.value === value)?.label ?? value;
  else if (column.type === "date") {
    const date = parseISODate(value);
    if (date) value = formatShortDate(date);
  }
  return `${operator} ${value}`;
}

export function FilterBar({
  columns,
  sorts,
  filters,
  onFiltersChange,
  openFilterId,
  onOpenFilterChange,
  onAddFilter,
  quickColumns,
  sortPopover,
  countLabel,
  renderOption,
}: {
  columns: DataTableColumn[];
  sorts: DataTableSort[];
  filters: DataTableFilter[];
  onFiltersChange: (filters: DataTableFilter[]) => void;
  openFilterId: string | null;
  onOpenFilterChange: (id: string | null) => void;
  onAddFilter: (column: DataTableColumn) => void;
  /** Atalhos ("Conta ▾"): colunas com opções que ainda não têm filtro. */
  quickColumns: DataTableColumn[];
  sortPopover: (trigger: Trigger) => React.ReactNode;
  countLabel: string;
  renderOption: (column: DataTableColumn, option: SelectOption | StatusOption) => React.ReactNode;
}) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const [addOpen, setAddOpen] = React.useState(false);
  const firstSort = sorts[0];
  const firstSortColumn = firstSort ? byId.get(firstSort.columnId) : undefined;

  return (
    // Abaixo de 610 (cartões do mobile), os chips ficam numa linha só e rolam.
    <div className="flex min-h-[42px] flex-nowrap items-center gap-2 overflow-x-auto py-2 @[610px]:flex-wrap @[610px]:overflow-visible">
      {firstSort && firstSortColumn ? (
        <>
          {sortPopover(
            <Chip
              tone="on"
              lead={<Glyph name="sort" />}
              label={sorts.length === 1 ? `${firstSort.direction === "asc" ? "↑" : "↓"} ${firstSortColumn.header}` : `${sorts.length} ordenações`}
            />,
          )}
          <span aria-hidden="true" className="mx-1 h-5 w-px flex-none bg-hairline" />
        </>
      ) : null}
      {filters.map((filter) => {
        const column = byId.get(filter.columnId);
        if (!column) return null;
        return (
          <FilterChip
            key={filter.id}
            column={column}
            filter={filter}
            open={openFilterId === filter.id}
            onOpenChange={(open) => onOpenFilterChange(open ? filter.id : null)}
            onChange={(patch) => onFiltersChange(filters.map((f) => (f.id === filter.id ? { ...f, ...patch } : f)))}
            onRemove={() => {
              onFiltersChange(filters.filter((f) => f.id !== filter.id));
              onOpenFilterChange(null);
            }}
            renderOption={renderOption}
          />
        );
      })}
      {quickColumns.map((column) => (
        <Chip key={column.id} lead={<TypeIcon column={column} />} label={column.header || column.id} onClick={() => onAddFilter(column)} />
      ))}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger render={<Chip lead={<PlusIcon />} caret={false} label="Filtro" />} />
        <PopoverContent className={cn(menuPanel, "w-[233px]")}>
          <MenuCaption>Filtrar por</MenuCaption>
          {columns.map((column) => (
            <button
              key={column.id}
              type="button"
              className={menuItem}
              onClick={() => {
                setAddOpen(false);
                onAddFilter(column);
              }}
            >
              <TypeIcon column={column} />
              {column.header || column.id}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <span className="flex-1" />
      <span className="flex-none text-xs tabular-nums text-muted-foreground">{countLabel}</span>
    </div>
  );
}

/**
 * Um chip por regra, com o popover da regra: nome da coluna, operadores em
 * chips, o valor (campo, ou a lista de opções com ✓) e "Excluir filtro".
 * Regra sem valor fica só com contorno (incompleta) e ainda não filtra.
 */
function FilterChip({
  column,
  filter,
  open,
  onOpenChange,
  onChange,
  onRemove,
  renderOption,
}: {
  column: DataTableColumn;
  filter: DataTableFilter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<DataTableFilter>) => void;
  onRemove: () => void;
  renderOption: (column: DataTableColumn, option: SelectOption | StatusOption) => React.ReactNode;
}) {
  const needsValue = operatorNeedsValue(filter.operator);
  const numeric = column.type === "number" || (column.type === "formula" && !!column.format);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Chip
            tone={isFilterActive(filter) ? "on" : "pending"}
            lead={<ColumnTypeIcon type={column.type} multi={column.multi} />}
            keyLabel={`${column.header || column.id}:`}
            label={filterRuleLabel(column, filter)}
          />
        }
      />
      <PopoverContent className={cn(menuPanel, "w-[377px] max-w-[calc(100vw-26px)] gap-2 p-3")}>
        <div className="flex items-center gap-2 px-1">
          <TypeIcon column={column} />
          <span className="text-sm font-semibold text-heading">{column.header || column.id}</span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Operador">
          {operatorsFor(column).map((operator) => (
            <ChoiceChip key={operator} on={filter.operator === operator} onClick={() => onChange({ operator })}>
              {operatorLabel(operator, column)}
            </ChoiceChip>
          ))}
        </div>
        {needsValue && hasOptions(column) ? (
          <div className="grid gap-px">
            {columnOptions(column).map((option) => (
              <button
                key={option.value}
                type="button"
                className={menuItem}
                onClick={() => onChange({ value: filter.value === option.value ? undefined : option.value })}
              >
                {renderOption(column, option)}
                <MenuCheck on={filter.value === option.value} />
              </button>
            ))}
          </div>
        ) : needsValue ? (
          <input
            aria-label="Valor do filtro"
            placeholder="Digite um valor…"
            type={column.type === "date" ? "date" : numeric ? "number" : "text"}
            step={numeric ? "0.01" : undefined}
            autoFocus
            value={filter.value === undefined ? "" : String(filter.value)}
            onChange={(event) => {
              const raw = event.currentTarget.value;
              onChange({ value: raw === "" ? undefined : numeric ? Number(raw) : raw });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") onOpenChange(false);
            }}
            className={fieldInput}
          />
        ) : null}
        <MenuSeparator />
        <button type="button" className={cn(menuItem, "text-destructive")} onClick={onRemove}>
          <Glyph name="trash" />
          Excluir filtro
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─── Ordenação ───────────────────────────────────────────────────────

/** "Ordenar por": cada clique na coluna alterna sem → ↑ → ↓ → sem; a ordem dos cliques é a prioridade. */
export function SortPopover({
  columns,
  sorts,
  onSortsChange,
  trigger,
}: {
  columns: DataTableColumn[];
  sorts: DataTableSort[];
  onSortsChange: (sorts: DataTableSort[]) => void;
  trigger: Trigger;
}) {
  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className={cn(menuPanel, "w-[288px] max-w-[calc(100vw-26px)]")}>
        <MenuCaption>Ordenar por · clique alterna ↑ ↓ e remove</MenuCaption>
        {columns.map((column) => {
          const index = sorts.findIndex((sort) => sort.columnId === column.id);
          const current = sorts[index];
          return (
            <button key={column.id} type="button" className={menuItem} onClick={() => onSortsChange(cycleSort(sorts, column.id))}>
              <TypeIcon column={column} />
              <span className="truncate">{column.header || column.id}</span>
              {current ? (
                <span className={cn("ml-auto inline-flex h-[21px] flex-none items-center gap-1 rounded-[3px] px-2 text-xs tabular-nums", chipBg)}>
                  {sorts.length > 1 ? `${index + 1} ` : ""}
                  {current.direction === "asc" ? "↑ crescente" : "↓ decrescente"}
                </span>
              ) : null}
            </button>
          );
        })}
        {sorts.length > 0 ? (
          <>
            <MenuSeparator />
            <button type="button" className={cn(menuItem, "text-destructive")} onClick={() => onSortsChange([])}>
              <Glyph name="trash" />
              Excluir ordenação
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

// ─── Propriedades ────────────────────────────────────────────────────

/**
 * Painel "Propriedades e agrupamento": mostrar/ocultar cada coluna (a
 * principal não sai), mostrar ou ocultar todas, agrupar por uma coluna e
 * quebrar o texto das células.
 */
export function PropertiesPopover({
  columns,
  isHidden,
  primaryId,
  onToggle,
  onSetAll,
  groupBy,
  onGroupByChange,
  wrap,
  onWrapChange,
  trigger,
}: {
  columns: DataTableColumn[];
  isHidden: (column: DataTableColumn) => boolean;
  primaryId?: string;
  onToggle: (column: DataTableColumn, visible: boolean) => void;
  onSetAll: (visible: boolean) => void;
  groupBy: string | null;
  onGroupByChange: (columnId: string | null) => void;
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  trigger: Trigger;
}) {
  const groupable = columns.filter((column) => isGroupable(column) && column.id !== primaryId);
  const linkButton = cn("rounded-[3px] px-2 py-[2px] text-sm font-medium text-link", hoverBg, focusRing);
  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className={cn(menuPanel, "max-h-[610px] w-[288px] max-w-[calc(100vw-26px)] overflow-y-auto")}>
        <MenuCaption>Propriedades visíveis</MenuCaption>
        {columns.map((column) => {
          const locked = column.id === primaryId;
          return (
            <label key={column.id} className={cn(menuItem, locked ? "cursor-default" : "cursor-pointer")}>
              <TypeIcon column={column} />
              <span className="flex-1 truncate">{column.header || column.id}</span>
              <NativeCheckbox
                aria-label={`Mostrar ${column.header || column.id}`}
                checked={!isHidden(column)}
                disabled={locked}
                onCheckedChange={(checked) => onToggle(column, checked)}
              />
            </label>
          );
        })}
        <div className="flex gap-2 px-2 py-1">
          <button type="button" onClick={() => onSetAll(true)} className={linkButton}>
            Mostrar todas
          </button>
          <button type="button" onClick={() => onSetAll(false)} className={linkButton}>
            Ocultar todas
          </button>
        </div>
        {groupable.length > 0 ? (
          <>
            <MenuSeparator />
            <MenuCaption>Agrupar por</MenuCaption>
            <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1">
              <ChoiceChip on={groupBy === null} onClick={() => onGroupByChange(null)}>
                Nenhum
              </ChoiceChip>
              {groupable.map((column) => (
                <ChoiceChip key={column.id} on={groupBy === column.id} onClick={() => onGroupByChange(column.id)}>
                  {column.header || column.id}
                </ChoiceChip>
              ))}
            </div>
          </>
        ) : null}
        <MenuSeparator />
        <label className={cn(menuItem, "cursor-pointer")}>
          <span className="inline-flex w-4 flex-none justify-center text-muted-foreground">
            <Glyph name="wrap" />
          </span>
          <span className="flex-1">Quebrar conteúdo das células</span>
          <NativeCheckbox aria-label="Quebrar conteúdo das células" checked={wrap} onCheckedChange={onWrapChange} />
        </label>
      </PopoverContent>
    </Popover>
  );
}

// ─── Menu da coluna ──────────────────────────────────────────────────

const typeLabels: Record<ColumnType, string> = {
  text: "Texto",
  select: "Seleção",
  number: "Número",
  date: "Data",
  status: "Status",
  relation: "Relação",
  formula: "Fórmula",
  checkbox: "Caixa de seleção",
};

export function typeLabelOf(column: DataTableColumn, isPrimary: boolean): string {
  if (isPrimary) return "Título";
  if (column.type === "select" && column.multi) return "Seleção múltipla";
  return typeLabels[column.type];
}

/**
 * Menu do cabeçalho (233): nome (com `onColumnsChange`), tipo, ordenar
 * crescente/decrescente (substitui a ordenação inteira), filtrar, agrupar,
 * congelar (mantido a pedido do usuário — o arquivo não tem), mover pra
 * esquerda/direita e ocultar. A principal não move nem some. Controlado de
 * fora (`open`) porque a coluna nova do "+" já abre com o menu, pra renomear.
 */
export function ColumnPopover({
  column,
  isPrimary,
  open,
  onOpenChange,
  onRename,
  sortDirection,
  onSort,
  onFilter,
  grouped,
  onToggleGroup,
  frozen,
  onToggleFrozen,
  onMove,
  canMoveLeft,
  canMoveRight,
  onHide,
  trigger,
}: {
  column: DataTableColumn;
  isPrimary: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename?: (header: string) => void;
  sortDirection?: DataTableSort["direction"];
  onSort: (direction: DataTableSort["direction"]) => void;
  onFilter: () => void;
  grouped: boolean;
  onToggleGroup?: () => void;
  frozen: boolean;
  onToggleFrozen: () => void;
  onMove: (delta: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onHide: () => void;
  trigger: Trigger;
}) {
  const act = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };
  const icon = (name: Parameters<typeof Glyph>[0]["name"]) => <Glyph name={name} className="text-muted-foreground" />;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className={cn(menuPanel, "w-[233px]")}>
        {onRename ? (
          <div className="p-[3px]">
            <input
              aria-label="Nome da propriedade"
              defaultValue={column.header}
              onBlur={(event) => {
                const next = event.currentTarget.value.trim();
                if (next && next !== column.header) onRename(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                  onOpenChange(false);
                }
              }}
              className={fieldInput}
            />
          </div>
        ) : null}
        <MenuCaption>{typeLabelOf(column, isPrimary)}</MenuCaption>
        <button type="button" className={menuItem} onClick={act(() => onSort("asc"))}>
          {icon("sortUp")}
          Ordenar crescente
          <MenuCheck on={sortDirection === "asc"} />
        </button>
        <button type="button" className={menuItem} onClick={act(() => onSort("desc"))}>
          {icon("sortDown")}
          Ordenar decrescente
          <MenuCheck on={sortDirection === "desc"} />
        </button>
        <button type="button" className={menuItem} onClick={act(onFilter)}>
          {icon("filter")}
          Filtrar
        </button>
        {onToggleGroup ? (
          <button type="button" className={menuItem} onClick={act(onToggleGroup)}>
            {icon("group")}
            {grouped ? "Desagrupar" : "Agrupar por esta propriedade"}
          </button>
        ) : null}
        <MenuSeparator />
        <button type="button" className={menuItem} onClick={act(onToggleFrozen)}>
          {icon("pin")}
          {frozen ? "Descongelar" : "Congelar"}
        </button>
        {!isPrimary ? (
          <>
            <button type="button" className={menuItem} disabled={!canMoveLeft} onClick={() => onMove(-1)}>
              {icon("arrowLeft")}
              <span className={cn(!canMoveLeft && "opacity-[0.382]")}>Mover para a esquerda</span>
            </button>
            <button type="button" className={menuItem} disabled={!canMoveRight} onClick={() => onMove(1)}>
              {icon("arrowRight")}
              <span className={cn(!canMoveRight && "opacity-[0.382]")}>Mover para a direita</span>
            </button>
            <button type="button" className={menuItem} onClick={act(onHide)}>
              {icon("minus")}
              Ocultar na visão
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** Tipos do "+" de propriedade nova, com a dica do desenho. */
const NEW_PROPERTY_TYPES: { type: ColumnType; multi?: boolean; label: string; hint: string }[] = [
  { type: "text", label: "Texto", hint: "livre" },
  { type: "number", label: "Número", hint: "R$, %" },
  { type: "select", label: "Seleção", hint: "1 opção" },
  { type: "select", multi: true, label: "Seleção múltipla", hint: "tags" },
  { type: "status", label: "Status", hint: "bolinha" },
  { type: "date", label: "Data", hint: "dia" },
  { type: "checkbox", label: "Caixa de seleção", hint: "sim/não" },
];

export function AddPropertyPopover({
  onAdd,
  trigger,
}: {
  onAdd: (type: ColumnType, label: string, multi?: boolean) => void;
  trigger: Trigger;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className={cn(menuPanel, "w-[233px]")}>
        <MenuCaption>Nova propriedade · tipo</MenuCaption>
        {NEW_PROPERTY_TYPES.map((item) => (
          <button
            key={item.label}
            type="button"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              onAdd(item.type, item.label, item.multi);
            }}
          >
            <TypeIcon column={{ type: item.type, multi: item.multi }} />
            <span className="flex-1">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.hint}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Menu "Calcular" (célula do rodapé): as agregações que valem pro tipo, com ✓ na atual. */
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
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={className} aria-label={`Calcular ${column.header || column.id}`}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className={cn(menuPanel, "w-[233px]")}>
        <MenuCaption>Calcular · {column.header || column.id}</MenuCaption>
        {aggregatesFor(column).map((aggregate) => (
          <button
            key={aggregate}
            type="button"
            className={menuItem}
            onClick={() => {
              onChange(aggregate);
              setOpen(false);
            }}
          >
            {aggregateLabels[aggregate]}
            <MenuCheck on={aggregate === value} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Barra de seleção ────────────────────────────────────────────────

/**
 * Barra de seleção: entra no lugar da barra de filtros enquanto há linha
 * marcada, numa névoa de céu. Conta, ações de quem usa (`bulkActions`),
 * Duplicar, Excluir e limpar a seleção.
 */
export function BulkBar({
  count,
  actions,
  onAction,
  onDuplicate,
  onDelete,
  onClear,
}: {
  count: number;
  actions: DataTableBulkAction[];
  onAction: (action: DataTableBulkAction) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  const ghost = cn("inline-flex h-[26px] max-w-[288px] items-center gap-2 whitespace-nowrap rounded-control px-2 text-sm font-medium", hoverBg, focusRing);
  return (
    <div
      role="toolbar"
      aria-label="Linhas selecionadas"
      className="flex min-h-[42px] flex-wrap items-center gap-2 border-b border-hairline bg-[color-mix(in_srgb,var(--secondary)_13%,var(--card))] px-4 py-2"
    >
      <span className="text-sm font-semibold text-heading">
        {count} {count === 1 ? "selecionada" : "selecionadas"}
      </span>
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-hairline" />
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction(action)}
          className={cn(ghost, action.destructive ? "text-destructive" : "text-foreground hover:text-heading")}
        >
          {action.icon}
          <span className="truncate">{action.label}</span>
        </button>
      ))}
      <button type="button" onClick={onDuplicate} className={cn(ghost, "text-foreground hover:text-heading")}>
        <Glyph name="copy" />
        Duplicar
      </button>
      <button type="button" onClick={onDelete} className={cn(ghost, "text-destructive")}>
        <Glyph name="trash" />
        Excluir
      </button>
      <span className="flex-1" />
      <button type="button" aria-label="Limpar seleção" onClick={onClear} className={cn(ghost, "w-[26px] justify-center px-0 text-muted-foreground")}>
        <Glyph name="x" />
      </button>
    </div>
  );
}
