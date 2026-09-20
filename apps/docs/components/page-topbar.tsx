"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@adinkra/breadcrumb";
import { useSidebar } from "@adinkra/sidebar";
import { Toggle } from "@adinkra/toggle";
import { LanguageSelect, T, useLang } from "./language";
import { ThemeToggle } from "./theme-toggle";

// Mesmo ícone (retângulo + linha vertical) do <SidebarTrigger/> do pacote —
// consistência visual, não reexportado de lá (é pequeno demais pra virar
// API pública fora do próprio componente que o usa).
function SidebarPanelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" {...props}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * Topo de cada página de componente: um `Toggle` (variant="outline", igual
 * ao pedido do usuário) que recolhe/expande a sidebar, e a trilha de onde a
 * página está. Diferente do `<SidebarTrigger/>` do pacote (ghost, só
 * reabre a gaveta em mobile), este é visível em qualquer largura de tela —
 * "use client" porque `useSidebar()` é hook de verdade.
 */
export interface PageTopbarCrumb {
  label: React.ReactNode;
  href: string;
}

// Trilha intermediária entre "Início" e a página atual. O padrão é a das
// páginas de componente; Introduction, Getting started e Símbolos passam
// `trail={[]}` porque não ficam dentro de "Componentes".
const componentsTrail: PageTopbarCrumb[] = [
  { label: <T k="common.components" />, href: "/components/button" },
];

export function PageTopbar({ title, trail = componentsTrail }: { title: React.ReactNode; trail?: PageTopbarCrumb[] }) {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const { t } = useLang();
  const expanded = isMobile ? openMobile : state === "expanded";

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-end gap-3">
      <Toggle
        variant="outline"
        size="sm"
        pressed={expanded}
        onPressedChange={toggleSidebar}
        aria-label={expanded ? t("topbar.collapseMenu") : t("topbar.expandMenu")}
      >
        <SidebarPanelIcon />
      </Toggle>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <T k="common.home" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {trail.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      </div>
      <div className="flex items-end gap-2">
        <ThemeToggle />
        <LanguageSelect />
      </div>
    </div>
  );
}
