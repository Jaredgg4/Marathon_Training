-- Captures the inputs the plan generator uses, frozen at plan creation so that
-- the generated plan stays stable across renders even as Strava activity history
-- accumulates after the user starts training.
ALTER TABLE public.profiles
  ADD COLUMN plan_start_date              date,
  ADD COLUMN plan_starting_weekly_miles   numeric,
  ADD COLUMN plan_starting_long_run_miles numeric;
