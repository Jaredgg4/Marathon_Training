"use client";

import { useMemo } from "react";
import {
  Phase,
  StravaActivity,
  ManualRun,
  toMi,
  fmtPace,
} from "../data/plan";

type Props = {
  phases: Phase[];
  planStartDate: Date;
  currentWeek: number;
  totalWeeks: number;
  acts: StravaActivity[];
  manual: ManualRun[];
};

type WeeklyStat = {
  weekN: number;
  date: string;
  plannedMi: number;
  actualMi: number;
};

function isRun(a: StravaActivity): boolean {
  return a.type === "Run" || a.sport_type === "Run";
}

function fmtMi(n: number): string {
  return n.toFixed(n >= 100 ? 0 : 1);
}

export default function ProgressTab({
  phases,
  planStartDate,
  currentWeek,
  totalWeeks,
  acts,
  manual,
}: Props) {
  const stats = useMemo(() => {
    const allWeeks = phases.flatMap((p) => p.weeks);
    const planMs = planStartDate.getTime();
    const weekly: WeeklyStat[] = allWeeks.map((w) => ({
      weekN: w.n,
      date: w.date,
      plannedMi: w.mi,
      actualMi: 0,
    }));
    const stravaRuns = acts.filter(isRun);

    function bucket(dateMs: number, miles: number) {
      const diffDays = (dateMs - planMs) / 86_400_000;
      if (diffDays < 0) return;
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex < 0 || weekIndex >= weekly.length) return;
      weekly[weekIndex].actualMi += miles;
    }

    for (const a of stravaRuns) {
      const t = new Date(a.start_date_local).getTime();
      bucket(t, toMi(a.distance || 0));
    }
    for (const m of manual) {
      const t = new Date(`${m.date}T12:00:00`).getTime();
      bucket(t, m.dist);
    }

    const upToNow = weekly.filter((w) => w.weekN <= currentWeek);
    const totalPlannedToDate = upToNow.reduce((s, w) => s + w.plannedMi, 0);
    const totalActualToDate = upToNow.reduce((s, w) => s + w.actualMi, 0);
    const adherence = totalPlannedToDate > 0
      ? Math.round((totalActualToDate / totalPlannedToDate) * 100)
      : 0;

    const totalRuns = stravaRuns.length + manual.length;
    const longestRun = Math.max(
      0,
      ...stravaRuns.map((a) => toMi(a.distance || 0)),
      ...manual.map((m) => m.dist),
    );
    const totalActualAllTime = stravaRuns.reduce((s, a) => s + toMi(a.distance || 0), 0)
      + manual.reduce((s, m) => s + m.dist, 0);

    const speeds = stravaRuns.map((a) => a.average_speed).filter((v): v is number => typeof v === 'number' && v > 0);
    const avgSpeedMps = speeds.length ? speeds.reduce((s, v) => s + v, 0) / speeds.length : 0;

    const weeksDone = upToNow.filter((w) => w.actualMi > 0).length;

    const peakWeekActual = weekly.reduce((max, w) => (w.actualMi > max ? w.actualMi : max), 0);
    const peakWeekPlanned = weekly.reduce((max, w) => (w.plannedMi > max ? w.plannedMi : max), 0);

    return {
      weekly,
      totalPlannedToDate,
      totalActualToDate,
      adherence,
      totalRuns,
      longestRun,
      totalActualAllTime,
      avgSpeedMps,
      weeksDone,
      peakWeekActual,
      peakWeekPlanned,
    };
  }, [phases, planStartDate, currentWeek, acts, manual]);

  const currentWeekData = stats.weekly.find((w) => w.weekN === currentWeek);
  const phaseFor = (n: number) => phases.find((p) => p.weeks.some((w) => w.n === n));

  return (
    <div className="animate-in fade-in duration-200 space-y-6">
      <div>
        <h2 className="text-3xl font-black mb-1">PROGRESS</h2>
        <p className="text-sm text-gray-500">
          Week {currentWeek} of {totalWeeks} · {stats.totalRuns} runs logged
        </p>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            lb: "MILES (TO DATE)",
            v: fmtMi(stats.totalActualToDate),
            sub: `vs ${fmtMi(stats.totalPlannedToDate)} planned`,
            c: "text-[#B6FF3C]",
          },
          {
            lb: "PLAN ADHERENCE",
            v: `${stats.adherence}%`,
            sub: stats.adherence >= 90 ? "On track" : stats.adherence >= 70 ? "Mostly on" : "Behind",
            c: stats.adherence >= 90 ? "text-[#4ade80]" : stats.adherence >= 70 ? "text-[#facc15]" : "text-[#f97316]",
          },
          {
            lb: "LONGEST RUN",
            v: `${fmtMi(stats.longestRun)} mi`,
            sub: "single longest",
            c: "text-[#B6FF3C]",
          },
          {
            lb: "AVG PACE",
            v: stats.avgSpeedMps ? fmtPace(stats.avgSpeedMps) : "—",
            sub: "across all runs",
            c: "text-[#B6FF3C]",
          },
        ].map((k) => (
          <div key={k.lb} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs tracking-widest text-gray-500 uppercase">{k.lb}</div>
            <div className={`text-3xl font-black mt-1 ${k.c}`}>{k.v}</div>
            <div className="text-xs text-gray-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Lifetime totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { lb: "TOTAL RUNS", v: String(stats.totalRuns) },
          { lb: "TOTAL MILES", v: fmtMi(stats.totalActualAllTime) },
          { lb: "WEEKS WITH RUNS", v: `${stats.weeksDone}/${currentWeek}` },
          { lb: "PEAK WEEK", v: `${fmtMi(stats.peakWeekActual)} mi` },
        ].map((k) => (
          <div key={k.lb} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs tracking-widest text-gray-500 uppercase">{k.lb}</div>
            <div className="text-2xl font-black mt-1">{k.v}</div>
          </div>
        ))}
      </div>

      {/* Current week summary */}
      {currentWeekData && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs tracking-widest text-gray-500 uppercase mb-2">
            THIS WEEK · WK {currentWeek}
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-black">
                {fmtMi(currentWeekData.actualMi)} <span className="text-base font-normal text-gray-500">/ {fmtMi(currentWeekData.plannedMi)} mi</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentWeekData.actualMi >= currentWeekData.plannedMi
                  ? "Hit your planned mileage."
                  : `${fmtMi(Math.max(0, currentWeekData.plannedMi - currentWeekData.actualMi))} mi to plan goal.`}
              </div>
            </div>
            <div
              className="h-2 w-32 rounded bg-gray-100 overflow-hidden"
              aria-hidden
            >
              <div
                className="h-full bg-[#B6FF3C]"
                style={{
                  width: `${Math.min(100, currentWeekData.plannedMi > 0
                    ? (currentWeekData.actualMi / currentWeekData.plannedMi) * 100
                    : 0)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Week-by-week breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 text-xs tracking-widest text-gray-500 uppercase">
          WEEK-BY-WEEK MILEAGE
        </div>
        <div className="divide-y divide-gray-100">
          {stats.weekly.map((w) => {
            const phase = phaseFor(w.weekN);
            const accent = phase?.accent ?? "#B6FF3C";
            const isPast = w.weekN < currentWeek;
            const isCurrent = w.weekN === currentWeek;
            const denom = stats.peakWeekPlanned || 1;
            const plannedPct = (w.plannedMi / denom) * 100;
            const actualPct = (w.actualMi / denom) * 100;
            return (
              <div
                key={w.weekN}
                className={`px-4 py-3 flex items-center gap-3 ${isCurrent ? "bg-gray-50" : ""}`}
              >
                <div className="w-12 shrink-0">
                  <div className="text-xs font-bold">WK {w.weekN}</div>
                  <div className="text-[10px] text-gray-500">{w.date}</div>
                </div>
                <div className="flex-1 min-w-0">
                  {/* planned bar */}
                  <div className="h-1.5 w-full rounded bg-gray-100 overflow-hidden mb-1">
                    <div
                      className="h-full"
                      style={{ width: `${plannedPct}%`, backgroundColor: `${accent}55` }}
                    />
                  </div>
                  {/* actual bar */}
                  <div className="h-1.5 w-full rounded bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${isPast || isCurrent ? "" : "opacity-30"}`}
                      style={{ width: `${actualPct}%`, backgroundColor: accent }}
                    />
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right text-xs">
                  <div className={isPast || isCurrent ? "font-bold" : "text-gray-400"}>
                    {fmtMi(w.actualMi)} mi
                  </div>
                  <div className="text-gray-500">/ {fmtMi(w.plannedMi)} planned</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
