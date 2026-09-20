import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { T } from "../../../components/language";
import { PageTopbar } from "../../../components/page-topbar";

export const metadata = { title: "Getting started" };

const codeBlock =
  "overflow-x-auto rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 font-mono text-xs leading-relaxed";

export default function GettingStartedPage() {
  return (
    <>
      <GlitchCursor />
      <article className="mx-auto grid w-full max-w-3xl gap-8 pb-24">
        <PageTopbar title="Getting started" trail={[]} />
        <header className="grid gap-2 border-b border-hairline pb-6">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Getting started
          </p>
          <h1 className="-ml-[0.04em] font-display text-3xl font-medium text-heading"><T k="gettingStarted.title" /></h1>
          <p className="text-muted-foreground">
            <T k="gettingStarted.tagline" />
          </p>
        </header>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.before" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.beforeText" />
          </p>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.step1" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.step1Text" />
          </p>
          <pre className={codeBlock}>{"bun add @adinkra/tokens @adinkra/core"}</pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.step2" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.step2Text" />
          </p>
          <pre className={codeBlock}>
            {'@import "tailwindcss";\n@import "@adinkra/tokens/tokens.css";\n\n@source "../node_modules/@adinkra/*/dist/**/*.js";'}
          </pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.step3" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.step3Text" />
          </p>
          <pre className={codeBlock}>{"bun add @adinkra/button"}</pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.step4" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.step4Text" />
          </p>
          <pre className={codeBlock}>
            {'import { Button } from "@adinkra/button";\n\n<Button variant="primary">Publicar</Button>;'}
          </pre>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="gettingStarted.dark" /></h2>
          <p className="text-muted-foreground">
            <T k="gettingStarted.darkText" />
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/components/button" className={buttonVariants({ variant: "primary" })}>
            <T k="common.browseComponents" />
          </Link>
          <Link href="/introduction" className={buttonVariants({ variant: "outline" })}>
            <T k="common.introduction" />
          </Link>
        </div>
      </article>
    </>
  );
}
