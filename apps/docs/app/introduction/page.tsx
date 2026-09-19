import Link from "next/link";
import { buttonVariants } from "@adinkra/button";
import { GlitchCursor } from "@adinkra/cursor";
import { DocsShell } from "../../components/docs-shell";

export const metadata = { title: "Introduction" };

export default function IntroductionPage() {
  return (
    <DocsShell>
      <GlitchCursor />
      <article className="grid w-full max-w-3xl gap-8 pb-24">
        <header className="grid gap-2 border-b border-hairline pb-6">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Introdução
          </p>
          <h1 className="font-display text-3xl font-medium text-heading">Adinkra</h1>
          <p className="text-muted-foreground">
            Componentes React isolados por pacote — instale só o que for usar — com tokens de cor e tipografia
            prontos para o Tailwind v4.
          </p>
        </header>
        <div className="grid gap-4 text-foreground">
          <p>
            Cada componente (Button, Card, Sidebar...) é o próprio dono do seu <code>package.json</code>, versão e
            changelog — não existe um pacote guarda-chuva <code>@adinkra/ui</code>. Quem só precisa do Button
            instala só <code>@adinkra/button</code>.
          </p>
          <p>
            A direção visual é neobrutalista: borda de tinta, sombra dura, e três estados táteis (padrão, hover,
            pressionado) em toda superfície interativa — cantos arredondados, não os retos do brutalismo clássico.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/getting-started" className={buttonVariants({ variant: "primary" })}>
            Getting started
          </Link>
          <Link href="/components/button" className={buttonVariants({ variant: "outline" })}>
            Ver os componentes
          </Link>
        </div>
      </article>
    </DocsShell>
  );
}
