import { describe, it, expect } from 'vitest'
import { RACE_PHASES, type RaceType } from '../plan-generator/phases'

const RACE_TYPES: RaceType[] = ['marathon', 'half_marathon', '5k', 'ironman']

describe('RACE_PHASES', () => {
  it('defines a phase list for every supported race type', () => {
    for (const r of RACE_TYPES) {
      expect(RACE_PHASES[r]).toBeDefined()
      expect(RACE_PHASES[r].length).toBeGreaterThanOrEqual(3)
    }
  })

  it('has exactly one taper phase per race type, as the last phase', () => {
    for (const r of RACE_TYPES) {
      const phases = RACE_PHASES[r]
      const taperCount = phases.filter((p) => p.id === 'taper').length
      expect(taperCount).toBe(1)
      expect(phases[phases.length - 1].id).toBe('taper')
    }
  })

  it('keeps minWeeks <= idealWeeks for every phase', () => {
    for (const r of RACE_TYPES) {
      for (const p of RACE_PHASES[r]) {
        expect(p.minWeeks).toBeLessThanOrEqual(p.idealWeeks)
        expect(p.minWeeks).toBeGreaterThan(0)
      }
    }
  })

  it('protects the taper highest in every race type', () => {
    for (const r of RACE_TYPES) {
      const phases = RACE_PHASES[r]
      const taperPriority = phases.find((p) => p.id === 'taper')!.priority
      const otherPriorities = phases.filter((p) => p.id !== 'taper').map((p) => p.priority)
      for (const op of otherPriorities) {
        expect(op).toBeLessThan(taperPriority)
      }
    }
  })

  it('hits the published peak long run targets for the race', () => {
    const peakOf = (r: RaceType) =>
      Math.max(...RACE_PHASES[r].filter((p) => p.id !== 'taper').map((p) => p.peakLongRunMiles))
    expect(peakOf('marathon')).toBe(20)
    expect(peakOf('half_marathon')).toBeGreaterThanOrEqual(10)
    expect(peakOf('half_marathon')).toBeLessThanOrEqual(12)
    expect(peakOf('5k')).toBeGreaterThanOrEqual(6)
    expect(peakOf('5k')).toBeLessThanOrEqual(8)
    expect(peakOf('ironman')).toBeGreaterThanOrEqual(22)
    expect(peakOf('ironman')).toBeLessThanOrEqual(26)
  })
})
