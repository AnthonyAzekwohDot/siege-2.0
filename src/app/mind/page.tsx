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
  DayOfWeek,
} from "@/lib/types";
import {
  Play,
  Square,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Brain,
  Flame,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ============================================================
// Mind — Creative training tracker
// ============================================================

const STATUS_OPTIONS: { value: BlockStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "done", label: "Done", icon: CheckCircle2 },
  { value: "partial", label: "Partial", icon: AlertCircle },
  { value: "skipped", label: "Skipped", icon: XCircle },
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

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= value
                ? "fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]"
                : "text-[hsl(var(--muted-foreground))]"
            }`}
          />
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
  }) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<BlockStatus>(
    existingEntry?.status ?? "done"
  );
  const [actualMinutes, setActualMinutes] = useState(
    existingEntry?.actualMinutes ?? block.plannedMinutes
  );
  const [rating, setRating] = useState(existingEntry?.rating ?? 3);
  const [note, setNote] = useState(existingEntry?.note ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-[hsl(var(--card))] rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
            {block.title}
          </h3>
          <button
            onClick={onClose}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status selector */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            Status
          </p>
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

        {/* Actual minutes */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            Actual Minutes
          </p>
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
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            Rating
          </p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2">
            Notes
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={() => onSubmit({ status, actualMinutes, rating, note })}
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
  const today = new Date();
  const dateKey = format(today, "yyyy-MM-dd");
  const dayOfWeek = format(today, "EEEE").toLowerCase() as DayOfWeek;

  const [completingBlock, setCompletingBlock] = useState<MindBlock | null>(null);

  // ---------- Queries ----------
  const { data: mindLog, isLoading } = useQuery({
    queryKey: ["mind-log", dateKey],
    queryFn: () => queries.getOrCreateMindLog(dateKey),
  });

  // ---------- Today's schedule ----------
  const todayPlan = useMemo(() => {
    return MIND_SCHEDULE.find((p) => p.dayOfWeek === dayOfWeek);
  }, [dayOfWeek]);

  const activeBlocks = useMemo(() => {
    if (!todayPlan || !mindLog) return [];
    if (mindLog.minimum_win_mode) return MINIMUM_WIN_BLOCKS;
    return todayPlan.blocks;
  }, [todayPlan, mindLog]);

  // ---------- Deep work hours ----------
  const deepWorkMinutes = useMemo(() => {
    if (!mindLog) return 0;
    return mindLog.entries
      .filter(
        (e) =>
          DEEP_WORK_CATEGORIES.includes(e.category) &&
          (e.status === "done" || e.status === "partial")
      )
      .reduce((sum, e) => sum + e.actualMinutes, 0);
  }, [mindLog]);

  // ---------- Get entry for a block ----------
  const getEntryForBlock = useCallback(
    (blockId: string): MindLogEntry | undefined => {
      return mindLog?.entries.find((e) => e.blockId === blockId);
    },
    [mindLog]
  );

  // ---------- Mutations ----------
  const addEntryMutation = useMutation<MindDailyLog, Error, {
    blockId: string;
    blockTitle: string;
    category: string;
    plannedMinutes: number;
  }>({
    mutationFn: (params) => queries.addMindEntry(dateKey, params),
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
    },
  });

  const updateEntryMutation = useMutation<MindDailyLog, Error, {
    entryId: string;
    update: Partial<MindLogEntry>;
  }>({
    mutationFn: ({ entryId, update }) => queries.updateMindEntry(dateKey, entryId, update),
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
    },
  });

  const startTimerMutation = useMutation<MindDailyLog, Error, string, { previous?: MindDailyLog }>({
    mutationFn: (blockId) => queries.startMindTimer(dateKey, blockId),
    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>([
        "mind-log",
        dateKey,
      ]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], {
          ...previous,
          active_block_id: blockId,
          timer_started_at: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["mind-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
    },
  });

  const stopTimerMutation = useMutation<MindDailyLog, Error, void, { previous?: MindDailyLog }>({
    mutationFn: () => queries.stopMindTimer(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>([
        "mind-log",
        dateKey,
      ]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], {
          ...previous,
          active_block_id: null,
          timer_started_at: null,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["mind-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
    },
  });

  const toggleMinWinMutation = useMutation<MindDailyLog, Error, void, { previous?: MindDailyLog }>({
    mutationFn: () => queries.toggleMinimumWinMode(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mind-log", dateKey] });
      const previous = queryClient.getQueryData<MindDailyLog>([
        "mind-log",
        dateKey,
      ]);
      if (previous) {
        queryClient.setQueryData(["mind-log", dateKey], {
          ...previous,
          minimum_win_mode: !previous.minimum_win_mode,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["mind-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["mind-log", dateKey], data);
    },
  });

  // ---------- Completion handler ----------
  const handleCompletion = useCallback(
    (
      block: MindBlock,
      data: {
        status: BlockStatus;
        actualMinutes: number;
        rating: number;
        note: string;
      }
    ) => {
      const existingEntry = getEntryForBlock(block.id);

      if (existingEntry) {
        updateEntryMutation.mutate({
          entryId: existingEntry.id,
          update: {
            status: data.status,
            actualMinutes: data.actualMinutes,
            rating: data.rating,
            note: data.note,
            completedAt: new Date().toISOString(),
          },
        });
      } else {
        addEntryMutation.mutate(
          {
            blockId: block.id,
            blockTitle: block.title,
            category: block.category,
            plannedMinutes: block.plannedMinutes,
          },
          {
            onSuccess: (log) => {
              const newEntry = log.entries.find((e) => e.blockId === block.id);
              if (newEntry) {
                updateEntryMutation.mutate({
                  entryId: newEntry.id,
                  update: {
                    status: data.status,
                    actualMinutes: data.actualMinutes,
                    rating: data.rating,
                    note: data.note,
                    completedAt: new Date().toISOString(),
                  },
                });
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
          {
            blockId: block.id,
            blockTitle: block.title,
            category: block.category,
            plannedMinutes: block.plannedMinutes,
          },
          {
            onSuccess: () => {
              startTimerMutation.mutate(block.id);
            },
          }
        );
      } else {
        startTimerMutation.mutate(block.id);
      }
    },
    [getEntryForBlock, addEntryMutation, startTimerMutation]
  );

  const handleStopTimer = useCallback(() => {
    stopTimerMutation.mutate();
  }, [stopTimerMutation]);

  // ---------- Loading ----------
  if (isLoading || !mindLog) {
    return (
      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-24 animate-pulse" />
        ))}
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            Mind
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {format(today, "EEEE")} &middot; Creative Training
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[hsl(var(--primary))]">
            {(deepWorkMinutes / 60).toFixed(1)}h
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Deep Work
          </p>
        </div>
      </div>

      {/* ---------- Minimum Win Toggle ---------- */}
      <section className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-[hsl(var(--chart-4))]" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Minimum Win Mode
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Simplified 3-block schedule for tough days
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleMinWinMutation.mutate()}
          className="p-1"
        >
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
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Timer Running
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {activeBlocks.find((b) => b.id === mindLog.active_block_id)
                    ?.title ?? "Block"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TimerDisplay startedAt={mindLog.timer_started_at} />
              <button
                onClick={handleStopTimer}
                className="p-2 rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors"
              >
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
          const isCompleted =
            entry?.status === "done" || entry?.status === "partial";

          return (
            <div
              key={block.id}
              className={`glass-card p-4 transition-all ${
                isActive ? "ring-2 ring-[hsl(var(--primary))/0.4]" : ""
              } ${isCompleted ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Category badge */}
                <div
                  className="w-1.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(block.category) }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? "line-through text-[hsl(var(--muted-foreground))]"
                          : "text-[hsl(var(--foreground))]"
                      }`}
                    >
                      {block.title}
                    </p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(block.category)}20`,
                        color: getCategoryColor(block.category),
                      }}
                    >
                      {block.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {block.plannedMinutes} min planned
                    </span>
                    {entry?.status && (
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          entry.status === "done"
                            ? "text-[hsl(var(--chart-3))]"
                            : entry.status === "partial"
                            ? "text-[hsl(var(--chart-4))]"
                            : entry.status === "skipped"
                            ? "text-[hsl(var(--destructive))]"
                            : "text-[hsl(var(--muted-foreground))]"
                        }`}
                      >
                        {entry.status}
                        {entry.actualMinutes > 0 &&
                          ` (${entry.actualMinutes}m)`}
                      </span>
                    )}
                    {entry?.rating && (
                      <div className="flex">
                        {[...Array(entry.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5 fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Timer button */}
                  {!isActive && !isCompleted && (
                    <button
                      onClick={() => handleStartTimer(block)}
                      disabled={
                        !!mindLog.active_block_id &&
                        mindLog.active_block_id !== block.id
                      }
                      className="p-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={handleStopTimer}
                      className="p-2 rounded-lg bg-[hsl(var(--destructive))] text-white hover:opacity-90 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Complete button */}
                  <button
                    onClick={() => setCompletingBlock(block)}
                    className={`p-2 rounded-lg transition-colors ${
                      isCompleted
                        ? "bg-[hsl(var(--chart-3))/0.15] text-[hsl(var(--chart-3))]"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {block.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 ml-5 leading-relaxed">
                  {block.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Completion Dialog ---------- */}
      {completingBlock && (
        <CompletionDialog
          block={completingBlock}
          existingEntry={getEntryForBlock(completingBlock.id)}
          onSubmit={(data) => handleCompletion(completingBlock, data)}
          onClose={() => setCompletingBlock(null)}
        />
      )}
    </main>
  );
}
