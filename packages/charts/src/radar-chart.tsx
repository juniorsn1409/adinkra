"use client";

import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "./chart";

export interface RadarChartProps {
  /** Um item por eixo (categoria) — o resto das chaves vira uma série cada (uma por chave do config). */
  data: Record<string, unknown>[];
  config: ChartConfig;
  /** Chave de `data` usada nos rótulos ao redor do polígono (categorias). */
  angleKey: string;
  className?: string;
}

/**
 * Radar com a área de cada série preenchida (não só o contorno) — uma
 * `<Radar>` por chave do `config`, mesma convenção de "uma série = uma
 * chave" do resto do pacote. `PolarRadiusAxis` fica escondido (o valor
 * absoluto do raio importa menos que a FORMA relativa entre eixos, que é
 * o ponto de um radar).
 */
export function FilledRadarChart({ data, config, angleKey, className }: RadarChartProps) {
  const seriesKeys = Object.keys(config);
  return (
    <ChartContainer config={config} className={className}>
      <RechartsPrimitive.RadarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <RechartsPrimitive.PolarGrid stroke="var(--hairline)" />
        <RechartsPrimitive.PolarAngleAxis dataKey={angleKey} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        {seriesKeys.map((key) => (
          <RechartsPrimitive.Radar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            fillOpacity={0.4}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
          />
        ))}
        {seriesKeys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsPrimitive.RadarChart>
    </ChartContainer>
  );
}
