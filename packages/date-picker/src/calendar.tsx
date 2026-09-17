"use client";

import * as React from "react";
import { DateLib, DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";
import { capitalizeFirst } from "./format";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Mesmo traço (viewBox 16x16, strokeWidth 1.3) do resto dos ícones de
// controle do sistema — não lucide-react (removido do projeto antes).
function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Baseado no Calendar do neobrutalism.dev (react-day-picker por baixo — o
 * motor de grade/navegação/teclado é grande demais pra reconstruir do zero,
 * mesmo raciocínio do Base UI no navigation-menu), com as classes do
 * shadcn/neobrutalism trocadas pelos nossos tokens: `bg-secondary` no dia
 * selecionado (o mesmo "isto está ligado" do Toggle/NavigationMenu, não o
 * céu/primary — regra 6), `bg-accent/15 text-accent` (tinta clarinha) no dia
 * de hoje — passou por `text-accent` sozinho (baixo contraste contra os
 * outros dias, ~1.5:1/~1.2:1) e por `bg-accent`/`text-accent-foreground`
 * sólido (contraste ótimo mas visualmente pesado demais, pedido do usuário
 * pra ficar "mais clarinho"; o dia selecionado por baixo continua com
 * `bg-secondary`, sempre depois no `cn()` pra ganhar de hoje quando os dois
 * coincidem — regra: selecionado > hoje), botões de navegação/dia via
 * `buttonVariants({ variant: "ghost" })` do @adinkra/button (dogfooding, não
 * reimplementado aqui). Sem borda/sombra própria — vive dentro de um
 * `PopoverContent` que já é o "cartão único" com essa moldura.
 */
function Calendar({ className, classNames, showOutsideDays = false, captionLayout = "label", formatters, components, locale = ptBR, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar p-3 font-display text-foreground", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("pt-BR", { month: "short" }),
        formatCaption: (month, options, dateLib) => capitalizeFirst((dateLib ?? new DateLib(options)).formatMonthYear(month)),
        formatWeekdayName: (weekday, options, dateLib) => capitalizeFirst((dateLib ?? new DateLib(options)).format(weekday, "cccccc")),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          // A linha entre meses (Range Picker, numberOfMonths=2) precisa mirar
          // só em `.rdp-month` (a classe do próprio mês) — `.months` também
          // tem o `<nav>` (setas) como filho direto, irmão de `.month`, então
          // um seletor genérico tipo `> :not(:first-child)` (o que `divide-x`
          // faz por baixo) sempre pegava o `.month` mesmo com 1 mês só (bug
          // reportado pelo usuário: linha aparecia em todo Date/Range/Time
          // Picker, não só no Range com 2 meses).
          "relative flex flex-col sm:flex-row",
          "[&>.rdp-month:not(:last-child)]:border-b-[length:var(--border-width)] [&>.rdp-month:not(:last-child)]:border-ink [&>.rdp-month:not(:last-child)]:pb-4",
          "sm:[&>.rdp-month:not(:last-child)]:border-b-0 sm:[&>.rdp-month:not(:last-child)]:border-r-[length:var(--border-width)] sm:[&>.rdp-month:not(:last-child)]:pb-0 sm:[&>.rdp-month:not(:last-child)]:pr-4",
          "[&>.rdp-month+.rdp-month]:pt-4 sm:[&>.rdp-month+.rdp-month]:pt-0 sm:[&>.rdp-month+.rdp-month]:pl-4",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
        button_previous: cn(buttonVariants({ variant: "ghost" }), "size-7 p-0 select-none hover:bg-card aria-disabled:opacity-50", defaultClassNames.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost" }), "size-7 p-0 select-none hover:bg-card aria-disabled:opacity-50", defaultClassNames.button_next),
        month_caption: cn("flex h-7 w-full items-center justify-center px-8", defaultClassNames.month_caption),
        dropdowns: cn("flex h-7 w-full items-center justify-center gap-1.5 font-display text-sm", defaultClassNames.dropdowns),
        dropdown_root: cn(
          "relative rounded-control border-[length:var(--border-width)] border-ink bg-card",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-display",
          captionLayout === "label" ? "text-sm" : "flex h-7 items-center gap-1 rounded-control px-2 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex gap-[5px]", defaultClassNames.weekdays),
        weekday: cn("w-9 select-none rounded-control text-[0.8rem] text-muted-foreground", defaultClassNames.weekday),
        week: cn("mt-2 flex w-full gap-[5px]", defaultClassNames.week),
        week_number_header: cn("w-9 select-none", defaultClassNames.week_number_header),
        week_number: cn("select-none text-[0.8rem] text-muted-foreground", defaultClassNames.week_number),
        // range_start/range_middle/range_end saem daqui — a borda/raio deles
        // depende de SABER se o dia conecta com o vizinho (não dá pra fazer
        // só com classe estática por modifier, precisa de lógica condicional
        // em cima de mais de um modifier ao mesmo tempo), então viraram
        // responsabilidade do CalendarDayButton (JS), não deste mapa.
        day: cn("group/day relative size-9 select-none p-0 text-center text-xs", defaultClassNames.day),
        selected: cn(props.mode !== "range" && "rounded-control bg-secondary", defaultClassNames.selected),
        today: cn(defaultClassNames.today),
        outside: cn("opacity-50", defaultClassNames.outside),
        disabled: cn("opacity-40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") return <ChevronLeftIcon className={cn("size-3.5", chevronClassName)} {...chevronProps} />;
          if (orientation === "right") return <ChevronRightIcon className={cn("size-3.5", chevronClassName)} {...chevronProps} />;
          return <ChevronDownIcon className={cn("size-3.5", chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekNumberProps }) => (
          <td {...weekNumberProps}>
            <div className="flex size-9 items-center justify-center text-center">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selectedSingle = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  const isRange = modifiers.range_start || modifiers.range_end || modifiers.range_middle;
  // Intervalo de 1 dia só (usuário clicou o mesmo dia duas vezes): o
  // react-day-picker marca esse dia como range_start E range_end ao mesmo
  // tempo — não conecta com nada, fica pílula inteira como um dia normal
  // selecionado, sem "sensação de continuidade" nenhuma (não tem com quem).
  const isSingleDayRange = modifiers.range_start && modifiers.range_end;
  // Continuidade visual do range (pedido do usuário — "ao selecionar a
  // segunda data o range escolhido deve acontecer um merge pra dar a
  // sensação de continuidade"): sem isto, cada dia do intervalo ficava com
  // borda+raio próprios nos 4 lados (decisão de "borda em todos os dias"),
  // então um range de vários dias virava uma fileira de caixinhas soltas,
  // não uma barra contínua. `connectsRight`/`connectsLeft` diz se este dia
  // encosta em outro dia SELECIONADO do mesmo range no lado indicado —
  // squarea o canto e some com a borda desse lado; o gap de 5px entre
  // células (regra do sistema) ainda deixaria um buraco entre elas mesmo
  // assim, por isso as faixinhas (`bg-secondary`, mesma cor) fora da célula
  // preenchendo exatamente esse gap, só quando há conexão de verdade.
  const connectsRight = !isSingleDayRange && (modifiers.range_start || modifiers.range_middle);
  const connectsLeft = !isSingleDayRange && (modifiers.range_end || modifiers.range_middle);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={selectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={modifiers.today}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "size-9 rounded-tl-control rounded-tr-control rounded-bl-control rounded-br-control border-t-[length:var(--border-width)] border-r-[length:var(--border-width)] border-b-[length:var(--border-width)] border-l-[length:var(--border-width)] border-ink p-0 font-display text-xs hover:bg-card",
        // Hoje: tom clarinho (tinta leve do accent, não o token sólido) —
        // vem ANTES do range/selecionado no cn() de propósito, pra quando
        // hoje TAMBÉM estiver selecionado o tom escuro do selecionado vencer
        // (pedido do usuário: "dia atual mais clarinha e quando selecionado
        // mais escuro" — selecionado sempre ganha visualmente sobre hoje).
        modifiers.today && "bg-accent/15 text-accent",
        isRange && "bg-secondary text-secondary-foreground hover:bg-secondary",
        selectedSingle && "bg-secondary text-secondary-foreground hover:bg-secondary",
        connectsRight && "rounded-tr-none rounded-br-none border-r-0",
        connectsLeft && "rounded-tl-none rounded-bl-none border-l-0",
        // Faixa que preenche o gap de 5px pro dia conectado, por fora da
        // célula (mesma cor do range) — só existe quando há conexão. Leva
        // border-top/border-bottom também (mesma espessura/cor do resto),
        // senão a LINHA de cima/baixo de cada dia parava no gap em vez de
        // atravessar ele — bordas pareciam desconectadas mesmo com o fundo
        // já contínuo.
        connectsRight &&
          "after:absolute after:inset-y-0 after:left-full after:w-[5px] after:border-t-[length:var(--border-width)] after:border-b-[length:var(--border-width)] after:border-ink after:bg-secondary after:content-['']",
        connectsLeft &&
          "before:absolute before:inset-y-0 before:right-full before:w-[5px] before:border-t-[length:var(--border-width)] before:border-b-[length:var(--border-width)] before:border-ink before:bg-secondary before:content-['']",
        defaultClassNames.day_button,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
