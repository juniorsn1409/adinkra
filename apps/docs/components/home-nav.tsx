"use client";

import Link from "next/link";
import { Button } from "@adinkra/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@adinkra/dropdown-menu";
import { Link as AdinkraLink } from "@adinkra/link";
import { LanguageSelect, T, useLang } from "./language";

const links = [
  { href: "/introduction", label: "common.introduction" },
  { href: "/components/button", label: "common.components" },
  { href: "/symbols", label: "common.resources" },
] as const;

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Navegação do topo da home. De 640px pra cima os três links ficam soltos ao
 * lado do seletor de idioma; abaixo disso viram um menu (`DropdownMenu`) e só
 * o botão do menu e o seletor ocupam a linha — sem link nenhum caindo pra
 * baixo. Os dois blocos existem no HTML e o CSS escolhe qual mostrar
 * (`hidden sm:flex` / `sm:hidden`), sem media query em JS.
 */
export function HomeNav() {
  const { t } = useLang();

  return (
    <nav
      aria-label={t("nav.mainLabel")}
      className="flex items-center gap-x-5 self-start 2xl:mt-15 2xl:justify-end 2xl:gap-x-8"
    >
      <div className="hidden items-center gap-x-5 sm:flex 2xl:gap-x-8">
        {links.map((link) => (
          <AdinkraLink key={link.href} href={link.href} className="text-sm">
            <T k={link.label} />
          </AdinkraLink>
        ))}
      </div>
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <MenuIcon />
            {t("nav.menu")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {links.map((link) => (
              <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                <T k={link.label} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <LanguageSelect />
    </nav>
  );
}
