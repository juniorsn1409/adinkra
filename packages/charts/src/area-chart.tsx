"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";

export interface AreaSparklineProps {
  data: Record<string, unknown>[];
  /** Chave de `data` com o valor da área. */
  dataKey: string;
  /** Cor do traço/preenchimento — aceita qualquer token ou hex. */
  color?: string;
  className?: string;
}

/**
 * Área sozinha, sem eixo/grade/tooltip, mesmo raciocínio do
 * `LineSparkline` (sinal de tendência pequeno, não gráfico de leitura
 * detalhada). Gradiente vertical (opaco embaixo do traço, transparente na
 * base) via `<linearGradient>` com `id` único (`React.useId()`) — sem
 * isso, duas sparklines na mesma página compartilhariam o MESMO id de
 * gradiente no DOM (SVG resolve `url(#id)` global, não escopado ao
 * componente) e uma pintaria por cima da outra.
 */
export function AreaSparkline({ data, dataKey, color = "var(--primary)", className }: AreaSparklineProps) {
  const gradientId = `area-sparkline-${React.useId().replace(/:/g, "")}`;

  return (
    <div className={cn("aspect-auto h-10 w-full", className)}>
      <RechartsPrimitive.ResponsiveContainer>
        <RechartsPrimitive.AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <RechartsPrimitive.Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </RechartsPrimitive.AreaChart>
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}
