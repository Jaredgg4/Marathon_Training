import type { StravaActivity } from '../app/data/plan'

export type StravaFitnessSummary = {
  weeklyMiles: number
  longestRunMiles: number
  sampleWeeks: number
}

const METERS_PER_MILE = 1609.34
const MS_PER_DAY = 86_400_000
const MIN_SAMPLE_WEEKS = 4

function isRun(a: StravaActivity): boolean {
  return a.type === 'Run' || a.sport_type === 'Run'
}

function isoWeekKey(d: Date): string {
  // ISO week key: year-Wnn. Stable enough for grouping; we don't need calendar correctness.
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (tmp.getUTCDay() + 6) % 7
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / MS_PER_DAY - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${tmp.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`
}

export function summarizeStravaFitness(
  activities: StravaActivity[],
  asOf: Date,
  windowWeeks = 6,
): StravaFitnessSummary | null {
  const cutoff = asOf.getTime() - windowWeeks * 7 * MS_PER_DAY
  const inWindow = activities.filter((a) => {
    if (!isRun(a)) return false
    const t = new Date(a.start_date_local).getTime()
    return t >= cutoff && t <= asOf.getTime()
  })

  if (inWindow.length < 2) return null

  const weekTotals = new Map<string, number>()
  let longestMiles = 0
  for (const a of inWindow) {
    const miles = a.distance / METERS_PER_MILE
    if (miles > longestMiles) longestMiles = miles
    const key = isoWeekKey(new Date(a.start_date_local))
    weekTotals.set(key, (weekTotals.get(key) ?? 0) + miles)
  }

  const sampleWeeks = weekTotals.size
  if (sampleWeeks < MIN_SAMPLE_WEEKS) return null

  const totalMiles = Array.from(weekTotals.values()).reduce((s, v) => s + v, 0)
  const weeklyMiles = totalMiles / sampleWeeks

  return {
    weeklyMiles: Math.round(weeklyMiles * 10) / 10,
    longestRunMiles: Math.round(longestMiles * 10) / 10,
    sampleWeeks,
  }
}
