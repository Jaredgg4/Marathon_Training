import type { PhaseTemplate } from './phases'

export type WeekTarget = {
  weeklyMiles: number
  longRunMiles: number
  recovery: boolean
  race: boolean
}

const RECOVERY_RATIO = 0.7
const RACE_WEEK_MILES = 6
const RACE_WEEK_LONG_RUN = 0

function recoveryIndices(weeks: number, recoveryEvery: number): Set<number> {
  const out = new Set<number>()
  if (recoveryEvery <= 0) return out
  for (let i = recoveryEvery - 1; i < weeks; i += recoveryEvery) {
    out.add(i)
  }
  return out
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function buildPhaseWeeks(
  phase: PhaseTemplate,
  weeks: number,
  prevWeeklyMiles: number,
  prevLongRunMiles: number,
  isFinalPhase: boolean,
): WeekTarget[] {
  const result: WeekTarget[] = []
  const raceWeekIndex = isFinalPhase ? weeks - 1 : -1

  // Recovery weeks: skip the race week and the week immediately before race week.
  const recoverySet = recoveryIndices(weeks, phase.recoveryEvery)
  if (raceWeekIndex >= 0) {
    recoverySet.delete(raceWeekIndex)
    recoverySet.delete(raceWeekIndex - 1)
  }

  // Count the build slots so we can interpolate over only those.
  const buildSlots: number[] = []
  for (let i = 0; i < weeks; i++) {
    if (i === raceWeekIndex) continue
    if (recoverySet.has(i)) continue
    buildSlots.push(i)
  }
  const buildCount = buildSlots.length

  for (let i = 0; i < weeks; i++) {
    if (i === raceWeekIndex) {
      result.push({
        weeklyMiles: RACE_WEEK_MILES,
        longRunMiles: RACE_WEEK_LONG_RUN,
        recovery: false,
        race: true,
      })
      continue
    }

    if (recoverySet.has(i)) {
      // Defer the value until we know the prior build week's miles.
      result.push({ weeklyMiles: 0, longRunMiles: 0, recovery: true, race: false })
      continue
    }

    // Build week. Linear interpolation over buildSlots.
    const buildIndex = buildSlots.indexOf(i)
    const t = buildCount === 1 ? 1 : buildIndex / (buildCount - 1)
    const weeklyMiles = prevWeeklyMiles + (phase.peakWeeklyMiles - prevWeeklyMiles) * t
    const longRunMiles = prevLongRunMiles + (phase.peakLongRunMiles - prevLongRunMiles) * t
    result.push({
      weeklyMiles: round1(weeklyMiles),
      longRunMiles: round1(longRunMiles),
      recovery: false,
      race: false,
    })
  }

  // Backfill recovery week values from prior week.
  for (let i = 0; i < weeks; i++) {
    if (!result[i].recovery) continue
    const priorMiles = i > 0 ? result[i - 1].weeklyMiles : prevWeeklyMiles
    const priorLong = i > 0 ? result[i - 1].longRunMiles : prevLongRunMiles
    result[i] = {
      ...result[i],
      weeklyMiles: round1(priorMiles * RECOVERY_RATIO),
      longRunMiles: round1(priorLong * RECOVERY_RATIO),
    }
  }

  return result
}
