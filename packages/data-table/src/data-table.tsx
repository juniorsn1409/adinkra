"use client";

import * as React from "react";
import { Badge } from "@adinkra/badge";
import { cn } from "@adinkra/core";
import { Skeleton } from "@adinkra/skeleton";
import { Calendar, Popover, PopoverContent, PopoverTrigger, formatLongDate } from "@adinkra/date-picker";
import { Sheet, SheetContent } from "@adinkra/sheet";
import {
  AddPropertyPopover,
  AggregateMenu,
  BulkBar,
  Caption,
  ColumnPopover,
  FilterBar,
  MenuCaption,
  MenuCheck,
  MenuSeparator,
  NativeCheckbox,
  PropertiesPopover,
  SortPopover,
  TopBar,
  TypeIcon,
  focusRing,
  hoverBg,
  menuItem,
  menuPanel,
  softShadow,
} from "./chrome";
import { DragHandleIcon, Glyph, PlusIcon, RelationGlyph } from "./glyphs";
import {
  aggregateShortLabel,
  applyFilters,
  applySorts,
  cellValue,
  columnOptions,
  computedFormula,
  createEmptyRow,
  filterPreset,
  formatAggregate,
  formatNumber,
  formatShortDate,
  groupPreset,
  groupRows,
  hasOptions,
  isFormulaOverridden,
  isGroupable,
  isNumericColumn,
  matchesSearch,
  nextOptionColor,
  normalizeText,
  operatorsFor,
  optionValues,
  parseISODate,
  primaryColumnOf,
} from "./logic";
import type {
  Aggregate,
  ColumnType,
  DataTableBulkAction,
  DataTableColumn,
  DataTableFilter,
  DataTablePeekConfig,
  DataTableProps,
  DataTableRow,
  DataTableSort,
  RelationIcon,
  SelectColor,
  SelectOption,
  StatusColor,
  StatusOption,
} from "./types";

type AnyOption = SelectOption | StatusOption;

// Guarda no row como "yyyy-mm-dd" (mesmo formato do <input type="date"> de
// antes) — só a célula troca de motor, o formato salvo continua o mesmo.
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Caixa de seleção some em repouso e aparece no hover da linha, marcada, com
// foco, ou com qualquer linha marcada (`data-anysel` na raiz), como no desenho.
const revealCheckbox =
  "opacity-0 checked:opacity-100 indeterminate:opacity-100 focus-visible:opacity-100 group-data-[anysel=true]/table:opacity-100";

function HeaderCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <NativeCheckbox
      aria-label="Selecionar todas as linhas"
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
      className={cn(revealCheckbox, "group-hover/header:opacity-100")}
    />
  );
}

// `surface` separa a mesma célula na grade, no cartão do mobile e no painel
// "Abrir": estão no DOM ao mesmo tempo (o cartão escondido por container
// query), e sem isso editar num abriria o Popover/campo do outro também.
type Surface = "grid" | "card" | "peek";

interface CellId {
  rowId: string;
  columnId: string;
  surface: Surface;
}

function sameCell(a: CellId | null, b: CellId): boolean {
  return !!a && a.rowId === b.rowId && a.columnId === b.columnId && a.surface === b.surface;
}

// Ref-callback em vez de useEffect: foca (e seleciona o conteúdo, pra
// digitar por cima) assim que o <input> de edição monta — sem isso, entrar
// em modo de edição não move o foco pro campo, e o teclado (Enter, Ctrl+A,
// digitar) vai pro documento inteiro em vez da célula.
function autoFocusAndSelect(el: HTMLInputElement | null) {
  if (!el) return;
  el.focus();
  el.select();
}

// ─── Cores das opções ────────────────────────────────────────────────

// Strings literais inteiras (não montadas) pro Tailwind enxergar as classes.
// Só tokens existentes; a névoa (`mist`) é o único par fixo — ver SelectColor.
const OPTION_COLORS: Record<StatusColor, { fill: string; dot: string }> = {
  primary: { fill: "bg-primary text-primary-foreground", dot: "bg-primary" },
  accent: { fill: "bg-accent text-accent-foreground", dot: "bg-accent" },
  secondary: { fill: "bg-secondary text-secondary-foreground", dot: "bg-secondary" },
  "tag-coral": { fill: "bg-tag-coral text-tag-coral-foreground", dot: "bg-tag-coral" },
  "tag-sky": { fill: "bg-tag-sky text-tag-sky-foreground", dot: "bg-tag-sky" },
  "tag-mustard": { fill: "bg-tag-mustard text-tag-mustard-foreground", dot: "bg-tag-mustard" },
  "tag-navy": { fill: "bg-tag-navy text-tag-navy-foreground", dot: "bg-tag-navy" },
  mist: { fill: "bg-[#C9DDF0] text-[#1E3550]", dot: "bg-[#C9DDF0]" },
  gray: { fill: "bg-surface text-heading", dot: "bg-surface" },
  destructive: { fill: "bg-destructive text-destructive-foreground", dot: "bg-destructive" },
};

const BADGE_VARIANTS = new Set<string>(["primary", "accent", "secondary", "tag-coral", "tag-sky", "tag-mustard"]);

// Etiqueta plana (arquivo de 07/10): sem borda, raio 3, 21 de altura.
const pillBase = "inline-flex h-[21px] max-w-full flex-none items-center gap-2 overflow-hidden whitespace-nowrap rounded-[3px] px-2 text-sm";

/** Pílula neutra (grupo sem cor, "Criar …" no seletor). */
function NeutralPill({ children }: { children: React.ReactNode }) {
  return <span className={cn(pillBase, OPTION_COLORS.gray.fill)}>{children}</span>;
}

/**
 * Como uma opção aparece, por tipo de coluna (arquivo de 07/10, medidas φ):
 * - status → bolinha de 8 na cor do texto, raio cheio, 21 de altura;
 * - select `"pill"` (padrão) → etiqueta plana, raio 3;
 * - select `"dot"` → ponto de 8 + texto sublinhado em `--hairline` (conta,
 *   tags);
 * - select `"badge"` → `@adinkra/badge` (o visual antigo, opt-in).
 * As cores continuam as do design system (`tag-*`, `mist`, `gray`…).
 */
function OptionView({ column, option }: { column: DataTableColumn; option: AnyOption }) {
  const colors = OPTION_COLORS[option.color] ?? OPTION_COLORS.primary;
  // Relação com opções: só o rótulo sublinhado (o glifo fica fora, é o "abrir").
  if (column.type === "relation") return <span className={relationText}>{option.label}</span>;
  if (column.type === "status") {
    return (
      <span className={cn(pillBase, "rounded-full pl-2 pr-3", colors.fill)}>
        <span aria-hidden="true" className="size-3 flex-none rounded-full bg-current" />
        <span className="truncate">{option.label}</span>
      </span>
    );
  }
  if (column.selectStyle === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", relationText)}>
        <span aria-hidden="true" className={cn("size-3 flex-none rounded-full", colors.dot)} />
        {option.label}
      </span>
    );
  }
  if (column.selectStyle === "badge") {
    // Cor que não é variante do Badge (tag-navy, mist, gray, destructive):
    // variante qualquer + as classes de cor por cima (o `cn` do Badge resolve).
    if (BADGE_VARIANTS.has(option.color)) {
      return <Badge variant={option.color as Exclude<SelectColor, "tag-navy" | "mist" | "gray">}>{option.label}</Badge>;
    }
    return <Badge className={colors.fill}>{option.label}</Badge>;
  }
  return (
    <span className={cn(pillBase, colors.fill)}>
      <span className="truncate">{option.label}</span>
    </span>
  );
}

// Célula padrão: 42 de altura mínima (cresce quando o texto quebra),
// conteúdo alinhado no topo, padding 8 (arquivo: 44 e 8 → φ: 42 e 8). Só a
// célula sob o ponteiro ganha o véu (a linha inteira não muda no hover).
// Menu aberto e foco: anel interno de 2 `--ring`.
const cellPad = "min-h-[42px] p-3";
const cellTrigger = cn(
  "group/cell flex w-full items-start gap-x-2 gap-y-1 text-left text-sm text-heading outline-none",
  cellPad,
  hoverBg,
  "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] data-[popup-open]:shadow-[inset_0_0_0_2px_var(--ring)]",
);

// "Quebrar conteúdo das células" desligado (painel de propriedades): o texto
// fica numa linha só e corta com reticências; as etiquetas não descem.
const wrapText = "min-w-0 group-data-[wrap=false]/table:truncate group-data-[wrap=false]/table:whitespace-nowrap";
const wrapPills = "flex-wrap group-data-[wrap=false]/table:flex-nowrap group-data-[wrap=false]/table:overflow-hidden";

/** "Vazio" no hover da célula sem valor (só na grade — o cartão e o painel mostram o campo em branco). */
function EmptyHint() {
  return <span className="text-sm text-muted-foreground opacity-0 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100">Vazio</span>;
}

/**
 * Seletor de select/status/relação com opções (desenho de 07/10): as
 * escolhidas no topo como pílulas com "×", campo "Buscar ou criar…", a lista
 * filtrada pela busca com ✓ na marcada, "Criar …" quando a busca não acha
 * nada (só com `onCreateOption`) e "Limpar". Enter escolhe a primeira que
 * casa — ou cria. Single fecha ao escolher; multi fica aberto.
 *
 * O dropdown usa o `Popover` genérico exportado por @adinkra/date-picker
 * (Base UI): um `absolute` cru dentro de `<td>` pode fazer a célula crescer
 * pra caber o dropdown (bug reproduzido em 16/09); o Portal tira ele da
 * árvore da tabela, e o Popover já fecha no Escape/clique fora.
 */
