"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";
import { ChartContainer, ChartTooltip, ChartTooltipContent, getSeriesColor, type ChartConfig } from "./chart";

export interface PieChartProps {
  /** Um item por fatia — value é o peso, dataKey/nameKey dizem quais chaves usar dentro dele. */
  data: Record<string, unknown>[];
  /** Uma entrada por fatia (chave = valor de `nameKey` em cada item) — cor e rótulo. */
  config: ChartConfig;
  /** Chave de `data` com o valor numérico de cada fatia. */
  dataKey: string;
  /** Chave de `data` com o nome da fatia (bate com as chaves do `config`). */
  nameKey: string;
  className?: string;
}

/**
 * Donut com o total escrito no centro — `innerRadius` abre o buraco,
 * `<Label position="center">` desenha texto direto no meio do SVG (não dá
 * pra centralizar texto normal num anel só com CSS, já que o centro do
 * anel não é um elemento de verdade). Soma calculada de `data`, não
 * hardcoded, pra continuar certa se os valores mudarem.
 */
export function DonutChartWithText({ data, config, dataKey, nameKey, className }: PieChartProps) {
  const total = React.useMemo(() => data.reduce((sum, item) => sum + Number(item[dataKey] ?? 0), 0), [data, dataKey]);

  return (
    <ChartContainer config={config} className={cn("aspect-square", className)}>
      <RechartsPrimitive.PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <RechartsPrimitive.Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius="60%" outerRadius="90%" strokeWidth={3} stroke="var(--surface)">
          {data.map((item, index) => (
            <RechartsPrimitive.Cell key={index} fill={getSeriesColor(config, String(item[nameKey]))} />
          ))}
          <RechartsPrimitive.Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || viewBox.cx == null || viewBox.cy == null) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-heading font-display text-2xl font-medium">
                    {total.toLocaleString("pt-BR")}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                    Total
                  </tspan>
                </text>
              );
            }}
          />
        </RechartsPrimitive.Pie>
      </RechartsPrimitive.PieChart>
    </ChartContainer>
  );
}

/**
 * Pizza com rótulo (nome + porcentagem) do lado de fora de cada fatia,
 * ligado por uma linha fina (`labelLine`, comportamento padrão do
 * Recharts) — sem legenda separada, o rótulo já carrega a identidade.
 */
export function PieChartWithCustomLabel({ data, config, dataKey, nameKey, className }: PieChartProps) {
  const total = React.useMemo(() => data.reduce((sum, item) => sum + Number(item[dataKey] ?? 0), 0), [data, dataKey]);

  return (
    <ChartContainer config={config} className={cn("aspect-square", className)}>
      <RechartsPrimitive.PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <RechartsPrimitive.Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          outerRadius="70%"
          strokeWidth={3}
          stroke="var(--surface)"
          label={({ name, value }) => {
            const share = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
            const label = config[String(name)]?.label ?? name;
            return `${label} (${share}%)`;
          }}
          labelLine
        >
          {data.map((item, index) => (
            <RechartsPrimitive.Cell key={index} fill={getSeriesColor(config, String(item[nameKey]))} />
          ))}
        </RechartsPrimitive.Pie>
      </RechartsPrimitive.PieChart>
    </ChartContainer>
  );
}
