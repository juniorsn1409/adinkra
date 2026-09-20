"use client";

import * as React from "react";
import { useLang } from "./language";

// `BigCircleCursor` de verdade (@adinkra/cursor) é `position: fixed` e
// escuta o `document` inteiro de propósito — pensado pra ficar montado uma
// vez na raiz do app, cobrindo a página inteira. Não dá pra usar ele direto
// aqui: numa página de CATÁLOGO de componentes, isso sequestraria o cursor
// do site inteiro enquanto essa página estivesse aberta, atrapalhando
// navegar o resto da documentação. Esta versão reimplementa a mesma
// mecânica (círculo + ponto, cresce no hover, encolhe no clique) mas
// contida numa caixa (`position: absolute` relativo ao container da
// demo, eventos de ponteiro só dentro dela) — só pra mostrar o efeito sem
// vazar pro resto da página.
const HOVER_SELECTOR = "button, a, [data-cursor-hover]";
const SIZE = 96;

export function BigCircleCursorDemo() {
  const { t } = useLang();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const circleRef = React.useRef<HTMLDivElement>(null);
  const dotRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    hoveringRef.current = (event.target as Element).closest(HOVER_SELECTOR) != null;
    const scale = hoveringRef.current ? " scale(1.4)" : "";
    circleRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0)${scale}`;
    dotRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function handlePointerDown() {
    circleRef.current!.style.transform += " scale(0.75)";
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    handlePointerMove(event);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface [&_a]:cursor-none [&_button]:cursor-none"
      style={{ cursor: "none" }}
    >
      <button
        type="button"
        className="rounded-control border-[length:var(--border-width)] border-ink bg-primary px-4 py-2 text-primary-foreground shadow-brutal"
      >
        {t("demo.cursor.hoverHere")}
      </button>
      <p className="max-w-40 text-sm text-muted-foreground">{t("demo.cursor.outside")}</p>
      <div
        ref={circleRef}
        style={{
          position: "absolute",
          top: -SIZE / 2,
          left: -SIZE / 2,
          width: SIZE,
          height: SIZE,
          borderRadius: "9999px",
          backdropFilter: "invert(0.97) grayscale(1)",
          transition: "transform 158ms",
          pointerEvents: "none",
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: "absolute",
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: "9999px",
          backdropFilter: "invert(0.97) grayscale(1)",
          transition: "transform 118.5ms",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// Mesma ressalva do `BigCircleCursorDemo` acima — `MotionBlurCursor` de
// verdade escuta o `document` e usa `position: fixed`, então a demo
// reimplementa a mesma mecânica (borrão gira com o ângulo do gesto, sem
// preenchimento de cor nenhum, mesmo raciocínio do `BigCircleCursor`)
// contida no container, com `position: absolute` e coordenadas relativas
// ao `getBoundingClientRect()` da caixa em vez de à viewport inteira.
// Efeito dividido em `backdrop-filter: invert()+grayscale()` (funções CSS
// puras) + `filter: url(#blur-svg)` (borrão direcional) — mesmo fix do
// componente real, ver comentário em `motion-blur-cursor.tsx`:
// `backdrop-filter: url(#svg-filter)` sozinho renderizava um círculo preto
// sólido em vez do efeito, bug de referência SVG nessa propriedade.
const BLUR_DEGREES_PER_RADIAN = 180 / Math.PI;
const BLUR_MAX_DISTANCE = 20;
const BLUR_STOP_DELAY_MS = 50;
const BLUR_SIZE = 25;

export function MotionBlurCursorDemo() {
  const { t } = useLang();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const filterRef = React.useRef<SVGFEGaussianBlurElement>(null);
  const filterId = React.useId().replace(/:/g, "");
  const previous = React.useRef({ x: 0, y: 0, angle: 0 });
  const stopTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const distanceX = Math.min(Math.max(previous.current.x - x, -BLUR_MAX_DISTANCE), BLUR_MAX_DISTANCE);
    const distanceY = Math.min(Math.max(previous.current.y - y, -BLUR_MAX_DISTANCE), BLUR_MAX_DISTANCE);
    previous.current.x = x;
    previous.current.y = y;

    const rawAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * BLUR_DEGREES_PER_RADIAN;
    let angle = previous.current.angle;
    if (!Number.isNaN(rawAngle)) {
      if (rawAngle <= 45) {
        angle = distanceX * distanceY >= 0 ? rawAngle : -rawAngle;
        filterRef.current!.setAttribute("stdDeviation", `${Math.abs(distanceX / 2)}, 0`);
      } else {
        angle = distanceX * distanceY <= 0 ? 180 - rawAngle : rawAngle;
        filterRef.current!.setAttribute("stdDeviation", `${Math.abs(distanceY / 2)}, 0`);
      }
    }
    previous.current.angle = angle;

    wrapperRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
    clearTimeout(stopTimeout.current);
    stopTimeout.current = setTimeout(() => filterRef.current!.setAttribute("stdDeviation", "0, 0"), BLUR_STOP_DELAY_MS);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface [&_a]:cursor-none [&_button]:cursor-none"
      style={{ cursor: "none" }}
    >
      <button
        type="button"
        className="rounded-control border-[length:var(--border-width)] border-ink bg-primary px-4 py-2 text-primary-foreground shadow-brutal"
      >
        {t("demo.cursor.moveFast")}
      </button>
      <p className="max-w-40 text-sm text-muted-foreground">{t("demo.cursor.alsoHere")}</p>
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id={filterId} x="-100%" y="-100%" width="400%" height="400%" colorInterpolationFilters="sRGB">
            <feGaussianBlur ref={filterRef} stdDeviation="0, 0" />
          </filter>
        </defs>
      </svg>
      <div
        ref={wrapperRef}
        className="pointer-events-none absolute"
        style={{
          top: -BLUR_SIZE / 2,
          left: -BLUR_SIZE / 2,
          width: BLUR_SIZE,
          height: BLUR_SIZE,
          borderRadius: "9999px",
          backdropFilter: "invert(0.97) grayscale(1)",
          filter: `url(#${filterId})`,
          transition: "transform 10ms",
        }}
      />
    </div>
  );
}

