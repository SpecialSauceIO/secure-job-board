-- Employer-Sponsored Verification allowances & rollover Bridge Packs for Verified Hiring Bridge (ss_inv_) links

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sponsored_verifications_monthly_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsored_verifications_monthly_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsored_verifications_rollover_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsored_verifications_reset_at timestamptz;

-- Backfill active paid Employer organizations with their monthly Sponsored Verification allowance
UPDATE public.organizations
SET
  sponsored_verifications_monthly_allowance = CASE lower(coalesce(subscription_tier, ''))
    WHEN 'enterprise' THEN 200
    WHEN 'growth' THEN 75
    WHEN 'starter' THEN 25
    ELSE 0
  END,
  sponsored_verifications_monthly_remaining = CASE lower(coalesce(subscription_tier, ''))
    WHEN 'enterprise' THEN 200
    WHEN 'growth' THEN 75
    WHEN 'starter' THEN 25
    ELSE 0
  END,
  sponsored_verifications_reset_at = coalesce(sponsored_verifications_reset_at, now())
WHERE subscription_status = 'active'
  AND lower(coalesce(subscription_tier, '')) IN ('starter', 'growth', 'enterprise')
  AND sponsored_verifications_monthly_allowance = 0;

-- Atomic depletion: monthly allowance first, then non-expiring rollover Bridge Pack balance
CREATE OR REPLACE FUNCTION public.consume_employer_sponsored_verification(p_organization_id uuid)
RETURNS TABLE(
  consumed boolean,
  bucket text,
  monthly_remaining integer,
  rollover_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly integer;
  v_rollover integer;
BEGIN
  SELECT sponsored_verifications_monthly_remaining, sponsored_verifications_rollover_balance
  INTO v_monthly, v_rollover
  FROM public.organizations
  WHERE id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::text, 0, 0;
    RETURN;
  END IF;

  IF coalesce(v_monthly, 0) > 0 THEN
    UPDATE public.organizations
    SET sponsored_verifications_monthly_remaining = sponsored_verifications_monthly_remaining - 1
    WHERE id = p_organization_id
    RETURNING sponsored_verifications_monthly_remaining, sponsored_verifications_rollover_balance
    INTO v_monthly, v_rollover;
    RETURN QUERY SELECT true, 'monthly'::text, v_monthly, v_rollover;
    RETURN;
  END IF;

  IF coalesce(v_rollover, 0) > 0 THEN
    UPDATE public.organizations
    SET sponsored_verifications_rollover_balance = sponsored_verifications_rollover_balance - 1
    WHERE id = p_organization_id
    RETURNING sponsored_verifications_monthly_remaining, sponsored_verifications_rollover_balance
    INTO v_monthly, v_rollover;
    RETURN QUERY SELECT true, 'rollover'::text, v_monthly, v_rollover;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'none'::text, coalesce(v_monthly, 0), coalesce(v_rollover, 0);
END;
$$;

-- Atomic rollover Bridge Pack credit addition
CREATE OR REPLACE FUNCTION public.add_employer_bridge_pack_credits(p_organization_id uuid, p_credits integer)
RETURNS TABLE(
  monthly_remaining integer,
  rollover_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF coalesce(p_credits, 0) <= 0 THEN
    RETURN QUERY
    SELECT coalesce(sponsored_verifications_monthly_remaining, 0), coalesce(sponsored_verifications_rollover_balance, 0)
    FROM public.organizations
    WHERE id = p_organization_id;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.organizations
  SET sponsored_verifications_rollover_balance = coalesce(sponsored_verifications_rollover_balance, 0) + p_credits
  WHERE id = p_organization_id
  RETURNING sponsored_verifications_monthly_remaining, sponsored_verifications_rollover_balance;
END;
$$;
