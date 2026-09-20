"use client";

import * as React from "react";
import { DatePicker, DateRangePicker, DateTimePicker, type DateRange } from "@adinkra/date-picker";
import { useLang } from "./language";

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
  const { t } = useLang();
  const [date, setDate] = React.useState<Date>();
  return <DatePicker label={t("demo.date.eventDate")} value={date} onChange={setDate} />;
}

export function DateRangePickerDemo() {
  const { t } = useLang();
  const [range, setRange] = React.useState<DateRange>();
  return <DateRangePicker label={t("demo.date.period")} value={range} onChange={setRange} />;
}

export function DateTimePickerDemo() {
  const { t } = useLang();
  const [date, setDate] = React.useState<Date>();
  return <DateTimePicker label={t("demo.date.scheduleFor")} value={date} onChange={setDate} />;
}
