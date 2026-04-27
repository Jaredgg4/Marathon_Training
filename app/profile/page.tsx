import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/app/components/profile/ProfileEditor'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, race_type, goal_race_date, goal_finish_time, weekly_mileage, fitness_level')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit profile</h1>
          <p className="mt-2 text-sm text-gray-500">
            Changing your race date or training inputs will adjust your plan immediately.
          </p>
        </div>
        <ProfileEditor userId={user.id} initial={profile} />
      </div>
    </div>
  )
}
