// O banner do tsup.config.ts não cobre o consumo direto do workspace
// (package.json aponta "exports" pra src/index.ts) — a diretiva precisa
// estar aqui também. Ver a armadilha equivalente em
// packages/sidebar/src/sidebar.tsx e DECISOES.md.
"use client";

import * as React from "react";
import { cn } from "@adinkra/core";

export interface ArcTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Texto desenhado em arco, letra por letra. */
  text?: string;
  /** Quantos graus o arco ocupa, centralizados (0 = tudo empilhado no meio). */
  arc?: number;
  /** Raio do arco em px — também a altura de cada letra até o pivô. */
  size?: number;
  /** Segue o cursor com um leve deslocamento. Desliga sozinho com `prefers-reduced-motion`. */
  parallax?: boolean;
  /** Mostrar o raio (linha do centro até o topo do arco). */
  showRay?: boolean;
  /** Texto exibido abaixo do arco. */
  textBelow?: string;
  /** Texto exibido no final do arco. */
  textEnd?: string;
}

const PARALLAX_RESISTANCE = 50;

/**
 * Tradução de um mecanismo de logo animado (CodePen "Happy Thanksgiving!"
 * de kuro-nyani/Jackie Zen, arte de Stephen Doulas — 17/09/2026, pedido do
 * usuário) — só o efeito de TEXTO EM ARCO foi extraído; a ilustração
 * original (sol, peru, folha) não tem relação com a identidade Adinkra e
 * ficou de fora (escopo confirmado com o usuário antes de construir).
 * Componente novo e separado (`@adinkra/arc-text`), não aplicado em nenhuma
 * página por padrão — igual o `@adinkra/cursor`, existe pra quem quiser
 * usar como selo/logo, não é o wordmark principal do site (que continua
 * sendo `font-adinkra` reto na sidebar/home).
 *
 * Mecânica: cada letra é um `<span>` com `transform-origin: bottom center`,
 * todas pivotando do MESMO ponto (a base do contêiner) — como os números de
 * um relógio. A rotação de cada uma é calculada (não hardcoded por índice,
 * diferente do CSS original, que tinha uma regra por letra específica pra
 * "Happy Thanksgiving!") — funciona pra qualquer texto/tamanho.
 *
 * Sem jQuery/GSAP (dependências do original): entrada com fade usa
 * `transition` de CSS comum (`prefers-reduced-motion` já é tratado
 * globalmente em `@adinkra/tokens`, que zera toda duração de
 * transição/animação do site); o parallax do mouse é a única coisa que
 * precisa de um `useEffect` próprio, porque é contínuo, não um estado —
 * desligado explicitamente sob `prefers-reduced-motion` (mesmo raciocínio
 * do `useCursorActive` do `@adinkra/cursor`, mas sem duplicar aquele hook:
 * este componente não desliga o cursor nativo, é um efeito bem menor).
 */
export function ArcText({ text = "", arc = 100, size = 96, parallax = true, showRay = false, textBelow = "", textEnd = "", className, style, ...props }: ArcTextProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!parallax || reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;

    function handleMove(event: PointerEvent) {
      const x = -(event.clientX - window.innerWidth / 2) / PARALLAX_RESISTANCE;
      const y = -(event.clientY - window.innerHeight / 2) / PARALLAX_RESISTANCE;
      root!.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    }

    document.addEventListener("pointermove", handleMove);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      root.style.transform = "";
    };
  }, [parallax, reducedMotion]);

  const letters = React.useMemo(() => Array.from(text), [text]);
  const step = letters.length > 1 ? arc / (letters.length - 1) : 0;
  const start = -arc / 2;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={text}
      className={cn("relative select-none font-display uppercase tracking-[0.08em] transition-transform duration-[2000ms] ease-out", className)}
      style={{ width: size * 2.2, height: size, ...style }}
      {...props}
    >
      {showRay && (
        <div
          className="absolute bottom-0 left-1/2 w-0.5 bg-current opacity-20"
          style={{
            height: size,
            transform: "translateX(-0.5px)",
          }}
        />
      )}
      {letters.map((letter, index) => (
        <span
          key={index}
          aria-hidden
          className="absolute bottom-0 left-1/2 flex origin-bottom items-start justify-center transition-opacity duration-[2000ms] ease-out"
          style={{
            height: size,
            // Largura fixa + margin-left negativo (não translateX) pra
            // centralizar: `transform: translateX(-50%) rotate(deg)` NÃO
            // faz "centraliza, depois gira" — CSS aplica múltiplas funções
            // de um mesmo `transform` na ordem inversa da leitura (gira
            // primeiro, translada depois, sempre ao redor do MESMO
            // transform-origin) — cada letra girava de um pivô ligeiramente
            // diferente (a própria largura do caractere), e o "arco" saía
            // torto (bug real, achado 17/09 — "forma um arco realmente com
            // as palavras"). Com a centralização fora do transform, sobra
            // só rotate() nele, e toda letra gira do mesmo pivô de verdade.
            width: "1.2em",
            marginLeft: "-0.6em",
            transform: `rotate(${start + index * step}deg)`,
            opacity: mounted ? 1 : 0,
            // 90ms por letra (era 40ms) — parte de deixar a entrada inteira
            // do ArcLogo em ~7s (pedido do usuário), ver arc-logo.tsx.
            transitionDelay: mounted ? "2000ms" : "0ms",
          }}
        >
          {letter === " " ? " " : letter}
        </span>
      ))}
      {textBelow && (
        <div className="absolute bottom-0 left-1/2 translate-x-1/2 mt-2 text-xs whitespace-nowrap">
          {textBelow}
        </div>
      )}
      {textEnd && (
        <div className="absolute right-0 top-1/2 translate-y-1/2 text-xs whitespace-nowrap">
          {textEnd}
        </div>
      )}
    </div>
  );
}
