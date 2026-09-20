"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArcLogo } from "@adinkra/arc-text";
import { SankofaSwirlIcon } from "@adinkra/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleTrigger,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@adinkra/sidebar";
import { nav } from "../config/nav";
import { T, useLang } from "./language";
import type { MessageKey } from "../i18n/pt";

// Título do grupo em config/nav.ts (português) → chave de i18n.
const groupTitleKey: Record<string, MessageKey> = {
  Primitivos: "sidebar.group.primitives",
  Navegação: "sidebar.group.navigation",
  Formulário: "sidebar.group.form",
  Feedback: "sidebar.group.feedback",
  Camadas: "sidebar.group.layers",
  Conteúdo: "sidebar.group.content",
  Sistema: "sidebar.group.system",
};

export interface AppSidebarProps {
  /** Repassado para o <Sidebar> interno — usado pra encolher a demo na página de documentação do próprio componente. */
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps = {}) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const { t } = useLang();

  return (
    // "icon" (17/09, era "offcanvas" — sem ícone por item, uma faixa
    // recolhida só de ícones sobraria vazia; ver DECISOES.md). Nenhum item
    // daqui passa `icon`: o próprio @adinkra/sidebar desenha um quadrado
    // neutro (`DefaultMenuIcon`) quando a prop não vem, então a faixa
    // recolhida fica utilizável sem escolher um símbolo Adinkra por item.
    // Sub-itens (Button, Input...) continuam sem ícone/quadrado — limitação
    // conhecida, submenu não vira flutuante recolhido.
    <Sidebar collapsible="icon" className={className}>
      <SidebarContent>
        {/*
          SidebarHeader movido pra dentro do SidebarContent (pedido do
          usuário, 15/09/2026: "ele não vai ser fixo, ele vai se mover
          também quando o scroll tiver disponível") — como SidebarContent é
          a única região com overflow-y-auto, um SidebarHeader fora dela
          fica preso no topo; aqui dentro ele rola junto com o resto do
          menu.
        */}
        <SidebarHeader className="-mx-3 -mt-3 px-3">
          {/* ArcLogo no lugar do wordmark (mesma composição da home). Ele mede
              size×size, não cabe na faixa recolhida (3.25rem) — nesse estado
              (só no desktop; no mobile a sidebar abre expandida) volta o
              ícone pequeno. */}
          <Link
            href="/"
            aria-label="Adinkra — página inicial"
            className="flex items-center justify-center rounded-control border-[length:var(--border-width)] border-transparent py-1.5 hover:border-ink hover:bg-card"
          >
            {collapsed ? (
              <SankofaSwirlIcon role="img" aria-label="Sankofa" className="size-5 flex-none text-brand" />
            ) : (
              <ArcLogo
                text="Design System"
                brandText="Adinkra"
                year="2026"
                size={200}
                arc={60}
                tailLength={1.5}
                logoY={0.35}
                icon="sankofa-swirl"
                parallax={false}
                filled
                rayDistance={1}
                showRays
              />
            )}
          </Link>
        </SidebarHeader>

        {/*
          Grupo sem rótulo, antes de "Componentes" — Getting Started e
          Introduction são páginas de orientação, não fazem parte da lista de
          componentes (pedido do usuário, 15/09/2026).

          className cancela a borda-topo que o pacote aplica via
          `:not(:first-child)` — desde que o SidebarHeader passou a ser o
          primeiro filho de SidebarContent (ver comentário acima), este é o
          segundo filho, e ganharia uma linha extra em cima da que já vem do
          border-b do próprio header.
        */}
        <SidebarGroup className="[&:not(:first-child)]:border-t-0 [&:not(:first-child)]:pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/getting-started"} render={<Link href="/getting-started" />}>
                  <T k="common.gettingStarted" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/introduction"} render={<Link href="/introduction" />}>
                  <T k="common.introduction" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/*
          Um SidebarGroup só ("Componentes"), não um por categoria — as
          categorias (Primitivos/Navegação/Formulário) viraram
          SidebarMenuCollapsible aninhados dentro dele, em vez de cada uma
          ser o próprio SidebarGroup com sua linha divisória (pedido do
          usuário, 15/09/2026: "eu quero um SidebarGroup pra todos os
          componentes").
        */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <T k="common.components" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((group) => (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuCollapsible>
                    <SidebarMenuCollapsibleTrigger>{groupTitleKey[group.title] ? t(groupTitleKey[group.title]!) : group.title}</SidebarMenuCollapsibleTrigger>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const href = `/components/${item.slug}`;
                        const isActive = pathname === href;
                        const isPlanned = item.status === "planejado";

                        return (
                          <SidebarMenuSubItem key={item.slug}>
                            {isPlanned ? (
                              <span className="flex w-full items-center justify-between gap-2 rounded-control px-2 py-1 font-display text-sm text-muted-foreground">
                                <span className="truncate">{item.title}</span>
                                <span className="font-display text-[0.625rem] uppercase tracking-wide"><T k="common.comingSoon" /></span>
                              </span>
                            ) : (
                              <SidebarMenuSubButton isActive={isActive} render={<Link href={href} />}>
                                {item.title}
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuCollapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <T k="common.resources" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/symbols"} render={<Link href="/symbols" />}>
                  <T k="common.symbols" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Mock com todos os jeitos de usar @adinkra/sidebar num lugar só — não é
 * navegação de verdade (dados fabricados), não é renderizado em nenhuma
 * rota por padrão. Serve de referência rápida pra quem for consumir o
 * pacote: cada bloco é independente (o próprio <SidebarProvider>), então
 * dá pra copiar um bloco isolado sem arrastar os outros junto.
 */

const mockItems = [
  { key: "demo.sidebar.overview", slug: "overview" },
  { key: "demo.sidebar.reports", slug: "reports" },
  { key: "demo.sidebar.settings", slug: "settings" },
] as const;

/**
 * Preview "hero" no topo de content/components/sidebar.mdx — mock, dados
 * fabricados, mesmo espírito dos exemplos abaixo (não o AppSidebar de
 * verdade do site). Antes era o AppSidebar real encolhido via className;
 * trocado por pedido do usuário (15/09/2026) pra não misturar a
 * demonstração com a navegação de verdade da própria página que a exibe.
 */
export function SidebarShowcase() {
  const { t } = useLang();
  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
      className="relative h-full min-h-0"
    >
      <Sidebar collapsible="offcanvas" className="relative">
        <SidebarHeader>
          <p className="px-1 font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("demo.sidebar.product")}
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("demo.sidebar.panel")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mockItems.map((item, index) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton isActive={index === 0}>{t(item.key)}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t("demo.sidebar.team")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>{t("demo.sidebar.members")}</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>{t("demo.sidebar.permissions")}</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">{t("demo.sidebar.pageContent")}</div>
    </SidebarProvider>
  );
}

function ExampleBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="font-display text-sm font-medium text-heading">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="h-64 overflow-hidden rounded-card border-[length:var(--border-width)] border-ink">
        {children}
      </div>
    </div>
  );
}

// Só pra este mock — ícone de exemplo genérico. A navegação real do site
// (AppSidebar, acima) decidiu não usar ícone por item (ver DECISOES.md);
// isso não muda essa decisão, só ilustra o modo "icon" do pacote para quem
// for consumi-lo com ícones de verdade.
function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="currentColor" />
    </svg>
  );
}

function BasicExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarHeader>
          <p className="px-1 font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("demo.sidebar.product")}
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("demo.sidebar.panel")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mockItems.map((item, index) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton isActive={index === 0}>{t(item.key)}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="px-1 text-xs text-muted-foreground">{t("demo.sidebar.freeFooter")}</p>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">{t("demo.sidebar.pageContent")}</div>
    </SidebarProvider>
  );
}

function SubmenuExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuCollapsible defaultOpen>
                <SidebarMenuCollapsibleTrigger>{t("common.components")}</SidebarMenuCollapsibleTrigger>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive>Button</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>Input</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>Badge</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuCollapsible>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">{t("demo.sidebar.pageContent")}</div>
    </SidebarProvider>
  );
}

function BadgeAndActionExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>{t("demo.sidebar.notifications")}</SidebarMenuButton>
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>{t("demo.sidebar.projects")}</SidebarMenuButton>
              <SidebarMenuAction showOnHover aria-label={t("demo.sidebar.moreOptions")}>
                ···
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">{t("demo.sidebar.hoverSecond")}</div>
    </SidebarProvider>
  );
}

function CollapseModesExample() {
  const { t } = useLang();
  return (
    <div className="grid h-full grid-cols-3 divide-x-[length:var(--border-width)] divide-ink">
      <SidebarProvider defaultOpen className="h-full min-h-0">
        <Sidebar collapsible="icon" className="relative">
          <SidebarHeader>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mockItems.map((item, index) => (
                <SidebarMenuItem key={item.slug}>
                  <SidebarMenuButton isActive={index === 0} icon={<DotIcon />}>
                    {t(item.key)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 overflow-auto p-3 text-[0.6875rem] text-muted-foreground">icon</div>
      </SidebarProvider>
      <SidebarProvider defaultOpen className="h-full min-h-0">
        <Sidebar collapsible="offcanvas" className="relative">
          <SidebarHeader>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mockItems.map((item, index) => (
                <SidebarMenuItem key={item.slug}>
                  <SidebarMenuButton isActive={index === 0}>{t(item.key)}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <div className="flex-1 overflow-auto p-3 text-[0.6875rem] text-muted-foreground">offcanvas</div>
      </SidebarProvider>
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="relative">
          <SidebarContent>
            <SidebarMenu>
              {mockItems.map((item, index) => (
                <SidebarMenuItem key={item.slug}>
                  <SidebarMenuButton isActive={index === 0}>{t(item.key)}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 overflow-auto p-3 text-[0.6875rem] text-muted-foreground">none</div>
      </SidebarProvider>
    </div>
  );
}

export function SidebarUsageExamples() {
  const { t } = useLang();
  return (
    <div className="grid gap-8">
      <ExampleBlock title={t("demo.sidebar.basicTitle")} description={t("demo.sidebar.basicDesc")}>
        <BasicExample />
      </ExampleBlock>
      <ExampleBlock title={t("demo.sidebar.submenuTitle")} description={t("demo.sidebar.submenuDesc")}>
        <SubmenuExample />
      </ExampleBlock>
      <ExampleBlock title={t("demo.sidebar.badgeTitle")} description={t("demo.sidebar.badgeDesc")}>
        <BadgeAndActionExample />
      </ExampleBlock>
      <ExampleBlock
        title={t("demo.sidebar.modesTitle")}
        description={t("demo.sidebar.modesDesc")}
      >
        <CollapseModesExample />
      </ExampleBlock>
      <div className="grid gap-2">
        <p className="font-display text-sm font-medium text-heading">{t("demo.sidebar.mobile")}</p>
        <p className="text-xs text-muted-foreground">
          <T k="demo.sidebar.mobileText" />
        </p>
      </div>
    </div>
  );
}
