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

function TooltipContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "top",
  sideOffset = 6,
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
            "max-w-xs rounded-control bg-ink px-2.5 py-1.5 font-sans text-xs leading-snug text-background",
            "origin-(--transform-origin) transition-[opacity,scale] duration-[125ms] ease-[var(--ease-out)]",
            "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-100",
            // Pulou de outra dica aberta (ou reabriu logo após fechar): sem transição.
            "data-instant:transition-none",
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
