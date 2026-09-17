"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { useCursorActive } from "./use-cursor-active";

export interface MotionBlurCursorProps {
  /** Diâmetro do círculo, em px. */
  size?: number;
  className?: string;
}

const DEGREES_PER_RADIAN = 180 / Math.PI;
const MAX_DISTANCE = 20;
// Sem movimento por esse tanto de tempo, o borrão zera — mesmo "clique
// funciona por tempo real, não um número mágico fixo" já vale aqui: 50ms é
// rápido o bastante pra não deixar o borrão "grudado" depois que o mouse
// para, sem ser tão curto a ponto de zerar entre dois `pointermove` do
// mesmo gesto (o navegador dispara isso bem mais que a cada 50ms).
const STOP_DELAY_MS = 50;

/**
 * Círculo que borra na direção do movimento — sem preenchimento de cor
 * nenhum. O eixo do borrão gira com o ângulo do gesto: mais rápido o
 * mouse, mais alongado o rastro; parado, círculo nítido.
 *
 * **Efeito dividido em duas propriedades CSS, não uma só** (corrigido
 * 17/09/2026 — bug real: o círculo aparecia PRETO SÓLIDO em vez de
 * invertido/borrado, verificado com screenshot): a versão original juntava
 * tudo (`invert`+`grayscale`+`feGaussianBlur`) num único `<filter>` de SVG
 * aplicado via `backdrop-filter: url(#id)`. `backdrop-filter` referenciando
 * um `<filter>` de SVG por `url()` é instável entre navegadores — bug
 * conhecido do Firefox (o elemento simplesmente não renderiza) e
 * comportamento errático no Chromium (aqui, a amostra do fundo falhava e
 * virava preto antes mesmo de entrar no filtro, então inverter/dessaturar
 * preto continua preto). Só FUNÇÕES CSS puras (`invert()`, `grayscale()`,
 * `blur()`) são confiáveis em `backdrop-filter` — é o que o
 * `BigCircleCursor` já usa, sem problema nenhum. Fix: `backdrop-filter`
 * fica só com `invert(0.97) grayscale(1)` (mesma dupla do `BigCircleCursor`,
 * mesma identidade visual); o `<filter>` de SVG (agora só com o
 * `feGaussianBlur` direcional, sem os dois `feColorMatrix`) vai pra
 * propriedade `filter` normal — essa sim suporta `url()` de SVG de forma
 * confiável (é o caso de uso original do recurso), e age sobre o resultado
 * JÁ invertido/dessaturado que o `backdrop-filter` produziu, borrando esse
 * resultado em vez do fundo cru.
 *
 * `color-interpolation-filters="sRGB"` no `<filter>` continua necessário:
 * o padrão do SVG é `linearRGB`.
 *
 * Ângulo e borrão são recalculados a cada `pointermove` direto no ref do
 * `<feGaussianBlur>` (`setAttribute("stdDeviation", ...)`) e do wrapper
 * (`style.transform`) — nenhum dos dois passa por state/re-render do
 * React, mesmo raciocínio de performance do `BigCircleCursor`/
 * `SymbolField`. O `id` do `<filter>` usa `React.useId()` (não uma string
 * fixa) porque um `id` de SVG é global no documento — dois cursores desse
 * tipo na mesma página (ou um remount) colidiriam num `id` fixo.
 */
export function MotionBlurCursor({ size = 25, className }: MotionBlurCursorProps) {
  const active = useCursorActive();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const filterRef = React.useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `motion-blur-${React.useId().replace(/:/g, "")}`;

  React.useEffect(() => {
    if (!active) return;

    const wrapper = wrapperRef.current;
    const filter = filterRef.current;
    if (!wrapper || !filter) return;

    let previousX = 0;
    let previousY = 0;
    let previousAngle = 0;
    let stopTimeout: ReturnType<typeof setTimeout> | undefined;

    function handleMove(event: PointerEvent) {
      const x = event.clientX;
      const y = event.clientY;
      const distanceX = Math.min(Math.max(previousX - x, -MAX_DISTANCE), MAX_DISTANCE);
      const distanceY = Math.min(Math.max(previousY - y, -MAX_DISTANCE), MAX_DISTANCE);
      previousX = x;
      previousY = y;

      // Ângulo do gesto (0-90°, sem sinal) a partir da tangente entre os
      // dois eixos — abaixo de 45° o movimento é mais HORIZONTAL (borra no
      // eixo X), acima é mais VERTICAL (borra no eixo Y). NaN acontece
      // quando o mouse não se moveu nesse frame (distanceX igual a 0);
      // mantém o último ângulo em vez de girar pra 0 à toa.
      const rawAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * DEGREES_PER_RADIAN;
      let angle = previousAngle;

      if (!Number.isNaN(rawAngle)) {
        if (rawAngle <= 45) {
          angle = distanceX * distanceY >= 0 ? rawAngle : -rawAngle;
          filter!.setAttribute("stdDeviation", `${Math.abs(distanceX / 2)}, 0`);
        } else {
          angle = distanceX * distanceY <= 0 ? 180 - rawAngle : rawAngle;
          filter!.setAttribute("stdDeviation", `${Math.abs(distanceY / 2)}, 0`);
        }
      }
      previousAngle = angle;

      wrapper!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;

      clearTimeout(stopTimeout);
      stopTimeout = setTimeout(() => filter!.setAttribute("stdDeviation", "0, 0"), STOP_DELAY_MS);
    }

    document.addEventListener("pointermove", handleMove);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      clearTimeout(stopTimeout);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <svg width="0" height="0" className="fixed">
        <defs>
          <filter id={filterId} x="-100%" y="-100%" width="400%" height="400%" colorInterpolationFilters="sRGB">
            <feGaussianBlur ref={filterRef} stdDeviation="0, 0" />
          </filter>
        </defs>
      </svg>
      <div
        ref={wrapperRef}
        aria-hidden
        className={cn("pointer-events-none fixed z-[2147483647]", className)}
        style={{
          top: -size / 2,
          left: -size / 2,
          width: size,
          height: size,
          borderRadius: "9999px",
          backdropFilter: "invert(0.97) grayscale(1)",
          filter: `url(#${filterId})`,
          transition: "transform 10ms",
        }}
      />
    </>
  );
}
