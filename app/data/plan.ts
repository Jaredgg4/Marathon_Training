export const PLAN_START = new Date("2026-04-14T00:00:00");
export const RACE_DATE = new Date("2026-11-07T00:00:00");

export type WeekData = {
  n: number;
  date: string;
  mi: number;
  recovery: boolean;
  race?: boolean;
  mon: string;
  tue: string;
  wed: string;
  fri: string;
  sat: string;
};

export type Phase = {
  id: number;
  phase: string;
  label: string;
  range: string;
  dates: string;
  accent: string;
  tip: string;
  weeks: WeekData[];
};

export const PHASES: Phase[] = [
  {
    id: 0,
    phase: "01",
    label: "BASE BUILDING",
    range: "Weeks 1–8",
    dates: "Apr 14 – Jun 1",
    accent: "#4ade80",
    tip: "Run slow. Walk whenever needed. Consistency over speed.",
    weeks: [
      { n: 1, date: "Apr 14", mi: 12, recovery: false, mon: "20 min run/walk", tue: "20 min run/walk", wed: "25 min easy", fri: "25 min easy", sat: "3 mi long run" },
      { n: 2, date: "Apr 21", mi: 14, recovery: false, mon: "22 min easy", tue: "22 min easy", wed: "28 min easy", fri: "28 min easy", sat: "4 mi long run" },
      { n: 3, date: "Apr 28", mi: 16, recovery: false, mon: "25 min easy", tue: "25 min easy", wed: "30 min easy", fri: "30 min easy", sat: "5 mi long run" },
      { n: 4, date: "May 5", mi: 11, recovery: true, mon: "20 min easy", tue: "20 min easy", wed: "20 min easy", fri: "20 min easy", sat: "3 mi easy" },
      { n: 5, date: "May 12", mi: 18, recovery: false, mon: "30 min easy", tue: "30 min easy", wed: "35 min easy", fri: "30 min easy", sat: "6 mi long run" },
      { n: 6, date: "May 19", mi: 20, recovery: false, mon: "30 min easy", tue: "32 min easy", wed: "35 min easy", fri: "32 min easy", sat: "7 mi long run" },
      { n: 7, date: "May 26", mi: 22, recovery: false, mon: "35 min easy", tue: "30 min easy", wed: "40 min easy", fri: "35 min easy", sat: "8 mi long run" },
      { n: 8, date: "Jun 2", mi: 14, recovery: true, mon: "25 min easy", tue: "25 min easy", wed: "25 min easy", fri: "25 min easy", sat: "4 mi easy" },
    ]
  },
  {
    id: 1,
    phase: "02",
    label: "DEVELOPMENT",
    range: "Weeks 9–16",
    dates: "Jun 9 – Aug 3",
    accent: "#facc15",
    tip: "Tempo runs begin. Long runs pass the half-marathon mark.",
    weeks: [
      { n: 9, date: "Jun 9", mi: 24, recovery: false, mon: "35 min easy", tue: "35 min easy", wed: "40 min easy", fri: "35 min easy", sat: "9 mi long run" },
      { n: 10, date: "Jun 16", mi: 26, recovery: false, mon: "35 min easy", tue: "40 min easy", wed: "30 min tempo", fri: "35 min easy", sat: "10 mi long run" },
      { n: 11, date: "Jun 23", mi: 28, recovery: false, mon: "40 min easy", tue: "40 min easy", wed: "35 min tempo", fri: "40 min easy", sat: "11 mi long run" },
      { n: 12, date: "Jun 30", mi: 20, recovery: true, mon: "30 min easy", tue: "30 min easy", wed: "30 min easy", fri: "30 min easy", sat: "7 mi easy" },
      { n: 13, date: "Jul 7", mi: 30, recovery: false, mon: "40 min easy", tue: "45 min easy", wed: "35 min tempo", fri: "40 min easy", sat: "12 mi long run" },
      { n: 14, date: "Jul 14", mi: 32, recovery: false, mon: "40 min easy", tue: "45 min easy", wed: "40 min tempo", fri: "40 min easy", sat: "14 mi long run" },
      { n: 15, date: "Jul 21", mi: 34, recovery: false, mon: "45 min easy", tue: "45 min easy", wed: "40 min tempo", fri: "45 min easy", sat: "15 mi long run" },
      { n: 16, date: "Jul 28", mi: 22, recovery: true, mon: "35 min easy", tue: "35 min easy", wed: "30 min easy", fri: "35 min easy", sat: "8 mi easy" },
    ]
  },
  {
    id: 2,
    phase: "03",
    label: "PEAK TRAINING",
    range: "Weeks 17–22",
    dates: "Aug 4 – Sep 14",
    accent: "#f97316",
    tip: "Your hardest block. Week 22's 20-miler is the cornerstone of your plan.",
    weeks: [
      { n: 17, date: "Aug 4", mi: 36, recovery: false, mon: "45 min easy", tue: "50 min easy", wed: "45 min tempo", fri: "45 min easy", sat: "16 mi long run" },
      { n: 18, date: "Aug 11", mi: 38, recovery: false, mon: "45 min easy", tue: "50 min easy", wed: "45 min tempo", fri: "45 min easy", sat: "17 mi long run" },
      { n: 19, date: "Aug 18", mi: 32, recovery: true, mon: "40 min easy", tue: "40 min easy", wed: "40 min easy", fri: "40 min easy", sat: "12 mi easy" },
      { n: 20, date: "Aug 25", mi: 40, recovery: false, mon: "50 min easy", tue: "50 min easy", wed: "50 min tempo", fri: "45 min easy", sat: "18 mi long run" },
      { n: 21, date: "Sep 1", mi: 42, recovery: false, mon: "50 min easy", tue: "55 min easy", wed: "50 min tempo", fri: "50 min easy", sat: "19 mi long run" },
      { n: 22, date: "Sep 8", mi: 44, recovery: false, mon: "50 min easy", tue: "55 min easy", wed: "50 min tempo", fri: "50 min easy", sat: "20 mi long run ★" },
    ]
  },
  {
    id: 3,
    phase: "04",
    label: "TAPER",
    range: "Weeks 23–29",
    dates: "Sep 15 – Nov 7",
    accent: "#60a5fa",
    tip: "Trust your training. Drop the mileage, stay fresh, and race smart.",
    weeks: [
      { n: 23, date: "Sep 15", mi: 34, recovery: false, mon: "45 min easy", tue: "45 min easy", wed: "40 min easy", fri: "40 min easy", sat: "14 mi easy" },
      { n: 24, date: "Sep 22", mi: 26, recovery: false, mon: "40 min easy", tue: "40 min easy", wed: "35 min easy", fri: "35 min easy", sat: "11 mi easy" },
      { n: 25, date: "Sep 29", mi: 20, recovery: false, mon: "35 min easy", tue: "35 min easy", wed: "30 min easy", fri: "30 min easy", sat: "8 mi easy" },
      { n: 26, date: "Oct 6", mi: 16, recovery: false, mon: "30 min easy", tue: "30 min easy", wed: "25 min easy", fri: "25 min easy", sat: "6 mi easy" },
      { n: 27, date: "Oct 13", mi: 12, recovery: false, mon: "25 min easy", tue: "25 min easy", wed: "20 min easy", fri: "20 min easy", sat: "4 mi easy" },
      { n: 28, date: "Oct 20", mi: 8, recovery: false, mon: "20 min easy", tue: "20 min easy", wed: "15 min easy", fri: "15 min easy", sat: "2 mi shakeout" },
      { n: 29, date: "Oct 27", mi: 0, recovery: false, race: true, mon: "20 min easy", tue: "15 min easy", wed: "Rest", fri: "15 min shakeout", sat: "🏁 RACE DAY — Nov 7" },
    ]
  }
];

