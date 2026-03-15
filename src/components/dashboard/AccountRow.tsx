"use client";

import type { Account } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface Props {
  account: Account;
  onEdit: (id: string) => void;
}

export default function AccountRow({ account, onEdit }: Props) {
  const abbr = getAbbr(account);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-surface p-3.5 transition-colors hover:border-surface-3 ${
        account.is_etf ? "border-l-2 border-l-accent border-border" : "border-border"
      }`}
    >
      {/* Icona */}
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg font-mono text-[0.6rem] font-medium"
        style={{
          backgroundColor: account.colore + "22",
          color: account.colore,
        }}
      >
        {abbr}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{account.nome}</div>
        <div className="truncate font-mono text-[0.7rem] text-muted">
          {account.is_etf && account.qty && account.price
            ? `${account.tipo} · ${account.qty.toFixed(4)} pz · €${account.price.toFixed(2)}/pz`
            : account.tipo}
        </div>
      </div>

      {/* Saldo */}
      <div className="shrink-0 text-right">
        <div className="font-mono text-[0.95rem] font-medium">
          €{fmt(account.saldo)}
        </div>
      </div>

      {/* Edit */}
      <button
        onClick={() => onEdit(account.id)}
        className="ml-1.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-border text-[0.7rem] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ✎
      </button>
    </div>
  );
}

function getAbbr(account: Account): string {
  if (account.is_etf) return "ETF";
  if (account.id === "ca") return "CA";
  if (account.id.startsWith("n26")) return "N26";
  return "TR";
}
