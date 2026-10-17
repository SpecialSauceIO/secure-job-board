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
  'Turkish',
  'ASL (American Sign Language)',
]

export const LANGUAGE_MODALITIES: LanguageModality[] = [
  'Both (Written & Verbal)',
  'Verbal Only',
  'Written Only',
]

export const LANGUAGE_PROFICIENCIES: LanguageProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Fluent / Native',
]

export const DEFAULT_ENGLISH_LANGUAGE: LanguageEntry = {
  language: 'English',
  modality: 'Both (Written & Verbal)',
  proficiency: 'Fluent / Native',
}

export function normalizeLanguageName(raw?: string | null): string {
  if (!raw) return 'English'
  const trimmed = raw.trim()
  if (!trimmed) return 'English'
  const lower = trimmed.toLowerCase()

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

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function normalizeLanguageModality(
  raw?: string | null
): LanguageModality {
  if (!raw) return 'Both (Written & Verbal)'
  const lower = raw.toLowerCase().trim()
  if (
    lower.includes('verbal only') ||
    lower.includes('spoken only') ||
    lower === 'verbal'
  ) {
    return 'Verbal Only'
  }
  if (lower.includes('written only') || lower === 'written') {
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
  if (lower.includes('interm') || lower.includes('conversational') || lower.includes('limited')) {
    return 'Intermediate'
  }
  if (lower.includes('adv') || lower.includes('professional') || lower.includes('working')) {
    return 'Advanced'
  }
  return 'Fluent / Native'
}

export function sanitizeLanguageArray(
  rawList: any,
  fallbackToDefaultEnglish = true
): LanguageEntry[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return fallbackToDefaultEnglish ? [{ ...DEFAULT_ENGLISH_LANGUAGE }] : []
  }

  const map = new Map<string, LanguageEntry>()

  for (const item of rawList) {
    if (!item) continue
    if (typeof item === 'string') {
      const langName = normalizeLanguageName(item)
      map.set(langName.toLowerCase(), {
        language: langName,
        modality: 'Both (Written & Verbal)',
        proficiency: 'Fluent / Native',
      })
      continue
    }

    if (typeof item === 'object') {
      const rawName = item.language || item.name || ''
      if (!rawName || !String(rawName).trim()) continue
      const langName = normalizeLanguageName(String(rawName))
      map.set(langName.toLowerCase(), {
        language: langName,
        modality: normalizeLanguageModality(item.modality),
        proficiency: normalizeLanguageProficiency(
          item.proficiency || item.level
        ),
      })
    }
  }

  const result = Array.from(map.values())
  if (result.length === 0 && fallbackToDefaultEnglish) {
    return [{ ...DEFAULT_ENGLISH_LANGUAGE }]
  }
  return result
}

export function formatLanguagePill(entry: LanguageEntry): string {
  const shortModality =
    entry.modality === 'Both (Written & Verbal)'
      ? 'Written & Verbal'
      : entry.modality
  const shortProf =
    entry.proficiency === 'Fluent / Native' ? 'Fluent' : entry.proficiency
  return `${entry.language} (${shortModality} • ${shortProf})`
}

export function formatLanguageListSummary(
  entries?: LanguageEntry[] | null
): string {
  const safe = sanitizeLanguageArray(entries, true)
  return safe.map(formatLanguagePill).join(', ')
}

function proficiencyRank(prof: LanguageProficiency): number {
  switch (prof) {
    case 'Beginner':
      return 1
    case 'Intermediate':
      return 2
    case 'Advanced':
      return 3
    case 'Fluent / Native':
      return 4
    default:
      return 4
  }
}

function modalitySatisfies(
  candidateModality: LanguageModality,
  requiredModality: LanguageModality
): boolean {
  if (candidateModality === 'Both (Written & Verbal)') return true
  if (requiredModality === 'Both (Written & Verbal)') {
    return false
  }
  return candidateModality === requiredModality
}

export function evaluateLanguageRequirements(
  candidateLanguagesRaw: any,
  jobRequiredLanguagesRaw: any
): {
  passes: boolean
  missingDescriptions: string[]
} {
  const candidateLangs = sanitizeLanguageArray(candidateLanguagesRaw, true)
  const requiredLangs = sanitizeLanguageArray(jobRequiredLanguagesRaw, true)

  const missingDescriptions: string[] = []

  for (const req of requiredLangs) {
    const match = candidateLangs.find(
      (c) => c.language.toLowerCase() === req.language.toLowerCase()
    )

    if (!match) {
      missingDescriptions.push(
        `Requires ${req.language} (${req.modality} • ${req.proficiency})`
      )
      continue
    }

    const profOk =
      proficiencyRank(match.proficiency) >= proficiencyRank(req.proficiency)
    const modOk = modalitySatisfies(match.modality, req.modality)

    if (!profOk || !modOk) {
      missingDescriptions.push(
        `Requires ${req.language} (${req.modality} • ${req.proficiency}), candidate has (${match.modality} • ${match.proficiency})`
      )
    }
  }

  return {
    passes: missingDescriptions.length === 0,
    missingDescriptions,
  }
}