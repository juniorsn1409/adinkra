// date-fns/Intl em pt-BR devolvem nome de mês em minúscula (gramática correta
// em texto corrido, não como rótulo de UI) — capitaliza só a primeira letra.
export function capitalizeFirst(text: string): string {
  return text.length > 0 ? text[0]!.toUpperCase() + text.slice(1) : text;
}

/** "16 de Setembro, 2026" — formato pedido pelo usuário pro trigger do DatePicker depois de escolher uma data. */
export function formatLongDate(date: Date): string {
  const day = date.getDate();
  const month = capitalizeFirst(date.toLocaleDateString("pt-BR", { month: "long" }));
  const year = date.getFullYear();
  return `${day} de ${month}, ${year}`;
}

/** "2:45 PM" — 12h com AM/PM, pedido pelo usuário pro trigger do DateTimePicker (a hora internamente continua em 24h; isto é só exibição). */
export function formatTime12h(date: Date): string {
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}
