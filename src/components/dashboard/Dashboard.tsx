"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useSnapshots } from "@/hooks/useSnapshots";
import type { Account } from "@/lib/types";
import TotalSummary from "./TotalSummary";
import AccountList from "./AccountList";
import ManualEntryModal from "./ManualEntryModal";

export default function Dashboard() {
  const {
    accounts,
    liquidityAccounts,
    etfAccounts,
    loading: loadingAccounts,
    total,
    totalLiquidity,
    totalInvested,
    totalCapitalInvested,
    updateAccount,
  } = useAccounts();

  const { snapshots, loading: loadingSnapshots, addSnapshot } = useSnapshots();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);

  if (loadingAccounts || loadingSnapshots) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-sm text-muted">Caricamento...</p>
      </div>
    );
  }

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const pnl =
    totalCapitalInvested > 0
      ? ((totalInvested - totalCapitalInvested) / totalCapitalInvested) * 100
      : null;

  function handleEdit(id: string) {
    setEditAccountId(id);
    setEditModalOpen(true);
  }

  function handleOpenManual() {
    setEditAccountId(null);
    setEditModalOpen(true);
  }

  async function handleSave(id: string, updates: Partial<Account>) {
    await updateAccount(id, updates);

    // Ricalcola totale con i nuovi valori
    const updatedAccounts = accounts.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    const newTotal = updatedAccounts.reduce((s, a) => s + a.saldo, 0);
    await addSnapshot(updatedAccounts, newTotal, "aggiornamento manuale");
  }

  return (
    <div>
      {/* Bottone manuale */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleOpenManual}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85"
        >
          + Manuale
        </button>
      </div>

      <TotalSummary
        accounts={accounts}
        total={total}
        totalLiquidity={totalLiquidity}
        totalInvested={totalInvested}
        totalCapitalInvested={totalCapitalInvested}
        lastSnapshot={lastSnapshot}
      />

      <AccountList
        title="Conti correnti e liquidità"
        accounts={liquidityAccounts}
        onEdit={handleEdit}
      />

      <AccountList
        title="Portafoglio ETF"
        accounts={etfAccounts}
        onEdit={handleEdit}
        showCapital
        totalCapitalInvested={totalCapitalInvested}
        pnl={pnl}
      />

      {editModalOpen && (
        <ManualEntryModal
          accounts={accounts}
          editAccountId={editAccountId}
          onSave={handleSave}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}
