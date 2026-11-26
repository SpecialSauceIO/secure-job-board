export type ProtectedRolePassId = 'role_25' | 'role_50' | 'role_100'

export const PROTECTED_ROLE_PASSES: Record<
  ProtectedRolePassId,
  {
    id: ProtectedRolePassId
    cap: 25 | 50 | 100
    name: string
    shortLabel: string
    priceCents: number
    priceFormatted: string
    envVar: string
    description: string
  }
> = {
  role_25: {
    id: 'role_25',
    cap: 25,
    name: 'Protected Role 25 ($199 Flat Listing — Up to 25 Sponsored Verifications)',
    shortLabel: 'Protected Role 25 ($199)',
    priceCents: 19900,
    priceFormatted: '$199',
    envVar: 'STRIPE_PRICE_ROLE_PASS_25',
    description:
      'Publish 1 Protected Role with up to 25 Employer-Sponsored external ID verifications via Verified Hiring Bridge, plus unlimited applications from already-verified Special Sauce Professionals at $0.',
  },
  role_50: {
    id: 'role_50',
    cap: 50,
    name: 'Protected Role 50 ($349 Flat Listing — Up to 50 Sponsored Verifications)',
    shortLabel: 'Protected Role 50 ($349)',
    priceCents: 34900,
    priceFormatted: '$349',
    envVar: 'STRIPE_PRICE_ROLE_PASS_50',
    description:
      'Publish 1 Protected Role with up to 50 Employer-Sponsored external ID verifications via Verified Hiring Bridge, plus unlimited applications from already-verified Special Sauce Professionals at $0.',
  },
  role_100: {
    id: 'role_100',
    cap: 100,
    name: 'Protected Role 100 ($599 Flat Listing — Up to 100 Sponsored Verifications)',
    shortLabel: 'Protected Role 100 ($599)',
    priceCents: 59900,
    priceFormatted: '$599',
    envVar: 'STRIPE_PRICE_ROLE_PASS_100',
    description:
      'Publish 1 Protected Role with up to 100 Employer-Sponsored external ID verifications via Verified Hiring Bridge, plus unlimited applications from already-verified Special Sauce Professionals at $0.',
  },
}

export const INCLUDED_ACTIVE_PROTECTED_ROLES_BY_TIER: Record<string, number> = {
  starter: 2,
  growth: 5,
  enterprise: 15,
}

export function getIncludedActiveProtectedRolesForTier(tier?: string | null): number {
  return INCLUDED_ACTIVE_PROTECTED_ROLES_BY_TIER[String(tier || '').toLowerCase()] || 0
}

export const EXTRA_PROTECTED_ROLE_SLOT = {
  id: 'extra_role_slot' as const,
  cap: 25 as const,
  name: 'Extra Protected Role Slot ($199 Flat Add-On)',
  shortLabel: 'Extra Protected Role Slot ($199)',
  priceCents: 19900,
  priceFormatted: '$199',
  envVar: 'STRIPE_PRICE_EXTRA_ROLE_SLOT',
  legacyEnvVar: 'STRIPE_PRICE_ROLE_PASS_25',
  description:
    'Add 1 Extra Protected Role Slot beyond your plan allowance, including up to 25 Employer-Sponsored external ID verifications via Verified Hiring Bridge (pre-gated before Stripe ID) plus unlimited applications from already-verified Special Sauce Professionals at $0.',
}

export const INITIAL_INCLUDED_ROLE_PASS_BY_TIER: Record<string, ProtectedRolePassId> = {
  starter: 'role_25',
  growth: 'role_50',
  enterprise: 'role_100',
}

export interface RolePassInventory {
  extraRoleSlots?: number
  role_25: number
  role_50: number
  role_100: number
  totalPasses: number
  firstRoleGranted: boolean
}

export function parseRolePassInventory(desc?: string | null): RolePassInventory & { extraRoleSlots: number } {
  const raw = String(desc || '')
  const extraMatch = raw.match(/\[EXTRA_ROLE_SLOTS:(\d+)\]/i)
  const extraSlots = extraMatch ? Math.max(0, parseInt(extraMatch[1], 10) || 0) : 0
  const m = raw.match(/\[ROLE_PASSES:25=(\d+),50=(\d+),100=(\d+)\]/i)
  const r25 = m ? Math.max(0, parseInt(m[1], 10) || 0) : 0
  const r50 = m ? Math.max(0, parseInt(m[2], 10) || 0) : 0
  const r100 = m ? Math.max(0, parseInt(m[3], 10) || 0) : 0
  const firstRoleGranted = /\[FIRST_ROLE_GRANTED\]/i.test(raw)
  return {
    extraRoleSlots: extraSlots,
    role_25: r25,
    role_50: r50,
    role_100: r100,
    totalPasses: extraSlots + r25 + r50 + r100,
    firstRoleGranted,
  }
}

