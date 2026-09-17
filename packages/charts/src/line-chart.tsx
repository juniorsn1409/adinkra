"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";

export interface SparklineProps {
  data: Record<string, unknown>[];
  /** Chave de `data` com o valor da linha. */
  dataKey: string;
  /** Cor da linha — aceita qualquer token (`var(--tag-sky)`) ou hex. */
  color?: string;
  className?: string;
}

/**
 * Linha sozinha, sem eixo/grade/tooltip — pensada pra caber pequena (um
 * KPI num Card, uma célula de tabela), não é um `<ChartContainer>` cheio
 * de propósito: sparkline é sinal de tendência, não um gráfico de leitura
 * detalhada. `aspect-auto` sobrescreve o `aspect-video` que todo outro
 * gráfico do pacote usa por padrão — sparkline é tipicamente bem baixo e
 * largo, não 16:9.
 */
export function LineSparkline({ data, dataKey, color = "var(--primary)", className }: SparklineProps) {
  return (
    <div className={cn("aspect-auto h-10 w-full", className)}>
      <RechartsPrimitive.ResponsiveContainer>
        <RechartsPrimitive.LineChart data={data}>
          <RechartsPrimitive.Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </RechartsPrimitive.LineChart>
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}

/**
 * Tendência de alta — mesma sparkline, cor fixa em `--primary` (céu, a
 * cor de ação do sistema) por convenção: o sistema não tem um token verde
 * (decisão revertida antes, ver DECISOES.md/data-table), então "alta" não
 * é verde aqui, é a cor primária mesmo.
 */
export function UpwardTrendLineChart({ data, dataKey, className }: Omit<SparklineProps, "color">) {
  return <LineSparkline data={data} dataKey={dataKey} color="var(--primary)" className={className} />;
}

/**
 * Tendência de baixa — `--destructive` (tomate), mesma convenção de
 * "negativo/queda = destructive" já usada no `@adinkra/data-table`.
 */
export function DownwardTrendLineChart({ data, dataKey, className }: Omit<SparklineProps, "color">) {
  return <LineSparkline data={data} dataKey={dataKey} color="var(--destructive)" className={className} />;
}

/**
 * Linha completa (com eixo/tooltip) que termina num ponto maior e
 * destacado no último valor — chama atenção pro dado mais recente, útil
 * quando a série é "até agora" (ex.: métrica em tempo real). O ponto
 * final é um `<RechartsPrimitive.Dot>` desenhado à parte via `dot`
 * customizado que só pinta o último índice; os demais pontos ficam sem
 * marcador, pra não competir visualmente com o destaque.
 */
export function LineChartWithEndDot({ data, dataKey, xAxisKey, color = "var(--primary)", className }: SparklineProps & { xAxisKey: string }) {
  const lastIndex = data.length - 1;

  return (
    <div className={cn("aspect-video flex justify-center font-display text-xs", className)}>
      <RechartsPrimitive.ResponsiveContainer>
        <RechartsPrimitive.LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <RechartsPrimitive.CartesianGrid vertical={false} stroke="var(--hairline)" />
          <RechartsPrimitive.XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <RechartsPrimitive.Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "var(--border-width) solid var(--ink)",
              borderRadius: "var(--radius-control)",
              boxShadow: "var(--shadow-brutal)",
            }}
          />
          <RechartsPrimitive.Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={(props) => {
              const { key, index, cx, cy } = props;
              if (index !== lastIndex) return <React.Fragment key={key} />;
              return <RechartsPrimitive.Dot key={key} cx={cx} cy={cy} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />;
            }}
          />
        </RechartsPrimitive.LineChart>
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}
