export type ComponentStatus = "estavel" | "planejado";

export interface NavItem {
  title: string;
  slug: string;
  status: ComponentStatus;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Árvore da sidebar escrita à mão, não varrida do sistema de arquivos —
// com poucos componentes, controlar ordem e agrupamento vale mais que
// automação (DECISOES.md, seção 3).
//
// Só entram aqui componentes que já existem de verdade (status "estavel") —
// Select, Alert e Tabs continuam no roteiro (DECISOES.md, seção 11), mas
// saíram da sidebar até estarem prontos. O status "planejado" (e o jeito de
// renderizá-lo, em AppSidebar) continua existindo no código: é só
// reintroduzir um item assim que o próximo componente começar a ser
// construído. Card saiu dessa lista em 15/09/2026 — foi construído. Switch
// também, junto do grupo "Formulário" (que tinha saído por ficar vazio) — e
// Toggle, que nem estava no roteiro original, entrou junto por pedido do
// usuário. O grupo "Sistema" (só "Theme Toggle") saiu em 15/09/2026 — o
// usuário pediu pra apagar o componente e o pacote inteiro, sistema de tema
// junto (ver DECISOES.md).
//
// Sem ícone por item de propósito (decisão de 15/09/2026) — por isso a
// sidebar não colapsa mais para uma faixa de ícones (AppSidebar usa
// collapsible="none").
export const nav: NavGroup[] = [
  {
    title: "Primitivos",
    items: [
      { title: "Button", slug: "button", status: "estavel" },
      { title: "Input", slug: "input", status: "estavel" },
      { title: "Badge", slug: "badge", status: "estavel" },
      { title: "Skeleton", slug: "skeleton", status: "estavel" },
      { title: "Card", slug: "card", status: "estavel" },
      { title: "Table", slug: "table", status: "estavel" },
      { title: "Date Picker", slug: "date-picker", status: "estavel" },
      { title: "Data Table", slug: "data-table", status: "estavel" },
      { title: "Segmented Bar", slug: "segmented-bar", status: "estavel" },
      { title: "Charts", slug: "charts", status: "estavel" },
    ],
  },
  {
    title: "Navegação",
    items: [
      { title: "Sidebar", slug: "sidebar", status: "estavel" },
      { title: "Breadcrumb", slug: "breadcrumb", status: "estavel" },
      { title: "Pagination", slug: "pagination", status: "estavel" },
      { title: "Navigation Menu", slug: "navigation-menu", status: "estavel" },
    ],
  },
  {
    title: "Formulário",
    items: [
      { title: "Switch", slug: "switch", status: "estavel" },
      { title: "Toggle", slug: "toggle", status: "estavel" },
    ],
  },
  {
    title: "Sistema",
    items: [{ title: "Cursor", slug: "cursor", status: "estavel" }],
  },
];

export function findNavItem(slug: string): NavItem | undefined {
  for (const group of nav) {
    const item = group.items.find((entry) => entry.slug === slug);
    if (item) return item;
  }
  return undefined;
}

export function allSlugs(): string[] {
  return nav.flatMap((group) => group.items.map((item) => item.slug));
}

/**
 * Anterior/próximo na mesma ordem da sidebar (achatando os grupos) — pra
 * paginar entre componentes no rodapé de cada página, não uma paginação
 * numérica de verdade (não existe "página 3" de componentes).
 */
export function getAdjacentNavItems(slug: string): { prev?: NavItem; next?: NavItem } {
  const items = nav.flatMap((group) => group.items);
  const index = items.findIndex((item) => item.slug === slug);
  if (index === -1) return {};
  return { prev: items[index - 1], next: items[index + 1] };
}
