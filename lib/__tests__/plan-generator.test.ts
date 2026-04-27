import { describe, it, expect } from 'vitest'
import { generatePlan, type PlanInput } from '../plan-generator'

const PLAN_START = new Date('2026-04-14T00:00:00Z')

function withRaceWeeksOut(input: PlanInput, weeksOut: number): PlanInput {
  const race = new Date(input.planStartDate)
  race.setUTCDate(race.getUTCDate() + weeksOut * 7)
  return { ...input, raceDate: race }
}

const baseInput: PlanInput = withRaceWeeksOut(
  {
    planStartDate: PLAN_START,
    raceDate: PLAN_START, // overridden below
    raceType: 'marathon',
    fitnessLevel: 'intermediate',
    selfReportedWeeklyMiles: 12,
    goalFinishTime: { hours: 4, minutes: 0 },
  },
  29,
)

describe('generatePlan: marathon, 29 weeks', () => {
  it('returns 4 phases summing to 29 weeks', () => {
    const { phases } = generatePlan(baseInput)
    expect(phases).toHaveLength(4)
    const totalWeeks = phases.reduce((s, p) => s + p.weeks.length, 0)
    expect(totalWeeks).toBe(29)
  })

  it('numbers weeks sequentially across all phases starting at 1', () => {
    const { phases } = generatePlan(baseInput)
    const all = phases.flatMap((p) => p.weeks)
    expect(all.map((w) => w.n)).toEqual(Array.from({ length: 29 }, (_, i) => i + 1))
  })

  it('marks the very last week as race week', () => {
    const { phases } = generatePlan(baseInput)
    const lastWeek = phases[phases.length - 1].weeks.slice(-1)[0]
    expect(lastWeek.race).toBe(true)
  })

  it('hits the marathon long-run peak of 20 miles in the peak phase', () => {
    const { phases } = generatePlan(baseInput)
    const peakPhase = phases.find((p) => p.label === 'PEAK TRAINING')!
    const longest = Math.max(...peakPhase.weeks.map((w) => w.longRunMiles ?? 0))
    expect(longest).toBeGreaterThanOrEqual(20)
  })

  it('starts at the self-reported weekly mileage when no Strava snapshot is provided', () => {
    const { phases } = generatePlan(baseInput)
    expect(phases[0].weeks[0].mi).toBeGreaterThanOrEqual(baseInput.selfReportedWeeklyMiles)
    expect(phases[0].weeks[0].mi).toBeLessThanOrEqual(baseInput.selfReportedWeeklyMiles + 5)
  })

  it('returns no warnings for a healthy 29-week timeline', () => {
    const { warnings } = generatePlan(baseInput)
    expect(warnings).toEqual([])
  })
})

describe('generatePlan: marathon, tight timeline', () => {
  it('shrinks base first when only 24 weeks are available', () => {
    const input = withRaceWeeksOut(baseInput, 24)
    const { phases } = generatePlan(input)
    const base = phases.find((p) => p.label === 'BASE BUILDING')!
    expect(base.weeks.length).toBeLessThan(8)
    const taper = phases.find((p) => p.label === 'TAPER')!
    expect(taper.weeks.length).toBe(7)
  })

  it('emits TIMELINE_TOO_SHORT for 6-week marathon', () => {
    const input = withRaceWeeksOut(baseInput, 6)
    const { warnings, phases } = generatePlan(input)
    expect(warnings.some((w) => w.code === 'TIMELINE_TOO_SHORT')).toBe(true)
    const totalWeeks = phases.reduce((s, p) => s + p.weeks.length, 0)
    expect(totalWeeks).toBeGreaterThanOrEqual(16) // sum of marathon minWeeks
  })

  it('emits TIMELINE_VERY_LONG for 50-week marathon', () => {
    const input = withRaceWeeksOut(baseInput, 50)
    const { warnings } = generatePlan(input)
    expect(warnings.some((w) => w.code === 'TIMELINE_VERY_LONG')).toBe(true)
  })
})

describe('generatePlan: race types', () => {
  it('half marathon hits a peak long run between 10 and 12 miles', () => {
    const input = { ...withRaceWeeksOut(baseInput, 18), raceType: 'half_marathon' as const }
    const { phases } = generatePlan(input)
    const longest = Math.max(...phases.flatMap((p) => p.weeks.map((w) => w.longRunMiles ?? 0)))
    expect(longest).toBeGreaterThanOrEqual(10)
    expect(longest).toBeLessThanOrEqual(12)
  })

  it('5k uses speed and race_specific phases instead of development/peak', () => {
    const input = { ...withRaceWeeksOut(baseInput, 13), raceType: '5k' as const }
    const { phases } = generatePlan(input)
    const labels = phases.map((p) => p.label)
    expect(labels).toContain('SPEED DEVELOPMENT')
    expect(labels).toContain('RACE SPECIFIC')
  })

  it('ironman peak long run is between 22 and 26 miles', () => {
    const input = { ...withRaceWeeksOut(baseInput, 31), raceType: 'ironman' as const }
    const { phases } = generatePlan(input)
    const longest = Math.max(...phases.flatMap((p) => p.weeks.map((w) => w.longRunMiles ?? 0)))
    expect(longest).toBeGreaterThanOrEqual(22)
    expect(longest).toBeLessThanOrEqual(26)
  })
})

