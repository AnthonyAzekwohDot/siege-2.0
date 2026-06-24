"use client";

import { format, parseISO } from "date-fns";
import { Images } from "lucide-react";
import type { MindDailyLog } from "@/lib/types";

/** A photographed-artefact-per-session diary: the most recent session photos as
 *  a thumbnail wall, newest first. Renders nothing until there are artefacts. */
export function ArtefactDiary({ allLogs }: { allLogs: MindDailyLog[] }) {
  const items: { url: string; date: string; title: string }[] = [];
  for (const log of allLogs) {
    for (const e of log.entries) {
      if (e.artefactUrl) items.push({ url: e.artefactUrl, date: log.date, title: e.blockTitle });
    }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = items.slice(0, 12);
  if (recent.length === 0) return null;

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Images className="w-4 h-4 text-[hsl(var(--primary))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Artefact Diary
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {recent.map((it, i) => (
          <a
            key={i}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            className="block aspect-square rounded-lg overflow-hidden bg-[hsl(var(--muted))] relative group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/45 text-white text-[9px] px-1.5 py-0.5 truncate">
              {format(parseISO(it.date), "MMM d")}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
