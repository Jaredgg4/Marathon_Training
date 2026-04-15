CREATE TABLE public.strava_connections (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id  bigint NOT NULL UNIQUE,
  access_token       text NOT NULL,
  refresh_token      text NOT NULL,
  expires_at         timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Strava connection"
  ON public.strava_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Strava connection"
  ON public.strava_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Strava connection"
  ON public.strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Index for RLS policy performance (user_id is not indexed by default on FK columns)
CREATE INDEX ON public.strava_connections (user_id);
