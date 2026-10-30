import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { resolveEmployerTierInfo } from '@/app/dashboard/actions'
import { checkEmployerSilentUnlockQuota } from '@/app/dashboard/messaging-actions'
import { normalizeIndustryVertical } from '@/constants/industries'
import EmployerJobsTableClient, {
  EnrichedEmployerJobRow,
} from '@/components/EmployerJobsTableClient'

export const dynamic = 'force-dynamic'

const JOB_EXPIRATION_DAYS = 30
const RENEWAL_WINDOW_DAYS = 5
const MAX_JOB_RENEWALS = 2

function enrichJobForManagementTable(job: any): EnrichedEmployerJobRow {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find(
      (r: any) => r && typeof r === 'object' && r._ss_job_meta === true
    ) || {}
  const visibleReqs = rawReqs.filter(
    (r: any) =>
      r &&
      typeof r === 'object' &&
      !r._ss_job_meta &&
      (r.skill || r.name) &&
      !String(r.skill || r.name).startsWith('__SS_')
  )

  const baseTimestamp =
    metaItem.renewed_at || job?.created_at || new Date().toISOString()
  const startMs = new Date(baseTimestamp).getTime()
  const expiresMs = startMs + JOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
  const diffMs = expiresMs - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const isExpired = diffMs <= 0

  const payType: 'annual' | 'hourly' =
    metaItem.pay_type === 'hourly' ||
    (job?.salary_max && job.salary_max > 0 && job.salary_max <= 500)
      ? 'hourly'
      : 'annual'

  const formatAmount = (val?: number | null) => {
    if (!val || isNaN(Number(val))) return null
    const num = Number(val)
    if (payType === 'hourly') return `$${num.toLocaleString()}`
    if (num >= 1000) {
      const kVal = num / 1000
      return `$${Number.isInteger(kVal) ? kVal : kVal.toFixed(1)}k`
    }
    return `$${num.toLocaleString()}`
  }

  const minStr = formatAmount(job?.salary_min)
  const maxStr = formatAmount(job?.salary_max)
  const unitSuffix = payType === 'hourly' ? '/hr' : '/yr'

  let formattedPay = 'Pay Open'
  if (minStr && maxStr) {
    formattedPay = `${minStr} – ${maxStr} ${unitSuffix}`
  } else if (minStr) {
    formattedPay = `${minStr}+ ${unitSuffix}`
  } else if (maxStr) {
    formattedPay = `Up to ${maxStr} ${unitSuffix}`
  }

  const rawMax = Number(job?.salary_max) || Number(job?.salary_min) || 0
  const rawMin = Number(job?.salary_min) || Number(job?.salary_max) || 0
  const annualizedMaxPay = payType === 'hourly' ? rawMax * 2080 : rawMax
  const annualizedMinPay = payType === 'hourly' ? rawMin * 2080 : rawMin

  const inboundApps = Array.isArray(job?.applications)
    ? job.applications.filter((a: any) => a.initiated_by !== 'employer')
    : []
  const applicantCount = inboundApps.length

  const unactionedApplicantCount = inboundApps.filter((a: any) => {
    const st = String(a?.status || 'pending').toLowerCase()
    if (st === 'rejected' || st === 'declined') return false
    const md = a?.match_data || {}
    const msgs = Array.isArray(md.messages) ? md.messages : []
    const hasEmployerMsg =
      Boolean(md.employer_messaged_at) ||
      msgs.some((m: any) => m && m.sender_role === 'employer')
    const hasCandidateReply =
      Boolean(md.candidate_vault_released) ||
      msgs.some((m: any) => m && m.sender_role === 'candidate')
    if (md.employer_boilerplate_blast === true && !hasCandidateReply) {
      return true
    }
    return !hasEmployerMsg
  }).length

  const renewalCount = Math.max(0, Number(metaItem.renewal_count) || 0)

  const rawIndustry = metaItem.industry || job?.industry || ''
  const normalizedIndustry = rawIndustry
    ? normalizeIndustryVertical(rawIndustry)
    : ''

  return {
    id: String(job.id),
    title: job.title || 'Untitled Role',
    work_model: job.work_model || 'hybrid',
    created_at: job.created_at || new Date().toISOString(),
    is_active: Boolean(job.is_active && !isExpired),
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    pay_type: payType,
    formattedPay,
    annualizedMaxPay,
    annualizedMinPay,
    location: metaItem.location || '',
    employmentType: metaItem.employment_type || 'Full-Time (W-2)',
    industry: normalizedIndustry,
    applicantCount,
    unactionedApplicantCount,
    renewalCount,
    maxRenewals: MAX_JOB_RENEWALS,
    inRenewalWindow: Boolean(isExpired || !job.is_active || daysRemaining <= RENEWAL_WINDOW_DAYS),
    daysRemaining,
    isExpired,
    expiresAtIso: new Date(expiresMs).toISOString(),
    renewedAtIso: metaItem.renewed_at || null,
    skillsString: visibleReqs
      .map((r: any) => r.skill || r.name || '')
      .join(', '),
  }
}

