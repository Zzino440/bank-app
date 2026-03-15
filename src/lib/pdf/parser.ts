import { parseITA } from "@/lib/utils";

// ── Risultati dei parser ──

export interface LiquidityResult {
  [key: string]: number; // es. { ca: 25135.36 } o { n26: 1200.93, n26s: 0.51 }
}

export interface EtfPosition {
  isin: string;
  nome: string;
  qty: number;
  price: number;
  mktVal: number;
}

export interface AcquistiResult {
  totale: number;
  count: number;
}

// ── Parser per banca ──

/** Crédit Agricole — cerca saldo finale/contabile/disponibile */
export function extractCA(text: string): LiquidityResult | null {
  let m = text.match(/[Ss]aldo\s+finale\s+([\d.]+,\d{2})\s*EUR/);
  if (m) return { ca: parseITA(m[1]) };

  m = text.match(/[Ss]aldo\s+[Cc]ontabile\s+([\d.]+,\d{2})/);
  if (m) return { ca: parseITA(m[1]) };

  m = text.match(/[Ss]aldo\s+disponibile\s+([\d.]+,\d{2})\s*EUR/);
  if (m) return { ca: parseITA(m[1]) };

  return null;
}

/** N26 — cerca "Il tuo nuovo saldo" (principale + risparmi) */
export function extractN26(text: string): LiquidityResult | null {
  const all = [
    ...text.matchAll(/Il tuo nuovo saldo\s*\+?([\d.]+,\d{2})€/g),
  ];
  if (!all.length) return null;

  const result: LiquidityResult = { n26: parseITA(all[0][1]) };

  if (all.length > 1 && /Spazio|Risparmi/i.test(text)) {
    result.n26s = parseITA(all[all.length - 1][1]);
  }

  return result;
}

/** Trade Republic conto — cerca saldo corrente */
export function extractTRConto(text: string): LiquidityResult | null {
  const m = text.match(
    /Conto corrente\s+([\d,]+)\s*€\s+([\d,]+)\s*€\s+([\d,]+)\s*€\s+([\d,]+)\s*€/
  );
  if (m) return { trliq: parseITA(m[4]) };

  const m2 = text.match(/Cr[eé]dit\s+Agricole\s+([\d,]+)\s*€/i);
  if (m2) return { trliq: parseITA(m2[1]) };

  return null;
}

/** Trade Republic conto — conta acquisti ETF per calcolo capitale */
export function extractTRContoAcquisti(text: string): AcquistiResult | null {
  let totale = 0;
  let count = 0;

  const re =
    /(?:Buy trade|Savings plan execution)[^€]{5,400}?([\d]+,[\d]{2})\s*€\s+[\d,]+\s*€/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    totale += parseITA(m[1]);
    count++;
  }

  return count > 0 ? { totale: parseFloat(totale.toFixed(2)), count } : null;
}

/** Trade Republic titoli — estrae posizioni ETF (qty, ISIN, prezzo, valore) */
export function extractTRTitoli(text: string): EtfPosition[] | null {
  const results: EtfPosition[] = [];

  const blockRe =
    /([\d]+,[\d]{1,6})\s+Pz\.\s+([\s\S]{1,300}?)ISIN:\s*([A-Z]{2}[A-Z0-9]{10})([\s\S]{1,150}?)(\d{2}\.\d{2}\.\d{4})\s+([\d]+,[\d]{1,2})/g;
  let m;

  while ((m = blockRe.exec(text)) !== null) {
    const qty = parseITA(m[1]);
    const isin = m[3];
    const mktVal = parseITA(m[6]);

    const betweenBlock = m[4];
    const priceMatches = [...betweenBlock.matchAll(/([\d]+,[\d]+)/g)];
    const price = priceMatches.length
      ? parseITA(priceMatches[priceMatches.length - 1][1])
      : 0;

    const nameRaw = m[2].replace(/\s+/g, " ").trim();
    const nome = nameRaw.length > 50 ? nameRaw.substring(0, 50) + "…" : nameRaw;

    results.push({ isin, nome, qty, price, mktVal });
  }

  return results.length ? results : null;
}