export const DKEYS = ["mon", "tue", "wed", "fri", "sat"] as const;
export type DayKey = typeof DKEYS[number];

export function getWeekDates(n: number): Record<DayKey, Date> {
  const mon = new Date(PLAN_START);
  mon.setDate(mon.getDate() + (n - 1) * 7);
  const offs: Record<DayKey, number> = { mon: 0, tue: 1, wed: 2, fri: 4, sat: 5 };
  const out = {} as Record<DayKey, Date>;
  for (const [k, o] of Object.entries(offs)) {
    const d = new Date(mon);
    d.setDate(d.getDate() + o);
    out[k as DayKey] = d;
  }
  return out;
}

export function curWeekNum(): number {
  const d = new Date().getTime() - PLAN_START.getTime();
  return d < 0 ? 1 : Math.min(Math.floor(d / (7 * 864e5)) + 1, 29);
}

export function raceDays(): number {
  return Math.max(0, Math.ceil((RACE_DATE.getTime() - new Date().getTime()) / 864e5));
}

export function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function fmtPace(mps: number | undefined): string {
  if (!mps || mps <= 0) return "—";
  const m = 26.8224 / mps;
  return `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}/mi`;
}

export function fmtDur(s: number | undefined): string {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function toMi(m: number): number {
  return parseFloat((m / 1609.34).toFixed(2));
}

// Strava types
export type StravaAthlete = {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium?: string;
};

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  average_speed?: number;
  start_date_local: string;
};

export type ManualRun = {
  id: number;
  source: "manual";
  date: string;
  dist: number;
  dur: string;
  notes: string;
};

export type RunEntry = {
  id: number | string;
  source: "strava" | "manual";
  date: string;
  dist: number;
  dur: string;
  pace: string;
  name?: string;
};

export function actForDate(acts: StravaActivity[], dateObj: Date | null): StravaActivity | null {
  if (!dateObj) return null;
  const ds = fmtDate(dateObj);
  return acts.find((a) =>
    (a.type === "Run" || a.sport_type === "Run") && a.start_date_local?.startsWith(ds)
  ) || null;
}
