import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Barra de progresso simples, uma só (o `SegmentedBar` ao lado é outra coisa:
 * quebra de um total em partes categóricas). Determinada (`value`/`max`) ou
 * indeterminada (sem `value`).
 *
 * Visual: trilha em `--card` com borda de tinta (mesma borda de tudo no
 * sistema, sem sombra — não é interativa), preenchimento em `--primary` com
 * uma borda de tinta do lado direito pra separar o cheio do vazio. A cor de
 * preenchimento SOZINHA não separa (o laranja contra `--card` fica abaixo de
 * 3:1); quem garante o contraste do gráfico é a borda de tinta. Regra 6,
 * DECISOES.md: primária aqui é indicador de estado, não botão de ação.
 *
 * Movimento (skill find-animation-opportunities):
 *  - Determinada: o valor é um DADO que a pessoa lê, então o movimento é o
 *    mínimo que evita o salto: `width` com transição de 300ms em
 *    `--ease-out`. Escolhi `width` e não `scaleX` porque `scaleX` esticaria a
 *    borda de tinta do preenchimento (ela ficaria mais fina quanto menor o
 *    valor); a barra é pequena, o custo de layout é irrelevante. Se o valor
 *    sobe muitas vezes por segundo, a transição só retarga (é CSS, não
 *    keyframe).
 *  - Indeterminada: loop FUNCIONAL ("não sei quanto falta"), um trecho de 40%
 *    percorrendo a trilha com `translateX` em 1.4s. Com reduced-motion vira
 *    barra cheia pulsando devagar (2s), mesmo raciocínio do Spinner.
 *
 * `@keyframes` precisa existir em CSS e os pacotes não têm folha de estilo
 * própria: o `<style href precedence>` do React 19 injeta o bloco uma única
 * vez (deduplicado por `href`), no servidor e no cliente, sem hook — este
 * arquivo NÃO precisa de "use client".
 *
 * Acessibilidade: `role="progressbar"` com `aria-valuemin`/`max`/`now`. Na
 * indeterminada o `aria-valuenow` é omitido (é assim que o padrão ARIA
 * declara "não sei"). SEMPRE dê um nome (`aria-label` ou `aria-labelledby`).
 */
const progressVariants = cva(
  "relative w-full overflow-hidden rounded-control border-[length:var(--border-width)] border-ink bg-card",
  {
    variants: {
      size: {
        sm: "h-3",
        md: "h-5",
        lg: "h-7",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const INDETERMINATE_CSS = `
@keyframes adinkra-progress-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}
.adinkra-progress-indeterminate {
  width: 40%;
  animation: adinkra-progress-slide 1.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  @keyframes adinkra-progress-pulse {
    50% { opacity: 0.5; }
  }
  /* !important: a regra global do tokens.css zera toda animação com !important; a especificidade da classe a supera. */
  .adinkra-progress-indeterminate {
    width: 100% !important;
    transform: none !important;
    animation: adinkra-progress-pulse 2s ease-in-out infinite !important;
  }
}
`;

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof progressVariants> {
  /** Valor atual, de 0 a `max`. Ausente (ou `null`) = indeterminada. */
  value?: number | null;
  /** Valor que representa 100%. Padrão 100. */
  max?: number;
  /** Texto lido por leitores de tela no lugar do "N%" (ex.: "3 de 5 arquivos enviados"). */
  valueText?: string;
}

export function Progress({
  value,
  max = 100,
  valueText,
  size,
  className,
  ...props
}: ProgressProps) {
  const indeterminate = value == null;
  const safeMax = max > 0 ? max : 100;
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), safeMax);
  const pct = (clamped / safeMax) * 100;
  const complete = !indeterminate && clamped >= safeMax;

  return (
    <div
      data-slot="progress"
      data-state={indeterminate ? "indeterminate" : complete ? "complete" : "loading"}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuetext={indeterminate ? undefined : valueText}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      {indeterminate ? (
        <>
          <style href="adinkra-progress" precedence="default">
            {INDETERMINATE_CSS}
          </style>
          <div
            data-slot="progress-indicator"
            className="adinkra-progress-indeterminate h-full bg-primary border-x-[length:var(--border-width)] border-ink"
          />
        </>
      ) : (
        <div
          data-slot="progress-indicator"
          style={{ width: `${pct}%` }}
          className={cn(
            "h-full bg-primary transition-[width] duration-300 ease-[var(--ease-out)]",
            // Sem valor não há o que separar; cheia, a borda da trilha já fecha.
            pct > 0 && !complete && "border-r-[length:var(--border-width)] border-ink",
          )}
        />
      )}
    </div>
  );
}
