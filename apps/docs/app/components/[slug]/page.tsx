import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { Badge } from "@adinkra/badge";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@adinkra/breadcrumb";
import { Button } from "@adinkra/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@adinkra/card";
import {
  AreaSparkline,
  DonutChartWithText,
  DownwardTrendLineChart,
  FilledRadarChart,
  LineChartWithEndDot,
  LineSparkline,
  NegativeBarChart,
  PieChartWithCustomLabel,
  SankeyChart,
  SimpleBarChart,
  StackedBarChartWithLegend,
  TreemapChart,
  UpwardTrendLineChart,
} from "@adinkra/charts";
import { Input } from "@adinkra/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@adinkra/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@adinkra/pagination";
import { SegmentedBar } from "@adinkra/progress";
import {
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
} from "@adinkra/sidebar";
import { Skeleton } from "@adinkra/skeleton";
import { Switch } from "@adinkra/switch";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@adinkra/table";
import { Toggle } from "@adinkra/toggle";
import {
  ArrowPointerCursorDemo,
  BigCircleCursorDemo,
  CircleAndDotCursorDemo,
  GlitchCursorDemo,
  MotionBlurCursorDemo,
  RingDotCursorDemo,
} from "../../../components/cursor-demo";
import { DataTableDemo } from "../../../components/data-table-demo";
import { DatePickerBasicDemo, DatePickerDemo, DateRangePickerDemo, DateTimePickerDemo } from "../../../components/date-picker-demo";
import { SegmentedBarCurrencyDemo, SegmentedBarDraggableDemo } from "../../../components/segmented-bar-demo";
import { PropsTable, State, StatesGrid, mdxHtmlOverrides } from "../../../components/mdx-components";
import { Preview } from "../../../components/preview";
import { PageTopbar } from "../../../components/page-topbar";
import { AppSidebar, SidebarShowcase, SidebarUsageExamples } from "../../../components/sidebar";
import { allSlugs, findNavItem, getAdjacentNavItems } from "../../../config/nav";
import { readComponentDoc } from "../../../lib/content";

interface ComponentDocFrontmatter {
  title: string;
  description: string;
}

// Só os componentes com status "estavel" e um .mdx de verdade viram página
// estática — os "planejado" ficam só listados na sidebar (DECISOES.md).
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = findNavItem(slug);
  return { title: item?.title ?? slug };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = findNavItem(slug);
  const source = await readComponentDoc(slug);

  if (!item || item.status !== "estavel" || !source) {
    notFound();
  }

  const { prev, next } = getAdjacentNavItems(slug);

  const { content, frontmatter } = await compileMDX<ComponentDocFrontmatter>({
    source,
    // Cada peça entra pelo próprio nome, importada direto (não através de um
    // objeto guarda-chuva exportado por um módulo "use client" — um objeto
    // assim chega vazio do outro lado da fronteira cliente/servidor: só
    // bindings de export individuais viram referência de cliente de verdade).
    components: {
      Preview,
      StatesGrid,
      State,
      PropsTable,
      Button,
      Input,
      Badge,
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardAction,
      CardContent,
      CardFooter,
      Skeleton,
      DataTableDemo,
      DatePickerDemo,
      DatePickerBasicDemo,
      DateRangePickerDemo,
      DateTimePickerDemo,
      SegmentedBar,
      SegmentedBarDraggableDemo,
      SegmentedBarCurrencyDemo,
      SimpleBarChart,
      StackedBarChartWithLegend,
      NegativeBarChart,
      DonutChartWithText,
      PieChartWithCustomLabel,
      FilledRadarChart,
      LineSparkline,
      UpwardTrendLineChart,
      DownwardTrendLineChart,
      LineChartWithEndDot,
      AreaSparkline,
      TreemapChart,
      SankeyChart,
      Table,
      TableHeader,
      TableBody,
      TableFooter,
      TableRow,
      TableHead,
      TableCell,
      TableCaption,
      Toggle,
      Switch,
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbPage,
      BreadcrumbSeparator,
      BreadcrumbEllipsis,
      Pagination,
      PaginationContent,
      PaginationItem,
      PaginationLink,
      PaginationPrevious,
      PaginationNext,
      PaginationEllipsis,
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuTrigger,
      NavigationMenuContent,
      NavigationMenuLink,
      navigationMenuTriggerStyle,
      SidebarProvider,
      AppSidebar,
      SidebarShowcase,
      SidebarUsageExamples,
      SidebarMenu,
      SidebarMenuItem,
      SidebarMenuButton,
      SidebarMenuBadge,
      SidebarMenuAction,
      SidebarMenuCollapsible,
      SidebarMenuCollapsibleTrigger,
      SidebarMenuSub,
      SidebarMenuSubItem,
      SidebarMenuSubButton,
      ArrowPointerCursorDemo,
      BigCircleCursorDemo,
      CircleAndDotCursorDemo,
      GlitchCursorDemo,
      MotionBlurCursorDemo,
      RingDotCursorDemo,
      ...mdxHtmlOverrides,
    },
    // O conteúdo vem do próprio repositório (não de uma fonte remota não
    // confiável), então libera expressões JS nos props do MDX (style={{}},
    // rows={[...]}) — o padrão do next-mdx-remote bloqueia isso por segurança.
    options: { parseFrontmatter: true, blockJS: false },
  });

  return (
    <article className="grid w-full gap-10 pb-24">
      <PageTopbar title={frontmatter.title} />
      <header className="grid gap-2 border-b border-hairline pb-6">
        <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Componente
        </p>
        <h1 className="font-display text-3xl font-medium text-heading">{frontmatter.title}</h1>
        <p className="text-muted-foreground">{frontmatter.description}</p>
      </header>
      <div className="grid gap-8">{content}</div>
      {prev || next ? (
        <Pagination className="border-t border-hairline pt-6">
          <PaginationContent className="w-full justify-between">
            <PaginationItem>
              {prev ? <PaginationPrevious href={`/components/${prev.slug}`}>{prev.title}</PaginationPrevious> : null}
            </PaginationItem>
            <PaginationItem>
              {next ? <PaginationNext href={`/components/${next.slug}`}>{next.title}</PaginationNext> : null}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </article>
  );
}
