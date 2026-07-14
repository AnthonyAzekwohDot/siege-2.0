"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import * as queries from "@/lib/queries";
import {
  MIND_SCHEDULE,
  MINIMUM_WIN_BLOCKS,
  MIND_CATEGORY_INFO,
  DEEP_WORK_CATEGORIES,
} from "@/lib/constants";
import { getSprintProgress } from "@/lib/sprint";
import { uploadArtefact } from "@/lib/storage";
import type {
  MindDailyLog,
  MindBlock,
  MindLogEntry,
  MindCategory,
  BlockStatus,
  StretchLevel,
  Fundamental,
  DayOfWeek,
} from "@/lib/types";
import { FUNDAMENTALS, FUNDAMENTAL_LABELS, DRAWING_FUNDAMENTALS, PAINTING_FUNDAMENTALS } from "@/lib/types";
import { NeglectNudge } from "@/components/mind/neglect-nudge";
import { ArtefactDiary } from "@/components/mind/artefact-diary";
import { BenchmarksCard } from "@/components/mind/benchmarks-card";
import {
  Play,
  Square,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Flame,
  ToggleLeft,
  ToggleRight,
  Target,
  Crosshair,
  Sparkles,
  Camera,
  Loader2,
} from "lucide-react";

// ============================================================
// Mind — Creative Mastery Tracker
// ============================================================

const STATUS_OPTIONS: { value: BlockStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "done", label: "Done", icon: CheckCircle2 },
  { value: "partial", label: "Partial", icon: AlertCircle },
  { value: "skipped", label: "Skipped", icon: XCircle },
];

const STRETCH_OPTIONS: { value: StretchLevel; label: string; description: string }[] = [
  { value: "comfort", label: "Comfort", description: "Practised what I already know" },
  { value: "stretch", label: "Stretch", description: "Pushed past my current level" },
  { value: "breakthrough", label: "Breakthrough", description: "Something clicked today" },
];

function getCategoryColor(category: MindCategory): string {
  const colorVar = MIND_CATEGORY_INFO[category];
  return `hsl(var(--${colorVar}))`;
}

// ---------- Timer Display ----------

function TimerDisplay({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <span className="text-lg font-mono font-bold text-[hsl(var(--primary))]">
      {hours > 0 && `${hours}:`}
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

// ---------- Star Rating ----------

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} aria-label={`${star} star${star>1?"s":""}`} aria-pressed={star <= value} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Star className={`w-6 h-6 transition-colors ${star <= value ? "fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]" : "text-[hsl(var(--muted-foreground))]"}`} />
        </button>
      ))}
    </div>
  );
}

// ---------- Fundamental Chips ----------

