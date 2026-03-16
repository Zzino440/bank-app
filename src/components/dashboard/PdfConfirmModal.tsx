"use client";

import { useState } from "react";
import type { Account } from "@/lib/types";
import type { PdfResults } from "./PdfDropzone";
import { fmt } from "@/lib/utils";

// Mappa ISIN → account id per ETF noti
const ISIN_TO_KEY: Record<string, string> = {
  IE00BG0J4C88: "etf1",
  IE00BMH5YF48: "etf2",
};

interface Props {
  results: PdfResults;
  accounts: Account[];
  userId: string;
  onApply: (updates: AccountUpdate[], nota: string) => Promise<void>;
  onClose: () => void;
}

export interface AccountUpdate {
  id: string;
  changes: Partial<Account>;
  isNew?: boolean;
  newAccount?: Omit<Account, "created_at">;
}

const LIQ_FIELDS = [
  { key: "ca", label: "Crédit Agricole", color: "#4fc3f7", abbr: "CA" },
  { key: "n26", label: "N26 – conto principale", color: "#a78bfa", abbr: "N26" },
  { key: "n26s", label: "N26 – spazio risparmi", color: "#c4b5fd", abbr: "N26" },
  { key: "trliq", label: "Trade Republic liquidità", color: "#67e8f9", abbr: "TR" },
];

