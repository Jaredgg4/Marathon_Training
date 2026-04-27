export type WeekData = {
  n: number;
  date: string;
  mi: number;
  longRunMiles?: number;
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

export const DKEYS = ["mon", "tue", "wed", "fri", "sat"] as const;
export type DayKey = typeof DKEYS[number];

export function getWeekDates(planStart: Date, n: number): Record<DayKey, Date> {
  const mon = new Date(planStart);
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

export function curWeekNum(planStart: Date, totalWeeks: number): number {
  const d = new Date().getTime() - planStart.getTime();
  return d < 0 ? 1 : Math.min(Math.floor(d / (7 * 864e5)) + 1, totalWeeks);
}

export function raceDays(raceDate: Date): number {
  return Math.max(0, Math.ceil((raceDate.getTime() - new Date().getTime()) / 864e5));
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
