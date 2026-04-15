import Image from 'next/image'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Hero image — visible on lg screens and up */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/images/auth-hero.jpeg"
          alt="Two runners on a trail at sunrise"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Steppa</h1>
            <p className="mt-1 text-sm text-gray-500">Train smarter. Run further.</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
