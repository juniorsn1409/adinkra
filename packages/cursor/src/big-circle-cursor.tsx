"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { CURSOR_HOVER_SELECTOR } from "./hover-selector";
import { useCursorActive } from "./use-cursor-active";

export interface BigCircleCursorProps {
  /** Diâmetro do círculo grande, em px. */
  size?: number;
  /**
   * Liga o `backdrop-filter: invert()+grayscale()` (padrão). Desligado
   * (`false`), o círculo vira preenchimento sólido em `color` — sem
   * `backdrop-filter` nenhum, nem sequer reagindo ao fundo.
   */
  backdropFilter?: boolean;
  /**
   * Cor do preenchimento sólido do círculo grande quando
   * `backdropFilter={false}`. Ignorada com o padrão (`backdropFilter={true}`)
   * — nesse modo o círculo não tem cor própria de propósito. Aceita
   * `"transparent"` pra deixar só o pontinho central visível.
   */
  color?: string;
  /**
   * Cor do preenchimento sólido do pontinho central quando
   * `backdropFilter={false}`. Default: o mesmo valor de `color` — só
   * precisa ser passada separada quando círculo e pontinho devem ter
   * aparências diferentes (ex.: círculo `"transparent"`, pontinho
   * `var(--ink)`).
   */
  dotColor?: string;
  className?: string;
}

/**
 * Substitui o cursor nativo por um círculo grande — por padrão sem
 * preenchimento de cor nenhum, só `backdrop-filter: invert()+grayscale()`
 * (funciona sobre qualquer fundo, sem precisar saber o tema nem ter uma
 * cor própria) — mais um pontinho central. Cresce sobre elementos
 * interativos, encolhe no clique. `useCursorActive` (compartilhado com
 * `MotionBlurCursor`) decide SE isso deve ligar (montado, ponteiro fino,
 * sem `prefers-reduced-motion`) e cuida do `cursor:none` global.
 *
 * **`backdropFilter={false}`** (17/09/2026, pedido do usuário — "quero ter
 * a opção de desligar o backdrop-filter"): troca o filtro por um
 * preenchimento sólido em `color` (círculo) e `dotColor` (pontinho,
 * default = o mesmo valor de `color`) — separados pra permitir, por
 * exemplo, círculo `"transparent"` (invisível) com o pontinho ainda
 * visível numa cor sólida. Não é o mesmo fallback automático por
 * `CSS.supports` que o pacote já teve e abandonou (ver DECISOES.md, saga
 * do `data-cursor-color`) — aqui é uma escolha explícita do consumidor,
 * não uma detecção de suporte do navegador, então não reabre aquela
 * discussão (a decisão de não ter fallback AUTOMÁTICO continua de pé;
 * isso é um MODO diferente, escolhido de propósito).
 *
 * Posição via `transform: translate3d` sem tocar em `top`/`left` a cada
 * movimento (só a transform muda, os dois elementos ficam com
 * `position: fixed; top: {-size/2}px; left: {-size/2}px` uma vez só —
 * assim a origem já fica centralizada no canto (0,0) da viewport, e mover
 * com `translate3d(x, y, 0)` centraliza o círculo exatamente em (x, y) sem
 * precisar combinar com `translate(-50%, -50%)` no mesmo transform a cada
 * frame). Tudo via ref direto no DOM (`circleRef`/`dotRef`), sem state do
 * React no caminho de `pointermove` — mesmo raciocínio de performance do
 * `SymbolField` da home (muitos eventos por segundo, zero re-render).
 */
export function BigCircleCursor({
  size = 157,
  backdropFilter = true,
  color = "var(--ink)",
  dotColor = color,
  className,
}: BigCircleCursorProps) {
  const active = useCursorActive();
  const circleRef = React.useRef<HTMLDivElement>(null);
  const dotRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  React.useEffect(() => {
    if (!active) return;

    const circle = circleRef.current;
    const dot = dotRef.current;
    if (!circle || !dot) return;

    function applyTransform(x: number, y: number, pressed: boolean) {
      const hoverScale = hoveringRef.current ? " scale(1.5)" : "";
      const pressScale = pressed ? " scale(0.75)" : "";
      circle!.style.transform = `translate3d(${x}px, ${y}px, 0)${hoverScale}${pressScale}`;
      dot!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    let lastX = 0;
    let lastY = 0;

    function handleMove(event: PointerEvent) {
      lastX = event.clientX;
      lastY = event.clientY;
      hoveringRef.current = (event.target as Element | null)?.closest(CURSOR_HOVER_SELECTOR) != null;
      applyTransform(lastX, lastY, false);
    }

    function handlePointerDown() {
      applyTransform(lastX, lastY, true);
    }

    function handlePointerUp() {
      applyTransform(lastX, lastY, false);
    }

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden className={cn("fixed inset-0 z-[2147483647] pointer-events-none", className)}>
      <div
        ref={circleRef}
        style={{
          position: "fixed",
          top: -size / 2,
          left: -size / 2,
          width: size,
          height: size,
          borderRadius: "9999px",
          transition: "transform 158ms",
          backgroundColor: backdropFilter ? "transparent" : color,
          backdropFilter: backdropFilter ? "invert(0.97) grayscale(1)" : undefined,
          boxSizing: "border-box",
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: "9999px",
          transition: "transform 118.5ms",
          backgroundColor: backdropFilter ? "transparent" : dotColor,
          backdropFilter: backdropFilter ? "invert(0.97) grayscale(1)" : undefined,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
