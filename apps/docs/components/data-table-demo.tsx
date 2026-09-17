"use client";

import * as React from "react";
import { DataTable, type DataTableColumn, type DataTableRow } from "@adinkra/data-table";

// Colunas/linhas inspiradas no print que o usuário mandou (planilha
// financeira do Notion, 15/09/2026) — reduzidas às 4 colunas que entraram
// na v1 (texto, select, número/moeda, data) + uma coluna "Tags" multi-select
// pra mostrar essa variante também, já que o print tinha (Tags/Conta).
const columns: DataTableColumn[] = [
  { id: "descricao", header: "Descrição", type: "text" },
  {
    id: "tipo",
    header: "Tipo",
    type: "select",
    options: [
      { value: "entrada", label: "Entrada", color: "tag-sky" },
      { value: "saida", label: "Saída", color: "tag-coral" },
    ],
  },
  { id: "valor", header: "Valor", type: "number", currency: true },
  { id: "data", header: "Data", type: "date" },
  {
    id: "tags",
    header: "Tags",
    type: "select",
    multi: true,
    options: [
      { value: "salario", label: "salário", color: "secondary" },
      { value: "comida", label: "comida", color: "tag-sky" },
      { value: "fatura", label: "fatura", color: "tag-coral" },
      { value: "habitacao", label: "habitação", color: "tag-mustard" },
    ],
  },
];

const initialRows: DataTableRow[] = [
  {
    id: "1",
    descricao: "pagamento de salário",
    tipo: "entrada",
    valor: 2394.37,
    data: "2026-09-04",
    tags: ["salario"],
  },
  {
    id: "2",
    descricao: "pix (queijo da maria)",
    tipo: "saida",
    valor: -25,
    data: "2026-09-04",
    tags: ["comida"],
  },
  {
    id: "3",
    descricao: "fatura do cartão",
    tipo: "saida",
    valor: -1516.36,
    data: "2026-09-04",
    tags: ["fatura"],
  },
  {
    id: "4",
    descricao: "despesas com casa (pizza da itália)",
    tipo: "saida",
    valor: -275.5,
    data: "2026-09-10",
    tags: ["habitacao", "comida"],
  },
];

export function DataTableDemo() {
  const [rows, setRows] = React.useState<DataTableRow[]>(initialRows);
  return <DataTable columns={columns} rows={rows} onRowsChange={setRows} />;
}
