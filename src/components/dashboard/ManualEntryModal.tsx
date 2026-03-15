"use client";

import { useState, useEffect } from "react";
import type { Account } from "@/lib/types";

interface Props {
  accounts: Account[];
  editAccountId: string | null;
  onSave: (id: string, updates: Partial<Account>) => Promise<void>;
  onClose: () => void;
}

export default function ManualEntryModal({
  accounts,
  editAccountId,
  onSave,
  onClose,
}: Props) {
  const [selectedId, setSelectedId] = useState(editAccountId ?? accounts[0]?.id ?? "");
  const [saldo, setSaldo] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [capitalInvested, setCapitalInvested] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = accounts.find((a) => a.id === selectedId);
  const isEtf = selected?.is_etf ?? false;

  // Quando cambia account selezionato, precompila i campi
  useEffect(() => {
    if (!selected) return;
    if (isEtf) {
      setQty(selected.qty?.toString() ?? "");
      setPrice(selected.price?.toString() ?? "");
      setCapitalInvested(selected.capital_invested?.toString() ?? "");
      setSaldo("");
    } else {
      setSaldo(selected.saldo?.toString() ?? "");
      setQty("");
      setPrice("");
      setCapitalInvested("");
    }
  }, [selectedId, selected, isEtf]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const updates: Partial<Account> = {};

    if (isEtf) {
      const q = parseFloat(qty);
      const p = parseFloat(price);
      const cap = parseFloat(capitalInvested);
      if (!isNaN(q)) updates.qty = q;
      if (!isNaN(p)) updates.price = p;
      if (!isNaN(q) && !isNaN(p)) updates.saldo = parseFloat((q * p).toFixed(2));
      if (!isNaN(cap)) updates.capital_invested = cap;
    } else {
      const v = parseFloat(saldo);
      if (isNaN(v) || v < 0) {
        setSaving(false);
        return;
      }
      updates.saldo = v;
    }

    await onSave(selectedId, updates);
    setSaving(false);
    onClose();
  }

  const liquidityAccounts = accounts.filter((a) => !a.is_etf);
  const etfAccounts = accounts.filter((a) => a.is_etf);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="m-4 w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface-2 p-6"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-[0.95rem] font-semibold">Aggiorna saldo</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Selezione conto */}
          <Field label="Conto / strumento">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
            >
              <optgroup label="Liquidità">
                {liquidityAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {a.tipo}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Investimenti ETF">
                {etfAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>

          {/* Campi dinamici */}
          {isEtf ? (
            <>
              <Field label="Quantità (pezzi)">
                <Input value={qty} onChange={setQty} placeholder="es. 35.264301" step="0.000001" />
              </Field>
              <Field label="Prezzo per unità (€)">
                <Input value={price} onChange={setPrice} placeholder="es. 8.37" step="0.01" />
              </Field>
              <Field label="Capitale versato (€)">
                <Input value={capitalInvested} onChange={setCapitalInvested} placeholder="es. 318.00" step="0.01" />
              </Field>
            </>
          ) : (
            <Field label="Saldo (€)">
              <Input value={saldo} onChange={setSaldo} placeholder="es. 25135.36" step="0.01" />
            </Field>
          )}

          {/* Nota */}
          <Field label="Nota (opzionale)">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="es. dopo stipendio marzo"
              className="min-h-[52px] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
            />
          </Field>

          {/* Azioni */}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-text"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min="0"
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
    />
  );
}
