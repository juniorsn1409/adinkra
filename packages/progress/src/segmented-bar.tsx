"use client";

import * as React from "react";
import { cn } from "@adinkra/core";

export interface SegmentedBarSegment {
  /**
   * Identidade do segmento (ex.: "Custos fixos") — só entra no `aria-label`
   * do conjunto, nunca aparece sozinha dentro do segmento. O texto visível
   * vem de `formatLabel`, sempre recalculado a partir de `value` (pedido do
   * usuário: "ao tentar redimensionar a segment bar eles vao ser
   * atualizados" — um rótulo estático travaria no valor de quando a barra
   * foi criada, não no valor depois de arrastar).
   */
  name: string;
  /** Peso/valor do segmento — proporção relativa ao total dos outros (usa `flex-grow`, não precisa somar 100) ou um valor de verdade (R$, unidades) se `formatLabel` souber formatar isso. */
  value: number;
}

export interface SegmentedBarProps {
  segments: SegmentedBarSegment[];
  /**
   * Formata o texto mostrado DENTRO do segmento — chamado de novo a cada
   * render com o `value` atual (inclusive durante o arrasto), nunca um
   * texto congelado. Padrão: porcentagem do total, arredondada
   * (`Math.round(share * 100) + "%"`). Passe a própria pra mostrar o valor
   * de verdade (ex.: `(segment) => currencyFormatter.format(segment.value)`).
   */
  formatLabel?: (segment: SegmentedBarSegment, share: number, total: number) => string;
  /**
   * Fração mínima (0-1) do total pra um segmento mostrar o rótulo. Padrão
   * `0` — o número sempre aparece, mesmo num segmento de 1% (pedido do
   * usuário: "o numero sempre vai aparecer mesmo que seja 1%"); `truncate`
   * cuida do texto não caber num segmento estreito demais (nunca corta
   * letra, só esconde o que não cabe). Suba esse valor se quiser voltar a
   * esconder rótulo de segmento pequeno.
   */
  minLabelShare?: number;
  /**
   * Presente = a barra fica arrastável (pedido do usuário — "eu poderia
   * redimensionar os valores"): arrastar o puxador entre dois segmentos
   * tira valor de um e dá pro outro, o total não muda ("soma sempre
   * travada em 100%", igual a referência), e o rótulo de cada lado (via
   * `formatLabel`) atualiza em tempo real. Ausente = só leitura, sem
   * puxador nenhum.
   */
  onSegmentsChange?: (segments: SegmentedBarSegment[]) => void;
  /**
   * Fração mínima (0-1) do TOTAL que um segmento pode ter ao arrastar —
   * dentro desse piso, o arrasto vai até o fim de cada lado. Recalculada a
   * cada arrasto a partir do total atual (não um número fixo). Padrão `0`
   * — o valor pode chegar a zero de verdade (pedido do usuário: "eu quero
   * diminuir a porcentagem do valor até o 0%"); `minVisibleShare` cuida da
   * parte visual disso, separado do valor em si.
   */
  minSegmentShare?: number;
  /**
   * Largura mínima de cada segmento, como fração (0-1) do total — separado
   * do VALOR em si de propósito (pedido do usuário: "separar valor lógico
   * do tamanho visual... o valor pode chegar em 0, mas o visual nunca
   * abaixo de um mínimo"). O espaço que sobra depois de reservar esse piso
   * pra todo mundo é repartido proporcionalmente ao share de cada um — a
   * soma dos tamanhos visuais sempre fecha em exatamente 100%, nunca
   * estoura nem faz outro segmento desaparecer quando um chega perto de
   * 100% de share (bug reportado pelo usuário numa versão anterior que
   * deixava a soma passar de 100%). Padrão 0.05 (5%).
   */
  minVisibleShare?: number;
  className?: string;
}

function defaultFormatLabel(_segment: SegmentedBarSegment, share: number): string {
  return `${Math.round(share * 100)}%`;
}

