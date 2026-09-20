// O banner do tsup.config.ts só cobre o build publicado (dist/); o
// desenvolvimento no workspace lê este arquivo-fonte direto (package.json
// aponta "exports" pra src/index.ts), então a diretiva precisa estar aqui
// também — sem ela, o Next tenta avaliar createContext() como se este fosse
// um módulo de servidor comum e quebra ("createContext is not a function").
"use client";

import * as React from "react";
import { cn } from "@adinkra/core";
import { useIsMobile } from "./use-mobile";

/**
 * Navegação lateral colapsável, no espírito do sidebar do shadcn/ui:
 * https://ui.shadcn.com/docs/components/base/sidebar — reconstruído aqui em
 * cima dos tokens do Adinkra, sem depender do shadcn nem do Base UI (é só
 * contexto + CSS, não precisa de um primitivo de terceiro para isso).
 *
 * Implementado: modo "icon" (recolhe para só os ícones), atalho de teclado
 * (Cmd/Ctrl+B), persistência em cookie, submenu recolhível (SidebarMenuSub),
 * gaveta (Sheet) para mobile, SidebarMenuBadge/SidebarMenuAction e
 * SidebarRail.
 */

export const SIDEBAR_COOKIE_NAME = "adinkra_sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3.25rem";

type SidebarState = "expanded" | "collapsed";

interface SidebarContextValue {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** true abaixo de 768px — ver ./use-mobile.ts. */
  isMobile: boolean;
  /** Estado da gaveta (Sheet) em mobile — independente de `open`, que é só o estado desktop. */
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar precisa ser chamado dentro de um <SidebarProvider>.");
  }
  return context;
}

