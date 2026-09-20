"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@adinkra/core";

/**
 * Avatar = Avatar (círculo com borda de tinta) + AvatarImage + AvatarFallback,
 * a composição do shadcn. A imagem é carregada num `Image()` à parte só pra
 * saber se deu certo: enquanto carrega e se falhar, aparece o AvatarFallback
 * (iniciais); a `<img>` só entra no DOM quando já está pronta, então nunca
 * há ícone de imagem quebrada nem o círculo piscando vazio. `"use client"`
 * no arquivo-fonte porque usa estado/efeito (armadilhas 1 e 3,
 * DECISOES.md) — por isso `avatarVariants` não é exportado (seria uma
 * referência de cliente, inutilizável num Server Component).
 *
 * Borda de tinta em `--border-width`, mas SEM sombra dura nem hover: o
 * avatar não é clicável (quem quiser, envolve num <button>/<a> e ganha os
 * estados do foco). Círculo total (`rounded-full`), exceção consciente aos
 * dois níveis de raio do sistema — rosto/identidade não é controle nem
 * cartão. Sem animação nenhuma (identidade, vista dezenas de vezes por tela).
 *
 * Iniciais em `--surface` + `--heading` (contraste alto nos dois temas). Não
 * usa `--secondary` de propósito: no tema escuro o par `--secondary` /
 * `--secondary-foreground` do tokens.css hoje não passa AA.
 */
const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border-[length:var(--border-width)] border-ink bg-surface font-display font-medium uppercase tracking-[0.04em] text-heading",
  {
    variants: {
      size: {
        sm: "size-7 text-[0.625rem]",
        md: "size-9 text-xs",
        lg: "size-12 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type ImageStatus = "idle" | "loading" | "loaded" | "error";

interface AvatarContextValue {
  status: ImageStatus;
  setStatus: (status: ImageStatus) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext(component: string): AvatarContextValue {
  const ctx = React.useContext(AvatarContext);
  if (!ctx) throw new Error(`<${component}> precisa estar dentro de <Avatar>.`);
  return ctx;
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {}

export function Avatar({ size, className, ...props }: AvatarProps) {
  const [status, setStatus] = React.useState<ImageStatus>("idle");
  const value = React.useMemo(() => ({ status, setStatus }), [status]);
  return (
    <AvatarContext.Provider value={value}>
      <span data-slot="avatar" className={cn(avatarVariants({ size }), className)} {...props} />
    </AvatarContext.Provider>
  );
}

export interface AvatarImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src?: string | null;
  /** Obrigatório: o nome da pessoa. Se o avatar for só decorativo (o nome está ao lado), passe `alt=""`. */
  alt: string;
}

export function AvatarImage({ src, alt, className, ...props }: AvatarImageProps) {
  const { status, setStatus } = useAvatarContext("AvatarImage");

  React.useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setStatus("loaded");
    };
    probe.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, setStatus]);

  if (status !== "loaded" || !src) return null;
  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn("absolute inset-0 size-full object-cover", className)}
      {...props}
    />
  );
}

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>;

/** Iniciais (até 2 letras) mostradas enquanto a imagem carrega, falha ou não existe. */
export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  const { status } = useAvatarContext("AvatarFallback");
  if (status === "loaded") return null;
  return <span data-slot="avatar-fallback" className={cn("leading-none", className)} {...props} />;
}

/**
 * Grupo sobreposto. Cada avatar ganha um anel na cor do fundo pra "recortar"
 * o vizinho de baixo, além da borda de tinta. Pra "+3", use um Avatar com
 * AvatarFallback "+3". Não é uma lista semântica: se a ordem/quantidade
 * importa, ponha `role="group"` e um `aria-label`.
 */
export function AvatarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn("flex items-center -space-x-2 [&>[data-slot=avatar]]:ring-2 [&>[data-slot=avatar]]:ring-background", className)}
      {...props}
    />
  );
}
