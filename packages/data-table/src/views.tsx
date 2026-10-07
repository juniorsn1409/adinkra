"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@adinkra/alert";
import { Button } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { ViewTabs } from "./chrome";
import { DataTable } from "./data-table";
import { createEmptyRow } from "./logic";
import type { DataTableRow, DataTableViewConfig, DataTableViewsHandle, DataTableViewsProps } from "./types";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface ViewData {
  status: LoadStatus;
  rows: DataTableRow[];
  loadError?: string;
  mutationError?: string;
}

const EMPTY: ViewData = { status: "idle", rows: [] };

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === "string" && error ? error : "Erro desconhecido.";
}

function shallowPatch(prev: DataTableRow, next: DataTableRow): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (!Object.is(prev[key], next[key])) patch[key] = next[key];
  }
  return patch;
}

/**
 * Abas em que CADA visão é a sua própria tabela — colunas, linhas e fonte
 * de dados próprias (pedido do usuário, 27/09: "as abas de Transações e
 * Faturas têm que estar preparadas para receber dados de APIs diferentes;
 * quando clicar em Rendimentos tem que ser uma tabela diferente"). A prop
 * `views` do `DataTable` continua existindo pro caso "abas sobre a mesma
 * tabela" (não foi deprecada: é outro uso, não um jeito antigo do mesmo).
 *
 * Decisões:
 * - **Cada visão monta na primeira vez que a aba abre e fica montada**
 *   (escondida com `hidden`). É isso que preserva filtros, ordenação,
 *   busca, larguras e colunas escondidas por visão sem nenhum estado extra:
 *   o `DataTable` de cada aba continua vivo. As abas aparecem dentro da
 *   barra superior de cada tabela (mesmo lugar do desenho).
 * - **`source` carrega sob demanda e guarda em cache** aqui, no nível das
 *   visões (não dentro do `DataTable`) — é o que deixa uma aba `render`
 *   (ex.: gráfico) ler as linhas de outra (`ctx.rowsOf`). Trocar de aba não
 *   recarrega, a não ser com `refetchOnActivate`. Carga em andamento é
 *   cancelada (AbortController) ao sair da aba, ao recarregar ou ao
 *   desmontar; volta a carregar quando a aba abre de novo.
 * - **Edição otimista com desfazer pontual**: a tela muda na hora; se a API
 *   rejeitar, só aquela mudança volta (as chaves daquele patch, a linha
 *   nova ou as linhas excluídas), não o array inteiro — outra edição que
 *   deu certo no meio do caminho não é desfeita junto. O erro aparece num
 *   `Alert` destructive acima da grade, com "Fechar".
 * - Reordenar (arrastar) muda só a ordem local: `DataTableSource` não tem
 *   operação de ordem. Mexer nas colunas (renomear, criar opção, nova
 *   propriedade) também é local, a não ser que a visão traga `onColumnsChange`.
 * - **Recarregar**: `ref` com `reload(viewId?)` (React 19: `ref` é prop
 *   comum). Escolhido em vez de `reloadKey` na visão porque recarregar é um
 *   comando (botão "atualizar", depois de salvar em outra tela), não estado
 *   — com `reloadKey` quem usa teria que inventar um contador só pra isso.
 */
