"use client";

import { useAccounts } from "@/hooks/useAccounts";
import { useSnapshots } from "@/hooks/useSnapshots";
import TotalSummary from "./TotalSummary";
import AccountList from "./AccountList";

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
  } = useAccounts();

  const { snapshots, loading: loadingSnapshots } = useSnapshots();

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
    // TODO: Step 7 — modal inserimento manuale
    console.log("Edit:", id);
  }

  return (
    <div>
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
    </div>
  );
}
