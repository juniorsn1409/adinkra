"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui-components/react/tooltip";
import { cn } from "@adinkra/core";

/**
 * Dica de contexto (20/09/2026). Base UI por baixo: abre no hover e no foco
 * do teclado, fecha no Esc e ao sair, e liga o texto ao gatilho por
 * `aria-describedby`. Tooltip só complementa — nunca guarde nele algo
 * essencial nem algo clicável (leitor de tela e toque não chegam nele).
 *
 * Visual: pastilha INVERTIDA (`bg-ink` com `text-background`, os dois já
 * invertem com o tema), sem borda nem sombra. Tooltip não é superfície
 * interativa, então a regra "borda+sombra+três estados" (regra 9, DECISOES.md)
 * não se aplica, e uma sombra de tinta sobre fundo de tinta nem apareceria.
 * A inversão é o que separa a dica de um Popover (painel claro, com borda).
 * Medidas φ (27/09/2026): text-sm (13/21), padding 5/8, raio 5, máx. 233,
 * seta de 8 de base × 5 de altura e afastamento de 5 — a seta preenche
 * exatamente o afastamento, encostando a ponta no gatilho.
 *
 * Movimento (frequência: dezenas de vezes por dia, então quase imperceptível):
 * fade + escala 0.97→1 em 125ms, saída em 100ms, `--ease-out`. A regra de
 * ouro fica com o TooltipProvider: ao mover de um gatilho pra outro enquanto
 * já há uma dica aberta (ou fechada há menos de `timeout` ms), a próxima abre
 * SEM atraso e SEM animação — o Base UI marca o Popup com `data-instant` e
 * `data-instant:transition-none` corta a transição. `prefers-reduced-motion`
 * já é tratado globalmente em @adinkra/tokens.
 *
 * `Tooltip.Root` não renderiza DOM próprio; o `container` do Portal
 * (armadilha 4, DECISOES.md) é achado a partir do DOM do Trigger via
 * `.closest("[data-theme]")`, igual ao @adinkra/popover.
 */
const TooltipContainerContext = React.createContext<{
  container: HTMLElement | null;
  register: (node: HTMLElement | null) => void;
} | null>(null);

/**
 * Envolva o app (ou só a região com vários gatilhos) uma vez. Compartilha o
 * atraso de abertura e a regra de "pular de dica em dica sem esperar".
 * `delay` padrão 400ms: longo o bastante pra não piscar quando o mouse só
 * passa por cima, curto o bastante pra não parecer travado.
 */
function TooltipProvider({
  delay = 400,
  closeDelay = 0,
  timeout = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delay={delay} closeDelay={closeDelay} timeout={timeout} {...props} />;
}

function Tooltip({
  children,
  ...props
}: Omit<React.ComponentProps<typeof TooltipPrimitive.Root>, "children"> & { children?: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const register = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <TooltipPrimitive.Root {...props}>
      <TooltipContainerContext.Provider value={{ container, register }}>{children}</TooltipContainerContext.Provider>
    </TooltipPrimitive.Root>
  );
}

function TooltipTrigger({ ref, ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const ctx = React.useContext(TooltipContainerContext);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      ref={(node: HTMLElement | null) => {
        ctx?.register(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      {...props}
    />
  );
}

// Seta: triângulo de 8 (base) × 5 (altura) recortado com `clip-path` sobre
// `bg-ink`, apontando pro gatilho. O Base UI posiciona no eixo cruzado (style
// inline) e marca o lado em `data-side`; aqui só gruda na aresta certa.
const arrowClassName = cn(
  "bg-ink",
  "data-[side=top]:top-full data-[side=top]:h-[5px] data-[side=top]:w-[8px] data-[side=top]:[clip-path:polygon(0_0,100%_0,50%_100%)]",
  "data-[side=bottom]:bottom-full data-[side=bottom]:h-[5px] data-[side=bottom]:w-[8px] data-[side=bottom]:[clip-path:polygon(50%_0,100%_100%,0_100%)]",
  "data-[side=left]:left-full data-[side=left]:h-[8px] data-[side=left]:w-[5px] data-[side=left]:[clip-path:polygon(0_0,100%_50%,0_100%)]",
  "data-[side=inline-start]:left-full data-[side=inline-start]:h-[8px] data-[side=inline-start]:w-[5px] data-[side=inline-start]:[clip-path:polygon(0_0,100%_50%,0_100%)]",
  "data-[side=right]:right-full data-[side=right]:h-[8px] data-[side=right]:w-[5px] data-[side=right]:[clip-path:polygon(100%_0,100%_100%,0_50%)]",
  "data-[side=inline-end]:right-full data-[side=inline-end]:h-[8px] data-[side=inline-end]:w-[5px] data-[side=inline-end]:[clip-path:polygon(100%_0,100%_100%,0_50%)]",
);

function TooltipContent({
  className,
  children,
  align = "center",
  alignOffset = 0,
  side = "top",
  sideOffset = 5,
  container,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> &
  Pick<React.ComponentProps<typeof TooltipPrimitive.Positioner>, "align" | "alignOffset" | "side" | "sideOffset"> &
  Pick<React.ComponentProps<typeof TooltipPrimitive.Portal>, "container">) {
  const ctx = React.useContext(TooltipContainerContext);
  return (
    <TooltipPrimitive.Portal container={container ?? ctx?.container ?? undefined}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        // Acima do Dialog/Sheet/Popover (z-50): uma dica sobre o botão de
        // dentro de um modal não pode ficar escondida atrás dele.
        className="isolate z-[60]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "max-w-[233px] rounded-control bg-ink px-3 py-2 font-sans text-sm text-background",
            "origin-(--transform-origin) transition-[opacity,scale] duration-[125ms] ease-[var(--ease-out)]",
            "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-100",
            // Pulou de outra dica aberta (ou reabriu logo após fechar): sem transição.
            "data-instant:transition-none",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow data-slot="tooltip-arrow" className={arrowClassName} />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
