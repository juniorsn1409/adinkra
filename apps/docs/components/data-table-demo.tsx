"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { SimpleBarChart } from "@adinkra/charts";
import {
  DataTableViews,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableRow,
  type DataTableSort,
  type DataTableSource,
  type DataTableViewConfig,
  type DataTableViewsHandle,
} from "@adinkra/data-table";
import { Skeleton } from "@adinkra/skeleton";
import { useLang } from "./language";
import type { MessageKey } from "../i18n/pt";

// Exemplo do desenho aprovado (redesenho φ, 27/09/2026 — canvas "Data table
// · Adinkra φ"): 4 transações de uma planilha financeira, com Descrição
// congelada e botão Abrir, Status, Tipo (relação Saída/Entrada), Valor,
// Saldo (fórmula), Data, Mês, Meta, Tags, Conta e a caixa de conferência.
// Nomes genéricos de propósito (nada de pessoa ou marca real). Soma do
// Valor no rodapé: R$ 460,47 (e o Saldo fecha em −R$ 269,53).
type T = (key: MessageKey) => string;

const makeColumns = (t: T, onOpenGoal: (row: DataTableRow) => void): DataTableColumn[] => [
  { id: "descricao", header: t("demo.table.description"), type: "text", primary: true, frozen: true, width: 233 },
  {
    id: "status",
    header: t("demo.table.status"),
    type: "status",
    width: 144,
    options: [
      { value: "sincronizado", label: t("demo.table.statusSynced"), color: "mist" },
      { value: "pendente", label: t("demo.table.statusPending"), color: "tag-mustard" },
      { value: "erro", label: t("demo.table.statusError"), color: "destructive" },
    ],
  },
  {
    id: "tipo",
    header: t("demo.table.type"),
    type: "relation",
    width: 144,
    // Relação com `options`: edita pelo mesmo seletor do select. O glifo
    // (entrada = primary, saída = destructive, nunca verde) segue o valor.
    options: [
      { value: "saida", label: t("demo.table.expense"), color: "tag-coral" },
      { value: "entrada", label: t("demo.table.income"), color: "tag-sky" },
    ],
    relation: { icon: (value) => (value === "entrada" ? "in" : "out") },
  },
  { id: "valor", header: t("demo.table.amount"), type: "number", currency: true, width: 144, aggregate: "sum" },
  {
    id: "saldo",
    header: t("demo.table.balance"),
    type: "formula",
    format: "currency",
    width: 144,
    aggregate: "sum",
    // Trocar o Tipo inverte o sinal; digitar no Saldo grava uma sobrescrita
    // manual (apagar o campo volta a esta conta).
    formula: (row) => (row.tipo === "entrada" ? 1 : -1) * (typeof row.valor === "number" ? row.valor : 0),
  },
  { id: "data", header: t("demo.table.date"), type: "date", dateStyle: "short", width: 144 },
  { id: "mes", header: t("demo.table.month"), type: "relation", width: 144, relation: { icon: "calendar" } },
  // Relação sem opções: o texto edita como texto; o glifo abre (aqui, só avisa embaixo da tabela).
  { id: "meta", header: t("demo.table.goal"), type: "relation", width: 144, relation: { icon: "pie", onClick: onOpenGoal } },
  {
    id: "tags",
    header: t("demo.table.tags"),
    type: "select",
    multi: true,
    selectStyle: "dot",
    width: 144,
    options: [
      { value: "comunicacao", label: t("demo.table.tagCommunication"), color: "tag-mustard" },
      { value: "cuidados", label: t("demo.table.tagPersonalCare"), color: "tag-mustard" },
      { value: "restituicao", label: t("demo.table.tagRefund"), color: "tag-navy" },
      { value: "outros", label: t("demo.table.tagOther"), color: "tag-coral" },
      { value: "transferencia", label: t("demo.table.tagTransfer"), color: "tag-sky" },
    ],
  },
  {
    id: "conta",
    header: t("demo.table.account"),
    type: "select",
    selectStyle: "dot",
    width: 144,
    options: [
      { value: "corrente", label: t("demo.table.accountChecking"), color: "tag-sky" },
      { value: "carteira", label: t("demo.table.accountWallet"), color: "tag-mustard" },
    ],
  },
  { id: "conferida", header: "", type: "checkbox", width: 55 },
];

