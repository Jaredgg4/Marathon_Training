import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarathonPlan from '@/app/components/MarathonPlan'
import { generatePlan, type RaceType, type FitnessLevel } from '@/lib/plan-generator'
import { ensurePlanInitialized } from '@/lib/initialize-plan'
import {
  getValidStravaAccessToken,
  fetchStravaAthlete,
  fetchStravaActivitiesSince,
} from '@/lib/strava-server'

function parseInterval(value: string | null | undefined): { hours: number; minutes: number } {
  if (!value) return { hours: 0, minutes: 0 }
  // Postgres returns intervals as "HH:MM:SS" for sub-day values.
  const colon = value.match(/^(\d+):(\d+):(\d+)/)
  if (colon) return { hours: Number(colon[1]), minutes: Number(colon[2]) }
  const text = value.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i)
  if (text) return { hours: Number(text[1]), minutes: Number(text[2] ?? 0) }
  return { hours: 0, minutes: 0 }
}

const VALID_RACE_TYPES: ReadonlySet<RaceType> = new Set([
  'marathon',
  'half_marathon',
  '5k',
  'ironman',
])
const VALID_FITNESS: ReadonlySet<FitnessLevel> = new Set([
  'beginner',
  'intermediate',
  'advanced',
])

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'display_name, race_type, goal_race_date, goal_finish_time, weekly_mileage, fitness_level, plan_start_date, plan_starting_weekly_miles, plan_starting_long_run_miles',
    )
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    redirect('/onboarding')
  }

  if (
    !profile?.race_type ||
    !profile.goal_race_date ||
    !VALID_RACE_TYPES.has(profile.race_type as RaceType) ||
    !profile.fitness_level ||
    !VALID_FITNESS.has(profile.fitness_level as FitnessLevel)
  ) {
    redirect('/onboarding')
  }

  const initFields = await ensurePlanInitialized(supabase, user.id, {
    plan_start_date: profile.plan_start_date,
    plan_starting_weekly_miles: profile.plan_starting_weekly_miles,
    plan_starting_long_run_miles: profile.plan_starting_long_run_miles,
  })

  const planStartDate = new Date(`${initFields.plan_start_date}T00:00:00Z`)
  const raceDate = new Date(`${profile.goal_race_date}T00:00:00Z`)

  const { phases, warnings } = generatePlan({
    planStartDate,
    raceDate,
    raceType: profile.race_type as RaceType,
    fitnessLevel: profile.fitness_level as FitnessLevel,
    selfReportedWeeklyMiles: profile.weekly_mileage ?? 0,
    goalFinishTime: parseInterval(profile.goal_finish_time),
    stravaStartingWeeklyMiles: initFields.plan_starting_weekly_miles ?? undefined,
    stravaStartingLongRunMiles: initFields.plan_starting_long_run_miles ?? undefined,
  })

  const totalWeeks = phases.reduce((s, p) => s + p.weeks.length, 0)

  // If the user signed in through Strava OAuth, the access token lives in
  // strava_connections — fetch their profile + activities so the UI hydrates
  // without forcing them through the manual paste flow.
  const stravaSession = await getValidStravaAccessToken(supabase, user.id)
  const [stravaAthlete, stravaActivities] = stravaSession
    ? await Promise.all([
        fetchStravaAthlete(stravaSession.accessToken),
        fetchStravaActivitiesSince(stravaSession.accessToken, planStartDate),
      ])
    : [null, null]

  return (
    <MarathonPlan
      displayName={profile.display_name ?? undefined}
      raceType={profile.race_type}
      goalRaceDate={profile.goal_race_date}
      goalFinishTime={profile.goal_finish_time ?? undefined}
      weeklyMileage={profile.weekly_mileage ?? undefined}
      fitnessLevel={profile.fitness_level}
      phases={phases}
      warnings={warnings}
      planStartIso={initFields.plan_start_date}
      raceDateIso={profile.goal_race_date}
      totalWeeks={totalWeeks}
      initialAthlete={stravaAthlete ?? undefined}
      initialActs={stravaActivities ?? undefined}
    />
  )
}
