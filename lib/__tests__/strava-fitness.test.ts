import { describe, it, expect } from 'vitest'
import { summarizeStravaFitness } from '../strava-fitness'
import type { StravaActivity } from '../../app/data/plan'

let id = 1
function run(date: string, miles: number, type: 'Run' | 'Ride' = 'Run'): StravaActivity {
  return {
    id: id++,
    name: 'r',
    type,
    distance: miles * 1609.34,
    moving_time: 1800,
    start_date_local: `${date}T07:00:00Z`,
  }
}

const ASOF = new Date('2026-04-27T00:00:00Z')

describe('summarizeStravaFitness', () => {
  it('returns null when fewer than 2 activities in the window', () => {
    const acts = [run('2026-04-20', 5)]
    expect(summarizeStravaFitness(acts, ASOF)).toBeNull()
  })

  it('returns null when no activities', () => {
    expect(summarizeStravaFitness([], ASOF)).toBeNull()
  })

  it('returns null when sample covers fewer than 4 weeks', () => {
    // 5 runs in 2 ISO weeks should be rejected as too narrow.
    const acts = [
      run('2026-04-20', 4),
      run('2026-04-22', 6),
      run('2026-04-24', 10),
      run('2026-04-13', 3),
      run('2026-04-15', 5),
    ]
    expect(summarizeStravaFitness(acts, ASOF)).toBeNull()
  })

  it('averages weekly miles across the window and reports the longest run', () => {
    // Five different ISO weeks.
    const acts = [
      run('2026-03-25', 4),
      run('2026-04-01', 6),
      run('2026-04-08', 10), // longest
      run('2026-04-15', 3),
      run('2026-04-22', 5),
    ]
    const result = summarizeStravaFitness(acts, ASOF)
    expect(result).not.toBeNull()
    expect(result!.longestRunMiles).toBe(10)
    expect(result!.sampleWeeks).toBe(5)
    // Total miles 4+6+10+3+5 = 28; weeklyMiles = 28 / 5 = 5.6
    expect(result!.weeklyMiles).toBeCloseTo(5.6, 1)
  })

  it('ignores activities outside the window', () => {
    const acts = [
      run('2026-03-25', 8),
      run('2026-04-01', 9),
      run('2026-04-08', 10),
      run('2026-04-15', 11),
      run('2026-04-22', 12),
      run('2025-12-01', 50), // way outside
    ]
    const result = summarizeStravaFitness(acts, ASOF)
    expect(result).not.toBeNull()
    expect(result!.longestRunMiles).toBe(12)
  })

  it('ignores non-Run activity types', () => {
    const acts = [
      run('2026-03-25', 4),
      run('2026-04-01', 5),
      run('2026-04-08', 6),
      run('2026-04-15', 7),
      run('2026-04-22', 50, 'Ride'), // bike ride
    ]
    const result = summarizeStravaFitness(acts, ASOF)
    expect(result).not.toBeNull()
    expect(result!.longestRunMiles).toBe(7)
  })

  it('respects sport_type when type is generic', () => {
    const acts: StravaActivity[] = [
      { id: 1, name: 'a', type: 'Workout', sport_type: 'Run', distance: 5 * 1609.34, moving_time: 1800, start_date_local: '2026-03-25T07:00:00Z' },
      { id: 2, name: 'b', type: 'Workout', sport_type: 'Run', distance: 6 * 1609.34, moving_time: 1800, start_date_local: '2026-04-01T07:00:00Z' },
      { id: 3, name: 'c', type: 'Workout', sport_type: 'Run', distance: 7 * 1609.34, moving_time: 1800, start_date_local: '2026-04-08T07:00:00Z' },
      { id: 4, name: 'd', type: 'Workout', sport_type: 'Run', distance: 8 * 1609.34, moving_time: 1800, start_date_local: '2026-04-15T07:00:00Z' },
    ]
    const result = summarizeStravaFitness(acts, ASOF)
    expect(result).not.toBeNull()
    expect(result!.longestRunMiles).toBe(8)
  })
})
