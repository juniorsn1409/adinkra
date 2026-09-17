"use client";

import * as RechartsPrimitive from "recharts";
import { cn } from "@adinkra/core";
import { DEFAULT_SERIES_COLORS, DEFAULT_SERIES_FOREGROUNDS } from "./chart";

export interface TreemapChartProps {
  /** Um item por bloco — value decide a área, name aparece dentro do bloco se couber. */
  data: { name: string; value: number }[];
  className?: string;
}

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
  depth?: number;
}

// Bloco desenhado à mão (não o content default do Recharts, que não segue
// o tema) — só cor, sem contorno: mesma regra da skill dataviz já aplicada
// no Sankey e no SegmentedBar (uma borda desenhada pra separar marcas soma
// tinta que não é dado; o respiro de 5px entre blocos já cumpre esse papel
// sozinho). Cor categórica ciclada pela posição do bloco (mesma paleta de
// 4 cores do resto do pacote), texto usa o PAR de contraste daquela cor
// específica (`DEFAULT_SERIES_FOREGROUNDS`) — nunca `--heading` fixo, que
// falha contraste em cima da mostarda claro-sobre-claro. Respiro de 5px
// entre blocos vizinhos via inset de 2.5px em cada lado (não é `gap` —
// Treemap não é flex/grid, cada retângulo já vem com sua posição absoluta
// do algoritmo do Recharts, então o espaço só existe encolhendo o próprio
// retângulo pra dentro da área que ele recebeu). Rótulo só aparece se o
// bloco for grande o bastante pros dois textos caberem sem cortar — mesma
// regra do SegmentedBar (nunca cortar rótulo no meio, só omitir).
const TREEMAP_GAP = 5;

// `content` é chamado pra CADA nó da árvore, incluindo a raiz implícita
// que o Recharts cria por baixo do array plano (depth 0, cobre 100% da
// área) — sem esse filtro, ela desenhava um retângulo gigante (cor do
// índice 0) atrás de todos os blocos de verdade, fazendo o conjunto
// inteiro parecer uma massa única em vez de blocos individuais (raiz
// visível nos vãos de 5px entre eles). Só os filhos de verdade (depth >= 1
// — um item de `data` cada) desenham algo.
function TreemapContent({ x = 0, y = 0, width = 0, height = 0, name, value, index = 0, depth = 0 }: TreemapContentProps) {
  if (depth === 0) return null;

  const inset = TREEMAP_GAP / 2;
  const fits = width - TREEMAP_GAP > 64 && height - TREEMAP_GAP > 36;
  const foreground = DEFAULT_SERIES_FOREGROUNDS[index % DEFAULT_SERIES_FOREGROUNDS.length];

  return (
    <g>
      <rect
        x={x + inset}
        y={y + inset}
        width={Math.max(width - TREEMAP_GAP, 0)}
        height={Math.max(height - TREEMAP_GAP, 0)}
        fill={DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length]}
        rx={4}
      />
      {fits && (
        <text x={x + inset + 8} y={y + inset + 20} fill={foreground} className="font-display text-xs font-medium">
          {name}
        </text>
      )}
      {fits && (
        <text x={x + inset + 8} y={y + inset + 38} fill={foreground} fillOpacity={0.75} className="font-mono text-xs">
          {value?.toLocaleString("pt-BR")}
        </text>
      )}
    </g>
  );
}

/**
 * Blocos proporcionais ao valor — pra comparar peso relativo de muitas
 * categorias de uma vez (não cabe bem numa pizza com muitas fatias
 * pequenas). Sem `<ChartContainer>`/tooltip/eixo, o Treemap é
 * autossuficiente (não compartilha eixo com outro tipo de gráfico). Fundo
 * do container explicitamente transparente — sem cor própria, deixa o que
 * estiver por trás (Card, página) aparecer entre os blocos.
 */
export function TreemapChart({ data, className }: TreemapChartProps) {
  return (
    <div className={cn("aspect-video w-full bg-transparent", className)}>
      <RechartsPrimitive.ResponsiveContainer>
        <RechartsPrimitive.Treemap data={data} dataKey="value" nameKey="name" content={<TreemapContent />} />
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}
