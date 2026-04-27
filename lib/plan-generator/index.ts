import type { Phase, WeekData } from '../../app/data/plan'
import {
  RACE_PHASES,
  FITNESS_FALLBACK_WEEKLY_MILES,
  type RaceType,
  type FitnessLevel,
} from './phases'
import { allocateWeeks } from './allocate'
import { buildPhaseWeeks, type WeekTarget } from './volume'
import { derivePaces, type GoalFinishTime, type Paces } from './paces'
import type { Warning } from './types'

export type { Warning, WarningCode } from './types'
export type { Paces } from './paces'
export type { RaceType, FitnessLevel } from './phases'

export type PlanInput = {
  planStartDate: Date
  raceDate: Date
  raceType: RaceType
  fitnessLevel: FitnessLevel
  selfReportedWeeklyMiles: number
  goalFinishTime: GoalFinishTime
  // When present, indicates a captured snapshot from a Strava connection at plan creation.
  // Presence alone is the gate; the sample-size check happens at capture time inside summarizeStravaFitness.
  stravaStartingWeeklyMiles?: number
  stravaStartingLongRunMiles?: number
}

export type GeneratedPlan = {
  phases: Phase[]
  warnings: Warning[]
  paces: Paces
}

const MS_PER_DAY = 86_400_000

const PHASE_NUMBER_PREFIX = ['01', '02', '03', '04', '05', '06']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtMonDay(d: Date): string {
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`
}

function ceilWeeksBetween(start: Date, end: Date): number {
  const diffDays = (end.getTime() - start.getTime()) / MS_PER_DAY
  return Math.max(1, Math.ceil(diffDays / 7))
}

function chooseStartingVolume(
  input: PlanInput,
): { startingMiles: number; startingLongRun: number; warnings: Warning[] } {
  const warnings: Warning[] = []
  const stravaUsable = typeof input.stravaStartingWeeklyMiles === 'number'

  let startingMiles: number
  let startingLongRun: number

  if (stravaUsable) {
    startingMiles = input.stravaStartingWeeklyMiles!
    startingLongRun = input.stravaStartingLongRunMiles ?? Math.max(2, Math.round(startingMiles * 0.3))

    if (input.selfReportedWeeklyMiles > 0) {
      const ratio = startingMiles / input.selfReportedWeeklyMiles
      if (ratio >= 2) {
        warnings.push({
          code: 'STRAVA_ABOVE_REPORTED',
          message: `Your Strava history shows ~${startingMiles} mi/week, more than double the ${input.selfReportedWeeklyMiles} mi/week you entered. Using your Strava history.`,
        })
      } else if (ratio <= 0.5) {
        warnings.push({
          code: 'STRAVA_BELOW_REPORTED',
          message: `Your Strava history shows ~${startingMiles} mi/week, less than half the ${input.selfReportedWeeklyMiles} mi/week you entered. Using Strava — adjust if you've been logging runs elsewhere.`,
        })
      }
    }
  } else if (input.selfReportedWeeklyMiles > 0) {
    startingMiles = input.selfReportedWeeklyMiles
    startingLongRun = Math.max(2, Math.round(startingMiles * 0.3))
  } else {
    startingMiles = FITNESS_FALLBACK_WEEKLY_MILES[input.fitnessLevel]
    startingLongRun = Math.max(2, Math.round(startingMiles * 0.3))
  }

  return { startingMiles, startingLongRun, warnings }
}

