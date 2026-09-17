"use client";

import type * as React from "react";
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
export function PageTopbar({ title }: { title: string }) {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const expanded = isMobile ? openMobile : state === "expanded";

  return (
    <div className="flex items-end gap-3">
      <Toggle
        variant="outline"
        size="sm"
        pressed={expanded}
        onPressedChange={toggleSidebar}
        aria-label={expanded ? "Recolher menu" : "Expandir menu"}
      >
        <SidebarPanelIcon />
      </Toggle>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/components/button">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
