"use client";

import { useState, useRef } from "react";
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
  const [pdfResetSignal, setPdfResetSignal] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

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

  function handlePdfFlowClose() {
    setPdfResults(null);
    setPdfResetSignal((prev) => prev + 1);
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

  function handleExport() {
    const data = { accounts, snapshots };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patrimonio_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.accounts || !data.snapshots) {
          alert("File non valido");
          return;
        }

        // Aggiorna ogni account
        for (const acc of data.accounts) {
          await updateAccount(acc.id, {
            saldo: acc.saldo,
            qty: acc.qty,
            price: acc.price,
            capital_invested: acc.capital_invested,
          });
        }

        await refetchAccounts();
        alert("Importazione completata");
      } catch {
        alert("File non valido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      {/* Azioni header */}
      <div className="mb-6 flex justify-end gap-2">
        <button
          onClick={handleExport}
          className="rounded-lg border border-border px-3.5 py-2 font-mono text-xs text-muted transition-colors hover:border-surface-3 hover:text-text"
        >
          ⬇ Esporta
        </button>
        <label className="cursor-pointer rounded-lg border border-border px-3.5 py-2 font-mono text-xs text-muted transition-colors hover:border-surface-3 hover:text-text">
          ⬆ Importa
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
        <button
          onClick={handleOpenManual}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85"
        >
          + Manuale
        </button>
      </div>

      <PdfDropzone onResults={setPdfResults} resetSignal={pdfResetSignal} />

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
          onClose={handlePdfFlowClose}
        />
      )}
    </div>
  );
}
