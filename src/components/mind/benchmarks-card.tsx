"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Loader2 } from "lucide-react";
import * as queries from "@/lib/queries";
import { uploadArtefact } from "@/lib/storage";
import {
  BENCHMARK_PROMPTS,
  BENCHMARK_CHECKPOINTS,
  BENCHMARK_LABELS,
  dueCheckpoint,
  type BenchmarkCheckpoint,
} from "@/lib/mastery";

interface BenchmarksCardProps {
  sprintDay: number;
  today: string;
  sprintActive: boolean;
}

/** Day-0 / 45 / 90 benchmark set: capture the same fixed prompts at each
 *  checkpoint so 90 days of growth is visible side by side. */
export function BenchmarksCard({ sprintDay, today, sprintActive }: BenchmarksCardProps) {
  const qc = useQueryClient();
  const { data: benchmarks } = useQuery({ queryKey: ["benchmarks"], queryFn: queries.getBenchmarks });
  const due = dueCheckpoint(sprintDay);
  const [activeCp, setActiveCp] = useState<BenchmarkCheckpoint>(() => due ?? 0);
  const [uploading, setUploading] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const byKey = new Map((benchmarks ?? []).map((b) => [`${b.checkpoint}:${b.prompt_id}`, b]));
  const capturedCount = (cp: number) =>
    BENCHMARK_PROMPTS.filter((p) => byKey.has(`${cp}:${p.id}`)).length;

  async function capture(promptId: string, file: File | undefined) {
    if (!file) return;
    setErr("");
    setUploading(promptId);
    try {
      const url = await uploadArtefact(file, "benchmarks");
      await queries.upsertBenchmark(activeCp, promptId, url, "", today);
      await qc.invalidateQueries({ queryKey: ["benchmarks"] });
    } catch {
      setErr("Upload failed. Check your connection and try again. (If it persists, confirm migration 0002 ran.)");
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Benchmarks
        </h3>
        {due != null && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))]">
            {BENCHMARK_LABELS[due]} due
          </span>
        )}
      </div>

      {/* Checkpoint tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {BENCHMARK_CHECKPOINTS.map((cp) => (
          <button
            key={cp}
            onClick={() => setActiveCp(cp)}
            className={`min-h-[44px] py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeCp === cp
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {BENCHMARK_LABELS[cp]}
            <span className="block text-[10px] font-normal opacity-80">
              {capturedCount(cp)}/{BENCHMARK_PROMPTS.length}
            </span>
          </button>
        ))}
      </div>

      {/* Prompts for the active checkpoint */}
      <div className="space-y-1">
        {BENCHMARK_PROMPTS.map((p) => {
          const existing = byKey.get(`${activeCp}:${p.id}`);
          const busy = uploading === p.id;
          return (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              {existing ? (
                <a
                  href={existing.artefact_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-12 h-12 rounded-lg overflow-hidden bg-[hsl(var(--muted))] shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={existing.artefact_url} alt={p.label} className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--muted))] shrink-0 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  {p.label}
                  {existing && <Check className="w-3.5 h-3.5 text-[hsl(var(--chart-3))]" />}
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{p.hint}</p>
              </div>
              <label
                className={`inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg text-xs font-semibold shrink-0 ${
                  busy
                    ? "text-[hsl(var(--muted-foreground))] pointer-events-none"
                    : "text-[hsl(var(--primary))] active:opacity-70 cursor-pointer"
                }`}
              >
                {busy ? "…" : existing ? "Replace" : "Capture"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => capture(p.id, e.target.files?.[0])}
                />
              </label>
            </div>
          );
        })}
      </div>

      {err && <p className="text-xs text-[hsl(var(--destructive))] mt-3">{err}</p>}
      {!sprintActive && (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-3">
          Set a sprint start date to track Day-0/45/90 timing.
        </p>
      )}
    </section>
  );
}
