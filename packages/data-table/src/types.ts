import type * as React from "react";
import type { BadgeProps } from "@adinkra/badge";

/**
 * Cores de etiqueta reaproveitadas do `@adinkra/badge` (nenhuma cor nova
 * inventada aqui) — "outline" fica de fora de propósito: é o visual
 * "sem cor" do Badge, não faz sentido como opção de select colorido.
 *
 * `tag-navy` (27/09, redesenho φ): o token `--tag-navy` já existe em
 * `@adinkra/tokens` (entrou com o `@adinkra/progress`), só não virou variante
 * do Badge. O desenho usa ele na etiqueta "Restituição", então a tabela
 * aceita a cor e resolve a classe sozinha (ver `optionColorClass`) — sem
 * mexer no pacote do Badge.
 *
 * `mist` (a névoa azul do "Sincronizado" — não existe como token, então sai
 * fixa como `#C9DDF0`/`#1E3550`, par que lê igual no claro e no escuro por
 * ser pílula com borda própria) e `gray` (superfície neutra): eram só do
 * status; o redesenho da tabela (07/10) usa os dois em etiquetas também.
 */
export type SelectColor = Exclude<NonNullable<BadgeProps["variant"]>, "outline"> | "tag-navy" | "mist" | "gray";

/** Cor de opção de status: as de etiqueta + `destructive` (o "Erro"). */
export type StatusColor = SelectColor | "destructive";

export interface SelectOption {
  value: string;
  label: string;
  color: SelectColor;
}

export interface StatusOption {
  value: string;
  label: string;
  color: StatusColor;
}

export type ColumnType = "text" | "select" | "number" | "date" | "status" | "relation" | "formula" | "checkbox";

/**
 * Agregação do rodapé. "none" deixa a célula do rodapé vazia (mas ainda
 * trocável pelo menu). Quais valem em cada coluna: ver `aggregatesFor`.
 *
 * - todas: "count" (linhas), "filled"/"empty" (não vazios/vazios),
 *   "percentFilled";
 * - número e fórmula com `format`: "sum", "avg", "median", "min", "max",
 *   "range";
 * - caixa: "count", "checked", "unchecked", "percentChecked";
 * - data: "earliest", "latest".
 *
 * Mudou em 07/10: "count" conta LINHAS (antes contava valores não vazios —
 * isso agora é "filled").
 */
export type Aggregate =
  | "none"
  | "count"
  | "filled"
  | "empty"
  | "percentFilled"
  | "sum"
  | "avg"
  | "median"
  | "min"
  | "max"
  | "range"
  | "checked"
  | "unchecked"
  | "percentChecked"
  | "earliest"
  | "latest";

/**
 * Glifo da relação. `in`/`out` seguem a regra do sistema pra direção de
 * dinheiro: entrada = primary, saída = destructive (nunca verde).
 */
export type RelationIcon = "link" | "in" | "out" | "calendar" | "pie";

export interface RelationConfig {
  /** Vira `<a href>` quando devolve uma string. */
  href?: (row: DataTableRow) => string | undefined;
  /** Vira `<button>` (quando não há `href`). */
  onClick?: (row: DataTableRow) => void;
  /** Glifo fixo ou por valor (ex.: Entrada → "in", Saída → "out"). Padrão "link". */
  icon?: RelationIcon | ((value: string, row: DataTableRow) => RelationIcon);
}

export interface DataTableColumn {
  id: string;
  header: string;
  type: ColumnType;
  /** Só pra type "select", "status" e "relation" (relação com opções edita pelo mesmo seletor; sem, edita como texto). */
  options?: (SelectOption | StatusOption)[];
  /** Só pra type "select" — várias etiquetas por célula (tags) em vez de uma só (status). */
  multi?: boolean;
  /**
   * Só pra type "select" — "pill" (padrão: etiqueta plana de raio 3, sem
   * borda), "dot" (ponto de 8 + texto sublinhado, como conta e tags no
   * desenho) ou "badge" (o `@adinkra/badge` de antes, opt-in desde 07/10).
   */
  selectStyle?: "badge" | "dot" | "pill";
  /** Só pra type "number" — formata como R$ (Intl, pt-BR) em vez de número cru. */
  currency?: boolean;
  /** Só pra type "formula" — calcula o valor a partir da linha. Editar grava uma sobrescrita manual em `row[id]`; apagar volta ao calculado. */
  formula?: (row: DataTableRow) => number | string;
  /** Só pra type "formula" — formato do resultado numérico. */
  format?: "currency" | "number";
  /** Só pra type "relation" — link opcional (o glifo abre; o texto edita). */
  relation?: RelationConfig;
  /** Só pra type "date" — "long" (padrão, "21 de Setembro, 2026") ou "short" ("21 set 2026"). */
  dateStyle?: "long" | "short";
  /** Largura inicial em px (arrastar a alça continua sobrescrevendo). Sem ela, a coluna divide o espaço livre. */
  width?: number;
  /** Fica grudada à esquerda ao rolar na horizontal (valor inicial — o menu da coluna troca). Padrão: só a principal. */
  frozen?: boolean;
  /** Coluna principal (ícone de página, botão "Abrir", título do cartão no mobile). Padrão: a primeira de texto. */
  primary?: boolean;
  /** Começa escondida (o menu da coluna esconde; o painel de propriedades mostra de novo). */
  hidden?: boolean;
  /** Agregação inicial no rodapé (o menu do rodapé troca). */
  aggregate?: Aggregate;
}

