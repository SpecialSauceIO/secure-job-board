import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { resolveEmployerTierInfo } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

const JOB_EXPIRATION_DAYS = 30

function computeJobExpirationInfo(job: any): {
  daysRemaining: number
  isExpired: boolean
  expiresAtDate: Date
  renewedAtIso: string | null
} {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && typeof r === 'object' && r._ss_job_meta === true) || {}

  const baseTimestamp = metaItem.renewed_at || job?.created_at || new Date().toISOString()
  const startMs = new Date(baseTimestamp).getTime()
  const expiresMs = startMs + JOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
  const diffMs = expiresMs - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  return {
    daysRemaining,
    isExpired: diffMs <= 0,
    expiresAtDate: new Date(expiresMs),
    renewedAtIso: metaItem.renewed_at || null,
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
      applications (id, initiated_by)
    `
    )
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  // 5. Auto-close any active jobs whose 30-day window has elapsed
  const expiredActiveJobIds: string[] = []
  for (const job of jobs || []) {
    const expInfo = computeJobExpirationInfo(job)
    if (job.is_active && expInfo.isExpired) {
      expiredActiveJobIds.push(job.id)
      job.is_active = false
    }
  }

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

    // Stamp fresh renewed_at (+30 days) inside _ss_job_meta
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

    const nowIso = new Date().toISOString()
    const updatedMeta = {
      ...existingMeta,
      _ss_job_meta: true,
      renewed_at: nowIso,
      renewal_count: (Number(existingMeta.renewal_count) || 0) + 1,
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

  const activeJobsCount = (jobs || []).filter((j) => j.is_active).length
  const slotsFull = activeJobsCount >= tierInfo.maxActiveJobs

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Job Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage your active listings ({activeJobsCount}/{tierInfo.maxActiveJobs} slots used). To prevent passive resume harvesting, all roles automatically close after <strong>{JOB_EXPIRATION_DAYS} days</strong> unless manually renewed.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {isOrgVerified ? (
              <Link
                href="/dashboard/employer/jobs/new"
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all text-sm"
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
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
              30d
            </span>
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-extrabold text-slate-900 block">
                Anti-Harvesting Freshness Policy (30-Day Auto-Expiry)
              </span>
              Every open role is active for 30 days. When a listing reaches 0 days remaining, it automatically closes so candidates never apply to ghost roles. You can manually renew any active or expired role for a fresh 30-day cycle at any time.
            </div>
          </div>
        </div>

        {!isOrgVerified && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
                  You must verify your company domain on your Company Profile before creating new blind job listings.
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
          {!jobs || jobs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  ? 'Create your first blind job listing to start receiving anonymous applications.'
                  : 'Verify your corporate domain first to unlock blind job postings.'}
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Role Details
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Status &amp; 30-Day Window
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Applicants
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => {
                      const applicantCount = Array.isArray(job.applications)
                        ? job.applications.filter(
                            (a: any) => a.initiated_by !== 'employer'
                          ).length
                        : 0

                      const expInfo = computeJobExpirationInfo(job)
                      const isExpiringSoon =
                        job.is_active &&
                        !expInfo.isExpired &&
                        expInfo.daysRemaining <= 7

                      return (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900">
                              {job.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 capitalize">
                                {job.work_model}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-400">
                                Posted{' '}
                                {new Date(job.created_at).toLocaleDateString()}
                              </span>
                              {expInfo.renewedAtIso && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-indigo-600 font-semibold">
                                    Renewed{' '}
                                    {new Date(
                                      expInfo.renewedAtIso
                                    ).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-col items-start gap-1">
                              {job.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Active
                                </span>
                              ) : expInfo.isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Auto-Expired (30d Limit)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Closed
                                </span>
                              )}

                              {job.is_active ? (
                                <span
                                  className={`text-[11px] font-bold ${
                                    isExpiringSoon
                                      ? 'text-amber-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isExpiringSoon ? '⚠️ ' : '⏳ '}
                                  Closes in {expInfo.daysRemaining}{' '}
                                  {expInfo.daysRemaining === 1 ? 'day' : 'days'}{' '}
                                  ({expInfo.expiresAtDate.toLocaleDateString()})
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Manual renewal required to reopen
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                ></path>
                              </svg>
                              <span className="font-bold text-slate-700">
                                {applicantCount}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Link
                                href={`/dashboard/employer/jobs/${job.id}/edit`}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
                              >
                                Edit
                              </Link>

                              {/* If active and expiring within 7 days, offer 1-click +30d extension */}
                              {job.is_active && isExpiringSoon && (
                                <form action={toggleOrRenewJobStatus}>
                                  <input
                                    type="hidden"
                                    name="job_id"
                                    value={job.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="action_type"
                                    value="renew"
                                  />
                                  <input
                                    type="hidden"
                                    name="current_status"
                                    value="true"
                                  />
                                  <SubmitButton
                                    pendingText="Renewing..."
                                    className="px-3 py-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
                                  >
                                    ↻ Renew +30d
                                  </SubmitButton>
                                </form>
                              )}

                              <form action={toggleOrRenewJobStatus}>
                                <input
                                  type="hidden"
                                  name="job_id"
                                  value={job.id}
                                />
                                <input
                                  type="hidden"
                                  name="current_status"
                                  value={job.is_active.toString()}
                                />

                                {job.is_active ? (
                                  <>
                                    <input
                                      type="hidden"
                                      name="action_type"
                                      value="close"
                                    />
                                    <SubmitButton
                                      pendingText="..."
                                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
                                    >
                                      Close Role
                                    </SubmitButton>
                                  </>
                                ) : slotsFull ? (
                                  <Link
                                    href="/dashboard/employer/billing"
                                    className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors shadow-sm"
                                  >
                                    Slots Full ({activeJobsCount}/{tierInfo.maxActiveJobs}) · Upgrade
                                  </Link>
                                ) : (
                                  <>
                                    <input
                                      type="hidden"
                                      name="action_type"
                                      value="renew"
                                    />
                                    <SubmitButton
                                      pendingText="Renewing..."
                                      className="px-3 py-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
                                    >
                                      ↻ Reopen &amp; Renew (+30d)
                                    </SubmitButton>
                                  </>
                                )}
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}