describe('generatePlan: Strava integration', () => {
  it('uses Strava snapshot when one is provided', () => {
    const input: PlanInput = {
      ...baseInput,
      stravaStartingWeeklyMiles: 30,
      stravaStartingLongRunMiles: 9,
    }
    const { phases } = generatePlan(input)
    expect(phases[0].weeks[0].mi).toBeGreaterThanOrEqual(30)
    expect(phases[0].weeks[0].mi).toBeLessThanOrEqual(34)
  })

  it('falls back to self-report when no snapshot is provided', () => {
    const { phases } = generatePlan(baseInput)
    expect(phases[0].weeks[0].mi).toBeGreaterThanOrEqual(baseInput.selfReportedWeeklyMiles)
    expect(phases[0].weeks[0].mi).toBeLessThanOrEqual(baseInput.selfReportedWeeklyMiles + 5)
  })

  it('emits STRAVA_ABOVE_REPORTED when Strava more than doubles self-report', () => {
    const input: PlanInput = {
      ...baseInput,
      selfReportedWeeklyMiles: 10,
      stravaStartingWeeklyMiles: 28,
      stravaStartingLongRunMiles: 9,
    }
    const { warnings } = generatePlan(input)
    expect(warnings.some((w) => w.code === 'STRAVA_ABOVE_REPORTED')).toBe(true)
  })

  it('emits STRAVA_BELOW_REPORTED when Strava is less than half self-report', () => {
    const input: PlanInput = {
      ...baseInput,
      selfReportedWeeklyMiles: 30,
      stravaStartingWeeklyMiles: 8,
      stravaStartingLongRunMiles: 3,
    }
    const { warnings } = generatePlan(input)
    expect(warnings.some((w) => w.code === 'STRAVA_BELOW_REPORTED')).toBe(true)
  })
})

describe('generatePlan: workout format', () => {
  it('uses mileage-based labels on weekday runs', () => {
    const { phases } = generatePlan(baseInput)
    // Look at a mid-base week to skip the race-week shakeout pattern.
    const sample = phases[0].weeks[2]
    expect(sample.mon).toMatch(/\d+(\.\d+)? mi (easy|tempo)/)
    expect(sample.tue).toMatch(/\d+(\.\d+)? mi (easy|tempo)/)
    expect(sample.fri).toMatch(/\d+(\.\d+)? mi (easy|tempo)/)
  })

  it('uses miles for the long run', () => {
    const { phases } = generatePlan(baseInput)
    const sat = phases[1].weeks[2].sat
    expect(sat).toMatch(/\d+(\.\d+)? mi (long run|easy)/)
  })

  it('marks race week with shakeout miles, not minutes', () => {
    const { phases } = generatePlan(baseInput)
    const lastWeek = phases[phases.length - 1].weeks.slice(-1)[0]
    expect(lastWeek.mon).toMatch(/mi shakeout|mi easy/)
    expect(lastWeek.fri).toMatch(/mi shakeout/)
  })
})

describe('generatePlan: fallbacks and edge cases', () => {
  it('uses fitness-level lookup when no Strava and no self-report', () => {
    const input: PlanInput = { ...baseInput, selfReportedWeeklyMiles: 0 }
    const { phases } = generatePlan(input)
    // intermediate fallback = 15
    expect(phases[0].weeks[0].mi).toBeGreaterThanOrEqual(15)
    expect(phases[0].weeks[0].mi).toBeLessThanOrEqual(20)
  })

  it('populates dates and ranges on each phase', () => {
    const { phases } = generatePlan(baseInput)
    for (const p of phases) {
      expect(p.range).toMatch(/Weeks? \d+(–\d+)?/)
      expect(p.dates).toMatch(/[A-Z][a-z]{2} \d+/)
    }
  })

  it('formats race-week sat field with the race date', () => {
    const { phases } = generatePlan(baseInput)
    const lastWeek = phases[phases.length - 1].weeks.slice(-1)[0]
    expect(lastWeek.sat).toMatch(/RACE DAY/)
  })
})
