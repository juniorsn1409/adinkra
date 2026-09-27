import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { T } from "../../../components/language";
import { DocsArticle, DocsPageHeader, DocsSection } from "../../../components/mdx-components";
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
      <PageTopbar title={<T k="common.introduction" />} trail={[]} />
      <DocsArticle>
        <DocsPageHeader
          eyebrow={<T k="common.introduction" />}
          title="Adinkra"
          description={<T k="introduction.tagline" />}
        />

        <p className="max-w-[610px] text-foreground">
          <T k="introduction.intro" />
        </p>

        <DocsSection title={<T k="introduction.principles" />}>
          <ul className="grid max-w-[610px] gap-4">
            {principles.map((item, index) => (
              <li key={index} className="grid gap-1">
                <p className="font-display text-sm font-medium text-heading">{item.title}</p>
                <p className="max-w-[610px] text-foreground">{item.text}</p>
              </li>
            ))}
          </ul>
        </DocsSection>

        <DocsSection title={<T k="introduction.start" />}>
          <p className="max-w-[610px] text-foreground">
            <T k="introduction.startText" />
          </p>
        </DocsSection>

        <div className="flex flex-wrap gap-4">
          <Link href="/getting-started" className={buttonVariants({ variant: "primary" })}>
            Getting started
          </Link>
          <Link href="/components/button" className={buttonVariants({ variant: "outline" })}>
            <T k="common.browseComponents" />
          </Link>
        </div>
      </DocsArticle>
    </>
  );
}
