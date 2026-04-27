import { describe, it, expect } from 'vitest'
import { derivePaces, formatPace } from '../plan-generator/paces'

describe('derivePaces', () => {
  it('computes goal pace from finish time and distance', () => {
    // 4:00:00 marathon over 26.2188 mi = ~9:09/mi
    const paces = derivePaces({ hours: 4, minutes: 0 }, 'marathon')
    expect(paces.goalPaceMinPerMile).toBeCloseTo(240 / 26.2188, 2)
  })

  it('places easy pace ~90s slower than goal pace', () => {
    const paces = derivePaces({ hours: 4, minutes: 0 }, 'marathon')
    const diff = paces.easyPaceMinPerMile! - paces.goalPaceMinPerMile!
    expect(diff).toBeCloseTo(1.5, 2)
  })

  it('places tempo pace ~15s slower than goal pace', () => {
    const paces = derivePaces({ hours: 4, minutes: 0 }, 'marathon')
    const diff = paces.tempoPaceMinPerMile! - paces.goalPaceMinPerMile!
    expect(diff).toBeCloseTo(0.25, 2)
  })

  it('handles half marathon distances', () => {
    const paces = derivePaces({ hours: 1, minutes: 45 }, 'half_marathon')
    expect(paces.goalPaceMinPerMile).toBeCloseTo(105 / 13.1094, 2)
  })

  it('handles 5k distances', () => {
    const paces = derivePaces({ hours: 0, minutes: 24 }, '5k')
    expect(paces.goalPaceMinPerMile).toBeCloseTo(24 / 3.10686, 2)
  })

  it('returns null paces when goal time is zero', () => {
    const paces = derivePaces({ hours: 0, minutes: 0 }, 'marathon')
    expect(paces.goalPaceMinPerMile).toBeNull()
    expect(paces.tempoPaceMinPerMile).toBeNull()
    expect(paces.easyPaceMinPerMile).toBeNull()
  })
})

describe('formatPace', () => {
  it('formats decimal minutes as M:SS/mi', () => {
    expect(formatPace(9.25)).toBe('9:15/mi')
    expect(formatPace(8.5)).toBe('8:30/mi')
    expect(formatPace(10)).toBe('10:00/mi')
  })

  it('returns em dash when null', () => {
    expect(formatPace(null)).toBe('—')
  })

  it('rounds seconds correctly', () => {
    expect(formatPace(7 + 59 / 60)).toBe('7:59/mi')
  })
})
