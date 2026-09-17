"use client";

import * as React from "react";
import { DatePicker, DateRangePicker, DateTimePicker, type DateRange } from "@adinkra/date-picker";

// DatePicker é controlado (value/onChange) — sem estado próprio de data,
// mesmo espírito do @adinkra/data-table. Este wrapper só existe pro preview
// do MDX ter onde guardar o valor escolhido.
export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>();
  return <DatePicker value={date} onChange={setDate} />;
}

// "Basic" (referência neobrutalism.dev) — o mesmo DatePicker, só com `label`
// (par de rótulo+campo, igual o Input já faz), não um componente à parte.
export function DatePickerBasicDemo() {
  const [date, setDate] = React.useState<Date>();
  return <DatePicker label="Data do evento" value={date} onChange={setDate} />;
}

export function DateRangePickerDemo() {
  const [range, setRange] = React.useState<DateRange>();
  return <DateRangePicker label="Período" value={range} onChange={setRange} />;
}

export function DateTimePickerDemo() {
  const [date, setDate] = React.useState<Date>();
  return <DateTimePicker label="Agendar para" value={date} onChange={setDate} />;
}
