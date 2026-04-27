import { describe, it, expect } from 'vitest'
import { allocateWeeks } from '../plan-generator/allocate'
import { RACE_PHASES } from '../plan-generator/phases'

describe('allocateWeeks', () => {
  const marathon = RACE_PHASES.marathon
  const idealTotal = marathon.reduce((s, p) => s + p.idealWeeks, 0) // 8+8+6+7 = 29
  const minTotal = marathon.reduce((s, p) => s + p.minWeeks, 0)     // 4+5+4+3 = 16

  it('gives every phase its idealWeeks when timeline fits exactly', () => {
    const { allocations, warnings } = allocateWeeks(marathon, idealTotal)
    expect(allocations.map((a) => a.weeks)).toEqual([8, 8, 6, 7])
    expect(warnings).toEqual([])
  })

  it('pads base when timeline exceeds ideal', () => {
    const { allocations, warnings } = allocateWeeks(marathon, idealTotal + 5)
    const totalWeeks = allocations.reduce((s, a) => s + a.weeks, 0)
    expect(totalWeeks).toBe(idealTotal + 5)
    // The base phase absorbs the extra weeks; other phases stay at their ideal.
    const base = allocations.find((a) => a.phase.id === 'base')!
    expect(base.weeks).toBe(8 + 5)
    expect(allocations.find((a) => a.phase.id === 'taper')!.weeks).toBe(7)
    expect(warnings).toEqual([])
  })

  it('emits TIMELINE_VERY_LONG and caps padding at +12 weeks', () => {
    const { allocations, warnings } = allocateWeeks(marathon, idealTotal + 50)
    const base = allocations.find((a) => a.phase.id === 'base')!
    expect(base.weeks).toBe(8 + 12)
    expect(warnings.some((w) => w.code === 'TIMELINE_VERY_LONG')).toBe(true)
  })

  it('shrinks lowest-priority phase first when timeline is tight', () => {
    // 29 - 5 = 24 weeks. Need to remove 5 weeks. Base has priority 1 (shrinks first).
    // Base goes from 8 to 4 (-4), still need 1 more. Development priority 2 -> 7.
    const { allocations, warnings } = allocateWeeks(marathon, idealTotal - 5)
    expect(allocations.find((a) => a.phase.id === 'base')!.weeks).toBe(4)
    expect(allocations.find((a) => a.phase.id === 'development')!.weeks).toBe(7)
    expect(allocations.find((a) => a.phase.id === 'peak')!.weeks).toBe(6)
    expect(allocations.find((a) => a.phase.id === 'taper')!.weeks).toBe(7)
    expect(warnings).toEqual([])
  })

  it('protects the taper highest priority', () => {
    // Compress hard - everything should shrink to min before taper does.
    const { allocations } = allocateWeeks(marathon, minTotal + 1)
    const taper = allocations.find((a) => a.phase.id === 'taper')!
    expect(taper.weeks).toBeGreaterThanOrEqual(taper.phase.minWeeks)
    // Taper should be at minWeeks + at most 1 above (since it shrinks last)
    expect(taper.weeks).toBeLessThanOrEqual(taper.phase.minWeeks + 1)
  })

  it('emits TIMELINE_TOO_SHORT and floors phases at minWeeks when below the floor', () => {
    const { allocations, warnings } = allocateWeeks(marathon, minTotal - 5)
    const totalWeeks = allocations.reduce((s, a) => s + a.weeks, 0)
    expect(totalWeeks).toBe(minTotal)
    for (const a of allocations) {
      expect(a.weeks).toBe(a.phase.minWeeks)
    }
    expect(warnings.some((w) => w.code === 'TIMELINE_TOO_SHORT')).toBe(true)
  })

  it('returns allocations in the same order as the input phases', () => {
    const { allocations } = allocateWeeks(marathon, idealTotal)
    expect(allocations.map((a) => a.phase.id)).toEqual(['base', 'development', 'peak', 'taper'])
  })
})
