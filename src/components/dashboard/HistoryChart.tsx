"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import type { Snapshot } from "@/lib/types";
import { fmt, fmt0 } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  snapshots: Snapshot[];
}

export default function HistoryChart({ snapshots }: Props) {
  // Ultimi 24 snapshot
  const data = useMemo(() => snapshots.slice(-24), [snapshots]);

  if (!data.length) {
    return (
      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 font-mono text-[0.68rem] uppercase tracking-widest text-muted">
          Andamento patrimonio
        </div>
        <div className="flex h-[110px] items-center justify-center font-mono text-xs text-muted">
          Trascina i PDF per iniziare
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((s) => s.data_breve || s.data),
    datasets: [
      {
        data: data.map((s) => s.totale),
        borderColor: "#7ee8a2",
        backgroundColor: "rgba(126,232,162,0.07)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#7ee8a2",
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => "€ " + fmt(ctx.parsed.y ?? 0),
        },
        backgroundColor: "#1e2127",
        borderColor: "#2a2d35",
        borderWidth: 1,
        titleColor: "#6b7080",
        bodyColor: "#e8eaf0",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "#2a2d35" },
        ticks: { color: "#6b7080", font: { family: "DM Mono", size: 10 } },
      },
      y: {
        grid: { color: "#2a2d35" },
        ticks: {
          color: "#6b7080",
          font: { family: "DM Mono", size: 10 },
          callback: (v: number | string) => "€" + fmt0(Number(v)),
        },
      },
    },
  } as const;

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 font-mono text-[0.68rem] uppercase tracking-widest text-muted">
        Andamento patrimonio
      </div>
      <Line data={chartData} options={options} height={110} />
    </div>
  );
}
