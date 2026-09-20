"use client";

import * as React from "react";
import { Badge } from "@adinkra/badge";
import { cn } from "@adinkra/core";
import { Calendar, Popover, PopoverContent, PopoverTrigger, formatLongDate } from "@adinkra/date-picker";
import type { DataTableColumn, DataTableProps, DataTableRow, SelectOption } from "./types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Guarda no row como "yyyy-mm-dd" (mesmo formato do <input type="date"> de
// antes) — só a célula troca de motor, o formato salvo continua o mesmo.
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Mesmo traço do resto do sistema — não lucide-react. Só na barra de edição
// em massa (a ação de excluir por linha/em massa tinha saído inteira antes
// — "remove a acao do datatable de remover" —, voltou só aqui a pedido do
// usuário — "adiciona um button de exclusao na barra de quando clica no
// select").
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3.5 4.5 4.1 13a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.6-8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Ícones da barra de edição em massa — um por tipo de coluna, mesmo traço
// (viewBox 16x16, strokeWidth 1.3) do resto do sistema. `#` de número é
// literalmente o glifo, não um SVG — é assim que o próprio Notion mostra
// coluna numérica, mais simples que desenhar.
function TextLinesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TagGlyphIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 2.5h5.2c.3 0 .6.1.8.3l4.7 4.7c.4.4.4 1 0 1.4l-4.9 4.9c-.4.4-1 .4-1.4 0L2.2 9.1a1 1 0 0 1-.3-.8V3.5c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="5.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function HashGlyph() {
  return (
    <span aria-hidden="true" className="flex size-3.5 items-center justify-center font-mono text-[11px] font-bold leading-none">
      #
    </span>
  );
}

function CalendarGlyphIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4.5" y1="1" x2="4.5" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11.5" y1="1" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ColumnTypeIcon({ type }: { type: DataTableColumn["type"] }) {
  if (type === "select") return <TagGlyphIcon className="size-3.5" />;
  if (type === "number") return <HashGlyph />;
  if (type === "date") return <CalendarGlyphIcon className="size-3.5" />;
  return <TextLinesIcon className="size-3.5" />;
}

// Indeterminate não dá pra setar via JSX (não existe prop React pra isso) —
// só via DOM, daí o ref-callback.
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
    <input
      type="checkbox"
      aria-label="Selecionar todas as linhas"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={(event) => onChange(event.currentTarget.checked)}
      className="size-4 rounded-control opacity-0 accent-[var(--secondary)] checked:opacity-100 indeterminate:opacity-100 group-hover/header:opacity-100 focus-visible:opacity-100"
    />
  );
}

interface CellId {
  rowId: string;
  columnId: string;
}

