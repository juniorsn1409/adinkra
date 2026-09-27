import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@adinkra/table";
import Link from "next/link";
import * as React from "react";
import { T } from "./language";
import type { MessageKey } from "../i18n/pt";

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

// ─── Casca das páginas de documentação ─────────────────────────────
// Medidas do canvas "Adinkra Docs · demo φ" (27/09/2026): coluna de
// conteúdo de 987 ao lado da sidebar de 233, margens de 55 no desktop (21
// no mobile), 89 no fim da página (55 no mobile) e 55 entre seções (34 no
// mobile). `box-content` faz o max-w valer só para a coluna, sem contar o
// padding: a largura continua automática (preenche o que sobra ao lado da
// sidebar) até bater nos 987.
export function DocsArticle({ children }: { children: React.ReactNode }) {
  return (
    <article className="box-content grid max-w-[987px] gap-6 px-5 pb-7 pt-5 md:gap-7 md:px-7 md:pb-8 md:pt-7">
      {children}
    </article>
  );
}

/**
 * Cabeçalho de página: sobretítulo em mono caixa-alta (10/16), título 68/89
 * (42/55 no mobile), descrição 21/34 (16/26 no mobile) com no máximo 610 de
 * largura, 8 entre as linhas e 34 até o fio de baixo.
 */
export function DocsPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <header className="grid gap-3 border-b border-hairline pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">{eyebrow}</p>
      <h1 className="-ml-[0.04em] font-display text-2xl font-medium tracking-[-0.01em] text-heading md:text-3xl">
        {title}
      </h1>
      <p className="max-w-[610px] text-base text-muted-foreground md:text-lg">{description}</p>
    </header>
  );
}

const h2Class = "font-display text-xl font-semibold text-heading";

/** Seção das páginas escritas à mão (Introduction, Getting started): título 26/34 e 13 até o conteúdo. */
export function DocsSection({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className={h2Class}>{title}</h2>
      {children}
    </section>
  );
}

export function StatesGrid({ children }: { children: React.ReactNode }) {
  // 4 colunas com 21 entre elas no desktop; 2 colunas com 13 no mobile.
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">{children}</div>;
}

