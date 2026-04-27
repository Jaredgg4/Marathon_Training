'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type RaceType = 'marathon' | 'half_marathon' | '5k' | 'ironman'
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

type InitialProfile = {
  display_name: string | null
  race_type: string | null
  goal_race_date: string | null
  goal_finish_time: string | null
  weekly_mileage: number | null
  fitness_level: string | null
}

type Props = {
  userId: string
  initial: InitialProfile
}

const RACE_OPTIONS: { value: RaceType; label: string; distance: string }[] = [
  { value: 'marathon', label: 'Marathon', distance: '26.2 mi' },
  { value: 'half_marathon', label: 'Half Marathon', distance: '13.1 mi' },
  { value: '5k', label: '5K', distance: '3.1 mi' },
  { value: 'ironman', label: 'Ironman', distance: '140.6 mi' },
]

const FITNESS_OPTIONS: { value: FitnessLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to running or training for first race' },
  { value: 'intermediate', label: 'Intermediate', description: 'Running consistently, completed 1–2 races' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced racer, running 30+ miles/week' },
]

function parseInterval(value: string | null): { hours: number; minutes: number } {
  if (!value) return { hours: 4, minutes: 0 }
  const colon = value.match(/^(\d+):(\d+):(\d+)/)
  if (colon) return { hours: Number(colon[1]), minutes: Number(colon[2]) }
  const text = value.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i)
  if (text) return { hours: Number(text[1]), minutes: Number(text[2] ?? 0) }
  return { hours: 4, minutes: 0 }
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export default function ProfileEditor({ userId, initial }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const initialFinish = parseInterval(initial.goal_finish_time)

  const [displayName, setDisplayName] = useState(initial.display_name ?? '')
  const [raceType, setRaceType] = useState<RaceType>((initial.race_type as RaceType) ?? 'marathon')
  const [raceDate, setRaceDate] = useState(initial.goal_race_date ?? '')
  const [hours, setHours] = useState(String(initialFinish.hours))
  const [minutes, setMinutes] = useState(String(initialFinish.minutes))
  const [mileage, setMileage] = useState(initial.weekly_mileage != null ? String(initial.weekly_mileage) : '')
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    (initial.fitness_level as FitnessLevel) ?? 'intermediate',
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minRaceDate = todayIso()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!raceDate || raceDate < minRaceDate) {
      setError('Race date must be in the future.')
      return
    }
    const numericMileage = Number(mileage)
    if (mileage && (Number.isNaN(numericMileage) || numericMileage < 0 || numericMileage > 200)) {
      setError('Weekly mileage must be between 0 and 200.')
      return
    }

    setSubmitting(true)
    const interval = `${Number(hours) || 0} hours ${Number(minutes) || 0} minutes`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        race_type: raceType,
        goal_race_date: raceDate,
        goal_finish_time: interval,
        weekly_mileage: numericMileage || 0,
        fitness_level: fitnessLevel,
      })
      .eq('id', userId)

    if (updateError) {
      setError('Could not save changes. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
          Display name
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Race type</label>
        <div className="grid grid-cols-2 gap-3">
          {RACE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRaceType(opt.value)}
              className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
                raceType === opt.value
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className={`text-xs mt-0.5 ${raceType === opt.value ? 'text-gray-300' : 'text-gray-500'}`}>
                {opt.distance}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="race_date" className="block text-sm font-medium text-gray-700">
          Race date
        </label>
        <input
          id="race_date"
          type="date"
          value={raceDate}
          min={minRaceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Goal finish time</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="text-sm text-gray-500">hours</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="weekly_mileage" className="block text-sm font-medium text-gray-700">
          Weekly mileage
        </label>
        <input
          id="weekly_mileage"
          type="number"
          min={0}
          max={200}
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder="20"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Fitness level</label>
        {FITNESS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFitnessLevel(opt.value)}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              fitnessLevel === opt.value
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">{opt.label}</div>
            <div className={`text-xs mt-0.5 ${fitnessLevel === opt.value ? 'text-gray-300' : 'text-gray-500'}`}>
              {opt.description}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