// Mesma ressalva das demos acima — os quatro cursores a seguir
// (`ArrowPointerCursor`, `RingDotCursor`, `CircleAndDotCursor`,
// `GlitchCursor`, todos de @adinkra/cursor) escutam o `document` inteiro
// de propósito; cada demo reimplementa a mesma mecânica contida na caixa,
// coordenadas relativas ao `getBoundingClientRect()` do container.
const ARROW_DEGREES_PER_RADIAN = 57.296;
const ARROW_SIZE = 24;

export function ArrowPointerCursorDemo() {
  const { t } = useLang();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const previous = React.useRef({ x: 0, y: 0, angle: 0, angleDisplace: 0 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const distanceX = previous.current.x - x;
    const distanceY = previous.current.y - y;
    previous.current.x = x;
    previous.current.y = y;

    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    if (distance > 1) {
      const rawAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * ARROW_DEGREES_PER_RADIAN;
      const previousAngle = previous.current.angle;

      if (distanceX <= 0 && distanceY >= 0) previous.current.angle = 90 - rawAngle;
      else if (distanceX < 0 && distanceY < 0) previous.current.angle = rawAngle + 90;
      else if (distanceX >= 0 && distanceY <= 0) previous.current.angle = 90 - rawAngle + 180;
      else previous.current.angle = rawAngle + 270;

      if (Number.isNaN(previous.current.angle)) {
        previous.current.angle = previousAngle;
      } else {
        const delta = previous.current.angle - previousAngle;
        if (delta <= -270) previous.current.angleDisplace += 360 + delta;
        else if (delta >= 270) previous.current.angleDisplace += delta - 360;
        else previous.current.angleDisplace += delta;
      }
    }

    cursorRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${previous.current.angleDisplace}deg)`;
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface"
      style={{ cursor: "none" }}
    >
      <p className="max-w-52 text-center text-sm text-muted-foreground">{t("demo.cursor.arrow")}</p>
      <div
        ref={cursorRef}
        className="pointer-events-none absolute select-none"
        style={{ top: 0, left: -ARROW_SIZE / 2, width: ARROW_SIZE, height: ARROW_SIZE }}
      >
        <svg viewBox="0 0 32 32" width={ARROW_SIZE} height={ARROW_SIZE}>
          <path
            d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
            fill="var(--background)"
          />
          <path
            d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
            fill="var(--ink)"
          />
        </svg>
      </div>
    </div>
  );
}

const RING_SIZE = 20;
const RING_HOVER_SIZE = 40;

export function RingDotCursorDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);

  function applySize(hovering: boolean) {
    const size = hovering ? RING_HOVER_SIZE : RING_SIZE;
    ringRef.current!.style.width = `${size}px`;
    ringRef.current!.style.height = `${size}px`;
    ringRef.current!.style.top = `${-size / 2}px`;
    ringRef.current!.style.left = `${-size / 2}px`;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hovering = (event.target as Element).closest(HOVER_SELECTOR) != null;
    if (hovering !== hoveringRef.current) {
      hoveringRef.current = hovering;
      applySize(hovering);
    }
    ringRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function handlePointerDown() {
    ringRef.current!.style.transform += " scale(0.75)";
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    handlePointerMove(event);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface [&_a]:cursor-none [&_button]:cursor-none"
      style={{ cursor: "none" }}
    >
      <button
        type="button"
        className="rounded-control border-[length:var(--border-width)] border-ink bg-primary px-4 py-2 text-primary-foreground shadow-brutal"
      >
        Passe o mouse aqui
      </button>
      <p className="max-w-40 text-sm text-muted-foreground">o anel cresce</p>
      <div
        ref={ringRef}
        className="pointer-events-none absolute flex select-none items-center justify-center rounded-full"
        style={{
          top: -RING_SIZE / 2,
          left: -RING_SIZE / 2,
          width: RING_SIZE,
          height: RING_SIZE,
          boxShadow: "0 0 0 1.25px var(--ink), 0 0 0 2.25px var(--primary)",
          transition: "width 200ms, height 200ms, top 200ms, left 200ms, transform 100ms",
        }}
      >
        <div className="rounded-full" style={{ width: 4, height: 4, backgroundColor: "var(--ink)", boxShadow: "0 0 0 1px var(--primary)" }} />
      </div>
    </div>
  );
}

const CIRCLE_DOT_SIZE = 20;
const CIRCLE_DOT_DEGREES_PER_RADIAN = 57.296;
const CIRCLE_DOT_FADE_DELAY_MS = 50;

export function CircleAndDotCursorDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);
  const previous = React.useRef({ x: 0, y: 0, angle: 0, angleDisplace: 0 });
  const fadeTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const distanceX = previous.current.x - x;
    const distanceY = previous.current.y - y;
    previous.current.x = x;
    previous.current.y = y;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    const hovering = (event.target as Element).closest(HOVER_SELECTOR) != null;
    if (hovering !== hoveringRef.current) {
      hoveringRef.current = hovering;
      cursorRef.current!.style.border = hovering ? "10px solid var(--ink)" : "1.25px solid var(--ink)";
    }

    const rawAngle = Math.atan(Math.abs(distanceY) / Math.abs(distanceX)) * CIRCLE_DOT_DEGREES_PER_RADIAN;
    const previousAngle = previous.current.angle;

    if (distanceX <= 0 && distanceY >= 0) previous.current.angle = 90 - rawAngle;
    else if (distanceX < 0 && distanceY < 0) previous.current.angle = rawAngle + 90;
    else if (distanceX >= 0 && distanceY <= 0) previous.current.angle = 90 - rawAngle + 180;
    else previous.current.angle = rawAngle + 270;

    if (Number.isNaN(previous.current.angle)) {
      previous.current.angle = previousAngle;
    } else {
      const delta = previous.current.angle - previousAngle;
      if (delta <= -270) previous.current.angleDisplace += 360 + delta;
      else if (delta >= 270) previous.current.angleDisplace += delta - 360;
      else previous.current.angleDisplace += delta;
    }

    cursorRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${previous.current.angleDisplace}deg)`;
    cursorRef.current!.style.boxShadow = `0 ${-15 - distance}px 0 -8px var(--ink)`;

    clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => {
      cursorRef.current!.style.boxShadow = "0 -15px 0 -8px transparent";
    }, CIRCLE_DOT_FADE_DELAY_MS);
  }

  function handlePointerDown() {
    cursorRef.current!.style.transform += " scale(0.75)";
  }

  function handlePointerUp() {
    cursorRef.current!.style.transform = cursorRef.current!.style.transform.replace(" scale(0.75)", "");
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface [&_a]:cursor-none [&_button]:cursor-none"
      style={{ cursor: "none" }}
    >
      <button
        type="button"
        className="rounded-control border-[length:var(--border-width)] border-ink bg-primary px-4 py-2 text-primary-foreground shadow-brutal"
      >
        Passe o mouse aqui
      </button>
      <p className="max-w-40 text-sm text-muted-foreground">e solte um rastro por aqui</p>
      <div
        ref={cursorRef}
        className="pointer-events-none absolute select-none rounded-full"
        style={{
          top: -CIRCLE_DOT_SIZE / 2,
          left: -CIRCLE_DOT_SIZE / 2,
          width: CIRCLE_DOT_SIZE,
          height: CIRCLE_DOT_SIZE,
          border: "1.25px solid var(--ink)",
          boxShadow: "0 -15px 0 -8px transparent",
          transition: "border 200ms, transform 100ms",
        }}
      />
    </div>
  );
}

