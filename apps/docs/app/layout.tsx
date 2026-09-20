import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LanguageProvider } from "../components/language";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Adinkra",
    template: "%s · Adinkra",
  },
  description:
    "Design system Adinkra: componentes React isolados por pacote, tokens de cor e tipografia, para sites Next.js na Vercel.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes do primeiro paint (sem isso, quem escolheu
            o escuro veria um flash de tema claro a cada carregamento). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("adinkra-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
