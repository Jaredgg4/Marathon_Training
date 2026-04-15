'use client'

import { useState } from 'react'

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

type Props = {
  onNext: (data: { weekly_mileage: number; fitness_level: FitnessLevel }) => void
  submitting: boolean
}

const FITNESS_OPTIONS: {
  value: FitnessLevel
  label: string
  description: string
}[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to running or training for first race',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Running consistently, completed 1\u20132 races',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced racer, running 30+ miles/week',
  },
]

export default function FitnessStep({ onNext, submitting }: Props) {
  const [mileage, setMileage] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fitnessLevel) return
    onNext({
      weekly_mileage: Number(mileage) || 0,
      fitness_level: fitnessLevel,
    })
  }

  const isDisabled = !fitnessLevel || submitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Tell us about your fitness
        </h2>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="weekly_mileage"
          className="block text-sm font-medium text-gray-700"
        >
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="space-y-2">
        {FITNESS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFitnessLevel(option.value)}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              fitnessLevel === option.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">{option.label}</div>
            <div
              className={`text-xs mt-0.5 ${
                fitnessLevel === option.value ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {option.description}
            </div>
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
      >
        {submitting ? 'Saving...' : 'Start training'}
      </button>
    </form>
  )
}