function fmtMiles(miles: number): string {
  // Half-mile resolution feels natural and matches how runners think.
  const rounded = Math.round(miles * 2) / 2
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

function workoutsForWeek(
  phaseId: string,
  target: WeekTarget,
  raceDateStr: string,
): Pick<WeekData, 'mon' | 'tue' | 'wed' | 'fri' | 'sat'> {
  if (target.race) {
    return {
      mon: '2 mi shakeout',
      tue: '1.5 mi shakeout',
      wed: 'Rest',
      fri: '1.5 mi shakeout',
      sat: `🏁 RACE DAY — ${raceDateStr}`,
    }
  }

  const longRunMiles = target.longRunMiles
  const remainingMiles = Math.max(0, target.weeklyMiles - longRunMiles)
  // Distribute remaining miles across 4 weekday runs.
  const easyDayMiles = Math.max(1, remainingMiles / 4)

  const usesTempo = phaseId === 'development' || phaseId === 'peak' || phaseId === 'race_specific'
  const tempoDayMiles = Math.max(1, easyDayMiles * 0.85) // tempo runs are slightly shorter

  const easyLabel = `${fmtMiles(easyDayMiles)} mi easy`
  const tempoLabel = `${fmtMiles(tempoDayMiles)} mi tempo`
  const longRunLabel = target.recovery
    ? `${fmtMiles(longRunMiles)} mi easy`
    : `${fmtMiles(longRunMiles)} mi long run`

  return {
    mon: easyLabel,
    tue: easyLabel,
    wed: usesTempo && !target.recovery ? tempoLabel : easyLabel,
    fri: easyLabel,
    sat: longRunLabel,
  }
}

function weekStartDate(planStart: Date, weekIndex: number): Date {
  const d = new Date(planStart)
  d.setUTCDate(d.getUTCDate() + weekIndex * 7)
  return d
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const availableWeeks = ceilWeeksBetween(input.planStartDate, input.raceDate)
  const phaseTemplates = RACE_PHASES[input.raceType]
  const { allocations, warnings: allocWarnings } = allocateWeeks(phaseTemplates, availableWeeks)

  const { startingMiles, startingLongRun, warnings: volumeWarnings } = chooseStartingVolume(input)
  const paces = derivePaces(input.goalFinishTime, input.raceType)
  const raceDateStr = fmtMonDay(input.raceDate)

  const phases: Phase[] = []
  let prevMiles = startingMiles
  let prevLong = startingLongRun
  let weekCounter = 1

  for (let pi = 0; pi < allocations.length; pi++) {
    const { phase: template, weeks: weekCount } = allocations[pi]
    const isFinalPhase = pi === allocations.length - 1
    const targets = buildPhaseWeeks(template, weekCount, prevMiles, prevLong, isFinalPhase)

    const phaseStartIndex = weekCounter - 1
    const phaseEndIndex = phaseStartIndex + weekCount - 1
    const phaseStartDate = weekStartDate(input.planStartDate, phaseStartIndex)
    const phaseEndDate = weekStartDate(input.planStartDate, phaseEndIndex)

    const weeks: WeekData[] = targets.map((t, ti) => {
      const wn = weekCounter + ti
      const dt = weekStartDate(input.planStartDate, wn - 1)
      const wo = workoutsForWeek(template.id, t, raceDateStr)
      const w: WeekData = {
        n: wn,
        date: fmtMonDay(dt),
        mi: t.weeklyMiles,
        longRunMiles: t.longRunMiles,
        recovery: t.recovery,
        ...wo,
      }
      if (t.race) w.race = true
      return w
    })

    phases.push({
      id: pi,
      phase: PHASE_NUMBER_PREFIX[pi] ?? String(pi + 1).padStart(2, '0'),
      label: template.label,
      range: weekCount === 1
        ? `Week ${weekCounter}`
        : `Weeks ${weekCounter}–${weekCounter + weekCount - 1}`,
      dates: `${fmtMonDay(phaseStartDate)} – ${fmtMonDay(phaseEndDate)}`,
      accent: template.accent,
      tip: template.tip,
      weeks,
    })

    weekCounter += weekCount
    // Carry forward the last non-recovery, non-race build week's volume to seed the next phase.
    const lastBuild = [...targets].reverse().find((t) => !t.recovery && !t.race)
    if (lastBuild) {
      prevMiles = lastBuild.weeklyMiles
      prevLong = lastBuild.longRunMiles
    }
  }

  return {
    phases,
    warnings: [...allocWarnings, ...volumeWarnings],
    paces,
  }
}
