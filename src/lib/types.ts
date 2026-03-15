export interface Account {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  saldo: number;
  colore: string;
  is_etf: boolean;
  qty: number | null;
  price: number | null;
  capital_invested: number | null;
  sort_order: number;
  created_at: string;
}

export interface Snapshot {
  id: number;
  user_id: string;
  data: string;
  data_breve: string;
  totale: number;
  fonte: string | null;
  nota: string | null;
  snapshot: SnapshotData;
  created_at: string;
}

export interface SnapshotData {
  accounts: Record<string, AccountSnapshot>;
}

export interface AccountSnapshot {
  nome: string;
  tipo: string;
  saldo: number;
  colore: string;
  is_etf: boolean;
  qty?: number;
  price?: number;
  capital_invested?: number;
}
