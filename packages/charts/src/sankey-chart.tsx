"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";
import { DEFAULT_SERIES_COLORS } from "./chart";

export interface SankeyChartProps {
  data: {
    nodes: { name: string }[];
    links: { source: number; target: number; value: number }[];
  };
  className?: string;
}

interface SankeyNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name: string };
}

// Nó: bloco só de cor, sem contorno — mesma regra da skill dataviz já
// aplicada no Treemap e no SegmentedBar (uma borda desenhada pra separar
// marcas soma tinta que não é dado; o próprio `nodePadding` já separa um
// nó do outro visualmente). Rótulo do lado de fora, à direita.
function SankeyNode({ x = 0, y = 0, width = 0, height = 0, index = 0, payload }: SankeyNodeProps) {
  const color = DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length];
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />
      <text
        x={x + width + 6}
        y={y + height / 2}
        dy={4}
        className="fill-heading font-display text-xs"
        textAnchor="start"
      >
        {payload?.name}
      </text>
    </g>
  );
}

interface SankeyLinkProps {
  sourceX?: number;
  sourceY?: number;
  sourceControlX?: number;
  targetX?: number;
  targetY?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: { source?: { name?: string } };
  // Passado por FORA do Recharts (não é clonado por ele) — mapa nome do nó
  // de origem → cor, construído uma vez em `SankeyChart` a partir da mesma
  // ordem/paleta usada em `SankeyNode`.
  colorByNodeName?: Map<string, string>;
}

// Ligação pintada com a cor de ONDE ELA SAI (nó de origem), constante do
// início ao fim — não um degradê pro nó de destino. `payload.source.name`
// é o único jeito estável de saber qual nó de origem é esse link depois
// que o Recharts já resolveu os índices numéricos em objetos de nó de
// verdade (o `source`/`target` originais em `data.links` somem nesse
// ponto, viram os nós inteiros). Mesmo traçado de curva do link padrão do
// Recharts (`renderLinkItem` interno), só trocando a cor/opacidade fixas
// por uma cor por origem.
function SankeyLink({
  sourceX = 0,
  sourceY = 0,
  sourceControlX = 0,
  targetX = 0,
  targetY = 0,
  targetControlX = 0,
  linkWidth = 0,
  payload,
  colorByNodeName,
}: SankeyLinkProps) {
  const color = colorByNodeName?.get(payload?.source?.name ?? "") ?? "var(--border)";
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={0.35}
    />
  );
}

/**
 * Fluxo entre etapas (origem → destino, espessura = valor) — Recharts por
 * baixo (`Sankey`), nó customizado (`SankeyNode`) só de cor. Ligação
 * (`SankeyLink`) herda a cor do nó de ONDE SAI e mantém ela constante até
 * o destino — não um cinza neutro nem um degradê — pra dar pra seguir o
 * fluxo de uma origem específica visualmente, mesmo quando duas ligações
 * se cruzam.
 */
export function SankeyChart({ data, className }: SankeyChartProps) {
  const colorByNodeName = React.useMemo(
    () => new Map(data.nodes.map((node, index) => [node.name, DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length]!])),
    [data.nodes],
  );

  return (
    <div className={cn("aspect-video w-full font-display text-xs", className)}>
      <RechartsPrimitive.ResponsiveContainer>
        <RechartsPrimitive.Sankey
          data={data}
          node={<SankeyNode />}
          link={<SankeyLink colorByNodeName={colorByNodeName} />}
          nodePadding={24}
          margin={{ top: 8, right: 96, bottom: 8, left: 8 }}
        >
          <RechartsPrimitive.Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "var(--border-width) solid var(--ink)",
              borderRadius: "var(--radius-control)",
              boxShadow: "var(--shadow-brutal)",
            }}
          />
        </RechartsPrimitive.Sankey>
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}