const makeRows = (t: T): DataTableRow[] => {
  const base = { mes: t("demo.table.september"), data: "2026-09-21" };
  return [
    { id: "1", ...base, descricao: t("demo.table.row1"), status: "sincronizado", tipo: "saida", valor: 20, meta: t("demo.table.fixedCosts"), tags: ["comunicacao"], conta: "corrente", conferida: false },
    { id: "2", ...base, descricao: t("demo.table.row2"), status: "sincronizado", tipo: "saida", valor: 45, meta: t("demo.table.fixedCosts"), tags: ["cuidados"], conta: "corrente", conferida: false },
    { id: "3", ...base, descricao: t("demo.table.row3"), status: "sincronizado", tipo: "entrada", valor: 95.47, meta: "", tags: ["restituicao"], conta: "corrente", conferida: false },
    { id: "4", ...base, descricao: t("demo.table.row4"), status: "pendente", tipo: "saida", valor: 300, data: "2026-09-27", meta: t("demo.table.fixedCosts"), tags: ["outros"], conta: "carteira", conferida: true },
  ];
};

// Ordenação e filtros já ativos (chips em céu), como no desenho: Data
// crescente; Tags não contém Transferência; Mês é Setembro. Nenhum dos dois
// filtros tira linha — é pra mostrar os chips, não pra esconder dado.
const defaultSorts: DataTableSort[] = [{ columnId: "data", direction: "asc" }];
const makeFilters = (t: T): DataTableFilter[] => [
  { id: "f-tags", columnId: "tags", operator: "isNot", value: "transferencia" },
  { id: "f-mes", columnId: "mes", operator: "is", value: t("demo.table.september") },
];

// ─── "APIs" de mentira ───────────────────────────────────────────────
//
// Uma por aba, cada uma com o seu próprio "banco" em memória, atraso curto
// (setTimeout) e respeito ao AbortSignal — o formato de uma API de verdade,
// sem rede. `failNext` é o botão "Simular erro": a PRÓXIMA chamada de
// qualquer aba falha (carga → Alert com "Tentar de novo"; edição → a
// mudança volta e o Alert explica).

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function mockSource(label: string, seed: () => DataTableRow[], failNext: { current: boolean }, t: T): DataTableSource {
  let store: DataTableRow[] | null = null;
  const maybeFail = () => {
    if (!failNext.current) return;
    failNext.current = false;
    throw new Error(`${label}: ${t("demo.table.simulatedError")}`);
  };
  return {
    async load({ signal }) {
      await wait(610, signal);
      maybeFail();
      store ??= seed();
      return store.map((row) => ({ ...row }));
    },
    async onRowChange(row, patch) {
      await wait(233);
      maybeFail();
      store = (store ?? []).map((r) => (r.id === row.id ? { ...r, ...patch } : r));
    },
    async onAddRow(draft) {
      await wait(233);
      maybeFail();
      store = [...(store ?? []), { ...draft }];
    },
    async onDeleteRows(ids) {
      await wait(233);
      maybeFail();
      store = (store ?? []).filter((row) => !ids.includes(row.id));
    },
  };
}

// ─── Faturas ─────────────────────────────────────────────────────────

const invoiceColumns = (t: T): DataTableColumn[] => [
  { id: "cartao", header: t("demo.table.card"), type: "relation", primary: true, frozen: true, width: 233, relation: { icon: "link" } },
  { id: "mes", header: t("demo.table.month"), type: "relation", width: 144, relation: { icon: "calendar" } },
  { id: "vencimento", header: t("demo.table.dueDate"), type: "date", dateStyle: "short", width: 144 },
  { id: "valor", header: t("demo.table.amount"), type: "number", currency: true, width: 144, aggregate: "sum" },
  {
    id: "status",
    header: t("demo.table.status"),
    type: "status",
    width: 144,
    options: [
      { value: "aberta", label: t("demo.table.invoiceOpen"), color: "tag-sky" },
      { value: "fechada", label: t("demo.table.invoiceClosed"), color: "tag-mustard" },
      { value: "paga", label: t("demo.table.invoicePaid"), color: "mist" },
    ],
  },
  { id: "pago", header: t("demo.table.paid"), type: "checkbox", width: 89 },
];

