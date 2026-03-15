"use client";

import type { Account } from "@/lib/types";
import type { Snapshot } from "@/lib/types";
import { fmt, fmt0 } from "@/lib/utils";

interface Props {
  accounts: Account[];
  total: number;
  totalLiquidity: number;
  totalInvested: number;
  totalCapitalInvested: number;
  lastSnapshot: Snapshot | null;
}

// Gruppi per la barra split e la legenda
const GROUPS: { keys: string[] | null; label: string; color: string }[] = [
  { keys: ["ca"], label: "CA", color: "#4fc3f7" },
  { keys: ["n26", "n26s"], label: "N26", color: "#a78bfa" },
  { keys: ["trliq"], label: "TR cash", color: "#67e8f9" },
  { keys: null, label: "ETF", color: "#7ee8a2" },
];

export default function TotalSummary({
  accounts,
  total,
  totalLiquidity,
  totalInvested,
  totalCapitalInvested,
  lastSnapshot,
}: Props) {
  const pnl =
    totalCapitalInvested > 0
      ? ((totalInvested - totalCapitalInvested) / totalCapitalInvested) * 100
      : null;

  function groupValue(group: (typeof GROUPS)[number]): number {
    if (group.keys === null) {
      return accounts.filter((a) => a.is_etf).reduce((s, a) => s + a.saldo, 0);
    }
    return accounts
      .filter((a) => group.keys!.includes(a.id))
      .reduce((s, a) => s + a.saldo, 0);
  }

  function pct(value: number): string {
    return total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";
  }

  return (
    <div className="mb-6">
      {/* Totale */}
      <div className="mb-1 font-mono text-[0.72rem] uppercase tracking-widest text-muted">
        Totale patrimonio
      </div>
      <div className="font-mono text-5xl font-light tracking-tight">
        <span className="mr-1 text-2xl text-muted">€</span>
        {fmt(total)}
      </div>
      {lastSnapshot && (
        <div className="mt-1.5 font-mono text-xs text-muted">
          aggiornato al {lastSnapshot.data}
        </div>
      )}

      {/* Barra split */}
      <div className="mt-5 mb-6 flex flex-col gap-2">
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-border">
          {GROUPS.map((g) => (
            <div
              key={g.label}
              className="rounded-full transition-all duration-500"
              style={{
                width: pct(groupValue(g)),
                backgroundColor: g.color,
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-6">
          {GROUPS.map((g) => (
            <div
              key={g.label}
              className="flex items-center gap-1.5 font-mono text-xs text-muted"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: g.color }}
              />
              {g.label} {pct(groupValue(g))}
            </div>
          ))}
        </div>
      </div>

      {/* Metriche */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric label="Liquidità" value={`€${fmt0(totalLiquidity)}`} sub="CA + N26 + TR cash" />
        <Metric label="Investito" value={`€${fmt0(totalInvested)}`} sub="valore di mercato" />
        <Metric
          label="P&L ETF"
          value={pnl !== null ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%` : "—"}
          sub={totalCapitalInvested > 0 ? `€${fmt0(totalCapitalInvested)} versati` : "vs capitale versato"}
          valueClass={pnl !== null ? (pnl >= 0 ? "text-accent" : "text-danger") : ""}
        />
        <Metric
          label="Ultimo agg."
          value={lastSnapshot?.data_breve ?? "—"}
          sub={lastSnapshot?.fonte ?? "—"}
          smallValue
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  valueClass = "",
  smallValue = false,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
  smallValue?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5">
      <div className="mb-1.5 font-mono text-[0.68rem] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`font-mono font-medium ${smallValue ? "text-sm" : "text-xl"} ${valueClass || "text-text"}`}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[0.7rem] text-muted">{sub}</div>
    </div>
  );
}
