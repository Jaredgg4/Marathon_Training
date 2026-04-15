'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NameStep from './steps/NameStep'
import RaceTypeStep from './steps/RaceTypeStep'
import RaceDateStep from './steps/RaceDateStep'
import GoalTimeStep from './steps/GoalTimeStep'
import FitnessStep from './steps/FitnessStep'

type OnboardingData = {
  display_name: string
  race_type: 'marathon' | 'half_marathon' | '5k' | 'ironman'
  goal_race_date: string
  goal_finish_hours: number
  goal_finish_minutes: number
  weekly_mileage: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
}

const STEP_LABELS = ['Name', 'Race', 'Date', 'Time', 'Fitness']

export default function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(finalData: OnboardingData) {
    setError(null)
    setSubmitting(true)
    const interval = `${finalData.goal_finish_hours} hours ${finalData.goal_finish_minutes} minutes`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: finalData.display_name,
        race_type: finalData.race_type,
        goal_race_date: finalData.goal_race_date,
        goal_finish_time: interval,
        weekly_mileage: finalData.weekly_mileage,
        fitness_level: finalData.fitness_level,
        onboarding_done: true,
      })
      .eq('id', userId)

    if (updateError) {
      setError('Failed to save your profile. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleNext(stepData: Partial<OnboardingData>) {
    const merged = { ...data, ...stepData }
    setData(merged)

    if (step < STEP_LABELS.length - 1) {
      setStep(step + 1)
    } else {
      await handleSubmit(merged as OnboardingData)
    }
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  i <= step ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1 text-center">
              <span
                className={`text-xs ${
                  i === step
                    ? 'font-bold text-black'
                    : 'font-normal text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Step content */}
      {step === 0 && <NameStep onNext={handleNext} />}
      {step === 1 && <RaceTypeStep onNext={handleNext} />}
      {step === 2 && <RaceDateStep onNext={handleNext} />}
      {step === 3 && <GoalTimeStep onNext={handleNext} />}
      {step === 4 && <FitnessStep onNext={handleNext} submitting={submitting} />}
    </div>
  )
}
