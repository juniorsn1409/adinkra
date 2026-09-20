"use client";

import * as React from "react";
import { DataTable, type DataTableColumn, type DataTableRow } from "@adinkra/data-table";
import { useLang } from "./language";
import type { MessageKey } from "../i18n/pt";

// Colunas/linhas inspiradas no print que o usuário mandou (planilha
// financeira do Notion, 15/09/2026) — reduzidas às 4 colunas que entraram
// na v1 (texto, select, número/moeda, data) + uma coluna "Tags" multi-select
// pra mostrar essa variante também, já que o print tinha (Tags/Conta).
type T = (key: MessageKey) => string;

const makeColumns = (t: T): DataTableColumn[] => [
  { id: "descricao", header: t("demo.table.description"), type: "text" },
  {
    id: "tipo",
    header: t("demo.table.type"),
    type: "select",
    options: [
      { value: "entrada", label: t("demo.table.income"), color: "tag-sky" },
      { value: "saida", label: t("demo.table.expense"), color: "tag-coral" },
    ],
  },
  { id: "valor", header: t("demo.table.amount"), type: "number", currency: true },
  { id: "data", header: t("demo.table.date"), type: "date" },
  {
    id: "tags",
    header: t("demo.table.tags"),
    type: "select",
    multi: true,
    options: [
      { value: "salario", label: t("demo.table.tagSalary"), color: "secondary" },
      { value: "comida", label: t("demo.table.tagFood"), color: "tag-sky" },
      { value: "fatura", label: t("demo.table.tagBill"), color: "tag-coral" },
      { value: "habitacao", label: t("demo.table.tagHousing"), color: "tag-mustard" },
    ],
  },
];

const makeRows = (t: T): DataTableRow[] => [
  {
    id: "1",
    descricao: t("demo.table.row1"),
    tipo: "entrada",
    valor: 2394.37,
    data: "2026-09-04",
    tags: ["salario"],
  },
  {
    id: "2",
    descricao: t("demo.table.row2"),
    tipo: "saida",
    valor: -25,
    data: "2026-09-04",
    tags: ["comida"],
  },
  {
    id: "3",
    descricao: t("demo.table.row3"),
    tipo: "saida",
    valor: -1516.36,
    data: "2026-09-04",
    tags: ["fatura"],
  },
  {
    id: "4",
    descricao: t("demo.table.row4"),
    tipo: "saida",
    valor: -275.5,
    data: "2026-09-10",
    tags: ["habitacao", "comida"],
  },
];

export function DataTableDemo() {
  const { lang, t } = useLang();
  const columns = React.useMemo(() => makeColumns(t), [t]);
  const [rows, setRows] = React.useState<DataTableRow[]>(() => makeRows(t));

  // Trocar de idioma recomeça o exemplo com as linhas traduzidas (edições feitas na demo se perdem).
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setRows(makeRows(t));
  }, [lang]);

  return <DataTable columns={columns} rows={rows} onRowsChange={setRows} />;
}
