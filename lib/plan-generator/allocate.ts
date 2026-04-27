import type { PhaseTemplate } from './phases'
import type { Warning } from './types'

export type PhaseAllocation = {
  phase: PhaseTemplate
  weeks: number
}

export type AllocationResult = {
  allocations: PhaseAllocation[]
  warnings: Warning[]
}

const MAX_BASE_PADDING = 12

export function allocateWeeks(phases: PhaseTemplate[], availableWeeks: number): AllocationResult {
  const warnings: Warning[] = []
  const idealTotal = phases.reduce((s, p) => s + p.idealWeeks, 0)
  const minTotal = phases.reduce((s, p) => s + p.minWeeks, 0)

  // Below the floor: every phase at min, warn the user.
  if (availableWeeks < minTotal) {
    warnings.push({
      code: 'TIMELINE_TOO_SHORT',
      message: `You have ${availableWeeks} weeks before race day, but this race needs at least ${minTotal} weeks for a minimum-viable plan. Plan compressed to fit; expect a tougher build.`,
    })
    return {
      allocations: phases.map((p) => ({ phase: p, weeks: p.minWeeks })),
      warnings,
    }
  }

  // Exactly fits or has slack: pad base.
  if (availableWeeks >= idealTotal) {
    const slack = availableWeeks - idealTotal
    const basePadding = Math.min(slack, MAX_BASE_PADDING)
    if (slack > MAX_BASE_PADDING) {
      warnings.push({
        code: 'TIMELINE_VERY_LONG',
        message: `You have ${availableWeeks} weeks before race day; the plan caps base padding at ${MAX_BASE_PADDING} extra weeks. Earlier weeks beyond that will be easy maintenance.`,
      })
    }
    const allocations = phases.map((p) => ({
      phase: p,
      weeks: p.id === 'base' ? p.idealWeeks + basePadding : p.idealWeeks,
    }))
    return { allocations, warnings }
  }

  // Tight but feasible: shrink in priority order until we fit.
  const weeks: number[] = phases.map((p) => p.idealWeeks)
  let need = idealTotal - availableWeeks
  // Sort indices ascending by priority - lowest priority shrinks first.
  const order = phases
    .map((p, i) => ({ priority: p.priority, i }))
    .sort((a, b) => a.priority - b.priority)
    .map((x) => x.i)

  for (const i of order) {
    if (need <= 0) break
    const headroom = phases[i].idealWeeks - phases[i].minWeeks
    const take = Math.min(headroom, need)
    weeks[i] -= take
    need -= take
  }

  const allocations = phases.map((p, i) => ({ phase: p, weeks: weeks[i] }))
  return { allocations, warnings }
}