export function State({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // Fica quieta de propósito: numa grade de 4-8 caixas, dar borda de
    // tinta + sombra dura em cada uma sobrecarregaria a página (a NN/g avisa
    // exatamente disso). Só o <Preview> de cima leva o tratamento cheio;
    // aqui é fio de 1 (--hairline), fundo --card, raio 8 e o rótulo em cima.
    <figure className="flex flex-col items-start gap-3 rounded-card border border-hairline bg-card p-4 lg:gap-4 lg:p-5">
      <figcaption className="font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">{label}</figcaption>
      <div className="flex min-h-[42px] w-full items-center">{children}</div>
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
 * `@adinkra/table` do sistema, não um `<table>` à parte: cabeçalho 34,
 * linhas 42, colunas de 144 / 377 / 89 / resto. No mobile (abaixo de 768,
 * o mesmo corte da gaveta da sidebar) a tabela vira cartões empilhados, um
 * por prop, com 13 entre eles.
 */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <>
      <div className="hidden md:block">
        <Table columnLines={false} className="min-w-[610px]">
          <TableHeader className="bg-surface">
            <TableRow>
              <TableHead className="w-[144px]"><T k="docs.prop" /></TableHead>
              <TableHead className="w-[377px]"><T k="docs.type" /></TableHead>
              <TableHead className="w-[89px]"><T k="docs.default" /></TableHead>
              <TableHead><T k="docs.description" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.prop}>
                <TableCell className="font-mono text-sm text-heading">{row.prop}</TableCell>
                <TableCell className="whitespace-normal font-mono text-sm text-muted-foreground">{row.type}</TableCell>
                <TableCell className="font-mono text-sm text-heading">{row.default ?? "—"}</TableCell>
                <TableCell className="whitespace-normal text-sm text-foreground">{row.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-4 md:hidden">
        {rows.map((row) => (
          <li
            key={row.prop}
            className="grid gap-2 rounded-card border-[length:var(--border-width)] border-ink bg-card p-5"
          >
            <code className="font-mono text-base text-heading">{row.prop}</code>
            <code className="break-words font-mono text-sm text-muted-foreground">{row.type}</code>
            <span className="font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">
              <T k="docs.default" /> {row.default ?? "—"}
            </span>
            <span className="text-sm text-foreground">{row.description}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

// Navegação anterior/próxima do fim da página: dois cartões de 89 de altura,
// 21 entre eles (13 no mobile, empilhados), 34 depois do fio (21 no mobile).
// Cartão interativo = mecânica de estados do sistema (sobe 2 no hover com a
// sombra de 5, afunda 3 ao pressionar).
export interface DocsPagerLink {
  title: string;
  href: string;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className="flex-none">
      <path
        d={direction === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const pagerCard =
  "flex h-[89px] flex-col justify-center gap-2 rounded-card border-[length:var(--border-width)] border-ink bg-card px-5 shadow-brutal " +
  "transition-[transform,box-shadow] duration-150 " +
  "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-hover " +
  "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring";

function PagerLabel({ k }: { k: MessageKey }) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">
      <T k={k} />
    </span>
  );
}

export function DocsPager({ prev, next }: { prev?: DocsPagerLink; next?: DocsPagerLink }) {
  if (!prev && !next) return null;
  return (
    <nav className="grid gap-4 border-t border-hairline pt-5 md:grid-cols-2 md:gap-5 md:pt-6">
      {prev ? (
        <Link href={prev.href} rel="prev" className={`${pagerCard} items-start`}>
          <PagerLabel k="sample.previous" />
          <span className="flex items-center gap-3 font-display text-lg font-semibold text-heading">
            <ChevronIcon direction="left" />
            {prev.title}
          </span>
        </Link>
      ) : null}
      {next ? (
        <Link href={next.href} rel="next" className={`${pagerCard} items-end text-right md:col-start-2`}>
          <PagerLabel k="sample.next" />
          <span className="flex items-center gap-3 font-display text-lg font-semibold text-heading">
            {next.title}
            <ChevronIcon direction="right" />
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * Bloco de código: padding 21, fundo --surface, borda 2 de tinta, raio 8,
 * mono 13/21 em --heading. A linguagem do bloco (```tsx, ```bash) vira um
 * rótulo em mono caixa-alta no canto de cima, como no canvas — lida da
 * className `language-*` que o MDX põe no <code> filho.
 */
export const codeBlockClass =
  "overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-surface p-5 font-mono text-sm text-heading";

export function MdxPre({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) {
  const codeClass = React.isValidElement<{ className?: string }>(children) ? children.props.className : undefined;
  const lang = codeClass?.match(/language-([\w-]+)/)?.[1];
  return (
    <div className="relative">
      {lang ? (
        <span className="pointer-events-none absolute right-4 top-3 font-mono text-xs uppercase tracking-[0.13em] text-muted-foreground">
          {lang}
        </span>
      ) : null}
      <pre {...props} className={codeBlockClass}>
        {children}
      </pre>
    </div>
  );
}

// Títulos de seção 26/34. O ritmo entre seções (55 no desktop, 34 no mobile)
// sai daqui: o conteúdo do MDX é uma lista plana (h2, p, Preview...) numa
// grade com 13 entre os blocos, e cada h2 soma 42 (21 no mobile) em cima —
// menos o primeiro bloco, que já fica 55 abaixo do cabeçalho da página.
export function MdxH2(props: React.ComponentPropsWithoutRef<"h2">) {
  return <h2 {...props} className={`${h2Class} mt-5 first:mt-0 md:mt-[42px] md:first:mt-0`} />;
}

export function MdxP(props: React.ComponentPropsWithoutRef<"p">) {
  return <p {...props} className="max-w-[610px] text-foreground" />;
}

// Listas soltas no MDX (Acessibilidade, por exemplo): recuo 21, 8 entre itens.
export function MdxUl(props: React.ComponentPropsWithoutRef<"ul">) {
  return <ul {...props} className="grid max-w-[610px] list-disc gap-3 pl-5 text-foreground" />;
}

// Mapeia para os nomes que o MDX usa de verdade (pre/h2/p/ul minúsculos).
export const mdxHtmlOverrides = {
  pre: MdxPre,
  h2: MdxH2,
  p: MdxP,
  ul: MdxUl,
};