export default function PdfConfirmModal({ results, accounts, userId, onApply, onClose }: Props) {
  // State per i valori editabili
  const [liqValues, setLiqValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    LIQ_FIELDS.forEach((f) => {
      if (results.liquidity[f.key] !== undefined) {
        init[f.key] = results.liquidity[f.key].toFixed(2);
      }
    });
    return init;
  });

  const [etfValues, setEtfValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(results.etfs).forEach(([isin, e]) => {
      init[isin] = e.mktVal.toFixed(2);
    });
    return init;
  });

  const [capitalValue, setCapitalValue] = useState(() => {
    if (!results.acquisti) return "";
    const current = accounts
      .filter((a) => a.is_etf)
      .reduce((s, a) => s + (a.capital_invested ?? 0), 0);
    return (current + results.acquisti.totale).toFixed(2);
  });

  const [nota, setNota] = useState("");
  const [applying, setApplying] = useState(false);

  const foundCount =
    Object.keys(liqValues).length +
    Object.keys(etfValues).length +
    (results.acquisti ? 1 : 0);

  async function handleApply() {
    setApplying(true);
    const updates: AccountUpdate[] = [];

    // Liquidità
    Object.entries(liqValues).forEach(([key, val]) => {
      const v = parseFloat(val);
      if (!isNaN(v) && v >= 0) {
        updates.push({ id: key, changes: { saldo: v } });
      }
    });

    // ETF
    Object.entries(results.etfs).forEach(([isin, e]) => {
      const val = parseFloat(etfValues[isin]);
      if (isNaN(val) || val < 0) return;

      const existingKey = ISIN_TO_KEY[isin];
      const existingAccount = existingKey
        ? accounts.find((a) => a.id === existingKey)
        : accounts.find((a) => a.tipo === isin);

      if (existingAccount) {
        updates.push({
          id: existingAccount.id,
          changes: { saldo: val, qty: e.qty, price: e.price },
        });
      } else {
        // ETF nuovo
        const newId = "etf_" + isin;
        ISIN_TO_KEY[isin] = newId;
        updates.push({
          id: newId,
          isNew: true,
          changes: {},
          newAccount: {
            id: newId,
            user_id: userId,
            nome: e.nome,
            tipo: isin,
            saldo: val,
            colore: "#a3e635",
            is_etf: true,
            qty: e.qty,
            price: e.price,
            capital_invested: 0,
            sort_order: accounts.length,
          },
        });
      }
    });

    // Capitale PAC — distribuisci proporzionalmente
    if (results.acquisti && capitalValue) {
      const newTotal = parseFloat(capitalValue);
      if (!isNaN(newTotal) && newTotal >= 0) {
        const etfAccs = accounts.filter((a) => a.is_etf);
        const totalSaldo = etfAccs.reduce((s, a) => s + a.saldo, 0);

        etfAccs.forEach((a) => {
          const proportion = totalSaldo > 0 ? a.saldo / totalSaldo : 1 / etfAccs.length;
          const cap = parseFloat((newTotal * proportion).toFixed(2));

          // Cerca se c'è già un update per questo account
          const existing = updates.find((u) => u.id === a.id);
          if (existing) {
            existing.changes.capital_invested = cap;
          } else {
            updates.push({ id: a.id, changes: { capital_invested: cap } });
          }
        });
      }
    }

    await onApply(updates, nota);
    setApplying(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="m-4 w-full max-w-[520px] overflow-y-auto rounded-2xl border border-border bg-surface-2 p-6"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-[0.95rem] font-semibold">
          Valori estratti dai PDF
        </h2>
        <div className="mb-5 font-mono text-xs text-muted">
          {foundCount} valori trovati · modifica se necessario
        </div>

        {/* Liquidità */}
        {LIQ_FIELDS.map((f) => {
          const isFound = liqValues[f.key] !== undefined;
          return (
            <ConfirmRow
              key={f.key}
              abbr={f.abbr}
              label={f.label}
              color={f.color}
              value={liqValues[f.key] ?? ""}
              isFound={isFound}
              onChange={(v) => setLiqValues((prev) => ({ ...prev, [f.key]: v }))}
            />
          );
        })}

        {/* ETF */}
        {Object.keys(results.etfs).length > 0 && (
          <>
            <div className="pb-1 pt-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted">
              ETF trovati nel PDF
            </div>
            {Object.entries(results.etfs).map(([isin, e]) => {
              const isNew = !ISIN_TO_KEY[isin] && !accounts.find((a) => a.tipo === isin);
              return (
                <ConfirmRow
                  key={isin}
                  abbr="ETF"
                  label={e.nome}
                  sublabel={`${isin} · ${e.qty.toFixed(4)} pz · €${e.price.toFixed(2)}/pz${isNew ? " · nuovo" : ""}`}
                  color="#7ee8a2"
                  value={etfValues[isin] ?? ""}
                  isFound={true}
                  onChange={(v) => setEtfValues((prev) => ({ ...prev, [isin]: v }))}
                />
              );
            })}
          </>
        )}

        {/* Capitale PAC */}
        {results.acquisti && (
          <>
            <div className="pb-1 pt-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted">
              Capitale PAC
            </div>
            <div className="flex items-center gap-3 border-b border-border py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber/10 font-mono text-[0.56rem] text-amber">
                PAC
              </div>
              <div className="flex-1">
                <div className="font-mono text-xs text-muted">Capitale versato totale</div>
                <div className="font-mono text-[0.65rem] text-muted">
                  trovati <strong className="text-text">{results.acquisti.count} acquisti</strong> · +€{fmt(results.acquisti.totale)} questo periodo
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                value={capitalValue}
                onChange={(e) => setCapitalValue(e.target.value)}
                className="w-[110px] rounded-md border border-border bg-surface px-2 py-1.5 text-right font-mono text-[0.82rem] text-text outline-none focus:border-accent"
              />
              <div className="w-4 text-center text-sm">✓</div>
            </div>
          </>
        )}

        {/* Nota */}
        <div className="mt-4">
          <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wide text-muted">
            Nota aggiornamento
          </label>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="es. estratti marzo 2026"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
          />
        </div>

        {/* Azioni */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-text"
          >
            Annulla
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {applying ? "Applicazione..." : "Applica aggiornamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({
  abbr,
  label,
  sublabel,
  color,
  value,
  isFound,
  onChange,
}: {
  abbr: string;
  label: string;
  sublabel?: string;
  color: string;
  value: string;
  isFound: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[0.6rem]"
        style={{ backgroundColor: color + "22", color }}
      >
        {abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-muted">{label}</div>
        {sublabel && (
          <div className="font-mono text-[0.65rem] text-muted truncate">{sublabel}</div>
        )}
      </div>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isFound ? "" : "non trovato"}
        className={`w-[110px] rounded-md border bg-surface px-2 py-1.5 text-right font-mono text-[0.82rem] outline-none focus:border-accent ${
          isFound ? "border-border text-text" : "border-surface-3 text-muted"
        }`}
      />
      <div className="w-4 text-center text-sm">{isFound ? "✓" : "·"}</div>
    </div>
  );
}
