import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarathonPlan from '@/app/components/MarathonPlan'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, race_type, goal_race_date, goal_finish_time, weekly_mileage, fitness_level')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    redirect('/onboarding')
  }

  return (
    <MarathonPlan
      displayName={profile?.display_name ?? undefined}
      raceType={profile?.race_type ?? undefined}
      goalRaceDate={profile?.goal_race_date ?? undefined}
      goalFinishTime={profile?.goal_finish_time ?? undefined}
      weeklyMileage={profile?.weekly_mileage ?? undefined}
      fitnessLevel={profile?.fitness_level ?? undefined}
    />
  )
}