const GLITCH_SIZE = 15;
const GLITCH_HOVER_SIZE = 30;
const GLITCH_MAX_DISTANCE = 10;
const GLITCH_STOP_DELAY_MS = 50;

export function GlitchCursorDemo() {
  const { t } = useLang();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const hoveringRef = React.useRef(false);
  const previous = React.useRef({ x: 0, y: 0 });
  const stopTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  function applySize(hovering: boolean) {
    const size = hovering ? GLITCH_HOVER_SIZE : GLITCH_SIZE;
    cursorRef.current!.style.width = `${size}px`;
    cursorRef.current!.style.height = `${size}px`;
    cursorRef.current!.style.top = `${-size / 2}px`;
    cursorRef.current!.style.left = `${-size / 2}px`;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const distanceX = Math.min(Math.max(previous.current.x - x, -GLITCH_MAX_DISTANCE), GLITCH_MAX_DISTANCE);
    const distanceY = Math.min(Math.max(previous.current.y - y, -GLITCH_MAX_DISTANCE), GLITCH_MAX_DISTANCE);
    previous.current.x = x;
    previous.current.y = y;

    const hovering = (event.target as Element).closest(HOVER_SELECTOR) != null;
    if (hovering !== hoveringRef.current) {
      hoveringRef.current = hovering;
      applySize(hovering);
    }

    cursorRef.current!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursorRef.current!.style.boxShadow = `${distanceX}px ${distanceY}px 0 var(--primary), ${-distanceX}px ${-distanceY}px 0 var(--brand)`;

    clearTimeout(stopTimeout.current);
    stopTimeout.current = setTimeout(() => {
      cursorRef.current!.style.boxShadow = "";
    }, GLITCH_STOP_DELAY_MS);
  }

  function handlePointerDown() {
    cursorRef.current!.style.transform += " scale(0.75)";
  }

  function handlePointerUp() {
    cursorRef.current!.style.transform = cursorRef.current!.style.transform.replace(" scale(0.75)", "");
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex h-64 w-full items-center justify-center gap-4 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-surface [&_a]:cursor-none [&_button]:cursor-none"
      style={{ cursor: "none" }}
    >
      <button
        type="button"
        className="rounded-control border-[length:var(--border-width)] border-ink bg-primary px-4 py-2 text-primary-foreground shadow-brutal"
      >
        {t("demo.cursor.moveFast")}
      </button>
      <p className="max-w-40 text-sm text-muted-foreground">{t("demo.cursor.chromatic")}</p>
      <div
        ref={cursorRef}
        className="pointer-events-none absolute select-none rounded-full bg-ink"
        style={{
          top: -GLITCH_SIZE / 2,
          left: -GLITCH_SIZE / 2,
          width: GLITCH_SIZE,
          height: GLITCH_SIZE,
          transition: "width 100ms, height 100ms, top 100ms, left 100ms, transform 100ms",
        }}
      />
    </div>
  );
}