const invoiceRows = (t: T): DataTableRow[] => [
  { id: "f1", cartao: t("demo.table.cardMain"), mes: t("demo.table.september"), vencimento: "2026-10-05", valor: 1516.36, status: "aberta", pago: false },
  { id: "f2", cartao: t("demo.table.cardExtra"), mes: t("demo.table.august"), vencimento: "2026-09-05", valor: 820.4, status: "paga", pago: true },
  { id: "f3", cartao: t("demo.table.cardVirtual"), mes: t("demo.table.september"), vencimento: "2026-10-05", valor: 139.9, status: "fechada", pago: false },
];

// ─── Transferências ──────────────────────────────────────────────────

const accountOptions = (t: T) => [
  { value: "corrente", label: t("demo.table.accountChecking"), color: "tag-sky" as const },
  { value: "poupanca", label: t("demo.table.accountSavings"), color: "tag-navy" as const },
  { value: "carteira", label: t("demo.table.accountWallet"), color: "tag-mustard" as const },
];

const transferColumns = (t: T): DataTableColumn[] => [
  { id: "de", header: t("demo.table.from"), type: "relation", primary: true, width: 144, options: accountOptions(t), relation: { icon: "out" } },
  { id: "para", header: t("demo.table.to"), type: "relation", width: 144, options: accountOptions(t), relation: { icon: "in" } },
  { id: "data", header: t("demo.table.date"), type: "date", dateStyle: "short", width: 144 },
  { id: "valor", header: t("demo.table.amount"), type: "number", currency: true, width: 144, aggregate: "sum" },
  {
    id: "status",
    header: t("demo.table.status"),
    type: "status",
    width: 144,
    options: [
      { value: "concluida", label: t("demo.table.transferDone"), color: "mist" },
      { value: "agendada", label: t("demo.table.transferScheduled"), color: "tag-mustard" },
      { value: "falhou", label: t("demo.table.transferFailed"), color: "destructive" },
    ],
  },
];

const transferRows = (): DataTableRow[] => [
  { id: "t1", de: "corrente", para: "poupanca", data: "2026-09-02", valor: 500, status: "concluida" },
  { id: "t2", de: "corrente", para: "carteira", data: "2026-09-15", valor: 200, status: "concluida" },
  { id: "t3", de: "poupanca", para: "corrente", data: "2026-09-30", valor: 300, status: "agendada" },
];

// ─── Rendimentos ─────────────────────────────────────────────────────

const earningColumns = (t: T): DataTableColumn[] => [
  { id: "ativo", header: t("demo.table.asset"), type: "relation", primary: true, frozen: true, width: 233, relation: { icon: "pie" } },
  {
    id: "tipo",
    header: t("demo.table.type"),
    type: "select",
    selectStyle: "dot",
    width: 144,
    options: [
      { value: "dividendo", label: t("demo.table.dividend"), color: "tag-mustard" },
      { value: "jcp", label: t("demo.table.jcp"), color: "tag-navy" },
      { value: "juros", label: t("demo.table.interest"), color: "tag-sky" },
    ],
  },
  { id: "data", header: t("demo.table.date"), type: "date", dateStyle: "short", width: 144 },
  { id: "investido", header: t("demo.table.invested"), type: "number", currency: true, width: 144 },
  { id: "valor", header: t("demo.table.amount"), type: "number", currency: true, width: 144, aggregate: "sum" },
  {
    id: "rentabilidade",
    header: t("demo.table.yield"),
    type: "formula",
    format: "number",
    width: 144,
    aggregate: "avg",
    // Rendimento sobre o investido, em %. Editável: digitar sobrescreve, apagar volta à conta.
    formula: (row) => {
      const invested = typeof row.investido === "number" ? row.investido : 0;
      const value = typeof row.valor === "number" ? row.valor : 0;
      return invested ? Math.round((value / invested) * 10000) / 100 : 0;
    },
  },
];

const earningRows = (t: T): DataTableRow[] => [
  { id: "r1", ativo: t("demo.table.assetFundA"), tipo: "dividendo", data: "2026-09-10", investido: 10000, valor: 85 },
  { id: "r2", ativo: t("demo.table.assetStockB"), tipo: "jcp", data: "2026-09-18", investido: 3000, valor: 42.3 },
  { id: "r3", ativo: t("demo.table.assetBondC"), tipo: "juros", data: "2026-09-30", investido: 12000, valor: 120.5 },
];

