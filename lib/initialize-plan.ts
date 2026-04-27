import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { summarizeStravaFitness } from './strava-fitness'
import { getValidStravaAccessToken, fetchStravaActivitiesSince } from './strava-server'

const SNAPSHOT_WINDOW_DAYS = 6 * 7

export type PlanInitFields = {
  plan_start_date: string
  plan_starting_weekly_miles: number | null
  plan_starting_long_run_miles: number | null
}

export async function ensurePlanInitialized(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    plan_start_date: string | null
    plan_starting_weekly_miles: number | null
    plan_starting_long_run_miles: number | null
  },
): Promise<PlanInitFields> {
  const today = new Date()
  const todayIso = today.toISOString().split('T')[0]
  const planStartDate = profile.plan_start_date ?? todayIso
  const planStartTime = new Date(`${planStartDate}T00:00:00Z`)

  const updates: Partial<PlanInitFields> = {}
  if (!profile.plan_start_date) {
    updates.plan_start_date = todayIso
  }

  let startingWeekly = profile.plan_starting_weekly_miles
  let startingLong = profile.plan_starting_long_run_miles

  // Capture the Strava snapshot when the user has a connection but no snapshot yet.
  if (startingWeekly === null) {
    const session = await getValidStravaAccessToken(supabase, userId)
    if (session) {
      const sinceDate = new Date(planStartTime.getTime() - SNAPSHOT_WINDOW_DAYS * 86_400_000)
      const activities = await fetchStravaActivitiesSince(session.accessToken, sinceDate)
      if (activities) {
        const summary = summarizeStravaFitness(activities, planStartTime)
        if (summary) {
          startingWeekly = summary.weeklyMiles
          startingLong = summary.longestRunMiles
          updates.plan_starting_weekly_miles = summary.weeklyMiles
          updates.plan_starting_long_run_miles = summary.longestRunMiles
        }
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('id', userId)
  }

  return {
    plan_start_date: planStartDate,
    plan_starting_weekly_miles: startingWeekly,
    plan_starting_long_run_miles: startingLong,
  }
}
