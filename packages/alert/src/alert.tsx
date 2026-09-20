import * as React from "react";
import { cn } from "@adinkra/core";
import { AlertIcon, type AlertVariant } from "./alert-icon";

/**
 * Alerta em bloco, no formato shadcn (Alert + AlertTitle + AlertDescription)
 * com a mecânica neobrutalista: borda de tinta, sombra dura e cantos de
 * cartão (seção 4, DECISOES.md). Não é interativo — sem hover/pressionado,
 * como o Badge e o Skeleton; só a `action` (um botão que o consumidor passa)
 * carrega os três estados.
 *
 * Papel ARIA: `warning` e `destructive` interrompem (`role="alert"`, live
 * region assertiva); `default` e `info` são informativos e usam
 * `role="status"` (educada). Vale só para alertas que APARECEM depois do
 * carregamento — um alerta já presente na página não é anunciado de novo
 * de qualquer jeito. Dá pra sobrescrever com a prop `role`.
 *
 * Movimento (skill find-animation-opportunities): nenhum. É conteúdo
 * estático em fluxo, visto de vez em quando; se surgir por render
 * condicional, o que avisa quem usa leitor de tela é o `role`, e um fade
 * curto só adiaria o texto que a pessoa precisa ler sem trazer nenhuma
 * informação nova (falha no filtro "propósito"). Notificação que entra e
 * sai da tela por conta própria é o @adinkra/toast.
 *
 * Sem "use client": puro JSX, sem hooks.
 */
export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  /** Troca o ícone padrão da variante. Continua dentro da pastilha; sempre decorativo. */
  icon?: React.ReactNode;
  /** Ação opcional (normalmente um `<Button size="sm" variant="outline">`), à direita no desktop e abaixo do texto no celular. */
  action?: React.ReactNode;
}

const liveRole: Record<AlertVariant, "alert" | "status"> = {
  default: "status",
  info: "status",
  warning: "alert",
  destructive: "alert",
};

export function Alert({
  variant = "default",
  icon,
  action,
  role,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={role ?? liveRole[variant]}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-card border-[length:var(--border-width)] border-ink bg-card p-4 text-sm text-foreground shadow-brutal",
        // Só abre a 3ª coluna quando há ação — vazia, ela ainda cobraria um gap.
        action ? "sm:grid-cols-[auto_minmax(0,1fr)_auto]" : null,
        className,
      )}
      {...props}
    >
      <AlertIcon variant={variant}>{icon}</AlertIcon>
      <div className="grid min-w-0 gap-1">{children}</div>
      {action ? (
        <div
          data-slot="alert-action"
          className="col-start-2 sm:col-start-3 sm:row-start-1 sm:self-center"
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

/** Título: diz o que aconteceu, numa frase curta. */
export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-display text-base font-medium leading-snug tracking-[0.02em] text-heading", className)}
      {...props}
    />
  );
}

export type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

/** Descrição: o porquê e o que fazer agora. Aceita parágrafos e links. */
export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn("leading-relaxed text-foreground [&_p+p]:mt-2", className)}
      {...props}
    />
  );
}
