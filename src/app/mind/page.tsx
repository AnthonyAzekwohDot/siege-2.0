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
        <button key={star} onClick={() => onChange(star)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

function FundamentalsCoverage({ allLogs }: { allLogs: MindDailyLog[] }) {
  const coverage = useMemo(() => {
    const counts: Record<Fundamental, number> = {} as Record<Fundamental, number>;
    const lastPracticed: Record<Fundamental, string> = {} as Record<Fundamental, string>;

    for (const f of FUNDAMENTALS) {
      counts[f] = 0;
      lastPracticed[f] = "";
    }

    // Count sessions per fundamental across last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = format(cutoff, "yyyy-MM-dd");

    for (const log of allLogs) {
      if (log.date < cutoffStr) continue;
      for (const entry of log.entries) {
        if (entry.fundamentals) {
          for (const f of entry.fundamentals) {
            counts[f] = (counts[f] || 0) + 1;
            if (!lastPracticed[f] || log.date > lastPracticed[f]) {
              lastPracticed[f] = log.date;
            }
          }
        }
      }
    }

    const maxCount = Math.max(...Object.values(counts), 1);

    return FUNDAMENTALS.map((f) => ({
      fundamental: f,
      label: FUNDAMENTAL_LABELS[f],
      count: counts[f],
      intensity: counts[f] / maxCount,
      lastPracticed: lastPracticed[f],
      daysSince: lastPracticed[f]
        ? Math.floor((Date.now() - new Date(lastPracticed[f] + "T12:00:00").getTime()) / 86400000)
        : 999,
    })).sort((a, b) => a.daysSince - b.daysSince);
  }, [allLogs]);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Fundamentals (30 days)
        </h3>
      </div>
      {/* Drawing Skills */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--chart-1))] mt-1 mb-1">Drawing Skills</p>
      <div className="space-y-0.5 mb-3">
        {coverage.filter((c) => DRAWING_FUNDAMENTALS.includes(c.fundamental)).map(({ fundamental, label, count, intensity, daysSince }) => (
          <div key={fundamental} className="flex items-center gap-2 py-1">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: count > 0 ? `hsl(var(--chart-1) / ${0.2 + intensity * 0.8})` : "hsl(var(--muted))" }} />
            <span className="text-xs text-[hsl(var(--foreground))] flex-1">{label}</span>
            <span className={`text-[10px] font-medium ${daysSince > 7 ? "text-[hsl(var(--destructive))]" : daysSince > 3 ? "text-[hsl(var(--chart-4))]" : "text-[hsl(var(--muted-foreground))]"}`}>
              {count === 0 ? "never" : daysSince === 0 ? "today" : `${daysSince}d ago`}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-6 text-right">{count}x</span>
          </div>
        ))}
      </div>

      {/* Painting Skills */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--chart-2))] mb-1">Painting Skills</p>
      <div className="space-y-0.5">
        {coverage.filter((c) => PAINTING_FUNDAMENTALS.includes(c.fundamental)).map(({ fundamental, label, count, intensity, daysSince }) => (
          <div key={fundamental} className="flex items-center gap-2 py-1">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: count > 0 ? `hsl(var(--chart-2) / ${0.2 + intensity * 0.8})` : "hsl(var(--muted))" }} />
            <span className="text-xs text-[hsl(var(--foreground))] flex-1">{label}</span>
            <span className={`text-[10px] font-medium ${daysSince > 7 ? "text-[hsl(var(--destructive))]" : daysSince > 3 ? "text-[hsl(var(--chart-4))]" : "text-[hsl(var(--muted-foreground))]"}`}>
              {count === 0 ? "never" : daysSince === 0 ? "today" : `${daysSince}d ago`}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-6 text-right">{count}x</span>
          </div>
        ))}
      </div>
    </section>
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
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
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
          <span className="text-[10px] ml-2 opacity-80">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Block Completion Dialog ----------

function CompletionDialog({
  block,
  existingEntry,
  onSubmit,
  onClose,
}: {
  block: MindBlock;
  existingEntry?: MindLogEntry;
  onSubmit: (data: {
    status: BlockStatus;
    actualMinutes: number;
    rating: number;
    note: string;
    fundamentals: Fundamental[];
    stretchLevel: StretchLevel;
    masterReference: string;
  }) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<BlockStatus>(existingEntry?.status ?? "done");
  const [actualMinutes, setActualMinutes] = useState(existingEntry?.actualMinutes ?? block.plannedMinutes);
  const [rating, setRating] = useState(existingEntry?.rating ?? 3);
  const [note, setNote] = useState(existingEntry?.note ?? "");
  const [fundamentals, setFundamentals] = useState<Fundamental[]>(existingEntry?.fundamentals ?? []);
  const [stretchLevel, setStretchLevel] = useState<StretchLevel>(existingEntry?.stretchLevel ?? "stretch");
  const [masterReference, setMasterReference] = useState(existingEntry?.masterReference ?? "");

  const hasFocusOptions = block.focusOptions && block.focusOptions.length > 0;
  const isMasterStudy = block.category === "master-study";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-[hsl(var(--card))] rounded-t-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{block.title}</h3>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What did you learn? What's still weak?"
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={() => onSubmit({ status, actualMinutes, rating, note, fundamentals, stretchLevel, masterReference })}
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
  const [today] = useState(() => new Date());
  const dateKey = format(today, "yyyy-MM-dd");
  const dayOfWeek = format(today, "EEEE").toLowerCase() as DayOfWeek;

  const [completingBlock, setCompletingBlock] = useState<MindBlock | null>(null);

  // ---------- Queries ----------
  const { data: mindLog, isLoading } = useQuery({
    queryKey: ["mind-log", dateKey],
    queryFn: () => queries.getOrCreateMindLog(dateKey),
  });

  const { data: allMindLogs } = useQuery({
    queryKey: ["all-mind-logs"],
    queryFn: () => queries.getAllMindLogs(),
  });

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
      fundamentals: Fundamental[]; stretchLevel: StretchLevel; masterReference: string;
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
  if (isLoading || !mindLog) {
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
        <button onClick={() => toggleMinWinMutation.mutate()} className="p-1">
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
              <button onClick={handleStopTimer} className="p-2 rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors">
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
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${getCategoryColor(block.category)}20`, color: getCategoryColor(block.category) }}
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
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {!isActive && !isCompleted && (
                    <button
                      onClick={() => handleStartTimer(block)}
                      disabled={!!mindLog.active_block_id && mindLog.active_block_id !== block.id}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {isActive && (
                    <button onClick={handleStopTimer} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors">
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCompletingBlock(block)}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                      isCompleted
                        ? "bg-[hsl(var(--chart-3))/0.15] text-[hsl(var(--chart-3))]"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
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
      {allMindLogs && allMindLogs.length > 0 && (
        <FundamentalsCoverage allLogs={allMindLogs} />
      )}

      {/* ---------- Completion Dialog ---------- */}
      {completingBlock && (
        <CompletionDialog
          block={completingBlock}
          existingEntry={getEntryForBlock(completingBlock.id)}
          onSubmit={(data) => handleCompletion(completingBlock, data)}
          onClose={() => setCompletingBlock(null)}
        />
      )}
    </div>
  );
}
