"use client";

import * as React from "react";
import { cn } from "@adinkra/core";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(value: string | undefined): { hours: number; minutes: number } | undefined {
  if (!value) return undefined;
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
  return { hours, minutes };
}

function TimeColumn({
  values,
  selected,
  onSelect,
  label,
  className,
}: {
  values: number[];
  selected: number | undefined;
  onSelect: (value: number) => void;
  label: string;
  className?: string;
}) {
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  // Rola o valor já escolhido pro meio da coluna quando o popover abre —
  // sem isso, escolher uma hora tarde (ex. 23h) sempre abriria no topo da
  // lista, longe do valor atual.
  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div role="listbox" aria-label={label} className={cn("flex max-h-56 w-14 flex-col overflow-y-auto", className)}>
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <button
            key={value}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(value)}
            className={cn(
              "shrink-0 px-3 py-1.5 text-center font-mono text-sm text-foreground transition-colors",
              "hover:bg-card",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              isSelected && "bg-secondary text-secondary-foreground hover:bg-secondary",
            )}
          >
            {pad(value)}
          </button>
        );
      })}
    </div>
  );
}

export interface TimePickerProps {
  /** Formato "HH:mm" (24h), mesmo formato do `<input type="time">` que este componente substitui. */
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  /** Sobrescreve a altura/rolagem de cada coluna (padrão `max-h-56`) — usado pelo DateTimePicker pra esticar junto da altura do Calendar quando fica ao lado dele. */
  columnClassName?: string;
}

/**
 * Duas colunas roláveis (hora/minuto) — substitui o `<input type="time">`
 * nativo que o DateTimePicker usava (pedido do usuário: um seletor
 * construído, não o campo nativo do navegador). Mesmo vocabulário "isto
 * está selecionado" do resto do sistema (`bg-secondary`, igual o dia
 * marcado no Calendar e o item ativo do Toggle/NavigationMenu — regra 6),
 * dividida por uma linha vertical (`divide-x`) no lugar da borda própria,
 * já que vive dentro de um `PopoverContent` que é o "cartão único".
 */
function TimePicker({ value, onChange, className, columnClassName }: TimePickerProps) {
  const parsed = parseTime(value);

  function set(hours: number, minutes: number) {
    onChange?.(`${pad(hours)}:${pad(minutes)}`);
  }

  return (
    <div className={cn("flex divide-x-[length:var(--border-width)] divide-ink", className)}>
      <TimeColumn
        values={HOURS}
        selected={parsed?.hours}
        onSelect={(hours) => set(hours, parsed?.minutes ?? 0)}
        label="Hora"
        className={columnClassName}
      />
      <TimeColumn
        values={MINUTES}
        selected={parsed?.minutes}
        onSelect={(minutes) => set(parsed?.hours ?? 0, minutes)}
        label="Minuto"
        className={columnClassName}
      />
    </div>
  );
}

export { TimePicker };
