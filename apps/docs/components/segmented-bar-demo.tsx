"use client";

import * as React from "react";
import { SegmentedBar, type SegmentedBarSegment } from "@adinkra/progress";

// Precisa de estado (arrastar muda os valores) — por isso vive num
// componente à parte, não direto no MDX (que não tem hooks).
export function SegmentedBarDraggableDemo() {
  const [segments, setSegments] = React.useState<SegmentedBarSegment[]>([
    { name: "Custos fixos", value: 30 },
    { name: "Liberdade financeira", value: 30 },
    { name: "Conforto", value: 10 },
    { name: "Metas", value: 18 },
    { name: "Prazeres", value: 10 },
  ]);

  return <SegmentedBar segments={segments} onSegmentsChange={setSegments} className="w-full" />;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Mesmos segmentos, mas o rótulo mostra o valor em R$ em vez de porcentagem
// — exemplo de referência do usuário (mockup "Mishmar", card "Metas de
// orçamento"): value já É o valor de verdade (não um peso abstrato),
// formatLabel só formata ele como moeda.
export function SegmentedBarCurrencyDemo() {
  const [segments, setSegments] = React.useState<SegmentedBarSegment[]>([
    { name: "Custos fixos", value: 2550 },
    { name: "Liberdade financeira", value: 2550 },
    { name: "Conforto", value: 850 },
    { name: "Metas", value: 1530 },
    { name: "Prazeres", value: 850 },
  ]);

  return (
    <SegmentedBar
      segments={segments}
      onSegmentsChange={setSegments}
      formatLabel={(segment) => currencyFormatter.format(segment.value)}
      className="w-full"
    />
  );
}
