"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui-components/react/menu";
import { cn } from "@adinkra/core";

/**
 * Menu suspenso de ações sobre o Base UI Menu (mesma base de
 * @adinkra/navigation-menu e do Popover do date-picker): teclado completo
 * (setas, Home/End, digitar pra buscar, Enter/Espaço, Esc, seta direita/
 * esquerda nos submenus) e foco gerido pelo primitivo.
 *
 * Visual: o painel é um "cartão único" (borda + sombra dura + `bg-surface`).
 * Os itens não têm borda nem sombra — são linhas de lista, tratamento ghost.
 * O item destacado (mouse OU teclado, `data-highlighted`) inverte pra
 * `bg-accent`/`text-accent-foreground` (marinho no dia, névoa na noite,
 * contraste 12.5:1 nos dois). Não usa `--primary`: aqui não há "estado
 * ligado" de item pra confundir com o destaque — o ligado dos itens de
 * marcar/rádio é o próprio ícone (check/ponto).
 *
 * Movimento: o menu abre dezenas de vezes por dia, então só uma entrada
 * curta — 130ms, escala 0.96 + fade, nascendo do gatilho
 * (`--transform-origin`), saída 100ms. Itens NÃO animam além da cor
 * (transição só em `color`/`background-color`, e nem isso no destaque: ele
 * acompanha o teclado, tem que ser instantâneo). `prefers-reduced-motion`
 * já é tratado globalmente em tokens.css.
 */

/** Container do Portal: acha o `data-theme` mais próximo do gatilho. */
const ContainerContext = React.createContext<{
  container: HTMLElement | null;
  register: (node: HTMLElement | null) => void;
} | null>(null);

/** Só pra `DropdownMenuLabel` saber se está dentro de um `DropdownMenuGroup`. */
const GroupContext = React.createContext(false);

/**
 * `MenuPrimitive.Root` não renderiza DOM próprio, então o `container` do
 * Portal (armadilha 4, DECISOES.md: o portal escapa pro <body>, fora de um
 * `data-theme` posto numa div ancestral, ex. o <Preview> da documentação) é
 * achado a partir do DOM do Trigger, o único pedaço garantido montado antes
 * do painel abrir. Mesmo truque de packages/date-picker/src/popover.tsx.
 */
function DropdownMenu({
  children,
  ...props
}: Omit<React.ComponentProps<typeof MenuPrimitive.Root>, "children"> & { children?: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const register = React.useCallback((node: HTMLElement | null) => {
    setContainer(node?.closest<HTMLElement>("[data-theme]") ?? null);
  }, []);

  return (
    <MenuPrimitive.Root {...props}>
      <ContainerContext.Provider value={{ container, register }}>{children}</ContainerContext.Provider>
    </MenuPrimitive.Root>
  );
}

function DropdownMenuTrigger({ ref, ...props }: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  const ctx = React.useContext(ContainerContext);
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      ref={(node: HTMLElement | null) => {
        ctx?.register(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      {...props}
    />
  );
}

// Classes do painel, compartilhadas entre o menu raiz e os submenus.
const popupClassName = cn(
  "min-w-40 max-w-(--available-width) overflow-y-auto rounded-control border-[length:var(--border-width)] border-ink bg-surface p-1 font-display text-foreground shadow-brutal outline-none",
  // Nasce do gatilho e some mais rápido do que entra (abrir é o gesto, fechar é limpeza).
  "origin-(--transform-origin) transition-[opacity,scale] duration-[130ms] ease-[var(--ease-out)]",
  "data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0",
  "data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:duration-100",
);

type PositionerProps = Pick<
  React.ComponentProps<typeof MenuPrimitive.Positioner>,
  "align" | "alignOffset" | "side" | "sideOffset"
>;

function DropdownMenuContent({
  className,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & PositionerProps) {
  const ctx = React.useContext(ContainerContext);
  return (
    <MenuPrimitive.Portal container={ctx?.container ?? undefined}>
      <MenuPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
        <MenuPrimitive.Popup data-slot="dropdown-menu-content" className={cn(popupClassName, className)} {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

// Base compartilhada por item, item de marcar, item de rádio e gatilho de submenu.
const itemClassName = cn(
  "relative flex h-8 cursor-default select-none items-center gap-2 rounded-control px-2.5 text-sm text-foreground outline-none",
  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
  "[&_svg]:pointer-events-none [&_svg]:flex-none",
);

const destructiveClassName = cn(
  "text-destructive",
  "data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground",
);

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  /** `destructive` para ações irreversíveis (excluir, sair); nunca sozinho, sempre com texto claro. */
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(itemClassName, variant === "destructive" && destructiveClassName, className)}
      {...props}
    />
  );
}

function DropdownMenuGroup({ children, ...props }: React.ComponentProps<typeof MenuPrimitive.Group>) {
  return (
    <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}>
      <GroupContext.Provider value={true}>{children}</GroupContext.Provider>
    </MenuPrimitive.Group>
  );
}

/**
 * Rótulo de seção. Dentro de um `DropdownMenuGroup` vira o nome acessível do
 * grupo (Base UI `GroupLabel`, que lança erro fora de um grupo); fora dele é
 * só texto decorativo, sem semântica.
 */
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  const inGroup = React.useContext(GroupContext);
  const classes = cn("px-2.5 py-1.5 font-display text-xs font-medium text-muted-foreground", className);
  if (inGroup) {
    return <MenuPrimitive.GroupLabel data-slot="dropdown-menu-label" className={classes} {...props} />;
  }
  return <div data-slot="dropdown-menu-label" role="presentation" className={classes} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-[var(--border-width)] bg-ink", className)}
      {...props}
    />
  );
}

// Traços no mesmo estilo (viewBox 16x16) dos outros ícones de controle do sistema.
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M6.5 4 10.5 8 6.5 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Espaço reservado à esquerda pro indicador (check/ponto), aparece só quando marcado.
const indicatorClassName = "absolute left-2 flex size-4 items-center justify-center";

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(itemClassName, "pl-8", className)}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className={indicatorClassName}>
        <CheckIcon />
      </MenuPrimitive.CheckboxItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props: React.ComponentProps<typeof MenuPrimitive.RadioGroup>) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(itemClassName, "pl-8", className)}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className={indicatorClassName}>
        <DotIcon />
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

/** Raiz de um submenu; vai dentro de um `DropdownMenuContent`. */
function DropdownMenuSub(props: React.ComponentProps<typeof MenuPrimitive.SubmenuRoot>) {
  return <MenuPrimitive.SubmenuRoot {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.SubmenuTrigger>) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      // Mantém o destaque enquanto o submenu está aberto (`data-popup-open`),
      // senão o item pai perderia a cor ao mover o mouse pro submenu.
      className={cn(itemClassName, "data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground", className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  align = "start",
  alignOffset = -5,
  side = "right",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & PositionerProps) {
  const ctx = React.useContext(ContainerContext);
  return (
    <MenuPrimitive.Portal container={ctx?.container ?? undefined}>
      <MenuPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
        <MenuPrimitive.Popup data-slot="dropdown-menu-sub-content" className={cn(popupClassName, className)} {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
