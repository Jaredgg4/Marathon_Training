import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const supabase = await createClient()

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    if (profileError) console.error('Profile fetch error:', profileError)

    if (profile?.onboarding_done) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    return NextResponse.redirect(`${origin}/onboarding`)
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
