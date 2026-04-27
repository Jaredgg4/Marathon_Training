import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { refreshStravaToken } from './strava'
import type { StravaActivity, StravaAthlete } from '../app/data/plan'

const REFRESH_LEEWAY_SECONDS = 5 * 60

type StravaConnectionRow = {
  access_token: string
  refresh_token: string
  expires_at: string
  strava_athlete_id: number
}

/**
 * Returns a valid access token for the user's Strava connection, refreshing
 * via the Strava API and updating the connection row when the stored token
 * is within REFRESH_LEEWAY_SECONDS of expiry. Returns null if the user has
 * no connection or the refresh fails.
 */
export async function getValidStravaAccessToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ accessToken: string; athleteId: number } | null> {
  const { data: row } = await supabase
    .from('strava_connections')
    .select('access_token, refresh_token, expires_at, strava_athlete_id')
    .eq('user_id', userId)
    .maybeSingle<StravaConnectionRow>()

  if (!row) return null

  const expiresAtMs = new Date(row.expires_at).getTime()
  const aboutToExpire = expiresAtMs - Date.now() < REFRESH_LEEWAY_SECONDS * 1000

  if (!aboutToExpire) {
    return { accessToken: row.access_token, athleteId: row.strava_athlete_id }
  }

  try {
    const refreshed = await refreshStravaToken(row.refresh_token)
    await supabase
      .from('strava_connections')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      })
      .eq('user_id', userId)
    return { accessToken: refreshed.access_token, athleteId: row.strava_athlete_id }
  } catch {
    return null
  }
}

export async function fetchStravaAthlete(accessToken: string): Promise<StravaAthlete | null> {
  try {
    const r = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!r.ok) return null
    const data = await r.json()
    return {
      id: data.id,
      firstname: data.firstname ?? '',
      lastname: data.lastname ?? '',
      profile_medium: data.profile_medium,
    }
  } catch {
    return null
  }
}

export async function fetchStravaActivitiesSince(
  accessToken: string,
  sinceDate: Date,
  perPage = 200,
): Promise<StravaActivity[] | null> {
  const since = Math.floor(sinceDate.getTime() / 1000)
  const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&after=${since}`
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!r.ok) return null
    const raw = await r.json()
    return Array.isArray(raw) ? (raw as StravaActivity[]) : null
  } catch {
    return null
  }
}
