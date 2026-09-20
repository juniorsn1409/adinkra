import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { BigCircleCursor } from "@adinkra/cursor";
import { ArcLogo } from "@adinkra/arc-text";
import { iconPaths } from "@adinkra/icons";
import { HomeNav } from "../components/home-nav";
import { T } from "../components/language";
import { SymbolField } from "../components/symbol-field";

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden lg:flex-row">
      <BigCircleCursor size={250} backdropFilter={false} color="transparent" dotColor="var(--ink)" />
      {/* Empilhado (esquerda em cima, direita embaixo) até lg; lado a lado só de lg
          pra cima — 58%/42% em telas menores espremia logo, nav e título. */}
      <div className="flex w-full flex-none flex-col bg-background lg:w-[58%]">
        {/* Header com ArcLogo e links */}
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <ArcLogo
          key={0}
          text={"Design System"}
          brandText={"Adinkra"}
          year={"2026"}
          size={200}
          arc={60}
          tailLength={1.5}
          logoY={0.35}
          icon={("sankofa-swirl" in iconPaths ? "sankofa-swirl" : "sankofa") as keyof typeof iconPaths}
          parallax={true}
          filled={true}
          rayDistance={1}
          showRays={true}
        />
          <HomeNav />
        </div>

        {/* Conteúdo principal */}
        <div className="hidden flex-1 flex-col items-start justify-center px-6 py-24 lg:flex">
        </div>
      </div>

      {/* Div à direita. @container: o título dimensiona pela largura desta coluna (cqw), não da tela. */}
      <div className="@container relative flex w-full flex-1 flex-col lg:w-[42%]">
        {/* Divs de cor como background */}
        <div className="flex flex-col flex-1 absolute inset-0">
          {/* Parte de cima - 50% com branco */}
          <div style={{ flex: "1", backgroundColor: "var(--primary)" }} />
          {/* Parte de baixo - 50% com primary-hover */}
          <div style={{ flex: "1", backgroundColor: "var(--primary-hover)" }} />
        </div>

        {/* SymbolField como background */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
          <SymbolField cursorSize={300} />
        </div>

        {/* Conteúdo sobreposto */}
        {/* O texto herda um degradê duro em 50% (mesma linha das duas cores de
            fundo, já que este bloco ocupa a coluna inteira): accent-foreground
            na metade de cima, primary-foreground na de baixo. */}
        <div
          className="hero-enter relative z-10 grid flex-1 grid-rows-2 px-4 py-12 sm:px-6 lg:py-16 bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--accent-foreground) 50%, var(--primary-foreground) 50%)",
          }}
        >
          {/* Duas linhas iguais (grid-rows-2): a de cima é a metade da cor
              --primary, a de baixo a do --primary-hover, e o padding é
              simétrico pra a divisão do texto cair exatamente na linha das
              duas cores de fundo. Título e descrição ficam na de cima; o
              resto (sobre, destaques, botão) na de baixo. Cada metade
              encosta no centro (justify-end / justify-start, 2rem de
              respiro da linha) em vez de flutuar no meio da própria metade. */}
          <div className="pointer-events-none flex flex-col items-center justify-end gap-6 pb-8 text-center">
            {/* pl-[Nem] = o mesmo N do tracking: o espaçamento também entra depois
                da última letra e, sem essa compensação, o texto centralizado
                parece deslocado pra esquerda (alinhamento óptico). */}
            <p className="pl-[0.26em] font-display text-xs font-medium uppercase tracking-[0.26em]">
              Design system
            </p>
            <h1 className="pl-[0.1em] font-adinkra text-[clamp(2.25rem,11cqw,6rem)] font-medium tracking-[0.1em]">
              Adinkra
            </h1>
            <p className="max-w-[60ch] text-lg sm:text-xl">
              <T k="home.description" />
            </p>
          </div>
          <div className="pointer-events-none flex flex-col items-center justify-start gap-6 pt-8 text-center">
            <p className="max-w-[56ch] text-base">
              <T k="home.about" />
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pl-[0.14em] font-display text-xs font-medium uppercase tracking-[0.14em]">
              <li>
                <T k="home.highlightSymbols" />
              </li>
              <li>
                <T k="common.packagePerComponent" />
              </li>
              <li>React 19 + Tailwind v4</li>
            </ul>
            <Link
              href="/getting-started"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "pointer-events-auto",
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