export interface SidebarProviderProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Estado inicial quando não controlado — normalmente lido de um cookie no servidor, para não piscar. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const isMobile = useIsMobile();
  // Estado da gaveta mobile é separado do `open` desktop de propósito: os
  // dois nunca deveriam interferir um no outro (trocar de mobile pra desktop
  // não deve abrir a gaveta, nem o contrário). Começa fechado (false) — sem
  // isso não haveria flash de "aberto" no primeiro layout mobile, então não
  // precisa de nenhum efeito de correção como o `open` desktop precisa.
  const [openMobile, setOpenMobile] = React.useState(false);

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      } else {
        setInternalOpen(value);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [onOpenChange],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
    } else {
      setOpen(!open);
    }
  }, [isMobile, open, setOpen]);

  // Lê o cookie só depois de montar, não durante a renderização inicial —
  // de propósito. Ler no servidor (cookies() do Next) evitaria o flash de
  // um frame para quem já recolheu o menu antes, mas tira a rota inteira da
  // geração estática (SSG vira renderização por requisição). Como este é um
  // site de documentação, geração estática vale mais que esse único frame.
  React.useEffect(() => {
    if (openProp !== undefined) return; // controlado por fora: não interfere
    const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=(true|false)`));
    if (match) {
      const saved = match[1] === "true";
      if (saved !== defaultOpen) setInternalOpen(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Fecha a gaveta mobile sozinha quando a tela deixa de ser mobile — sem
  // isso, redimensionar a janela (ou girar o aparelho) pra desktop com a
  // gaveta aberta deixaria `openMobile` preso em true, sem efeito nenhum ali,
  // mas pronto pra reaparecer se a tela voltasse a ficar estreita.
  React.useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile]);

  const state: SidebarState = open ? "expanded" : "collapsed";

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn("flex min-h-screen w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export interface SidebarProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * "icon" recolhe para uma faixa só de ícones; "offcanvas" recolhe até
   * largura zero (nada fica visível — pensado pra navegação só de texto,
   * sem ícone por item, onde uma faixa de ícones vazios não faz sentido);
   * "none" fica sempre expandido, sem recolher.
   */
  collapsible?: "icon" | "offcanvas" | "none";
}

export function Sidebar({ collapsible = "icon", className, children, ...props }: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();

  // Fecha a gaveta com Esc — o resto do teclado (Tab, Enter) já funciona de
  // graça por ser HTML nativo; só o fechamento por teclado precisa de ajuda,
  // já que não há um <dialog> nativo por trás disso.
  React.useEffect(() => {
    if (!isMobile || !openMobile) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMobile(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, openMobile, setOpenMobile]);

  if (isMobile) {
    return (
      <>
        {/* Sempre montado: o fade acompanha a gaveta nos dois sentidos.
            Fechado, sai do foco (tabIndex/aria-hidden) e não recebe clique. */}
        <button
          type="button"
          aria-label="Fechar menu"
          aria-hidden={openMobile ? undefined : true}
          tabIndex={openMobile ? 0 : -1}
          onClick={() => setOpenMobile(false)}
          className={cn(
            "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 ease-[var(--ease-out)]",
            openMobile ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
        <div
          data-slot="sidebar"
          data-mobile="true"
          data-state={openMobile ? "expanded" : "collapsed"}
          className={cn(
            "group/sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-none flex-col overflow-hidden",
            "border-r-[length:var(--border-width)] border-ink bg-surface",
            "transition-transform duration-[250ms] ease-[var(--ease-drawer)]",
            openMobile ? "translate-x-0" : "-translate-x-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }

  const isOffcanvasCollapsed = collapsible === "offcanvas" && state === "collapsed";

  return (
    <div
      data-slot="sidebar"
      data-state={collapsible === "none" ? "expanded" : state}
      className={cn(
        "group/sidebar sticky top-0 flex h-screen flex-none flex-col overflow-hidden bg-surface",
        // Borda externa em negrito (a tinta), separadores internos ficam
        // finos (--hairline) — hierarquia: o painel inteiro é a "peça",
        // as divisões dentro dele são só organização (seção 4, DECISOES.md).
        // Some junto com a largura no modo offcanvas recolhido — sem isso a
        // borda (box-sizing: border-box) forçaria uns pixels de largura
        // mínima, e a faixa nunca chegaria a ficar de fato invisível.
        isOffcanvasCollapsed ? "border-r-0" : "border-r-[length:var(--border-width)] border-ink",
        collapsible !== "none" && "transition-[width] duration-200",
        collapsible === "none" || state === "expanded"
          ? "w-[var(--sidebar-width)]"
          : collapsible === "offcanvas"
            ? "w-0"
            : "w-[var(--sidebar-width-icon)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 border-b-[length:var(--border-width)] border-ink p-3", className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden p-3", className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 p-3", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn(
        "flex flex-col gap-1",
        // -mx-3/px-3 cancela e repõe o p-3 do SidebarContent — sem isso a
        // borda ficaria inset (só a largura do conteúdo), não de ponta a
        // ponta da sidebar. Aplicado sempre (não só :not(:first-child)) pra
        // o primeiro grupo não ficar desalinhado dos outros.
        "-mx-3 px-3",
        // Separação mais forte entre um grupo e o seguinte do que só o
        // rótulo pequeno dava: uma linha grossa (mesma espessura/cor do
        // border-b do SidebarHeader) por cima de cada grupo, menos o
        // primeiro (esse já encosta no header, não precisa de nada acima).
        // Fica aqui no pacote, não em cada app que consome — vale pra
        // qualquer sidebar com mais de um grupo, não só a deste site.
        "[&:not(:first-child)]:border-t-[length:var(--border-width)] [&:not(:first-child)]:border-ink [&:not(:first-child)]:pt-4",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "select-none whitespace-nowrap px-2 font-display text-xs font-medium text-muted-foreground",
        "transition-opacity duration-150",
        "group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("grid gap-0.5", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("grid gap-2", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  // relative + group/menu-item: base pra SidebarMenuBadge/SidebarMenuAction,
  // que se posicionam por cima do botão do item e (no caso de Action com
  // showOnHover) reagem a hover/foco deste <li>, não do botão em si.
  return <li data-slot="sidebar-menu-item" className={cn("group/menu-item relative", className)} {...props} />;
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="sidebar-menu-badge"
      className={cn(
        "pointer-events-none absolute right-2 top-1/2 flex h-5 min-w-5 -translate-y-1/2 select-none items-center justify-center",
        "rounded-control px-1 font-mono text-[10px] font-medium text-muted-foreground",
        // Some junto com o rótulo de texto quando a sidebar recolhe a ícones
        // — não sobra espaço pra badge numa faixa de só ícone.
        "group-data-[state=collapsed]/sidebar:hidden",
        className,
      )}
      {...props}
    />
  );
}

export interface SidebarMenuActionProps extends React.ComponentPropsWithoutRef<"button"> {
  /** Só aparece no hover/foco do item (em vez de sempre visível) — para ações secundárias (ex.: "mais opções"). */
  showOnHover?: boolean;
}

export const SidebarMenuAction = React.forwardRef<HTMLButtonElement, SidebarMenuActionProps>(
  ({ showOnHover, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-slot="sidebar-menu-action"
        className={cn(
          "absolute right-1 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-control text-muted-foreground",
          "hover:bg-card hover:text-foreground",
          "group-data-[state=collapsed]/sidebar:hidden",
          showOnHover &&
            "opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 focus-visible:opacity-100",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuAction.displayName = "SidebarMenuAction";

// Fallback pra quem não passa `icon` (17/09/2026, pedido do usuário) —
// quadrado neutro, não um ícone de verdade: sem ele, a faixa recolhida a
// ícones (`collapsible="icon"`) ficaria com linhas em branco pra quem não
// tem símbolo escolhido. `bg-current` herda a cor do texto ao redor
// (`text-foreground`/`text-heading`, conforme o estado), sem token novo.
function DefaultMenuIcon() {
  return <span aria-hidden className="block size-2.5 rounded-[2px] bg-current" />;
}

export interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  isActive?: boolean;
  /** Texto mostrado como title quando o sidebar está recolhido a ícones. */
  tooltip?: string;
  icon?: React.ReactNode;
  /**
   * Elemento a renderizar no lugar do <button> nativo (ex.: <Link>), no
   * mesmo espírito do prop `render` do Base UI — sem depender do Base UI.
   */
  render?: React.ReactElement<Record<string, unknown>>;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ isActive, tooltip, icon, render, className, children, ...props }, ref) => {
    const { state } = useSidebar();

    const content = (
      <span
        data-active={isActive || undefined}
        className={cn(
          "flex w-full items-center gap-2.5 overflow-hidden rounded-control px-2 py-1.5",
          "font-display text-sm text-foreground",
          "hover:bg-card",
          // O item ativo ganha um contorno de tinta (não borda: outline não
          // desloca layout quando aparece) — é a marca da versão do item
          // ativo em neobrutalism.dev, sem depender do céu (que fica
          // reservado à ação principal, decisão 4/regra 6, DECISOES.md).
          "data-[active]:bg-card data-[active]:font-medium data-[active]:text-heading",
          // outline-[length:...] já inclui outline-style sozinho (o Tailwind
          // v4 empacota os dois numa utilidade de largura) — não precisa da
          // classe "outline" solta, que o cn() só descartaria como redundante.
          "data-[active]:outline-[length:var(--border-width)] data-[active]:outline-ink",
          className,
        )}
      >
        <span className="flex size-4 flex-none items-center justify-center [&>svg]:size-4">{icon ?? <DefaultMenuIcon />}</span>
        <span className="truncate group-data-[state=collapsed]/sidebar:hidden">{children}</span>
      </span>
    );

    const sharedProps = {
      ref,
      title: state === "collapsed" ? tooltip : undefined,
      "aria-current": isActive ? ("page" as const) : undefined,
      ...props,
    };

    if (render) {
      return React.cloneElement(render, sharedProps, content);
    }

    return (
      <button type="button" className="block w-full text-left" {...sharedProps}>
        {content}
      </button>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export function SidebarTrigger({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const expanded = isMobile ? openMobile : state === "expanded";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={expanded ? "Recolher menu" : "Expandir menu"}
      className={cn(
        // Tratamento "ghost" de propósito (seção 4, DECISOES.md) — controle
        // de utilidade, não uma ação: sem borda nem sombra dura.
        "grid size-7 flex-none place-items-center rounded-control text-muted-foreground",
        "hover:bg-card hover:text-foreground",
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}

/**
 * Faixa fina na borda da sidebar (desktop) que alterna expandido/recolhido
 * ao clicar — um alvo de clique maior e sempre visível, complementar ao
 * <SidebarTrigger/> (que normalmente fica só no header). Renderizar como
 * filho de <Sidebar>, que já é `position: sticky` (estabelece o bloco de
 * contenção para o `absolute` aqui). Não faz sentido em mobile (lá quem
 * fecha é o backdrop ou o Esc), então não renderiza nada nesse caso.
 */
export function SidebarRail({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  const { toggleSidebar, isMobile } = useSidebar();

  if (isMobile) return null;

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Alternar sidebar"
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 right-0 z-10 w-3 -translate-x-1/2 cursor-col-resize",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors",
        "hover:after:bg-ink",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Submenu recolhível — um <SidebarMenuItem> com uma lista aninhada por
 * baixo, no espírito do sidebar do neobrutalism.dev
 * (https://www.neobrutalism.dev/docs/sidebar). Implementado com
 * <details>/<summary> nativo de propósito: abrir/fechar, teclado (Enter e
 * Espaço) e o estado para leitor de tela já vêm de graça do navegador — não
 * precisa de useState nem de nenhuma lib de accordion só para isso.
 *
 * Limitação conhecida: com a sidebar recolhida a ícones, o grupo ainda pode
 * ser clicado (o <details> abre/fecha por baixo dos panos), mas o submenu
 * continua escondido — não vira um menu flutuante. Ver DECISOES.md.
 */
export interface SidebarMenuCollapsibleProps extends React.ComponentPropsWithoutRef<"details"> {
  defaultOpen?: boolean;
}

export function SidebarMenuCollapsible({ defaultOpen, className, ...props }: SidebarMenuCollapsibleProps) {
  return <details open={defaultOpen} className={cn("group/collapsible", className)} {...props} />;
}

export interface SidebarMenuCollapsibleTriggerProps extends React.ComponentPropsWithoutRef<"summary"> {
  icon?: React.ReactNode;
}

export function SidebarMenuCollapsibleTrigger({
  icon,
  className,
  children,
  ...props
}: SidebarMenuCollapsibleTriggerProps) {
  return (
    <summary
      className={cn(
        "flex w-full cursor-pointer list-none items-center gap-2.5 overflow-hidden rounded-control px-2 py-1.5",
        "font-display text-sm text-foreground [&::-webkit-details-marker]:hidden",
        "transition-colors duration-150",
        "hover:bg-card",
        // Aberto ganha --primary laranja (17/09, era o "ligado" --secondary
        // do Toggle — trocado junto na mesma leva, pedido do usuário).
        "group-open/collapsible:bg-primary group-open/collapsible:font-medium group-open/collapsible:text-primary-foreground",
        "group-open/collapsible:hover:bg-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    >
      <span className="flex size-4 flex-none items-center justify-center [&>svg]:size-4">{icon ?? <DefaultMenuIcon />}</span>
      <span className="flex-1 truncate group-data-[state=collapsed]/sidebar:hidden">{children}</span>
      <svg
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        aria-hidden="true"
        className="flex-none text-foreground transition-transform duration-150 group-open/collapsible:rotate-90 group-open/collapsible:text-primary-foreground group-data-[state=collapsed]/sidebar:hidden"
      >
        <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </summary>
  );
}

export function SidebarMenuSub({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn(
        "ml-3.5 grid gap-0.5 border-l-[length:var(--border-width)] border-hairline py-0.5 pl-3",
        "group-data-[state=collapsed]/sidebar:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("pt-[3px]", className)} {...props} />;
}

export interface SidebarMenuSubButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  isActive?: boolean;
  render?: React.ReactElement<Record<string, unknown>>;
}

export const SidebarMenuSubButton = React.forwardRef<HTMLButtonElement, SidebarMenuSubButtonProps>(
  ({ isActive, render, className, children, ...props }, ref) => {
    const content = (
      <span
        data-active={isActive || undefined}
        className={cn(
          "flex w-full items-center overflow-hidden rounded-control px-2 py-1",
          "font-display text-sm text-muted-foreground",
          "hover:bg-card hover:text-foreground",
          "data-[active]:bg-card data-[active]:font-medium data-[active]:text-heading",
          "data-[active]:outline-[length:var(--border-width)] data-[active]:outline-ink",
          className,
        )}
      >
        <span className="truncate">{children}</span>
      </span>
    );

    const sharedProps = { ref, "aria-current": isActive ? ("page" as const) : undefined, ...props };

    if (render) {
      return React.cloneElement(render, sharedProps, content);
    }

    return (
      <button type="button" className="block w-full text-left" {...sharedProps}>
        {content}
      </button>
    );
  },
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
