import { sanitizeLanguageArray } from '@/constants/languages'

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

// 90-Day Season 0 Founding Window (Through January 31, 2027)
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

  const candidateLanguages = sanitizeLanguageArray(
    profile?.languages || prefMeta?.languages,
    true
  )
  const isMultilingual = candidateLanguages.length >= 2

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
      title: 'Verified Credential & Language Pro',
      description:
        'Listed active industry certifications or multilingual fluency for specialized role matching.',
      icon: '🏅',
      unlocked: hasCertifications || isMultilingual,
      progressText:
        hasCertifications || isMultilingual
          ? 'Unlocked (+150 XP)'
          : 'Add certifications or 2nd language',
      accentClass: 'bg-cyan-50 text-cyan-900 border-cyan-300',
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
Here are the complete, single-block **`Cmd + A` → `Delete` → `Paste` → `Cmd + S`** files for **Part 1 of the Language Matrix Rollout**:

1. **`src/constants/languages.ts` (New File):** Establishes the standardized business language list, modality options (`Both (Written & Verbal)`, `Verbal Only`, `Written Only`), proficiency levels (`Beginner`, `Intermediate`, `Advanced`, `Fluent / Native`), the automatic **English — Both — Fluent / Native** fallback, dealbreaker evaluation logic (`evaluateLanguageRequirements`), and compact badge formatting.
2. **`src/constants/gamification.ts` (Full Replacement):** Upgrades the Candidate XP & Trophy Case engine to award **+150 Base XP** and unlock the **`🌐 Multilingual Specialist`** badge whenever a candidate documents 2+ languages (with at least one at `Advanced` or `Fluent / Native`), and exports `isMultilingual` for the anonymous candidate cards.
3. **`src/app/dashboard/actions.ts` (Full Replacement):** Wires `languages` and `required_languages` into Candidate Profile saving, AI PDF Resume Auto-Fill, AI Job Description PDF Auto-Fill, Job Creation/Updating, the 5-Point AI Match Prompt, and the Employer Outbound Pitch dealbreaker firewall.

---

### 1. Create `src/constants/languages.ts`
In VS Code, right-click **`src/constants`** → **New File...**, name it **`languages.ts`**, paste this complete file, and press **`Cmd + S`**:

