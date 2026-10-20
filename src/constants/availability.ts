export const CANDIDATE_AVAILABILITY_STATUSES = [
  'Immediate (< 1 Week)',
  'Standard (2 Weeks Notice)',
  'Open to high-fit pitches (2-4 Weeks Notice)',
  'Executive Transition (30+ Days Notice)',
  'Paused (Not Accepting Pitches Right Now)',
] as const

export type CandidateAvailabilityStatus =
  (typeof CANDIDATE_AVAILABILITY_STATUSES)[number]

export function normalizeCandidateAvailability(raw?: string | null): string {
  if (!raw || !raw.trim()) {
    return 'Standard (2 Weeks Notice)'
  }
  const v = raw.trim()
  const exact = CANDIDATE_AVAILABILITY_STATUSES.find(
    (item) => item.toLowerCase() === v.toLowerCase()
  )
  if (exact) return exact

  const lower = v.toLowerCase()
  if (
    lower.includes('paused') ||
    lower.includes('not accepting') ||
    lower.includes('not looking') ||
    lower.includes('off market')
  ) {
    return 'Paused (Not Accepting Pitches Right Now)'
  }
  if (
    lower.includes('immediate') ||
    lower.includes('within 1 week') ||
    lower.includes('< 1 week') ||
    lower.includes('1 week') ||
    lower.includes('asap') ||
    lower.includes('actively interviewing')
  ) {
    return 'Immediate (< 1 Week)'
  }
  if (
    lower.includes('high-fit') ||
    lower.includes('high fit') ||
    lower.includes('selective') ||
    lower.includes('within 1 month') ||
    lower.includes('3–4 weeks') ||
    lower.includes('3-4 weeks') ||
    lower.includes('2–4 weeks') ||
    lower.includes('2-4 weeks')
  ) {
    return 'Open to high-fit pitches (2-4 Weeks Notice)'
  }
  if (
    lower.includes('more than 1 month') ||
    lower.includes('30+ days') ||
    lower.includes('30 days') ||
    lower.includes('executive transition') ||
    lower.includes('open to offers')
  ) {
    return 'Executive Transition (30+ Days Notice)'
  }
  if (
    lower.includes('2 weeks') ||
    lower.includes('two weeks') ||
    lower.includes('standard') ||
    lower.includes('actively looking')
  ) {
    return 'Standard (2 Weeks Notice)'
  }

  return 'Standard (2 Weeks Notice)'
}

export function isCandidatePaused(status?: string | null): boolean {
  const norm = normalizeCandidateAvailability(status)
  return norm.startsWith('Paused')
}

export function getAvailabilityBadgeClasses(status?: string | null): string {
  const norm = normalizeCandidateAvailability(status)
  if (norm.startsWith('Immediate')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300'
  }
  if (norm.startsWith('Standard')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-300'
  }
  if (norm.startsWith('Open to high-fit')) {
    return 'bg-violet-50 text-violet-800 border-violet-300'
  }
  if (norm.startsWith('Executive Transition')) {
    return 'bg-amber-50 text-amber-900 border-amber-300'
  }
  if (norm.startsWith('Paused')) {
    return 'bg-slate-100 text-slate-600 border-slate-300'
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-300'
}
