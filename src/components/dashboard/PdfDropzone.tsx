"use client";

import { useEffect, useRef, useState } from "react";
import { extractTextFromPDF } from "@/lib/pdf/extract";
import { detectBank, type BankType } from "@/lib/pdf/detect";
import {
  extractCA,
  extractN26,
  extractTRConto,
  extractTRContoAcquisti,
  extractTRTitoli,
  type EtfPosition,
  type AcquistiResult,
} from "@/lib/pdf/parser";

export interface PdfResults {
  liquidity: Record<string, number>;
  etfs: Record<string, EtfPosition>;
  acquisti: AcquistiResult | null;
}

interface ProgressItem {
  name: string;
  status: "loading" | "ok" | "err";
  message: string;
}

interface Props {
  onResults: (results: PdfResults) => void;
  resetSignal: number;
}

const BANK_NAMES: Record<BankType, string> = {
  ca: "Crédit Agricole",
  n26: "N26",
  "tr-conto": "Trade Republic conto",
  "tr-titoli": "Trade Republic titoli",
};

export default function PdfDropzone({ onResults, resetSignal }: Props) {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProgress([]);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetSignal]);

  function addProgress(name: string, status: ProgressItem["status"], message: string) {
    setProgress((prev) => [...prev, { name, status, message }]);
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setProgress([]);
    const results: PdfResults = { liquidity: {}, etfs: {}, acquisti: null };

    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".pdf")) {
        addProgress(file.name, "err", "non è un PDF");
        continue;
      }

      addProgress(file.name, "loading", "lettura in corso...");

      try {
        const text = await extractTextFromPDF(file);
        const bank = detectBank(text);

        if (!bank) {
          setProgress((prev) =>
            prev.map((p) =>
              p.name === file.name && p.status === "loading"
                ? { ...p, status: "err", message: "formato non riconosciuto" }
                : p
            )
          );
          continue;
        }

        let found = false;

        if (bank === "ca") {
          const r = extractCA(text);
          if (r) { Object.assign(results.liquidity, r); found = true; }
        }
        if (bank === "n26") {
          const r = extractN26(text);
          if (r) { Object.assign(results.liquidity, r); found = true; }
        }
        if (bank === "tr-conto") {
          const r = extractTRConto(text);
          if (r) { Object.assign(results.liquidity, r); found = true; }
          const acq = extractTRContoAcquisti(text);
          if (acq) { results.acquisti = acq; found = true; }
        }
        if (bank === "tr-titoli") {
          const r = extractTRTitoli(text);
          if (r) {
            r.forEach((e) => { results.etfs[e.isin] = e; });
            found = true;
          }
        }

        setProgress((prev) =>
          prev.map((p) =>
            p.name === file.name && p.status === "loading"
              ? { ...p, status: found ? "ok" : "err", message: found ? `✓ ${BANK_NAMES[bank]} letto` : "valori non trovati" }
              : p
          )
        );
      } catch (err) {
        setProgress((prev) =>
          prev.map((p) =>
            p.name === file.name && p.status === "loading"
              ? { ...p, status: "err", message: `errore: ${err instanceof Error ? err.message : err}` }
              : p
          )
        );
      }
    }

    // Se abbiamo trovato qualcosa, apri la modal di conferma
    const hasResults =
      Object.keys(results.liquidity).length > 0 ||
      Object.keys(results.etfs).length > 0 ||
      results.acquisti !== null;

    if (hasResults) {
      setTimeout(() => onResults(results), 400);
    }
  }

  return (
    <div className="mb-8">
      <div
        className={`cursor-pointer rounded-xl border-[1.5px] border-dashed bg-surface p-6 text-center transition-all ${
          dragging ? "border-accent bg-accent/[0.04]" : "border-border hover:border-accent hover:bg-accent/[0.04]"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="mb-2 text-3xl">📂</div>
        <div className="mb-1 text-sm font-medium">
          Trascina qui i PDF degli estratti conto
        </div>
        <div className="font-mono text-xs leading-relaxed text-muted">
          Oppure clicca per selezionare · Puoi caricare più file insieme
          <br />
          <strong className="text-accent">CA</strong> ·{" "}
          <strong className="text-accent">N26</strong> ·{" "}
          <strong className="text-accent">TR estratto conto</strong> ·{" "}
          <strong className="text-accent">TR estratto titoli</strong>
        </div>

        {/* Progress */}
        {progress.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-xs text-muted">
                <div
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    p.status === "loading"
                      ? "animate-pulse bg-amber"
                      : p.status === "ok"
                        ? "bg-accent"
                        : "bg-danger"
                  }`}
                />
                {p.name}: {p.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