function SelectCell({
  column,
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
  onCreateOption,
  triggerClassName,
  empty,
}: {
  column: DataTableColumn;
  value: unknown;
  onChange: (next: string | string[]) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  onCreateOption?: (label: string) => string | undefined;
  triggerClassName?: string;
  empty?: React.ReactNode;
}) {
  const options = columnOptions(column);
  const multi = column.type === "select" && !!column.multi;
  const selected = multi ? optionValues(column, value) : value ? [String(value)] : [];
  const [query, setQuery] = React.useState("");
  const needle = normalizeText(query.trim());
  const filtered = needle ? options.filter((option) => normalizeText(option.label).includes(needle)) : options;
  const exact = options.some((option) => normalizeText(option.label) === needle);
  const canCreate = !!onCreateOption && !!needle && !exact;

  function pick(optionValue: string) {
    setQuery("");
    if (multi) {
      onChange(selected.includes(optionValue) ? selected.filter((v) => v !== optionValue) : [...selected, optionValue]);
    } else {
      onChange(optionValue);
      onClose();
    }
  }

  function create() {
    const created = onCreateOption?.(query.trim());
    if (created) pick(created);
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value));

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        setQuery("");
        if (open) onRequestEdit();
        else onClose();
      }}
    >
      <PopoverTrigger className={triggerClassName ?? cn(cellTrigger, "gap-2", wrapPills)}>
        {selectedOptions.length === 0 ? empty : selectedOptions.map((option) => <OptionView key={option.value} column={column} option={option} />)}
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(menuPanel, "max-h-[420px] w-[233px] overflow-y-auto")}>
        <div className="flex min-h-[34px] flex-wrap items-center gap-2 rounded-control bg-surface p-2">
          {selectedOptions.map((option) => (
            <span key={option.value} className="inline-flex max-w-full items-center gap-1">
              <OptionView column={column} option={option} />
              <button
                type="button"
                aria-label={`Remover ${option.label}`}
                onClick={() => (multi ? pick(option.value) : onChange(""))}
                className={cn("inline-flex size-[21px] flex-none items-center justify-center rounded-[3px] text-muted-foreground hover:text-heading", hoverBg)}
              >
                <Glyph name="x" size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <input
            type="text"
            aria-label="Buscar ou criar opção"
            autoFocus
            placeholder={selectedOptions.length ? "" : onCreateOption ? "Buscar ou criar…" : "Buscar…"}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const first = filtered[0];
              if (needle && first) pick(first.value);
              else if (canCreate) create();
            }}
            className="h-[21px] min-w-[89px] flex-1 bg-transparent px-1 text-sm text-heading outline-none placeholder:text-muted-foreground"
          />
        </div>
        <MenuCaption>{multi ? "Selecione uma ou mais opções" : "Selecione uma opção"}</MenuCaption>
        {filtered.map((option) => (
          <button key={option.value} type="button" className={menuItem} onClick={() => pick(option.value)}>
            <OptionView column={column} option={option} />
            <MenuCheck on={selected.includes(option.value)} />
          </button>
        ))}
        {canCreate ? (
          <button type="button" className={menuItem} onClick={create}>
            <span className="text-muted-foreground">Criar</span>
            <NeutralPill>{query.trim()}</NeutralPill>
          </button>
        ) : null}
        {selected.length > 0 ? (
          <>
            <MenuSeparator />
            <button
              type="button"
              className={cn(menuItem, "text-muted-foreground")}
              onClick={() => {
                onChange(multi ? [] : "");
                onClose();
              }}
            >
              <Glyph name="x" />
              Limpar
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

// Campo de edição (arquivo de 07/10): ocupa a célula inteira, fundo do
// cartão, anel interno de 2 `--ring`, sem borda. No cartão e no painel o
// campo é de 34 com contorno fino.
const editInput = cn(
  "min-h-[42px] w-full rounded-none border-0 bg-card px-3 text-sm text-heading outline-none",
  "shadow-[inset_0_0_0_2px_var(--ring)]",
);
const editInputCompact = "min-h-[34px] rounded-control";

// `className` troca a embalagem: na grade, a célula inteira; no cartão do
// mobile e no painel, largura cheia com o campo compacto.
function TextCell({
  value,
  onChange,
  onCancel,
  bold,
  className,
}: {
  value: unknown;
  onChange: (next: string) => void;
  onCancel: () => void;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={className ?? "w-full"}>
      <input
        type="text"
        ref={autoFocusAndSelect}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") onCancel();
        }}
        className={cn(editInput, className && editInputCompact, bold && "font-medium")}
      />
    </div>
  );
}

// `allowEmpty` (fórmula): campo vazio devolve `undefined` em vez de 0 —
// é o "apagar volta à fórmula".
function NumberCell({
  value,
  onChange,
  onCancel,
  allowEmpty,
  className,
}: {
  value: unknown;
  onChange: (next: number | undefined) => void;
  onCancel: () => void;
  allowEmpty?: boolean;
  className?: string;
}) {
  const numeric = typeof value === "number" ? value : allowEmpty ? "" : 0;
  return (
    <div className={className ?? "w-full"}>
      <input
        type="number"
        step="0.01"
        ref={autoFocusAndSelect}
        defaultValue={numeric}
        onBlur={(event) => {
          const raw = event.currentTarget.value;
          onChange(allowEmpty && raw.trim() === "" ? undefined : Number(raw) || 0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") onCancel();
        }}
        className={cn(
          editInput,
          className && editInputCompact,
          "text-right tabular-nums",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />
    </div>
  );
}

function formatDate(column: DataTableColumn, date: Date): string {
  return column.dateStyle === "short" ? formatShortDate(date) : formatLongDate(date);
}

// Dogfooding do @adinkra/date-picker — mesmo `Popover`+`Calendar` da página
// própria dele, mas no padrão de gatilho-texto das outras células (pedido do
// usuário — "deixamos so o texto, e ao clicar na data aparecer a popover pra
// escolher a data").
function DateCell({
  column,
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
  triggerClassName,
  empty,
}: {
  column: DataTableColumn;
  value: unknown;
  onChange: (next: string) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  triggerClassName?: string;
  empty?: React.ReactNode;
}) {
  const selected = parseISODate(value);

  return (
    <Popover open={isEditing} onOpenChange={(open) => (open ? onRequestEdit() : onClose())}>
      <PopoverTrigger className={triggerClassName ?? cellTrigger}>
        {selected ? <span className="whitespace-nowrap">{formatDate(column, selected)}</span> : empty}
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? toISODate(date) : "");
            onClose();
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function relationIconOf(column: DataTableColumn, value: string, row: DataTableRow): RelationIcon {
  const icon = column.relation?.icon;
  if (typeof icon === "function") return icon(value, row);
  return icon ?? "link";
}

/**
 * Glifo da relação, que também é o "abrir" do link (`href` → `<a>`,
 * `onClick` → `<button>`, sem nenhum dos dois → só decoração). Separado do
 * texto de propósito (pedido do usuário, 27/09 — "todo campo é pra ser
 * editável"): clicar no TEXTO edita, clicar no GLIFO abre. Funciona igual
 * no toque (mobile não tem hover) e no teclado (são dois alvos de Tab).
 * `in`/`out` pintam o glifo de primary/destructive, a regra de
 * entrada/saída do sistema.
 */
function RelationOpen({ column, row, value, label }: { column: DataTableColumn; row: DataTableRow; value: string; label: string }) {
  const icon = relationIconOf(column, value, row);
  const tone = icon === "in" ? "text-primary" : icon === "out" ? "text-destructive" : "text-muted-foreground";
  const className = cn("mt-[3px] inline-flex flex-none rounded-[3px]", tone, focusRing);
  const glyph = <RelationGlyph icon={icon} />;
  const href = column.relation?.href?.(row);
  if (href) {
    return (
      <a href={href} aria-label={`Abrir ${label}`} className={cn(className, hoverBg)}>
        {glyph}
      </a>
    );
  }
  const onClick = column.relation?.onClick;
  if (onClick) {
    return (
      <button type="button" aria-label={`Abrir ${label}`} onClick={() => onClick(row)} className={cn(className, hoverBg)}>
        {glyph}
      </button>
    );
  }
  return <span className={className}>{glyph}</span>;
}

// Sublinhado fino de 1px em `--hairline`, afastado 3 (arquivo de 07/10).
const relationText = "text-sm font-medium text-heading underline decoration-hairline decoration-1 underline-offset-[3px]";

/**
 * Fórmula: mono à direita; negativo em `text-destructive`. Com sobrescrita
 * manual (ver `isFormulaOverridden`), um anel de 5 na frente marca que o
 * valor foi digitado, não calculado — discreto de propósito (cinza, sem
 * cor de estado), com o motivo no `title` e no texto de leitor de tela.
 */
function FormulaValue({ column, row }: { column: DataTableColumn; row: DataTableRow }) {
  const value = cellValue(column, row);
  const overridden = isFormulaOverridden(column, row);
  const marker = overridden ? (
    <span title="Valor manual. Apague o campo pra voltar à fórmula." className="inline-flex flex-none items-center">
      <span aria-hidden="true" className="size-2 rounded-full border border-muted-foreground" />
      <span className="sr-only">(valor manual)</span>
    </span>
  ) : null;
  // Arquivo de 07/10: fórmula em tinta mesmo negativa (o "−" já diz o sinal).
  const text =
    typeof value === "number" ? (
      <span className="text-sm tabular-nums text-heading">{column.format ? formatNumber(column, value) : String(value)}</span>
    ) : (
      <span className="text-sm text-heading">{value == null ? null : String(value)}</span>
    );
  return (
    <span className="inline-flex items-center gap-2">
      {marker}
      {text}
    </span>
  );
}

// Gatilho de edição no cartão do mobile e no painel: sem o padding de 8/13
// da célula (o cartão já tem o dele), com hover/foco próprios pra dizer que
// é tocável.
const cardTrigger = cn(
  "group/cell inline-flex min-h-[26px] max-w-full flex-wrap items-center gap-2 rounded-control text-left text-sm text-heading outline-none",
  hoverBg,
  focusRing,
);

/**
 * Um campo editável de QUALQUER tipo — o mesmo editor na célula da grade,
 * no cartão do mobile e no painel "Abrir" (pedido do usuário, 27/09 — "todo
 * campo é pra ser editável"). Só muda a embalagem (`surface`): na grade, 42
 * de altura mínima e padding 8/13; no cartão e no painel, gatilho enxuto.
 *
 * - text/number: texto (ou mono à direita) → `<input>` ao clicar.
 * - select/status: seletor em Popover (busca, criar, limpar). relation com
 *   `options` usa o mesmo.
 * - date: Calendar em Popover.
 * - checkbox: um clique marca/desmarca, sem modo de edição.
 * - relation sem `options`: o texto vira `<input>`; o glifo abre o link.
 * - formula: `<input>` com o valor efetivo; o que for digitado vira
 *   sobrescrita em `row[column.id]`, vazio volta ao calculado. Abrir e sair
 *   sem mudar nada não grava (senão só olhar congelaria o calculado).
 * - coluna principal: ícone de página + texto em seminegrito ("Sem título"
 *   quando vazio) + "Abrir" — no hover na grade, sempre visível no cartão
 *   (toque não tem hover).
 */
function EditableField({
  column,
  row,
  surface,
  editing,
  onRequestEdit,
  onClose,
  onCommit,
  isPrimary,
  onOpen,
  onCreateOption,
}: {
  column: DataTableColumn;
  row: DataTableRow;
  surface: Surface;
  editing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  onCommit: (value: unknown) => void;
  isPrimary: boolean;
  onOpen?: (row: DataTableRow) => void;
  onCreateOption?: (label: string) => string | undefined;
}) {
  const grid = surface === "grid";
  const trigger = grid ? cellTrigger : cardTrigger;
  const inputWrap = grid ? undefined : "w-full";
  const empty = grid ? <EmptyHint /> : null;
  const value = row[column.id];
  const commit = (next: unknown) => {
    onCommit(next);
    onClose();
  };

  switch (column.type) {
    case "select":
    case "status":
      return (
        <SelectCell
          column={column}
          value={value}
          isEditing={editing}
          onRequestEdit={onRequestEdit}
          onClose={onClose}
          onChange={onCommit}
          onCreateOption={onCreateOption}
          triggerClassName={cn(trigger, "gap-2", grid ? wrapPills : "flex-wrap")}
          empty={empty}
        />
      );
    case "date":
      return (
        <DateCell
          column={surface === "card" ? { ...column, dateStyle: "short" } : column}
          value={value}
          isEditing={editing}
          onRequestEdit={onRequestEdit}
          onClose={onClose}
          onChange={onCommit}
          triggerClassName={surface === "card" ? cn(cardTrigger, "text-muted-foreground") : trigger}
          empty={empty}
        />
      );
    case "checkbox":
      return (
        <div className={grid ? "flex min-h-[42px] justify-center pt-[13px]" : "inline-flex min-h-[26px] items-center"}>
          <NativeCheckbox
            aria-label={`${column.header || column.id}: marcar linha`}
            checked={value === true}
            onCheckedChange={(checked) => onCommit(checked)}
          />
        </div>
      );
    case "relation": {
      const text = value == null ? "" : String(value);
      const options = column.options;
      const label = options ? (options.find((option) => option.value === text)?.label ?? text) : text;
      if (!options && editing) {
        return <TextCell value={text} className={inputWrap} onChange={commit} onCancel={onClose} />;
      }
      return (
        <div className={cn("group/cell flex items-start gap-2", grid ? cellPad : "min-h-[26px] items-center")}>
          {text ? <RelationOpen column={column} row={row} value={text} label={label} /> : null}
          {options ? (
            <SelectCell
              column={column}
              value={value}
              isEditing={editing}
              onRequestEdit={onRequestEdit}
              onClose={onClose}
              onChange={onCommit}
              onCreateOption={onCreateOption}
              empty={empty}
              triggerClassName={cn("min-h-[21px] min-w-0 flex-1 text-left outline-none", focusRing)}
            />
          ) : (
            <button type="button" onClick={onRequestEdit} className={cn("min-h-[21px] min-w-0 flex-1 text-left outline-none", focusRing)}>
              {text ? <span className={cn(relationText, wrapText)}>{label}</span> : empty}
            </button>
          )}
        </div>
      );
    }
    case "formula": {
      if (editing) {
        const overridden = isFormulaOverridden(column, row);
        const computed = computedFormula(column, row);
        const effective = cellValue(column, row);
        const commitFormula = (next: string | number | undefined) => {
          if (next === undefined || next === "") onCommit(undefined);
          else if (overridden || next !== computed) onCommit(next);
          onClose();
        };
        return column.format ? (
          <NumberCell value={effective} allowEmpty className={inputWrap} onChange={commitFormula} onCancel={onClose} />
        ) : (
          <TextCell value={effective == null ? "" : String(effective)} className={inputWrap} onChange={commitFormula} onCancel={onClose} />
        );
      }
      return (
        <button
          type="button"
          onClick={onRequestEdit}
          aria-label={`${column.header || column.id}: editar (vazio volta à fórmula)`}
          className={trigger}
        >
          <FormulaValue column={column} row={row} />
        </button>
      );
    }
  }

  if (editing) {
    return column.type === "number" ? (
      <NumberCell value={value} className={inputWrap} onChange={commit} onCancel={onClose} />
    ) : (
      <TextCell value={value} bold={isPrimary} className={inputWrap} onChange={commit} onCancel={onClose} />
    );
  }

  if (isPrimary) {
    const title = typeof value === "string" ? value : "";
    // Coluna principal: ícone de página de 16 (só na grade) + texto em peso
    // 500 + "Abrir" (26, 10 em caixa-alta, cinza, cartão com sombra suave —
    // arquivo de 07/10). Dois botões irmãos (editar / abrir), nunca um
    // dentro do outro.
    return (
      <div className={cn("group/cell flex items-start gap-2", grid ? "min-h-[42px] py-2 pl-3 pr-2" : "min-w-0 flex-1")}>
        {grid ? (
          <span className="mt-[5px] inline-flex text-muted-foreground">
            <Glyph name="file" size={16} strokeWidth={1.5} />
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRequestEdit}
          className={cn(
            "min-h-[26px] min-w-0 flex-1 text-left text-sm font-medium outline-none",
            focusRing,
            title ? "text-heading" : "text-muted-foreground",
          )}
        >
          <span className={cn("block", grid && wrapText)}>{title || "Sem título"}</span>
        </button>
        {onOpen ? (
          <button
            type="button"
            aria-label={`Abrir ${title || "página sem título"}`}
            onClick={() => onOpen(row)}
            className={cn(
              "inline-flex h-[26px] flex-none items-center gap-1 rounded-[3px] bg-card px-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-heading",
              softShadow,
              "transition-opacity duration-150 ease-[var(--ease-out)]",
              grid && "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
              focusRing,
            )}
          >
            <Glyph name="expand" size={10} strokeWidth={2.5} />
            Abrir
          </button>
        ) : null}
      </div>
    );
  }

  const blank = value === undefined || value === null || value === "";
  return (
    <button type="button" onClick={onRequestEdit} className={cn(trigger, grid && column.type === "number" && "justify-end")}>
      {blank ? (
        empty
      ) : column.type === "number" ? (
        <span className="text-sm tabular-nums text-heading">
          {column.currency || !grid ? formatNumber(column, typeof value === "number" ? value : 0) : String(value)}
        </span>
      ) : (
        <span className={cn("text-sm text-heading", grid && wrapText)}>{String(value)}</span>
      )}
    </button>
  );
}

const DEFAULT_COLUMN_WIDTH = 144;
const MIN_COLUMN_WIDTH = 68;
// Coluna do gutter (+, alça, seleção): `w-7` = 55 (spec φ: "coluna de seleção 55").
const GUTTER_WIDTH = 55;
// Coluna do "+" de propriedade nova, no fim do cabeçalho.
const ADD_COLUMN_WIDTH = 42;

/**
 * Alça de redimensionar coluna (pedido do usuário — "vamos fazer todos os
 * campos serem Resizable"): `setPointerCapture` no próprio elemento, sem
 * listener de `window`. Faixa fina na borda direita do `<th>` que só
 * aparece no hover, em céu (desenho de 07/10).
 *
 * Largura inicial do arrasto vem do DOM (`getBoundingClientRect` no próprio
 * `<th>` pai): colunas nunca redimensionadas não têm largura própria salva
 * (crescem pra preencher o espaço), então não tem outro jeito de saber "de
 * onde" o arrasto começa.
 */
function ColumnResizeHandle({ onResize }: { onResize: (width: number) => void }) {
  const dragState = React.useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const startWidth = event.currentTarget.parentElement?.getBoundingClientRect().width ?? DEFAULT_COLUMN_WIDTH;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragState.current.startX;
    onResize(Math.max(MIN_COLUMN_WIDTH, dragState.current.startWidth + delta));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute inset-y-0 -right-[3px] z-10 w-[5px] cursor-col-resize touch-none select-none hover:bg-secondary active:bg-secondary"
    />
  );
}

/**
 * Estado controlado OU não controlado (filtros, ordenação, agrupamento):
 * com `value` definido, quem usa manda e só recebe `onChange`; sem ele, a
 * tabela guarda a partir de `defaultValue`.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = React.useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = React.useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set];
}

// Linha selecionada = névoa azul do desenho. Sem token `--mist`, a névoa é
// misturada a partir de tokens existentes (céu sobre o cartão) — opaca, o
// que importa pras células congeladas (sticky precisa de fundo sólido pra
// não deixar ver as colunas que rolam por baixo) e acompanha o tema escuro.
const SELECTED_BG = "bg-[color-mix(in_srgb,var(--secondary)_13%,var(--background))]";

/** Id de opção nova a partir do rótulo, sem repetir um que já existe. */
function uniqueOptionValue(column: DataTableColumn, label: string): string {
  const taken = new Set(columnOptions(column).map((option) => option.value));
  if (!taken.has(label)) return label;
  let n = 2;
  while (taken.has(`${label} ${n}`)) n++;
  return `${label} ${n}`;
}

/**
 * Tabela de dados editável estilo Notion (pedido do usuário, 15/09/2026,
 * a partir de um print do próprio Notion). Controlada (rows/onRowsChange) —
 * quem usa decide onde persistir; o componente só guarda estado de
 * interface (célula em edição, seleção, larguras, ordem/visibilidade das
 * colunas, grupos recolhidos, painel aberto).
 *
 * Histórico até o redesenho φ (27/09) — tipos, bordas por célula, coluna
 * congelada, filtros/ordenação no cliente, cartões abaixo de 610: ver
 * DECISOES.md, seção do @adinkra/data-table.
 *
 * ─── Redesenho da tabela (07/10/2026, desenho "Data table · transações") ───
 *
 * - Barra superior sempre presente: abas, filtro (liga/desliga a barra de
 *   filtros), ordenação, busca, propriedades, o slot `toolbar` e "Novo"
 *   (com `onAddRow`). O olho "Colunas visíveis" virou o painel de
 *   propriedades (visíveis, agrupar, quebrar texto).
 * - Barra de filtros: chip de ordenação (resumo), um chip por regra (cada
 *   um abre o próprio popover), "+ Filtro" e a contagem "N de M". Regra
 *   incompleta fica só com contorno. O construtor de 610 saiu.
 * - Barra de seleção: entra NO LUGAR da barra de filtros enquanto há linha
 *   marcada — não flutua mais (a flutuante arrastável de 16/09 saiu com o
 *   desenho). Ações de quem usa (`bulkActions`), Duplicar, Excluir. A
 *   edição em massa por coluna saiu junto.
 * - Cabeçalho: menu próprio (renomear com `onColumnsChange`, ordenar,
 *   filtrar, agrupar, congelar, mover, ocultar), arrastar pra reordenar e
 *   "+" de propriedade nova no fim. Ordenação ativa mostra ↑/↓ (com a
 *   prioridade quando há mais de uma).
 * - A coluna principal congela por padrão (é o título; o desenho a mantém
 *   sempre visível). `frozen: false` desliga.
 * - Agrupamento (`groupBy`): cabeçalho de grupo com recolher, pílula,
 *   contagem e Σ; "Nova página" por grupo já nasce no grupo.
 * - Seletor de opções com busca, "Criar …" e "Limpar". Célula vazia mostra
 *   "Vazio" no hover. Rodapé sempre visível, com mais cálculos.
 * - "Abrir" sem `onOpenRow` e com `peek`: painel lateral (`@adinkra/sheet`)
 *   com todas as propriedades editáveis, anterior/próxima e excluir.
 * - Medidas continuam as do φ (linha 42, cabeçalho 34, gutter 55): o
 *   desenho usa 36/38/60, fora da escala Fibonacci.
 *
 * ─── Visual plano (07/10/2026, arquivo "Data table · Adinkra φ") ───
 *
 * A tabela sai do neobrutalismo, a pedido do usuário: sem cartão em volta
 * (fica no `--background`), linhas e colunas de 1px `--hairline`, cabeçalho
 * com linha em cima e embaixo, abas só em texto, etiquetas planas (raio 3),
 * status com bolinha, conta/tags como ponto sublinhado, menus no `--card`
 * sem borda e com sombra suave, caixa de seleção nativa. Só a célula sob o
 * ponteiro ganha o véu (a linha não). Cores: só tokens, com os nomes de
 * sempre (o arquivo renomeia pro estilo Notion; o usuário manteve os do
 * sistema). Medidas do arquivo arredondadas pra φ: 44 → 42, 28 → 26,
 * 14/20 → 13/21, raio 6 → 5. Ficaram, mesmo fora do arquivo, a pedido do
 * usuário: fórmula editável, alça de arrastar linha, "Congelar" no menu e
 * `bulkActions`.
 */
export function DataTable({
  columns,
  rows,
  onRowsChange,
  onColumnsChange,
  columnLines = true,
  className,
  onAddRow,
  onOpenRow,
  peek,
  bulkActions = [],
  views,
  activeView,
  onViewChange,
  toolbar,
  searchable,
  filterable,
  filters: filtersProp,
  defaultFilters,
  onFiltersChange,
  sorts: sortsProp,
  defaultSorts,
  onSortsChange,
  groupBy: groupByProp,
  defaultGroupBy,
  onGroupByChange,
  mobileCard,
  loading = false,
  emptyMessage,
  notice,
}: DataTableProps) {
  const [editingCell, setEditingCell] = React.useState<CellId | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // Só guarda largura de coluna que alguém redimensionou de propósito — as
  // outras ficam sem `width` no `<col>`, e o `table-fixed` reparte o espaço
  // sobrando entre elas (só aparece scroll quando a soma passa do espaço).
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  // Congelar/esconder/agregação: a prop da coluna é o valor inicial, o menu
  // sobrescreve (mapa de "o que a pessoa mudou", igual `columnWidths`).
  const [frozenOverride, setFrozenOverride] = React.useState<Record<string, boolean>>({});
  const [hiddenOverride, setHiddenOverride] = React.useState<Record<string, boolean>>({});
  const [aggregateOverride, setAggregateOverride] = React.useState<Record<string, Aggregate>>({});
  // Ordem das colunas mexida pela pessoa (arrastar ou "Mover para…"). Coluna
  // que não está na lista (nova) vai pro fim, na ordem da prop.
  const [columnOrder, setColumnOrder] = React.useState<string[] | null>(null);

  const [filters, setFilters] = useControllable<DataTableFilter[]>(filtersProp, defaultFilters ?? [], onFiltersChange);
  const [sorts, setSorts] = useControllable<DataTableSort[]>(sortsProp, defaultSorts ?? [], onSortsChange);
  const [groupBy, setGroupBy] = useControllable<string | null>(groupByProp, defaultGroupBy ?? null, onGroupByChange);
  const [search, setSearch] = React.useState("");
  const [filterBarOpen, setFilterBarOpen] = React.useState(
    () => !!filterable || (filtersProp ?? defaultFilters ?? []).length > 0 || (sortsProp ?? defaultSorts ?? []).length > 0,
  );
  const [openFilterId, setOpenFilterId] = React.useState<string | null>(null);
  const [openColumnId, setOpenColumnId] = React.useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = React.useState<ReadonlySet<string>>(() => new Set());
  const [wrap, setWrap] = React.useState(true);
  const [peekId, setPeekId] = React.useState<string | null>(null);
  const [dragColumnId, setDragColumnId] = React.useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = React.useState<string | null>(null);
  // Ancestral `[data-theme]` da tabela: o painel lateral (portal) precisa
  // nascer dentro dele pra herdar o tema (armadilha 4 do DECISOES.md).
  const [themeRoot, setThemeRoot] = React.useState<HTMLElement | null>(null);
  const rootRef = React.useCallback((node: HTMLDivElement | null) => {
    setThemeRoot(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  const orderedColumns = React.useMemo(() => {
    if (!columnOrder) return columns;
    const rank = new Map(columnOrder.map((id, index) => [id, index]));
    return [...columns].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
  }, [columns, columnOrder]);

  const primaryColumn = primaryColumnOf(columns);
  const isHidden = (column: DataTableColumn) => column.id !== primaryColumn?.id && (hiddenOverride[column.id] ?? column.hidden ?? false);
  const isFrozen = (column: DataTableColumn) => frozenOverride[column.id] ?? column.frozen ?? column.id === primaryColumn?.id;
  const aggregateOf = (column: DataTableColumn): Aggregate | undefined => aggregateOverride[column.id] ?? column.aggregate;

  const visibleColumns = orderedColumns.filter((column) => !isHidden(column));
  const hasFrozen = visibleColumns.some(isFrozen);
  const lastFrozenId = [...visibleColumns].reverse().find(isFrozen)?.id;
  const groupColumn = groupBy ? columns.find((column) => column.id === groupBy) : undefined;
  const canEditColumns = !!onColumnsChange;
  const peekConfig: DataTablePeekConfig | undefined = peek ? (peek === true ? {} : peek) : undefined;
  const openRow = onOpenRow ?? (peekConfig ? (row: DataTableRow) => setPeekId(row.id) : undefined);

  function widthOf(column: DataTableColumn): number | undefined {
    return columnWidths[column.id] ?? column.width ?? (isFrozen(column) ? DEFAULT_COLUMN_WIDTH : undefined);
  }

  // Deslocamento `left` de cada coluna congelada = gutter + larguras das
  // congeladas anteriores (as não congeladas no meio rolam por baixo).
  const frozenLeft: Record<string, number> = {};
  {
    let left = GUTTER_WIDTH;
    for (const column of visibleColumns) {
      if (!isFrozen(column)) continue;
      frozenLeft[column.id] = left;
      left += widthOf(column) ?? DEFAULT_COLUMN_WIDTH;
    }
  }

  // Linhas recém-criadas ficam "presas" na tela (27/09/2026, bug relatado:
  // "quando clico em nova linha nada aparece"). Uma linha presa que não passa
  // no filtro/busca aparece mesmo assim, no fim, até o usuário mexer em
  // filtro, ordenação ou busca. Detecta a linha nova comparando os ids
  // antes/depois, porque `onAddRow` é externo e não devolve a linha.
  const [pinnedIds, setPinnedIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const addRequestedRef = React.useRef(false);
  const prevRowIdsRef = React.useRef<ReadonlySet<string>>(new Set(rows.map((row) => row.id)));
  React.useEffect(() => {
    const prevIds = prevRowIdsRef.current;
    prevRowIdsRef.current = new Set(rows.map((row) => row.id));
    if (!addRequestedRef.current) return;
    const added = rows.filter((row) => !prevIds.has(row.id));
    if (added.length === 0) return;
    addRequestedRef.current = false;
    setPinnedIds((prev) => new Set([...prev, ...added.map((row) => row.id)]));
    // Já abre a edição da coluna principal da primeira linha nova.
    if (primaryColumn) setEditingCell({ rowId: added[0]!.id, columnId: primaryColumn.id, surface: "grid" });
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    setPinnedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, [search, filters, sorts]);

  // Seleção de linha que sumiu (excluída por fora) sai da seleção.
  React.useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(rows.map((row) => row.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  const visibleRows = React.useMemo(() => {
    const searched = search ? rows.filter((row) => matchesSearch(columns, row, search)) : rows;
    const shown = applySorts(columns, applyFilters(columns, searched, filters), sorts);
    if (pinnedIds.size === 0) return shown;
    const shownIds = new Set(shown.map((row) => row.id));
    const pinnedHidden = rows.filter((row) => pinnedIds.has(row.id) && !shownIds.has(row.id));
    return pinnedHidden.length ? [...shown, ...pinnedHidden] : shown;
  }, [rows, columns, search, filters, sorts, pinnedIds]);

  const groups = React.useMemo(
    () => (groupColumn ? groupRows(groupColumn, visibleRows) : [{ key: "", label: "", rows: visibleRows }]),
    [groupColumn, visibleRows],
  );

  function setColumnWidth(columnId: string, width: number) {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
  }

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)));
  }

  /** "Novo", "Nova página" (do fim ou de um grupo): a linha nasce com o que precisa pra continuar visível. */
  function requestAddRow(extra?: Partial<DataTableRow>) {
    if (!onAddRow) return;
    addRequestedRef.current = true;
    onAddRow({ ...filterPreset(columns, filters), ...extra });
  }

  // Ícone "+" do gutter (print de referência do Notion) — insere logo ABAIXO
  // da linha de onde foi clicado, não no fim da tabela.
  function insertRowAfter(rowId: string) {
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;
    const next = [...rows];
    const preset = groupColumn ? groupPreset(groupColumn, groups.find((group) => group.rows.some((row) => row.id === rowId))?.key ?? "") : {};
    next.splice(index + 1, 0, { ...createEmptyRow(columns), ...filterPreset(columns, filters), ...preset });
    addRequestedRef.current = true;
    onRowsChange(next);
  }

  // Arrastar pra reordenar (alça de seis pontinhos do print), drag-and-drop
  // nativo — só precisa saber ONDE soltou. `draggingRowId` vive só no gesto.
  const [draggingRowId, setDraggingRowId] = React.useState<string | null>(null);

  function reorderRow(targetRowId: string) {
    if (!draggingRowId || draggingRowId === targetRowId) return;
    const fromIndex = rows.findIndex((row) => row.id === draggingRowId);
    const toIndex = rows.findIndex((row) => row.id === targetRowId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...rows];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onRowsChange(next);
  }

  function toggleRowSelected(rowId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  }

  // "Selecionar todas" marca as linhas VISÍVEIS (depois de busca/filtro).
  function toggleAllSelected(checked: boolean) {
    setSelectedIds(checked ? new Set(visibleRows.map((row) => row.id)) : new Set());
  }

  function duplicateSelected() {
    const copies = rows
      .filter((row) => selectedIds.has(row.id))
      .map((row) => {
        const copy: DataTableRow = { ...row, id: crypto.randomUUID() };
        if (primaryColumn && typeof row[primaryColumn.id] === "string") copy[primaryColumn.id] = `${row[primaryColumn.id] as string} (cópia)`;
        return copy;
      });
    onRowsChange([...rows, ...copies]);
    setSelectedIds(new Set());
  }

  function deleteRows(ids: ReadonlySet<string>) {
    onRowsChange(rows.filter((row) => !ids.has(row.id)));
    setSelectedIds(new Set());
  }

  function runBulkAction(action: DataTableBulkAction) {
    action.onSelect(
      rows.filter((row) => selectedIds.has(row.id)),
      { patch: (values) => onRowsChange(rows.map((row) => (selectedIds.has(row.id) ? { ...row, ...values } : row))) },
    );
  }

  function addFilter(column: DataTableColumn) {
    const filter: DataTableFilter = { id: crypto.randomUUID(), columnId: column.id, operator: operatorsFor(column)[0] ?? "contains" };
    setFilters([...filters, filter]);
    setFilterBarOpen(true);
    setOpenFilterId(filter.id);
  }

  function moveColumn(columnId: string, delta: -1 | 1) {
    const ids = orderedColumns.map((column) => column.id);
    const movable = visibleColumns.filter((column) => column.id !== primaryColumn?.id).map((column) => column.id);
    const neighbor = movable[movable.indexOf(columnId) + delta];
    if (!neighbor) return;
    const a = ids.indexOf(columnId);
    const b = ids.indexOf(neighbor);
    [ids[a], ids[b]] = [neighbor, columnId];
    setColumnOrder(ids);
  }

  function moveColumnTo(columnId: string, targetId: string) {
    if (columnId === targetId) return;
    const ids = orderedColumns.map((column) => column.id).filter((id) => id !== columnId);
    ids.splice(ids.indexOf(targetId), 0, columnId);
    setColumnOrder(ids);
  }

  function patchColumn(columnId: string, patch: Partial<DataTableColumn>) {
    onColumnsChange?.(columns.map((column) => (column.id === columnId ? { ...column, ...patch } : column)));
  }

  /** "Criar …" no seletor: opção nova no fim da lista, com a próxima cor do ciclo. Devolve o `value` criado. */
  function createOption(column: DataTableColumn, label: string): string | undefined {
    if (!onColumnsChange || !label) return undefined;
    const value = uniqueOptionValue(column, label);
    patchColumn(column.id, { options: [...columnOptions(column), { value, label, color: nextOptionColor(column) }] });
    return value;
  }

  function addProperty(type: ColumnType, label: string, multi?: boolean) {
    if (!onColumnsChange) return;
    const column: DataTableColumn = { id: `prop-${crypto.randomUUID().slice(0, 8)}`, header: label, type };
    if (multi) column.multi = true;
    if (type === "select" || type === "status") {
      column.selectStyle = type === "select" ? "pill" : undefined;
      column.options = [
        { value: "Opção 1", label: "Opção 1", color: "tag-sky" },
        { value: "Opção 2", label: "Opção 2", color: "tag-mustard" },
      ];
    }
    onColumnsChange([...columns, column]);
    // Já abre o menu da coluna nova, com o nome pronto pra trocar.
    setOpenColumnId(column.id);
  }

  const allSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));
  const someSelected = !allSelected && visibleRows.some((row) => selectedIds.has(row.id));
  const narrowed = search !== "" || filters.length > 0;
  const columnCount = visibleColumns.length + 1 + (canEditColumns ? 1 : 0);
  const summaryColumn =
    visibleColumns.find((column) => column.type === "formula" && isNumericColumn(column)) ?? visibleColumns.find(isNumericColumn);

  function sortGlyph(columnId: string): string | null {
    const index = sorts.findIndex((sort) => sort.columnId === columnId);
    if (index === -1) return null;
    return `${sorts[index]!.direction === "asc" ? "↑" : "↓"}${sorts.length > 1 ? index + 1 : ""}`;
  }

  // Fundo por célula (não por linha) — célula congelada precisa de fundo próprio opaco.
  function cellBg(selected: boolean) {
    // Arquivo de 07/10: a linha não muda no hover (só a célula sob o ponteiro).
    return selected ? SELECTED_BG : "bg-background";
  }

  function stickyProps(column: DataTableColumn): { className?: string; style?: React.CSSProperties } {
    if (!isFrozen(column)) return {};
    return { className: "sticky z-10", style: { left: frozenLeft[column.id] } };
  }

  function borderRight(column: DataTableColumn, index: number) {
    if (column.id === lastFrozenId) return "border-r border-r-hairline";
    if (columnLines && (index < visibleColumns.length - 1 || canEditColumns)) return "border-r border-r-hairline";
    return undefined;
  }

  function renderField(column: DataTableColumn, row: DataTableRow, surface: Surface) {
    const cellId: CellId = { rowId: row.id, columnId: column.id, surface };
    return (
      <EditableField
        column={column}
        row={row}
        surface={surface}
        editing={sameCell(editingCell, cellId)}
        onRequestEdit={() => setEditingCell(cellId)}
        onClose={() => setEditingCell(null)}
        onCommit={(value) => updateCell(row.id, column.id, value)}
        isPrimary={column.id === primaryColumn?.id && surface !== "peek"}
        onOpen={surface === "peek" ? undefined : openRow}
        onCreateOption={hasOptions(column) && canEditColumns ? (label) => createOption(column, label) : undefined}
      />
    );
  }

  function renderFooterCell(column: DataTableColumn) {
    const aggregate = aggregateOf(column) ?? "none";
    const result = formatAggregate(column, visibleRows, aggregate);
    const rowsCaption = column.id === primaryColumn?.id && aggregate === "none";
    return (
      <AggregateMenu
        column={column}
        value={aggregate}
        onChange={(next) => setAggregateOverride((prev) => ({ ...prev, [column.id]: next }))}
        className={cn(
          "group/foot flex min-h-[34px] w-full items-center justify-end gap-2 whitespace-nowrap px-3 outline-none",
          hoverBg,
          "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]",
        )}
      >
        {rowsCaption ? (
          <Caption className="mr-auto">
            {visibleRows.length} {visibleRows.length === 1 ? "linha" : "linhas"}
          </Caption>
        ) : result === undefined ? (
          <Caption className="opacity-0 group-hover/foot:opacity-100 group-focus-visible/foot:opacity-100">Calcular</Caption>
        ) : (
          <>
            <Caption>{aggregateShortLabel(aggregate)}</Caption>
            <span className="text-sm tabular-nums text-heading">{result.text}</span>
          </>
        )}
      </AggregateMenu>
    );
  }

  function renderGroupHeader(group: { key: string; label: string; rows: DataTableRow[] }) {
    if (!groupColumn) return null;
    const collapsed = collapsedGroups.has(group.key);
    const option = hasOptions(groupColumn) ? columnOptions(groupColumn).find((o) => o.value === group.key) : undefined;
    const sum = summaryColumn ? group.rows.reduce((total, row) => total + (Number(cellValue(summaryColumn, row)) || 0), 0) : undefined;
    return (
      <tr key={`group-${group.key}`}>
        <td colSpan={columnCount} className="h-[42px] border-b border-b-hairline bg-background p-0">
          <div className="sticky left-0 flex w-fit items-center gap-3 px-2">
            <button
              type="button"
              aria-label={collapsed ? `Expandir ${group.label}` : `Recolher ${group.label}`}
              aria-expanded={!collapsed}
              onClick={() =>
                setCollapsedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.key)) next.delete(group.key);
                  else next.add(group.key);
                  return next;
                })
              }
              className={cn("flex size-[26px] items-center justify-center rounded-control text-muted-foreground", hoverBg, focusRing)}
            >
              <span className={cn("inline-flex transition-transform duration-150 ease-[var(--ease-out)]", !collapsed && "rotate-90")}>
                <Glyph name="chevRight" />
              </span>
            </button>
            {option ? (
              <OptionView column={groupColumn.type === "relation" ? { ...groupColumn, type: "select", selectStyle: "pill" } : groupColumn} option={option} />
            ) : (
              <NeutralPill>{group.label}</NeutralPill>
            )}
            <span className="text-xs tabular-nums text-muted-foreground">
              {group.rows.length} {group.rows.length === 1 ? "linha" : "linhas"}
            </span>
            {summaryColumn && sum !== undefined ? (
              <span className={cn("text-xs tabular-nums", summaryColumn.type === "formula" && sum < 0 ? "text-destructive" : "text-heading")}>
                Σ {formatNumber(summaryColumn, sum)}
              </span>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  function renderAddRow(preset: Partial<DataTableRow> | undefined, key: string) {
    if (!onAddRow) return null;
    return (
      <tr key={key}>
        <td colSpan={columnCount} className="h-[34px] border-b border-b-hairline bg-background p-0">
          {/* `pl-[60px]` alinha o "+"/texto com a primeira coluna de dados —
              55 do gutter + 13 do `px-4` das células − 8 do padding do botão.
              Fica fora de S de propósito: é alinhamento calculado a partir de
              medidas em S, não uma medida de design isolada. */}
          <div className="sticky left-0 w-fit py-1 pl-[60px] pr-4">
            <button
              type="button"
              onClick={() => requestAddRow(preset)}
              className={cn("flex h-[34px] items-center gap-2 rounded-[3px] px-3 text-sm text-muted-foreground hover:text-heading", hoverBg, focusRing)}
            >
              <PlusIcon />
              Nova página
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function renderRow(row: DataTableRow, key: string) {
    const selected = selectedIds.has(row.id);
    return (
      <tr
        key={key}
        onDragOver={(event) => {
          if (draggingRowId) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!draggingRowId) return;
          event.preventDefault();
          reorderRow(row.id);
          setDraggingRowId(null);
        }}
        className={cn("group/row", draggingRowId === row.id && "opacity-[0.382]")}
      >
        <td className={cn("h-[42px] border-b border-b-hairline py-3 pl-1 pr-[5px] align-top", cellBg(selected), hasFrozen && "sticky left-0 z-10")}>
          {/* "+" (insere linha abaixo), alça de arrastar (reordenar) e caixa
              de seleção, todos só no hover da linha (a caixa também aparece
              com qualquer linha marcada). */}
          <div className="flex items-center justify-end gap-[2px]">
            <button
              type="button"
              aria-label="Inserir linha abaixo"
              onClick={() => insertRowAfter(row.id)}
              className={cn(
                "flex size-5 flex-none items-center justify-center rounded-[3px] text-muted-foreground opacity-0 transition-transform duration-100 ease-[var(--ease-out)] active:scale-95 hover:text-heading group-hover/row:opacity-100 focus-visible:opacity-100",
                hoverBg,
              )}
            >
              <PlusIcon className="size-3" />
            </button>
            {sorts.length === 0 && !groupColumn ? (
              <div
                draggable
                role="button"
                tabIndex={-1}
                aria-label="Arrastar para reordenar"
                onDragStart={(event) => {
                  setDraggingRowId(row.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggingRowId(null)}
                className={cn(
                  "flex size-5 flex-none cursor-grab items-center justify-center rounded-[3px] text-muted-foreground opacity-0 group-hover/row:opacity-100 active:cursor-grabbing",
                  hoverBg,
                )}
              >
                <DragHandleIcon className="size-3" />
              </div>
            ) : null}
            <NativeCheckbox
              aria-label={`Selecionar ${primaryColumn && typeof row[primaryColumn.id] === "string" && row[primaryColumn.id] ? String(row[primaryColumn.id]) : "linha"}`}
              checked={selected}
              onCheckedChange={(next) => toggleRowSelected(row.id, next)}
              className={cn(revealCheckbox, "group-hover/row:opacity-100")}
            />
          </div>
        </td>
        {visibleColumns.map((column, index) => {
          const sticky = stickyProps(column);
          return (
            <td
              key={column.id}
              style={sticky.style}
              className={cn("h-[42px] border-b border-b-hairline p-0 align-top", cellBg(selected), borderRight(column, index), sticky.className)}
            >
              {renderField(column, row, "grid")}
            </td>
          );
        })}
        {canEditColumns ? <td aria-hidden="true" className={cn("border-b border-b-hairline", cellBg(selected))} /> : null}
      </tr>
    );
  }

  const peekIndex = peekId ? visibleRows.findIndex((row) => row.id === peekId) : -1;
  const peekRow = peekId ? rows.find((row) => row.id === peekId) : undefined;

  return (
    <div
      ref={rootRef}
      data-anysel={selectedIds.size > 0}
      data-wrap={wrap}
      className={cn("group/table @container", className)}
    >
      {/* Cartão (borda 2, raio 8, sombra 3) só a partir de 610: no mobile a
          lista de cartões já tem borda própria, e cartão dentro de cartão
          empilharia duas bordas de tinta. */}
      {/* Arquivo de 07/10: sem cartão em volta — a tabela fica direto no
          fundo da página, separada só pelas linhas de 1px. */}
      <div className="bg-background text-sm text-foreground" aria-busy={loading || undefined}>
        {/* Os blocos do esqueleto são `aria-hidden`; quem usa leitor de tela ouve isto. */}
        <span role="status" className="sr-only">
          {loading ? "Carregando linhas…" : ""}
        </span>
        <TopBar
          views={views}
          activeView={activeView}
          onViewChange={onViewChange}
          toolbar={toolbar}
          searchable={searchable}
          search={search}
          onSearchChange={setSearch}
          filterOn={filterBarOpen && filters.length > 0}
          sortOn={sorts.length > 0}
          onFilterClick={() => setFilterBarOpen(!filterBarOpen)}
          sortPopover={(trigger) => <SortPopover columns={orderedColumns} sorts={sorts} onSortsChange={setSorts} trigger={trigger} />}
          propertiesPopover={(trigger) => (
            <PropertiesPopover
              columns={orderedColumns}
              isHidden={isHidden}
              primaryId={primaryColumn?.id}
              onToggle={(column, visible) => setHiddenOverride((prev) => ({ ...prev, [column.id]: !visible }))}
              onSetAll={(visible) => setHiddenOverride(Object.fromEntries(columns.map((column) => [column.id, !visible])))}
              groupBy={groupColumn ? groupColumn.id : null}
              onGroupByChange={setGroupBy}
              wrap={wrap}
              onWrapChange={setWrap}
              trigger={trigger}
            />
          )}
          onNew={onAddRow ? () => requestAddRow() : undefined}
        />
        {selectedIds.size > 0 ? (
          <BulkBar
            count={selectedIds.size}
            actions={bulkActions}
            onAction={runBulkAction}
            onDuplicate={duplicateSelected}
            onDelete={() => deleteRows(selectedIds)}
            onClear={() => setSelectedIds(new Set())}
          />
        ) : filterBarOpen ? (
          <FilterBar
            columns={orderedColumns}
            sorts={sorts}
            filters={filters}
            onFiltersChange={setFilters}
            openFilterId={openFilterId}
            onOpenFilterChange={setOpenFilterId}
            onAddFilter={addFilter}
            sortPopover={(trigger) => <SortPopover columns={orderedColumns} sorts={sorts} onSortsChange={setSorts} trigger={trigger} />}
            quickColumns={orderedColumns
              .filter((column) => hasOptions(column) && column.id !== primaryColumn?.id && !filters.some((f) => f.columnId === column.id))
              .slice(0, 4)}
            countLabel={`${visibleRows.length} de ${rows.length}`}
            renderOption={(column, option) => <OptionView column={column} option={option} />}
          />
        ) : null}
        {notice ? <div className="border-b border-hairline p-4">{notice}</div> : null}

        <div className="hidden overflow-x-auto @[610px]:block">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            {/* `table-fixed` + `<col>` é o que faz redimensionar UMA coluna não
                empurrar as outras. `<col>` sem `width` (coluna nunca
                redimensionada) deixa o `table-fixed` repartir o espaço sobrando. */}
            <colgroup>
              <col className="w-7" />
              {visibleColumns.map((column) => {
                const width = widthOf(column);
                return <col key={column.id} style={width !== undefined ? { width } : undefined} />;
              })}
              {canEditColumns ? <col style={{ width: ADD_COLUMN_WIDTH }} /> : null}
            </colgroup>
            <thead>
              <tr className="group/header">
                <th
                  className={cn(
                    "h-[34px] border-y border-y-hairline bg-background pl-2 pr-[5px] text-right",
                    hasFrozen && "sticky left-0 z-10",
                  )}
                >
                  <HeaderCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAllSelected} />
                </th>
                {visibleColumns.map((column, index) => {
                  const sticky = stickyProps(column);
                  const isPrimary = column.id === primaryColumn?.id;
                  const glyph = sortGlyph(column.id);
                  const movable = visibleColumns.filter((c) => c.id !== primaryColumn?.id);
                  const position = movable.findIndex((c) => c.id === column.id);
                  const dropping = !!dragColumnId && dropColumnId === column.id && dragColumnId !== column.id;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      style={sticky.style}
                      onDragOver={(event) => {
                        if (!dragColumnId) return;
                        event.preventDefault();
                        if (dropColumnId !== column.id) setDropColumnId(column.id);
                      }}
                      onDrop={(event) => {
                        if (!dragColumnId) return;
                        event.preventDefault();
                        moveColumnTo(dragColumnId, column.id);
                        setDragColumnId(null);
                        setDropColumnId(null);
                      }}
                      className={cn(
                        "relative h-[34px] border-y border-y-hairline bg-background p-0 align-middle font-normal",
                        borderRight(column, index),
                        sticky.className,
                        dropping && "shadow-[inset_3px_0_0_0_var(--secondary)]",
                        dragColumnId === column.id && "opacity-[0.618]",
                      )}
                    >
                      <ColumnPopover
                        column={column}
                        isPrimary={isPrimary}
                        open={openColumnId === column.id}
                        onOpenChange={(open) => setOpenColumnId(open ? column.id : null)}
                        onRename={canEditColumns ? (header) => patchColumn(column.id, { header }) : undefined}
                        sortDirection={sorts.find((sort) => sort.columnId === column.id)?.direction}
                        onSort={(direction) => setSorts([{ columnId: column.id, direction }])}
                        onFilter={() => addFilter(column)}
                        grouped={groupColumn?.id === column.id}
                        onToggleGroup={isGroupable(column) && !isPrimary ? () => setGroupBy(groupColumn?.id === column.id ? null : column.id) : undefined}
                        frozen={isFrozen(column)}
                        onToggleFrozen={() => setFrozenOverride((prev) => ({ ...prev, [column.id]: !isFrozen(column) }))}
                        onMove={(delta) => moveColumn(column.id, delta)}
                        canMoveLeft={position > 0}
                        canMoveRight={position !== -1 && position < movable.length - 1}
                        onHide={() => setHiddenOverride((prev) => ({ ...prev, [column.id]: true }))}
                        trigger={
                          <button
                            type="button"
                            aria-label={`Opções da coluna ${column.header || column.id}`}
                            draggable={!isPrimary}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", column.id);
                              setDragColumnId(column.id);
                            }}
                            onDragEnd={() => {
                              setDragColumnId(null);
                              setDropColumnId(null);
                            }}
                            className={cn(
                              "flex h-[34px] w-full items-center gap-2 px-3 text-sm font-normal text-muted-foreground outline-none",
                              hoverBg,
                              "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]",
                            )}
                          >
                            {isPrimary ? <TypeIcon column={{ type: "text" }} /> : <TypeIcon column={column} />}
                            <span className="truncate">{column.header}</span>
                            {glyph ? <span className="ml-auto flex-none text-xs tabular-nums text-heading">{glyph}</span> : null}
                          </button>
                        }
                      />
                      <ColumnResizeHandle onResize={(width) => setColumnWidth(column.id, width)} />
                    </th>
                  );
                })}
                {canEditColumns ? (
                  <th className="h-[34px] border-y border-y-hairline bg-background p-0">
                    <AddPropertyPopover
                      onAdd={addProperty}
                      trigger={
                        <button
                          type="button"
                          aria-label="Adicionar propriedade"
                          className={cn(
                            "flex h-[34px] w-full items-center justify-center text-muted-foreground hover:text-heading",
                            hoverBg,
                            "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]",
                          )}
                        >
                          <PlusIcon />
                        </button>
                      }
                    />
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows
                  columns={visibleColumns}
                  primaryId={primaryColumn?.id}
                  extra={canEditColumns}
                  gutterClassName={hasFrozen ? "sticky left-0 z-10" : undefined}
                  cellProps={(column, index) => {
                    const sticky = stickyProps(column);
                    return { style: sticky.style, className: cn(borderRight(column, index), sticky.className) };
                  }}
                />
              ) : null}
              {!loading && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="border-b border-b-hairline bg-background p-0">
                    <EmptyState
                      message={emptyMessage}
                      narrowed={narrowed}
                      onClear={() => {
                        setFilters([]);
                        setSearch("");
                      }}
                    />
                  </td>
                </tr>
              ) : null}
              {loading
                ? null
                : groups.map((group) =>
                    groupColumn ? (
                      <React.Fragment key={`g-${group.key}`}>
                        {renderGroupHeader(group)}
                        {collapsedGroups.has(group.key) ? null : (
                          <>
                            {group.rows.map((row) => renderRow(row, `${group.key}:${row.id}`))}
                            {renderAddRow(groupPreset(groupColumn, group.key), `add-${group.key}`)}
                          </>
                        )}
                      </React.Fragment>
                    ) : (
                      <React.Fragment key="all">
                        {group.rows.map((row) => renderRow(row, row.id))}
                        {renderAddRow(undefined, "add")}
                      </React.Fragment>
                    ),
                  )}
              {!loading && groupColumn && groups.length === 0 ? renderAddRow(undefined, "add") : null}
            </tbody>
            <tfoot>
              <tr>
                <td className={cn("h-[34px] bg-background", hasFrozen && "sticky left-0 z-10")} />
                {visibleColumns.map((column, index) => {
                  const sticky = stickyProps(column);
                  return (
                    <td
                      key={column.id}
                      style={sticky.style}
                      className={cn("h-[34px] bg-background p-0", column.id === lastFrozenId && borderRight(column, index), sticky.className)}
                    >
                      {renderFooterCell(column)}
                    </td>
                  );
                })}
                {canEditColumns ? <td className="bg-background" /> : null}
              </tr>
            </tfoot>
          </table>
        </div>

        <MobileCards
          columns={visibleColumns}
          rows={loading ? [] : visibleRows}
          loading={loading}
          emptyText={emptyMessage !== undefined ? emptyMessage : narrowed ? "Nenhuma linha corresponde a esta visão." : "Nenhuma linha ainda."}
          primaryColumn={primaryColumn}
          config={mobileCard}
          aggregateOf={aggregateOf}
          onAddRow={onAddRow ? () => requestAddRow() : undefined}
          renderField={(column, row) => renderField(column, row, "card")}
        />
      </div>

      {peekConfig && !onOpenRow ? (
        <RowPeek
          row={peekRow}
          container={themeRoot}
          columns={orderedColumns}
          primaryColumn={primaryColumn}
          notesKey={peekConfig.notes}
          position={peekRow ? (peekIndex >= 0 ? `${peekIndex + 1} de ${visibleRows.length}` : "fora desta visão") : ""}
          onClose={() => setPeekId(null)}
          onStep={(delta) => {
            if (visibleRows.length === 0) return;
            const from = peekIndex < 0 ? 0 : peekIndex + delta;
            const next = visibleRows[(from + visibleRows.length) % visibleRows.length];
            if (next) setPeekId(next.id);
          }}
          onDelete={(row) => {
            setPeekId(null);
            deleteRows(new Set([row.id]));
          }}
          onChange={(row, key, value) => updateCell(row.id, key, value)}
          renderField={(column, row) => renderField(column, row, "peek")}
        />
      ) : null}
    </div>
  );
}

/**
 * Vazio: com `emptyMessage` (string/nó) mostra ela; `null` desliga. Sem a
 * prop: se os filtros/busca esconderam tudo, o bloco do desenho ("Nenhuma
 * linha corresponde a esta visão" + "Limpar filtros e busca"); senão,
 * "Nenhuma linha ainda.".
 */
function EmptyState({ message, narrowed, onClear }: { message: React.ReactNode; narrowed: boolean; onClear: () => void }) {
  if (message === null) return null;
  if (message !== undefined) return <div className="flex h-[89px] items-center justify-center px-4 text-sm text-muted-foreground">{message}</div>;
  if (!narrowed) return <div className="flex h-[89px] items-center justify-center px-4 text-sm text-muted-foreground">Nenhuma linha ainda.</div>;
  return (
    <div className="sticky left-0 grid w-full max-w-[610px] justify-items-start gap-2 px-5 py-6">
      <span className="text-base font-semibold text-heading">Nenhuma linha corresponde a esta visão</span>
      <span className="text-sm text-muted-foreground">Ajuste os filtros ou a busca para ver mais linhas.</span>
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "mt-1 inline-flex h-[26px] items-center rounded-control border border-hairline bg-[color-mix(in_srgb,var(--secondary)_21%,transparent)] px-3 text-sm font-medium text-heading",
          focusRing,
        )}
      >
        Limpar filtros e busca
      </button>
    </div>
  );
}

// Bloco de esqueleto da tabela plana: o `@adinkra/skeleton` sem a borda de
// tinta (que destoa da tabela de 1px), num véu de 8% da tinta — lê nos dois
// temas sem cor nova.
const bone = "rounded-[3px] border-0 bg-[color-mix(in_srgb,var(--heading)_8%,transparent)]";
// Larguras φ que giram por linha (tudo igual parece grade vazia, não
// conteúdo chegando).
const BONE_WIDTHS = ["w-[89px]", "w-[55px]", "w-[144px]", "w-[68px]", "w-[110px]"];

/**
 * Forma do esqueleto pela coluna, imitando o que vai chegar: título com o
 * ícone de página, etiqueta/status como pílula, ponto + texto, relação com
 * glifo, número à direita, caixa de 16 no centro. A barra de texto tem 13
 * e fica no meio da linha de 21 (mt 4), igual ao texto real.
 */
function SkeletonCell({ column, isPrimary, seed }: { column: DataTableColumn; isPrimary: boolean; seed: number }) {
  const width = BONE_WIDTHS[seed % BONE_WIDTHS.length];
  const text = <Skeleton className={cn(bone, "mt-1 h-[13px] max-w-full", width)} />;
  if (isPrimary) {
    return (
      <div className="flex items-start gap-2 py-2 pl-3 pr-2">
        <Skeleton className={cn(bone, "mt-[5px] size-4 flex-none")} />
        <Skeleton className={cn(bone, "mt-[6px] h-[13px] max-w-full", BONE_WIDTHS[(seed + 2) % BONE_WIDTHS.length])} />
      </div>
    );
  }
  switch (column.type) {
    case "checkbox":
      return (
        <div className="flex justify-center pt-[13px]">
          <Skeleton className={cn(bone, "size-4")} />
        </div>
      );
    case "number":
      return (
        <div className="flex justify-end p-3">
          <Skeleton className={cn(bone, "mt-1 h-[13px] w-[68px]")} />
        </div>
      );
    case "status":
      return (
        <div className="p-3">
          <Skeleton className={cn(bone, "h-[21px] w-[89px] rounded-full")} />
        </div>
      );
    case "select":
      if (column.selectStyle === "dot") {
        return (
          <div className="flex items-center gap-2 p-3">
            <Skeleton className={cn(bone, "size-3 flex-none rounded-full")} />
            {text}
          </div>
        );
      }
      return (
        <div className="flex gap-2 p-3">
          <Skeleton className={cn(bone, "h-[21px] w-[68px]")} />
          {column.multi && seed % 2 === 0 ? <Skeleton className={cn(bone, "h-[21px] w-[42px]")} /> : null}
        </div>
      );
    case "relation":
      return (
        <div className="flex items-start gap-2 p-3">
          <Skeleton className={cn(bone, "mt-1 size-[13px] flex-none")} />
          {text}
        </div>
      );
    default:
      return <div className="p-3">{text}</div>;
  }
}

/**
 * Carregando (`loading`): 5 linhas na MESMA altura da linha real (42), com
 * as mesmas bordas e colunas congeladas, pra tabela não pular quando os
 * dados chegam. O pulso é o do Skeleton; quem pede menos movimento ao
 * sistema já fica sem ele (regra global do @adinkra/tokens).
 */
function SkeletonRows({
  columns,
  primaryId,
  extra,
  gutterClassName,
  cellProps,
}: {
  columns: DataTableColumn[];
  primaryId?: string;
  extra: boolean;
  gutterClassName?: string;
  cellProps: (column: DataTableColumn, index: number) => { className?: string; style?: React.CSSProperties };
}) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          <td className={cn("h-[42px] border-b border-b-hairline bg-background", gutterClassName)} />
          {columns.map((column, columnIndex) => {
            const props = cellProps(column, columnIndex);
            return (
              <td key={column.id} style={props.style} className={cn("h-[42px] border-b border-b-hairline bg-background p-0 align-top", props.className)}>
                <SkeletonCell column={column} isPrimary={column.id === primaryId} seed={rowIndex + columnIndex} />
              </td>
            );
          })}
          {extra ? <td className="border-b border-b-hairline bg-background" /> : null}
        </tr>
      ))}
    </>
  );
}

