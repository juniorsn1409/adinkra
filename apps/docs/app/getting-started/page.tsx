import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { DocsShell } from "../../components/docs-shell";

export const metadata = { title: "Getting started" };

export default function GettingStartedPage() {
  return (
    <DocsShell>
      <GlitchCursor />
      <article className="grid w-full max-w-3xl gap-8 pb-24">
        <header className="grid gap-2 border-b border-hairline pb-6">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Getting started
          </p>
          <h1 className="font-display text-3xl font-medium text-heading">Instalação</h1>
          <p className="text-muted-foreground">Instale só os pacotes que for usar — cada componente é isolado.</p>
        </header>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading">1. Instale os tokens</h2>
          <p className="text-muted-foreground">
            <code>@adinkra/tokens</code> traz as variáveis CSS e o tema do Tailwind v4 (dia e noite) — quase todo
            pacote depende dele.
          </p>
          <pre className="overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 font-mono text-xs leading-relaxed">
            {"bun add @adinkra/tokens @adinkra/core"}
          </pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading">2. Instale um componente</h2>
          <p className="text-muted-foreground">Por exemplo, o Button:</p>
          <pre className="overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 font-mono text-xs leading-relaxed">
            {"bun add @adinkra/button"}
          </pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading">3. Use</h2>
          <pre className="overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 font-mono text-xs leading-relaxed">
            {'import { Button } from "@adinkra/button";\n\n<Button variant="primary">Publicar</Button>;'}
          </pre>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/components/button" className={buttonVariants({ variant: "primary" })}>
            Ver os componentes
          </Link>
          <Link href="/introduction" className={buttonVariants({ variant: "outline" })}>
            Introduction
          </Link>
        </div>
      </article>
    </DocsShell>
  );
}