// Paleta do próprio sistema (pedido do usuário — "troque as paletas de
// cores pra a que nos temos"), não mais a fórmula OKLCH emprestada da
// referência: as cores de "etiqueta" (regra 8, DECISOES.md) — fixas nos
// dois temas, pensadas exatamente pra "categorização, não ação", o mesmo
// papel que os segmentos daqui cumprem. Cada uma já vem com o par de
// contraste certo (`--tag-*-foreground`, checado em AA na hora que essas
// cores foram criadas) — diferente da fórmula OKLCH anterior, aqui o texto
// não é sempre branco (`--tag-mustard-foreground` é tinta escura). Eram só
// 3 — repetiam cedo demais numa barra de 5 segmentos (pedido do usuário —
// "tem que ser cores diferentes"); `--tag-navy` (4ª) entrou no
// `@adinkra/tokens` só por causa disso (ver tokens.css). Mais de 4
// segmentos repetem a sequência a partir do início.
const SEGMENT_COLORS = [
  { bg: "var(--tag-coral)", fg: "var(--tag-coral-foreground)" },
  { bg: "var(--tag-sky)", fg: "var(--tag-sky-foreground)" },
  { bg: "var(--tag-mustard)", fg: "var(--tag-mustard-foreground)" },
  { bg: "var(--tag-navy)", fg: "var(--tag-navy-foreground)" },
];

function segmentColor(index: number): { bg: string; fg: string } {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]!;
}

// Largura do alvo de toque do puxador (a pilulazinha visível é só 2px, mas
// o alvo clicável/arrastável é bem maior que isso, senão ninguém acerta o
// dedo/cursor nela — mesmo raciocínio de "alvo maior que a marca" do skill
// de dataviz).
const HANDLE_HIT_WIDTH = 14;

/**
 * Barra de progresso segmentada — várias proporções lado a lado, cada uma
 * com um rótulo dentro (pedido do usuário, a partir do mockup "Mishmar",
 * card "Metas de orçamento" — "divisores arrastáveis · soma sempre travada
 * em 100%"). Não é a barra de progresso "0 a 100%" clássica — é uma quebra
 * de um total em partes categóricas (ex.: distribuição de orçamento por
 * meta, uso de armazenamento por tipo).
 *
 * Tamanho de cada segmento é `flex: 0 0 X%`, largura FIXA (não
 * `flex-grow`), com `X` reservando um piso pra cada segmento
 * (`minVisibleShare`, separado do VALOR em si — `minSegmentShare` —
 * pedido do usuário: "separar valor lógico do tamanho visual... o valor
 * pode chegar em 0, mas o visual nunca abaixo de um mínimo") e repartindo
 * o espaço QUE SOBRA proporcionalmente ao share de cada um:
 * `X = minVisibleShare + share * (1 - minVisibleShare * N)`. A soma de
 * todo mundo sempre fecha em exatamente 100% (nunca estoura, nunca some) —
 * uma primeira versão deixava a soma passar de 100% de propósito
 * (`Math.max(share, minVisibleShare)` puro) e cortava o excesso com
 * `overflow-hidden`, mas isso escondia por completo o outro lado quando um
 * segmento chegava perto de 100% de share (bug reportado pelo usuário:
 * "quando tento colocar uma meta em 100% a outra some nao fica dentro do
 * limite do width") — reparte em vez de estourar resolve isso.
 *
 * Puxador de arrastar (pedido do usuário, com print de referência do
 * mockup, inspecionado via DOM/`getComputedStyle` — não só o olho): os
 * segmentos se tocam direto (sem gap nenhum), e o puxador é uma faixa
 * `position: absolute` de 14px (só o alvo de clique, invisível) centrada
 * exatamente na fronteira entre dois segmentos (`left: calc(X% - 7px)`,
 * X = soma acumulada dos tamanhos VISUAIS até aquele ponto, não da
 * participação bruta — assim ele bate com a fronteira renderizada de
 * verdade mesmo quando o piso visual distorce algum segmento) — dentro dela, uma
 * pilulazinha de 2×18px (`bg-background`, cantos de 1px, anel de 1px em
 * `--ink` a 25% pra ter contraste em cima de qualquer cor de segmento) é
 * a parte visível de verdade. Arrastar usa `setPointerCapture` no próprio
 * puxador (mesma técnica do `@adinkra/data-table` — `ColumnResizeHandle`/
 * `DraggableBulkToolbar` —, sem listener de `window`) e só redistribui
 * valor ENTRE os dois segmentos vizinhos daquela fronteira — os outros e o
 * total geral não mudam. O texto de cada lado (`formatLabel`) é recalculado
 * a cada render a partir do `value` atual, nunca um rótulo congelado.
 */
