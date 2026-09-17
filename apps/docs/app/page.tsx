import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { BigCircleCursor } from "@adinkra/cursor";
import { SymbolField } from "../components/symbol-field";

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-start justify-center overflow-hidden bg-surface">
      {/* Montado só aqui (não no layout raiz) de propósito — pedido do
          usuário foi "aplicado na homePage", não no site inteiro. Como o
          App Router desmonta a página ao navegar pra outra rota, o
          `useEffect` de limpeza do BigCircleCursor tira a classe
          `adinkra-cursor-active`/`<style>` sozinho, devolvendo o cursor
          nativo assim que sai da home. size={250} foi pedido explícito do
          usuário (17/09/2026) — a cor custom por elemento (`data-cursor-
          color`) que existiu brevemente na CTA abaixo foi removida do
          pacote inteiro no mesmo dia, a pedido do usuário.
          backdropFilter={false} (17/09/2026, pedido do usuário): troca o
          invert()+grayscale() por preenchimento sólido. color="transparent"
          (mesmo pedido, sessão seguinte — "controlar o backdrop-filter pra
          ser transparente") deixa o círculo grande invisível. dotColor
          PRECISA ser passado explícito aqui — o default dele é `= color`
          (herda o valor de `color`, não o var(--ink) interno do
          componente), então sem isso o pontinho também ficaria transparente
          (bug real, reportado pelo usuário: "não to vendo o ponto que
          deveria ter"). */}
      <BigCircleCursor size={250} backdropFilter={false} color="transparent" dotColor="var(--ink)" />
      {/* cursorSize casa com o size do BigCircleCursor acima — define o
          raio em que os ladrilhos reagem virando terracota (17/09/2026). */}
      <SymbolField cursorSize={200} />
      {/*
        pointer-events-none aqui — sem isso este bloco (que cobre boa parte
        da área dos ladrilhos) bloqueava o pointermove de chegar no
        SymbolField por baixo, então passar o mouse por cima do texto não
        acendia nada (pedido do usuário, 15/09/2026). O botão reabilita
        pointer-events-auto pra continuar clicável.
      */}
      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-24 pointer-events-none">
        <p className="font-display text-xs font-medium uppercase tracking-[0.26em] text-muted-foreground">
          Design system
        </p>
        {/* font-adinkra (Adinkra Alphabet, @adinkra/tokens) mapeia letra
            latina pra símbolo Adinkra — sem `uppercase` de propósito (ver
            mesmo comentário em components/sidebar.tsx). Tamanho aumentado
            duas vezes (17/09/2026, pedidos do usuário — "titulo grande",
            depois "as fontes podem ser maiores"): text-4xl/5xl →
            text-5xl/6xl/7xl → text-6xl/7xl/8xl. Container também alargado
            (max-w-3xl → max-w-4xl) pra sobrar espaço com o título maior. */}
        <h1 className="font-adinkra text-6xl font-medium tracking-[0.1em] text-heading sm:text-7xl md:text-8xl">
          Adinkra
        </h1>
        <p className="max-w-[60ch] text-xl text-foreground">
          Componentes React isolados por pacote — instale só o que for usar — com
          tokens de cor e tipografia prontos para o Tailwind v4.
        </p>
        {/*
          Um só botão agora (17/09/2026, pedido do usuário — "titulo
          grander com a descricao abaixo, e um boton abaixo com
          getStarted"): os 3 anteriores (Ver os componentes/Getting
          Started/Introduction) saíram, sobrou só este. bg-feature/
          text-feature-foreground em vez de variant="primary" puro —
          --brand puro não passa AA como fundo de botão (ver comentário em
          tokens.css); --feature é o par já pronto pra isso (mesmo tom,
          foreground branco garantido).
        */}
        <Link
          href="/getting-started"
          className={cn(
            buttonVariants({ variant: "primary", size: "lg" }),
            "pointer-events-auto bg-feature text-feature-foreground hover:brightness-95",
          )}
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
