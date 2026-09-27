import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { BigCircleCursor } from "@adinkra/cursor";
import { ArcLogo } from "@adinkra/arc-text";
import { iconPaths } from "@adinkra/icons";
import { HomeNav } from "../components/home-nav";
import { T } from "../components/language";
import { SymbolField } from "../components/symbol-field";

// Diâmetro do BigCircleCursor (233, da escala φ; era 250). O SymbolField
// recebe o mesmo valor pra área que reage casar com o círculo visível.
const CURSOR_SIZE = 233;

const logoIcon = ("sankofa-swirl" in iconPaths ? "sankofa-swirl" : "sankofa") as keyof typeof iconPaths;

// Sem `arc`: o ArcLogo usa `size * 0.3`, a mesma proporção do antigo
// size 200 / arc 60 — assim o arco acompanha os dois tamanhos (89 e 144).
function HomeLogo({ size }: { size: number }) {
  return (
    <ArcLogo
      text={"Design System"}
      brandText={"Adinkra"}
      year={"2026"}
      size={size}
      tailLength={1.5}
      logoY={0.35}
      icon={logoIcon}
      parallax={true}
      filled={true}
      rayDistance={1}
      showRays={true}
    />
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)]">
      <BigCircleCursor size={CURSOR_SIZE} backdropFilter={false} color="transparent" dotColor="var(--ink)" />
      {/* Empilhado (esquerda em cima, direita embaixo) até lg; lado a lado só de lg
          pra cima, em divisão áurea (1,618fr : 1fr). */}
      <div className="flex flex-none flex-col bg-background lg:border-r-[length:var(--border-width)] lg:border-ink">
        {/* Header com ArcLogo e links. Abaixo de sm: faixa de 144 com logo de 89,
            botão Menu e idioma na mesma linha (canvas mobile). De sm até xl:
            logo de 144 com a nav embaixo, porque logo + três links + seletor
            não cabem lado a lado na coluna. De xl pra cima: tudo numa linha,
            padding 55 e respiro 34 (canvas desktop). */}
        <header className="flex h-[144px] items-center justify-between gap-4 border-b-[length:var(--border-width)] border-ink px-5 sm:h-auto sm:flex-col sm:items-start sm:gap-6 sm:p-7 lg:border-b-0 xl:flex-row xl:items-center xl:justify-between">
          <div className="sm:hidden">
            <HomeLogo size={89} />
          </div>
          <div className="hidden sm:block">
            <HomeLogo size={144} />
          </div>
          <HomeNav />
        </header>
      </div>

      {/* Coluna da direita: duas faixas em razão φ (1,618fr em cima, 1fr
          embaixo — 610/377 no canvas). Fundos e conteúdo ocupam as MESMAS
          células do grid, então a linha entre as cores acompanha a do texto
          mesmo que uma faixa cresça pelo conteúdo. No mobile a altura mínima
          é a do canvas (987 = 610 + 377); de lg pra cima ela estica até a
          altura da tela junto com a coluna da esquerda. */}
      <section className="relative grid min-h-[987px] flex-1 grid-cols-1 grid-rows-[1.618fr_1fr] lg:min-h-0">
        {/* Divs de cor como background */}
        <div aria-hidden className="col-start-1 row-start-1 bg-primary" />
        <div
          aria-hidden
          className="col-start-1 row-start-2 border-t-[length:var(--border-width)] border-ink bg-primary-hover"
        />

        {/* SymbolField como background */}
        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          <SymbolField cursorSize={CURSOR_SIZE} />
        </div>

        {/* Conteúdo sobreposto. Tinta (--primary-foreground, fixa nos dois
            temas) nas duas faixas: o branco que ia na de cima dava 2,99:1
            sobre o laranja, reprovado pra texto pequeno — por isso saiu o
            degradê duro com `bg-clip-text`. Título e descrição ficam na faixa
            de cima; o resto (sobre, destaques, botão) na de baixo. Cada metade
            encosta na linha entre as cores (justify-end / justify-start, 55
            de respiro no desktop, 21 no mobile) em vez de flutuar no meio da
            própria faixa. */}
        <div className="hero-enter pointer-events-none relative z-10 col-start-1 row-start-1 flex flex-col items-center justify-end gap-4 px-5 pb-5 text-center text-primary-foreground sm:gap-5 sm:px-7 sm:pb-7">
          {/* pl-[Nem] = o mesmo N do tracking: o espaçamento também entra depois
              da última letra e, sem essa compensação, o texto centralizado
              parece deslocado pra esquerda (alinhamento óptico). */}
          <p className="pl-[0.26em] font-display text-xs font-medium uppercase tracking-[0.26em]">
            Design system
          </p>
          {/* 42 no mobile e na coluna estreita de lg; 68 com a tela cheia (sm)
              e a partir de 1330, a largura do canvas desktop. */}
          <h1 className="pl-[0.1em] font-adinkra text-2xl font-normal tracking-[0.1em] sm:text-3xl lg:text-2xl min-[1330px]:text-3xl">
            Adinkra
          </h1>
          <p className="max-w-[377px] text-pretty text-base sm:text-lg">
            <T k="home.description" />
          </p>
        </div>
        <div className="hero-enter pointer-events-none relative z-10 col-start-1 row-start-2 flex flex-col items-center justify-start gap-4 px-5 pt-5 text-center text-primary-foreground sm:gap-5 sm:px-7 sm:pt-7">
          <p className="max-w-[377px] text-pretty text-base">
            <T k="home.about" />
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pl-[0.13em] font-display text-xs font-medium uppercase tracking-[0.13em]">
            <li>
              <T k="home.highlightSymbols" />
            </li>
            <li>
              <T k="common.packagePerComponent" />
            </li>
            <li>React 19 + Tailwind v4</li>
          </ul>
          {/* md (42) no mobile, lg (55) de sm pra cima — as classes sm: por
              cima do tamanho md fazem o papel de um "size responsivo". */}
          <Link
            href="/getting-started"
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "pointer-events-auto sm:h-[55px] sm:gap-[13px] sm:px-[34px] sm:text-lg",
            )}
          >
            Get Started
            <ArrowRightIcon className="size-[16px] sm:size-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
