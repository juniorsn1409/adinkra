"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { CURSOR_HOVER_SELECTOR } from "./hover-selector";
import { useCursorActive } from "./use-cursor-active";

export interface CircleAndDotCursorProps {
  /** Diâmetro do círculo, em px. */
  size?: number;
  /** Cor da borda e do rastro. Aceita qualquer valor CSS válido. */
  color?: string;
  className?: string;
}

const DEGREES_PER_RADIAN = 57.296;
// Sem movimento por esse tanto de tempo, o rastro (o "dot" acima do
// círculo) desaparece — mesmo raciocínio do `STOP_DELAY_MS` do
// `MotionBlurCursor`: rápido o bastante pra não ficar "grudado" parado,
// sem ser tão curto a ponto de piscar entre dois `pointermove` do mesmo
// gesto.
const FADE_DELAY_MS = 50;

/**
 * Círculo que gira pra acompanhar a direção do movimento (mesmo truque de
 * ângulo por quadrante com acumulador do `ArrowPointerCursor`) e solta um
 * rastro — um pontinho acima do círculo, marcado via `box-shadow`, que se
 * afasta com a distância percorrida no frame e desaparece pouco depois de
 * parar. Cresce a borda sobre elementos interativos, encolhe no clique
 * (duração real do `pointerdown`/`pointerup`, mesmo raciocínio do
 * `BigCircleCursor`/`RingDotCursor`). Tradução do `CircleAndDot` da
 * referência ([Curzr](https://github.com/fuzionix/curzr) de fuzionix) —
 * cor única via `color` (default `var(--ink)`, a referência já era
 * monocromática aqui).
 */
export function CircleAndDotCursor({ size = 20, color = "var(--ink)", className }: CircleAndDotCursorProps) {
  const active = useCursorActive();
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  React.useEffect(() => {
    if (!active) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let previousX = 0;
    let previousY = 0;
    let angle = 0;
    let previousAngle = 0;
    let angleDisplace = 0;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    function applyBorder(hovering: boolean) {
      cursor!.style.border = hovering ? `10px solid ${color}` : `1.25px solid ${color}`;
    }

    function handleMove(event: PointerEvent) {
      const x = event.clientX;
      const y = event.clientY;
      const distanceX = previousX - x;
      const distanceY = previousY - y;
      previousX = x;
      previousY = y;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      const hovering = (event.target as Element | null)?.closest(CURSOR_HOVER_SELECTOR) != null;
      if (hovering !== hoveringRef.current) {
        hoveringRef.current = hovering;
        applyBorder(hovering);
      }

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

      cursor!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angleDisplace}deg)`;
      cursor!.style.boxShadow = `0 ${-15 - distance}px 0 -8px ${color}`;

      clearTimeout(fadeTimeout);
      fadeTimeout = setTimeout(() => {
        cursor!.style.boxShadow = "0 -15px 0 -8px transparent";
      }, FADE_DELAY_MS);
    }

    function handlePointerDown() {
      cursor!.style.transform += " scale(0.75)";
    }

    function handlePointerUp() {
      cursor!.style.transform = cursor!.style.transform.replace(" scale(0.75)", "");
    }

    applyBorder(false);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      clearTimeout(fadeTimeout);
    };
  }, [active, color]);

  if (!active) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden
      className={cn("pointer-events-none fixed z-[2147483647] select-none rounded-full", className)}
      style={{
        top: -size / 2,
        left: -size / 2,
        width: size,
        height: size,
        boxShadow: "0 -15px 0 -8px transparent",
        transition: "border 200ms, transform 100ms",
      }}
    />
  );
}
