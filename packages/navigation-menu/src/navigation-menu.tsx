"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui-components/react/navigation-menu";
import { cn } from "@adinkra/core";

/**
 * Baseado no Navigation Menu do neobrutalism.dev (mesma base técnica —
 * Base UI — já usada como referência de padrão de interface no resto do
 * sistema), adaptado pros nossos tokens (15/09/2026). Primeira peça do
 * design system a depender de uma lib de UI externa — decisão explícita do
 * usuário: o posicionamento flutuante/portal/animação entre painéis é
 * grande demais pra reconstruir do zero (diferente do @adinkra/sidebar, que
 * fazia sentido sem dependência por ser bem mais simples).
 *
 * Vocabulário de estado reaproveitado do resto do sistema, não inventado
 * aqui: hover = `bg-card` (mesmo do SidebarMenuButton), aberto/ativo =
 * `bg-secondary`/`text-secondary-foreground` (mesmo "isto está ligado" do
 * Toggle e do grupo aberto da Sidebar — céu/primary fica reservado à ação
 * principal, regra 6). Sem borda/sombra no trigger (é navegação, tratamento
 * ghost, não uma ação) — só o painel flutuante (Popup) leva
 * borda+raio+sombra, como qualquer "cartão único" do sistema.
 */
function NavigationMenu({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  // O painel flutuante (Viewport) é portalado pro <body> por padrão — escapa
  // de qualquer `data-theme` posto num ancestral que não seja o <html>
  // (armadilha 4, DECISOES.md: o seletor `[data-theme="dark"]` só casa
  // dentro da árvore DOM de quem o carrega). O <Preview> de cada página de
  // componente usa exatamente esse padrão (`data-theme` numa div local, pra
  // mostrar dia/noite lado a lado), então sem isto o painel do dropdown
  // nunca escurecia junto do resto. Acha o ancestral com `data-theme` mais
  // próximo do root e portala pra dentro dele; sem nenhum (site real, tema
  // só no <html>), cai no padrão (undefined → <body>).
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const rootRef = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <NavigationMenuPrimitive.Root
      ref={rootRef}
      data-slot="navigation-menu"
      className={cn(
        "group/navigation-menu relative z-10 flex max-w-max flex-1 items-center justify-center rounded-control border-[length:var(--border-width)] border-ink bg-surface p-1 font-display",
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuViewport container={container ?? undefined} />
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1 font-display", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />;
}

function navigationMenuTriggerStyle() {
  return cn(
    "group inline-flex h-9 w-max items-center justify-center gap-1 rounded-control px-3.5 py-2",
    "font-display text-sm text-foreground transition-colors",
    "hover:bg-card",
    "data-popup-open:bg-secondary data-popup-open:text-secondary-foreground",
    "data-active:bg-secondary data-active:text-secondary-foreground",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-45 data-disabled:pointer-events-none data-disabled:opacity-45",
  );
}

// Mesmo traço (viewBox 16x16, strokeWidth 1.3) do resto dos ícones de
// controle do sistema (ex.: ChevronsUpDownIcon do cabeçalho da sidebar) —
// não usa lucide-react, que já foi removido do projeto por não ter nenhum
// outro uso.
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger data-slot="navigation-menu-trigger" className={cn(navigationMenuTriggerStyle(), "group", className)} {...props}>
      {children}
      <ChevronDownIcon className="relative top-px transition-transform duration-200 group-data-popup-open:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "h-full w-auto p-2 transition-[opacity,transform,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-starting-style:opacity-0 data-ending-style:opacity-0",
        "data-starting-style:data-[activation-direction=left]:translate-x-[-50%] data-starting-style:data-[activation-direction=right]:translate-x-[50%]",
        "data-ending-style:data-[activation-direction=left]:translate-x-[50%] data-ending-style:data-[activation-direction=right]:translate-x-[-50%]",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "block select-none space-y-1 rounded-control p-2 leading-none text-foreground no-underline transition-colors",
        "hover:bg-card",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuViewport({
  className,
  container,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport> &
  Pick<React.ComponentProps<typeof NavigationMenuPrimitive.Positioner>, "align" | "alignOffset" | "side" | "sideOffset"> &
  Pick<React.ComponentProps<typeof NavigationMenuPrimitive.Portal>, "container">) {
  return (
    <NavigationMenuPrimitive.Portal container={container}>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none"
      >
        {/*
          shadow-brutal aqui, não no trigger — o painel flutuante é um
          "cartão único" (regra do sistema: aside/panel/feature levam
          borda+raio+sombra; grades repetidas não). Sem estados de
          hover/press: não é uma superfície pressionável, só um painel.
        */}
        <NavigationMenuPrimitive.Popup
          data-slot="navigation-menu-popup"
          className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-control border-[length:var(--border-width)] border-ink bg-surface text-foreground shadow-brutal outline-none transition-[opacity,transform,width,height,scale,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-starting-style:scale-90 data-starting-style:opacity-0 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-150"
        >
          <NavigationMenuPrimitive.Viewport
            data-slot="navigation-menu-viewport"
            className={cn("relative size-full overflow-hidden", className)}
            {...props}
          />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Icon>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={cn("flex items-center justify-center transition-transform duration-200 data-popup-open:rotate-180", className)}
      {...props}
    />
  );
}

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
