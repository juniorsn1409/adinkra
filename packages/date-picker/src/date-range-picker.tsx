"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { Calendar } from "./calendar";
import { formatLongDate } from "./format";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Mesmo traço do resto do sistema — não lucide-react.
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" {...props}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4.5" y1="1" x2="4.5" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11.5" y1="1" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Mesmo padrão do `label` do DatePicker — ver lá. */
  label?: string;
  id?: string;
  className?: string;
}

function formatRange(range: DateRange | undefined): string | null {
  if (!range?.from) return null;
  if (!range.to) return formatLongDate(range.from);
  return `${formatLongDate(range.from)} – ${formatLongDate(range.to)}`;
}

/**
 * Texto do trigger no mesmo formato do DatePicker (`formatLongDate`, "16 de
 * Setembro, 2026") pros dois extremos do intervalo — "16 de Setembro, 2026 –
 * 20 de Outubro, 2026".
 *
 * Mesma composição do DatePicker (Popover + Calendar), só que `mode="range"`
 * em vez de `"single"` e `numberOfMonths={2}` — dois meses lado a lado é o
 * que faz um intervalo dar pra escolher sem ficar trocando de mês o tempo
 * todo (mesmo raciocínio do date-picker do neobrutalism.dev). Não fecha
 * sozinho ao escolher (diferente do DatePicker de dia único): selecionar só
 * o "from" ainda não é um intervalo completo, então o popover fica aberto
 * até `Esc`/clique fora/clicar de novo no trigger.
 */
export function DateRangePicker({ value, onChange, placeholder = "Escolher período", disabled, label, id, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  const text = formatRange(value);

  const trigger = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={triggerId}
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-auto min-w-72 justify-start gap-2 whitespace-nowrap font-normal",
              !text && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="flex-none" />
        <span className="min-w-0 truncate">{text ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} autoFocus />
      </PopoverContent>
    </Popover>
  );

  if (!label) return trigger;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={triggerId} className="font-display text-sm font-medium text-heading">
        {label}
      </label>
      {trigger}
    </div>
  );
}
