"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { CURSOR_HOVER_SELECTOR } from "./hover-selector";
import { useCursorActive } from "./use-cursor-active";

export interface GlitchCursorProps {
  /** Diâmetro do círculo em repouso, em px. */
  size?: number;
  /** Diâmetro do círculo sobre um elemento marcado como hover, em px. */
  hoverSize?: number;
  /** Primeira cor da separação cromática (e cor do fallback sólido sem `backdrop-filter`). Aceita qualquer valor CSS válido. */
  colorA?: string;
  /** Segunda cor da separação cromática, deslocada no sentido oposto de `colorA`. */
  colorB?: string;
  className?: string;
}

const MAX_DISTANCE = 10;
// Mesmo raciocínio do `STOP_DELAY_MS` do `MotionBlurCursor`/`FADE_DELAY_MS`
// do `CircleAndDotCursor` — some pouco depois de parar, sem piscar durante
// o mesmo gesto.
const STOP_DELAY_MS = 50;

/**
 * Círculo pequeno com separação cromática (efeito "glitch") na direção do
 * movimento — duas sombras coloridas deslocam em sentidos opostos,
 * proporcional à velocidade, e somem pouco depois de parar. Cresce sobre
 * elementos interativos, encolhe no clique (duração real, mesmo raciocínio
 * do `BigCircleCursor`). Tradução do `GlitchEffect` da referência
 * ([Curzr](https://github.com/fuzionix/curzr) de fuzionix).
 *
 * **Cores via token, não neon fixo**: a referência usa ciano/magenta
 * (`#00feff`/`#ff4f71`) — aqui viram `colorA`/`colorB`, default
 * `var(--primary)` (céu) e `var(--brand)` (coral), as duas cores "vivas"
 * que o sistema já tem, em vez de introduzir um par de hex fora da
 * paleta. Como é sombra decorativa (não texto), a regra de contraste AA
 * que restringe `--brand` a texto ≥24px não se aplica aqui.
 *
 * `CSS.supports` decide o preenchimento base: `backdrop-filter: invert(1)`
 * quando suportado (reage ao fundo, sem cor própria), senão um fallback
 * sólido em `colorA` — mesmo padrão defensivo da referência original,
 * diferente do `BigCircleCursor`/`MotionBlurCursor` (que abriram mão de
 * qualquer fallback sólido depois da saga do `data-cursor-color`, ver
 * DECISOES.md — decisão daquela dupla especificamente, não uma regra do
 * pacote inteiro).
 */
export function GlitchCursor({ size = 15, hoverSize = 30, colorA = "var(--primary)", colorB = "var(--brand)", className }: GlitchCursorProps) {
  const active = useCursorActive();
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  React.useEffect(() => {
    if (!active) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    if (typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "invert(1)")) {
      cursor.style.backdropFilter = "invert(1)";
      cursor.style.backgroundColor = "transparent";
    } else {
      cursor.style.backgroundColor = colorA;
    }

    let previousX = 0;
    let previousY = 0;
    let stopTimeout: ReturnType<typeof setTimeout> | undefined;

    function applySize(hovering: boolean) {
      const current = hovering ? hoverSize : size;
      cursor!.style.width = `${current}px`;
      cursor!.style.height = `${current}px`;
      cursor!.style.top = `${-current / 2}px`;
      cursor!.style.left = `${-current / 2}px`;
    }

    function handleMove(event: PointerEvent) {
      const x = event.clientX;
      const y = event.clientY;
      const distanceX = Math.min(Math.max(previousX - x, -MAX_DISTANCE), MAX_DISTANCE);
      const distanceY = Math.min(Math.max(previousY - y, -MAX_DISTANCE), MAX_DISTANCE);
      previousX = x;
      previousY = y;

      const hovering = (event.target as Element | null)?.closest(CURSOR_HOVER_SELECTOR) != null;
      if (hovering !== hoveringRef.current) {
        hoveringRef.current = hovering;
        applySize(hovering);
      }

      cursor!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursor!.style.boxShadow = `${distanceX}px ${distanceY}px 0 ${colorA}, ${-distanceX}px ${-distanceY}px 0 ${colorB}`;

      clearTimeout(stopTimeout);
      stopTimeout = setTimeout(() => {
        cursor!.style.boxShadow = "";
      }, STOP_DELAY_MS);
    }

    function handlePointerDown() {
      cursor!.style.transform += " scale(0.75)";
    }

    function handlePointerUp() {
      cursor!.style.transform = cursor!.style.transform.replace(" scale(0.75)", "");
    }

    applySize(false);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      clearTimeout(stopTimeout);
    };
  }, [active, size, hoverSize, colorA, colorB]);

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
        transition: "width 100ms, height 100ms, top 100ms, left 100ms, transform 100ms",
      }}
    />
  );
}
