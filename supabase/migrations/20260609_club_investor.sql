-- Club Investor Nawabus persistence.
-- Run this in the same Supabase project used by the Nawabus apps.
-- This migration only creates club_investor/club_investment namespaced objects;
-- it does not alter existing Nawabus tables, profile roles, ticket payments, or
-- payment_transactions.

CREATE TABLE IF NOT EXISTS public.club_investor_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  national_id text,
  bank_name text,
  iban text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_investor_packages (
  code text PRIMARY KEY,
  name text NOT NULL,
  min_amount numeric(14,2) NOT NULL,
  max_amount numeric(14,2) NOT NULL,
  guarantee_rate numeric(6,5) NOT NULL,
  model text NOT NULL,
  benefit text NOT NULL,
  sort_order integer NOT NULL
);

INSERT INTO public.club_investor_packages (
  code,
  name,
  min_amount,
  max_amount,
  guarantee_rate,
  model,
  benefit,
  sort_order
) VALUES
  ('plano21', 'Plano 21', 1000000, 24999999, 0.21, 'Retorno mensal', '21% ao ano, pago mensalmente durante 12 meses.', 1),
  ('plano23', 'Plano 23', 25000000, 74999999, 0.23, 'Retorno mensal', '23% ao ano, pago mensalmente durante 12 meses.', 2),
  ('plano25', 'Plano 25', 75000000, 125000000, 0.25, 'Retorno mensal', '25% ao ano, pago mensalmente durante 12 meses.', 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  guarantee_rate = EXCLUDED.guarantee_rate,
  model = EXCLUDED.model,
  benefit = EXCLUDED.benefit,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.club_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.club_investor_accounts(id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  package_code text NOT NULL REFERENCES public.club_investor_packages(code),
  package_name text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 1000000),
  quota numeric(12,8) NOT NULL CHECK (quota > 0),
  monthly_net_profit numeric(14,2) NOT NULL,
  expected_monthly_return numeric(14,2) NOT NULL,
  expected_annual_return numeric(14,2) NOT NULL,
  minimum_annual_return numeric(14,2) NOT NULL,
  guarantee_rate numeric(6,5) NOT NULL,
  asset_code text NOT NULL DEFAULT 'NB-2026-014',
  route_label text NOT NULL DEFAULT 'Luanda-Huambo',
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'under_review', 'active', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_investment_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL UNIQUE REFERENCES public.club_investments(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  entity text NOT NULL DEFAULT '1219',
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'AOA',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  reference_url text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_investor_accounts_auth_user_id
  ON public.club_investor_accounts(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_club_investments_account_id
  ON public.club_investments(account_id);

CREATE INDEX IF NOT EXISTS idx_club_investments_auth_user_id
  ON public.club_investments(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_club_investment_references_reference
  ON public.club_investment_references(reference);

ALTER TABLE public.club_investor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_investor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_investment_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Investor can view own account" ON public.club_investor_accounts;
CREATE POLICY "Investor can view own account"
  ON public.club_investor_accounts
  FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Investor can update own account" ON public.club_investor_accounts;
CREATE POLICY "Investor can update own account"
  ON public.club_investor_accounts
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Anyone can view investor packages" ON public.club_investor_packages;
CREATE POLICY "Anyone can view investor packages"
  ON public.club_investor_packages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Investor can view own investments" ON public.club_investments;
CREATE POLICY "Investor can view own investments"
  ON public.club_investments
  FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Investor can view own references" ON public.club_investment_references;
CREATE POLICY "Investor can view own references"
  ON public.club_investment_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_investments i
      WHERE i.id = club_investment_references.investment_id
        AND i.auth_user_id = auth.uid()
    )
  );
