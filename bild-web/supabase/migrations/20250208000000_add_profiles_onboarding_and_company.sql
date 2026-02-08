-- Add company and onboarding fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
COMMENT ON COLUMN public.profiles.company_name IS 'Company/organization name from onboarding';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'When user completed onboarding (null = not done)';

