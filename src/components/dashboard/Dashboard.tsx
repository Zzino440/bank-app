"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useSnapshots } from "@/hooks/useSnapshots";
import type { Account } from "@/lib/types";
import TotalSummary from "./TotalSummary";
import AccountList from "./AccountList";
import ManualEntryModal from "./ManualEntryModal";
import PdfDropzone from "./PdfDropzone";
import PdfConfirmModal, { type AccountUpdate } from "./PdfConfirmModal";
import type { PdfResults } from "./PdfDropzone";
import HistoryChart from "./HistoryChart";
import SnapshotLog from "./SnapshotLog";
import type { Snapshot } from "@/lib/types";

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
    updateAccounts,
    addAccount,
    refetch: refetchAccounts,
  } = useAccounts();

  const { snapshots, loading: loadingSnapshots, addSnapshot, deleteSnapshot } = useSnapshots();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [pdfResults, setPdfResults] = useState<PdfResults | null>(null);

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

  async function handleManualSave(id: string, updates: Partial<Account>) {
    await updateAccount(id, updates);

    const updatedAccounts = accounts.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    const newTotal = updatedAccounts.reduce((s, a) => s + a.saldo, 0);
    await addSnapshot(updatedAccounts, newTotal, "aggiornamento manuale");
  }

  async function handlePdfApply(updates: AccountUpdate[], nota: string) {
    // Applica nuovi account
    for (const u of updates) {
      if (u.isNew && u.newAccount) {
        await addAccount(u.newAccount);
      }
    }

    // Applica aggiornamenti a account esistenti
    const existingUpdates = updates
      .filter((u) => !u.isNew)
      .map((u) => ({ id: u.id, changes: u.changes }));
    if (existingUpdates.length > 0) {
      await updateAccounts(existingUpdates);
    }

    // Refetch e crea snapshot
    await refetchAccounts();

    // Ricalcola totale con i valori aggiornati
    let updatedAccounts = [...accounts];
    for (const u of updates) {
      if (u.isNew && u.newAccount) {
        updatedAccounts.push(u.newAccount as Account);
      } else {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === u.id ? { ...a, ...u.changes } : a
        );
      }
    }
    const newTotal = updatedAccounts.reduce((s, a) => s + a.saldo, 0);
    await addSnapshot(updatedAccounts, newTotal, "PDF estratti conto", nota || undefined);

    setPdfResults(null);
  }

  async function handleRestore(snapshot: Snapshot) {
    if (!snapshot.snapshot?.accounts) return;

    // Ripristina ogni account dallo snapshot
    const updates = Object.entries(snapshot.snapshot.accounts).map(
      ([id, snap]) => ({
        id,
        changes: {
          saldo: snap.saldo,
          ...(snap.is_etf && {
            qty: snap.qty ?? null,
            price: snap.price ?? null,
            capital_invested: snap.capital_invested ?? null,
          }),
        } as Partial<Account>,
      })
    );

    await updateAccounts(updates);

    // Crea snapshot di ripristino
    const restoredAccounts = accounts.map((a) => {
      const snap = snapshot.snapshot.accounts[a.id];
      return snap ? { ...a, saldo: snap.saldo, qty: snap.qty ?? a.qty, price: snap.price ?? a.price, capital_invested: snap.capital_invested ?? a.capital_invested } : a;
    });
    const newTotal = restoredAccounts.reduce((s, a) => s + a.saldo, 0);
    await addSnapshot(restoredAccounts, newTotal, "↩ ripristino", `stato del ${snapshot.data}`);
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

      <PdfDropzone onResults={setPdfResults} />

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

      <HistoryChart snapshots={snapshots} />

      <SnapshotLog
        snapshots={snapshots}
        onRestore={handleRestore}
        onDelete={deleteSnapshot}
      />

      {editModalOpen && (
        <ManualEntryModal
          accounts={accounts}
          editAccountId={editAccountId}
          onSave={handleManualSave}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {pdfResults && (
        <PdfConfirmModal
          results={pdfResults}
          accounts={accounts}
          onApply={handlePdfApply}
          onClose={() => setPdfResults(null)}
        />
      )}
    </div>
  );
}
