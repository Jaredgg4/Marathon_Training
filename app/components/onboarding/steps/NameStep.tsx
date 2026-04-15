'use client'

import { useState } from 'react'

type Props = {
  onNext: (data: { display_name: string }) => void
}

export default function NameStep({ onNext }: Props) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onNext({ display_name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          What should we call you?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This will be shown on your profile
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700"
        >
          Display name
        </label>
        <input
          id="display_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  )
}
