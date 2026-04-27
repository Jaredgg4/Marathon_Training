export type WarningCode =
  | 'TIMELINE_TOO_SHORT'
  | 'TIMELINE_VERY_LONG'
  | 'STRAVA_BELOW_REPORTED'
  | 'STRAVA_ABOVE_REPORTED'

export type Warning = {
  code: WarningCode
  message: string
}
