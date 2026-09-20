"use client";

import * as React from "react";
import { SegmentedBar, type SegmentedBarSegment } from "@adinkra/progress";
import { useLang } from "./language";
import type { MessageKey } from "../i18n/pt";

// Precisa de estado (arrastar muda os valores) — por isso vive num
// componente à parte, não direto no MDX (que não tem hooks).
const names: MessageKey[] = [
  "demo.bar.fixed",
  "demo.bar.freedom",
  "demo.bar.comfort",
  "demo.bar.goals",
  "demo.bar.pleasures",
];

function makeSegments(t: (key: MessageKey) => string, values: number[]): SegmentedBarSegment[] {
  return names.map((key, index) => ({ name: t(key), value: values[index]! }));
}

// Só os nomes acompanham o idioma; os valores que a pessoa arrastou ficam.
function useTranslatedSegments(values: number[]) {
  const { lang, t } = useLang();
  const [segments, setSegments] = React.useState<SegmentedBarSegment[]>(() => makeSegments(t, values));
  React.useEffect(() => {
    setSegments((current) => current.map((segment, index) => ({ ...segment, name: t(names[index]!) })));
  }, [lang, t]);
  return [segments, setSegments] as const;
}

export function SegmentedBarDraggableDemo() {
  const [segments, setSegments] = useTranslatedSegments([30, 30, 10, 18, 10]);

  return <SegmentedBar segments={segments} onSegmentsChange={setSegments} className="w-full" />;
}

// Mesmos segmentos, mas o rótulo mostra o valor em R$ em vez de porcentagem
// — exemplo de referência do usuário (mockup "Mishmar", card "Metas de
// orçamento"): value já É o valor de verdade (não um peso abstrato),
// formatLabel só formata ele como moeda.
export function SegmentedBarCurrencyDemo() {
  const { lang } = useLang();
  const [segments, setSegments] = useTranslatedSegments([2550, 2550, 850, 1530, 850]);
  const currencyFormatter = React.useMemo(
    () =>
      lang === "en"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
        : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [lang],
  );

  return (
    <SegmentedBar
      segments={segments}
      onSegmentsChange={setSegments}
      formatLabel={(segment) => currencyFormatter.format(segment.value)}
      className="w-full"
    />
  );
}
