// Ícones da tabela — só <svg>, sem hooks (não precisa de "use client").
// Os antigos (viewBox 16, traço 1.3) vieram de data-table.tsx sem mudança;
// os do redesenho φ (27/09) usam o viewBox 24 com traço 2 do gerador do
// desenho (gen/dt.mjs) — a 13px os dois dão o mesmo ~1px de traço na tela.
import * as React from "react";
import type { ColumnType, RelationIcon } from "./types";

export function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" {...props}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Mesmo traço do resto do sistema — não lucide-react. Só na barra de edição
// em massa (a ação de excluir por linha/em massa tinha saído inteira antes
// — "remove a acao do datatable de remover" —, voltou só aqui a pedido do
// usuário — "adiciona um button de exclusao na barra de quando clica no
// select").
export function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3.5 4.5 4.1 13a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.6-8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function DragHandleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="3" r="1" />
      <circle cx="11" cy="3" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="13" r="1" />
      <circle cx="11" cy="13" r="1" />
    </svg>
  );
}

// ─── Redesenho φ ─────────────────────────────────────────────────────

const paths = {
  status: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  sigma: "M18 5H6l6 7-6 7h12",
  out: "M7 17L17 7M9 7h8v8",
  in: "M17 7L7 17M15 17H7V9",
  sortUp: "M12 19V5M5 12l7-7 7 7",
  sortDown: "M12 5v14M19 12l-7 7-7-7",
  expand: "M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7",
  chevDown: "M6 9l6 6 6-6",
  chevUp: "M6 15l6-6 6 6",
  x: "M6 6l12 12M18 6L6 18",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  sort: "M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4",
  minus: "M6 12h12",
} as const;

export type GlyphName = keyof typeof paths | "tag" | "calendar" | "box" | "file" | "eye" | "pie" | "search" | "pin";

export function Glyph({ name, size = 13, strokeWidth = 2, className }: { name: GlyphName; size?: number; strokeWidth?: number; className?: string }) {
  let body: React.ReactNode;
  switch (name) {
    case "tag":
      body = (
        <>
          <path d="M3 3h8l10 10-8 8L3 11z" />
          <circle cx="7.5" cy="7.5" r="1" />
        </>
      );
      break;
    case "calendar":
      body = (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>
      );
      break;
    case "box":
      body = (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12l3 3 5-6" />
        </>
      );
      break;
    case "file":
      body = (
        <>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
        </>
      );
      break;
    case "eye":
      body = (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
      break;
    case "pie":
      body = <path d="M12 3a9 9 0 1 0 9 9h-9z" />;
      break;
    case "search":
      body = (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </>
      );
      break;
    case "pin":
      body = <path d="M9 3h6l-1 6 4 4H6l4-4zM12 13v8" />;
      break;
    default:
      body = <path d={paths[name]} />;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {body}
    </svg>
  );
}

// Glifos de texto do cabeçalho. `#` de número é literalmente o glifo, não
// um SVG — é assim que o próprio Notion mostra coluna numérica, mais simples
// que desenhar. "Aa" de texto segue a mesma lógica (redesenho φ: mono 10,
// seminegrito, 13 de largura — antes era um ícone de três linhas).
function TextGlyph({ children, size }: { children: string; size: "xs" | "sm" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex w-4 flex-none items-center justify-center font-mono font-semibold leading-none ${size === "xs" ? "text-xs" : "text-sm"}`}
    >
      {children}
    </span>
  );
}

/**
 * Ícone do tipo de coluna (13px), no cabeçalho e na barra de edição em
 * massa: Aa, #, Σ, calendário, etiqueta, relação ↗, status, caixa.
 */
export function ColumnTypeIcon({ type }: { type: ColumnType }) {
  switch (type) {
    case "text":
      return <TextGlyph size="xs">Aa</TextGlyph>;
    case "number":
      return <TextGlyph size="sm">#</TextGlyph>;
    case "formula":
      return <Glyph name="sigma" />;
    case "date":
      return <Glyph name="calendar" />;
    case "select":
      return <Glyph name="tag" />;
    case "relation":
      return <Glyph name="out" />;
    case "status":
      return <Glyph name="status" />;
    case "checkbox":
      return <Glyph name="box" />;
  }
}

export function RelationGlyph({ icon }: { icon: RelationIcon }) {
  if (icon === "in") return <Glyph name="in" strokeWidth={2.5} />;
  if (icon === "out" || icon === "link") return <Glyph name="out" strokeWidth={icon === "out" ? 2.5 : 2} />;
  return <Glyph name={icon} />;
}
