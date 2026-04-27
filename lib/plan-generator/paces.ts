import { RACE_DISTANCE_MILES, type RaceType } from './phases'

export type GoalFinishTime = {
  hours: number
  minutes: number
}

export type Paces = {
  goalPaceMinPerMile: number | null
  tempoPaceMinPerMile: number | null
  easyPaceMinPerMile: number | null
}

const TEMPO_OFFSET_MIN = 0.25 // ~15 seconds
const EASY_OFFSET_MIN = 1.5   // ~90 seconds

export function derivePaces(goal: GoalFinishTime, raceType: RaceType): Paces {
  const totalMin = goal.hours * 60 + goal.minutes
  if (totalMin <= 0) {
    return { goalPaceMinPerMile: null, tempoPaceMinPerMile: null, easyPaceMinPerMile: null }
  }
  const goalPaceMinPerMile = totalMin / RACE_DISTANCE_MILES[raceType]
  return {
    goalPaceMinPerMile,
    tempoPaceMinPerMile: goalPaceMinPerMile + TEMPO_OFFSET_MIN,
    easyPaceMinPerMile: goalPaceMinPerMile + EASY_OFFSET_MIN,
  }
}

export function formatPace(minPerMile: number | null): string {
  if (minPerMile === null || minPerMile <= 0) return '—'
  const m = Math.floor(minPerMile)
  const s = Math.round((minPerMile - m) * 60)
  if (s === 60) return `${m + 1}:00/mi`
  return `${m}:${s.toString().padStart(2, '0')}/mi`
}