function FundamentalChips({
  selected,
  onChange,
  options,
}: {
  selected: Fundamental[];
  onChange: (f: Fundamental[]) => void;
  options?: Fundamental[];
}) {
  const available = options ?? FUNDAMENTALS;
  return (
    <div className="flex flex-wrap gap-1.5">
      {available.map((f) => {
        const isSelected = selected.includes(f);
        return (
          <button
            key={f}
            onClick={() => {
              if (isSelected) onChange(selected.filter((x) => x !== f));
              else onChange([...selected, f]);
            }}
            aria-pressed={isSelected}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isSelected
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {FUNDAMENTAL_LABELS[f]}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Fundamentals Coverage ----------

const CATEGORIES_2D: MindCategory[] = ["drawing", "painting", "master-study", "experimentation"];
const CATEGORIES_3D: MindCategory[] = ["sculpture"];

type CoverageItem = {
  fundamental: Fundamental;
  label: string;
  count: number;
  intensity: number;
  daysSince: number;
};

function computeCoverage(
  allLogs: MindDailyLog[],
  categoryFilter: MindCategory[],
  fundamentalsList: Fundamental[],
): CoverageItem[] {
  const counts: Record<string, number> = {};
  const lastPracticed: Record<string, string> = {};

  for (const f of fundamentalsList) {
    counts[f] = 0;
    lastPracticed[f] = "";
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = format(cutoff, "yyyy-MM-dd");

  for (const log of allLogs) {
    if (log.date < cutoffStr) continue;
    for (const entry of log.entries) {
      if (!categoryFilter.includes(entry.category)) continue;
      if (entry.fundamentals) {
        for (const f of entry.fundamentals) {
          if (!fundamentalsList.includes(f)) continue;
          counts[f] = (counts[f] || 0) + 1;
          if (!lastPracticed[f] || log.date > lastPracticed[f]) {
            lastPracticed[f] = log.date;
          }
        }
      }
    }
  }

  const maxCount = Math.max(...Object.values(counts), 1);

  return fundamentalsList.map((f) => ({
    fundamental: f,
    label: FUNDAMENTAL_LABELS[f],
    count: counts[f],
    intensity: counts[f] / maxCount,
    daysSince: lastPracticed[f]
      ? Math.max(0, Math.floor((Date.now() - new Date(lastPracticed[f] + "T12:00:00").getTime()) / 86400000))
      : 999,
  }));
}

function CoverageRow({ item, colorVar, onTap }: { item: CoverageItem; colorVar: string; onTap?: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex min-h-[44px] items-center gap-2 py-1.5 w-full text-left touch-manipulation active:bg-[hsl(var(--muted))/0.5] rounded transition-colors"
    >
      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.count > 0 ? `hsl(var(--${colorVar}) / ${0.2 + item.intensity * 0.8})` : "hsl(var(--muted))" }} />
      <span className="text-xs text-[hsl(var(--foreground))] flex-1">{item.label}</span>
      <span className={`text-[10px] font-medium ${item.daysSince > 7 ? "text-[hsl(var(--destructive))]" : item.daysSince > 3 ? "text-[hsl(var(--chart-4))]" : "text-[hsl(var(--muted-foreground))]"}`}>
        {item.count === 0 ? "never" : item.daysSince === 0 ? "today" : `${item.daysSince}d ago`}
      </span>
      <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-6 text-right">{item.count}x</span>
    </button>
  );
}

function FundamentalsCoverage({ allLogs, onLogFundamental }: { allLogs: MindDailyLog[]; onLogFundamental: (fundamental: Fundamental, category: MindCategory) => void }) {
  const drawing2D = useMemo(() => computeCoverage(allLogs, CATEGORIES_2D, DRAWING_FUNDAMENTALS), [allLogs]);
  const painting2D = useMemo(() => computeCoverage(allLogs, CATEGORIES_2D, PAINTING_FUNDAMENTALS), [allLogs]);
  const drawing3D = useMemo(() => computeCoverage(allLogs, CATEGORIES_3D, DRAWING_FUNDAMENTALS), [allLogs]);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Fundamentals (30 days)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 2D Column */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--chart-1))] mb-1.5">2D</p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Drawing</p>
          <div className="space-y-0.5 mb-2">
            {drawing2D.map((item) => <CoverageRow key={item.fundamental} item={item} colorVar="chart-1" onTap={() => onLogFundamental(item.fundamental, "drawing")} />)}
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Painting</p>
          <div className="space-y-0.5">
            {painting2D.map((item) => <CoverageRow key={item.fundamental} item={item} colorVar="chart-2" onTap={() => onLogFundamental(item.fundamental, "painting")} />)}
          </div>
        </div>

        {/* 3D Column */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--chart-3))] mb-1.5">3D</p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Sculpture</p>
          <div className="space-y-0.5">
            {drawing3D.map((item) => <CoverageRow key={`3d-${item.fundamental}`} item={item} colorVar="chart-3" onTap={() => onLogFundamental(item.fundamental, "sculpture")} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Quick Fundamental Log ----------

function QuickFundamentalLog({
  fundamental,
  category,
  onSubmit,
  onClose,
}: {
  fundamental: Fundamental;
  category: MindCategory;
  onSubmit: (data: { minutes: number; stretchLevel: StretchLevel; note: string }) => void;
  onClose: () => void;
}) {
  const [minutes, setMinutes] = useState(30);
  const [stretchLevel, setStretchLevel] = useState<StretchLevel>("stretch");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-[hsl(var(--card))] rounded-2xl p-5 space-y-4 max-h-[80dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{FUNDAMENTAL_LABELS[fundamental]}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{category} practice</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Minutes</p>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                aria-pressed={minutes === m}
                className={`flex-1 min-h-[44px] py-2 rounded-lg text-sm font-medium transition-colors ${
                  minutes === m
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Push Level</p>
          <StretchSelector value={stretchLevel} onChange={setStretchLevel} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Note (optional)</p>
          <textarea
            value={note}
            aria-label="Session note"
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What did you drill?"
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm resize-none"
          />
        </div>

        <button
          onClick={() => onSubmit({ minutes, stretchLevel, note })}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
        >
          Log Practice
        </button>
      </div>
    </div>
  );
}

// ---------- Streak Counter ----------

function StreakBadge({ allLogs }: { allLogs: MindDailyLog[] }) {
  const streak = useMemo(() => {
    if (!allLogs.length) return 0;

    // Sort by date descending
    const sorted = [...allLogs]
      .filter((l) => l.entries.some((e) => e.status === "done" || e.status === "partial"))
      .map((l) => l.date)
      .sort((a, b) => (b > a ? 1 : -1));

    if (sorted.length === 0) return 0;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = format(yesterdayDate, "yyyy-MM-dd");

    // Must include today or yesterday to count as active streak
    if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + "T12:00:00");
      const curr = new Date(sorted[i] + "T12:00:00");
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diffDays === 1) count++;
      else break;
    }
    return count;
  }, [allLogs]);

  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--chart-2))/0.15]">
      <Flame className="w-3.5 h-3.5 text-[hsl(var(--chart-2))]" />
      <span className="text-xs font-bold text-[hsl(var(--chart-2))]">{streak} day streak</span>
    </div>
  );
}

// ---------- Stretch Level Selector ----------

function StretchSelector({ value, onChange }: { value: StretchLevel; onChange: (v: StretchLevel) => void }) {
  return (
    <div className="space-y-1.5">
      {STRETCH_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`w-full min-h-[44px] text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            value === opt.value
              ? opt.value === "breakthrough"
                ? "bg-[hsl(var(--chart-3))] text-white"
                : opt.value === "stretch"
                ? "bg-[hsl(var(--chart-4))] text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              : "bg-[hsl(var(--muted))/0.5] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          <span className="font-medium">{opt.label}</span>
          <span className={`text-[11px] ml-2 ${value === opt.value ? "opacity-90" : "text-[hsl(var(--muted-foreground))]"}`}>{opt.description}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Block Completion Dialog ----------

function CompletionDialog({
  block,
  existingEntry,
  timedMinutes,
  onSubmit,
  onClose,
}: {
  block: MindBlock;
  existingEntry?: MindLogEntry;
  timedMinutes?: number;
  onSubmit: (data: {
    status: BlockStatus;
    actualMinutes: number;
    rating: number;
    note: string;
    fundamentals: Fundamental[];
    stretchLevel: StretchLevel;
    masterReference: string;
    artefactUrl?: string;
  }) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<BlockStatus>(existingEntry?.status ?? "done");
  // Prefer the actual time the timer ran; fall back to an existing entry, then
  // the planned minutes.
  const [actualMinutes, setActualMinutes] = useState(
    existingEntry?.actualMinutes ?? (timedMinutes && timedMinutes > 0 ? timedMinutes : block.plannedMinutes),
  );
  const [rating, setRating] = useState(existingEntry?.rating ?? 3);
  const [note, setNote] = useState(existingEntry?.note ?? "");
  const [fundamentals, setFundamentals] = useState<Fundamental[]>(existingEntry?.fundamentals ?? []);
  const [stretchLevel, setStretchLevel] = useState<StretchLevel>(existingEntry?.stretchLevel ?? "stretch");
  const [masterReference, setMasterReference] = useState(existingEntry?.masterReference ?? "");
  const [artefactUrl, setArtefactUrl] = useState<string | undefined>(existingEntry?.artefactUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const hasFocusOptions = block.focusOptions && block.focusOptions.length > 0;
  const isMasterStudy = block.category === "master-study";

  async function handleArtefact(file: File | undefined) {
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    try {
      setArtefactUrl(await uploadArtefact(file, "sessions"));
    } catch {
      setUploadErr("Upload failed. Check your connection and try again. (If it persists, confirm migration 0002 ran.)");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-[hsl(var(--card))] rounded-t-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{block.title}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status selector */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Status</p>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  aria-pressed={status === opt.value}
                  className={`flex-1 flex min-h-[44px] items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === opt.value
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fundamentals */}
        {hasFocusOptions && (
          <div>
            <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
              What did you drill?
            </p>
            <FundamentalChips selected={fundamentals} onChange={setFundamentals} options={block.focusOptions} />
          </div>
        )}

        {/* Stretch level */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            How hard did you push?
          </p>
          <StretchSelector value={stretchLevel} onChange={setStretchLevel} />
        </div>

        {/* Master reference */}
        {isMasterStudy && (
          <div>
            <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
              Who did you study?
            </p>
            <input
              type="text"
              aria-label="Master reference"
              value={masterReference}
              onChange={(e) => setMasterReference(e.target.value)}
              placeholder="e.g. Caravaggio, Kehinde Wiley, Sam Spratt..."
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
            />
          </div>
        )}

        {/* Actual minutes */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Actual Minutes</p>
          <input
            type="number"
            aria-label="Actual minutes"
            value={actualMinutes}
            onChange={(e) => setActualMinutes(Number(e.target.value))}
            min={0}
            max={480}
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
          />
        </div>

        {/* Rating */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Session Quality</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">Notes</p>
          <textarea
            value={note}
            aria-label="Session note"
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What did you learn? What's still weak?"
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm resize-none"
          />
        </div>

        {/* Artefact photo */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            Artefact (optional)
          </p>
          <div className="flex items-center gap-3">
            {artefactUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artefactUrl} alt="Your session artefact" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
            )}
            <label className="text-xs font-semibold text-[hsl(var(--primary))] cursor-pointer active:opacity-70">
              {artefactUrl ? "Replace photo" : "Add photo"}
              <input
                type="file"
                accept="image/*"
                aria-label="Upload artefact photo"
                className="hidden"
                onChange={(e) => handleArtefact(e.target.files?.[0])}
              />
            </label>
          </div>
          {uploadErr && <p role="alert" className="text-[11px] text-[hsl(var(--destructive))] mt-1.5">{uploadErr}</p>}
        </div>

        {/* Submit */}
        <button
          onClick={() =>
            onSubmit({ status, actualMinutes, rating, note, fundamentals, stretchLevel, masterReference, artefactUrl })
          }
          className="w-full py-3 rounded-xl text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function MindPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [today] = useState(() => new Date());
  const dateKey = format(today, "yyyy-MM-dd");
  const dayOfWeek = format(today, "EEEE").toLowerCase() as DayOfWeek;

  // Hydration guard — avoid mismatch between build-time HTML and runtime JS
  useEffect(() => { setMounted(true); }, []);

  const [completingBlock, setCompletingBlock] = useState<MindBlock | null>(null);
  const [quickLogTarget, setQuickLogTarget] = useState<{ fundamental: Fundamental; category: MindCategory } | null>(null);

  // ---------- Queries ----------
  const { data: mindLog, isLoading } = useQuery({
    queryKey: ["mind-log", dateKey],
    queryFn: () => queries.getOrCreateMindLog(dateKey),
  });

  const { data: allMindLogs } = useQuery({
    queryKey: ["all-mind-logs"],
    queryFn: () => queries.getAllMindLogs(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: queries.getUserProfile,
  });

  const sprint = useMemo(
    () => getSprintProgress(userProfile?.sprint_start_date, dateKey),
    [userProfile?.sprint_start_date, dateKey]
  );

  // ---------- Today's schedule ----------
  const todayPlan = useMemo(() => {
    return MIND_SCHEDULE.find((p) => p.dayOfWeek === dayOfWeek);
  }, [dayOfWeek]);

  const activeBlocks = useMemo(() => {
    if (!todayPlan || !mindLog) return [];
    if (mindLog.minimum_win_mode) return MINIMUM_WIN_BLOCKS;
    // Filter monthly blocks: only show in the first week of the month
    const dayOfMonth = today.getDate();
    const isFirstWeek = dayOfMonth <= 7;
    return todayPlan.blocks.filter((b) => !b.monthlyOnly || isFirstWeek);
  }, [todayPlan, mindLog, today]);

  // ---------- Deep work hours ----------
  const deepWorkMinutes = useMemo(() => {
    if (!mindLog) return 0;
    return mindLog.entries
      .filter((e) => DEEP_WORK_CATEGORIES.includes(e.category) && (e.status === "done" || e.status === "partial"))
      .reduce((sum, e) => sum + e.actualMinutes, 0);
  }, [mindLog]);

  // ---------- Today's stretch count ----------
  const todayStretchCount = useMemo(() => {
    if (!mindLog) return { stretch: 0, breakthrough: 0, comfort: 0 };
    const entries = mindLog.entries.filter((e) => e.status === "done" || e.status === "partial");
    return {
      stretch: entries.filter((e) => e.stretchLevel === "stretch").length,
      breakthrough: entries.filter((e) => e.stretchLevel === "breakthrough").length,
      comfort: entries.filter((e) => e.stretchLevel === "comfort" || !e.stretchLevel).length,
    };
  }, [mindLog]);

  // ---------- Get entry for a block ----------
  const getEntryForBlock = useCallback(
    (blockId: string): MindLogEntry | undefined => mindLog?.entries.find((e) => e.blockId === blockId),
    [mindLog]
  );

  // ---------- Mutations ----------
  const addEntryMutation = useMutation<MindDailyLog, Error, {
    blockId: string; blockTitle: string; category: string; plannedMinutes: number;
  }>({
    mutationFn: (params) => queries.addMindEntry(dateKey, params),
    onSuccess: (data) => { queryClient.setQueryData(["mind-log", dateKey], data); },
  });

  const updateEntryMutation = useMutation<MindDailyLog, Error, {
    entryId: string; update: Partial<MindLogEntry>;
  }>({
    mutationFn: ({ entryId, update }) => queries.updateMindEntry(dateKey, entryId, update),
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
      queryClient.invalidateQueries({ queryKey: ["all-mind-logs"] });
    },
  });

  const startTimerMutation = useMutation<MindDailyLog, Error, string, { previous?: MindDailyLog }>({
    mutationFn: (blockId) => queries.startMindTimer(dateKey, blockId),
    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>(["mind-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], { ...previous, active_block_id: blockId, timer_started_at: new Date().toISOString() });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => { if (context?.previous) queryClient.setQueryData(["mind-log", dateKey], context.previous); },
    onSuccess: (data) => { queryClient.setQueryData(["mind-log", dateKey], data); },
  });

  const stopTimerMutation = useMutation<MindDailyLog, Error, void, { previous?: MindDailyLog }>({
    mutationFn: () => queries.stopMindTimer(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>(["mind-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], { ...previous, active_block_id: null, timer_started_at: null });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => { if (context?.previous) queryClient.setQueryData(["mind-log", dateKey], context.previous); },
    onSuccess: (data) => { queryClient.setQueryData(["mind-log", dateKey], data); },
  });

  const toggleMinWinMutation = useMutation<MindDailyLog, Error, void, { previous?: MindDailyLog }>({
    mutationFn: () => queries.toggleMinimumWinMode(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>(["mind-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], { ...previous, minimum_win_mode: !previous.minimum_win_mode });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => { if (context?.previous) queryClient.setQueryData(["mind-log", dateKey], context.previous); },
    onSuccess: (data) => { queryClient.setQueryData(["mind-log", dateKey], data); },
  });

  // ---------- Completion handler ----------
  const handleCompletion = useCallback(
    (block: MindBlock, data: {
      status: BlockStatus; actualMinutes: number; rating: number; note: string;
      fundamentals: Fundamental[]; stretchLevel: StretchLevel; masterReference: string; artefactUrl?: string;
    }) => {
      const existingEntry = getEntryForBlock(block.id);
      const updatePayload: Partial<MindLogEntry> = {
        status: data.status,
        actualMinutes: data.actualMinutes,
        rating: data.rating,
        note: data.note,
        fundamentals: data.fundamentals,
        stretchLevel: data.stretchLevel,
        masterReference: data.masterReference || undefined,
        artefactUrl: data.artefactUrl,
        completedAt: new Date().toISOString(),
      };

      if (existingEntry) {
        updateEntryMutation.mutate({ entryId: existingEntry.id, update: updatePayload });
      } else {
        addEntryMutation.mutate(
          { blockId: block.id, blockTitle: block.title, category: block.category, plannedMinutes: block.plannedMinutes },
          {
            onSuccess: (log) => {
              const newEntry = log.entries.find((e) => e.blockId === block.id);
              if (newEntry) {
                updateEntryMutation.mutate({ entryId: newEntry.id, update: updatePayload });
              }
            },
          }
        );
      }
      setCompletingBlock(null);
    },
    [getEntryForBlock, updateEntryMutation, addEntryMutation]
  );

  // ---------- Quick fundamental log handler ----------
  const handleQuickFundamentalLog = useCallback(
    (fundamental: Fundamental, category: MindCategory, data: { minutes: number; stretchLevel: StretchLevel; note: string }) => {
      // Unique per submission — logging the same fundamental twice in a day must
      // create a distinct entry, not collide with (and update) the earlier one.
      const blockId = `quick-${fundamental}-${dateKey}-${crypto.randomUUID().slice(0, 8)}`;
      const blockTitle = `${FUNDAMENTAL_LABELS[fundamental]} Practice`;

      addEntryMutation.mutate(
        { blockId, blockTitle, category, plannedMinutes: data.minutes },
        {
          onSuccess: (log) => {
            const newEntry = log.entries.find((e) => e.blockId === blockId);
            if (newEntry) {
              updateEntryMutation.mutate({
                entryId: newEntry.id,
                update: {
                  status: "done",
                  actualMinutes: data.minutes,
                  fundamentals: [fundamental],
                  stretchLevel: data.stretchLevel,
                  note: data.note || undefined,
                  completedAt: new Date().toISOString(),
                },
              });
            }
          },
        }
      );
      setQuickLogTarget(null);
    },
    [dateKey, addEntryMutation, updateEntryMutation]
  );

  // ---------- Timer handlers ----------
  const handleStartTimer = useCallback(
    (block: MindBlock) => {
      const existingEntry = getEntryForBlock(block.id);
      if (!existingEntry) {
        addEntryMutation.mutate(
          { blockId: block.id, blockTitle: block.title, category: block.category, plannedMinutes: block.plannedMinutes },
          { onSuccess: () => { startTimerMutation.mutate(block.id); } }
        );
      } else {
        startTimerMutation.mutate(block.id);
      }
    },
    [getEntryForBlock, addEntryMutation, startTimerMutation]
  );

  const handleStopTimer = useCallback(() => { stopTimerMutation.mutate(); }, [stopTimerMutation]);

  // ---------- Loading ----------
  if (!mounted || isLoading || !mindLog) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {format(today, "EEEE")} &middot; Mastery Training
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">{(deepWorkMinutes / 60).toFixed(1)}h</p>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Deep Work</p>
          {allMindLogs && <StreakBadge allLogs={allMindLogs} />}
        </div>
      </div>

      {/* ---------- Target Today (neglect nudge) ---------- */}
      {allMindLogs && <NeglectNudge allLogs={allMindLogs} today={dateKey} />}

      {/* ---------- Today's Push Level ---------- */}
      {(todayStretchCount.stretch > 0 || todayStretchCount.breakthrough > 0) && (
        <div className="flex gap-2">
          {todayStretchCount.breakthrough > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--chart-3))/0.15]">
              <Sparkles className="w-3 h-3 text-[hsl(var(--chart-3))]" />
              <span className="text-xs font-bold text-[hsl(var(--chart-3))]">{todayStretchCount.breakthrough} breakthrough</span>
            </div>
          )}
          {todayStretchCount.stretch > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--chart-4))/0.15]">
              <Target className="w-3 h-3 text-[hsl(var(--chart-4))]" />
              <span className="text-xs font-bold text-[hsl(var(--chart-4))]">{todayStretchCount.stretch} stretch</span>
            </div>
          )}
        </div>
      )}

      {/* ---------- Minimum Win Toggle ---------- */}
      <section className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-[hsl(var(--chart-4))]" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Minimum Win Mode</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">3 blocks for tough days</p>
          </div>
        </div>
        <button onClick={() => toggleMinWinMutation.mutate()} role="switch" aria-checked={mindLog.minimum_win_mode} aria-label="Minimum win mode" className="flex h-11 w-11 items-center justify-center">
          {mindLog.minimum_win_mode ? (
            <ToggleRight className="w-8 h-8 text-[hsl(var(--primary))]" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          )}
        </button>
      </section>

      {/* ---------- Active Timer ---------- */}
      {mindLog.active_block_id && mindLog.timer_started_at && (
        <section className="glass-card p-5 border-2 border-[hsl(var(--primary))/0.3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--destructive))] animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Timer Running</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {activeBlocks.find((b) => b.id === mindLog.active_block_id)?.title ?? "Block"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TimerDisplay startedAt={mindLog.timer_started_at} />
              <button onClick={handleStopTimer} aria-label="Stop timer" className="flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors">
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Blocks ---------- */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">
          {mindLog.minimum_win_mode ? "Minimum Win Blocks" : "Today's Blocks"}
        </h3>

        {activeBlocks.map((block) => {
          const entry = getEntryForBlock(block.id);
          const isActive = mindLog.active_block_id === block.id;
          const isCompleted = entry?.status === "done" || entry?.status === "partial";

          return (
            <div
              key={block.id}
              className={`glass-card p-4 transition-all ${isActive ? "ring-2 ring-[hsl(var(--primary))/0.4]" : ""} ${isCompleted ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(block.category) }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isCompleted ? "line-through text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]"}`}>
                      {block.title}
                    </p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-[hsl(var(--foreground))]"
                      style={{ backgroundColor: `${getCategoryColor(block.category)}26` }}
                    >
                      {block.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{block.plannedMinutes} min</span>
                    {entry?.status && (
                      <span className={`text-[10px] font-semibold uppercase ${
                        entry.status === "done" ? "text-[hsl(var(--chart-3))]" :
                        entry.status === "partial" ? "text-[hsl(var(--chart-4))]" :
                        entry.status === "skipped" ? "text-[hsl(var(--destructive))]" :
                        "text-[hsl(var(--muted-foreground))]"
                      }`}>
                        {entry.status}{entry.actualMinutes > 0 && ` (${entry.actualMinutes}m)`}
                      </span>
                    )}
                    {entry?.stretchLevel && entry.stretchLevel !== "comfort" && (
                      <span className={`text-[10px] font-bold uppercase ${
                        entry.stretchLevel === "breakthrough" ? "text-[hsl(var(--chart-3))]" : "text-[hsl(var(--chart-4))]"
                      }`}>
                        {entry.stretchLevel}
                      </span>
                    )}
                    {entry?.rating && (
                      <div className="flex">
                        {[...Array(entry.rating)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]" />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Fundamentals tags */}
                  {entry?.fundamentals && entry.fundamentals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.fundamentals.map((f) => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))] font-medium">
                          {FUNDAMENTAL_LABELS[f]}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry?.masterReference && (
                    <p className="text-[10px] text-[hsl(var(--chart-4))] mt-1 italic">Studied: {entry.masterReference}</p>
                  )}
                  {entry?.artefactUrl && (
                    <a href={entry.artefactUrl} target="_blank" rel="noreferrer" className="inline-block mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.artefactUrl} alt="artefact" className="w-14 h-14 rounded-lg object-cover" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isActive && !isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleStartTimer(block); }}
                      aria-label={`Start ${block.title}`}
                      disabled={!!mindLog.active_block_id && mindLog.active_block_id !== block.id}
                      className="w-[48px] h-[48px] flex items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-colors disabled:opacity-40 cursor-pointer touch-manipulation"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleStopTimer(); }}
                      aria-label="Stop timer"
                      className="w-[48px] h-[48px] flex items-center justify-center rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors cursor-pointer touch-manipulation"
                    >
                      <Square className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCompletingBlock(block); }}
                    aria-label={`Complete ${block.title}`}
                    className={`w-[48px] h-[48px] flex items-center justify-center rounded-lg transition-colors cursor-pointer touch-manipulation ${
                      isCompleted
                        ? "bg-[hsl(var(--chart-3))/0.15] text-[hsl(var(--chart-3))]"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {block.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 ml-5 leading-relaxed">{block.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Fundamentals Coverage ---------- */}
      {allMindLogs && (
        <FundamentalsCoverage
          allLogs={allMindLogs}
          onLogFundamental={(fundamental, category) => setQuickLogTarget({ fundamental, category })}
        />
      )}

      {/* ---------- Benchmarks (Day 0/45/90) ---------- */}
      <BenchmarksCard sprintDay={sprint.dayRaw} today={dateKey} sprintActive={sprint.active} />

      {/* ---------- Artefact Diary ---------- */}
      {allMindLogs && <ArtefactDiary allLogs={allMindLogs} />}

      {/* ---------- Completion Dialog ---------- */}
      {completingBlock && (
        <CompletionDialog
          block={completingBlock}
          existingEntry={getEntryForBlock(completingBlock.id)}
          timedMinutes={
            mindLog.active_block_id === completingBlock.id && mindLog.timer_started_at
              ? Math.max(1, Math.round((Date.now() - new Date(mindLog.timer_started_at).getTime()) / 60000))
              : undefined
          }
          onSubmit={(data) => handleCompletion(completingBlock, data)}
          onClose={() => setCompletingBlock(null)}
        />
      )}

      {/* ---------- Quick Fundamental Log ---------- */}
      {quickLogTarget && (
        <QuickFundamentalLog
          fundamental={quickLogTarget.fundamental}
          category={quickLogTarget.category}
          onSubmit={(data) => handleQuickFundamentalLog(quickLogTarget.fundamental, quickLogTarget.category, data)}
          onClose={() => setQuickLogTarget(null)}
        />
      )}
    </div>
  );
}