export function formatRolePassInventoryTags(inv: {
  extraRoleSlots?: number
  role_25?: number
  role_50?: number
  role_100?: number
  firstRoleGranted?: boolean
}): string {
  const extra = Math.max(0, Math.floor(inv.extraRoleSlots || 0))
  const r25 = Math.max(0, Math.floor(inv.role_25 || 0))
  const r50 = Math.max(0, Math.floor(inv.role_50 || 0))
  const r100 = Math.max(0, Math.floor(inv.role_100 || 0))
  const parts: string[] = []
  if (extra > 0) {
    parts.push(`[EXTRA_ROLE_SLOTS:${extra}]`)
  }
  if (r25 > 0 || r50 > 0 || r100 > 0) {
    parts.push(`[ROLE_PASSES:25=${r25},50=${r50},100=${r100}]`)
  }
  if (inv.firstRoleGranted) {
    parts.push('[FIRST_ROLE_GRANTED]')
  }
  return parts.join(' ')
}

export function stripRolePassInventoryTags(desc?: string | null): string {
  return String(desc || '')
    .replace(/\[EXTRA_ROLE_SLOTS:[^\]]+\]/gi, '')
    .replace(/\[ROLE_PASSES:[^\]]+\]/gi, '')
    .replace(/\[FIRST_ROLE_GRANTED\]/gi, '')
    .replace(/\[RP_CS:[^\]]+\]/gi, '')
    .replace(/\[ERS_CS:[^\]]+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function updateRolePassInventoryInDescription(
  desc: string | null | undefined,
  inv: {
    extraRoleSlots?: number
    role_25?: number
    role_50?: number
    role_100?: number
    firstRoleGranted?: boolean
  }
): string {
  const base = String(desc || '')
    .replace(/\[EXTRA_ROLE_SLOTS:[^\]]+\]/gi, '')
    .replace(/\[ROLE_PASSES:[^\]]+\]/gi, '')
    .replace(/\[FIRST_ROLE_GRANTED\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const tags = formatRolePassInventoryTags(inv)
  return [base, tags].filter(Boolean).join(' ').trim()
}

export function getEmployerActiveRoleSlotStatus(params: {
  subscriptionTier?: string | null
  subscriptionStatus?: string | null
  activeRolesCount: number
  orgDescription?: string | null
}): {
  includedSlots: number
  extraSlotsAvailable: number
  totalConcurrentSlots: number
  activeRolesCount: number
  remainingIncludedSlots: number
  canActivateWithinIncluded: boolean
  requiresExtraSlot: boolean
  canActivateRole: boolean
} {
  const isActiveSub = String(params.subscriptionStatus || '').toLowerCase() === 'active'
  const includedSlots = isActiveSub ? getIncludedActiveProtectedRolesForTier(params.subscriptionTier) : 0
  const inv = parseRolePassInventory(params.orgDescription)
  const extraSlotsAvailable = inv.totalPasses
  const active = Math.max(0, Math.floor(params.activeRolesCount || 0))
  const remainingIncludedSlots = Math.max(0, includedSlots - active)
  const canActivateWithinIncluded = active < includedSlots
  const totalConcurrentSlots = includedSlots + extraSlotsAvailable
  const canActivateRole = canActivateWithinIncluded || extraSlotsAvailable > 0
  return {
    includedSlots,
    extraSlotsAvailable,
    totalConcurrentSlots,
    activeRolesCount: active,
    remainingIncludedSlots,
    canActivateWithinIncluded,
    requiresExtraSlot: !canActivateWithinIncluded,
    canActivateRole,
  }
}

export function consumeOverflowRoleSlot(desc?: string | null): {
  consumed: boolean
  nextDescription: string
  sponsoredCap: number
} {
  const inv = parseRolePassInventory(desc)
  if (inv.extraRoleSlots > 0) {
    return {
      consumed: true,
      nextDescription: updateRolePassInventoryInDescription(desc, {
        extraRoleSlots: inv.extraRoleSlots - 1,
        role_25: inv.role_25,
        role_50: inv.role_50,
        role_100: inv.role_100,
        firstRoleGranted: inv.firstRoleGranted,
      }),
      sponsoredCap: EXTRA_PROTECTED_ROLE_SLOT.cap,
    }
  }
  if (inv.role_25 > 0 || inv.role_50 > 0 || inv.role_100 > 0) {
    const use25 = inv.role_25 > 0
    const use50 = !use25 && inv.role_50 > 0
    const cap = use25 ? 25 : use50 ? 50 : 100
    return {
      consumed: true,
      nextDescription: updateRolePassInventoryInDescription(desc, {
        extraRoleSlots: 0,
        role_25: use25 ? inv.role_25 - 1 : inv.role_25,
        role_50: use50 ? inv.role_50 - 1 : inv.role_50,
        role_100: !use25 && !use50 ? inv.role_100 - 1 : inv.role_100,
        firstRoleGranted: inv.firstRoleGranted,
      }),
      sponsoredCap: cap,
    }
  }
  return { consumed: false, nextDescription: String(desc || ''), sponsoredCap: EXTRA_PROTECTED_ROLE_SLOT.cap }
}

export function getJobSponsoredVerificationStatus(jobRowOrMeta: any): {
  cap: number
  used: number
  remaining: number
} {
  const rawReqs = Array.isArray(jobRowOrMeta?.structured_requirements)
    ? jobRowOrMeta.structured_requirements
    : null
  const meta = rawReqs
    ? rawReqs.find((r: any) => r && typeof r === 'object' && r._ss_job_meta === true) || {}
    : jobRowOrMeta || {}
  const rawCap = Number(meta?.sponsored_cap)
  const cap = [25, 50, 100].includes(rawCap) ? rawCap : 25
  const used = Math.max(0, Math.floor(Number(meta?.sponsored_used) || 0))
  return {
    cap,
    used,
    remaining: Math.max(0, cap - used),
  }
}

export async function consumeJobSponsoredVerification(
  db: any,
  jobId: string
): Promise<{ consumed: boolean; cap: number; used: number; remaining: number }> {
  try {
    const { data: jobRow } = await db
      .from('jobs')
      .select('id, structured_requirements')
      .eq('id', jobId)
      .maybeSingle()
    if (!jobRow) return { consumed: false, cap: 0, used: 0, remaining: 0 }
    const rawReqs = Array.isArray(jobRow.structured_requirements) ? jobRow.structured_requirements : []
    const status = getJobSponsoredVerificationStatus(jobRow)
    if (status.remaining <= 0) {
      return { consumed: false, ...status }
    }
    const nextUsed = status.used + 1
    let foundMeta = false
    const updatedReqs = rawReqs.map((item: any) => {
      if (item && typeof item === 'object' && item._ss_job_meta === true) {
        foundMeta = true
        return {
          ...item,
          sponsored_cap: status.cap,
          sponsored_used: nextUsed,
        }
      }
      return item
    })
    if (!foundMeta) {
      updatedReqs.push({
        _ss_job_meta: true,
        sponsored_cap: status.cap,
        sponsored_used: nextUsed,
      })
    }
    const { error } = await db
      .from('jobs')
      .update({ structured_requirements: updatedReqs })
      .eq('id', jobId)
    if (!error) {
      return {
        consumed: true,
        cap: status.cap,
        used: nextUsed,
        remaining: Math.max(0, status.cap - nextUsed),
      }
    }
  } catch {}
  return { consumed: false, cap: 0, used: 0, remaining: 0 }
}

export const SPONSORED_VERIFICATION_ALLOWANCES: Record<string, number> = {
  starter: 25,
  growth: 50,
  enterprise: 100,
}

export const EMPLOYER_BRIDGE_PACKS: Record<
  string,
  {
    id: ProtectedRolePassId
    name: string
    credits: number
    priceCents: number
    envVar: string
    description: string
  }
> = {
  role_25: {
    id: 'role_25',
    name: PROTECTED_ROLE_PASSES.role_25.name,
    credits: 25,
    priceCents: 19900,
    envVar: PROTECTED_ROLE_PASSES.role_25.envVar,
    description: PROTECTED_ROLE_PASSES.role_25.description,
  },
  role_50: {
    id: 'role_50',
    name: PROTECTED_ROLE_PASSES.role_50.name,
    credits: 50,
    priceCents: 34900,
    envVar: PROTECTED_ROLE_PASSES.role_50.envVar,
    description: PROTECTED_ROLE_PASSES.role_50.description,
  },
  role_100: {
    id: 'role_100',
    name: PROTECTED_ROLE_PASSES.role_100.name,
    credits: 100,
    priceCents: 59900,
    envVar: PROTECTED_ROLE_PASSES.role_100.envVar,
    description: PROTECTED_ROLE_PASSES.role_100.description,
  },
}

export const BRIDGE_PACK_CREDITS_MAP: Record<string, number> = {
  role_25: 25,
  role_50: 50,
  role_100: 100,
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
