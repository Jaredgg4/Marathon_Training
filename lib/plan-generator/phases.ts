export type RaceType = 'marathon' | 'half_marathon' | '5k' | 'ironman'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export type PhaseId =
  | 'base'
  | 'development'
  | 'peak'
  | 'taper'
  | 'speed'
  | 'race_specific'

export type PhaseTemplate = {
  id: PhaseId
  label: string
  accent: string
  tip: string
  idealWeeks: number
  minWeeks: number
  // Lower priority shrinks first when timeline is tight; taper has the highest.
  priority: number
  // 0 disables; otherwise insert a recovery week every Nth week within the phase.
  recoveryEvery: number
  // Targets at the END of this phase, before any phase-internal recovery dip.
  peakWeeklyMiles: number
  peakLongRunMiles: number
}

const BASE_TIP = 'Run slow. Walk whenever needed. Consistency over speed.'
const DEV_TIP = 'Tempo runs begin. Long runs cross into half-marathon territory.'
const PEAK_TIP = 'Your hardest block. The long run is the cornerstone.'
const TAPER_TIP = 'Trust your training. Drop the mileage, stay fresh, and race smart.'
const SPEED_TIP = 'Add intensity. Short, sharp intervals to lift your top-end.'
const RS_TIP = 'Race-specific work. Lock in goal pace at threshold.'

const ACCENT_BASE = '#4ade80'
const ACCENT_DEV = '#facc15'
const ACCENT_PEAK = '#f97316'
const ACCENT_TAPER = '#60a5fa'
const ACCENT_SPEED = '#facc15'
const ACCENT_RS = '#f97316'

export const RACE_PHASES: Record<RaceType, PhaseTemplate[]> = {
  marathon: [
    { id: 'base', label: 'BASE BUILDING', accent: ACCENT_BASE, tip: BASE_TIP,
      idealWeeks: 8, minWeeks: 4, priority: 1, recoveryEvery: 4,
      peakWeeklyMiles: 22, peakLongRunMiles: 8 },
    { id: 'development', label: 'DEVELOPMENT', accent: ACCENT_DEV, tip: DEV_TIP,
      idealWeeks: 8, minWeeks: 5, priority: 2, recoveryEvery: 4,
      peakWeeklyMiles: 34, peakLongRunMiles: 15 },
    { id: 'peak', label: 'PEAK TRAINING', accent: ACCENT_PEAK, tip: PEAK_TIP,
      idealWeeks: 6, minWeeks: 4, priority: 3, recoveryEvery: 3,
      peakWeeklyMiles: 44, peakLongRunMiles: 20 },
    { id: 'taper', label: 'TAPER', accent: ACCENT_TAPER, tip: TAPER_TIP,
      idealWeeks: 7, minWeeks: 3, priority: 4, recoveryEvery: 0,
      peakWeeklyMiles: 8, peakLongRunMiles: 2 },
  ],
  half_marathon: [
    { id: 'base', label: 'BASE BUILDING', accent: ACCENT_BASE, tip: BASE_TIP,
      idealWeeks: 6, minWeeks: 3, priority: 1, recoveryEvery: 4,
      peakWeeklyMiles: 18, peakLongRunMiles: 6 },
    { id: 'development', label: 'DEVELOPMENT', accent: ACCENT_DEV, tip: DEV_TIP,
      idealWeeks: 5, minWeeks: 3, priority: 2, recoveryEvery: 4,
      peakWeeklyMiles: 26, peakLongRunMiles: 8 },
    { id: 'peak', label: 'PEAK TRAINING', accent: ACCENT_PEAK, tip: PEAK_TIP,
      idealWeeks: 4, minWeeks: 3, priority: 3, recoveryEvery: 3,
      peakWeeklyMiles: 32, peakLongRunMiles: 11 },
    { id: 'taper', label: 'TAPER', accent: ACCENT_TAPER, tip: TAPER_TIP,
      idealWeeks: 3, minWeeks: 2, priority: 4, recoveryEvery: 0,
      peakWeeklyMiles: 6, peakLongRunMiles: 2 },
  ],
  '5k': [
    { id: 'base', label: 'BASE BUILDING', accent: ACCENT_BASE, tip: BASE_TIP,
      idealWeeks: 4, minWeeks: 2, priority: 1, recoveryEvery: 4,
      peakWeeklyMiles: 15, peakLongRunMiles: 5 },
    { id: 'speed', label: 'SPEED DEVELOPMENT', accent: ACCENT_SPEED, tip: SPEED_TIP,
      idealWeeks: 4, minWeeks: 3, priority: 2, recoveryEvery: 4,
      peakWeeklyMiles: 22, peakLongRunMiles: 6 },
    { id: 'race_specific', label: 'RACE SPECIFIC', accent: ACCENT_RS, tip: RS_TIP,
      idealWeeks: 3, minWeeks: 2, priority: 3, recoveryEvery: 0,
      peakWeeklyMiles: 24, peakLongRunMiles: 7 },
    { id: 'taper', label: 'TAPER', accent: ACCENT_TAPER, tip: TAPER_TIP,
      idealWeeks: 2, minWeeks: 1, priority: 4, recoveryEvery: 0,
      peakWeeklyMiles: 5, peakLongRunMiles: 2 },
  ],
  ironman: [
    { id: 'base', label: 'BASE BUILDING', accent: ACCENT_BASE, tip: BASE_TIP,
      idealWeeks: 12, minWeeks: 8, priority: 1, recoveryEvery: 4,
      peakWeeklyMiles: 30, peakLongRunMiles: 10 },
    { id: 'development', label: 'DEVELOPMENT', accent: ACCENT_DEV, tip: DEV_TIP,
      idealWeeks: 10, minWeeks: 6, priority: 2, recoveryEvery: 4,
      peakWeeklyMiles: 45, peakLongRunMiles: 16 },
    { id: 'peak', label: 'PEAK TRAINING', accent: ACCENT_PEAK, tip: PEAK_TIP,
      idealWeeks: 6, minWeeks: 4, priority: 3, recoveryEvery: 3,
      peakWeeklyMiles: 55, peakLongRunMiles: 24 },
    { id: 'taper', label: 'TAPER', accent: ACCENT_TAPER, tip: TAPER_TIP,
      idealWeeks: 3, minWeeks: 2, priority: 4, recoveryEvery: 0,
      peakWeeklyMiles: 10, peakLongRunMiles: 3 },
  ],
}

export const RACE_DISTANCE_MILES: Record<RaceType, number> = {
  marathon: 26.2188,
  half_marathon: 13.1094,
  '5k': 3.10686,
  ironman: 26.2188, // Run leg of the Ironman, used only for run-pace seeding.
}

export const FITNESS_FALLBACK_WEEKLY_MILES: Record<FitnessLevel, number> = {
  beginner: 8,
  intermediate: 15,
  advanced: 25,
}
