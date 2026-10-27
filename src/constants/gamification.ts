import { normalizeLanguageList } from '@/constants/languages'

export type MetalTierId =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'apex'

export interface MetalTierConfig {
  id: MetalTierId
  name: string
  minXp: number
  maxXp: number | null
  minLevel: number
  badgeBg: string
  badgeText: string
  badgeBorder: string
  barGradient: string
  icon: string
}

export const SEASON_0_CUTOFF_ISO = '2027-01-31T23:59:59.000Z'
export const FOUNDER_XP_MULTIPLIER = 1

// Preserved for type compatibility, mapped to clean distinction labels
export const METAL_TIERS: MetalTierConfig[] = [
  {
    id: 'bronze',
    name: 'Member',
    minXp: 0,
    maxXp: null,
    minLevel: 1,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    barGradient: 'from-slate-700 to-slate-900',
    icon: '',
  },
]

export interface EarnedBadgeItem {
  id: string
  title: string
  shortLabel?: string
  description: string
  icon: string
  unlocked: boolean
  progressText?: string
  accentClass: string
}

export interface SeasonalChallengeItem {
  id: string
  title: string
  description: string
  xpReward: number
  current: number
  target: number
  completed: boolean
}

export interface GamificationSummary {
  role: 'candidate' | 'employer'
  isFounder: boolean
  founderLabel: string
  primaryBehavioralSignal: string
  totalXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  levelProgressPct: number
  tier: MetalTierConfig
  nextTier: MetalTierConfig | null
  badges: EarnedBadgeItem[]
  seasonalChallenges: SeasonalChallengeItem[]
}

export function isSeasonZeroFounder(
  createdAt?: string | null,
  explicitFlag?: boolean
): boolean {
  if (explicitFlag === true) return true
  if (!createdAt) return true
  const createdMs = new Date(createdAt).getTime()
  const cutoffMs = new Date(SEASON_0_CUTOFF_ISO).getTime()
  if (isNaN(createdMs)) return true
  return createdMs <= cutoffMs
}

export function resolveTierFromXp(unlockedCount: number, totalCount: number) {
  const pct =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 100
  return {
    tier: METAL_TIERS[0],
    nextTier: null,
    level: unlockedCount,
    currentLevelXp: unlockedCount,
    nextLevelXp: totalCount,
    levelProgressPct: pct,
  }
}

function respondedWithinHours(app: any, maxHours: number, role: 'candidate' | 'employer'): boolean {
  const createdMs = app?.created_at ? new Date(app.created_at).getTime() : NaN
  const msgs = Array.isArray(app?.match_data?.messages) ? app.match_data.messages : []
  const firstReply = msgs.find((m: any) => m?.sender_role === role && m?.created_at)

  if (firstReply && !isNaN(createdMs)) {
    const replyMs = new Date(firstReply.created_at).getTime()
    if (!isNaN(replyMs) && replyMs >= createdMs) {
      return (replyMs - createdMs) <= maxHours * 3600 * 1000
    }
  }

  const updatedMs = app?.updated_at ? new Date(app.updated_at).getTime() : NaN
  if (!isNaN(createdMs) && !isNaN(updatedMs) && updatedMs >= createdMs) {
    return (updatedMs - createdMs) <= maxHours * 3600 * 1000
  }

  return true
}

