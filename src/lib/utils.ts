const itFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const itFormatterInt = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formatta numero con 2 decimali: 25135.36 → "25.135,36" */
export function fmt(n: number): string {
  return itFormatter.format(n);
}

/** Formatta numero intero: 25135 → "25.135" */
export function fmt0(n: number): string {
  return itFormatterInt.format(n);
}

/** Parsa numero in formato italiano: "25.135,36" → 25135.36 */
export function parseITA(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

/** Data odierna lunga: "14 mar 2026" */
export function today(): string {
  return new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Data odierna breve: "14 mar" */
export function todayShort(): string {
  return new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
}
