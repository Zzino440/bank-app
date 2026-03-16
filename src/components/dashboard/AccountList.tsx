"use client";

import type { Account } from "@/lib/types";
import { fmt } from "@/lib/utils";
import AccountRow from "./AccountRow";

interface Props {
  title: string;
  accounts: Account[];
  onEdit: (id: string) => void;
  /** Se true, mostra riga "Capitale versato" in fondo */
  showCapital?: boolean;
  totalCapitalInvested?: number;
  pnl?: number | null;
}

export default function AccountList({
  title,
  accounts,
  onEdit,
  showCapital = false,
  totalCapitalInvested = 0,
  pnl = null,
}: Props) {
  return (
    <div className="mb-8">
      <div className="mb-2.5 font-mono text-[0.68rem] uppercase tracking-widest text-muted">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {accounts.map((a) => (
          <AccountRow key={a.id} account={a} onEdit={onEdit} />
        ))}

        {showCapital && totalCapitalInvested > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-3.5 opacity-75">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-amber/10 font-mono text-[0.56rem] font-medium text-amber">
              PAC
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Capitale versato (PAC)</div>
              <div className="font-mono text-[0.7rem] text-muted">
                Totale versamenti in ETF
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[0.95rem] font-medium text-amber">
                €{fmt(totalCapitalInvested)}
              </div>
              {pnl !== null && (
                <div
                  className={`font-mono text-[0.7rem] ${pnl >= 0 ? "text-accent" : "text-danger"}`}
                >
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(1)}% P&L
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