function sameCell(a: CellId | null, b: CellId): boolean {
  return !!a && a.rowId === b.rowId && a.columnId === b.columnId;
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
 */
function SelectCell({
  column,
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
}: {
  column: DataTableColumn;
  value: unknown;
  onChange: (next: string | string[]) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
}) {
  const options = column.options ?? [];
  const selected: string[] = column.multi ? (Array.isArray(value) ? (value as string[]) : []) : value ? [value as string] : [];

  function toggle(option: SelectOption) {
    if (column.multi) {
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
      <PopoverTrigger className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-control px-2 py-1 text-left hover:bg-card">
        {selectedOptions.length === 0
          ? null
          : selectedOptions.map((option) => (
              <Badge key={option.value} variant={option.color}>
                {option.label}
              </Badge>
            ))}
      </PopoverTrigger>
      <PopoverContent className="grid min-w-40 gap-1 p-1.5">
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
              <Badge variant={option.color}>{option.label}</Badge>
              {isSelected ? <span aria-hidden className="text-xs text-heading">✓</span> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function TextCell({
  value,
  onChange,
  onCancel,
}: {
  value: unknown;
  onChange: (next: string) => void;
  onCancel: () => void;
}) {
  return (
    <input
      type="text"
      ref={autoFocusAndSelect}
      defaultValue={typeof value === "string" ? value : ""}
      onBlur={(event) => onChange(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") onCancel();
      }}
      className="w-full rounded-control bg-transparent px-2 py-1 text-sm text-foreground outline-none focus-visible:bg-card"
    />
  );
}

function NumberCell({
  value,
  onChange,
  onCancel,
}: {
  value: unknown;
  onChange: (next: number) => void;
  onCancel: () => void;
}) {
  const numeric = typeof value === "number" ? value : 0;
  return (
    <input
      type="number"
      step="0.01"
      ref={autoFocusAndSelect}
      defaultValue={numeric}
      onBlur={(event) => onChange(Number(event.currentTarget.value) || 0)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") onCancel();
      }}
      className={cn(
        "w-full rounded-control bg-transparent px-2 py-1 text-right text-sm font-mono text-foreground outline-none focus-visible:bg-card",
        "[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
      )}
    />
  );
}

// Dogfooding do @adinkra/date-picker — mesmo `Popover`+`Calendar` da página
// própria dele, mas sem o `DatePicker` inteiro (botão com borda/sombra/ícone
// próprios): destoava demais das outras células (texto puro até clicar,
// igual `SelectCell`/`TextCell`). Reescrita pra ficar no mesmo padrão de
// gatilho-texto do `SelectCell` — mesmo `isEditing`/`onRequestEdit`/`onClose`
// controlado pela tabela (pedido do usuário — "deixamos so o texto, e ao
// clicar na data aparecer a popover pra escolher a data").
function DateCell({
  value,
  onChange,
  isEditing,
  onRequestEdit,
  onClose,
}: {
  value: unknown;
  onChange: (next: string) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onClose: () => void;
}) {
  const selected = typeof value === "string" && value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover open={isEditing} onOpenChange={(open) => (open ? onRequestEdit() : onClose())}>
      <PopoverTrigger className="flex min-h-8 w-full items-center rounded-control px-2 py-1 text-left hover:bg-card">
        {selected ? <span className="text-sm text-foreground">{formatLongDate(selected)}</span> : null}
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

// Botão de coluna dentro da barra de edição em massa (pedido do usuário —
// print de referência do Notion: "1 selecionados", um botão por coluna,
// lixeira no final). Cada botão abre o mesmo tipo de popover que a célula
// individual já usa (Calendar pra data, lista de opções pra select), só que
// aplicando o valor escolhido em TODAS as linhas selecionadas de uma vez em
// vez de uma célula só — não reaproveita `SelectCell`/`DateCell` porque
// essas já vêm presas ao ciclo de vida de UMA célula (`isEditing` por
// `CellId`), a barra não tem `CellId` nenhum, só a coluna.
function BulkEditButton({ column, onApply }: { column: DataTableColumn; onApply: (value: unknown) => void }) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const trigger = (
    <>
      <ColumnTypeIcon type={column.type} />
      {column.header}
    </>
  );
  const triggerClassName = "flex items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-1 text-sm hover:bg-card";

  if (column.type === "select") {
    return <BulkSelectButton column={column} open={open} setOpen={setOpen} onApply={onApply} trigger={trigger} triggerClassName={triggerClassName} />;
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

  function apply() {
    const raw = inputRef.current?.value ?? "";
    onApply(column.type === "number" ? Number(raw) || 0 : raw);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="flex items-center gap-1.5 p-1.5">
        <input
          ref={inputRef}
          type={column.type === "number" ? "number" : "text"}
          step={column.type === "number" ? "0.01" : undefined}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
          }}
          className="w-32 rounded-control border-[length:var(--border-width)] border-ink bg-transparent px-2 py-1 text-sm text-foreground outline-none [appearance:textfield] focus-visible:border-ring [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button type="button" onClick={apply} className="rounded-control border-[length:var(--border-width)] border-ink px-2.5 py-1 text-sm font-medium text-foreground hover:bg-card">
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
  const options = column.options ?? [];
  const [checked, setChecked] = React.useState<string[]>([]);

  function toggle(option: SelectOption) {
    if (column.multi) {
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
      <PopoverContent className="grid min-w-40 gap-1 p-1.5">
        {options.map((option) => {
          const isChecked = checked.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option)}
              className={cn("flex items-center justify-between gap-2 rounded-control px-2 py-1 text-left hover:bg-card", isChecked && "bg-card")}
            >
              <Badge variant={option.color}>{option.label}</Badge>
              {isChecked ? <span aria-hidden className="text-xs text-heading">✓</span> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function DragHandleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="3" r="1" />
      <circle cx="11" cy="3" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="13" r="1" />
      <circle cx="11" cy="13" r="1" />
    </svg>
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
  // ponteiro ao arrastar); o de dentro cuida da entrada (sobe 12px + fade,
  // 200ms) via `starting:`. A saída continua instantânea: a barra desmonta
  // quando a seleção zera.
  return (
    <div
      ref={barRef}
      className="fixed z-50"
      style={position ? { left: position.x, top: position.y } : { left: "50%", bottom: 24, transform: "translateX(-50%)" }}
    >
      <div className="flex items-center gap-1 rounded-control border-[length:var(--border-width)] border-ink bg-surface px-3 py-2 text-foreground shadow-brutal transition-[opacity,transform] duration-200 ease-[var(--ease-out)] starting:translate-y-3 starting:opacity-0">
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

const DEFAULT_COLUMN_WIDTH = 160;
const MIN_COLUMN_WIDTH = 72;

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
      className="absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none select-none hover:bg-secondary/40 active:bg-secondary/60"
    />
  );
}

function DisplayValue({ column, value }: { column: DataTableColumn; value: unknown }) {
  if (column.type === "number") {
    const numeric = typeof value === "number" ? value : 0;
    const formatted = column.currency ? currencyFormatter.format(numeric) : String(numeric);
    return <span className="font-mono text-sm text-foreground">{formatted}</span>;
  }
  return <span className="text-sm text-foreground">{typeof value === "string" ? value : null}</span>;
}

/**
 * Tabela de dados editável estilo Notion (pedido do usuário, 15/09/2026,
 * a partir de um print do próprio Notion) — 4 tipos de coluna na v1 (texto,
 * select colorido single/multi via @adinkra/badge, número/moeda, data) +
 * adicionar linha. Controlada (rows/onRowsChange) — quem usa decide onde
 * persistir, o componente não guarda estado de dados sozinho, só o estado
 * efêmero de qual célula está em edição.
 *
 * Sem ação de excluir linha (nem por linha nem em massa) — tinha as duas,
 * removidas a pedido do usuário (16/09/2026, "remove a acao do datatable de
 * remover"). `rows`/`onRowsChange` continuam controlados, então excluir
 * ainda é possível de fora do componente (quem usa filtra o array antes de
 * passar `rows`) — só não tem mais gatilho dentro da UI da tabela.
 *
 * Fora do escopo da v1 (perguntado ao usuário, resposta guardada em
 * DECISOES.md): adicionar/remover/renomear coluna, mudar tipo de coluna já
 * criada, ordenar, filtrar.
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
 * `@adinkra/table` (`columnLines`, também ligado por padrão lá) — `border-r`
 * fino (`--hairline`) em todo `<td>` via seletor descendente no próprio
 * `<table>`, removida na última célula de cada linha via
 * `[&_tr>:last-child]:border-r-0` (CSS puro, nenhuma célula precisa saber em
 * qual coluna está). Passou por versões com borda também no `<th>`
 * (cabeçalho) — o container (`rounded-control border-ink`) e o cabeçalho
 * (`border-b`/linhas de coluna próprias) tinham borda antes; pedido do
 * usuário pra tirar as duas e deixar só a borda das linhas do corpo
 * ("vamos remover as bordas da tabela e do header, as bordas das linhas
 * continua") — depois voltou só a linha embaixo do cabeçalho de novo
 * (pedido do usuário — "coloca uma borda na linha do bottom do header"),
 * corrigida em seguida pra fina (`--hairline`, era cheia — "a borda da
 * linha no bottom do header e fina") E excluindo a coluna do checkbox
 * ("nao deveria ter borda alguma na coluna do select") — mesma técnica do
 * `<td>` do corpo: a borda mora no `<th>` via seletor descendente
 * (`[&_thead_tr>th:not(:first-child)]`), não no `<tr>`, pra dar pra excluir
 * a primeira célula sem depender de resolução de conflito de borda.
 */
export function DataTable({ columns, rows, onRowsChange, columnLines = true, className }: DataTableProps) {
  const [editingCell, setEditingCell] = React.useState<CellId | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // Só guarda largura de coluna que alguém redimensionou de propósito — as
  // outras ficam sem `width` nenhum no `<col>`, e o `table-fixed` reparte o
  // espaço sobrando entre elas sozinho (crescem pra caber na tela até
  // alguém mexer; só aparece scroll quando a soma das larguras passa do
  // espaço disponível de verdade, pedido do usuário — "barra de scroll so
  // pode aparecer quano nao tiver espaco pra crecer na tela").
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  function setColumnWidth(columnId: string, width: number) {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
  }

  function updateCell(rowId: string, columnId: string, value: unknown) {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)));
  }

  function createEmptyRow(): DataTableRow {
    const row: DataTableRow = { id: crypto.randomUUID() };
    for (const column of columns) {
      row[column.id] = column.type === "select" ? (column.multi ? [] : "") : column.type === "number" ? 0 : "";
    }
    return row;
  }

  function addRow() {
    onRowsChange([...rows, createEmptyRow()]);
  }

  // Ícone "+" do print de referência (Notion) — insere logo ABAIXO da linha
  // de onde foi clicado, não sempre no fim da tabela (diferente do "Nova
  // linha" do rodapé).
  function insertRowAfter(rowId: string) {
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;
    const next = [...rows];
    next.splice(index + 1, 0, createEmptyRow());
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

  function toggleAllSelected(checked: boolean) {
    setSelectedIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
  }

  function bulkUpdateColumn(columnId: string, value: unknown) {
    onRowsChange(rows.map((row) => (selectedIds.has(row.id) ? { ...row, [columnId]: value } : row)));
  }

  function bulkDeleteSelected() {
    onRowsChange(rows.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());
  }

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = !allSelected && rows.some((row) => selectedIds.has(row.id));

  return (
    <div className={cn("overflow-x-auto", className)}>
      {selectedIds.size > 0 && (
        <DraggableBulkToolbar>
          <span className="mr-1 whitespace-nowrap font-display text-xs font-medium text-muted-foreground">
            {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="h-4 w-px bg-hairline" aria-hidden="true" />
          {columns.map((column) => (
            <BulkEditButton key={column.id} column={column} onApply={(value) => bulkUpdateColumn(column.id, value)} />
          ))}
          <button
            type="button"
            aria-label="Excluir linhas selecionadas"
            onClick={bulkDeleteSelected}
            className="ml-auto flex size-7 flex-none items-center justify-center rounded-control text-foreground transition-transform duration-100 ease-[var(--ease-out)] active:scale-95 hover:bg-card hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <TrashIcon className="size-4" />
          </button>
        </DraggableBulkToolbar>
      )}
      <table
        className={cn(
          "w-full table-fixed border-collapse text-left",
          // Linha embaixo de cada linha do corpo mora no `<td>`, não no
          // `<tr>` (era `border-b` direto no `<tr>`) — só assim dá pra
          // excluir a coluna do checkbox de propósito sem depender de como
          // o navegador resolve conflito de borda entre `tr`/`td` no
          // `border-collapse` (ambíguo, evitado). Pedido do usuário:
          // "remove a linha da coluna do select".
          "[&_tbody_tr>td:not(:first-child)]:border-b [&_tbody_tr>td:not(:first-child)]:border-hairline",
          "[&_thead_tr>th:not(:first-child)]:border-b [&_thead_tr>th:not(:first-child)]:border-hairline",
          // `:not(:first-child):not(:last-child)` direto no MESMO seletor
          // (em vez de aplicar border-r em tudo e tentar remover de novo só
          // no último via outra regra) — duas regras concorrentes pro mesmo
          // `border-right` empatam em especificidade de um jeito
          // contra-intuitivo (a regra "remover" perde), então a última
          // coluna ficava com borda mesmo devendo não ter. Uma seletor só
          // resolve sem depender de quem "ganha" no CSS.
          columnLines &&
            "[&_tr>td:not(:first-child):not(:last-child)]:border-r [&_tr>td:not(:first-child):not(:last-child)]:border-hairline",
        )}
      >
        {/* `table-fixed` + `<col>` é o que faz redimensionar UMA coluna não
            empurrar as outras — sem isso, `<th>`/`<td>` de colunas diferentes
            não têm como ter larguras independentes na mesma tabela. `<col>`
            sem `width` (coluna nunca redimensionada) deixa o `table-fixed`
            repartir o espaço sobrando sozinho — só vira largura fixa em px
            depois que alguém arrasta a alça. */}
        <colgroup>
          <col className="w-16" />
          {columns.map((column) => (
            <col key={column.id} style={columnWidths[column.id] !== undefined ? { width: columnWidths[column.id] } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="group/header bg-card">
            <th className="bg-background px-2 py-2 text-right">
              <HeaderCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAllSelected} />
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                className="relative px-2 py-2 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                <span className="block truncate">{column.header}</span>
                <ColumnResizeHandle onResize={(width) => setColumnWidth(column.id, width)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              draggable={false}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                reorderRow(row.id);
                setDraggingRowId(null);
              }}
              className={cn(
                "group/row hover:bg-secondary/10",
                rowIndex % 2 === 1 && "bg-card/40",
                draggingRowId === row.id && "opacity-50",
              )}
            >
              <td className="bg-background px-2 py-0.5 group-hover/row:bg-transparent">
                {/*
                  "+" (insere linha abaixo) e alça de arrastar (reordenar),
                  igual o print de referência do Notion — ambos só aparecem
                  no hover da linha, mesmo tratamento do checkbox.
                */}
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    aria-label="Inserir linha abaixo"
                    onClick={() => insertRowAfter(row.id)}
                    className="flex size-5 flex-none items-center justify-center rounded-control text-muted-foreground opacity-0 transition-transform duration-100 ease-[var(--ease-out)] active:scale-95 hover:bg-card hover:text-foreground group-hover/row:opacity-100 focus-visible:opacity-100"
                  >
                    <PlusIcon className="size-3" />
                  </button>
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
                  <input
                    type="checkbox"
                    aria-label="Selecionar linha"
                    checked={selectedIds.has(row.id)}
                    onChange={(event) => toggleRowSelected(row.id, event.currentTarget.checked)}
                    className="size-4 flex-none rounded-control opacity-0 accent-[var(--secondary)] checked:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100"
                  />
                </div>
              </td>
              {columns.map((column) => {
                const cellId: CellId = { rowId: row.id, columnId: column.id };
                const editing = sameCell(editingCell, cellId);
                const value = row[column.id];

                return (
                  <td key={column.id} className="p-0.5 align-top">
                    {column.type === "select" ? (
                      <SelectCell
                        column={column}
                        value={value}
                        isEditing={editing}
                        onRequestEdit={() => setEditingCell(cellId)}
                        onClose={() => setEditingCell(null)}
                        onChange={(next) => updateCell(row.id, column.id, next)}
                      />
                    ) : column.type === "date" ? (
                      <DateCell
                        value={value}
                        isEditing={editing}
                        onRequestEdit={() => setEditingCell(cellId)}
                        onClose={() => setEditingCell(null)}
                        onChange={(next) => updateCell(row.id, column.id, next)}
                      />
                    ) : editing ? (
                      column.type === "number" ? (
                        <NumberCell
                          value={value}
                          onChange={(next) => {
                            updateCell(row.id, column.id, next);
                            setEditingCell(null);
                          }}
                          onCancel={() => setEditingCell(null)}
                        />
                      ) : (
                        <TextCell
                          value={value}
                          onChange={(next) => {
                            updateCell(row.id, column.id, next);
                            setEditingCell(null);
                          }}
                          onCancel={() => setEditingCell(null)}
                        />
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingCell(cellId)}
                        className={cn(
                          "flex min-h-8 w-full items-center rounded-control px-2 py-1 hover:bg-card",
                          column.type === "number" && "justify-end",
                        )}
                      >
                        <DisplayValue column={column} value={value} />
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* `pl-[4.5rem]` alinha o "+"/texto com a primeira coluna de dados —
          64px do gutter do checkbox (`col w-16`) + 8px do `px-2` que toda
          célula de coluna usa, pedido do usuário ("move a nova linha pra
          fica alinhado com a coluna adiante"). */}
      <button
        type="button"
        onClick={addRow}
        className="flex w-full items-center gap-2 py-2 pr-3 pl-[4.5rem] text-sm text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <PlusIcon />
        Nova linha
      </button>
    </div>
  );
}
