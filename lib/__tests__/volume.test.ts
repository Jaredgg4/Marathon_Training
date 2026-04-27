import { describe, it, expect } from 'vitest'
import { buildPhaseWeeks } from '../plan-generator/volume'
import { RACE_PHASES } from '../plan-generator/phases'

const marathon = RACE_PHASES.marathon
const base = marathon.find((p) => p.id === 'base')!
const dev = marathon.find((p) => p.id === 'development')!
const peak = marathon.find((p) => p.id === 'peak')!
const taper = marathon.find((p) => p.id === 'taper')!

describe('buildPhaseWeeks', () => {
  it('returns one entry per week', () => {
    const weeks = buildPhaseWeeks(base, 8, 10, 3, false)
    expect(weeks).toHaveLength(8)
  })

  it('starts at the previous-phase volume and ramps to the phase peak', () => {
    const weeks = buildPhaseWeeks(base, 8, 10, 3, false)
    // First non-recovery week is at or near previous volume.
    const firstBuild = weeks.find((w) => !w.recovery && !w.race)!
    expect(firstBuild.weeklyMiles).toBeGreaterThanOrEqual(10)
    expect(firstBuild.weeklyMiles).toBeLessThanOrEqual(15)
    // Final non-recovery week of the phase hits the peak.
    const lastBuild = [...weeks].reverse().find((w) => !w.recovery && !w.race)!
    expect(lastBuild.weeklyMiles).toBe(base.peakWeeklyMiles)
    expect(lastBuild.longRunMiles).toBe(base.peakLongRunMiles)
  })

  it('inserts recovery weeks at the configured cadence', () => {
    // base has recoveryEvery = 4. With 8 weeks, recovery weeks should be the 4th and 8th.
    const weeks = buildPhaseWeeks(base, 8, 10, 3, false)
    expect(weeks[3].recovery).toBe(true)
    expect(weeks[7].recovery).toBe(true)
    expect(weeks[0].recovery).toBe(false)
    expect(weeks[4].recovery).toBe(false)
  })

  it('drops recovery week mileage to roughly 70% of the prior build week', () => {
    const weeks = buildPhaseWeeks(base, 8, 10, 3, false)
    const recovery = weeks[3]
    const priorBuild = weeks[2]
    const ratio = recovery.weeklyMiles / priorBuild.weeklyMiles
    expect(ratio).toBeGreaterThan(0.6)
    expect(ratio).toBeLessThan(0.85)
    expect(recovery.recovery).toBe(true)
  })

  it('omits recovery weeks when recoveryEvery is 0', () => {
    // taper has recoveryEvery 0 - the whole phase is its own recovery.
    const weeks = buildPhaseWeeks(taper, 7, 44, 20, true)
    // No mid-phase recovery flags except possibly the final race week.
    const midRecovery = weeks.slice(0, -1).filter((w) => w.recovery)
    expect(midRecovery).toEqual([])
  })

  it('marks the last week as race week when isFinalPhase is true', () => {
    const weeks = buildPhaseWeeks(taper, 7, 44, 20, true)
    const last = weeks[weeks.length - 1]
    expect(last.race).toBe(true)
    expect(last.weeklyMiles).toBeLessThanOrEqual(8) // shakeout volume
    expect(last.longRunMiles).toBe(0)
  })

  it('does not mark race week when isFinalPhase is false', () => {
    const weeks = buildPhaseWeeks(peak, 6, 26, 10, false)
    expect(weeks.every((w) => !w.race)).toBe(true)
  })

  it('ramps the taper down from previous peak toward target', () => {
    const weeks = buildPhaseWeeks(taper, 7, 44, 20, true)
    // First taper week is high, race week is low.
    expect(weeks[0].weeklyMiles).toBeGreaterThan(weeks[weeks.length - 1].weeklyMiles)
    // Long run drops monotonically toward race week.
    for (let i = 1; i < weeks.length - 1; i++) {
      expect(weeks[i].longRunMiles).toBeLessThanOrEqual(weeks[i - 1].longRunMiles + 0.01)
    }
  })

  it('handles the minimum allowed phase length without crashing', () => {
    const weeks = buildPhaseWeeks(dev, dev.minWeeks, 22, 8, false)
    expect(weeks).toHaveLength(dev.minWeeks)
    const lastBuild = [...weeks].reverse().find((w) => !w.recovery && !w.race)!
    expect(lastBuild.weeklyMiles).toBe(dev.peakWeeklyMiles)
  })
})
