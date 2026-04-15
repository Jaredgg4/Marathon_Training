import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeStravaCode } from '@/lib/strava'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=strava_denied`)
    }

    const { athlete, access_token, refresh_token, expires_at } =
      await exchangeStravaCode(code)

    if (!athlete?.id || !access_token || !refresh_token || !expires_at) {
      throw new Error('Invalid Strava token response')
    }

    const email = `strava_${athlete.id}@steppa.app`
    const adminClient = createAdminClient()

    // Find or create the Supabase user via magic link generation
    let linkResult = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkResult.error) {
      // User doesn't exist yet — create it first, then generate link
      const { error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { strava_athlete_id: athlete.id },
      })

      if (createError) {
        throw createError
      }

      linkResult = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      if (linkResult.error) {
        throw linkResult.error
      }
    }

    const hashed_token = linkResult.data.properties?.hashed_token
    if (!hashed_token) {
      throw new Error('No hashed_token returned from generateLink')
    }

    // Establish a real session using the hashed token
    const supabase = await createClient()
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: hashed_token,
      type: 'email',
    })

    if (sessionError || !sessionData.user || !sessionData.session) {
      throw sessionError ?? new Error('Session creation failed')
    }

    // Upsert Strava connection (admin client bypasses RLS)
    const { error: upsertError } = await adminClient
      .from('strava_connections')
      .upsert(
        {
          user_id: sessionData.user.id,
          strava_athlete_id: athlete.id,
          access_token,
          refresh_token,
          expires_at: new Date(expires_at * 1000).toISOString(),
        },
        { onConflict: 'strava_athlete_id' }
      )

    if (upsertError) {
      throw upsertError
    }

    // Check onboarding status and redirect accordingly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', sessionData.user.id)
      .single()

    if (profileError) console.error('Profile fetch error:', profileError)

    if (profile?.onboarding_done) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    return NextResponse.redirect(`${origin}/onboarding`)
  } catch (err) {
    console.error('[strava/callback] error:', err)
    return NextResponse.redirect(new URL('/login?error=strava_failed', request.url))
  }
}
