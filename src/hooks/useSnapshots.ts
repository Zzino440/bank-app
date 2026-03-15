"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, Snapshot, SnapshotData } from "@/lib/types";
import { today, todayShort } from "@/lib/utils";

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("snapshots")
      .select("*")
      .order("created_at");
    if (data) setSnapshots(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /** Crea uno snapshot dello stato corrente */
  async function addSnapshot(
    accounts: Account[],
    totale: number,
    fonte: string,
    nota?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Costruisci lo snapshot JSONB
    const snapshotData: SnapshotData = {
      accounts: Object.fromEntries(
        accounts.map((a) => [
          a.id,
          {
            nome: a.nome,
            tipo: a.tipo,
            saldo: a.saldo,
            colore: a.colore,
            is_etf: a.is_etf,
            ...(a.is_etf && {
              qty: a.qty ?? undefined,
              price: a.price ?? undefined,
              capital_invested: a.capital_invested ?? undefined,
            }),
          },
        ])
      ),
    };

    await supabase.from("snapshots").insert({
      user_id: user.id,
      data: today(),
      data_breve: todayShort(),
      totale: parseFloat(totale.toFixed(2)),
      fonte,
      nota: nota || null,
      snapshot: snapshotData,
    });

    await fetch();
  }

  /** Elimina uno snapshot */
  async function deleteSnapshot(id: number) {
    await supabase.from("snapshots").delete().eq("id", id);
    await fetch();
  }

  return {
    snapshots,
    loading,
    addSnapshot,
    deleteSnapshot,
    refetch: fetch,
  };
}
