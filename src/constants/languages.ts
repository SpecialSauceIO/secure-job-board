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

export const DEFAULT_ENGLISH_LANGUAGE: LanguageEntry = DEFAULT_LANGUAGE_ENTRY

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
  if (lower.includes('cantonese')) {
    return 'Cantonese'
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
  if (
    lower.includes('verbal') &&
    !lower.includes('written') &&
    !lower.includes('both')
  ) {
    return 'Verbal Only'
  }
  if (
    lower.includes('written') &&
    !lower.includes('verbal') &&
    !lower.includes('both')
  ) {
    return 'Written Only'
  }
  return 'Both (Written & Verbal)'
}

export function normalizeLanguageProficiency(
  raw?: string | null
): LanguageProficiency {
  if (!raw) return 'Fluent / Native'
  const lower = raw.toLowerCase().trim()
  if (
    lower.includes('begin') ||
    lower.includes('basic') ||
    lower.includes('elementary')
  ) {
    return 'Beginner'
  }
  if (
    lower.includes('interm') ||
    lower.includes('conversational') ||
    lower.includes('working') ||
    lower.includes('limited')
  ) {
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

// Alias for backward compatibility
export const sanitizeLanguageArray = normalizeLanguageList

export function formatLanguageBadge(entry: LanguageEntry): string {
  const shortModality =
    entry.modality === 'Both (Written & Verbal)'
      ? 'Written & Verbal'
      : entry.modality
  const shortProf =
    entry.proficiency === 'Fluent / Native' ? 'Fluent' : entry.proficiency
  return `${entry.language} (${shortModality} • ${shortProf})`
}

// Alias for backward compatibility
export const formatLanguagePill = formatLanguageBadge

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
        `Requires ${req.language} at ${req.proficiency}+ level (Professional is ${matched.proficiency})`
      )
      continue
    }

    if (
      req.modality === 'Both (Written & Verbal)' &&
      matched.modality !== 'Both (Written & Verbal)'
    ) {
      missingDescriptions.push(
        `Requires ${req.language} in Both Written & Verbal (Professional is ${matched.modality})`
      )
    } else if (
      req.modality === 'Verbal Only' &&
      matched.modality === 'Written Only'
    ) {
      missingDescriptions.push(
        `Requires Verbal ${req.language} (Professional is Written Only)`
      )
    } else if (
      req.modality === 'Written Only' &&
      matched.modality === 'Verbal Only'
    ) {
      missingDescriptions.push(
        `Requires Written ${req.language} (Professional is Verbal Only)`
      )
    }
  }

  return {
    passes: missingDescriptions.length === 0,
    missingDescriptions,
  }
}