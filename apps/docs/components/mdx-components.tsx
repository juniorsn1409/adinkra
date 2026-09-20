import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@adinkra/table";
import type * as React from "react";
import { T } from "./language";

/**
 * Blocos de documentação usados dentro do MDX (ver content/components/*.mdx)
 * — StatesGrid, State e PropsTable são só apresentação, sem hooks, então
 * ficam de fora de "use client" de propósito (Preview, que usa useState,
 * mora sozinho em preview.tsx).
 *
 * Cada peça é exportada individualmente, nunca dentro de um objeto: um
 * objeto exportado de um módulo "use client" chega VAZIO do lado do
 * servidor — só bindings de export individuais atravessam a fronteira
 * corretamente. Esse era o bug que travava o build; ver o histórico do
 * commit. Como regra, mantemos esse padrão aqui também, por consistência.
 */

export function StatesGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{children}</div>;
}

export function State({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="grid gap-2">
      {/* Fica quieta de propósito: numa grade de 4-8 caixas, dar borda +
          sombra dura em cada uma sobrecarregaria a página (a NN/g avisa
          exatamente disso). Só o <Preview> de cima leva o tratamento cheio. */}
      <div className="flex min-h-16 items-center rounded-control border border-hairline bg-background p-3">
        {children}
      </div>
      <figcaption className="font-mono text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

interface PropRow {
  prop: string;
  type: string;
  default?: string;
  description: string;
}

/**
 * Linhas escritas à mão por enquanto — DECISOES.md prevê gerar isso a partir
 * do tipo TypeScript (react-docgen-typescript), mas essa parte ainda não
 * está implementada (ver "Próximos passos"). A marcação em si é o próprio
 * `@adinkra/table` do sistema, não um `<table>` à parte.
 */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Table className="min-w-[480px]">
      <TableHeader>
        <TableRow>
          <TableHead><T k="docs.prop" /></TableHead>
          <TableHead><T k="docs.type" /></TableHead>
          <TableHead><T k="docs.default" /></TableHead>
          <TableHead><T k="docs.description" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.prop}>
            <TableCell className="font-mono text-xs">{row.prop}</TableCell>
            <TableCell className="whitespace-normal font-mono text-xs text-muted-foreground">{row.type}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{row.default ?? "—"}</TableCell>
            <TableCell className="whitespace-normal text-muted-foreground">{row.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MdxPre(props: React.ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      {...props}
      className="overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 font-mono text-xs leading-relaxed"
    />
  );
}

export function MdxH2(props: React.ComponentPropsWithoutRef<"h2">) {
  return <h2 {...props} className="font-display text-xl font-medium text-heading" />;
}

export function MdxP(props: React.ComponentPropsWithoutRef<"p">) {
  return <p {...props} className="max-w-[65ch] text-foreground" />;
}

// Mapeia para os nomes que o MDX usa de verdade (pre/h2/p minúsculos).
export const mdxHtmlOverrides = {
  pre: MdxPre,
  h2: MdxH2,
  p: MdxP,
};
