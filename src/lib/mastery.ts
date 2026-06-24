import { differenceInCalendarDays, parseISO } from "date-fns";
import { FUNDAMENTALS, FUNDAMENTAL_LABELS } from "@/lib/types";
import type { Fundamental, MindDailyLog } from "@/lib/types";

// ============ THE CRAFT HALF — neglect tracking + spaced repetition ============
// Fundamentals get drilled unevenly. This surfaces the ones going stale so the
// weakest skill is the one trained next, not the most comfortable one.

export interface FundamentalStat {
  fundamental: Fundamental;
  label: string;
  /** Sessions that touched this fundamental in the window. */
  count: number;
  /** Last date it was practised (yyyy-MM-dd), or null. */
  lastPracticed: string | null;
  /** Days since it was last practised; null = never. */
  daysSince: number | null;
}

export function fundamentalStats(minds: MindDailyLog[], today: string): FundamentalStat[] {
  const last: Record<string, string> = {};
  const count: Record<string, number> = {};

  for (const m of minds) {
    for (const e of m.entries) {
      for (const f of e.fundamentals ?? []) {
        count[f] = (count[f] ?? 0) + 1;
        if (!last[f] || m.date > last[f]) last[f] = m.date;
      }
    }
  }

  return FUNDAMENTALS.map((f) => {
    const lp = last[f] ?? null;
    const daysSince = lp ? differenceInCalendarDays(parseISO(today), parseISO(lp)) : null;
    return {
      fundamental: f,
      label: FUNDAMENTAL_LABELS[f],
      count: count[f] ?? 0,
      lastPracticed: lp,
      daysSince,
    };
  });
}

/** Most neglected first: never-practised, then longest-since, then least-drilled. */
export function neglectedFundamentals(stats: FundamentalStat[], limit = 3): FundamentalStat[] {
  return [...stats]
    .sort((a, b) => {
      const an = a.daysSince == null ? Infinity : a.daysSince;
      const bn = b.daysSince == null ? Infinity : b.daysSince;
      if (an !== bn) return bn - an; // longer-since (or never) first
      return a.count - b.count; // tie-break: fewer sessions first
    })
    .slice(0, limit);
}

/** Today's spaced-repetition target = the single most neglected fundamental. */
export function todaysTarget(stats: FundamentalStat[]): FundamentalStat | null {
  return neglectedFundamentals(stats, 1)[0] ?? null;
}

// ============ DAY-0 / 45 / 90 BENCHMARKS ============
// A fixed set of skills captured at three checkpoints. Same prompts each time,
// so 90 days of growth is visible side by side instead of merely felt.

export interface BenchmarkPrompt {
  id: string;
  label: string;
  hint: string;
}

export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  { id: "self-portrait", label: "Self-portrait from memory", hint: "No reference. Likeness, proportion, construction." },
  { id: "hand", label: "Hand study", hint: "The hardest form. Construct it, don't copy it." },
  { id: "figure", label: "Full figure, gesture to form", hint: "Movement first, then mass." },
  { id: "master-copy", label: "Master copy (same plate)", hint: "Pick one master plate and redo it at each checkpoint." },
  { id: "colour-study", label: "Colour study from life", hint: "Same setup and palette every time." },
];

export const BENCHMARK_CHECKPOINTS = [0, 45, 90] as const;
export type BenchmarkCheckpoint = (typeof BENCHMARK_CHECKPOINTS)[number];

export const BENCHMARK_LABELS: Record<BenchmarkCheckpoint, string> = {
  0: "Day 0",
  45: "Day 45",
  90: "Day 90",
};

/** Which checkpoint the current sprint day is in range to capture (±7 days),
 *  or null when between windows. Day 0 opens for the whole first week. */
export function dueCheckpoint(sprintDay: number): BenchmarkCheckpoint | null {
  if (sprintDay >= 1 && sprintDay <= 7) return 0;
  if (sprintDay >= 38 && sprintDay <= 52) return 45;
  if (sprintDay >= 83) return 90;
  return null;
}
