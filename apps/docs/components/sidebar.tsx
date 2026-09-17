"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AbodeSantannIcon } from "@adinkra/icons";
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
} from "@adinkra/sidebar";
import { nav } from "../config/nav";

// Par de chevrons (cima/baixo) — o mesmo aceno de "seletor" que o cabeçalho
// de referência usa (ex.: um trocador de time), mesmo sem termos um de
// verdade pra trocar: comunica "isto é um controle", não só um link de
// marca. Mesmo traço (viewBox 16x16, strokeWidth 1.3) do resto do sistema.
function ChevronsUpDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M4.5 6.5 8 3.5l3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 9.5 8 12.5l3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface AppSidebarProps {
  /** Repassado para o <Sidebar> interno — usado pra encolher a demo na página de documentação do próprio componente. */
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps = {}) {
  const pathname = usePathname();

  return (
    // "offcanvas", não "icon": sem ícone por item, uma faixa recolhida só de
    // ícones sobraria vazia — recolhe até largura zero em vez disso. A
    // SidebarRail (faixa fina na borda) alterna entre os dois estados; ver
    // DECISOES.md.
    <Sidebar collapsible="offcanvas" className={className}>
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
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-control border-[length:var(--border-width)] border-transparent px-1.5 py-1.5 hover:border-ink hover:bg-card"
          >
            <AbodeSantannIcon role="img" aria-label="Abode Santann" className="size-5 flex-none text-brand" />
            {/* font-adinkra (Adinkra Alphabet, @adinkra/tokens) mapeia letra
                latina pra símbolo Adinkra — sem `uppercase` de propósito
                aqui: forçar a transformação de caixa mudaria QUAL letra
                chega até a fonte, arriscando cair fora do mapeamento dela
                (não documentado publicamente). Texto no JSX já está na
                caixa que queremos renderizar. */}
            <p className="min-w-0 flex-1 truncate font-adinkra text-base tracking-[0.15em] text-heading">
              Adinkra
            </p>
            <ChevronsUpDownIcon className="flex-none text-muted-foreground" />
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
                  Getting started
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/introduction"} render={<Link href="/introduction" />}>
                  Introduction
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
          <SidebarGroupLabel>Componentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((group) => (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuCollapsible>
                    <SidebarMenuCollapsibleTrigger>{group.title}</SidebarMenuCollapsibleTrigger>
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
                                <span className="font-display text-[0.625rem] uppercase tracking-wide">Em breve</span>
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
          <SidebarGroupLabel>Recursos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/symbols"} render={<Link href="/symbols" />}>
                  Símbolos
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
  { title: "Visão geral", slug: "overview" },
  { title: "Relatórios", slug: "reports" },
  { title: "Configurações", slug: "settings" },
];

/**
 * Preview "hero" no topo de content/components/sidebar.mdx — mock, dados
 * fabricados, mesmo espírito dos exemplos abaixo (não o AppSidebar de
 * verdade do site). Antes era o AppSidebar real encolhido via className;
 * trocado por pedido do usuário (15/09/2026) pra não misturar a
 * demonstração com a navegação de verdade da própria página que a exibe.
 */
export function SidebarShowcase() {
  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
      className="relative h-full min-h-0"
    >
      <Sidebar collapsible="offcanvas" className="relative">
        <SidebarHeader>
          <p className="px-1 font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Produto
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Painel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mockItems.map((item, index) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton isActive={index === 0}>{item.title}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Equipe</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Membros</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Permissões</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">Conteúdo da página</div>
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
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarHeader>
          <p className="px-1 font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Produto
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Painel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mockItems.map((item, index) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton isActive={index === 0}>{item.title}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="px-1 text-xs text-muted-foreground">rodapé livre</p>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">Conteúdo da página</div>
    </SidebarProvider>
  );
}

function SubmenuExample() {
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuCollapsible defaultOpen>
                <SidebarMenuCollapsibleTrigger>Componentes</SidebarMenuCollapsibleTrigger>
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
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">Conteúdo da página</div>
    </SidebarProvider>
  );
}

function BadgeAndActionExample() {
  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" className="relative">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Notificações</SidebarMenuButton>
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Projetos</SidebarMenuButton>
              <SidebarMenuAction showOnHover aria-label="Mais opções">
                ···
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">Passe o mouse no 2º item</div>
    </SidebarProvider>
  );
}

function CollapseModesExample() {
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
                    {item.title}
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
                  <SidebarMenuButton isActive={index === 0}>{item.title}</SidebarMenuButton>
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
                  <SidebarMenuButton isActive={index === 0}>{item.title}</SidebarMenuButton>
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
  return (
    <div className="grid gap-8">
      <ExampleBlock title="Básico" description="Grupo com rótulo, item ativo, rodapé livre.">
        <BasicExample />
      </ExampleBlock>
      <ExampleBlock title="Submenu recolhível" description="<details>/<summary> nativo, sem useState.">
        <SubmenuExample />
      </ExampleBlock>
      <ExampleBlock title="Badge e ação de item" description="SidebarMenuBadge fixo; SidebarMenuAction só no hover (showOnHover).">
        <BadgeAndActionExample />
      </ExampleBlock>
      <ExampleBlock
        title="Modos de recolhimento"
        description="icon (faixa de ícones) · offcanvas (largura zero + rail) · none (sempre expandido). Clique no botão do cabeçalho ou na faixa da borda."
      >
        <CollapseModesExample />
      </ExampleBlock>
      <div className="grid gap-2">
        <p className="font-display text-sm font-medium text-heading">Mobile</p>
        <p className="text-xs text-muted-foreground">
          Sem demo estática aqui — o comportamento depende da largura real da janela
          (<code>useIsMobile</code>, abaixo de 768px), não de um contêiner pequeno. Qualquer{" "}
          <code>&lt;Sidebar/&gt;</code> vira gaveta automaticamente nesse caso; veja a seção "Mobile" em{" "}
          <code>content/components/sidebar.mdx</code>.
        </p>
      </div>
    </div>
  );
}