export interface DataTableRow {
  id: string;
  [columnId: string]: unknown;
}

export type FilterOperator =
  | "contains"
  | "notContains"
  | "is"
  | "isNot"
  | "isEmpty"
  | "isNotEmpty"
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "before"
  | "after"
  | "checked"
  | "unchecked";

export interface DataTableFilter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  /** Texto, número, `value` de opção ou data "yyyy-mm-dd". Ignorado pelos operadores sem valor. */
  value?: string | number;
}

export interface DataTableSort {
  columnId: string;
  direction: "asc" | "desc";
}

export interface DataTableView {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

/** Quais colunas o cartão do mobile mostra. Cada campo é um `column.id`; o que faltar cai na heurística. */
export interface MobileCardConfig {
  title?: string;
  value?: string;
  badges?: string[];
  meta?: string[];
}

/** Ação da barra de seleção (aparece quando há linha marcada). */
export interface DataTableBulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Pinta a ação de `--destructive`. */
  destructive?: boolean;
  /**
   * Recebe as linhas marcadas e `patch`, que grava os mesmos valores em todas
   * elas pelo caminho normal de edição (`onRowsChange` — no `DataTableViews`
   * com `source`, vira `onRowChange` por linha). A seleção continua marcada.
   */
  onSelect: (rows: DataTableRow[], helpers: { patch: (values: Partial<DataTableRow>) => void }) => void;
}

/** Painel lateral do "Abrir" (quando não há `onOpenRow`). */
export interface DataTablePeekConfig {
  /** Chave do row com as notas livres da página (vira um campo de texto longo no fim do painel). */
  notes?: string;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  onRowsChange: (rows: DataTableRow[]) => void;
  /**
   * Liga o que mexe nas colunas: renomear pelo menu do cabeçalho, criar
   * opção nova no seletor e o "+" de propriedade nova no fim do cabeçalho.
   * Sem ela esses três somem (as colunas são de quem usa). No
   * `DataTableViews`, sem ela, mexem numa cópia local das colunas da aba.
   */
  onColumnsChange?: (columns: DataTableColumn[]) => void;
  /** Linhas verticais entre colunas (mesmo padrão do @adinkra/table). Ligado por padrão. */
  columnLines?: boolean;
  className?: string;

  /**
   * "Nova página" no fim da tabela (e de cada grupo) e o botão "Novo" da barra
   * superior. Só aparecem se existir. `preset` traz os valores que a linha
   * nova precisa pra continuar visível: o do grupo onde foi criada e os dos
   * filtros ativos ("Mês é Setembro" → `{ mes: "Setembro" }`). Quem ignora o
   * argumento continua funcionando.
   */
  onAddRow?: (preset?: Partial<DataTableRow>) => void;
  /** Botão "Abrir" no hover da coluna principal. Com ela, abrir é de quem usa (vence `peek`). */
  onOpenRow?: (row: DataTableRow) => void;
  /**
   * Painel lateral próprio do "Abrir": título, todas as propriedades
   * editáveis, anterior/próxima, excluir e (com `notes`) notas livres.
   */
  peek?: boolean | DataTablePeekConfig;
  /** Ações extras da barra de seleção, antes de "Duplicar" e "Excluir". */
  bulkActions?: DataTableBulkAction[];

  /**
   * Visões (abas) na barra superior, todas sobre ESTA tabela (mesmas colunas
   * e linhas — quem usa decide o que cada aba muda via `onViewChange`).
   * Pra abas com dados, colunas ou fonte diferentes, use `DataTableViews`.
   */
  views?: DataTableView[];
  activeView?: string;
  onViewChange?: (viewId: string) => void;
  /** Ações à direita da barra superior (ex.: botão "Simular erro"). */
  toolbar?: React.ReactNode;
  /** Botão de busca na barra superior — filtra as linhas pelo texto. */
  searchable?: boolean;
  /** Mostra a linha de chips (com "+ Filtro") mesmo sem filtro ativo. */
  filterable?: boolean;