/**
 * Painel "Abrir" (desenho de 07/10): gaveta à direita (`@adinkra/sheet`,
 * 610 em vez dos 377 padrão — cabe rótulo + campo lado a lado) com
 * anterior/próxima (circula pelas linhas visíveis), a posição ("3 de 12"),
 * excluir, o título grande editável, cada propriedade com o mesmo editor da
 * célula e, com `peek.notes`, as notas livres.
 */
function RowPeek({
  row,
  container,
  columns,
  primaryColumn,
  notesKey,
  position,
  onClose,
  onStep,
  onDelete,
  onChange,
  renderField,
}: {
  row: DataTableRow | undefined;
  container: HTMLElement | null;
  columns: DataTableColumn[];
  primaryColumn?: DataTableColumn;
  notesKey?: string;
  position: string;
  onClose: () => void;
  onStep: (delta: -1 | 1) => void;
  onDelete: (row: DataTableRow) => void;
  onChange: (row: DataTableRow, key: string, value: unknown) => void;
  renderField: (column: DataTableColumn, row: DataTableRow) => React.ReactNode;
}) {
  const navButton =
    cn("inline-flex size-[26px] items-center justify-center rounded-control text-muted-foreground hover:text-heading", hoverBg, focusRing);
  const title = row && primaryColumn ? row[primaryColumn.id] : undefined;
  return (
    <Sheet open={!!row} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent
        side="right"
        container={container ?? undefined}
        aria-label="Página da linha"
        className={cn("w-full max-w-[610px] gap-5 border-0 px-6 pb-7 pt-5", softShadow)}
      >
        {row ? (
          <>
            <div className="flex items-center gap-2 pr-6">
              <button type="button" aria-label="Anterior" onClick={() => onStep(-1)} className={navButton}>
                <Glyph name="chevLeft" size={16} />
              </button>
              <button type="button" aria-label="Próxima" onClick={() => onStep(1)} className={navButton}>
                <Glyph name="chevRight" size={16} />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">{position}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => onDelete(row)}
                className={cn("inline-flex h-[26px] items-center gap-2 rounded-control px-2 text-sm font-medium text-destructive", hoverBg, focusRing)}
              >
                <Glyph name="trash" />
                Excluir
              </button>
            </div>
            {primaryColumn ? (
              <div className="flex items-start gap-3">
                <span className="mt-2 inline-flex text-muted-foreground">
                  <Glyph name="file" size={26} strokeWidth={1.5} />
                </span>
                <input
                  type="text"
                  aria-label={primaryColumn.header || "Título"}
                  placeholder="Sem título"
                  value={typeof title === "string" ? title : ""}
                  onChange={(event) => onChange(row, primaryColumn.id, event.currentTarget.value)}
                  className="w-full bg-transparent text-[34px] font-semibold leading-[42px] text-heading outline-none placeholder:text-muted-foreground"
                />
              </div>
            ) : null}
            <div className="grid gap-1">
              {columns
                .filter((column) => column.id !== primaryColumn?.id)
                .map((column) => (
                  <div key={column.id} className="grid min-h-[34px] grid-cols-[144px_minmax(0,1fr)] items-center gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <TypeIcon column={column} />
                      <span className="truncate">{column.header || column.id}</span>
                    </span>
                    <div className="flex min-w-0">{renderField(column, row)}</div>
                  </div>
                ))}
            </div>
            {notesKey ? (
              <div className="grid gap-2 border-t border-hairline pt-4">
                <Caption>Notas</Caption>
                <textarea
                  aria-label="Notas"
                  placeholder="Escreva algo sobre esta linha…"
                  value={typeof row[notesKey] === "string" ? (row[notesKey] as string) : ""}
                  onChange={(event) => onChange(row, notesKey, event.currentTarget.value)}
                  className="min-h-[144px] w-full resize-y rounded-control border border-hairline bg-transparent p-3 text-sm text-heading outline-none focus-visible:border-ring"
                />
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Lista de cartões (abaixo de 610 de largura do container — `@container` +
 * `@[610px]:`, não media query: a tabela pode estar numa coluna estreita de
 * uma tela larga). Cartão: raio 8, borda 2, padding 13, gap 8.
 *
 * O que cada cartão mostra (heurística, sobrescrevível por `mobileCard`):
 * - título: a coluna principal;
 * - valor à direita: a primeira fórmula com `format`, senão o primeiro número;
 * - linha de etiquetas: o primeiro status + o primeiro select;
 * - rodapé: a primeira data (esquerda) + o segundo select ou a primeira
 *   relação (direita).
 * Todo campo do cartão edita ali mesmo, com os mesmos editores da célula.
 */
function MobileCards({
  columns,
  rows,
  primaryColumn,
  config,
  aggregateOf,
  onAddRow,
  renderField,
  loading,
  emptyText,
}: {
  loading: boolean;
  emptyText: React.ReactNode;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  primaryColumn?: DataTableColumn;
  config?: DataTableProps["mobileCard"];
  aggregateOf: (column: DataTableColumn) => Aggregate | undefined;
  onAddRow?: () => void;
  renderField: (column: DataTableColumn, row: DataTableRow) => React.ReactNode;
}) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const pick = (ids: string[] | undefined) => ids?.map((id) => byId.get(id)).filter((c): c is DataTableColumn => !!c);
  const selects = columns.filter((column) => column.type === "select");

  const title = (config?.title ? byId.get(config.title) : undefined) ?? primaryColumn;
  const value =
    (config?.value ? byId.get(config.value) : undefined) ??
    columns.find((column) => column.type === "formula" && column.format) ??
    columns.find((column) => column.type === "number");
  const badges =
    pick(config?.badges) ??
    [columns.find((column) => column.type === "status"), selects[0]].filter((c): c is DataTableColumn => !!c);
  const meta =
    pick(config?.meta) ??
    [columns.find((column) => column.type === "date"), selects[1] ?? columns.find((column) => column.type === "relation")].filter(
      (c): c is DataTableColumn => !!c,
    );

  const summaryAggregate = value ? aggregateOf(value) : undefined;
  const summary = value && summaryAggregate ? formatAggregate(value, rows, summaryAggregate) : undefined;

  return (
    // Arquivo de 07/10: lista, não cartões — cada linha separada por 1px
    // `--hairline`, título com ícone de página e valor em cima, propriedades
    // embaixo (recuadas 21, sob o texto do título). "Nova página" em texto e
    // um botão redondo de 55 flutuando no canto (o "+" de criar do mobile).
    <div className="relative grid @[610px]:hidden">
      {loading
        ? [0, 1, 2].map((index) => (
            // Mesmo desenho da linha da lista: ícone + título e valor em
            // cima, uma pílula e um texto embaixo, recuados 21.
            <div key={index} aria-hidden="true" className="grid gap-2 border-b border-hairline py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Skeleton className={cn(bone, "mt-[5px] size-4 flex-none")} />
                  <Skeleton className={cn(bone, "mt-[6px] h-[13px]", BONE_WIDTHS[(index + 2) % BONE_WIDTHS.length])} />
                </div>
                <Skeleton className={cn(bone, "mt-[6px] h-[13px] w-[68px]")} />
              </div>
              <div className="flex items-center gap-3 pl-[21px]">
                <Skeleton className={cn(bone, "h-[21px] w-[89px] rounded-full")} />
                <Skeleton className={cn(bone, "h-[13px] w-[55px]")} />
              </div>
            </div>
          ))
        : null}
      {!loading && rows.length === 0 && emptyText !== null ? <p className="py-5 text-center text-sm text-muted-foreground">{emptyText}</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="grid gap-2 border-b border-hairline py-4">
          <div className="flex items-start justify-between gap-3">
            {title ? (
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span className="mt-[5px] inline-flex flex-none text-muted-foreground">
                  <Glyph name="file" size={16} strokeWidth={1.5} />
                </span>
                {renderField(title, row)}
              </div>
            ) : null}
            {value ? <div className="flex max-w-[144px] flex-none justify-end">{renderField(value, row)}</div> : null}
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-[21px]">
              {badges.map((column) => (
                <div key={column.id} className="min-w-0">
                  {renderField(column, row)}
                </div>
              ))}
            </div>
          ) : null}
          {meta.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pl-[21px]">
              {meta.map((column) => (
                <div key={column.id} className="min-w-0">
                  {renderField(column, row)}
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
      {onAddRow ? (
        <button
          type="button"
          onClick={onAddRow}
          className={cn("flex h-[42px] items-center gap-2 text-sm text-muted-foreground hover:text-heading", focusRing)}
        >
          <PlusIcon />
          Nova página
        </button>
      ) : null}
      {value && summary && summaryAggregate ? (
        <div className="flex items-baseline justify-end gap-2 border-t border-hairline pt-3">
          <Caption>{aggregateShortLabel(summaryAggregate)}</Caption>
          <span className="text-base tabular-nums text-heading">{summary.text}</span>
        </div>
      ) : null}
      {onAddRow ? (
        <button
          type="button"
          aria-label="Nova página"
          onClick={onAddRow}
          className={cn(
            "sticky bottom-5 ml-auto mt-3 flex size-[55px] items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover",
            softShadow,
            focusRing,
          )}
        >
          <PlusIcon className="size-5" />
        </button>
      ) : null}
    </div>
  );
}
