"use client";

import * as React from "react";
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
        {/*
          -mx/-mt cancelam o p-4 (13) do SidebarContent (p-3/8 na lateral
          quando recolhida) e px/pt repõem os mesmos 13, pra borda de baixo
          do header ir de ponta a ponta. Canvas (27/09/2026): 13 do topo até
          o logo, 13 do logo até o fio e 13 do fio até o primeiro item — o
          -mb-3 tira 8 dos 21 de gap do SidebarContent e deixa os 13.
        */}
        <SidebarHeader className="-mx-4 -mb-3 -mt-4 px-4 py-4 group-data-[state=collapsed]/sidebar:-mx-3">
          {/* ArcLogo no lugar do wordmark (mesma composição da home), em 144
              como no canvas. Ele mede size×size, não cabe na faixa recolhida
              (55) — nesse estado (só no desktop; no mobile a sidebar abre
              expandida) volta o ícone pequeno, de 21. */}
          <Link
            href="/"
            aria-label="Adinkra — página inicial"
            className="flex items-center justify-center rounded-control border-[length:var(--border-width)] border-transparent py-3 hover:border-ink hover:bg-card"
          >
            {collapsed ? (
              <SankofaSwirlIcon role="img" aria-label="Sankofa" className="size-5 flex-none text-brand" />
            ) : (
              <ArcLogo
                text="Design System"
                brandText="Adinkra"
                year="2026"
                size={144}
                arc={42}
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
                              <span className="flex h-[26px] w-full items-center justify-between gap-2 rounded-control px-3 font-display text-sm text-muted-foreground">
                                <span className="truncate">{item.title}</span>
                                <span className="font-mono text-xs uppercase tracking-[0.13em]"><T k="common.comingSoon" /></span>
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
 * Estado aberto/fechado de cada demo, controlado aqui (27/09/2026). Sem
 * isso o SidebarProvider não controlado lê o cookie da sidebar real do site
 * ao montar: quem recolheu a navegação do site via todas as demos abrirem
 * recolhidas também, e o modo "icon" nunca começava do jeito que o exemplo
 * pede. (Alternar uma demo ainda grava o cookie — isso é do pacote.)
 */
function useDemoOpen(initial: boolean) {
  const [open, setOpen] = React.useState(initial);
  return { open, onOpenChange: setOpen };
}

// Área de "página" ao lado das demos: 13 de padding, texto 13/21 apagado.
function DemoPage({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 flex-1 overflow-auto p-4 text-sm text-muted-foreground">{children}</div>;
}

// Rótulo "Produto" do cabeçalho das demos: mono 10 caixa-alta, como os
// sobretítulos do canvas. Some quando a faixa recolhe (não cabe em 55).
function DemoHeaderLabel() {
  const { t } = useLang();
  return (
    <p className="font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground group-data-[state=collapsed]/sidebar:hidden">
      {t("demo.sidebar.product")}
    </p>
  );
}

/**
 * Preview "hero" no topo de content/components/sidebar.mdx — mock, dados
 * fabricados, mesmo espírito dos exemplos abaixo (não o AppSidebar de
 * verdade do site). Antes era o AppSidebar real encolhido via className;
 * trocado por pedido do usuário (15/09/2026) pra não misturar a
 * demonstração com a navegação de verdade da própria página que a exibe.
 *
 * Canvas (27/09/2026): ocupa o Preview inteiro (`<Preview flush>`, 377 de
 * altura), sidebar de 233 — a largura real do pacote, não mais os 12rem
 * de antes — e, ao lado, uma barra de 55 com o gatilho de 34 e o título da
 * página. Modo "icon", o mesmo da sidebar do site: recolhe para 55 pela
 * SidebarRail, pelo gatilho ou por Ctrl/Cmd + B.
 */
export function SidebarShowcase() {
  const { t } = useLang();
  const demo = useDemoOpen(true);
  return (
    <SidebarProvider {...demo} className="relative h-full min-h-0 w-full">
      <Sidebar collapsible="icon" className="relative h-full">
        <SidebarHeader>
          <DemoHeaderLabel />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("demo.sidebar.panel")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mockItems.map((item, index) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton isActive={index === 0} tooltip={t(item.key)}>
                      {t(item.key)}
                    </SidebarMenuButton>
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
                  <SidebarMenuButton tooltip={t("demo.sidebar.members")}>{t("demo.sidebar.members")}</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t("demo.sidebar.permissions")}>{t("demo.sidebar.permissions")}</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[55px] flex-none items-center gap-3 border-b border-hairline px-4">
          <SidebarTrigger />
          <span className="truncate text-sm font-semibold text-heading">{t(mockItems[0].key)}</span>
        </div>
        <DemoPage>{t("demo.sidebar.pageContent")}</DemoPage>
      </div>
    </SidebarProvider>
  );
}

/**
 * Moldura de cada exemplo: título 16 + descrição 13 em cima (8 até a
 * caixa) e a caixa com borda 2 de tinta, raio 8. Altura em S — 377 para o
 * Básico (cabe cabeçalho de 55, rótulo, três itens e o rodapé de 55 sem
 * cortar nada; os 256 de antes, `h-64`, cortavam o rodapé) e 233 para os
 * outros.
 */
function ExampleBlock({
  title,
  description,
  tall = false,
  children,
}: {
  title: string;
  description: string;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="font-display text-base font-semibold text-heading">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`${tall ? "h-[377px]" : "h-[233px]"} overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-background`}
      >
        {children}
      </div>
    </div>
  );
}

// Só pra este mock — ícone de exemplo genérico. A navegação real do site
// (AppSidebar, acima) decidiu não usar ícone por item (ver DECISOES.md);
// isso não muda essa decisão, só ilustra o modo "icon" do pacote para quem
// for consumi-lo com ícones de verdade. Ponto de 8 numa caixa de 13, como
// no canvas (o pacote centra o ícone no item de 34 quando recolhe).
function DotIcon() {
  return (
    <svg viewBox="0 0 13 13" width="13" height="13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4" fill="currentColor" />
    </svg>
  );
}

// As demos passam `h-full` pro <Sidebar>: o pacote usa `h-screen` (a altura
// da janela), que dentro de uma caixa de 233/377 empurrava o rodapé e o fim
// da lista pra fora da moldura.
function BasicExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative h-full">
        <SidebarHeader>
          <DemoHeaderLabel />
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
        <SidebarFooter className="border-t border-hairline">
          <p className="text-sm text-muted-foreground">{t("demo.sidebar.freeFooter")}</p>
        </SidebarFooter>
      </Sidebar>
      <DemoPage>{t("demo.sidebar.pageContent")}</DemoPage>
    </SidebarProvider>
  );
}

function SubmenuExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative h-full">
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
      <DemoPage>{t("demo.sidebar.pageContent")}</DemoPage>
    </SidebarProvider>
  );
}

function BadgeAndActionExample() {
  const { t } = useLang();
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative h-full">
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
      <DemoPage>{t("demo.sidebar.hoverSecond")}</DemoPage>
    </SidebarProvider>
  );
}

/**
 * Os três modos lado a lado, cada um já no estado que o diferencia (canvas
 * de 27/09/2026): "icon" começa recolhido em 55, com o gatilho de 34 e os
 * ícones centrados; "offcanvas" começa recolhido em 0 — por isso o gatilho
 * mora numa barra de 55 do lado de fora da sidebar, senão sumiria junto
 * com ela; "none" fica sempre aberto. Os rótulos da área de página são os
 * nomes da prop, então não passam por i18n.
 */
function CollapseModesExample() {
  const { t } = useLang();
  const iconDemo = useDemoOpen(false);
  const offcanvasDemo = useDemoOpen(false);
  const items = (withIcon: boolean) =>
    mockItems.map((item, index) => (
      <SidebarMenuItem key={item.slug}>
        <SidebarMenuButton isActive={index === 0} icon={withIcon ? <DotIcon /> : undefined} tooltip={t(item.key)}>
          {t(item.key)}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  return (
    <div className="grid h-full grid-cols-3 divide-x-[length:var(--border-width)] divide-ink">
      <SidebarProvider {...iconDemo} className="h-full min-h-0 min-w-0">
        <Sidebar collapsible="icon" className="relative h-full">
          <SidebarHeader>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>{items(true)}</SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <DemoPage>icon · 55</DemoPage>
      </SidebarProvider>
      <SidebarProvider {...offcanvasDemo} className="h-full min-h-0 min-w-0">
        <Sidebar collapsible="offcanvas" className="relative h-full">
          <SidebarContent>
            <SidebarMenu>{items(false)}</SidebarMenu>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[55px] flex-none items-center border-b border-hairline px-3">
            <SidebarTrigger />
          </div>
          <DemoPage>offcanvas · 0</DemoPage>
        </div>
      </SidebarProvider>
      <SidebarProvider className="h-full min-h-0 min-w-0">
        <Sidebar collapsible="none" className="relative h-full">
          <SidebarContent>
            <SidebarMenu>{items(false)}</SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <DemoPage>none</DemoPage>
      </SidebarProvider>
    </div>
  );
}

export function SidebarUsageExamples() {
  const { t } = useLang();
  // 34 entre os exemplos; o mt-3 soma 8 aos 13 da grade do MDX, pra ficar
  // 21 entre o título "Exemplos de uso" e o primeiro, como no canvas.
  return (
    <div className="mt-3 grid gap-6">
      <ExampleBlock tall title={t("demo.sidebar.basicTitle")} description={t("demo.sidebar.basicDesc")}>
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
      <div className="grid gap-3">
        <p className="font-display text-base font-semibold text-heading">{t("demo.sidebar.mobile")}</p>
        <p className="max-w-[610px] text-sm text-muted-foreground">
          <T k="demo.sidebar.mobileText" />
        </p>
      </div>
    </div>
  );
}
