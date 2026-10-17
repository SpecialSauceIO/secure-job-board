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
export const FOUNDER_XP_MULTIPLIER = 1.25

export const METAL_TIERS: MetalTierConfig[] = [
  {
    id: 'bronze',
    name: 'Bronze Tier',
    minXp: 0,
    maxXp: 999,
    minLevel: 1,
    badgeBg: 'bg-amber-900/10',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-700/30',
    barGradient: 'from-amber-700 to-orange-600',
    icon: '🥉',
  },
  {
    id: 'silver',
    name: 'Silver Tier',
    minXp: 1000,
    maxXp: 2999,
    minLevel: 5,
    badgeBg: 'bg-slate-200/80',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-400',
    barGradient: 'from-slate-500 to-slate-700',
    icon: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold Tier',
    minXp: 3000,
    maxXp: 6999,
    minLevel: 15,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-400',
    barGradient: 'from-amber-500 to-yellow-500',
    icon: '🥇',
  },
  {
    id: 'platinum',
    name: 'Platinum Tier',
    minXp: 7000,
    maxXp: 14999,
    minLevel: 30,
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-900',
    badgeBorder: 'border-cyan-300',
    barGradient: 'from-cyan-500 to-indigo-500',
    icon: '💠',
  },
  {
    id: 'diamond',
    name: 'Diamond Tier',
    minXp: 15000,
    maxXp: 29999,
    minLevel: 50,
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-950',
    badgeBorder: 'border-indigo-400',
    barGradient: 'from-indigo-600 to-violet-600',
    icon: '💎',
  },
  {
    id: 'apex',
    name: 'Apex Tier',
    minXp: 30000,
    maxXp: null,
    minLevel: 75,
    badgeBg: 'bg-slate-900',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400',
    barGradient: 'from-indigo-600 via-violet-600 to-amber-500',
    icon: '👑',
  },
]

