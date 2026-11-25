export const SPONSORED_VERIFICATION_ALLOWANCES: Record<string, number> = {
  starter: 25,
  growth: 75,
  enterprise: 200,
}

export const EMPLOYER_BRIDGE_PACKS: Record<
  string,
  {
    id: 'bridge_25' | 'bridge_50' | 'bridge_150'
    name: string
    credits: number
    priceCents: number
    envVar: string
    description: string
  }
> = {
  bridge_25: {
    id: 'bridge_25',
    name: 'Bridge Pack 25 (+25 Rollover Sponsored Verifications)',
    credits: 25,
    priceCents: 5000,
    envVar: 'STRIPE_PRICE_BRIDGE_PACK_25',
    description:
      '+25 non-expiring rollover Sponsored Verifications ($2.00 each) for Verified Hiring Bridge links. Monthly plan allowance is always used first.',
  },
  bridge_50: {
    id: 'bridge_50',
    name: 'Bridge Pack 50 (+50 Rollover Sponsored Verifications)',
    credits: 50,
    priceCents: 9500,
    envVar: 'STRIPE_PRICE_BRIDGE_PACK_50',
    description:
      '+50 non-expiring rollover Sponsored Verifications ($1.90 each) for Verified Hiring Bridge links. Monthly plan allowance is always used first.',
  },
  bridge_150: {
    id: 'bridge_150',
    name: 'Bridge Pack 150 (+150 Rollover Sponsored Verifications)',
    credits: 150,
    priceCents: 27000,
    envVar: 'STRIPE_PRICE_BRIDGE_PACK_150',
    description:
      '+150 non-expiring rollover Sponsored Verifications ($1.80 each) for Verified Hiring Bridge links. Monthly plan allowance is always used first.',
  },
}

export const BRIDGE_PACK_CREDITS_MAP: Record<string, number> = {
  bridge_25: 25,
  bridge_50: 50,
  bridge_150: 150,
}

export function getSponsoredVerificationAllowanceForTier(tier?: string | null): number {
  return SPONSORED_VERIFICATION_ALLOWANCES[String(tier || '').toLowerCase()] || 0
}

export function getEmployerSponsoredVerificationBalance(orgObj: any): {
  monthlyAllowance: number
  monthlyRemaining: number
  rolloverBalance: number
  totalAvailable: number
} {
  const tierAllowance = getSponsoredVerificationAllowanceForTier(orgObj?.subscription_tier)
  const isActivePaid = String(orgObj?.subscription_status || '').toLowerCase() === 'active' && tierAllowance > 0
  const hasExplicitMonthly = typeof orgObj?.sponsored_verifications_monthly_remaining === 'number'
  const monthlyAllowance =
    typeof orgObj?.sponsored_verifications_monthly_allowance === 'number' && orgObj.sponsored_verifications_monthly_allowance > 0
      ? orgObj.sponsored_verifications_monthly_allowance
      : isActivePaid
      ? tierAllowance
      : 0
  const monthlyRemaining = hasExplicitMonthly
    ? Math.max(0, orgObj.sponsored_verifications_monthly_remaining)
    : isActivePaid
    ? tierAllowance
    : 0
  const rolloverBalance = Math.max(0, Number(orgObj?.sponsored_verifications_rollover_balance || 0))
  return {
    monthlyAllowance,
    monthlyRemaining,
    rolloverBalance,
    totalAvailable: monthlyRemaining + rolloverBalance,
  }
}

export async function consumeEmployerSponsoredVerification(
  db: any,
  organizationId: string
): Promise<{ consumed: boolean; bucket: string; monthlyRemaining: number; rolloverBalance: number }> {
  try {
    const { data, error } = await db.rpc('consume_employer_sponsored_verification', {
      p_organization_id: organizationId,
    })
    if (!error && Array.isArray(data) && data[0]) {
      return {
        consumed: Boolean(data[0].consumed),
        bucket: String(data[0].bucket || 'none'),
        monthlyRemaining: Number(data[0].monthly_remaining || 0),
        rolloverBalance: Number(data[0].rollover_balance || 0),
      }
    }
  } catch {}
  return { consumed: false, bucket: 'none', monthlyRemaining: 0, rolloverBalance: 0 }
}

export async function addEmployerBridgePackCredits(
  db: any,
  organizationId: string,
  creditsToAdd: number
): Promise<{ ok: boolean; monthlyRemaining: number; rolloverBalance: number }> {
  try {
    const { data, error } = await db.rpc('add_employer_bridge_pack_credits', {
      p_organization_id: organizationId,
      p_credits: creditsToAdd,
    })
    if (!error && Array.isArray(data) && data[0]) {
      return {
        ok: true,
        monthlyRemaining: Number(data[0].monthly_remaining || 0),
        rolloverBalance: Number(data[0].rollover_balance || 0),
      }
    }
  } catch {}
  return { ok: false, monthlyRemaining: 0, rolloverBalance: 0 }
}
