import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const AUTH_ROUTES = ['/login', '/signup', '/reset-password', '/update-password']

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Always allow OAuth callbacks through
  if (pathname.startsWith('/auth/')) {
    return supabaseResponse
  }

  // Unauthenticated: only auth pages are accessible
  if (!user) {
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Authenticated: redirect away from auth pages
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Authenticated + not on onboarding: check if onboarding is complete
  if (pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.onboarding_done) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
