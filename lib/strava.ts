export interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: StravaAthlete
}

export interface StravaAthlete {
  id: number
  email: string
  firstname: string
  lastname: string
}

export interface StravaRefreshResponse {
  access_token: string
  refresh_token: string
  expires_at: number
}

export function getStravaAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all',
    approval_prompt: 'auto',
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Strava token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaRefreshResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Strava token refresh failed: ${response.statusText}`)
  }

  return response.json()
}

export function isStravaTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt
}