export function DataTableViews({ views, activeView, defaultView, onViewChange, className, ref }: DataTableViewsProps) {
  const [innerActive, setInnerActive] = React.useState(defaultView ?? views[0]?.id ?? "");
  const active = activeView ?? innerActive;
  const [data, setData] = React.useState<Record<string, ViewData>>({});
  const [mounted, setMounted] = React.useState<Set<string>>(() => new Set([active]));
  const controllers = React.useRef(new Map<string, AbortController>());
  const viewsRef = React.useRef(views);
  viewsRef.current = views;

  // Montagem preguiçosa: a aba entra no conjunto na primeira vez que fica ativa.
  if (active && !mounted.has(active)) setMounted(new Set(mounted).add(active));

  const patchView = React.useCallback((id: string, update: (prev: ViewData) => ViewData) => {
    setData((prev) => ({ ...prev, [id]: update(prev[id] ?? EMPTY) }));
  }, []);

  const load = React.useCallback(
    (id: string) => {
      const view = viewsRef.current.find((v) => v.id === id);
      if (!view?.source) return;
      controllers.current.get(id)?.abort();
      const controller = new AbortController();
      controllers.current.set(id, controller);
      patchView(id, (prev) => ({ ...prev, status: "loading", loadError: undefined }));
      view.source
        .load({ signal: controller.signal })
        .then(
          (rows) => {
            if (controller.signal.aborted) return;
            patchView(id, (prev) => ({ ...prev, status: "ready", rows }));
          },
          (error: unknown) => {
            if (controller.signal.aborted) return;
            patchView(id, (prev) => ({ ...prev, status: "error", loadError: messageOf(error) }));
          },
        )
        .finally(() => {
          if (controllers.current.get(id) === controller) controllers.current.delete(id);
        });
    },
    [patchView],
  );

  React.useImperativeHandle(ref, () => ({ reload: (viewId?: string) => load(viewId ?? active) }), [load, active]);

  // Visões que precisam de dados agora: a ativa + as de que ela depende.
  const activeConfig = views.find((view) => view.id === active);
  const wanted = React.useMemo(() => [active, ...(activeConfig?.dependsOn ?? [])], [active, activeConfig?.dependsOn]);
  const lastActive = React.useRef<string | null>(null);

  React.useEffect(() => {
    const becameActive = lastActive.current !== active;
    lastActive.current = active;
    // Sair da aba cancela a carga dela (a próxima abertura recomeça).
    for (const [id, controller] of controllers.current) {
      if (!wanted.includes(id)) {
        controller.abort();
        controllers.current.delete(id);
        patchView(id, (prev) => (prev.status === "loading" ? { ...prev, status: "idle" } : prev));
      }
    }
    for (const id of wanted) {
      const view = viewsRef.current.find((v) => v.id === id);
      if (!view?.source) continue;
      const status = data[id]?.status ?? "idle";
      const inFlight = controllers.current.has(id);
      // "loading" sem carga viva acontece no StrictMode (desmonta/remonta) — conta como parado.
      if (!inFlight && (status === "idle" || status === "loading")) load(id);
      else if (id === active && becameActive && view.refetchOnActivate && !inFlight && status !== "idle") load(id);
    }
    // `data` fica de fora de propósito: o efeito é "a aba mudou", não "os dados mudaram".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, active, load, patchView]);

  React.useEffect(() => {
    const map = controllers.current;
    return () => {
      for (const controller of map.values()) controller.abort();
      map.clear();
    };
  }, []);

  function selectView(id: string) {
    if (activeView === undefined) setInnerActive(id);
    onViewChange?.(id);
  }

  const tabs = views.map(({ id, label, icon }) => ({ id, label, icon }));

  /** Aplica `next` na hora e manda cada diferença pra API; rejeição desfaz só aquela parte. */
  function commit(view: DataTableViewConfig, next: DataTableRow[]) {
    const source = view.source;
    if (!source) return;
    const id = view.id;
    const prev = data[id]?.rows ?? [];
    patchView(id, (state) => ({ ...state, rows: next }));

    const fail = (error: unknown, undo: (rows: DataTableRow[]) => DataTableRow[]) =>
      patchView(id, (state) => ({ ...state, rows: undo(state.rows), mutationError: messageOf(error) }));

    const prevById = new Map(prev.map((row) => [row.id, row]));
    for (const row of next) {
      const old = prevById.get(row.id);
      if (!old) {
        if (!source.onAddRow) continue;
        const draftId = row.id;
        Promise.resolve()
          .then(() => source.onAddRow?.(row))
          .then(
            (saved) => {
              if (saved) patchView(id, (state) => ({ ...state, rows: state.rows.map((r) => (r.id === draftId ? saved : r)) }));
            },
            (error) => fail(error, (rows) => rows.filter((r) => r.id !== draftId)),
          );
        continue;
      }
      const patch = shallowPatch(old, row);
      if (Object.keys(patch).length === 0 || !source.onRowChange) continue;
      Promise.resolve()
        .then(() => source.onRowChange?.(row, patch))
        .catch((error) =>
          fail(error, (rows) =>
            rows.map((r) => {
              if (r.id !== row.id) return r;
              const reverted = { ...r };
              for (const key of Object.keys(patch)) reverted[key] = old[key];
              return reverted;
            }),
          ),
        );
    }

    const nextIds = new Set(next.map((row) => row.id));
    const removed = prev.map((row, index) => ({ row, index })).filter(({ row }) => !nextIds.has(row.id));
    if (removed.length > 0 && source.onDeleteRows) {
      Promise.resolve()
        .then(() => source.onDeleteRows?.(removed.map(({ row }) => row.id)))
        .catch((error) =>
          fail(error, (rows) => {
            const restored = [...rows];
            for (const { row, index } of removed) restored.splice(Math.min(index, restored.length), 0, row);
            return restored;
          }),
        );
    }
  }

  const ctx = {
    rowsOf: (viewId: string) => {
      const state = data[viewId];
      return state && (state.status === "ready" || state.rows.length > 0) ? state.rows : undefined;
    },
    isLoading: (viewId: string) => data[viewId]?.status === "loading" || (data[viewId] === undefined && !!views.find((v) => v.id === viewId)?.source),
    reload: (viewId?: string) => load(viewId ?? active),
  };

  return (
    <div className={className}>
      {views.map((view) => {
        if (!mounted.has(view.id)) return null;
        const isActive = view.id === active;
        return (
          <div key={view.id} hidden={!isActive}>
            {view.render ? (
              <RenderView tabs={tabs} active={active} onViewChange={selectView} toolbar={view.toolbar}>
                {view.render(ctx)}
              </RenderView>
            ) : (
              <TableView
                view={view}
                state={data[view.id] ?? EMPTY}
                tabs={tabs}
                active={active}
                onViewChange={selectView}
                onLocalRows={(rows) => patchView(view.id, (state) => ({ ...state, rows }))}
                onCommit={(rows) => commit(view, rows)}
                onRetry={() => load(view.id)}
                onDismissError={() => patchView(view.id, (state) => ({ ...state, mutationError: undefined }))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TableView({
  view,
  state,
  tabs,
  active,
  onViewChange,
  onLocalRows,
  onCommit,
  onRetry,
  onDismissError,
}: {
  view: DataTableViewConfig;
  state: ViewData;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onViewChange: (id: string) => void;
  onLocalRows: (rows: DataTableRow[]) => void;
  onCommit: (rows: DataTableRow[]) => void;
  onRetry: () => void;
  onDismissError: () => void;
}) {
  const {
    id: _id,
    label: _label,
    icon: _icon,
    columns = [],
    rows: controlledRows,
    onRowsChange,
    source,
    refetchOnActivate: _refetch,
    render: _render,
    dependsOn: _dependsOn,
    onAddRow,
    onColumnsChange,
    notice,
    emptyMessage,
    ...tableProps
  } = view;

  // Sem `onColumnsChange` na visão, renomear, criar opção e "+ propriedade"
  // mexem numa cópia local das colunas desta aba (somem ao recarregar a página).
  const [localColumns, setLocalColumns] = React.useState(columns);
  const tableColumns = onColumnsChange ? columns : localColumns;

  // Três modos de dado: `source` (API, cache aqui), `rows` controlado por quem
  // usa, ou nenhum dos dois (estado local da visão, começa vazio).
  const rows = source ? state.rows : (controlledRows ?? state.rows);
  const setRows = source ? onCommit : (onRowsChange ?? onLocalRows);
  // "Nova página": a da visão, se veio; senão, com `source.onAddRow`, um
  // rascunho (com os valores do grupo/filtros) que passa pelo mesmo caminho
  // otimista das edições.
  const addRow =
    onAddRow ?? (source?.onAddRow ? (preset?: Partial<DataTableRow>) => setRows([...rows, { ...createEmptyRow(tableColumns), ...preset }]) : undefined);
  const loading = !!source && (state.status === "loading" || state.status === "idle") && state.rows.length === 0;

  const errorNotice =
    state.status === "error" ? (
      <Alert
        variant="destructive"
        action={
          <Button size="sm" variant="outline" onClick={onRetry}>
            Tentar de novo
          </Button>
        }
      >
        <AlertTitle>Não deu pra carregar {view.label}</AlertTitle>
        <AlertDescription>{state.loadError}</AlertDescription>
      </Alert>
    ) : state.mutationError ? (
      <Alert
        variant="destructive"
        action={
          <Button size="sm" variant="outline" onClick={onDismissError}>
            Fechar
          </Button>
        }
      >
        <AlertTitle>A alteração não foi salva e foi desfeita</AlertTitle>
        <AlertDescription>{state.mutationError}</AlertDescription>
      </Alert>
    ) : null;

  return (
    <DataTable
      {...tableProps}
      columns={tableColumns}
      onColumnsChange={onColumnsChange ?? setLocalColumns}
      rows={rows}
      onRowsChange={setRows}
      onAddRow={addRow}
      views={tabs}
      activeView={active}
      onViewChange={onViewChange}
      loading={loading}
      emptyMessage={state.status === "error" ? null : emptyMessage}
      notice={
        errorNotice || notice ? (
          <div className="grid gap-4">
            {errorNotice}
            {notice}
          </div>
        ) : undefined
      }
    />
  );
}

/** Aba livre (`render`): o mesmo cartão e a mesma barra de abas da tabela, com o conteúdo de quem usa embaixo. */
function RenderView({
  tabs,
  active,
  onViewChange,
  toolbar,
  children,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onViewChange: (id: string) => void;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-background text-sm text-foreground")}>
      <div className="flex min-h-[42px] flex-wrap items-center justify-between gap-3 border-b border-hairline py-1">
        <ViewTabs views={tabs} activeView={active} onViewChange={onViewChange} />
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      </div>
      <div className="py-5">{children}</div>
    </div>
  );
}
