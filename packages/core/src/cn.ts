import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais e resolve conflitos do Tailwind — entre duas
 * classes do mesmo utilitário (ex.: bg-primary e bg-destructive), a última
 * vence. É o que permite `<Button className="...">` sobrescrever uma
 * variante sem !important.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
