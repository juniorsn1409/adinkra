"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { isHoverTarget } from "./hover-selector";
import { useCursorActive } from "./use-cursor-active";

export interface RingDotCursorProps {
  /** Diâmetro do anel em repouso, em px. */
  size?: number;
  /** Diâmetro do anel sobre um elemento marcado como hover, em px. */
  hoverSize?: number;
  /** Cor do traço externo do anel e do halo do pontinho. Aceita qualquer valor CSS válido. */
  color?: string;
  className?: string;
}

/**
 * Anel fino com um pontinho central — o anel cresce sobre elementos
 * interativos, encolhe no clique. Tradução do `RingDot` da referência
 * ([Curzr](https://github.com/fuzionix/curzr) de fuzionix), com as mesmas
 * adaptações já usadas no resto do pacote:
 *
 * - **`clientX`/`clientY` direto**, sem o ajuste manual de
 *   `getBoundingClientRect()` da referência (só necessário lá porque os
 *   elementos eram `position: absolute` relativos ao body; aqui são
 *   `position: fixed`, relativos à viewport, igual `BigCircleCursor`).
 * - **Pontinho centralizado por flexbox**, não por transform separado: o
 *   anel é `display: flex` com o pontinho como filho — redimensionar o
 *   anel (hover) já recentraliza o pontinho de graça, sem recalcular a
 *   posição dele.
 * - **Clique por duração real** (`pointerdown`/`pointerup`), não um
 *   `setTimeout` fixo — acompanha o clique/toque de verdade, mesmo
 *   raciocínio já usado no `BigCircleCursor`.
 * - **Cores via token**, não hex fixo: `var(--ink)`, sempre fixo, no anel
 *   interno/pontinho; `color` (default `var(--primary)`, céu) no traço
 *   externo — customizável, no lugar do amarelo `#edf370` da referência.
 */
export function RingDotCursor({ size = 20, hoverSize = 40, color = "var(--primary)", className }: RingDotCursorProps) {
  const active = useCursorActive();
  const ringRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  React.useEffect(() => {
    if (!active) return;

    const ring = ringRef.current;
    if (!ring) return;

    function applySize(hovering: boolean) {
      const current = hovering ? hoverSize : size;
      ring!.style.width = `${current}px`;
      ring!.style.height = `${current}px`;
      ring!.style.top = `${-current / 2}px`;
      ring!.style.left = `${-current / 2}px`;
    }

    let lastX = 0;
    let lastY = 0;

    function applyTransform(x: number, y: number, pressed: boolean) {
      const pressScale = pressed ? " scale(0.75)" : "";
      ring!.style.transform = `translate3d(${x}px, ${y}px, 0)${pressScale}`;
    }

    function handleMove(event: PointerEvent) {
      const hovering = isHoverTarget(event.target);
      if (hovering !== hoveringRef.current) {
        hoveringRef.current = hovering;
        applySize(hovering);
      }
      lastX = event.clientX;
      lastY = event.clientY;
      applyTransform(lastX, lastY, false);
    }

    function handlePointerDown() {
      applyTransform(lastX, lastY, true);
    }

    function handlePointerUp() {
      applyTransform(lastX, lastY, false);
    }

    applySize(false);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [active, size, hoverSize]);

  if (!active) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed z-[2147483647] flex select-none items-center justify-center rounded-full",
        className,
      )}
      style={{
        top: -size / 2,
        left: -size / 2,
        width: size,
        height: size,
        boxShadow: `0 0 0 1.25px var(--ink), 0 0 0 2.25px ${color}`,
        transition: "width 200ms, height 200ms, top 200ms, left 200ms, transform 100ms",
      }}
    >
      <div
        className="rounded-full"
        style={{ width: 4, height: 4, backgroundColor: "var(--ink)", boxShadow: `0 0 0 1px ${color}` }}
      />
    </div>
  );
}
