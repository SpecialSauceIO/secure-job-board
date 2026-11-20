export const CANDIDATE_AVAILABILITY_STATUSES = [
  'Immediate (< 1 Week)',
  'Standard (2 Weeks Notice)',
  'Open to Professional Invitations (2-4 Weeks Notice)',
  'Executive Transition (30+ Days Notice)',
  'Paused (Not Accepting Invitations Right Now)',
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
    return 'Paused (Not Accepting Invitations Right Now)'
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
    return 'Open to Professional Invitations (2-4 Weeks Notice)'
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
  if (
    norm.startsWith('Open to Professional Invitations') ||
    norm.startsWith('Open to high-fit')
  ) {
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

export const MAX_ROLE_OPENINGS = 25

export interface RoleSeatSummary {
  openingsCount: number
  filledApplicationIds: string[]
  filledCount: number
  remainingOpenings: number
  activeSlotsUsed: number
  isAllSeatsFilled: boolean
}

export function clampRoleOpenings(raw: unknown, fallback = 1): number {
  const parsed = Math.floor(Number(raw))
  if (!Number.isFinite(parsed) || parsed < 1) {
    return Math.min(MAX_ROLE_OPENINGS, Math.max(1, Math.floor(Number(fallback)) || 1))
  }
  return Math.min(MAX_ROLE_OPENINGS, parsed)
}

export function extractRoleMetaItem(
  structuredRequirements: unknown,
  fallbackMeta?: Record<string, any> | null
): Record<string, any> {
  if (Array.isArray(structuredRequirements)) {
    const found = structuredRequirements.find(
      (r: any) => r && typeof r === 'object' && r._ss_job_meta === true
    )
    if (found && typeof found === 'object') return found
  }
  if (fallbackMeta && typeof fallbackMeta === 'object') return fallbackMeta
  return {}
}

export function isApplicationSeatPlaced(app: any): boolean {
  const md = app?.match_data
  if (!md || typeof md !== 'object') return false
  if (md.direct_hire_placed === true) return true
  const tStatus = String(md?.trial_to_hire?.status || '')
  return tStatus === 'accepted_pending_eor' || tStatus === 'converted_direct'
}

export function resolveRoleSeatSummary(
  job: any,
  roleApplications?: any[]
): RoleSeatSummary {
  const meta = extractRoleMetaItem(job?.structured_requirements, job?.job_meta)
  const openingsCount = clampRoleOpenings(
    job?.openings_count ?? meta?.openings_count,
    1
  )
  const idSet = new Set<string>()
  if (Array.isArray(meta?.filled_application_ids)) {
    for (const rawId of meta.filled_application_ids) {
      const clean = String(rawId || '').trim()
      if (clean) idSet.add(clean)
    }
  }
  if (Array.isArray(roleApplications)) {
    for (const app of roleApplications) {
      if (isApplicationSeatPlaced(app)) {
        const appId = String(app?.id || app?.uuid || '').trim()
        if (appId) idSet.add(appId)
      }
    }
  }
  const filledApplicationIds = Array.from(idSet)
  const filledCount = filledApplicationIds.length
  const remainingOpenings = Math.max(0, openingsCount - filledCount)
  const isActive = job?.is_active !== false
  const activeSlotsUsed = isActive ? Math.max(1, remainingOpenings) : 0
  return {
    openingsCount,
    filledApplicationIds,
    filledCount,
    remainingOpenings,
    activeSlotsUsed,
    isAllSeatsFilled: filledCount >= openingsCount,
  }
}

export function sumActiveRoleSlots(
  jobs: any[] | null | undefined,
  applicationsByJobId?: Record<string, any[]>
): number {
  if (!Array.isArray(jobs)) return 0
  let total = 0
  for (const job of jobs) {
    if (!job || job.is_active === false) continue
    const key = String(job.id || job.uuid || '')
    const apps = key && applicationsByJobId ? applicationsByJobId[key] : undefined
    total += resolveRoleSeatSummary(job, apps).activeSlotsUsed
  }
  return total
}
