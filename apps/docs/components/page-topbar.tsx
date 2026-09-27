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
import { Button } from "@adinkra/button";
import { useSidebar } from "@adinkra/sidebar";
import { LanguageSwitch, T, useLang } from "./language";
import { ThemeToggle } from "./theme-toggle";

// Mesmo ícone (retângulo + linha vertical) do <SidebarTrigger/> do pacote —
// consistência visual, não reexportado de lá (é pequeno demais pra virar
// API pública fora do próprio componente que o usa). 13, como no pacote.
function SidebarPanelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * Barra do topo de cada página de docs (canvas de 27/09/2026): 55 de altura,
 * fio de 1 embaixo, de ponta a ponta da coluna, padding lateral de 55 no
 * desktop (13 no mobile). À esquerda, o botão que recolhe/expande a sidebar
 * (quadrado de 34, ghost no desktop e outline no mobile — lá ele é o único
 * jeito de abrir a gaveta), um fio vertical de 21 e a trilha; à direita, a
 * troca de idioma e o tema do site. Antes era um `Toggle` outline "afundado"
 * enquanto a sidebar estava aberta; virou `Button` com `aria-expanded`, que
 * é o que ele de fato controla (uma região que abre e fecha).
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
  const toggleProps = {
    size: "sm" as const,
    className: "w-[34px] flex-none px-0",
    onClick: toggleSidebar,
    "aria-expanded": expanded,
    "aria-label": expanded ? t("topbar.collapseMenu") : t("topbar.expandMenu"),
  };

  return (
    <div className="flex h-[55px] items-center justify-between gap-4 border-b border-hairline px-4 md:px-7">
      <div className="flex min-w-0 items-center gap-3">
        {/* Dois botões, um por faixa de largura: a variante do Button não é
            responsiva, e trocar só as classes deixaria de fora a mecânica de
            hover/pressionado do outline. O escondido sai da árvore de
            acessibilidade (display: none). */}
        <Button variant="outline" {...toggleProps} className={`${toggleProps.className} md:hidden`}>
          <SidebarPanelIcon />
        </Button>
        <Button variant="ghost" {...toggleProps} className={`${toggleProps.className} hidden md:inline-flex`}>
          <SidebarPanelIcon />
        </Button>
        <span aria-hidden="true" className="hidden h-5 w-px flex-none bg-hairline md:block" />
        <Breadcrumb className="min-w-0 overflow-hidden">
          <BreadcrumbList className="flex-nowrap whitespace-nowrap">
            {/* No mobile a trilha perde o "Início" (cabe na barra de 55). */}
            <BreadcrumbItem className="max-md:hidden">
              <BreadcrumbLink href="/">
                <T k="common.home" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            {trail.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbSeparator className={index === 0 ? "max-md:hidden" : undefined} />
                <BreadcrumbItem>
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
            <BreadcrumbSeparator className={trail.length === 0 ? "max-md:hidden" : undefined} />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex flex-none items-center gap-3">
        <LanguageSwitch />
        <ThemeToggle />
      </div>
    </div>
  );
}
