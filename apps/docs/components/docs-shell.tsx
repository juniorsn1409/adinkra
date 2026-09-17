import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@adinkra/sidebar";
import { AppSidebar } from "./sidebar";

/**
 * Casca compartilhada por qualquer rota que precise da sidebar real do site
 * (AppSidebar) — extraído de apps/docs/app/components/layout.tsx (15/09/2026)
 * pra não duplicar o SidebarProvider/barra mobile em cada rota nova
 * (Introduction, Getting Started). SidebarProvider lê o estado salvo
 * (cookie) sozinho, depois de montar no cliente — de propósito não lemos o
 * cookie aqui no servidor: isso manteria a página sempre atualizada mas
 * tiraria a rota da geração estática. Ver o comentário no próprio pacote
 * (@adinkra/sidebar) sobre essa troca.
 */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Barra só em mobile (abaixo de 768px, igual o breakpoint de
          useIsMobile no pacote): em desktop o AppSidebar usa
          collapsible="none" e fica sempre visível, sem gatilho nenhum — em
          mobile ele vira gaveta fechada por padrão, então precisa de algo
          pra reabrir.
        */}
        <header className="flex items-center gap-2 border-b border-hairline px-4 py-3 md:hidden">
          <SidebarTrigger />
          <span className="font-display text-sm font-medium uppercase tracking-[0.2em] text-heading">Adinkra</span>
        </header>
        <main className="min-w-0 flex-1 px-8 py-10">{children}</main>
      </div>
    </SidebarProvider>
  );
}
