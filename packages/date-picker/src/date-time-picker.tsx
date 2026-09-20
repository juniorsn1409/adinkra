"use client";

import * as React from "react";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { Calendar } from "./calendar";
import { formatLongDate, formatTime12h } from "./format";
import { Popover, PopoverContent, PopoverTrigger } from "@adinkra/popover";
import { TimePicker } from "./time-picker";

// Mesmo traço do resto do sistema — não lucide-react.
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function toTimeInputValue(date: Date | undefined): string {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Mesmo padrão do `label` do DatePicker — ver lá. */
  label?: string;
  id?: string;
  className?: string;
}

/**
 * Texto do trigger: hora primeiro, formato 12h com AM/PM (`formatTime12h`,
 * pedido do usuário — "a hora vem antes da data e coloca se é am ou pm"),
 * depois a data no mesmo formato do DatePicker (`formatLongDate`) — "2:45
 * PM, 16 de Setembro, 2026". A hora só muda de exibição aqui; internamente
 * (`selectTime`/`toTimeInputValue`, as colunas do `TimePicker`) continua
 * tudo em 24h.
 *
 * DatePicker + `TimePicker` lado a lado dentro do mesmo popover (pedido do
 * usuário — "coloca a escolha da hora no lado, em coluna"), com linha
 * divisória vertical (`border-l`) entre os dois — tinha sido removida
 * achando (errado) que era a causa de um bug de "linha estranha" que na
 * real era o `shadow-brutal` do Popover somado a um bug nos seletores do
 * `Calendar` (ver DECISOES.md); pedida de volta depois que a causa real foi
 * corrigida. Era um `<input type="time">` nativo — trocado por um seletor
 * construído (pedido anterior), no mesmo vocabulário visual do resto do
 * sistema.
 *
 * Escolher o dia NÃO fecha o popover (diferente do DatePicker de dia único)
 * — quem está marcando data+hora normalmente quer ajustar a hora em
 * seguida, então fechar cedo obrigaria reabrir. Fecha por `Esc`, clique fora
 * ou clicando de novo no trigger.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Escolher data e hora",
  disabled,
  label,
  id,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;

  function selectDate(date: Date | undefined) {
    if (!date) {
      onChange?.(undefined);
      return;
    }
    const next = new Date(date);
    if (value) next.setHours(value.getHours(), value.getMinutes());
    onChange?.(next);
  }

  function selectTime(time: string) {
    const [hoursText, minutesText] = time.split(":");
    if (!hoursText || !minutesText) return;
    const base = new Date(value ?? new Date());
    base.setHours(Number(hoursText), Number(minutesText), 0, 0);
    onChange?.(base);
  }

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
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <ClockIcon className="flex-none" />
        <span className="min-w-0 truncate">{value ? `${formatTime12h(value)}, ${formatLongDate(value)}` : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex gap-0 p-0">
        <Calendar mode="single" selected={value} onSelect={selectDate} autoFocus />
        <div className="flex flex-col border-l-[length:var(--border-width)] border-ink">
          <p className="border-b-[length:var(--border-width)] border-ink px-3 pt-2 pb-2 text-center font-display text-xs font-medium tracking-wide text-muted-foreground">
            Hora
          </p>
          {/* Altura fixa (não esticada pro tamanho do Calendar — flexbox não
              tem como fazer isso sem JS medindo o outro lado): perto da
              altura natural de 1 mês, e as colunas já rolam por dentro. */}
          <TimePicker value={toTimeInputValue(value)} onChange={selectTime} columnClassName="h-72 max-h-none" />
        </div>
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
