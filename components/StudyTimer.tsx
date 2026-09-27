"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatDuration } from "@/lib/utils";

interface StudyTimerProps {
  startedAt: string;
  durationMinutes: number;
}

export default function StudyTimer({
  startedAt,
  durationMinutes,
}: StudyTimerProps) {
  const endTime = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60_000,
    [startedAt, durationMinutes]
  );

  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((endTime - Date.now()) / 1000))
  );

  useEffect(() => {
    setRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const total = durationMinutes * 60;
  const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 0;
  const done = remaining === 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {done ? "Time's up" : "Time remaining"}
        </span>
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            done ? "text-rose-600" : "text-slate-900"
          )}
        >
          {formatDuration(remaining)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done ? "bg-rose-500" : "bg-brand-600"
          )}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}