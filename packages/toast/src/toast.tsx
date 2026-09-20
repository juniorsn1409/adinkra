"use client";

import * as React from "react";
import { Toast } from "@base-ui-components/react/toast";
import { AlertIcon, type AlertVariant } from "@adinkra/alert";
import { buttonVariants } from "@adinkra/button";
import { cn } from "@adinkra/core";

/**
 * Notificações temporárias. O motor (fila, timers, pausa no hover/foco,
 * região `aria-live`, gesto de arrastar pra dispensar, F6 pra ir até elas)
 * é o Toast do Base UI (`@base-ui-components/react`, já dependência do
 * sistema); aqui só entram a pele Adinkra e uma API menor.
 *
 * Uso:
 *   <ToastProvider>
 *     <App />
 *     <Toaster />
 *   </ToastProvider>
 *   const { toast } = useToast();
 *   toast({ title: "Rascunho salvo", description: "…", variant: "info" });
 *
 * Variantes iguais às do Alert (default/info/warning/destructive) e
 * reaproveitam a mesma pastilha com ícone (`AlertIcon`) — nunca só cor. Não
 * existe variante de sucesso: o sistema não tem verde (DECISOES.md, seção 9);
 * confirmação é `default` ou `info`, com um título que diz o que foi feito
 * ("Rascunho salvo"), no mesmo verbo do botão que a disparou ("Salvar").
 * `warning` e `destructive` viram `priority: "high"` (anunciadas de forma
 * assertiva); as demais são educadas.
 *
 * ---- Movimento (skill find-animation-opportunities) ----
 * Frequência: ocasional, então merece animação. Propósito: consistência
 * espacial (entra e sai PELA MESMA BORDA, a de baixo) + evitar o salto de
 * algo que surge do nada. Velocidade: entrada 350ms, saída 200ms (mais
 * curta: a pessoa já decidiu que acabou), ambas em `--ease-out`. Função:
 * TRANSIÇÃO CSS, não keyframes — quando um toast novo empurra os antigos
 * pra cima, o `transform` de cada um só muda de destino e a transição
 * retarga no meio do caminho, sem reiniciar. Distâncias em % (`100% + 1rem`),
 * nunca px fixos: funciona pra qualquer altura de toast.
 * Reduced motion: o tokens.css zera toda transição com `!important`; aqui,
 * `motion-reduce:…!` (também `!important`, mas em camada, e por isso mais
 * forte) mantém só um fade de opacidade de 200ms — mais gentil, não zero — e
 * o empilhamento passa a ser instantâneo.
 *
 * ---- Empilhamento ----
 * Sempre aberto, sem o "leque" que colapsa do Base UI: cada toast é
 * `position: absolute` colado no canto e sobe `--toast-offset-y` (soma das
 * alturas dos mais novos, medida por ele) + `--toast-index × gap`. O mais
 * novo fica embaixo; passando de `limit` (3), o mais velho some.
 *
 * `"use client"` no arquivo-fonte: usa hooks (armadilha 3, DECISOES.md).
 * Componentes e hook são exports nomeados individuais (armadilha 2).
 */

export type ToastVariant = AlertVariant;

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Padrão: "default". */
  variant?: ToastVariant;
  /** Milissegundos até fechar sozinho; `0` = fica até a pessoa fechar. Padrão: 5000 (8000 se houver `action`). */
  duration?: number;
  /** Botão opcional. Clicar chama `onClick` e fecha o toast. */
  action?: { label: string; onClick: () => void };
  /** Chamado quando o toast fecha (sozinho ou pela pessoa). */
  onClose?: () => void;
}

export interface ToastProviderProps {
  children?: React.ReactNode;
  /** Quantos toasts ao mesmo tempo; o mais antigo sai quando passa disso. Padrão 3. */
  limit?: number;
  /** Duração padrão em ms. Padrão 5000. */
  duration?: number;
}

export function ToastProvider({ children, limit = 3, duration = 5000 }: ToastProviderProps) {
  return (
    <Toast.Provider limit={limit} timeout={duration}>
      {children}
    </Toast.Provider>
  );
}

function priorityOf(variant: ToastVariant): "high" | "low" {
  return variant === "warning" || variant === "destructive" ? "high" : "low";
}