  filters?: DataTableFilter[];
  defaultFilters?: DataTableFilter[];
  onFiltersChange?: (filters: DataTableFilter[]) => void;
  sorts?: DataTableSort[];
  defaultSorts?: DataTableSort[];
  onSortsChange?: (sorts: DataTableSort[]) => void;
  /** Agrupa as linhas por uma coluna (select, status, relação, caixa ou texto). `null` = sem grupo. */
  groupBy?: string | null;
  defaultGroupBy?: string | null;
  onGroupByChange?: (columnId: string | null) => void;

  /** Mapeamento do cartão do mobile (abaixo de 610 de largura do container). */
  mobileCard?: MobileCardConfig;

  /** Mostra linhas de skeleton (altura real de 42) no lugar das linhas. */
  loading?: boolean;
  /** Texto quando não há linha visível. `null` desliga; sem a prop, sai uma mensagem padrão. */
  emptyMessage?: React.ReactNode;
  /** Slot entre os chips e a grade (ex.: um `Alert` de erro). */
  notice?: React.ReactNode;
}

// ─── DataTableViews ──────────────────────────────────────────────────

/**
 * Fonte de dados de uma visão — o ponto de encaixe de uma API. Só `load` é
 * obrigatório; sem os outros, as edições ficam só no estado local da visão.
 */
export interface DataTableSource {
  /** Busca as linhas. Recebe um `AbortSignal`: a visão cancela ao sair da aba, recarregar ou desmontar. */
  load(ctx: { signal: AbortSignal }): Promise<DataTableRow[]>;
  /** Uma linha mudou (`patch` = só as chaves alteradas). Rejeitar desfaz a edição e mostra o erro. */
  onRowChange?(row: DataTableRow, patch: Record<string, unknown>): Promise<void> | void;
  /**
   * Linha nova ("Nova página", "Novo", o "+" do gutter ou "Duplicar").
   * Recebe o rascunho já inserido na tela; devolver uma linha (ex.: com o id
   * do servidor) troca o rascunho por ela. Rejeitar remove o rascunho.
   */
  onAddRow?(draft: DataTableRow): Promise<DataTableRow | void> | DataTableRow | void;
  /** Linhas excluídas pela barra de seleção ou pelo painel. Rejeitar devolve as linhas. */
  onDeleteRows?(ids: string[]): Promise<void> | void;
}

export interface DataTableViewRenderContext {
  /** Linhas (em cache) de outra visão com `source`; `undefined` enquanto não carregou. */
  rowsOf(viewId: string): DataTableRow[] | undefined;
  /** `true` enquanto a visão pedida está carregando. */
  isLoading(viewId: string): boolean;
  reload(viewId?: string): void;
}

/** Uma aba do `DataTableViews`: uma tabela inteira (colunas, dados, fonte) ou uma tela livre (`render`). */
export interface DataTableViewConfig
  extends Omit<DataTableProps, "columns" | "rows" | "onRowsChange" | "views" | "activeView" | "onViewChange" | "className" | "loading"> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Colunas da tabela desta aba (dispensável só com `render`). */
  columns?: DataTableColumn[];
  /** Linhas controladas por quem usa (sem `source`). */
  rows?: DataTableRow[];
  onRowsChange?: (rows: DataTableRow[]) => void;
  /** Fonte assíncrona (API). Com ela a visão guarda as linhas sozinha, em cache. */
  source?: DataTableSource;
  /** Recarrega toda vez que a aba volta a ficar ativa (padrão: carrega uma vez e guarda). */
  refetchOnActivate?: boolean;
  /** Aba que não é tabela (ex.: gráfico). Recebe acesso às linhas das outras visões. */
  render?: (ctx: DataTableViewRenderContext) => React.ReactNode;
  /** Visões cuja `source` precisa estar carregada quando ESTA abre (ex.: o gráfico lê "transacoes"). */
  dependsOn?: string[];
}

export interface DataTableViewsHandle {
  /** Recarrega a `source` da visão (padrão: a ativa), descartando o cache. */
  reload(viewId?: string): void;
}

export interface DataTableViewsProps {
  views: DataTableViewConfig[];
  activeView?: string;
  defaultView?: string;
  onViewChange?: (viewId: string) => void;
  className?: string;
  ref?: React.Ref<DataTableViewsHandle>;
}
