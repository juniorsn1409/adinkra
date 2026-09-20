"use client";

import * as React from "react";
import { iconPaths } from "@adinkra/icons";
import { useCursorActive } from "@adinkra/cursor";

const slugs = Object.keys(iconPaths).sort();

// Ladrilhos suficientes pra cobrir telas grandes comuns (~1920×1080 em
// ladrilhos de 64px é só uns 510); o overflow-hidden do container corta o
// excesso em telas menores, e o excesso de tela é raro o bastante pra não
// valer o HTML extra de ir até o pior caso (4K).
const TILE_COUNT = 800;
const TILE_SIZE = 64;

const tiles = Array.from({ length: TILE_COUNT }, (_, i) => slugs[i % slugs.length]!);

export interface SymbolFieldProps {
  /**
   * Diâmetro (px) do `BigCircleCursor` montado na mesma página — define o
   * raio de reação dos ladrilhos. Precisa casar com o `size` passado pro
   * `BigCircleCursor` ali do lado, senão o círculo visual e a área que
   * reage ficam dessincronizados.
   */
  cursorSize?: number;
}

/**
 * Fundo de ladrilhos com os símbolos Adinkra, usado na home. Os ladrilhos
 * dentro do raio do `BigCircleCursor` mudam de `text-ink/10` pra terracota
 * (`var(--brand)`) enquanto o círculo passa por cima (17/09/2026, pedido do
 * usuário — "os simbolos [...] mudando de cor pra terracota ao big circle
 * passar por eles"). Reintroduz interação depois da remoção do hover antigo
 * (17/09/2026, mesmo dia, sessão anterior) — dessa vez amarrada ao cursor
 * customizado, não a um hover de área independente dele.
 *
 * Cada símbolo é definido uma única vez como <symbol> (dados crus de
 * `iconPaths`, de @adinkra/icons) e reaproveitado via <use> em cada
 * ladrilho — sem isso, repetir os paths (bem verbosos, vindos de potrace)
 * por ladrilho inflaria o HTML em vários MB pra nada. Não usa os
 * componentes React do pacote diretamente por esse motivo — eles são pra
 * uso avulso, não em massa.
 *
 * Performance do `pointermove`: nada de `useState`/re-render por movimento
 * nem loop nos 800 ladrilhos. A grade é regular (colunas de `auto-fill`
 * largura igual, linhas fixas de 64px), então dá pra calcular direto quais
 * índices caem dentro do raio (só a vizinhança do cursor, não a grade
 * inteira) e tocar só nesses via `ref` (mesmo raciocínio do
 * `BigCircleCursor`: `style.color` direto no DOM, refs num array indexado
 * por posição do ladrilho, nunca `classList`/estado do React no caminho
 * quente). `litRef` guarda o conjunto atual pra só desfazer cor de quem
 * saiu do raio, sem varrer todo mundo a cada frame.
 *
 * `useCursorActive` (do @adinkra/cursor) decide se isso liga — em touch ou
 * com `prefers-reduced-motion`, o `BigCircleCursor` nem existe, então não
 * faz sentido a área reagir a um círculo que não está lá.
 */
export function SymbolField({ cursorSize = 250 }: SymbolFieldProps) {
  const active = useCursorActive();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tileRefs = React.useRef<(SVGSVGElement | null)[]>([]);
  const litRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const radius = cursorSize / 2;
    const radiusSquared = radius * radius;

    function paint(index: number, lit: boolean) {
      const el = tileRefs.current[index];
      if (el) el.style.color = lit ? "var(--brand)" : "";
    }

    // Um cálculo por frame, não por evento: o mouse dispara mais eventos que
    // o monitor desenha, e a leitura de layout (getBoundingClientRect) é o
    // trecho caro daqui.
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function handleMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(update);
    }

    function update() {
      frame = 0;
      const rect = container!.getBoundingClientRect();
      const cols = Math.max(1, Math.floor(rect.width / TILE_SIZE));
      const colWidth = rect.width / cols;

      const x = pointerX - rect.left;
      const y = pointerY - rect.top;

      const colRange = Math.ceil(radius / colWidth);
      const rowRange = Math.ceil(radius / TILE_SIZE);
      const centerCol = Math.floor(x / colWidth);
      const centerRow = Math.floor(y / TILE_SIZE);

      const next = new Set<number>();

      for (let row = centerRow - rowRange; row <= centerRow + rowRange; row++) {
        if (row < 0) continue;
        for (let col = centerCol - colRange; col <= centerCol + colRange; col++) {
          if (col < 0 || col >= cols) continue;
          const index = row * cols + col;
          if (index >= TILE_COUNT) continue;

          const cx = col * colWidth + colWidth / 2;
          const cy = row * TILE_SIZE + TILE_SIZE / 2;
          const dx = cx - x;
          const dy = cy - y;
          if (dx * dx + dy * dy <= radiusSquared) next.add(index);
        }
      }

      for (const index of litRef.current) {
        if (!next.has(index)) paint(index, false);
      }
      for (const index of next) {
        if (!litRef.current.has(index)) paint(index, true);
      }
      litRef.current = next;
    }

    document.addEventListener("pointermove", handleMove);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
      for (const index of litRef.current) paint(index, false);
      litRef.current = new Set();
    };
  }, [active, cursorSize]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          {slugs.map((slug) => {
            const path = iconPaths[slug]!;
            return (
              <symbol key={slug} id={`tile-${slug}`} viewBox={path.viewBox}>
                <path d={path.d} fill="currentColor" fillRule={path.fillRule} />
              </symbol>
            );
          })}
        </defs>
      </svg>
      <div
        ref={containerRef}
        className="grid size-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gridAutoRows: "64px" }}
      >
        {tiles.map((slug, i) => (
          <div key={i} className="flex items-center justify-center">
            <svg
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              className="size-6 text-ink/10 transition-colors duration-150"
            >
              <use href={`#tile-${slug}`} />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
