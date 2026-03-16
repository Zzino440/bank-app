"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account } from "@/lib/types";

const DEFAULT_ACCOUNTS = [
  { id: "ca",    nome: "Crédit Agricole",          tipo: "Corrente",     colore: "#4fc3f7", is_etf: false, saldo: 0, sort_order: 0 },
  { id: "n26",   nome: "N26 – conto principale",   tipo: "Corrente",     colore: "#a78bfa", is_etf: false, saldo: 0, sort_order: 1 },
  { id: "n26s",  nome: "N26 – spazio risparmi",    tipo: "Risparmio",    colore: "#c4b5fd", is_etf: false, saldo: 0, sort_order: 2 },
  { id: "trliq", nome: "Trade Republic liquidità", tipo: "Corrente",     colore: "#67e8f9", is_etf: false, saldo: 0, sort_order: 3 },
  { id: "etf1",  nome: "ETF 1",                    tipo: "IE00BG0J4C88", colore: "#a3e635", is_etf: true,  saldo: 0, sort_order: 4 },
  { id: "etf2",  nome: "ETF 2",                    tipo: "IE00BMH5YF48", colore: "#86efac", is_etf: true,  saldo: 0, sort_order: 5 },
];

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("sort_order");

    if (data && data.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const seeded = DEFAULT_ACCOUNTS.map((a) => ({ ...a, user_id: user.id }));
        await supabase.from("accounts").insert(seeded);
        const { data: fresh } = await supabase.from("accounts").select("*").order("sort_order");
        if (fresh) setAccounts(fresh);
      }
    } else if (data) {
      setAccounts(data);
    }

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
