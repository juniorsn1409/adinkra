"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";

// 4 cores categóricas do próprio sistema (regra 8, DECISOES.md — mesmas do
// @adinkra/progress/SegmentedBar, reaproveitadas aqui de propósito: uma
// série de dado categórico deve ter a MESMA identidade visual em qualquer
// gráfico do sistema, não uma paleta nova por componente). Mais de 4 séries
// sem cor própria no `config` repetem a sequência a partir do início.
export const DEFAULT_SERIES_COLORS = ["var(--tag-coral)", "var(--tag-sky)", "var(--tag-mustard)", "var(--tag-navy)"];

// Par de contraste de cada cor acima, na mesma ordem — pra texto DENTRO de
// um bloco colorido (Treemap): coral/céu/marinho pedem texto branco,
// mostarda pede texto escuro, mesma tabela de contraste já validada em AA
// quando essas cores nasceram (regra 8, DECISOES.md). Nunca `--heading`
// fixo pros dois casos — perde contraste na metade das cores.
export const DEFAULT_SERIES_FOREGROUNDS = [
  "var(--tag-coral-foreground)",
  "var(--tag-sky-foreground)",
  "var(--tag-mustard-foreground)",
  "var(--tag-navy-foreground)",
];

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<"light" | "dark", string> })
>;

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart só funciona dentro de <ChartContainer>");
  return context;
}

/**
 * Wrapper de todo gráfico do sistema — Recharts por baixo (motor de
 * cálculo/eixos/tooltip é grande demais pra reconstruir do zero, mesmo
 * raciocínio do Base UI/react-day-picker em outros pacotes), tema Adinkra
 * por cima. `config` vira variáveis CSS `--color-<chave>` injetadas num
 * `<style>` escopado ao próprio container (`ChartStyle`, mesmo padrão do
 * shadcn/neobrutalism.dev, referência de onde este pacote parte) — quem
 * desenha uma série referencia `fill="var(--color-chave)"` em vez de um
 * hex cru, então trocar o tema/tom da série é só mexer no `config`, nunca
 * no SVG. Cor default (quando `config` não define `color`/`theme`) roda a
 * paleta categórica de 4 cores do sistema, ciclando por ordem de
 * declaração no `config`.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center font-display text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line]:stroke-hairline",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-dot]:stroke-transparent",
          "[&_.recharts-layer]:outline-hidden",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-hairline",
          "[&_.recharts-radial-bar-background-sector]:fill-surface",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-surface",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-hairline",
          "[&_.recharts-sector]:outline-hidden",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

// Declara `--color-<chave>` pra TODA chave do config, com ou sem
// `color`/`theme` explícito — bug corrigido (16/09/2026): antes só as
// chaves COM cor explícita ganhavam a variável CSS aqui, mas `<Bar>`/
// `<Radar>`/`<Line>`/`<Area>` sempre referenciam `var(--color-chave)`
// direto no `fill`/`stroke`, sem esse fallback nenhum. Uma série sem cor
// explícita (o caso comum — a maioria dos exemplos do próprio pacote não
// define `color`) ficava com a variável CSS indefinida, e o valor inicial
// de `fill`/`stroke` em SVG é PRETO — não a paleta categórica que
// `getSeriesColor()` já calculava certo em Pie/Tooltip/Legend. Essa
// função agora usa a MESMA fórmula de fallback que `getSeriesColor` (cor
// explícita → tema claro → paleta cíclica pela posição), só que pra
// TODA chave, garantindo que o `var()` sempre resolve pra algo real.
function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config);
  if (!entries.length) return null;

  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${entries
          .map(([key, cfg], index) => {
            const color = cfg.color ?? cfg.theme?.light ?? DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length];
            return `  --color-${key}: ${color};`;
          })
          .join("\n")}\n}`,
      }}
    />
  );
}

// Cor default (série sem `color`/`theme` no config) tem que existir mesmo
// sem entrar no `<style>` acima (que só cobre quem declarou algo) — por
// isso `getSeriesColor` cobre os dois casos: usa a paleta padrão ciclada
// pela posição da chave no config, ou o `--color-<chave>` se foi definido.
function getSeriesColor(config: ChartConfig, key: string): string {
  const cfg = config[key];
  if (cfg?.color) return cfg.color;
  if (cfg?.theme) return cfg.theme.light;
  const index = Object.keys(config).indexOf(key);
  return DEFAULT_SERIES_COLORS[Math.max(index, 0) % DEFAULT_SERIES_COLORS.length]!;
}

const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Mesmo "cartão único" flutuante do resto do sistema — borda+raio+sombra
 * dura (regra do sistema pra painel que aparece por cima de conteúdo).
 */
function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  className,
}: Partial<RechartsPrimitive.TooltipContentProps> & {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "dot" | "line" | "dashed";
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-36 gap-1.5 rounded-control border-[length:var(--border-width)] border-ink bg-surface px-2.5 py-1.5 text-xs shadow-brutal",
        className,
      )}
    >
      {!hideLabel && label != null && (
        <p className="font-medium text-heading">{labelFormatter ? labelFormatter(label, payload) : String(label)}</p>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index);
          const cfg = config[key];
          const color = item.color ?? getSeriesColor(config, key);
          return (
            <div key={key} className="flex w-full items-center gap-2">
              {!hideIndicator && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 border-[length:var(--border-width)] border-ink",
                    indicator === "dot" && "size-2.5 rounded-full",
                    indicator === "line" && "h-2.5 w-1",
                    indicator === "dashed" && "h-0 w-3 border-t-2 border-dashed bg-transparent",
                  )}
                  style={{ backgroundColor: indicator === "dashed" ? undefined : color, borderColor: color }}
                />
              )}
              <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                <span className="text-muted-foreground">{cfg?.label ?? item.name}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatter ? formatter(item.value, item.name, item, index, item.payload) : String(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  payload?: readonly { value?: string; dataKey?: string | number; color?: string }[];
}) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.value ?? index);
        const cfg = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            {!hideIcon &&
              (cfg?.icon ? (
                <cfg.icon />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[2px] border-[length:var(--border-width)] border-ink"
                  style={{ backgroundColor: item.color ?? getSeriesColor(config, key) }}
                />
              ))}
            <span className="text-muted-foreground">{cfg?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, useChart, getSeriesColor };
