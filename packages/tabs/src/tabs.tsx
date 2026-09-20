"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs";
import { cn } from "@adinkra/core";

/**
 * Abas sobre o Base UI Tabs (mesma base de @adinkra/navigation-menu):
 * setas movem o foco entre as abas, Home/End vão às pontas, painéis ligados
 * por aria automaticamente.
 *
 * Linguagem visual: a lista é um "trilho" (borda + `bg-surface`, igual ao
 * NavigationMenu) e a aba ativa fica "afundada" como o Toggle ligado —
 * `bg-primary` com borda de tinta. Aba ativa é INDICADOR DE ESTADO, não
 * ação (regra 6, DECISOES.md), então repetir a primária é permitido. As
 * inativas repousam sem borda (tratamento ghost) e só ganham `bg-card` no
 * hover, mesmo vocabulário da navegação.
 *
 * Movimento: trocar de aba é navegação frequente, então o conteúdo troca
 * SEM animação; só a cor da aba transiciona (150ms).
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3 data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-control border-[length:var(--border-width)] border-ink bg-surface p-1 font-display",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 flex-none cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control",
        "border-[length:var(--border-width)] border-transparent px-3.5 font-display text-sm font-medium text-foreground",
        "transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)]",
        "hover:bg-card",
        // Ativa = "afundada": tinta na borda, fundo primário, sem hover de convite.
        "data-[active]:border-ink data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:hover:bg-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "rounded-control text-sm text-foreground",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
