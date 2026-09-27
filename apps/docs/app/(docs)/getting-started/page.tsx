import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { T } from "../../../components/language";
import { DocsArticle, DocsPageHeader, DocsSection, codeBlockClass } from "../../../components/mdx-components";
import { PageTopbar } from "../../../components/page-topbar";

export const metadata = { title: "Getting started" };

// Mesmo bloco de código das páginas de componente (MdxPre): padding 21,
// fundo --surface, mono 13/21.
const codeBlock = codeBlockClass;

export default function GettingStartedPage() {
  return (
    <>
      <GlitchCursor />
      <PageTopbar title="Getting started" trail={[]} />
      <DocsArticle>
        <DocsPageHeader
          eyebrow="Getting started"
          title={<T k="gettingStarted.title" />}
          description={<T k="gettingStarted.tagline" />}
        />

        <DocsSection title={<T k="gettingStarted.before" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.beforeText" />
          </p>
        </DocsSection>

        <DocsSection title={<T k="gettingStarted.step1" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.step1Text" />
          </p>
          <pre className={codeBlock}>{"bun add @adinkra/tokens @adinkra/core"}</pre>
        </DocsSection>

        <DocsSection title={<T k="gettingStarted.step2" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.step2Text" />
          </p>
          <pre className={codeBlock}>
            {'@import "tailwindcss";\n@import "@adinkra/tokens/tokens.css";\n\n@source "../node_modules/@adinkra/*/dist/**/*.js";'}
          </pre>
        </DocsSection>

        <DocsSection title={<T k="gettingStarted.step3" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.step3Text" />
          </p>
          <pre className={codeBlock}>{"bun add @adinkra/button"}</pre>
        </DocsSection>

        <DocsSection title={<T k="gettingStarted.step4" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.step4Text" />
          </p>
          <pre className={codeBlock}>
            {'import { Button } from "@adinkra/button";\n\n<Button variant="primary">Publicar</Button>;'}
          </pre>
        </DocsSection>

        <DocsSection title={<T k="gettingStarted.dark" />}>
          <p className="max-w-[610px] text-muted-foreground">
            <T k="gettingStarted.darkText" />
          </p>
        </DocsSection>

        <div className="flex flex-wrap gap-4">
          <Link href="/components/button" className={buttonVariants({ variant: "primary" })}>
            <T k="common.browseComponents" />
          </Link>
          <Link href="/introduction" className={buttonVariants({ variant: "outline" })}>
            <T k="common.introduction" />
          </Link>
        </div>
      </DocsArticle>
    </>
  );
}