```ts
export type LanguageModality =
  | 'Both (Written & Verbal)'
  | 'Verbal Only'
  | 'Written Only'

export type LanguageProficiency =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Fluent / Native'

export interface LanguageEntry {
  language: string
  modality: LanguageModality
  proficiency: LanguageProficiency
}

export const STANDARD_LANGUAGES: string[] = [
  'English',
  'Spanish',
  'Tagalog / Filipino',
  'Mandarin Chinese',
  'Cantonese',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
  'Vietnamese',
  'Russian',
  'Italian',
  'Polish',
  'Dutch',
  'Ukrainian',
  'Hebrew',
  'Turkish',
  'ASL (American Sign Language)',
]

export const LANGUAGE_MODALITIES: LanguageModality[] = [
  'Both (Written & Verbal)',
  'Verbal Only',
  'Written Only',
]

export const LANGUAGE_PROFICIENCIES: LanguageProficiency[] = [
  'Fluent / Native',
  'Advanced',
  'Intermediate',
  'Beginner',
]

export const DEFAULT_LANGUAGE_ENTRY: LanguageEntry = {
  language: 'English',
  modality: 'Both (Written & Verbal)',
  proficiency: 'Fluent / Native',
}

const PROFICIENCY_RANK: Record<LanguageProficiency, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  'Fluent / Native': 4,
}

export function normalizeLanguageName(raw?: string | null): string {
  if (!raw) return 'English'
  const clean = raw.trim()
  if (!clean) return 'English'
  const lower = clean.toLowerCase()

  if (lower.includes('tagalog') || lower.includes('filipino')) {
    return 'Tagalog / Filipino'
  }
  if (lower.includes('mandarin') || lower === 'chinese') {
    return 'Mandarin Chinese'
  }
  if (lower.includes('asl') || lower.includes('sign language')) {
    return 'ASL (American Sign Language)'
  }

  const exact = STANDARD_LANGUAGES.find((l) => l.toLowerCase() === lower)
  if (exact) return exact

  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export function normalizeLanguageModality(
  raw?: string | null
): LanguageModality {
  if (!raw) return 'Both (Written & Verbal)'
  const lower = raw.toLowerCase().trim()
  if (lower.includes('verbal') && !lower.includes('written') && !lower.includes('both')) {
    return 'Verbal Only'
  }
  if (lower.includes('written') && !lower.includes('verbal') && !lower.includes('both')) {
    return 'Written Only'
  }
  return 'Both (Written & Verbal)'
}

export function normalizeLanguageProficiency(
  raw?: string | null
): LanguageProficiency {
  if (!raw) return 'Fluent / Native'
  const lower = raw.toLowerCase().trim()
  if (lower.includes('begin') || lower.includes('basic') || lower.includes('elementary')) {
    return 'Beginner'
  }
  if (lower.includes('interm') || lower.includes('conversational') || lower.includes('working')) {
    return 'Intermediate'
  }
  if (lower.includes('adv') || lower.includes('professional')) {
    return 'Advanced'
  }
  return 'Fluent / Native'
}

export function normalizeLanguageList(
  rawList: any,
  includeEnglishDefault = true
): LanguageEntry[] {
  let parsed: any[] = []

  if (Array.isArray(rawList)) {
    parsed = rawList
  } else if (typeof rawList === 'string' && rawList.trim()) {
    try {
      const maybeJson = JSON.parse(rawList)
      if (Array.isArray(maybeJson)) {
        parsed = maybeJson
      }
    } catch {
      parsed = rawList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((lang) => ({
          language: lang,
          modality: 'Both (Written & Verbal)',
          proficiency: 'Fluent / Native',
        }))
    }
  }

  const deduped = new Map<string, LanguageEntry>()

  for (const item of parsed) {
    if (!item) continue
    const rawLang =
      typeof item === 'string'
        ? item
        : item.language || item.name || item.lang || ''
    if (!rawLang || !String(rawLang).trim()) continue

    const language = normalizeLanguageName(String(rawLang))
    const modality = normalizeLanguageModality(
      typeof item === 'object' ? item.modality || item.type : undefined
    )
    const proficiency = normalizeLanguageProficiency(
      typeof item === 'object' ? item.proficiency || item.level : undefined
    )

    deduped.set(language.toLowerCase(), {
      language,
      modality,
      proficiency,
    })
  }

  const result = Array.from(deduped.values())
  if (result.length === 0 && includeEnglishDefault) {
    return [{ ...DEFAULT_LANGUAGE_ENTRY }]
  }
  return result
}

export function formatLanguageBadge(entry: LanguageEntry): string {
  const shortModality =
    entry.modality === 'Both (Written & Verbal)'
      ? 'Written & Verbal'
      : entry.modality
  const shortProf =
    entry.proficiency === 'Fluent / Native' ? 'Fluent' : entry.proficiency
  return `${entry.language} (${shortModality} • ${shortProf})`
}

export function formatLanguageListSummary(
  rawList: any,
  includeEnglishDefault = true
): string {
  const list = normalizeLanguageList(rawList, includeEnglishDefault)
  if (list.length === 0) return 'English (Written & Verbal • Fluent)'
  return list.map(formatLanguageBadge).join(', ')
}

export function evaluateLanguageRequirements(
  candidateRawLanguages: any,
  jobRawRequiredLanguages: any
): {
  passes: boolean
  missingDescriptions: string[]
} {
  const candidateLangs = normalizeLanguageList(candidateRawLanguages, true)
  const jobReqs = normalizeLanguageList(jobRawRequiredLanguages, true)

  const missingDescriptions: string[] = []

  for (const req of jobReqs) {
    const matched = candidateLangs.find(
      (c) => c.language.toLowerCase() === req.language.toLowerCase()
    )

    if (!matched) {
      missingDescriptions.push(
        `Requires ${req.language} (${req.modality} • ${req.proficiency})`
      )
      continue
    }

    const reqRank = PROFICIENCY_RANK[req.proficiency] || 4
    const candRank = PROFICIENCY_RANK[matched.proficiency] || 4

    if (candRank < reqRank) {
      missingDescriptions.push(
        `Requires ${req.language} at ${req.proficiency}+ level (Candidate is ${matched.proficiency})`
      )
      continue
    }

    if (
      req.modality === 'Both (Written & Verbal)' &&
      matched.modality !== 'Both (Written & Verbal)'
    ) {
      missingDescriptions.push(
        `Requires ${req.language} in Both Written & Verbal (Candidate is ${matched.modality})`
      )
    } else if (
      req.modality === 'Verbal Only' &&
      matched.modality === 'Written Only'
    ) {
      missingDescriptions.push(
        `Requires Verbal ${req.language} (Candidate is Written Only)`
      )
    } else if (
      req.modality === 'Written Only' &&
      matched.modality === 'Verbal Only'
    ) {
      missingDescriptions.push(
        `Requires Written ${req.language} (Candidate is Verbal Only)`
      )
    }
  }

  return {
    passes: missingDescriptions.length === 0,
    missingDescriptions,
  }
}