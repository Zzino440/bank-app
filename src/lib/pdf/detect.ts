export type BankType = "ca" | "n26" | "tr-conto" | "tr-titoli";

/** Identifica la banca dal testo estratto dal PDF */
export function detectBank(text: string): BankType | null {
  const t = text.toUpperCase();

  if (t.includes("ESTRATTO CONTO TITOLI")) return "tr-titoli";
  if (t.includes("TRADE REPUBLIC")) return "tr-conto";
  if (t.includes("N26")) return "n26";

  // CA: il logo è immagine, ma il documento ha pattern univoci
  if (t.includes("CR") && t.includes("DIT AGRICOLE")) return "ca";
  if (
    t.includes("LISTA MOVIMENTI ESTRATTO CONTO") ||
    t.includes("SALDO CONTABILE") ||
    t.includes("ACCREDITO EMOLUMENTI") ||
    t.includes("NOWBANKING")
  )
    return "ca";

  return null;
}