export default async function JobManagementPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verify they are an employer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'employer') redirect('/dashboard')

  // 3. Get their organization & verification status
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) redirect('/dashboard/employer/organization')

  const orgObj: any = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations

  const isOrgVerified = orgObj?.verification_status === 'verified'
  const tierInfo = await resolveEmployerTierInfo(orgObj)

  // 4. Fetch all jobs belonging to this organization, plus a count of applications
  const { data: jobs } = await supabase
    .from('jobs')
    .select(
      `
      *,
      applications (id, initiated_by, status, is_revealed, created_at, match_data)
    `
    )
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  // 5. Auto-close any active jobs whose 30-day window has elapsed
  const expiredActiveJobIds: string[] = []
  const enrichedRows: EnrichedEmployerJobRow[] = (jobs || []).map((job) => {
    const row = enrichJobForManagementTable(job)
    if (job.is_active && row.isExpired) {
      expiredActiveJobIds.push(job.id)
    }
    return row
  })

  if (expiredActiveJobIds.length > 0) {
    await supabase
      .from('jobs')
      .update({ is_active: false })
      .in('id', expiredActiveJobIds)
  }

  // INLINE SERVER ACTION: Toggle job active status or manually renew (+30 days)
  async function toggleOrRenewJobStatus(formData: FormData) {
    'use server'
    const supabaseAction = await createClient()
    const {
      data: { user: actionUser },
    } = await supabaseAction.auth.getUser()
    if (!actionUser) redirect('/login')

    const jobId = formData.get('job_id') as string
    const actionType = (formData.get('action_type') as string) || 'toggle'
    const currentStatus = formData.get('current_status') === 'true'

    if (!jobId) return

    const { data: memberRow } = await supabaseAction
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', actionUser.id)
      .single()

    if (!memberRow?.organization_id) return

    const orgRecord: any = Array.isArray(memberRow.organizations)
      ? memberRow.organizations[0]
      : memberRow.organizations

    if (actionType === 'close' || (actionType === 'toggle' && currentStatus)) {
      await supabaseAction
        .from('jobs')
        .update({ is_active: false })
        .eq('id', jobId)
        .eq('organization_id', memberRow.organization_id)

      revalidatePath('/dashboard/employer/jobs')
      revalidatePath('/dashboard/jobs')
      revalidatePath('/dashboard')
      return
    }

    // Reopening or Renewing a role for a fresh 30-day window: check tier active role limits first
    const currentTier = await resolveEmployerTierInfo(orgRecord)
    const { data: targetJob } = await supabaseAction
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('organization_id', memberRow.organization_id)
      .single()

    if (!targetJob) return

    if (!targetJob.is_active) {
      const { count: activeCount } = await supabaseAction
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', memberRow.organization_id)
        .eq('is_active', true)

      if ((activeCount || 0) >= currentTier.maxActiveJobs) {
        revalidatePath('/dashboard/employer/jobs')
        return
      }
    }

    // Check Renewal Guardrails: (1) Days 25-30 Window, (2) Max 2 Renewals, (3) Active Professional Engagement
    const rawReqs = Array.isArray(targetJob.structured_requirements)
      ? targetJob.structured_requirements
      : []
    const existingMeta =
      rawReqs.find(
        (r: any) => r && typeof r === 'object' && r._ss_job_meta === true
      ) || { _ss_job_meta: true }
    const otherReqs = rawReqs.filter(
      (r: any) => !(r && typeof r === 'object' && r._ss_job_meta === true)
    )

    const baseTimestamp =
      existingMeta.renewed_at || targetJob.created_at || new Date().toISOString()
    const startMs = new Date(baseTimestamp).getTime()
    const expiresMs = startMs + JOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
    const diffMs = expiresMs - Date.now()
    const currentDaysRemaining = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    )
    const isCurrentlyExpired = diffMs <= 0

    // Gate 1: Must be within final 5 days (Days 25-30) or already closed/expired
    if (
      targetJob.is_active &&
      !isCurrentlyExpired &&
      currentDaysRemaining > RENEWAL_WINDOW_DAYS
    ) {
      revalidatePath('/dashboard/employer/jobs')
      return
    }

    // Gate 2: Max consecutive renewals cap (2 renewals = 90 days max per listing)
    const currentRenewalCount = Math.max(0, Number(existingMeta.renewal_count) || 0)
    if (currentRenewalCount >= MAX_JOB_RENEWALS) {
      revalidatePath('/dashboard/employer/jobs')
      return
    }

    // Gate 3a: Organization-wide Silent Unlock Quota check
    const silentQuota = await checkEmployerSilentUnlockQuota(
      memberRow.organization_id
    )
    if (!silentQuota.allowed) {
      revalidatePath('/dashboard/employer/jobs')
      return
    }

    // Gate 3b: Job-specific Unactioned Inbound Applicants check
    const { data: jobApps } = await supabaseAction
      .from('applications')
      .select('id, initiated_by, status, match_data')
      .eq('job_id', jobId)

    const inboundJobApps = (jobApps || []).filter(
      (a: any) => a.initiated_by !== 'employer'
    )
    const unactionedApps = inboundJobApps.filter((a: any) => {
      const st = String(a?.status || 'pending').toLowerCase()
      if (st === 'rejected' || st === 'declined') return false
      const md = a?.match_data || {}
      const msgs = Array.isArray(md.messages) ? md.messages : []
      const hasEmployerMsg =
        Boolean(md.employer_messaged_at) ||
        msgs.some((m: any) => m && m.sender_role === 'employer')
      const hasCandidateReply =
        Boolean(md.candidate_vault_released) ||
        msgs.some((m: any) => m && m.sender_role === 'candidate')
      if (md.employer_boilerplate_blast === true && !hasCandidateReply) {
        return true
      }
      return !hasEmployerMsg
    })

    if (unactionedApps.length > 0) {
      revalidatePath('/dashboard/employer/jobs')
      return
    }

    // Gate 3c: If a role has 5+ inbound applicants, require real pipeline decisions
    // (at least 1 two-way thread/Stage 2 vault unlock OR formal declines on non-fits)
    if (inboundJobApps.length >= 5) {
      const hasRealProgressionOrDecision = inboundJobApps.some((a: any) => {
        const st = String(a?.status || 'pending').toLowerCase()
        if (st === 'rejected' || st === 'declined') return true
        const md = a?.match_data || {}
        const msgs = Array.isArray(md.messages) ? md.messages : []
        return (
          Boolean(md.candidate_vault_released) ||
          msgs.some((m: any) => m && m.sender_role === 'candidate')
        )
      })
      if (!hasRealProgressionOrDecision) {
        revalidatePath('/dashboard/employer/jobs')
        return
      }
    }

    const nowIso = new Date().toISOString()
    const updatedMeta = {
      ...existingMeta,
      _ss_job_meta: true,
      renewed_at: nowIso,
      renewal_count: currentRenewalCount + 1,
    }

    await supabaseAction
      .from('jobs')
      .update({
        is_active: true,
        structured_requirements: [...otherReqs, updatedMeta],
      })
      .eq('id', jobId)
      .eq('organization_id', memberRow.organization_id)

    revalidatePath('/dashboard/employer/jobs')
    revalidatePath('/dashboard/jobs')
    revalidatePath('/dashboard')
  }

  const activeJobsCount = enrichedRows.filter((j) => j.is_active).length
  const slotsFull = tierInfo.maxActiveJobs > 0 && activeJobsCount >= tierInfo.maxActiveJobs

  return (
    <div className="py-2">
      <div className="max-w-6xl mx-auto py-3 space-y-6">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Employer Dashboard
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Job Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage your active listings ({activeJobsCount}/
              {tierInfo.maxActiveJobs} slots used). To prevent passive resume harvesting, all roles automatically close after{' '}
              <strong>{JOB_EXPIRATION_DAYS} days</strong> unless manually renewed.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {isOrgVerified ? (
              <Link
                href="/dashboard/employer/jobs/new"
                className="w-full sm:w-auto text-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all text-sm"
              >
                + Post New Job
              </Link>
            ) : (
              <Link
                href="/dashboard/employer/organization"
                className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-sm transition-all text-sm inline-flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Verify Domain to Post Jobs →
              </Link>
            )}
          </div>
        </header>

        {/* Anti-Harvesting 30-Day Expiration Policy Callout */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
              30d
            </span>
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-extrabold text-slate-900 block">
                Anti-Harvesting Freshness Policy (30-Day Auto-Expiry)
              </span>
              Every open role is active for 30 days and automatically closes at Day 30 so candidates never apply to ghost roles. To prevent perpetual listing resets and passive resume harvesting, renewals unlock only during the final 5 days of a cycle (Days 25–30), require zero unanswered applicants in your inbox, and are capped at 2 renewals (90 days max per role).
            </div>
          </div>
        </div>

        {!isOrgVerified && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Corporate Domain Verification Required to Post New Roles
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  You must verify your company domain on your Company Profile before creating new protected job listings.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/employer/organization"
              className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors text-center"
            >
              Verify Domain →
            </Link>
          </div>
        )}

        <section>
          {enrichedRows.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 shadow-sm text-center border-slate-300">
              <div className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No jobs posted yet
              </h3>
              <p className="text-slate-500 mb-6">
                {isOrgVerified
                  ? 'Create your first protected job listing to start receiving anonymous applications.'
                  : 'Verify your corporate domain first to unlock protected job postings.'}
              </p>
              {isOrgVerified ? (
                <Link
                  href="/dashboard/employer/jobs/new"
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Post your first job
                </Link>
              ) : (
                <Link
                  href="/dashboard/employer/organization"
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-indigo-600 shadow-sm transition-all"
                >
                  Verify Corporate Domain →
                </Link>
              )}
            </div>
          ) : (
            <EmployerJobsTableClient
              jobs={enrichedRows}
              activeJobsCount={activeJobsCount}
              maxActiveJobs={tierInfo.maxActiveJobs}
              slotsFull={slotsFull}
              toggleOrRenewJobStatus={toggleOrRenewJobStatus}
            />
          )}
        </section>
      </div>
    </div>
  )
}