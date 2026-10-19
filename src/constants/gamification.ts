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

// Preserved for type compatibility, but mapped to clean behavioral status labels
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
      String(profile?.is_verified) === 'true' ||
      profile?.verification_status === 'verified' ||
      profile?.verification_status === 'approved'
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
  const activeThreads = (applications || []).filter(
    (a) =>
      a.is_revealed === true ||
      a.status === 'accepted' ||
      a.status === 'shortlisted' ||
      (Array.isArray(a.match_data?.messages) &&
        a.match_data.messages.length > 0)
  )
  const stage2Releases = (applications || []).filter(
    (a) => a.match_data?.candidate_vault_released === true
  )
  const highMatchApps = outboundApps.filter(
    (a) => Number(a.match_score ?? a.match_data?.overall_score ?? 0) >= 75
  )

  const commendationsCount =
    Number(prefMeta?.employer_commendations || 0) + stage2Releases.length

  const isFounder = isSeasonZeroFounder(
    profile?.created_at,
    prefMeta?.founding_member
  )

  const isResponsiveCandidate =
    activeThreads.length >= 1 || respondedPitches.length >= 1
  const isHighPrecision =
    highMatchApps.length >= 1 || respondedPitches.length >= 1

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_season_0',
      title: 'Founding Member',
      shortLabel: 'Founding Member',
      description:
        'Charter professional onboarded during the Founding Launch Cohort.',
      icon: '✓',
      unlocked: isFounder,
      progressText: isFounder ? 'Active' : 'Founding Cohort',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'vault_ready',
      title: 'Vault-Ready Profile',
      shortLabel: 'Vault Ready',
      description:
        'Identity verified via Stripe, structured skill matrix extracted, and match preferences configured.',
      icon: '✓',
      unlocked: isVaultReady,
      progressText: isVaultReady
        ? 'Active'
        : 'Complete profile, preferences & ID verification',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'responsive_pro',
      title: 'Responsive Candidate',
      shortLabel: 'Responsive',
      description:
        'Actively responds to employer connection pitches and encrypted Stage 1 interview threads.',
      icon: '✓',
      unlocked: isResponsiveCandidate,
      progressText: isResponsiveCandidate
        ? 'Active'
        : 'Respond to an employer pitch or thread',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'precision_applicant',
      title: 'High-Precision Applicant',
      shortLabel: 'High-Fit Applicant',
      description:
        'Submitted blind applications or accepted pitches at a 75%+ 5-Point AI Fit score.',
      icon: '✓',
      unlocked: isHighPrecision,
      progressText: isHighPrecision
        ? `Active (${highMatchApps.length + respondedPitches.length} high-fit)`
        : 'Apply to a role at 75%+ AI Fit',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'certified_specialist',
      title: 'Verified Credentials',
      shortLabel: 'Certified',
      description:
        'Documented active industry certifications, licenses, or multilingual fluency on profile.',
      icon: '✓',
      unlocked: hasCertifications || isMultilingual,
      progressText:
        hasCertifications || isMultilingual
          ? 'Active'
          : 'Add certifications or secondary language on Profile',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'stage2_veteran',
      title: 'Stage 2 Vault Verified',
      shortLabel: 'Stage 2 Verified',
      description:
        'Completed mutual Stage 2 Resume & Contact Vault release with a verified employer.',
      icon: '✓',
      unlocked: commendationsCount >= 1,
      progressText:
        commendationsCount >= 1
          ? 'Active'
          : 'Release Stage 2 Vault in an active thread',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ]

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const rankData = resolveTierFromXp(unlockedCount, badges.length)

  const primaryBehavioralSignal = isResponsiveCandidate
    ? 'Responsive Candidate'
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
  applications: any[] = []
): GamificationSummary {
  const isDomainVerified = org?.verification_status === 'verified'
  const activeJobs = (jobs || []).filter((j) => j.is_active !== false)
  const hasPayTransparency = (jobs || []).some(
    (j) => Number(j.salary_min) > 0 && Number(j.salary_max) > 0
  )

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

  const isResponsiveEmployer =
    unlockedOrReviewed.length >= 1 ||
    messagedThreads.length >= 1 ||
    totalOutreachCount >= 1

  const isActiveTalentScout =
    activeJobs.length >= 2 || totalOutreachCount >= 3

  const isFounder = isSeasonZeroFounder(org?.created_at, true)

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_partner',
      title: 'Founding Partner',
      shortLabel: 'Founding Partner',
      description:
        'Charter employer organization onboarded during the Founding Launch Cohort.',
      icon: '✓',
      unlocked: isFounder,
      progressText: 'Active',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'domain_verified_org',
      title: 'Verified Corporate Domain',
      shortLabel: 'Verified Domain',
      description:
        'Passed corporate domain & DNS verification confirming authentic employer identity.',
      icon: '✓',
      unlocked: isDomainVerified,
      progressText: isDomainVerified
        ? 'Active'
        : 'Verify domain on Manage Profile',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'active_reviewer',
      title: 'Responsive Employer',
      shortLabel: 'Responsive Employer',
      description:
        'Actively reviews applicants, unlocks profiles, or replies to candidates in Stage 1 threads.',
      icon: '✓',
      unlocked: isResponsiveEmployer,
      progressText: isResponsiveEmployer
        ? 'Active'
        : 'Review an applicant or send a pitch',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'pay_transparency_leader',
      title: 'Upfront Pay Transparency',
      shortLabel: 'Pay Transparency',
      description:
        'Publishes blind role listings with upfront minimum and maximum compensation bands.',
      icon: '✓',
      unlocked: hasPayTransparency,
      progressText: hasPayTransparency
        ? 'Active'
        : 'Publish a role with salary/hourly band',
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'active_talent_scout',
      title: 'Active Hiring Pipeline',
      shortLabel: 'Active Hiring',
      description:
        'Maintains 2+ active blind role listings or sent 3+ direct outbound candidate pitches.',
      icon: '✓',
      unlocked: isActiveTalentScout,
      progressText: isActiveTalentScout
        ? 'Active'
        : `${activeJobs.length}/2 roles or ${totalOutreachCount}/3 pitches`,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ]

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const rankData = resolveTierFromXp(unlockedCount, badges.length)

  const primaryBehavioralSignal = isResponsiveEmployer
    ? 'Responsive Employer'
    : hasPayTransparency
    ? 'Pay Transparency'
    : isDomainVerified
    ? 'Verified Domain'
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
