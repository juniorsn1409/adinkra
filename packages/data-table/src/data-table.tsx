"use client";

import * as React from "react";
import { Badge } from "@adinkra/badge";
import { cn } from "@adinkra/core";
import { Checkbox } from "@adinkra/checkbox";
import { Skeleton } from "@adinkra/skeleton";
import { Calendar, Popover, PopoverContent, PopoverTrigger, formatLongDate } from "@adinkra/date-picker";
import { AggregateMenu, ChipsBar, ColumnMenu, ColumnsVisibilityMenu, FilterBuilder, SortMenu, TopBar } from "./chrome";
import { ColumnTypeIcon, DragHandleIcon, Glyph, PlusIcon, RelationGlyph, TrashIcon } from "./glyphs";
import {
  aggregateShortLabel,
  applyFilters,
  applySorts,
  cellValue,
  computedFormula,
  isFormulaOverridden,
  columnOptions,
  computeAggregate,
  createEmptyRow,
  formatNumber,
  formatShortDate,
  isCurrencyColumn,
  isNumericColumn,
  matchesSearch,
  operatorsFor,
  parseISODate,
  primaryColumnOf,
} from "./logic";
import type {
  Aggregate,
  DataTableColumn,
  DataTableFilter,
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

// O estado indeterminate é resolvido pelo próprio @adinkra/checkbox. A opacidade
// vai no <input> (não no invólucro): só a caixa some em repouso; o check/traço,
// irmãos do input, já ficam invisíveis quando não marcado.
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
    <Checkbox
      size="sm"
      aria-label="Selecionar todas as linhas"
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
      className="opacity-0 checked:opacity-100 indeterminate:opacity-100 group-hover/header:opacity-100 focus-visible:opacity-100"
    />
  );
}

// `surface` separa a mesma célula na grade e no cartão do mobile: os dois
// estão no DOM ao mesmo tempo (um escondido por container query), e sem isso
// editar num abriria o Popover/campo do outro também.
interface CellId {
  rowId: string;
  columnId: string;
  surface: "grid" | "card";
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
// Só tokens existentes; a névoa (`mist`) é o único par fixo — ver StatusColor.
const OPTION_COLORS: Record<StatusColor, { fill: string; dot: string }> = {
  primary: { fill: "bg-primary text-primary-foreground", dot: "bg-primary" },
  accent: { fill: "bg-accent text-accent-foreground", dot: "bg-accent" },
  secondary: { fill: "bg-secondary text-secondary-foreground", dot: "bg-secondary" },
  "tag-coral": { fill: "bg-tag-coral text-tag-coral-foreground", dot: "bg-tag-coral" },
  "tag-sky": { fill: "bg-tag-sky text-tag-sky-foreground", dot: "bg-tag-sky" },
  "tag-mustard": { fill: "bg-tag-mustard text-tag-mustard-foreground", dot: "bg-tag-mustard" },
  "tag-navy": { fill: "bg-tag-navy text-tag-navy-foreground", dot: "bg-tag-navy" },
  mist: { fill: "bg-[#C9DDF0] text-[#1E3550]", dot: "bg-[#C9DDF0]" },
  destructive: { fill: "bg-destructive text-destructive-foreground", dot: "bg-destructive" },
};

const BADGE_VARIANTS = new Set<string>(["primary", "accent", "secondary", "tag-coral", "tag-sky", "tag-mustard"]);

/**
 * Como uma opção aparece, por tipo de coluna:
 * - status → pílula do desenho (26 de altura, raio 13, borda 2, ponto de 8
 *   na cor do texto);
 * - select com `selectStyle: "dot"` → ponto de 13 com borda de tinta +
 *   texto (o visual das etiquetas do redesenho φ);
 * - select padrão → `@adinkra/badge`, como sempre foi. Continua o padrão
 *   de propósito: trocar o visual de quem já usa sem ninguém pedir quebraria
 *   telas prontas; o ponto é opt-in (a demo do docs usa).
 */
function OptionView({ column, option }: { column: DataTableColumn; option: AnyOption }) {
  const colors = OPTION_COLORS[option.color] ?? OPTION_COLORS.primary;
  // Relação com opções: só o rótulo sublinhado (o glifo fica fora, é o "abrir").
  if (column.type === "relation") return <span className={relationText}>{option.label}</span>;
  if (column.type === "status") {
    return (
      <span
        className={cn(
          "inline-flex h-[26px] flex-none items-center gap-2 whitespace-nowrap rounded-[13px] border-[length:var(--border-width)] border-ink px-[10px] text-sm font-medium",
          colors.fill,
        )}
      >
        <span aria-hidden="true" className="size-3 flex-none rounded-full bg-current" />
        {option.label}
      </span>
    );
  }
  if (column.selectStyle === "dot") {
    return (
      <span className="inline-flex items-center gap-3 text-sm font-medium text-heading">
        <span aria-hidden="true" className={cn("size-4 flex-none rounded-full border-[length:var(--border-width)] border-ink", colors.dot)} />
        {option.label}
      </span>
    );
  }
  // Cor que não é variante do Badge (tag-navy, mist, destructive): variante
  // qualquer + as classes de cor por cima (o `cn` do Badge resolve o conflito).
  if (BADGE_VARIANTS.has(option.color)) {
    return <Badge variant={option.color as Exclude<SelectColor, "tag-navy">}>{option.label}</Badge>;
  }
  return <Badge className={colors.fill}>{option.label}</Badge>;
}

function selectedValues(column: DataTableColumn, value: unknown): string[] {
  if (column.multi) return Array.isArray(value) ? (value as string[]) : [];
  return value ? [String(value)] : [];
}

// Célula padrão: 42 de altura mínima (cresce quando o texto quebra),
// conteúdo alinhado no topo, padding 8/13 — medidas do desenho φ.
const cellPad = "min-h-[42px] px-4 py-3";
const cellTrigger = cn(
  "flex w-full items-start text-left text-sm text-foreground outline-none",
  cellPad,
  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
);

/**
 * Célula "select" (single ou multi, pedido do usuário — cobre tanto
 * Status/Tipo de valor único quanto Tags/Conta de vários valores). O
 * dropdown usa o `Popover` genérico exportado por @adinkra/date-picker (Base
 * UI por baixo, mesmo motor do NavigationMenu/DatePicker) — não mais
 * `absolute` cru. Um `<td>` de tabela é `display: table-cell`, e um
 * descendente posicionado `absolute` dentro dele pode fazer a CÉLULA (e a
 * linha inteira) crescer pra caber o dropdown, distorcendo o layout da
 * tabela — bug reproduzido, não hipotético. Portal tira o dropdown da árvore
 * da tabela de vez, e de brinde o Popover já cuida de fechar no Escape/clique
 * fora sozinho (a lógica manual de pointerdown/keydown que existia aqui
 * saiu).
 *
 * Também serve o tipo "status" (redesenho φ): é um select de valor único
 * cuja opção aparece como pílula (ver `OptionView`).
 */
function SelectCell({
  column,
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
  triggerClassName,
}: {
  column: DataTableColumn;
  value: unknown;
  onChange: (next: string | string[]) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  triggerClassName?: string;
}) {
  const options = columnOptions(column);
  const multi = column.type === "select" && !!column.multi;
  const selected = selectedValues({ ...column, multi }, value);

  function toggle(option: AnyOption) {
    if (multi) {
      const next = selected.includes(option.value) ? selected.filter((v) => v !== option.value) : [...selected, option.value];
      onChange(next);
    } else {
      onChange(option.value);
      onClose();
    }
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value));

