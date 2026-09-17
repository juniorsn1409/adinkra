"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { useCursorActive } from "./use-cursor-active";

export interface ArrowPointerCursorProps {
  /** Tamanho do ícone (largura = altura), em px. */
  size?: number;
  /** Cor do contorno da seta. Aceita qualquer valor CSS válido (token, hex, `rgb()`...). */
  color?: string;
  className?: string;
}

const DEGREES_PER_RADIAN = 57.296;

/**
 * Substitui o cursor nativo por uma seta que gira pra acompanhar a direção
 * do movimento — parado, mantém a última direção; só rotação, sem
 * crescer/encolher (diferente do `BigCircleCursor`/`RingDotCursor`, não
 * reage a hover nem clique — mesmo comportamento da referência original,
 * [Curzr](https://github.com/fuzionix/curzr) de fuzionix).
 *
 * **Ângulo por quadrante com acumulador** (`angleDisplace`), não
 * `Math.atan2` direto: o ângulo "cru" (`Math.atan(dy/dx)`, sempre 0-90°) é
 * remapeado pro quadrante certo a partir do sinal de `distanceX`/
 * `distanceY`, e a MUDANÇA de ângulo (não o ângulo absoluto) é somada num
 * acumulador. Isso evita o salto visual de 359°→0° que uma rotação CSS
 * daria se o ângulo absoluto fosse aplicado direto — o acumulador deixa o
 * `rotate()` sempre crescer/decrescer continuamente, mesmo depois de
 * várias voltas no mesmo sentido.
 *
 * Duas cores via token, não hex fixo: `color` (default `var(--ink)`) no
 * contorno — customizável — e `var(--background)`, sempre fixo, no miolo
 * (garante o recorte de duas cores mesmo com um `color` custom, em vez de
 * virar uma silhueta cheia sem miolo visível). A seta se adapta ao tema
 * claro/escuro sozinha quando `color` fica no padrão, diferente da
 * referência original (cores fixas `#111920`/`#F2F5F8`, nunca invertiam
 * no escuro).
 *
 * Posição/rotação via ref direto (`style.transform`), sem state do React
 * no `pointermove` — mesmo raciocínio do `BigCircleCursor`.
 */
export function ArrowPointerCursor({ size = 20, color = "var(--ink)", className }: ArrowPointerCursorProps) {
  const active = useCursorActive();
  const cursorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let previousX = 0;
    let previousY = 0;
    let angle = 0;
    let previousAngle = 0;
    let angleDisplace = 0;

    function handleMove(event: PointerEvent) {
      const x = event.clientX;
      const y = event.clientY;
      const distanceX = previousX - x;
      const distanceY = previousY - y;
      previousX = x;
      previousY = y;

      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (distance > 1) {
        const rawAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * DEGREES_PER_RADIAN;
        previousAngle = angle;

        if (distanceX <= 0 && distanceY >= 0) angle = 90 - rawAngle;
        else if (distanceX < 0 && distanceY < 0) angle = rawAngle + 90;
        else if (distanceX >= 0 && distanceY <= 0) angle = 90 - rawAngle + 180;
        else angle = rawAngle + 270;

        if (Number.isNaN(angle)) {
          angle = previousAngle;
        } else {
          const delta = angle - previousAngle;
          if (delta <= -270) angleDisplace += 360 + delta;
          else if (delta >= 270) angleDisplace += delta - 360;
          else angleDisplace += delta;
        }
      }

      cursor!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angleDisplace}deg)`;
    }

    document.addEventListener("pointermove", handleMove);
    return () => document.removeEventListener("pointermove", handleMove);
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden
      className={cn("pointer-events-none fixed z-[2147483647] select-none", className)}
      style={{ top: 0, left: -size / 2, width: size, height: size, transition: "transform 100ms" }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <path
          d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
          fill="var(--background)"
        />
        <path
          d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
