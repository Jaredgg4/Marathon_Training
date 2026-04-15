'use client'

import { useState } from 'react'

type Props = {
  onNext: (data: { goal_race_date: string }) => void
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function RaceDateStep({ onNext }: Props) {
  const [date, setDate] = useState('')
  const [minDate] = useState(() => getTomorrow())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || date < minDate) return
    onNext({ goal_race_date: date })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          When is your race?
        </h2>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="race_date"
          className="block text-sm font-medium text-gray-700"
        >
          Race date
        </label>
        <input
          id="race_date"
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <button
        type="submit"
        disabled={!date}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  )
}