export function useToast() {
  const { add, close, update } = Toast.useToastManager();

  return React.useMemo(() => {
    function toast(options: ToastOptions): string {
      const { variant = "default", action, duration, title, description, onClose } = options;
      const id = add({
        title,
        description,
        onClose,
        type: variant,
        priority: priorityOf(variant),
        // Com ação, a pessoa precisa de mais tempo pra ler e alcançar o botão (WCAG 2.2.1).
        timeout: duration ?? (action ? 8000 : undefined),
        actionProps: action
          ? {
              children: action.label,
              onClick: () => {
                action.onClick();
                close(id);
              },
            }
          : undefined,
      });
      return id;
    }

    return {
      toast,
      /** Fecha um toast pelo id que `toast()` devolveu. */
      dismiss: (id: string) => close(id),
      /** Troca título/descrição/variante de um toast já aberto (ex.: "Enviando…" vira "Enviado"). */
      update: (id: string, options: Omit<ToastOptions, "action">) => {
        const { variant, duration, title, description, onClose } = options;
        update(id, {
          title,
          description,
          onClose,
          type: variant,
          priority: variant ? priorityOf(variant) : undefined,
          timeout: duration,
        });
      },
    };
  }, [add, close, update]);
}

/*
 * Classes do Root, agrupadas por assunto. As variáveis `--toast-offset-y`,
 * `--toast-index`, `--toast-height` e `--toast-swipe-movement-*` vêm do Base
 * UI em cada Root. Tudo escrito por extenso (o scanner do Tailwind só acha
 * classes completas). `_` vira espaço dentro dos valores arbitrários.
 */
const rootClass = cn(
  // Posição/tamanho. `--toast-height` é medido pelo Base UI (indefinido no 1º frame = altura automática).
  "absolute bottom-0 right-0 h-[var(--toast-height)] w-full touch-none select-none",
  // Variáveis locais: `--stack-y` é o quanto este toast sobe pra caber acima dos mais novos;
  // `--enter` é a distância até a borda de baixo (zerada em reduced motion).
  "[--gap:0.75rem] [--enter:calc(100%_+_1rem)] [--stack-y:calc((var(--toast-offset-y)_+_var(--toast-index)_*_var(--gap))_*_-1)]",
  "motion-reduce:[--enter:0px]",
  // Visual do cartão (neobrutalismo, seção 4): borda de tinta + sombra dura + raio de cartão.
  "rounded-card border-[length:var(--border-width)] border-ink bg-card text-foreground shadow-brutal",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // Repouso = empilhado + o que o dedo arrastou.
  "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)_+_var(--stack-y)))]",
  // Entrada: sobe da borda de baixo. Saída: volta pra ela (mais curta), mesmo eixo.
  "transition-[transform,opacity] duration-[350ms] ease-[var(--ease-out)]",
  "data-starting-style:opacity-0 data-starting-style:[transform:translateY(calc(var(--stack-y)_+_var(--enter)))]",
  "data-ending-style:opacity-0 data-ending-style:duration-200 data-ending-style:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)_+_var(--stack-y)_+_var(--enter)))]",
  // Dispensado com o dedo pra direita: sai pela direita.
  "data-[swipe-direction=right]:data-ending-style:[transform:translateX(calc(var(--toast-swipe-movement-x)_+_var(--enter)))_translateY(calc(var(--toast-swipe-movement-y)_+_var(--stack-y)))]",
  // Tirado pelo limite: só some.
  "data-limited:opacity-0",
  // Reduced motion: só o fade (gentil, não zero); o empilhamento fica instantâneo.
  "motion-reduce:transition-[opacity]! motion-reduce:duration-200!",
);

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function ToastItem({ toast }: { toast: Toast.Root.ToastObject }) {
  const variant = (toast.type as ToastVariant | undefined) ?? "default";
  return (
    <Toast.Root toast={toast} className={rootClass}>
      <Toast.Content className="flex items-start gap-3 p-4">
        <AlertIcon variant={variant} />
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          <Toast.Title
            render={<div />}
            className="font-display text-base font-medium leading-snug tracking-[0.02em] text-heading"
          />
          <Toast.Description className="leading-relaxed text-foreground" />
          <Toast.Action
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 justify-self-start")}
          />
        </div>
        <Toast.Close
          aria-label="Fechar notificação"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-mr-1 -mt-1 w-8 shrink-0 px-0")}
        >
          <CloseIcon />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />);
}

export interface ToasterProps {
  className?: string;
  /** Nome da região para leitores de tela. Padrão: "Notificações". */
  "aria-label"?: string;
}

/**
 * Área onde os toasts aparecem — canto inferior direito, fixa. Coloque UMA
 * vez dentro do `ToastProvider`. É a região `aria-live` (educada): o Base UI
 * anuncia cada toast novo e pausa os timers enquanto a pessoa passa o mouse
 * ou foca dentro dela (F6 leva o foco até aqui).
 */
export function Toaster({ className, "aria-label": ariaLabel = "Notificações" }: ToasterProps) {
  return (
    <Toast.Viewport
      aria-label={ariaLabel}
      className={cn("fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] outline-none", className)}
    >
      <ToastList />
    </Toast.Viewport>
  );
}