export function calculateCandidateGamification(
  profile: any,
  applications: any[] = []
): GamificationSummary {
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []

  const visibleSkills = rawSkills.filter(
    (s: any) =>
      s &&
      typeof s === 'object' &&
      !s._ss_meta &&
      !s._ss_pref_meta &&
      (s.skill || s.name)
  )

  const prefMeta =
    rawSkills.find((s: any) => s && s._ss_pref_meta === true) || {}

  const isVerified = Boolean(
    profile?.identity_verified === true ||
      String(profile?.identity_verified) === 'true' ||
      profile?.is_verified === true ||
      String(profile?.is_verified) === 'true'
  )

  const hasBioAndSkills =
    Boolean(profile?.bio && String(profile.bio).trim().length > 20) &&
    (visibleSkills.length >= 3 ||
      Boolean(profile?.skills && String(profile.skills).trim().length > 3))

  const hasEduOrCerts = Boolean(
    profile?.education_level ||
      prefMeta?.education_level ||
      profile?.certifications ||
      prefMeta?.certifications
  )

  const hasCertifications = Boolean(
    (profile?.certifications && String(profile.certifications).trim()) ||
      (prefMeta?.certifications && String(prefMeta.certifications).trim())
  )

  const candidateLanguages = normalizeLanguageList(
    profile?.languages || prefMeta?.languages,
    true
  )
  const isMultilingual =
    candidateLanguages.length >= 2 &&
    candidateLanguages.some(
      (l) =>
        l.language.toLowerCase() !== 'english' &&
        (l.proficiency === 'Advanced' || l.proficiency === 'Fluent / Native')
    )

  const hasDealbreakers = Boolean(
    profile?.min_salary_expectation &&
      Number(profile.min_salary_expectation) > 0 &&
      profile?.preferred_work_model &&
      profile?.location
  )

  const isVaultReady =
    isVerified && hasBioAndSkills && hasEduOrCerts && hasDealbreakers

  const outboundApps = (applications || []).filter(
    (a) => a.initiated_by !== 'employer'
  )
  const inboundPitches = (applications || []).filter(
    (a) => a.initiated_by === 'employer'
  )
  const respondedPitches = inboundPitches.filter(
    (p) =>
      p.status === 'accepted' ||
      p.status === 'rejected' ||
      p.status === 'declined' ||
      p.is_revealed === true
  )
  const candidateRepliedThreads = (applications || []).filter(
    (a) =>
      Array.isArray(a.match_data?.messages) &&
      a.match_data.messages.some((m: any) => m.sender_role === 'candidate')
  )

  // Fast 24-hour responses across inbound pitches or active message threads
  const fastResponseSet = new Set<string>()
  respondedPitches.forEach((p, idx) => {
    if (respondedWithinHours(p, 24, 'candidate')) {
      fastResponseSet.add(String(p.id || `pitch-${idx}`))
    }
  })
  candidateRepliedThreads.forEach((t, idx) => {
    if (respondedWithinHours(t, 24, 'candidate')) {
      fastResponseSet.add(String(t.id || `thread-${idx}`))
    }
  })
  const fastRepliesCount = fastResponseSet.size

  const stage2Releases = (applications || []).filter(
    (a) => a.match_data?.candidate_vault_released === true
  )

  // 75%+ and 85%+ Fit counts across outbound applications and accepted pitches
  const qualifiedFitApps = (applications || []).filter(
    (a) =>
      a.initiated_by !== 'employer' ||
      a.status === 'accepted' ||
      a.is_revealed === true
  )
  const highMatchApps75 = qualifiedFitApps.filter(
    (a) => Number(a.match_score ?? a.match_data?.overall_score ?? 0) >= 75
  )
  const eliteMatchApps85 = qualifiedFitApps.filter(
    (a) => Number(a.match_score ?? a.match_data?.overall_score ?? 0) >= 85
  )

  // Inbound demand count: employer pitches received + outbound applications unlocked/shortlisted by employers
  const employerUnlockedOutbound = outboundApps.filter(
    (a) =>
      a.is_revealed === true ||
      a.status === 'accepted' ||
      a.status === 'shortlisted'
  )
  const inboundDemandCount = inboundPitches.length + employerUnlockedOutbound.length

  const commendationsCount =
    Number(prefMeta?.employer_commendations || 0) + stage2Releases.length

  // Account tenure in days for long-term Seasoned Vet distinction
  const createdMs = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now()
  const accountAgeDays = !isNaN(createdMs)
    ? Math.max(1, Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24)))
    : 1

  const isFounder = isSeasonZeroFounder(
    profile?.created_at,
    prefMeta?.founding_member
  )

  const isResponsiveCandidate = fastRepliesCount >= 3
  const isHighPrecision = highMatchApps75.length >= 3
  const isInDemand = inboundDemandCount >= 5
  const isEliteMatch = eliteMatchApps85.length >= 5
  const isSeasonedVet = commendationsCount >= 3 && accountAgeDays >= 60

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_season_0',
      title: 'Founding Member',
      shortLabel: 'Founding Member',
      description:
        'Early-access professional onboarded during the Founding Launch window.',
      icon: '✓',
      unlocked: isFounder,
      progressText: isFounder ? 'Active' : 'Founding Launch Cohort',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'vault_ready',
      title: 'Vault-Ready Profile',
      shortLabel: 'Vault Ready',
      description:
        'Real-person identity verified via Stripe, resume skills extracted, and minimum pay & work preferences saved.',
      icon: '✓',
      unlocked: isVaultReady,
      progressText: isVaultReady
        ? 'Active'
        : 'Complete Stripe ID check, resume skills & Match Preferences',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'certified_specialist',
      title: 'Certified & Credentialed',
      shortLabel: 'Certified',
      description:
        'Holds active industry certifications, professional licenses, or Advanced/Fluent multilingual proficiency on profile.',
      icon: '✓',
      unlocked: hasCertifications || isMultilingual,
      progressText:
        hasCertifications || isMultilingual
          ? 'Active'
          : 'Add a license, certification, or secondary language on My Profile',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'responsive_pro',
      title: '24-Hour Responder',
      shortLabel: '24h Responder',
      description:
        'Consistently replies to employer Professional Invitations and active chat messages within 24 hours.',
      icon: '✓',
      unlocked: isResponsiveCandidate,
      progressText: isResponsiveCandidate
        ? 'Active'
        : `Reply to 3 employer invitations or chats within 24h (${fastRepliesCount}/3 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'precision_applicant',
      title: 'High-Precision Applicant',
      shortLabel: 'High-Fit Applicant',
      description:
        'Applies selectively to strong-fit roles, maintaining a 75%+ 5-Point AI Fit score across 3+ applications or invitations.',
      icon: '✓',
      unlocked: isHighPrecision,
      progressText: isHighPrecision
        ? `Active (${highMatchApps75.length} roles at 75%+ Fit)`
        : `Submit 3 applications at 75%+ AI Fit (${highMatchApps75.length}/3 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'stage2_veteran',
      title: 'Verified Connection',
      shortLabel: 'Resume Shared',
      description:
        'Completed a private chat and voluntarily released full resume and contact details to a verified hiring team.',
      icon: '✓',
      unlocked: commendationsCount >= 1,
      progressText:
        commendationsCount >= 1
          ? 'Active'
          : 'Release your full resume & contact card in 1 active employer chat',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'in_demand_talent',
      title: 'In-Demand Talent',
      shortLabel: 'In-Demand',
      description:
        'Repeatedly invited or unlocked for private interviews by verified hiring teams searching the talent pool.',
      icon: '✓',
      unlocked: isInDemand,
      progressText: isInDemand
        ? 'Active'
        : `Receive 5 Professional Invitations or interview unlocks (${inboundDemandCount}/5 earned)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'elite_match_85',
      title: 'Top-Tier Match (85%+)',
      shortLabel: '85%+ Top Match',
      description:
        'Elite role targeting—matched and applied or connected across 5+ roles at an 85%+ 5-Point AI Fit score.',
      icon: '✓',
      unlocked: isEliteMatch,
      progressText: isEliteMatch
        ? 'Active'
        : `Apply or connect on 5 roles at 85%+ AI Fit (${eliteMatchApps85.length}/5 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'seasoned_vet',
      title: 'Seasoned Vet',
      shortLabel: 'Seasoned Vet',
      description:
        'Long-term platform distinction—completed 3+ full resume releases with verified employers and 60+ days active.',
      icon: '✓',
      unlocked: isSeasonedVet,
      progressText: isSeasonedVet
        ? 'Active'
        : `Complete 3 resume releases (${commendationsCount}/3) & 60 days active (${Math.min(accountAgeDays, 60)}/60d)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ]

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const rankData = resolveTierFromXp(unlockedCount, badges.length)

  const primaryBehavioralSignal = isSeasonedVet
    ? 'Seasoned Vet'
    : isResponsiveCandidate
    ? '24-Hour Responder'
    : isVaultReady
    ? 'Vault Ready'
    : isHighPrecision
    ? 'High-Fit Applicant'
    : isVerified
    ? 'Identity Verified'
    : ''

  return {
    role: 'candidate',
    isFounder,
    founderLabel: 'Founding Member',
    primaryBehavioralSignal,
    totalXp: unlockedCount,
    ...rankData,
    tier: {
      ...METAL_TIERS[0],
      name: primaryBehavioralSignal || 'Member',
    },
    badges,
    seasonalChallenges: [],
  }
}

export function calculateEmployerGamification(
  org: any,
  jobs: any[] = [],
  applications: any[] = [],
  adminProfile?: any
): GamificationSummary {
  const isDomainVerified = org?.verification_status === 'verified'
  const rawDesc = String(org?.description || '')
  const einMatch = rawDesc.match(/\[EIN:([^\]]+)\]/i)
  const stateMatch = rawDesc.match(/\[INC_STATE:([^\]]+)\]/i)
  const hasVerifiedEin = Boolean(
    einMatch?.[1] && /^\d{2}-\d{7}$/.test(einMatch[1].trim()) && stateMatch?.[1]?.trim()
  )

  const isAdminIdVerified = Boolean(
    adminProfile?.identity_verified === true ||
      String(adminProfile?.identity_verified) === 'true' ||
      adminProfile?.is_verified === true ||
      String(adminProfile?.is_verified) === 'true' ||
      org?.admin_identity_verified === true
  )

  const activeJobs = (jobs || []).filter((j) => j.is_active !== false)
  const hasPayTransparency =
    activeJobs.length > 0 &&
    activeJobs.every((j) => Number(j.salary_min) > 0 && Number(j.salary_max) > 0)

  const sentPitches = (applications || []).filter(
    (a) => a.initiated_by === 'employer'
  )
  const totalOutreachCount = Math.max(
    sentPitches.length,
    Number(org?.total_requests_sent || 0)
  )

  const unlockedOrReviewed = (applications || []).filter(
    (a) =>
      a.is_revealed === true ||
      a.status === 'accepted' ||
      a.status === 'shortlisted' ||
      a.status === 'rejected'
  )
  const messagedThreads = (applications || []).filter(
    (a) =>
      Array.isArray(a.match_data?.messages) &&
      a.match_data.messages.some((m: any) => m.sender_role === 'employer')
  )

  const fastEmployerReviews = unlockedOrReviewed.filter((a) =>
    respondedWithinHours(a, 48, 'employer')
  )
  const employerActionCount = Math.max(
    fastEmployerReviews.length,
    messagedThreads.length
  )
  const isResponsiveEmployer = employerActionCount >= 3

  const feedbackOrDecisionCount = unlockedOrReviewed.length
  const hasConstructiveFeedback = feedbackOrDecisionCount >= 3

  const isActiveTalentScout =
    activeJobs.length >= 2 || totalOutreachCount >= 5

  const mutualVaultReleases = (applications || []).filter(
    (a) =>
      a.match_data?.candidate_vault_released === true ||
      a.match_data?.stage_2_released === true ||
      a.match_data?.contact_released === true
  )
  const isTrustedHiringTeam = mutualVaultReleases.length >= 3

  const isFounder = isSeasonZeroFounder(org?.created_at, true)

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_partner',
      title: 'Founding Partner',
      shortLabel: 'Founding Partner',
      description:
        'Early-access employer organization onboarded during the Founding Launch window with a 12-Month Founding Partner Rate Lock.',
      icon: '✓',
      unlocked: isFounder,
      progressText: 'Active',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'domain_verified_org',
      title: 'Domain & 90-Day RDAP Verified',
      shortLabel: 'Verified Domain',
      description:
        'Passed live corporate DNS (MX/TXT) ownership verification and automated 90-day RDAP registry domain-age screening.',
      icon: '✓',
      unlocked: isDomainVerified,
      progressText: isDomainVerified
        ? 'Active'
        : 'Verify corporate domain & pass 90-day RDAP check on Manage Company',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'ein_tax_verified',
      title: 'Verified US Tax Entity (EIN)',
      shortLabel: 'Verified EIN',
      description:
        'Submitted a validated 9-digit IRS Federal EIN, State of Incorporation, and legally binding corporate officer attestation.',
      icon: '✓',
      unlocked: hasVerifiedEin,
      progressText: hasVerifiedEin
        ? 'Active'
        : 'Save your 9-digit IRS Federal EIN & State of Incorporation on Manage Company',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'admin_identity_verified',
      title: 'ID-Verified Hiring Leader',
      shortLabel: 'Admin ID Verified',
      description:
        'Employer Account Admin completed 1-time government ID and live biometric selfie verification via Stripe Identity.',
      icon: '✓',
      unlocked: isAdminIdVerified,
      progressText: isAdminIdVerified
        ? 'Active'
        : 'Complete 1-time Admin Stripe Identity verification on Manage Company',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'pay_transparency_leader',
      title: 'Upfront Pay Transparency',
      shortLabel: 'Pay Transparency',
      description:
        'Publishes 100% of active job listings with upfront minimum and maximum annual salary or hourly pay bands.',
      icon: '✓',
      unlocked: hasPayTransparency,
      progressText: hasPayTransparency
        ? 'Active'
        : 'Publish at least 1 active role with upfront minimum and maximum pay bands',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'active_reviewer',
      title: '48-Hour Rapid Responder',
      shortLabel: '48h Responder',
      description:
        'Reviews inbound applications (unlocking or declining) or replies to candidate chat messages within 48 hours.',
      icon: '✓',
      unlocked: isResponsiveEmployer,
      progressText: isResponsiveEmployer
        ? 'Active'
        : `Action or message 3 candidates within 48 hours (${Math.min(employerActionCount, 3)}/3 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'constructive_feedback_pledge',
      title: 'Zero-Ghosting Feedback Leader',
      shortLabel: 'Zero-Ghosting',
      description:
        'Eliminates candidate ghosting by recording clear Introduction decisions (shortlist, unlock, or structured pass) across 3+ applications.',
      icon: '✓',
      unlocked: hasConstructiveFeedback,
      progressText: hasConstructiveFeedback
        ? 'Active'
        : `Record Introduction decisions on 3 candidate applications (${Math.min(feedbackOrDecisionCount, 3)}/3 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'active_talent_scout',
      title: 'Active Hiring Pipeline',
      shortLabel: 'Active Hiring',
      description:
        'Actively recruiting on Special Sauce with 2+ live protected job roles or 5+ direct outbound Professional Invitations sent.',
      icon: '✓',
      unlocked: isActiveTalentScout,
      progressText: isActiveTalentScout
        ? 'Active'
        : `Maintain 2 active roles (${Math.min(activeJobs.length, 2)}/2) OR send 5 Professional Invitations (${Math.min(totalOutreachCount, 5)}/5)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'trusted_hiring_team',
      title: 'Trusted Conversation Vault Partner',
      shortLabel: 'Vault Partner',
      description:
        'Earned candidate trust during The Introduction chat, resulting in 3+ candidates voluntarily releasing their Conversation Resume & Contact Vault.',
      icon: '✓',
      unlocked: isTrustedHiringTeam,
      progressText: isTrustedHiringTeam
        ? 'Active'
        : `Earn 3 voluntary Conversation candidate resume vault releases (${Math.min(mutualVaultReleases.length, 3)}/3 completed)`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ]

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const rankData = resolveTierFromXp(unlockedCount, badges.length)

  const primaryBehavioralSignal = isTrustedHiringTeam
    ? 'Trusted Conversation Vault Partner'
    : isResponsiveEmployer
    ? '48-Hour Rapid Responder'
    : isAdminIdVerified
    ? 'ID-Verified Hiring Leader'
    : hasPayTransparency
    ? 'Upfront Pay Transparency'
    : isDomainVerified
    ? 'Domain & RDAP Verified'
    : ''

  return {
    role: 'employer',
    isFounder,
    founderLabel: 'Founding Partner',
    primaryBehavioralSignal,
    totalXp: unlockedCount,
    ...rankData,
    tier: {
      ...METAL_TIERS[0],
      name: primaryBehavioralSignal || 'Employer',
    },
    badges,
    seasonalChallenges: [],
  }
}

export function getQuickCandidateCardRank(candidate: any) {
  const summary = calculateCandidateGamification(candidate, [])
  return {
    isFounder: summary.isFounder,
    level: summary.level,
    totalXp: summary.totalXp,
    tier: summary.tier,
    isVaultReady:
      summary.badges.find((b) => b.id === 'vault_ready')?.unlocked || false,
    isMultilingual:
      summary.badges.find((b) => b.id === 'certified_specialist')?.unlocked ||
      false,
  }
}

export function getQuickJobCardRank(job: any) {
  const org = job?.organizations || {}
  const summary = calculateEmployerGamification(org, [job], [])
  return {
    isFounder: summary.isFounder,
    level: summary.level,
    totalXp: summary.totalXp,
    tier: summary.tier,
  }
}
