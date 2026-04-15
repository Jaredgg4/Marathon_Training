'use client'

import { useState } from 'react'

type RaceType = 'marathon' | 'half_marathon' | '5k' | 'ironman'

type Props = {
  onNext: (data: { race_type: RaceType }) => void
}

const RACE_OPTIONS: { value: RaceType; label: string; distance: string }[] = [
  { value: 'marathon', label: 'Marathon', distance: '26.2 mi' },
  { value: 'half_marathon', label: 'Half Marathon', distance: '13.1 mi' },
  { value: '5k', label: '5K', distance: '3.1 mi' },
  { value: 'ironman', label: 'Ironman', distance: '140.6 mi' },
]

export default function RaceTypeStep({ onNext }: Props) {
  const [selected, setSelected] = useState<RaceType | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    onNext({ race_type: selected })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          What are you training for?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {RACE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
              selected === option.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">{option.label}</div>
            <div
              className={`text-xs mt-0.5 ${
                selected === option.value ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {option.distance}
            </div>
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!selected}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  )
}