// ─── Demo ────────────────────────────────────────────────────────────

function TransactionsChart({ rows, loading, t }: { rows?: DataTableRow[]; loading: boolean; t: T }) {
  if (!rows) {
    return loading ? <Skeleton className="h-[233px] w-full" /> : <p className="text-sm text-muted-foreground">{t("demo.table.chartEmpty")}</p>;
  }
  const data = rows.map((row) => ({ nome: String(row.descricao ?? ""), valor: typeof row.valor === "number" ? row.valor : 0 }));
  return (
    <div className="grid gap-4">
      <p className="font-display text-base font-semibold text-heading">{t("demo.table.chartTitle")}</p>
      <SimpleBarChart data={data} config={{ valor: { label: t("demo.table.amount") } }} xAxisKey="nome" className="w-full" />
    </div>
  );
}

function DemoViews() {
  const { t } = useLang();
  const tableRef = React.useRef<DataTableViewsHandle>(null);
  const failNext = React.useRef(false);
  const [armed, setArmed] = React.useState(false);
  const [opened, setOpened] = React.useState<string | null>(null);

  // Mesmos controles em toda aba (slot `toolbar`): armar a falha da próxima
  // chamada e recarregar a aba ativa pelo `ref`.
  const toolbar = (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          failNext.current = true;
          setArmed(true);
        }}
      >
        {t("demo.table.simulateError")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => tableRef.current?.reload()}
      >
        {t("demo.table.reloadView")}
      </Button>
    </>
  );

  const views = React.useMemo<DataTableViewConfig[]>(() => {
    const fail = {
      get current() {
        return failNext.current;
      },
      set current(value: boolean) {
        failNext.current = value;
        if (!value) setArmed(false);
      },
    };
    return [
      {
        id: "transacoes",
        label: t("demo.table.viewTransactions"),
        columns: makeColumns(t, (row) => setOpened(`${t("demo.table.goal")}: ${String(row.meta ?? "")}`)),
        source: mockSource(t("demo.table.viewTransactions"), () => makeRows(t), fail, t),
        searchable: true,
        defaultFilters: makeFilters(t),
        defaultSorts,
        onOpenRow: (row) => setOpened(String(row.descricao ?? row.id)),
      },
      {
        id: "faturas",
        label: t("demo.table.viewBills"),
        columns: invoiceColumns(t),
        source: mockSource(t("demo.table.viewBills"), () => invoiceRows(t), fail, t),
      },
      {
        id: "transferencias",
        label: t("demo.table.viewTransfers"),
        columns: transferColumns(t),
        source: mockSource(t("demo.table.viewTransfers"), transferRows, fail, t),
      },
      {
        id: "rendimentos",
        label: t("demo.table.viewEarnings"),
        columns: earningColumns(t),
        source: mockSource(t("demo.table.viewEarnings"), () => earningRows(t), fail, t),
        // Rendimentos muda por fora (o banco credita): recarrega a cada volta pra aba.
        refetchOnActivate: true,
      },
      {
        id: "grafico",
        label: t("demo.table.viewChart"),
        dependsOn: ["transacoes"],
        render: (ctx) => <TransactionsChart rows={ctx.rowsOf("transacoes")} loading={ctx.isLoading("transacoes")} t={t} />,
      },
    ];
  }, [t]);

  // Mesmo toolbar em toda aba.
  const withToolbar = views.map((view) => ({ ...view, toolbar }));

  return (
    <div className="grid w-full gap-4">
      <DataTableViews ref={tableRef} views={withToolbar} defaultView="transacoes" />
      {armed ? <p className="text-sm text-muted-foreground">{t("demo.table.simulateArmed")}</p> : null}
      {opened ? (
        <p className="text-sm text-muted-foreground">
          {t("demo.table.opened")} <span className="font-medium text-heading">{opened}</span>
        </p>
      ) : null}
    </div>
  );
}

export function DataTableDemo() {
  const { lang } = useLang();
  // Trocar de idioma recomeça o exemplo inteiro (APIs de mentira, cache e
  // edições): as fontes são recriadas com os textos traduzidos.
  return <DemoViews key={lang} />;
}
