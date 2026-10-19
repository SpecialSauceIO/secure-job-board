import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EmployerCandidateSearch from '@/components/EmployerCandidateSearch'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployerSearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let activeJobs: any[] = []
  let credits = 0
  let sentPitchesCount = 0
  let isOrgVerified = false

  const { data: member } = await supabase
    .from('organization_members')
    .select(
      'organization_id, organizations(connection_credits, verification_status)'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (member?.organization_id) {
    const orgObj: any = Array.isArray(member.organizations)
      ? member.organizations[0]
      : member.organizations

    credits = orgObj?.connection_credits || 0
    isOrgVerified = orgObj?.verification_status === 'verified'

    if (isOrgVerified) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select(
          'id, title, work_model, salary_min, salary_max, structured_requirements, is_active'
        )
        .eq('organization_id', member.organization_id)

      if (jobs && jobs.length > 0) {
        activeJobs = jobs.filter((j) => j.is_active === true)

        const allOrgJobIds = jobs.map((j) => j.id)
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', allOrgJobIds)
          .eq('initiated_by', 'employer')

        sentPitchesCount = count || 0
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Passive Candidate Search
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified anonymous profiles, run 5-Point AI Fit checks, and pitch your active roles directly to top talent.
          </p>
        </div>

        {isOrgVerified && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/employer/pitches"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-2-slate-200 bg-white text-slate-700 hover:border-2-slate-400 hover:text-slate-900 text-xs font-extrabold transition-colors shadow-2xs border-slate-300"
            >
              <span>Sent Pitches</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-black">
                {sentPitchesCount}
              </span>
            </Link>
          </div>
        )}
      </header>

      {!isOrgVerified ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-amber-50 border border-amber-300 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8"
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
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            Corporate Domain Verification Required
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            To protect candidate privacy and prevent unauthorized scraping, employers must verify their corporate domain before searching the passive talent pool or sending connection requests.
          </p>
          <Link
            href="/dashboard/employer/organization"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Verify Corporate Domain →
          </Link>
        </div>
      ) : (
        <EmployerCandidateSearch activeJobs={activeJobs} credits={credits} />
      )}
    </div>
  )
}