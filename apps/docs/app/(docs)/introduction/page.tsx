import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { T } from "../../../components/language";
import { PageTopbar } from "../../../components/page-topbar";

export const metadata = { title: "Introduction" };

const principles = [
  {
    title: <T k="common.packagePerComponent" />,
    text: <T k="introduction.principle.package.text" />,
  },
  {
    title: <T k="introduction.principle.tokens.title" />,
    text: <T k="introduction.principle.tokens.text" />,
  },
  {
    title: <T k="introduction.principle.style.title" />,
    text: <T k="introduction.principle.style.text" />,
  },
  {
    title: <T k="introduction.principle.theme.title" />,
    text: <T k="introduction.principle.theme.text" />,
  },
  {
    title: <T k="introduction.principle.symbols.title" />,
    text: <T k="introduction.principle.symbols.text" />,
  },
];

export default function IntroductionPage() {
  return (
    <>
      <GlitchCursor />
      <article className="mx-auto grid w-full max-w-3xl gap-8 pb-24">
        <PageTopbar title={<T k="common.introduction" />} trail={[]} />
        <header className="grid gap-2 border-b border-hairline pb-6">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <T k="common.introduction" />
          </p>
          <h1 className="-ml-[0.04em] font-display text-3xl font-medium text-heading">Adinkra</h1>
          <p className="text-muted-foreground">
            <T k="introduction.tagline" />
          </p>
        </header>

        <div className="grid gap-4 text-foreground">
          <p>
            <T k="introduction.intro" />
          </p>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="introduction.principles" /></h2>
          <ul className="grid gap-4">
            {principles.map((item, index) => (
              <li key={index} className="grid gap-1">
                <p className="font-display text-sm font-medium text-heading">{item.title}</p>
                <p className="text-foreground">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3">
          <h2 className="font-display text-xl font-medium text-heading"><T k="introduction.start" /></h2>
          <p className="text-foreground">
            <T k="introduction.startText" />
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/getting-started" className={buttonVariants({ variant: "primary" })}>
            Getting started
          </Link>
          <Link href="/components/button" className={buttonVariants({ variant: "outline" })}>
            <T k="common.browseComponents" />
          </Link>
        </div>
      </article>
    </>
  );
}
