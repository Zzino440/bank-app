"use client";

import type { Snapshot } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface Props {
  snapshots: Snapshot[];
  onRestore: (snapshot: Snapshot) => void;
  onDelete: (id: number) => void;
}

export default function SnapshotLog({ snapshots, onRestore, onDelete }: Props) {
  // Mostra gli ultimi 15, dal più recente
  const recent = [...snapshots].reverse().slice(0, 15);

  return (
    <div className="mb-8">
      <div className="mb-2.5 font-mono text-[0.68rem] uppercase tracking-widest text-muted">
        Storico aggiornamenti
      </div>

      {!recent.length ? (
        <div className="font-mono text-xs text-muted py-2">
          Nessun aggiornamento.
        </div>
      ) : (
        <div>
          {recent.map((s) => {
            const isPdf =
              s.fonte?.includes("PDF") ||
              s.fonte?.includes("pdf") ||
              s.fonte?.includes("estratti");

            return (
              <div
                key={s.id}
                className="flex items-center gap-2.5 border-b border-border py-2 font-mono text-xs text-muted"
              >
                {/* Data */}
                <span className="w-[70px] shrink-0">{s.data}</span>

                {/* Descrizione */}
                <span
                  className={`min-w-0 flex-1 truncate ${isPdf ? "text-accent-2" : ""}`}
                >
                  {s.fonte || "—"}
                  {s.nota && (
                    <span className="ml-1.5 text-[0.68rem] italic text-accent">
                      · {s.nota}
                    </span>
                  )}
                </span>

                {/* Totale */}
                <span className="shrink-0 font-medium text-text">
                  €{fmt(s.totale)}
                </span>

                {/* Azioni */}
                <div className="flex shrink-0 gap-0.5">
                  {s.snapshot && (
                    <button
                      onClick={() => onRestore(s)}
                      title="Ripristina a questo stato"
                      className="rounded px-1 py-0.5 text-sm text-surface-3 transition-colors hover:text-accent-2"
                    >
                      ↩
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(s.id)}
                    title="Rimuovi dal log"
                    className="rounded px-1 py-0.5 text-sm text-surface-3 transition-colors hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
