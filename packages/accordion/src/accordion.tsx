"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui-components/react/accordion";
import { cn } from "@adinkra/core";

/**
 * Acordeão sobre o Base UI Accordion. O Base UI usa `multiple` (padrão
 * true) e valores em array; aqui a API é `type="single" | "multiple"`
 * (padrão "single", o caso mais comum) e `value`/`defaultValue` seguem
 * sendo arrays de valores dos itens, como no Base UI.
 *
 * Forma: um "cartão único" (borda + raio + sombra dura, como qualquer painel
 * do sistema) dividido por linhas de tinta — os itens não são cartões
 * repetidos. `overflow-hidden` recorta o painel nos cantos arredondados,
 * por isso o foco dos gatilhos usa `outline-offset` negativo (senão o anel
 * seria cortado).
 *
 * Movimento (abre ocasionalmente, então vale animar): altura + opacidade em
 * 200ms com `--ease-out`. Altura é a exceção admitida à regra "só
 * transform/opacity" — o conteúdo abaixo precisa ceder espaço, sem
 * alternativa por transform. Usa `--accordion-panel-height`, que o Base UI
 * mede em pixels (robusto em todos os navegadores, ao contrário de
 * `interpolate-size`, que ainda não é universal). A seta gira 180° junto.
 */
type AccordionType = "single" | "multiple";

function Accordion({
  className,
  type = "single",
  ...props
}: Omit<React.ComponentProps<typeof AccordionPrimitive.Root>, "multiple"> & {
  /** `single` mantém um item aberto por vez; `multiple` permite vários. */
  type?: AccordionType;
}) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      multiple={type === "multiple"}
      className={cn(
        "w-full overflow-hidden rounded-card border-[length:var(--border-width)] border-ink bg-card shadow-brutal",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b-[length:var(--border-width)] border-ink last:border-b-0", className)}
      {...props}
    />
  );
}

// Mesmo traço (viewBox 16x16, strokeWidth 1.3) dos outros ícones de controle
// do sistema (ver navigation-menu).
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    // O Header (h3) é o que dá a estrutura de título ao leitor de tela.
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left",
          "font-display text-sm font-medium text-heading transition-colors",
          "hover:bg-surface",
          "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="flex-none transition-transform duration-200 ease-[var(--ease-out)] group-data-[panel-open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        "h-(--accordion-panel-height) overflow-hidden text-sm text-foreground",
        "transition-[height,opacity] duration-200 ease-[var(--ease-out)]",
        "data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0",
        className,
      )}
      {...props}
    >
      <div className="px-4 pb-4 pt-1">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export type { AccordionType };
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
