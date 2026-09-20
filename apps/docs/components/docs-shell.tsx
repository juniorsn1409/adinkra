import type { ReactNode } from "react";
import { SidebarProvider } from "@adinkra/sidebar";
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
          Sem barra própria em mobile (20/09/2026, pedido do usuário — o
          "Adinkra" + botão de recolher no topo não deviam aparecer em tela
          pequena): quem abre a gaveta é o Toggle do PageTopbar de cada
          página, que já entende mobile (useSidebar → openMobile).
        */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </SidebarProvider>
  );
}
