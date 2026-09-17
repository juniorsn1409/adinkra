"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./chart";

export interface BarChartProps {
  /** Uma linha por categoria do eixo X — o resto das chaves vira uma barra cada (uma por chave do `config`). */
  data: Record<string, unknown>[];
  /** Uma entrada por série (chave = `dataKey` na `data`) — vira a cor (`var(--color-<chave>)`) e o rótulo da legenda/tooltip. */
  config: ChartConfig;
  /** Chave de `data` usada no eixo X (categorias). */
  xAxisKey: string;
  className?: string;
}

/**
 * Bar Chart simples — Recharts por baixo (`@adinkra/charts/chart`, tema
 * Adinkra em cima), uma barra por chave do `config` (não hardcoded — quem
 * usa decide quantas séries tem via `config`, igual o resto do sistema é
 * sempre controlado por props, nunca um exemplo fixo pra copiar e colar).
 */
export function SimpleBarChart({ data, config, xAxisKey, className }: BarChartProps) {
  const seriesKeys = Object.keys(config);
  return (
    <ChartContainer config={config} className={className}>
      <RechartsPrimitive.BarChart data={data}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        {seriesKeys.map((key) => (
          <RechartsPrimitive.Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
        ))}
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  );
}

/**
 * Bar Chart empilhado + legenda — mesma composição, `stackId` igual em
 * toda `<Bar>` (empilha em vez de agrupar lado a lado) + `<ChartLegend>`
 * embaixo (a skill de dataviz pede legenda sempre que houver 2+ séries —
 * aqui sempre tem, então nunca é opcional).
 */
export function StackedBarChartWithLegend({ data, config, xAxisKey, className }: BarChartProps) {
  const seriesKeys = Object.keys(config);
  return (
    <ChartContainer config={config} className={className}>
      <RechartsPrimitive.BarChart data={data}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        {seriesKeys.map((key, index) => (
          <RechartsPrimitive.Bar
            key={key}
            dataKey={key}
            stackId="stack"
            fill={`var(--color-${key})`}
            radius={index === seriesKeys.length - 1 ? [4, 4, 0, 0] : 0}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  );
}

export interface NegativeBarChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xAxisKey: string;
  /** Chave de `data` com o valor (pode ser positivo ou negativo) — só uma série. */
  dataKey: string;
  className?: string;
}

/**
 * Bar Chart com valores negativos — uma barra por linha, cor muda de
 * acordo com o sinal (mesma convenção já usada no `@adinkra/data-table`
 * pra número negativo: `--destructive`; positivo usa a cor da série no
 * `config`). `<ReferenceLine y={0}>` marca a linha de base — sem ela, uma
 * barra negativa "flutua" sem se saber onde é zero.
 */
export function NegativeBarChart({ data, config, xAxisKey, dataKey, className }: NegativeBarChartProps) {
  return (
    <ChartContainer config={config} className={className}>
      <RechartsPrimitive.BarChart data={data}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        <RechartsPrimitive.ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <RechartsPrimitive.Bar dataKey={dataKey} radius={4}>
          {data.map((entry, index) => (
            <RechartsPrimitive.Cell
              key={index}
              fill={Number(entry[dataKey]) < 0 ? "var(--destructive)" : `var(--color-${dataKey})`}
            />
          ))}
        </RechartsPrimitive.Bar>
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  );
}
