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
 */
export type SelectColor = Exclude<NonNullable<BadgeProps["variant"]>, "outline"> | "tag-navy";

/**
 * Cor de opção de status. Além das cores de etiqueta, dois tons do desenho:
 * `mist` (a névoa azul do "Sincronizado" — não existe como token, então sai
 * fixa como `#C9DDF0`/`#1E3550`, par que lê igual no claro e no escuro por
 * ser pílula com borda própria) e `destructive` (o "Erro").
 */
export type StatusColor = SelectColor | "mist" | "destructive";

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

/** Agregação do rodapé. "none" deixa a célula do rodapé vazia (mas ainda trocável pelo menu). */
export type Aggregate = "none" | "sum" | "avg" | "min" | "max" | "count";

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
   * Só pra type "select" — "badge" (padrão, o visual de antes: `@adinkra/badge`
   * caixa-alta) ou "dot" (ponto colorido de 13 + texto, o visual de
   * etiqueta do redesenho φ).
   */
  selectStyle?: "badge" | "dot";
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
  /** Fica grudada à esquerda ao rolar na horizontal (valor inicial — o menu da coluna troca). */
  frozen?: boolean;
  /** Coluna principal (ícone de página, botão "Abrir", título do cartão no mobile). Padrão: a primeira de texto. */
  primary?: boolean;
  /** Começa escondida (o menu da coluna esconde; a lista de colunas mostra de novo). */
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
  | "eq"
  | "gt"
  | "lt"
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

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  onRowsChange: (rows: DataTableRow[]) => void;
  /** Linhas verticais entre colunas (mesmo padrão do @adinkra/table). Ligado por padrão. */
  columnLines?: boolean;
  className?: string;

  /** Linha "Nova linha" no fim da tabela. Só aparece se existir. */
  onAddRow?: () => void;
  /** Botão "Abrir" no hover da coluna principal. Só aparece se existir. */
  onOpenRow?: (row: DataTableRow) => void;

  /**
   * Visões (abas) na barra superior, todas sobre ESTA tabela (mesmas colunas
   * e linhas — quem usa decide o que cada aba muda via `onViewChange`).
   * Pra abas com dados, colunas ou fonte diferentes, use `DataTableViews`.
   */
  views?: DataTableView[];
  activeView?: string;
  onViewChange?: (viewId: string) => void;
  /** Ações à direita da barra superior (ex.: botão "Nova transação"). */
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
   * Linha nova ("Nova linha" ou o "+" do gutter). Recebe o rascunho já
   * inserido na tela; devolver uma linha (ex.: com o id do servidor) troca o
   * rascunho por ela. Rejeitar remove o rascunho.
   */
  onAddRow?(draft: DataTableRow): Promise<DataTableRow | void> | DataTableRow | void;
  /** Linhas excluídas pela barra de seleção. Rejeitar devolve as linhas. */
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