export interface EarnedBadgeItem {
  id: string
  title: string
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

export function resolveTierFromXp(xp: number): {
  tier: MetalTierConfig
  nextTier: MetalTierConfig | null
  level: number
  currentLevelXp: number
  nextLevelXp: number
  levelProgressPct: number
} {
  const safeXp = Math.max(0, Math.floor(xp))
  let currentTier = METAL_TIERS[0]
  let nextTier: MetalTierConfig | null = METAL_TIERS[1]

  for (let i = 0; i < METAL_TIERS.length; i++) {
    const t = METAL_TIERS[i]
    if (safeXp >= t.minXp && (t.maxXp === null || safeXp <= t.maxXp)) {
      currentTier = t
      nextTier = METAL_TIERS[i + 1] || null
      break
    }
  }

  let level = 1
  let currentLevelXp = safeXp
  let nextLevelXp = 250

  if (safeXp < 2250) {
    level = 1 + Math.floor(safeXp / 250)
    currentLevelXp = safeXp % 250
    nextLevelXp = 250
  } else {
    const postTenXp = safeXp - 2250
    level = 10 + Math.floor(postTenXp / 400)
    currentLevelXp = postTenXp % 400
    nextLevelXp = 400
  }

  const levelProgressPct = Math.min(
    100,
    Math.max(4, Math.round((currentLevelXp / nextLevelXp) * 100))
  )

  return {
    tier: currentTier,
    nextTier,
    level,
    currentLevelXp,
    nextLevelXp,
    levelProgressPct,
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

  const savedJobsCount = Array.isArray(prefMeta?.saved_job_ids)
    ? prefMeta.saved_job_ids.length
    : 0

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

  let baseXp = 150
  if (isVerified) baseXp += 500
  if (hasBioAndSkills) baseXp += 350
  if (hasEduOrCerts) baseXp += 200
  if (hasCertifications) baseXp += 150
  if (isMultilingual) baseXp += 150
  if (hasDealbreakers) baseXp += 250
  if (isVaultReady) baseXp += 300

  baseXp += Math.min(savedJobsCount, 10) * 35
  baseXp += outboundApps.length * 150
  baseXp += highMatchApps.length * 50
  baseXp += respondedPitches.length * 150
  baseXp += activeThreads.length * 200
  baseXp += stage2Releases.length * 250

  const challenge1Done = isVaultReady
  const challenge2Progress = Math.min(
    3,
    outboundApps.length + savedJobsCount + respondedPitches.length
  )
  const challenge2Done = challenge2Progress >= 3
  const challenge3Progress = Math.min(2, activeThreads.length)
  const challenge3Done = challenge3Progress >= 2

  if (challenge1Done) baseXp += 500
  if (challenge2Done) baseXp += 350
  if (challenge3Done) baseXp += 600

  const isFounder = isSeasonZeroFounder(
    profile?.created_at,
    prefMeta?.founding_member
  )

  const totalXp = isFounder
    ? Math.round(baseXp * FOUNDER_XP_MULTIPLIER)
    : baseXp

  const rankData = resolveTierFromXp(totalXp)

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_season_0',
      title: 'Season 0 Founding Member',
      description:
        'Joined during the 90-day Founding Cohort. Grants permanent Gold Charter trim & 1.25x XP multiplier.',
      icon: '★',
      unlocked: isFounder,
      progressText: isFounder ? 'Charter Locked Forever' : 'Season 0 Exclusive',
      accentClass: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    {
      id: 'vault_ready',
      title: '100% Vault Ready (All-Star)',
      description:
        'Verified identity, extracted skill matrix, education/certifications, and dealbreakers configured.',
      icon: '🛡️',
      unlocked: isVaultReady,
      progressText: isVaultReady
        ? 'Unlocked (+300 XP)'
        : 'Complete profile & verification',
      accentClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    {
      id: 'precision_applicant',
      title: 'High-Precision Contender',
      description:
        'Submitted blind applications or matched with roles at a 75%+ 5-Point AI Match score.',
      icon: '🎯',
      unlocked: highMatchApps.length >= 1 || respondedPitches.length >= 1,
      progressText:
        highMatchApps.length >= 1 || respondedPitches.length >= 1
          ? 'Unlocked (+200 XP)'
          : 'Apply or match at 75%+ AI Fit',
      accentClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    },
    {
      id: 'responsive_pro',
      title: 'Responsive Communicator',
      description:
        'Engaged in encrypted Stage 1 employer threads or responded promptly to connection pitches.',
      icon: '⚡',
      unlocked: activeThreads.length >= 1 || respondedPitches.length >= 1,
      progressText:
        activeThreads.length >= 1 || respondedPitches.length >= 1
          ? 'Unlocked (+200 XP)'
          : 'Connect in 1 encrypted thread',
      accentClass: 'bg-violet-50 text-violet-800 border-violet-300',
    },
    {
      id: 'certified_specialist',
      title: 'Verified Credential Holder',
      description:
        'Listed active industry certifications or licenses for specialized role matching.',
      icon: '🏅',
      unlocked: hasCertifications,
      progressText: hasCertifications
        ? 'Unlocked (+150 XP)'
        : 'Add certifications on Profile',
      accentClass: 'bg-cyan-50 text-cyan-900 border-cyan-300',
    },
    {
      id: 'multilingual_specialist',
      title: 'Multilingual Specialist',
      description:
        'Documented proficiency in 2+ languages (with Advanced or Fluent secondary language ability).',
      icon: '🌐',
      unlocked: isMultilingual,
      progressText: isMultilingual
        ? 'Unlocked (+150 XP)'
        : 'Add a 2nd language on Profile',
      accentClass: 'bg-teal-50 text-teal-900 border-teal-300',
    },
    {
      id: 'stage2_veteran',
      title: 'Trusted Vault Veteran',
      description:
        'Completed Stage 2 Resume Vault release or earned an Employer Integrity Commendation.',
      icon: '🤝',
      unlocked: commendationsCount >= 1,
      progressText:
        commendationsCount >= 1
          ? 'Unlocked (+250 XP)'
          : 'Release Vault in an active thread',
      accentClass: 'bg-rose-50 text-rose-800 border-rose-300',
    },
  ]

  const seasonalChallenges: SeasonalChallengeItem[] = [
    {
      id: 's0_loadout',
      title: 'Season 0 Challenge: Full Vault Loadout',
      description:
        'Verify your identity, extract skills, set education/certifications, and lock dealbreakers.',
      xpReward: 500,
      current:
        (isVerified ? 1 : 0) +
        (hasBioAndSkills ? 1 : 0) +
        (hasEduOrCerts ? 1 : 0) +
        (hasDealbreakers ? 1 : 0),
      target: 4,
      completed: challenge1Done,
    },
    {
      id: 's0_radar',
      title: 'Season 0 Challenge: Market Radar Operator',
      description:
        'Save open roles to your comparison list, respond to pitches, or submit high-fit blind applications.',
      xpReward: 350,
      current: challenge2Progress,
      target: 3,
      completed: challenge2Done,
    },
    {
      id: 's0_vanguard',
      title: 'Season 0 Challenge: Encrypted Vanguard',
      description:
        'Open 2 encrypted Stage 1 threads with verified employers (via applications or accepted pitches).',
      xpReward: 600,
      current: challenge3Progress,
      target: 2,
      completed: challenge3Done,
    },
  ]

  return {
    role: 'candidate',
    isFounder,
    founderLabel: 'Season 0 Founding Member',
    totalXp,
    ...rankData,
    badges,
    seasonalChallenges,
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
    (a) => a.initiated_by === 'employer' || Number(org?.total_requests_sent) > 0
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

  let baseXp = 200
  if (isDomainVerified) baseXp += 600
  if (org?.description && String(org.description).trim().length > 20) {
    baseXp += 250
  }
  if (activeJobs.length > 0) baseXp += 350
  if (hasPayTransparency) baseXp += 250

  baseXp += Math.min(activeJobs.length, 15) * 150
  baseXp +=
    Math.max(sentPitches.length, Number(org?.total_requests_sent || 0)) * 150
  baseXp += unlockedOrReviewed.length * 150
  baseXp += messagedThreads.length * 225

  const challenge1Done = isDomainVerified && activeJobs.length >= 1
  const challenge2Progress = Math.min(
    3,
    activeJobs.length +
      Math.max(sentPitches.length, Number(org?.total_requests_sent || 0))
  )
  const challenge2Done = challenge2Progress >= 3
  const challenge3Progress = Math.min(
    2,
    unlockedOrReviewed.length + messagedThreads.length
  )
  const challenge3Done = challenge3Progress >= 2

  if (challenge1Done) baseXp += 500
  if (challenge2Done) baseXp += 400
  if (challenge3Done) baseXp += 600

  const isFounder = isSeasonZeroFounder(org?.created_at, true)
  const totalXp = isFounder
    ? Math.round(baseXp * FOUNDER_XP_MULTIPLIER)
    : baseXp

  const rankData = resolveTierFromXp(totalXp)

  const badges: EarnedBadgeItem[] = [
    {
      id: 'founder_partner',
      title: 'Season 0 Founding Partner',
      description:
        'Charter employer organization in the 90-day Founding Cohort (1.25x XP multiplier + Gold Trim).',
      icon: '★',
      unlocked: isFounder,
      progressText: 'Charter Locked Forever',
      accentClass: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    {
      id: 'domain_verified_org',
      title: 'Verified Corporate Domain',
      description:
        'Passed corporate domain & DNS verification to guarantee authentic job listings.',
      icon: '🛡️',
      unlocked: isDomainVerified,
      progressText: isDomainVerified
        ? 'Unlocked (+600 XP)'
        : 'Verify domain on Company Profile',
      accentClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    {
      id: 'pay_transparency_leader',
      title: 'Transparent Pay Leader',
      description:
        'Published blind role listings with upfront minimum and maximum compensation bands.',
      icon: '💎',
      unlocked: hasPayTransparency,
      progressText: hasPayTransparency
        ? 'Unlocked (+250 XP)'
        : 'Post a role with salary/hourly band',
      accentClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    },
    {
      id: 'active_reviewer',
      title: 'Responsive Hiring Team',
      description:
        'Actively unlocked, shortlisted, or messaged candidates in encrypted Stage 1 threads.',
      icon: '⚡',
      unlocked:
        unlockedOrReviewed.length >= 1 ||
        Number(org?.total_requests_sent || 0) >= 1,
      progressText:
        unlockedOrReviewed.length >= 1 ||
        Number(org?.total_requests_sent || 0) >= 1
          ? 'Unlocked (+375 XP)'
          : 'Unlock an applicant or send a pitch',
      accentClass: 'bg-violet-50 text-violet-800 border-violet-300',
    },
  ]

  const seasonalChallenges: SeasonalChallengeItem[] = [
    {
      id: 'emp_s0_launch',
      title: 'Season 0 Challenge: Verified Hiring Launch',
      description:
        'Verify your corporate domain and publish at least 1 active blind role with upfront compensation.',
      xpReward: 500,
      current: (isDomainVerified ? 1 : 0) + (activeJobs.length >= 1 ? 1 : 0),
      target: 2,
      completed: challenge1Done,
    },
    {
      id: 'emp_s0_outreach',
      title: 'Season 0 Challenge: Talent Radar & Outreach',
      description:
        'Publish active roles or send outbound connection pitches to passive candidates.',
      xpReward: 400,
      current: challenge2Progress,
      target: 3,
      completed: challenge2Done,
    },
    {
      id: 'emp_s0_engagement',
      title: 'Season 0 Challenge: Zero-Ghosting Engagement',
      description:
        'Unlock, shortlist, or message 2 candidates inside encrypted Stage 1 threads.',
      xpReward: 600,
      current: challenge3Progress,
      target: 2,
      completed: challenge3Done,
    },
  ]

  return {
    role: 'employer',
    isFounder,
    founderLabel: 'Season 0 Founding Partner',
    totalXp,
    ...rankData,
    badges,
    seasonalChallenges,
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
      summary.badges.find((b) => b.id === 'multilingual_specialist')
        ?.unlocked || false,
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