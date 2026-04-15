'use client'

import { useState } from 'react'

type Props = {
  onNext: (data: { goal_finish_hours: number; goal_finish_minutes: number }) => void
}

export default function GoalTimeStep({ onNext }: Props) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    if (h === 0 && m === 0) return
    onNext({ goal_finish_hours: h, goal_finish_minutes: m })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          What&apos;s your goal finish time?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Don&apos;t worry, you can update this later
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <label
            htmlFor="goal_hours"
            className="block text-sm font-medium text-gray-700"
          >
            Hours
          </label>
          <input
            id="goal_hours"
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label
            htmlFor="goal_minutes"
            className="block text-sm font-medium text-gray-700"
          >
            Minutes
          </label>
          <input
            id="goal_minutes"
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!(parseInt(hours) || 0) && !(parseInt(minutes) || 0)}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  )
}
