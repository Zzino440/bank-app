"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account } from "@/lib/types";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("sort_order");
    if (data) setAccounts(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /** Aggiorna uno o più campi di un account */
  async function updateAccount(id: string, updates: Partial<Account>) {
    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id);
    if (!error) await fetch();
    return error;
  }

  /** Aggiorna più account in batch (es. dopo parsing PDF) */
  async function updateAccounts(
    updates: { id: string; changes: Partial<Account> }[]
  ) {
    for (const { id, changes } of updates) {
      await supabase.from("accounts").update(changes).eq("id", id);
    }
    await fetch();
  }

  /** Crea un nuovo account (es. ETF scoperto da PDF) */
  async function addAccount(account: Omit<Account, "created_at">) {
    const { error } = await supabase.from("accounts").insert(account);
    if (!error) await fetch();
    return error;
  }

  // Derivati utili
  const liquidityAccounts = accounts.filter((a) => !a.is_etf);
  const etfAccounts = accounts.filter((a) => a.is_etf);
  const totalLiquidity = liquidityAccounts.reduce((s, a) => s + a.saldo, 0);
  const totalInvested = etfAccounts.reduce((s, a) => s + a.saldo, 0);
  const totalCapitalInvested = etfAccounts.reduce(
    (s, a) => s + (a.capital_invested ?? 0),
    0
  );
  const total = totalLiquidity + totalInvested;

  return {
    accounts,
    liquidityAccounts,
    etfAccounts,
    loading,
    total,
    totalLiquidity,
    totalInvested,
    totalCapitalInvested,
    updateAccount,
    updateAccounts,
    addAccount,
    refetch: fetch,
  };
}