  return (
    <Popover open={isEditing} onOpenChange={(open) => (open ? onRequestEdit() : onClose())}>
      <PopoverTrigger className={triggerClassName ?? cn(cellTrigger, "flex-wrap gap-2")}>
        {selectedOptions.length === 0
          ? null
          : selectedOptions.map((option) => <OptionView key={option.value} column={column} option={option} />)}
      </PopoverTrigger>
      <PopoverContent className="grid min-w-9 gap-1 p-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-control px-2 py-1 text-left hover:bg-card",
                isSelected && "bg-card",
              )}
            >
              <OptionView column={column} option={option} />
              {isSelected ? <span aria-hidden className="text-xs text-heading">✓</span> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Campo de edição do desenho: 34 de altura dentro da célula (padding 3/5),
// borda de tinta, raio 3 e contorno de foco 2.
const editInput = cn(
  "h-[34px] w-full rounded-[3px] border-[length:var(--border-width)] border-ink bg-card px-3 text-sm text-foreground",
  "outline outline-2 outline-offset-[2px] outline-ring",
);

// `className` troca a embalagem: na grade, padding 3/5 dentro da célula;
// no cartão do mobile, só largura cheia.
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
    <div className={className ?? "px-2 py-[3px]"}>
      <input
        type="text"
        ref={autoFocusAndSelect}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") onCancel();
        }}
        className={cn(editInput, bold && "font-semibold")}
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
    <div className={className ?? "px-2 py-[3px]"}>
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
          "text-right font-mono",
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
// própria dele, mas sem o `DatePicker` inteiro (botão com borda/sombra/ícone
// próprios): destoava demais das outras células (texto puro até clicar,
// igual `SelectCell`/`TextCell`). Reescrita pra ficar no mesmo padrão de
// gatilho-texto do `SelectCell` — mesmo `isEditing`/`onRequestEdit`/`onClose`
// controlado pela tabela (pedido do usuário — "deixamos so o texto, e ao
// clicar na data aparecer a popover pra escolher a data").
function DateCell({
  column,
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
  triggerClassName,
}: {
  column: DataTableColumn;
  value: unknown;
  onChange: (next: string) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  triggerClassName?: string;
}) {
  const selected = parseISODate(value);

  return (
    <Popover open={isEditing} onOpenChange={(open) => (open ? onRequestEdit() : onClose())}>
      <PopoverTrigger className={triggerClassName ?? cellTrigger}>
        {selected ? <span className="whitespace-nowrap">{formatDate(column, selected)}</span> : null}
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
 * editável"): clicar no TEXTO edita, clicar no GLIFO abre. Escolhido em vez
 * de "abrir só no hover" porque funciona igual no toque (mobile não tem
 * hover) e no teclado (são dois alvos de Tab, cada um com o seu nome).
 * `in`/`out` pintam o glifo de primary/destructive, a regra de
 * entrada/saída do sistema.
 */
function RelationOpen({ column, row, value, label }: { column: DataTableColumn; row: DataTableRow; value: string; label: string }) {
  const icon = relationIconOf(column, value, row);
  const tone = icon === "in" ? "text-primary" : icon === "out" ? "text-destructive" : "text-muted-foreground";
  const className = cn(
    "mt-[3px] inline-flex flex-none rounded-[3px]",
    tone,
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring",
  );
  const glyph = <RelationGlyph icon={icon} />;
  const href = column.relation?.href?.(row);
  if (href) {
    return (
      <a href={href} aria-label={`Abrir ${label}`} className={cn(className, "hover:bg-surface")}>
        {glyph}
      </a>
    );
  }
  const onClick = column.relation?.onClick;
  if (onClick) {
    return (
      <button type="button" aria-label={`Abrir ${label}`} onClick={() => onClick(row)} className={cn(className, "hover:bg-surface")}>
        {glyph}
      </button>
    );
  }
  return <span className={className}>{glyph}</span>;
}

const relationText = "text-sm font-medium text-heading underline decoration-hairline decoration-2 underline-offset-[5px]";

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
  const text =
    typeof value === "number" ? (
      <span className={cn("font-mono text-sm", value < 0 ? "text-destructive" : "text-heading")}>
        {column.format ? formatNumber(column, value) : String(value)}
      </span>
    ) : (
      <span className="text-sm text-foreground">{value == null ? null : String(value)}</span>
    );
  return (
    <span className="inline-flex items-center gap-2">
      {marker}
      {text}
    </span>
  );
}

function DisplayValue({ column, value }: { column: DataTableColumn; value: unknown }) {
  if (column.type === "number") {
    const numeric = typeof value === "number" ? value : 0;
    const formatted = column.currency ? formatNumber(column, numeric) : String(numeric);
    return <span className="font-mono text-sm text-foreground">{formatted}</span>;
  }
  return <span className="text-sm text-foreground">{typeof value === "string" ? value : null}</span>;
}

// Gatilho de edição no cartão do mobile: sem o padding de 8/13 da célula
// (o cartão já tem o dele), com hover/foco próprios pra dizer que é tocável.
const cardTrigger = cn(
  "inline-flex min-h-[26px] max-w-full items-center rounded-control text-left text-sm text-foreground outline-none hover:bg-surface",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring",
);

type Surface = "grid" | "card";

/**
 * Um campo editável de QUALQUER tipo — o mesmo editor na célula da grade e
 * no cartão do mobile (pedido do usuário, 27/09 — "todo campo é pra ser
 * editável"). Só muda a embalagem (`surface`): na grade, 42 de altura
 * mínima e padding 8/13; no cartão, gatilho enxuto.
 *
 * - text/number: texto (ou mono à direita) → `<input>` ao clicar.
 * - select/status: seletor em Popover. relation com `options` usa o mesmo.
 * - date: Calendar em Popover.
 * - checkbox: um clique marca/desmarca, sem modo de edição.
 * - relation sem `options`: o texto vira `<input>`; o glifo abre o link.
 * - formula: `<input>` com o valor efetivo; o que for digitado vira
 *   sobrescrita em `row[column.id]`, vazio volta ao calculado. Abrir e sair
 *   sem mudar nada não grava (senão só olhar congelaria o calculado).
 * - coluna principal: texto em seminegrito + "Abrir" (com `onOpenRow`) — no
 *   hover na grade, sempre visível no cartão (toque não tem hover).
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
  onOpenRow,
}: {
  column: DataTableColumn;
  row: DataTableRow;
  surface: Surface;
  editing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
  onCommit: (value: unknown) => void;
  isPrimary: boolean;
  onOpenRow?: (row: DataTableRow) => void;
}) {
  const grid = surface === "grid";
  const trigger = grid ? cellTrigger : cardTrigger;
  const inputWrap = grid ? undefined : "w-full";
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
          triggerClassName={cn(trigger, "flex-wrap gap-2")}
        />
      );
    case "date":
      return (
        <DateCell
          column={grid ? column : { ...column, dateStyle: "short" }}
          value={value}
          isEditing={editing}
          onRequestEdit={onRequestEdit}
          onClose={onClose}
          onChange={onCommit}
          triggerClassName={grid ? cellTrigger : cn(cardTrigger, "text-muted-foreground")}
        />
      );
    case "checkbox":
      return (
        <div className={grid ? cellPad : "inline-flex"}>
          <Checkbox
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
        <div className={cn("flex items-start gap-2", grid ? cellPad : "min-h-[26px] items-center")}>
          {text ? <RelationOpen column={column} row={row} value={text} label={label} /> : null}
          {options ? (
            <SelectCell
              column={column}
              value={value}
              isEditing={editing}
              onRequestEdit={onRequestEdit}
              onClose={onClose}
              onChange={onCommit}
              triggerClassName={cn(
                "min-h-[21px] min-w-0 flex-1 text-left outline-none",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring",
              )}
            />
          ) : (
            <button
              type="button"
              onClick={onRequestEdit}
              className="min-h-[21px] min-w-0 flex-1 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring"
            >
              {text ? <span className={relationText}>{label}</span> : null}
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
          className={cn(trigger, grid && "justify-end")}
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
    // Coluna principal: ícone de página (só na grade) + texto em seminegrito
    // + "Abrir" (26, caixa-alta 10, borda 2, sombra 3) — só com `onOpenRow`.
    // Dois botões irmãos (editar / abrir), nunca um dentro do outro.
    return (
      <div className={cn("flex items-start gap-3", grid ? cellPad : "min-w-0 flex-1")}>
        {grid ? (
          <span className="mt-[3px] inline-flex text-muted-foreground">
            <Glyph name="file" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRequestEdit}
          className="min-h-[21px] min-w-0 flex-1 text-left text-sm font-semibold text-heading outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring"
        >
          {typeof value === "string" ? value : null}
        </button>
        {onOpenRow ? (
          <button
            type="button"
            onClick={() => onOpenRow(row)}
            className={cn(
              "inline-flex h-[26px] flex-none items-center gap-2 rounded-control border-[length:var(--border-width)] border-ink bg-card px-3 font-display text-xs font-medium uppercase tracking-[0.13em] text-heading shadow-brutal",
              "transition-[opacity,translate,box-shadow] duration-150 ease-[var(--ease-out)]",
              grid && "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
              "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
            )}
          >
            <Glyph name="expand" size={10} strokeWidth={2.5} />
            Abrir
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button type="button" onClick={onRequestEdit} className={cn(trigger, grid && column.type === "number" && "justify-end")}>
      {column.type === "number" && !grid ? (
        <span className="font-mono text-sm text-heading">{formatNumber(column, typeof value === "number" ? value : 0)}</span>
      ) : (
        <DisplayValue column={column} value={value} />
      )}
    </button>
  );
}

// Botão de coluna dentro da barra de edição em massa (pedido do usuário —
// print de referência do Notion: "1 selecionados", um botão por coluna,
// lixeira no final). Cada botão abre o mesmo tipo de popover que a célula
// individual já usa (Calendar pra data, lista de opções pra select), só que
// aplicando o valor escolhido em TODAS as linhas selecionadas de uma vez em
// vez de uma célula só — não reaproveita `SelectCell`/`DateCell` porque
// essas já vêm presas ao ciclo de vida de UMA célula (`isEditing` por
// `CellId`), a barra não tem `CellId` nenhum, só a coluna.
// Redesenho φ: status (e relação com `options`) entra como select; caixa
// ganha Marcar/Desmarcar; relação sem opções edita como texto; fórmula grava
// a sobrescrita manual em todas (campo vazio = volta ao calculado).
function BulkEditButton({ column, onApply }: { column: DataTableColumn; onApply: (value: unknown) => void }) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const trigger = (
    <>
      <ColumnTypeIcon type={column.type} />
      {column.header}
    </>
  );
  const triggerClassName = "flex items-center gap-2 whitespace-nowrap rounded-control px-2 py-1 text-sm hover:bg-card";

  if (column.type === "select" || column.type === "status" || (column.type === "relation" && column.options)) {
    return <BulkSelectButton column={column} open={open} setOpen={setOpen} onApply={onApply} trigger={trigger} triggerClassName={triggerClassName} />;
  }

  if (column.type === "checkbox") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
        <PopoverContent align="start" className="grid min-w-9 gap-1 p-2">
          {[true, false].map((checked) => (
            <button
              key={String(checked)}
              type="button"
              onClick={() => {
                onApply(checked);
                setOpen(false);
              }}
              className="rounded-control px-2 py-1 text-left text-sm hover:bg-card"
            >
              {checked ? "Marcar" : "Desmarcar"}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  if (column.type === "date") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            onSelect={(date) => {
              onApply(date ? toISODate(date) : "");
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  const numeric = column.type === "number" || (column.type === "formula" && !!column.format);

  function apply() {
    const raw = inputRef.current?.value ?? "";
    if (column.type === "formula") onApply(raw.trim() === "" ? undefined : numeric ? Number(raw) || 0 : raw);
    else onApply(numeric ? Number(raw) || 0 : raw);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="flex items-center gap-2 p-2">
        <input
          ref={inputRef}
          type={numeric ? "number" : "text"}
          step={numeric ? "0.01" : undefined}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
          }}
          className="w-9 rounded-control border-[length:var(--border-width)] border-ink bg-transparent px-2 py-1 text-sm text-foreground outline-none [appearance:textfield] focus-visible:border-ring [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button type="button" onClick={apply} className="rounded-control border-[length:var(--border-width)] border-ink px-3 py-1 text-sm font-medium text-foreground hover:bg-card">
          Aplicar
        </button>
      </PopoverContent>
    </Popover>
  );
}

// Select em massa mantém o próprio estado de "o que já cliquei" (`checked`)
// nesta abertura do popover — começa vazio (é "definir pra todo mundo",
// não "editar o que já tem", já que linhas selecionadas podem ter valores
// diferentes entre si) e zera de novo ao fechar.
function BulkSelectButton({
  column,
  open,
  setOpen,
  onApply,
  trigger,
  triggerClassName,
}: {
  column: DataTableColumn;
  open: boolean;
  setOpen: (open: boolean) => void;
  onApply: (value: unknown) => void;
  trigger: React.ReactNode;
  triggerClassName: string;
}) {
  const options = columnOptions(column);
  const multi = column.type === "select" && !!column.multi;
  const [checked, setChecked] = React.useState<string[]>([]);

  function toggle(option: AnyOption) {
    if (multi) {
      const next = checked.includes(option.value) ? checked.filter((v) => v !== option.value) : [...checked, option.value];
      setChecked(next);
      onApply(next);
    } else {
      onApply(option.value);
      setOpen(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setChecked([]);
      }}
    >
      <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
      <PopoverContent className="grid min-w-9 gap-1 p-2">
        {options.map((option) => {
          const isChecked = checked.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option)}
              className={cn("flex items-center justify-between gap-2 rounded-control px-2 py-1 text-left hover:bg-card", isChecked && "bg-card")}
            >
              <OptionView column={column} option={option} />
              {isChecked ? <span aria-hidden className="text-xs text-heading">✓</span> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Barra flutuante e arrastável (pedido do usuário — "eu queria que fosse
 * flutuante e conseguisse mover a barra", print de referência do Notion
 * onde a barra tem uma alça de seis pontinhos à esquerda). `position:fixed`
 * — sai do fluxo da tabela de propósito, sobrepõe a página. Posição inicial
 * centralizada embaixo (`left:50% + translateX(-50%)`); ao arrastar, troca
 * pra coordenadas absolutas em px (`left`/`top` do clique, via
 * `getBoundingClientRect` + `setPointerCapture` — não precisa de listener
 * na window, o ponteiro capturado redireciona os eventos pro próprio botão
 * da alça mesmo se o cursor sair dele). Reseta pra posição padrão sozinha
 * quando a seleção zera e a barra desmonta (é `React.useState` local, não
 * sobrevive a isso) — comportamento certo, não bug: a barra deve nascer no
 * mesmo lugar cada vez que uma seleção nova começa.
 *
 * O desenho φ mostra a barra em tinta (fundo `--heading`); mantida em
 * `bg-surface` — a barra escura já foi testada e trocada a pedido do
 * usuário ("pode deixar na cor do desing system"), e isso vence o desenho.
 */
function DraggableBulkToolbar({ children }: { children: React.ReactNode }) {
  const barRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const dragOffset = React.useRef<{ pointerId: number; x: number; y: number } | null>(null);

  function onHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragOffset.current?.pointerId !== event.pointerId) return;
    setPosition({ x: event.clientX - dragOffset.current.x, y: event.clientY - dragOffset.current.y });
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragOffset.current?.pointerId === event.pointerId) dragOffset.current = null;
  }

  // Dois elementos de propósito: o de fora só posiciona (left/top e a
  // centralização, sem transição nenhuma — senão a barra ficaria atrás do
  // ponteiro ao arrastar); o de dentro cuida da entrada (sobe 8px + fade,
  // 200ms) via `starting:`. A saída continua instantânea: a barra desmonta
  // quando a seleção zera.
  return (
    <div
      ref={barRef}
      className="fixed z-50"
      style={position ? { left: position.x, top: position.y } : { left: "50%", bottom: 21, transform: "translateX(-50%)" }}
    >
      <div className="flex h-[42px] items-center gap-4 rounded-control border-[length:var(--border-width)] border-ink bg-surface px-3 text-foreground shadow-brutal transition-[opacity,translate] duration-200 ease-[var(--ease-out)] starting:translate-y-3 starting:opacity-0">
        <button
          type="button"
          aria-label="Mover barra"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          className="flex size-6 flex-none cursor-grab touch-none items-center justify-center rounded-control text-muted-foreground hover:bg-card active:cursor-grabbing"
        >
          <DragHandleIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

const DEFAULT_COLUMN_WIDTH = 144;
const MIN_COLUMN_WIDTH = 68;
// Coluna do gutter (+, alça, seleção): `w-7` = 55 (spec φ: "coluna de seleção 55").
const GUTTER_WIDTH = 55;

/**
 * Alça de redimensionar coluna (pedido do usuário — "vamos fazer todos os
 * campos serem Resizable"), mesma técnica de arrastar do `DraggableBulkToolbar`
 * (`setPointerCapture` no próprio elemento, sem listener de `window`). Uma
 * faixa fina na borda direita do `<th>` — só aparece de verdade no hover
 * (`hover:bg-secondary/40`), pra não voltar a parecer uma borda permanente
 * (o pedido anterior foi tirar as bordas do header).
 *
 * Largura inicial do arrasto vem do DOM (`getBoundingClientRect` no próprio
 * `<th>` pai), não de um valor em JS — colunas ainda não redimensionadas não
 * têm largura própria salva (ver `columnWidths`/`w-full` na tabela: crescem
 * pra preencher o espaço disponível sozinhas, só ganham um número fixo
 * quando alguém realmente arrasta), então não tem outro jeito de saber
 * "de onde" o arrasto começa.
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
      className="absolute inset-y-0 -right-2 z-10 w-3 cursor-col-resize touch-none select-none hover:bg-secondary/40 active:bg-secondary/60"
    />
  );
}

/**
 * Estado controlado OU não controlado (filtros e ordenação): com `value`
 * definido, quem usa manda e só recebe `onChange`; sem ele, a tabela guarda
 * a partir de `defaultValue`.
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
const SELECTED_BG = "bg-[color-mix(in_oklab,var(--secondary)_34%,var(--card))]";

function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground", className)}>{children}</span>;
}

/**
 * Tabela de dados editável estilo Notion (pedido do usuário, 15/09/2026,
 * a partir de um print do próprio Notion) — 4 tipos de coluna na v1 (texto,
 * select colorido single/multi via @adinkra/badge, número/moeda, data) +
 * adicionar linha. Controlada (rows/onRowsChange) — quem usa decide onde
 * persistir, o componente não guarda estado de dados sozinho, só o estado
 * efêmero de qual célula está em edição.
 *
 * Sem ação de excluir linha por linha — tinha, removida a pedido do usuário
 * (16/09/2026, "remove a acao do datatable de remover"). `rows`/
 * `onRowsChange` continuam controlados, então excluir ainda é possível de
 * fora do componente (quem usa filtra o array antes de passar `rows`).
 *
 * Seleção de várias linhas (checkbox por linha + "selecionar todas" no
 * cabeçalho, indeterminado quando só parte está marcada) — pedido do
 * usuário, 15/09/2026. É estado efêmero de UI, igual `editingCell`, não uma
 * prop controlada: quem usa não precisa da seleção pra nada na v1, só o
 * gesto de marcar várias.
 *
 * Barra de edição em massa (pedido do usuário, 16/09/2026, print de
 * referência do próprio Notion): aparece só quando `selectedIds` não está
 * vazio, um botão por coluna + lixeira. A lixeira tinha saído junto com o
 * resto da ação de excluir (ver acima), mas voltou só aqui, a pedido do
 * usuário — "adiciona um button de exclusao na barra de quando clica no
 * select" — não voltou o botão por linha nem o bulk delete de outro lugar,
 * só este.
 * Primeira versão copiava a barra escura do Notion (`bg-heading`); trocada
 * pra `bg-surface`/`border-ink`/`shadow-brutal` — mesmo "cartão único"
 * flutuante do resto do sistema (Popover, Card), a pedido do usuário
 * ("pode deixar na cor do desing system").
 *
 * `columnLines` (ligado por padrão, pedido do usuário — "quero a opcao por
 * default de ter linha nas colunas tambem"): mesmo padrão do
 * `@adinkra/table`. Histórico das bordas (15–16/09): tirar a borda do
 * container e do cabeçalho, voltar só a linha embaixo do cabeçalho, fina,
 * e nenhuma borda na coluna do checkbox ("nao deveria ter borda alguma na
 * coluna do select"). Na época a borda morava em seletores descendentes no
 * `<table>` (`[&_tbody_tr>td:not(:first-child)]`), com um seletor só por
 * borda pra não depender de quem ganha no conflito de especificidade (a
 * última coluna ficava com borda indevida com duas regras concorrentes).
 *
 * ─── Redesenho φ (27/09/2026, desenho aprovado "Data table · Adinkra φ") ───
 *
 * - Tipos novos: `status` (pílula), `relation` (link: o glifo abre, o
 *   texto edita), `formula` (calculada, com sobrescrita manual editável,
 *   negativo em destructive) e
 *   `checkbox` (um clique). Ícone do tipo em todo cabeçalho.
 * - Container volta a ter borda 2 + raio 8 + `shadow-brutal` (o desenho
 *   aprovado reabre a decisão de 15/09 de tirar a borda do container);
 *   cabeçalho de 34 em `bg-surface` com borda de tinta embaixo. A coluna do
 *   checkbox continua sem borda no corpo (decisão do usuário mantida).
 * - Bordas agora por célula (não mais seletor descendente) e a tabela é
 *   `border-separate border-spacing-0`: com `border-collapse`, a borda de
 *   uma célula `sticky` fica pintada na grade da tabela e não acompanha a
 *   célula ao rolar — a coluna congelada perderia a borda de tinta. Como
 *   cada célula só desenha baixo/direita, separar não duplica nada.
 * - Sem zebra: o desenho usa linha lisa em `--card`, hover em `--surface`
 *   e seleção em névoa. O fundo mora no `<td>` (não no `<tr>`) pelo mesmo
 *   motivo do sticky: célula congelada precisa de fundo próprio opaco.
 * - Coluna congelada (`frozen`): sticky à esquerda com borda de tinta na
 *   direita da ÚLTIMA congelada; o gutter (seleção) congela junto. O
 *   deslocamento de cada uma é a soma das larguras das congeladas antes
 *   dela — por isso coluna congelada sempre tem largura explícita (a da
 *   prop `width`, a arrastada, ou 144).
 * - Filtro, ordenação e busca rodam no cliente sobre `rows` (busca →
 *   filtros → ordenação). Editar continua mexendo no array original por
 *   `id`, então a ordem de `rows` nunca muda por causa da ordenação. Com
 *   ordenação ativa a alça de arrastar some: reordenar à mão não teria
 *   efeito visível.
 * - "Nova linha" só aparece com `onAddRow` (antes era sempre, e a própria
 *   tabela criava a linha). Pra manter o comportamento antigo:
 *   `onAddRow={() => onRowsChange([...rows, createEmptyRow(columns)])}`.
 * - Abaixo de 610 de largura DO CONTAINER (container query, não da janela)
 *   a grade vira lista de cartões.
 */
export function DataTable({
  columns,
  rows,
  onRowsChange,
  columnLines = true,
  className,
  onAddRow,
  onOpenRow,
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
  mobileCard,
  loading = false,
  emptyMessage,
  notice,
}: DataTableProps) {
  const [editingCell, setEditingCell] = React.useState<CellId | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // Só guarda largura de coluna que alguém redimensionou de propósito — as
  // outras ficam sem `width` nenhum no `<col>`, e o `table-fixed` reparte o
  // espaço sobrando entre elas sozinho (crescem pra caber na tela até
  // alguém mexer; só aparece scroll quando a soma das larguras passa do
  // espaço disponível de verdade, pedido do usuário — "barra de scroll so
  // pode aparecer quano nao tiver espaco pra crecer na tela").
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  // Congelar/esconder/agregação: a prop da coluna é o valor inicial, o menu
  // sobrescreve (mapa de "o que a pessoa mudou", igual `columnWidths`).
  const [frozenOverride, setFrozenOverride] = React.useState<Record<string, boolean>>({});
  const [hiddenOverride, setHiddenOverride] = React.useState<Record<string, boolean>>({});
  const [aggregateOverride, setAggregateOverride] = React.useState<Record<string, Aggregate>>({});

  const [filters, setFilters] = useControllable<DataTableFilter[]>(filtersProp, defaultFilters ?? [], onFiltersChange);
  const [sorts, setSorts] = useControllable<DataTableSort[]>(sortsProp, defaultSorts ?? [], onSortsChange);
  const [search, setSearch] = React.useState("");
  const [builderOpen, setBuilderOpen] = React.useState(false);

  const isHidden = (column: DataTableColumn) => hiddenOverride[column.id] ?? column.hidden ?? false;
  const isFrozen = (column: DataTableColumn) => frozenOverride[column.id] ?? column.frozen ?? false;
  const aggregateOf = (column: DataTableColumn): Aggregate | undefined => aggregateOverride[column.id] ?? column.aggregate;

  const visibleColumns = columns.filter((column) => !isHidden(column));
  const primaryColumn = primaryColumnOf(visibleColumns);
  const hasFrozen = visibleColumns.some(isFrozen);
  const lastFrozenId = [...visibleColumns].reverse().find(isFrozen)?.id;

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
  // "quando clico em nova linha nada aparece"). A linha nasce vazia e os
  // filtros ativos (ex.: Mês = Setembro) a escondiam na mesma hora. Uma linha
  // presa que não passa no filtro/busca aparece mesmo assim, no fim, até o
  // usuário mexer em filtro, ordenação ou busca — é o que se espera de uma
  // tabela estilo Notion. Detecta a linha nova comparando os ids antes/depois,
  // porque `onAddRow` é externo e não devolve a linha.
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
    const target = primaryColumn;
    if (target) setEditingCell({ rowId: added[0]!.id, columnId: target.id, surface: "grid" });
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    setPinnedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, [search, filters, sorts]);

  function requestAddRow() {
    addRequestedRef.current = true;
    onAddRow?.();
  }

  const visibleRows = React.useMemo(() => {
    const searched = search ? rows.filter((row) => matchesSearch(columns, row, search)) : rows;
    const shown = applySorts(columns, applyFilters(columns, searched, filters), sorts);
    if (pinnedIds.size === 0) return shown;
    const shownIds = new Set(shown.map((row) => row.id));
    const pinnedHidden = rows.filter((row) => pinnedIds.has(row.id) && !shownIds.has(row.id));
    return pinnedHidden.length ? [...shown, ...pinnedHidden] : shown;
  }, [rows, columns, search, filters, sorts, pinnedIds]);

  function setColumnWidth(columnId: string, width: number) {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
  }

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)));
  }

  // Ícone "+" do print de referência (Notion) — insere logo ABAIXO da linha
  // de onde foi clicado, não sempre no fim da tabela (diferente do "Nova
  // linha" do rodapé).
  function insertRowAfter(rowId: string) {
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;
    const next = [...rows];
    next.splice(index + 1, 0, createEmptyRow(columns));
    addRequestedRef.current = true;
    onRowsChange(next);
  }

  // Arrastar pra reordenar (alça de seis pontinhos do print), drag-and-drop
  // nativo (`draggable`/`onDragStart`/`onDrop`) em vez de pointer-capture —
  // mais simples aqui porque não precisa de posição em px durante o
  // arrasto, só saber ONDE soltou. `draggingRowId` vive só durante o gesto.
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

  function bulkUpdateColumn(columnId: string, value: unknown) {
    onRowsChange(rows.map((row) => (selectedIds.has(row.id) ? { ...row, [columnId]: value } : row)));
  }

  function bulkDeleteSelected() {
    onRowsChange(rows.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());
  }

  function newFilterFor(column: DataTableColumn): DataTableFilter {
    return { id: crypto.randomUUID(), columnId: column.id, operator: operatorsFor(column)[0] ?? "contains" };
  }

  function addFilter(column: DataTableColumn | undefined = visibleColumns[0] ?? columns[0]) {
    if (!column) return;
    setFilters([...filters, newFilterFor(column)]);
    setBuilderOpen(true);
  }

  function sortBy(column: DataTableColumn, direction: DataTableSort["direction"]) {
    const exists = sorts.some((sort) => sort.columnId === column.id);
    setSorts(exists ? sorts.map((sort) => (sort.columnId === column.id ? { ...sort, direction } : sort)) : [...sorts, { columnId: column.id, direction }]);
  }

  const allSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));
  const someSelected = !allSelected && visibleRows.some((row) => selectedIds.has(row.id));
  const hiddenCount = columns.length - visibleColumns.length;
  const showFooter = visibleColumns.some((column) => aggregateOf(column) !== undefined);
  const showTopBar = (views && views.length > 0) || !!toolbar || !!searchable;
  // Vazio: mensagem própria se veio `emptyMessage` (`null` desliga), senão
  // uma padrão que diz se é "não tem nada" ou "os filtros esconderam tudo".
  const narrowed = search !== "" || filters.length > 0;
  const emptyText =
    emptyMessage !== undefined ? emptyMessage : narrowed ? "Nenhuma linha com esses filtros." : "Nenhuma linha ainda.";
  const showChips = filterable || filters.length > 0 || sorts.length > 0 || (!showTopBar && hiddenCount > 0);

  const columnsMenu = (trigger: React.ReactElement<Record<string, unknown>>) => (
    <ColumnsVisibilityMenu
      columns={columns}
      isHidden={isHidden}
      onToggle={(column, visible) => setHiddenOverride((prev) => ({ ...prev, [column.id]: !visible }))}
      trigger={trigger}
    />
  );

  const builder = (
    <FilterBuilder columns={columns} filters={filters} onFiltersChange={setFilters} onAddRule={() => addFilter()} />
  );

  // Fundo por célula (não por linha) — ver o comentário do redesenho φ.
  function cellBg(selected: boolean) {
    return selected ? SELECTED_BG : "bg-card group-hover/row:bg-surface";
  }

  function stickyProps(column: DataTableColumn): { className?: string; style?: React.CSSProperties } {
    if (!isFrozen(column)) return {};
    return { className: "sticky z-10", style: { left: frozenLeft[column.id] } };
  }

  function borderRight(column: DataTableColumn, index: number) {
    if (column.id === lastFrozenId) return "border-r-[length:var(--border-width)] border-r-ink";
    if (columnLines && index < visibleColumns.length - 1) return "border-r border-r-hairline";
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
        isPrimary={column.id === primaryColumn?.id}
        onOpenRow={onOpenRow}
      />
    );
  }

  function renderFooterCell(column: DataTableColumn) {
    const aggregate = aggregateOf(column) ?? "none";
    if (column.id === primaryColumn?.id && aggregate === "none") {
      return (
        <div className="flex h-[34px] items-center px-4">
          <Caption>
            {visibleRows.length} {visibleRows.length === 1 ? "linha" : "linhas"}
          </Caption>
        </div>
      );
    }
    const result = computeAggregate(column, visibleRows, aggregate);
    const text =
      result === undefined ? null : aggregate === "count" || !isNumericColumn(column) ? String(result) : formatNumber(column, result);
    const negative = column.type === "formula" && result !== undefined && result < 0 && aggregate !== "count";
    return (
      <AggregateMenu
        column={column}
        value={aggregate}
        onChange={(next) => setAggregateOverride((prev) => ({ ...prev, [column.id]: next }))}
        className="group/foot flex h-[34px] w-full items-center justify-end gap-3 whitespace-nowrap px-4 outline-none hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {text === null ? (
          <Caption className="opacity-0 group-hover/foot:opacity-100 group-focus-visible/foot:opacity-100">Calcular</Caption>
        ) : (
          <>
            <Caption>{aggregateShortLabel(aggregate)}</Caption>
            <span className={cn("font-mono text-sm", negative ? "text-destructive" : "text-heading")}>{text}</span>
          </>
        )}
      </AggregateMenu>
    );
  }

  return (
    <div className={cn("@container", className)}>
      {selectedIds.size > 0 && (
        <DraggableBulkToolbar>
          <span className="mr-1 whitespace-nowrap font-display text-xs font-medium text-muted-foreground">
            {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="h-6 w-px bg-hairline" aria-hidden="true" />
          {visibleColumns.map((column) => (
            <BulkEditButton key={column.id} column={column} onApply={(value) => bulkUpdateColumn(column.id, value)} />
          ))}
          <button
            type="button"
            aria-label="Excluir linhas selecionadas"
            onClick={bulkDeleteSelected}
            className="ml-auto flex size-6 flex-none items-center justify-center rounded-control text-foreground transition-transform duration-100 ease-[var(--ease-out)] active:scale-95 hover:bg-card hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
          >
            <TrashIcon className="size-4" />
          </button>
        </DraggableBulkToolbar>
      )}
      {/* Cartão (borda 2, raio 8, sombra 3) só a partir de 610: no mobile a
          lista de cartões já tem borda própria, e cartão dentro de cartão
          empilharia duas bordas de tinta. */}
      <div className="@[610px]:overflow-hidden @[610px]:rounded-card @[610px]:border-[length:var(--border-width)] @[610px]:border-ink @[610px]:bg-card @[610px]:shadow-brutal">
        {showTopBar ? (
          <TopBar
            views={views}
            activeView={activeView}
            onViewChange={onViewChange}
            toolbar={toolbar}
            searchable={searchable}
            search={search}
            onSearchChange={setSearch}
            filterOn={filters.length > 0}
            sortOn={sorts.length > 0}
            onFilterClick={() => (filters.length === 0 ? addFilter() : setBuilderOpen(!builderOpen))}
            sortMenu={(trigger) => <SortMenu columns={visibleColumns} sorts={sorts} onSortsChange={setSorts} trigger={trigger} />}
            columnsMenu={columnsMenu}
          />
        ) : null}
        {showChips ? (
          <ChipsBar
            columns={columns}
            sorts={sorts}
            onSortsChange={setSorts}
            filters={filters}
            builderOpen={builderOpen}
            onBuilderOpenChange={setBuilderOpen}
            onAddFilter={() => addFilter()}
            builder={builder}
            extra={
              !showTopBar && hiddenCount > 0
                ? columnsMenu(
                    <button
                      type="button"
                      className="inline-flex h-[26px] items-center gap-2 rounded-control border-[length:var(--border-width)] border-transparent px-3 text-sm font-medium text-muted-foreground hover:bg-surface"
                    >
                      <Glyph name="eye" />
                      {hiddenCount} {hiddenCount === 1 ? "coluna oculta" : "colunas ocultas"}
                    </button>,
                  )
                : null
            }
          />
        ) : null}
        {notice ? <div className="border-b border-hairline p-4">{notice}</div> : null}

        <div className="hidden overflow-x-auto @[610px]:block">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            {/* `table-fixed` + `<col>` é o que faz redimensionar UMA coluna não
                empurrar as outras — sem isso, `<th>`/`<td>` de colunas diferentes
                não têm como ter larguras independentes na mesma tabela. `<col>`
                sem `width` (coluna nunca redimensionada) deixa o `table-fixed`
                repartir o espaço sobrando sozinho — só vira largura fixa em px
                depois que alguém arrasta a alça (ou quando a coluna traz `width`). */}
            <colgroup>
              <col className="w-7" />
              {visibleColumns.map((column) => {
                const width = widthOf(column);
                return <col key={column.id} style={width !== undefined ? { width } : undefined} />;
              })}
            </colgroup>
            <thead>
              <tr className="group/header">
                <th
                  className={cn(
                    "h-[34px] border-b-[length:var(--border-width)] border-b-ink bg-surface px-2 text-right",
                    hasFrozen && "sticky left-0 z-10",
                  )}
                >
                  <HeaderCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAllSelected} />
                </th>
                {visibleColumns.map((column, index) => {
                  const sticky = stickyProps(column);
                  const numeric = column.type === "number" || column.type === "formula";
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      style={sticky.style}
                      className={cn(
                        "relative h-[34px] border-b-[length:var(--border-width)] border-b-ink bg-surface p-0 align-middle",
                        borderRight(column, index),
                        sticky.className,
                      )}
                    >
                      <ColumnMenu
                        column={column}
                        sortDirection={sorts.find((sort) => sort.columnId === column.id)?.direction}
                        frozen={isFrozen(column)}
                        onSort={(direction) => sortBy(column, direction)}
                        onFilter={() => addFilter(column)}
                        onToggleFrozen={() => setFrozenOverride((prev) => ({ ...prev, [column.id]: !isFrozen(column) }))}
                        onHide={() => setHiddenOverride((prev) => ({ ...prev, [column.id]: true }))}
                        className={cn(
                          "flex h-[34px] w-full items-center gap-3 px-4 text-sm font-medium text-muted-foreground outline-none hover:bg-card",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                          numeric && "justify-end",
                        )}
                      >
                        {column.type === "checkbox" ? null : <ColumnTypeIcon type={column.type} />}
                        <span className="truncate">{column.header}</span>
                        {column.type === "checkbox" ? <ColumnTypeIcon type={column.type} /> : null}
                      </ColumnMenu>
                      <ColumnResizeHandle onResize={(width) => setColumnWidth(column.id, width)} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows columns={visibleColumns} /> : null}
              {!loading && visibleRows.length === 0 && emptyText !== null ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="h-[89px] border-b border-b-hairline bg-card px-4 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              ) : null}
              {(loading ? [] : visibleRows).map((row) => {
                const selected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    draggable={false}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      reorderRow(row.id);
                      setDraggingRowId(null);
                    }}
                    className={cn("group/row", draggingRowId === row.id && "opacity-[0.382]")}
                  >
                    <td className={cn("h-[42px] px-2 py-3 align-top", cellBg(selected), hasFrozen && "sticky left-0 z-10")}>
                      {/*
                        "+" (insere linha abaixo) e alça de arrastar (reordenar),
                        igual o print de referência do Notion — ambos só aparecem
                        no hover da linha, mesmo tratamento do checkbox.
                      */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label="Inserir linha abaixo"
                          onClick={() => insertRowAfter(row.id)}
                          className="flex size-5 flex-none items-center justify-center rounded-control text-muted-foreground opacity-0 transition-transform duration-100 ease-[var(--ease-out)] active:scale-95 hover:bg-card hover:text-foreground group-hover/row:opacity-100 focus-visible:opacity-100"
                        >
                          <PlusIcon className="size-3" />
                        </button>
                        {sorts.length === 0 ? (
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
                            className="flex size-5 flex-none cursor-grab items-center justify-center rounded-control text-muted-foreground opacity-0 hover:bg-card group-hover/row:opacity-100 active:cursor-grabbing"
                          >
                            <DragHandleIcon className="size-3" />
                          </div>
                        ) : null}
                        <Checkbox
                          size="sm"
                          aria-label="Selecionar linha"
                          checked={selected}
                          onCheckedChange={(next) => toggleRowSelected(row.id, next)}
                          className="opacity-0 checked:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100"
                        />
                      </div>
                    </td>
                    {visibleColumns.map((column, index) => {
                      const sticky = stickyProps(column);
                      return (
                        <td
                          key={column.id}
                          style={sticky.style}
                          className={cn(
                            "h-[42px] border-b border-b-hairline p-0 align-top",
                            cellBg(selected),
                            borderRight(column, index),
                            sticky.className,
                          )}
                        >
                          {renderField(column, row, "grid")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {onAddRow ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="h-[42px] border-b border-b-hairline bg-card p-0">
                    {/* `pl-[60px]` alinha o "+"/texto com a primeira coluna de dados —
                        55px do gutter do checkbox (`col w-7`, spec φ: "coluna de seleção
                        55") + 13px do `px-4` das células − 8px do padding do próprio
                        botão (desenho: botão de 34 com px 8). Soma (60) fica fora de S
                        de propósito: é um alinhamento calculado a partir de medidas já
                        em S, não uma medida de design isolada — arredondar pro S mais
                        próximo (55 ou 68) desalinharia visivelmente o texto da coluna
                        seguinte. `sticky left-0`: não some ao rolar na horizontal. */}
                    <div className="sticky left-0 w-fit py-1 pl-[60px] pr-4">
                      <button
                        type="button"
                        onClick={requestAddRow}
                        className="flex h-[34px] items-center gap-3 rounded-[3px] px-3 text-sm text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-ring"
                      >
                        <PlusIcon />
                        Nova linha
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
            {showFooter ? (
              <tfoot>
                <tr>
                  <td className={cn("h-[34px] bg-surface", hasFrozen && "sticky left-0 z-10")} />
                  {visibleColumns.map((column, index) => {
                    const sticky = stickyProps(column);
                    return (
                      <td
                        key={column.id}
                        style={sticky.style}
                        className={cn("h-[34px] bg-surface p-0", column.id === lastFrozenId && borderRight(column, index), sticky.className)}
                      >
                        {renderFooterCell(column)}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <MobileCards
          columns={visibleColumns}
          rows={loading ? [] : visibleRows}
          loading={loading}
          emptyText={emptyText}
          primaryColumn={primaryColumn}
          config={mobileCard}
          aggregateOf={aggregateOf}
          onAddRow={onAddRow ? requestAddRow : undefined}
          renderField={(column, row) => renderField(column, row, "card")}
        />
      </div>
    </div>
  );
}

/**
 * Carregando (`loading`): 5 linhas de `@adinkra/skeleton` com a MESMA
 * altura da linha real (42), pra tabela não pular quando os dados chegam.
 * Uma barra de 13 por coluna, largura variando um pouco por linha (tudo
 * igual parece grade vazia, não conteúdo chegando).
 */
function SkeletonRows({ columns }: { columns: DataTableColumn[] }) {
  const widths = ["w-[89px]", "w-[55px]", "w-[89px]", "w-[34px]", "w-[55px]"];
  return (
    <>
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          <td className="h-[42px] bg-card" />
          {columns.map((column, columnIndex) => (
            <td key={column.id} className="h-[42px] border-b border-b-hairline bg-card px-4 py-3 align-top">
              <Skeleton className={cn("h-[13px] max-w-full", widths[(rowIndex + columnIndex) % widths.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
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
 * Todo campo do cartão edita ali mesmo, com os mesmos editores da célula
 * (`EditableField`, surface "card" — pedido do usuário, 27/09). Tocar no
 * título edita o título; abrir a linha é só pelo botão "Abrir" (sempre
 * visível no cartão, com `onOpenRow`).
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
  const summary = value && summaryAggregate && summaryAggregate !== "none" ? computeAggregate(value, rows, summaryAggregate) : undefined;

  return (
    <div className="grid gap-4 @[610px]:hidden">
      {loading
        ? [0, 1, 2].map((index) => (
            <div key={index} aria-hidden="true" className="grid gap-3 rounded-card border-[length:var(--border-width)] border-hairline p-4">
              <Skeleton className="h-[13px] w-[144px]" />
              <Skeleton className="h-[13px] w-[89px]" />
            </div>
          ))
        : null}
      {!loading && rows.length === 0 && emptyText !== null ? <p className="py-5 text-center text-sm text-muted-foreground">{emptyText}</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="grid gap-3 rounded-card border-[length:var(--border-width)] border-ink bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            {title ? <div className="flex min-w-0 flex-1">{renderField(title, row)}</div> : null}
            {value ? <div className="flex max-w-[144px] flex-none justify-end">{renderField(value, row)}</div> : null}
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              {badges.map((column) => (
                <div key={column.id} className="min-w-0">
                  {renderField(column, row)}
                </div>
              ))}
            </div>
          ) : null}
          {meta.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
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
          className="flex h-[42px] items-center justify-center gap-3 rounded-card border-[length:var(--border-width)] border-dashed border-hairline text-sm text-muted-foreground hover:text-foreground"
        >
          <PlusIcon />
          Nova linha
        </button>
      ) : null}
      {value && summary !== undefined && summaryAggregate ? (
        <div className="flex items-baseline justify-between border-t border-hairline pt-3">
          <Caption>
            {aggregateShortLabel(summaryAggregate)} de {value.header}
          </Caption>
          <span className={cn("font-mono text-base", value.type === "formula" && summary < 0 ? "text-destructive" : "text-heading")}>
            {summaryAggregate === "count" ? String(summary) : isCurrencyColumn(value) || isNumericColumn(value) ? formatNumber(value, summary) : String(summary)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