export function SegmentedBar({
  segments,
  formatLabel = defaultFormatLabel,
  minLabelShare = 0,
  onSegmentsChange,
  minSegmentShare = 0,
  minVisibleShare = 0.05,
  className,
}: SegmentedBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const barRef = React.useRef<HTMLDivElement>(null);
  const dragState = React.useRef<{
    pointerId: number;
    startX: number;
    index: number;
    startLeft: number;
    startRight: number;
    barWidth: number;
  } | null>(null);

  function onHandlePointerDown(index: number) {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      const barWidth = barRef.current?.getBoundingClientRect().width;
      if (!barWidth) return;
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        index,
        startLeft: segments[index]!.value,
        startRight: segments[index + 1]!.value,
        barWidth,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId || !onSegmentsChange) return;
    const deltaPx = event.clientX - drag.startX;
    const deltaValue = (deltaPx / drag.barWidth) * total;
    const pairTotal = drag.startLeft + drag.startRight;
    const minValue = total * minSegmentShare;
    const nextLeft = Math.min(Math.max(drag.startLeft + deltaValue, minValue), pairTotal - minValue);
    const nextRight = pairTotal - nextLeft;
    onSegmentsChange(
      segments.map((segment, i) => {
        if (i === drag.index) return { ...segment, value: nextLeft };
        if (i === drag.index + 1) return { ...segment, value: nextRight };
        return segment;
      }),
    );
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  }

  let cumulativeVisualPct = 0;

  return (
    <div
      ref={barRef}
      className={cn("relative flex h-[2.875rem] overflow-hidden rounded-[10px] bg-surface", className)}
      role="img"
      aria-label={segments.map((segment) => `${segment.name}: ${formatLabel(segment, total > 0 ? segment.value / total : 0, total)}`).join(", ")}
    >
      {segments.map((segment, index) => {
        const share = total > 0 ? segment.value / total : 0;
        // Tamanho visual >= piso, SEM passar de 100% no total — reparte o
        // espaço em duas fatias: um piso fixo pra cada segmento
        // (`minVisibleShare * N`) e o resto (`remaining`) proporcional ao
        // share de cada um. A soma das duas sempre fecha em exatamente
        // 100% (fórmula: N*piso + remaining*Σshare = N*piso + remaining =
        // 1), então nenhum segmento nunca é empurrado pra fora do width
        // nem desaparece quando outro chega perto de 100% de share.
        const remaining = Math.max(0, 1 - minVisibleShare * segments.length);
        const visualPct = (minVisibleShare + share * remaining) * 100;
        cumulativeVisualPct += visualPct;
        const color = segmentColor(index);
        return (
          <React.Fragment key={index}>
            <div
              style={{ flex: `0 0 ${visualPct}%`, backgroundColor: color.bg }}
              className="flex items-center justify-center overflow-hidden"
            >
              {share >= minLabelShare && (
                <span className="truncate px-1 font-display text-xs font-bold" style={{ color: color.fg }}>
                  {formatLabel(segment, share, total)}
                </span>
              )}
            </div>
            {onSegmentsChange && index < segments.length - 1 && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={`Ajustar entre "${segment.name}" e "${segments[index + 1]!.name}"`}
                onPointerDown={onHandlePointerDown(index)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                style={{ left: `calc(${cumulativeVisualPct}% - ${HANDLE_HIT_WIDTH / 2}px)`, width: HANDLE_HIT_WIDTH }}
                className="absolute inset-y-0 z-10 flex cursor-col-resize touch-none select-none items-center justify-center"
              >
                <div className="h-[18px] w-[2px] rounded-[1px] bg-background ring-1 ring-ink/25" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
