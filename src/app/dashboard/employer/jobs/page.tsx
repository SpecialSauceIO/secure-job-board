import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'

export default async function JobManagementPage() {
  const supabase = await createClient()
  
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verify they are an employer
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'employer') redirect('/dashboard')

  // 3. Get their organization & verification status
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(verification_status)')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) redirect('/dashboard/employer/organization')

  const orgObj: any = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations

  const isOrgVerified = orgObj?.verification_status === 'verified'

  // 4. Fetch all jobs belonging to this organization, plus a count of applications
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      applications (id, initiated_by)
    `)
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  // INLINE SERVER ACTION: Toggle job active status
  async function toggleJobStatus(formData: FormData) {
    'use server'
    const supabaseAction = await createClient()
    const jobId = formData.get('job_id') as string
    const currentStatus = formData.get('current_status') === 'true'

    if (!jobId) return

    const { error } = await supabaseAction
      .from('jobs')
      .update({ is_active: !currentStatus })
      .eq('id', jobId)

    if (error) console.error("Error updating job status:", error)
    
    revalidatePath('/dashboard/employer/jobs')
    revalidatePath('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Employer Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Job Management</h1>
            <p className="text-slate-500 mt-2">Manage your active listings and monitor applicant volume.</p>
          </div>
          <div className="flex gap-3">
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Verify Domain to Post Jobs →
              </Link>
            )}
          </div>
        </header>

        {!isOrgVerified && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-amber-950">Corporate Domain Verification Required to Post New Roles</h3>
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
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs posted yet</h3>
              <p className="text-slate-500 mb-6">
                {isOrgVerified
                  ? 'Create your first blind job listing to start receiving anonymous applications.'
                  : 'Verify your corporate domain first to unlock blind job postings.'}
              </p>
              {isOrgVerified ? (
                <Link href="/dashboard/employer/jobs/new" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
                  Post your first job
                </Link>
              ) : (
                <Link href="/dashboard/employer/organization" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-indigo-600 shadow-sm transition-all">
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
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Details</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicants</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => {
                      const applicantCount = Array.isArray(job.applications)
                        ? job.applications.filter((a: any) => a.initiated_by !== 'employer').length
                        : 0
                      
                      return (
                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900">{job.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 capitalize">{job.work_model}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-400">Created {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {job.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Closed
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                              <span className="font-bold text-slate-700">{applicantCount}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/dashboard/employer/jobs/${job.id}/edit`} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
                                Edit
                              </Link>
                              
                              <form action={toggleJobStatus}>
                                <input type="hidden" name="job_id" value={job.id} />
                                <input type="hidden" name="current_status" value={job.is_active.toString()} />
                                
                                {job.is_active ? (
                                  <SubmitButton pendingText="..." className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm">
                                    Close Role
                                  </SubmitButton>
                                ) : (
                                  <SubmitButton pendingText="..." className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm">
                                    Reopen Role
                                  </SubmitButton>
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