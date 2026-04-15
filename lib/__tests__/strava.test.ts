import { describe, it, expect, beforeEach } from 'vitest'
import { isStravaTokenExpired, getStravaAuthUrl } from '../strava'

describe('isStravaTokenExpired', () => {
  it('returns true when token expiry is in the past', () => {
    const past = new Date(Date.now() - 1000)
    expect(isStravaTokenExpired(past)).toBe(true)
  })

  it('returns false when token expiry is in the future', () => {
    const future = new Date(Date.now() + 3_600_000)
    expect(isStravaTokenExpired(future)).toBe(false)
  })

  it('returns true when token expires exactly now', () => {
    const now = new Date()
    expect(isStravaTokenExpired(now)).toBe(true)
  })
})

describe('getStravaAuthUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID = 'test_client_123'
  })

  it('includes the redirect URI', () => {
    const url = getStravaAuthUrl('http://localhost:3000/auth/strava/callback')
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fstrava%2Fcallback')
  })

  it('includes activity:read_all scope', () => {
    const url = getStravaAuthUrl('http://localhost:3000/auth/strava/callback')
    expect(url).toContain('scope=activity%3Aread_all')
  })

  it('includes the client_id', () => {
    const url = getStravaAuthUrl('http://localhost:3000/auth/strava/callback')
    expect(url).toContain('client_id=test_client_123')
  })
})
