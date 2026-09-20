"use client";

import * as React from "react";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { Calendar } from "./calendar";
import { formatLongDate } from "./format";
import { Popover, PopoverContent, PopoverTrigger } from "@adinkra/popover";

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

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Rótulo acima do campo — mesmo padrão do `label` do @adinkra/input (sempre ligado por htmlFor/id, nunca placeholder-only). Sem ele, o componente é só o trigger (uso dentro de tabelas/formulários que já têm rótulo próprio, ex. @adinkra/data-table). */
  label?: string;
  /** Só importa junto de `label` — liga o `<label htmlFor>` ao trigger. Gerado sozinho (useId) quando omitido. */
  id?: string;
  className?: string;
}

/**
 * Composição de Popover + Calendar — trigger no formato de campo (mesmo
 * `outline` do @adinkra/button: borda+sombra dura), texto no formato "16 de
 * Setembro, 2026" (`formatLongDate`, pedido do usuário — mês por extenso com
 * inicial maiúscula, vírgula antes do ano). Fecha sozinho ao escolher uma
 * data (`mode="single"` não precisa de confirmação extra).
 */
export function DatePicker({ value, onChange, placeholder = "Escolher data", disabled, label, id, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;

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
              "w-auto min-w-60 justify-start gap-2 whitespace-nowrap font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="flex-none" />
        <span className="min-w-0 truncate">{value ? formatLongDate(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          autoFocus
        />
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
