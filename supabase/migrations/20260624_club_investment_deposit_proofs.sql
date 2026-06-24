-- Adds bank deposit and proof upload fields for the simplified private-club flow.
-- Run this on existing Supabase projects where 20260609_club_investor.sql was already applied.

ALTER TABLE public.club_investments
  ADD COLUMN IF NOT EXISTS deposit_bank_name text,
  ADD COLUMN IF NOT EXISTS deposit_bank_account text,
  ADD COLUMN IF NOT EXISTS deposit_bank_iban text,
  ADD COLUMN IF NOT EXISTS proof_file_name text,
  ADD COLUMN IF NOT EXISTS proof_file_type text,
  ADD COLUMN IF NOT EXISTS proof_file_size integer,
  ADD COLUMN IF NOT EXISTS proof_file_data_url text,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_club_investments_status
  ON public.club_investments(status);
