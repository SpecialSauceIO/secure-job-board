import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import Stripe from 'stripe'
import { CandidateJobFeed } from '@/components/CandidateJobFeed'
import {
  setRole,
  forceVerifyCandidateIdentity,
  resolveEmployerTierInfo,
  resolveCandidateTierInfo,
} from '@/app/dashboard/actions'
import VerifyButton from './VerifyButton'

export const dynamic = 'force-dynamic'

async function resetCandidateVerificationSandbox() {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ identity_verified: false })
    .eq('id', user.id)

  await supabase
    .from('profiles')
    .update({ is_verified: false })
    .eq('id', user.id)

  await supabase
    .from('profiles')
    .update({ verification_status: 'unverified' })
    .eq('id', user.id)

  try {
    const cookieStore = await cookies()
    cookieStore.delete('stripe_vs_id')
  } catch {
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  redirect('/dashboard')
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ verification?: string; session_id?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const resolvedParams = searchParams ? await searchParams : {}
  const isReturningFromStripe = Boolean(
    resolvedParams?.verification === 'pending' || resolvedParams?.session_id
  )

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ============================================================================
  // AUTOMATIC STRIPE IDENTITY SYNC (ONLY RUNS WHEN RETURNING FROM STRIPE FLOW)
  // ============================================================================
  const stripeKey = process.env.STRIPE_IDENTITY_SECRET_KEY || process.env.STRIPE_SECRET_KEY

  if (
    profile?.role === 'candidate' &&
    isReturningFromStripe &&
    stripeKey
  ) {
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2026-09-30.endive' as any,
      })

      const isTestKey = stripeKey.includes('_test_')
      const isCompletedStatus = (status?: string) =>
        status === 'verified' || (isTestKey && status === 'processing')

      const belongsToCurrentUser = (s: any) =>
        s &&
        (s.metadata?.userId === user.id ||
          s.metadata?.user_id === user.id ||
          s.client_reference_id === user.id)

      let matchedSession: any = null

      const cookieStore = await cookies()
      const cookieSessionId = cookieStore.get('stripe_vs_id')?.value || resolvedParams?.session_id

      if (cookieSessionId) {
        try {
          const retrieved = await stripe.identity.verificationSessions.retrieve(cookieSessionId)
          if (belongsToCurrentUser(retrieved) && isCompletedStatus(retrieved.status)) {
            matchedSession = retrieved
          }
        } catch (retrieveErr: any) {
          console.warn('[STRIPE IDENTITY SYNC] Retrieve by cookie ID warning:', retrieveErr.message)
        }
      }

      if (!matchedSession) {
        try {
          const sessions = await stripe.identity.verificationSessions.list({ limit: 10 })
          matchedSession = sessions.data.find(
            (s) => belongsToCurrentUser(s) && isCompletedStatus(s.status)
          )
        } catch (listErr: any) {
          console.warn('[STRIPE IDENTITY SYNC] List sessions warning:', listErr.message)
        }
      }

      if (matchedSession) {
        await supabase
          .from('profiles')
          .update({ identity_verified: true })
          .eq('id', user.id)

        await supabase
          .from('profiles')
          .update({ verification_status: 'verified' })
          .eq('id', user.id)

        profile = {
          ...profile,
          identity_verified: true,
          verification_status: 'verified',
        }
      }
    } catch (err: any) {
      console.warn('[STRIPE IDENTITY SYNC] Error:', err.message || err)
    }
  }

  // ============================================================================
  // ROLE SELECTION INTERCEPTOR
  // ============================================================================
  if (!profile?.role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-10 text-center bg-slate-900 text-white">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Welcome to the Platform</h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">To get started and set up your customized dashboard, please select your account type below.</p>
          </div>
          
          <div className="p-10 bg-white">
            <form action={setRole} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <button 
                type="submit" 
                name="role" 
                value="candidate" 
                className="group relative p-8 border-2 border-slate-200 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">I'm a Candidate</h3>
                <p className="text-slate-500 leading-relaxed">I want to create an anonymous profile, let the AI extract my skills, and apply for open roles.</p>
                <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Select Candidate <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
              
              <button 
                type="submit" 
                name="role" 
                value="employer" 
                className="group relative p-8 border-2 border-slate-200 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">I'm an Employer</h3>
                <p className="text-slate-500 leading-relaxed">I want to post jobs, search the anonymous talent pool, and build my candidate pipeline.</p>
                <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Select Employer <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>

            </form>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // EMPLOYER VIEW (WITH SAAS TIER, 2:1 CREDITS & ACTIVE ROLE SLOT LIMITS)
  // ============================================================================
  if (profile?.role === 'employer') {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    let orgData: any = null
    if (member?.organization_id) {
      const { data: fetchedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single()
      orgData = fetchedOrg
    }

    const hasOrg = Boolean(member?.organization_id && orgData)
    const isOrgVerified = Boolean(orgData?.verification_status === 'verified')
    const connectionCredits = orgData?.connection_credits ?? 0
    const tierInfo = await resolveEmployerTierInfo(orgData)

    let activeJobsCount = 0
    let inboundTotalCount = 0
    let pendingAppsCount = 0
    let sentPitchesCount = 0
    let acceptedPitchesCount = 0

    if (member?.organization_id) {
      const { data: allApps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          is_revealed,
          initiated_by,
          jobs!inner (
            organization_id
          )
        `)
        .eq('jobs.organization_id', member.organization_id)

      const orgApps = allApps || []

      const inboundApps = orgApps.filter(app => app.initiated_by !== 'employer')
      inboundTotalCount = inboundApps.length
      pendingAppsCount = inboundApps.filter(app => !app.is_revealed).length

      const outboundPitches = orgApps.filter(app => app.initiated_by === 'employer')
      sentPitchesCount = outboundPitches.length
      acceptedPitchesCount = outboundPitches.filter(
        app => app.status === 'accepted' || app.is_revealed === true
      ).length

      const { count: jobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .eq('is_active', true)
        
      activeJobsCount = jobsCount || 0
    }

    const canPostNewJob = isOrgVerified && tierInfo.maxActiveJobs > 0 && activeJobsCount < tierInfo.maxActiveJobs

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <header className="mb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Employer Dashboard</h1>

                {isOrgVerified ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Domain Verified {orgData?.domain ? `(${orgData.domain})` : ''}
                  </span>
                ) : (
                  <Link
                    href="/dashboard/employer/organization"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold hover:bg-amber-100 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Domain Unverified — Click to Verify
                  </Link>
                )}

                <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold">
                  {tierInfo.label} ({activeJobsCount}/{tierInfo.maxActiveJobs} Active Roles)
                </span>
              </div>
              <p className="text-slate-500 mt-2">Manage your anonymous hiring pipeline, search passive talent, and track outbound pitches.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={hasOrg ? "/dashboard/employer/billing" : "/dashboard/employer/organization"}
                className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-extrabold rounded-xl hover:bg-indigo-100 transition-colors text-xs flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{connectionCredits} {connectionCredits === 1 ? 'Credit' : 'Credits'}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase">
                  {tierInfo.tier === 'free' ? 'Subscribe' : 'Manage Plan'}
                </span>
              </Link>

              {isOrgVerified ? (
                <>
                  <Link
                    href="/dashboard/employer/search"
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl hover:bg-slate-100 shadow-sm transition-all text-sm"
                  >
                    Search Candidates
                  </Link>

                  {canPostNewJob ? (
                    <Link
                      href="/dashboard/employer/jobs/new"
                      className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-sm transition-all text-sm"
                    >
                      + Post New Job
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/employer/billing"
                      className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-sm transition-all text-sm"
                    >
                      {tierInfo.tier === 'free'
                        ? 'Subscribe to Post Jobs →'
                        : `Slots Full (${activeJobsCount}/${tierInfo.maxActiveJobs}) — Upgrade →`}
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <span
                    title="Domain verification required to search candidates"
                    className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    Search Locked
                  </span>
                  <span
                    title="Domain verification required to post jobs"
                    className="px-4 py-2.5 bg-slate-200 text-slate-500 font-bold rounded-xl text-sm cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    Post Job Locked
                  </span>
                </>
              )}
            </div>
          </header>

          {!isOrgVerified && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-amber-950">
                    Step 1: Corporate Domain Verification Required
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-amber-800 leading-relaxed">
                    Verify your corporate domain for free to unlock browsing the passive candidate pool and running AI 5-Point Radar match previews.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/employer/organization"
                className="shrink-0 px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors text-center shadow-sm"
              >
                {hasOrg ? 'Verify Corporate Domain →' : 'Setup & Verify Company →'}
              </Link>
            </div>
          )}

          {isOrgVerified && tierInfo.tier === 'free' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-indigo-950">
                    Free Explorer Mode Active — Browse Talent Free, Subscribe to Hire
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-indigo-800 leading-relaxed">
                    Your domain is verified! You can browse passive candidates now. Activate a monthly plan (<strong>Starter $99/mo</strong>, <strong>Growth $299/mo</strong>, or <strong>Enterprise $899/mo</strong>) to unlock active job postings and monthly pitch credits.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/employer/billing"
                className="shrink-0 px-5 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors text-center shadow-sm"
              >
                Choose Monthly Plan →
              </Link>
            </div>
          )}

          {acceptedPitchesCount > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    {acceptedPitchesCount} {acceptedPitchesCount === 1 ? 'Candidate Accepted' : 'Candidates Accepted'} Your Pitch!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Their identity and resume PDF are now unlocked in your Sent Pitches tracker.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/employer/pitches"
                className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors text-center"
              >
                View Unlocked Profiles →
              </Link>
            </div>
          )}

          {pendingAppsCount > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    {pendingAppsCount} New Anonymous {pendingAppsCount === 1 ? 'Application' : 'Applications'} Waiting for Review
                  </h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Verified candidates matched with your active roles and submitted blind applications.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/employer/applications"
                className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors text-center"
              >
                Review Applications →
              </Link>
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Link href="/dashboard/employer/organization" className="block group h-full">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-indigo-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    {hasOrg && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                          isOrgVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isOrgVerified ? '✓ Verified' : 'Pending'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Company Profile</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {!hasOrg
                      ? 'You need to set up your company details to post jobs.'
                      : isOrgVerified
                      ? `Corporate domain (${orgData?.domain || 'verified'}) is active and verified.`
                      : 'Verify your corporate domain to unlock job postings and candidate search.'}
                  </p>
                </div>
                <div className="flex items-center text-indigo-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                  {hasOrg ? (isOrgVerified ? 'Manage Company' : 'Verify Domain') : 'Setup Required'} 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </Link>

            <Link href={hasOrg ? "/dashboard/employer/jobs" : "/dashboard/employer/organization"} className="block group h-full">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-cyan-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl">
                      {activeJobsCount} / {tierInfo.maxActiveJobs}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Active Roles</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {tierInfo.tier === 'free'
                      ? 'Subscribe to Starter, Growth, or Enterprise to unlock active job slots.'
                      : `Using ${activeJobsCount} of ${tierInfo.maxActiveJobs} active role slots on your ${tierInfo.label}.`}
                  </p>
                </div>
                <div className="flex items-center text-cyan-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Roles 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </Link>

            <Link href={hasOrg ? "/dashboard/employer/pitches" : "/dashboard/employer/organization"} className="block group h-full">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-violet-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-900 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl">
                      {sentPitchesCount}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Sent Pitches</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Track outbound connection requests and view unlocked resumes when candidates accept.
                  </p>
                </div>
                <div className="flex items-center text-violet-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                  View Sent Pitches 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </Link>

            <Link href={hasOrg ? "/dashboard/employer/applications" : "/dashboard/employer/organization"} className="block group h-full">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-emerald-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingAppsCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          {pendingAppsCount} New
                        </span>
                      )}
                      <span className="text-3xl font-extrabold text-slate-900 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl">
                        {inboundTotalCount}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Inbound Applications</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Decrypt new anonymous applicants and view your full history of unlocked and shortlisted talent.
                  </p>
                </div>
                <div className="flex items-center text-emerald-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                  Open Application Pipeline 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </Link>

          </section>

        </div>
      </div>
    )
  }

  // ============================================================================
  // CANDIDATE VIEW (WITH 7-DAY / 3-APP EARLY ADOPTER TRIAL & $9/MO PRO PASS)
  // ============================================================================
  const isVerified = Boolean(
    profile?.identity_verified === true ||
    String(profile?.identity_verified) === 'true' ||
    profile?.is_verified === true ||
    String(profile?.is_verified) === 'true' ||
    profile?.verification_status === 'verified'
  )

  const candidateTierInfo = await resolveCandidateTierInfo(user.id)

  const { count: applicationCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', user.id)
    .neq('initiated_by', 'employer')

  const { count: pendingRequestsCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', user.id)
    .eq('initiated_by', 'employer')
    .eq('status', 'pending')

  const hasProfileData = !!(profile?.skills && profile?.bio)

  const { data: userApps } = await supabase
    .from('applications')
    .select('job_id, initiated_by')
    .eq('candidate_id', user.id)

  const appliedJobIds = new Set(
    (userApps || [])
      .filter(a => a.initiated_by !== 'employer')
      .map(a => a.job_id)
  )

  let recommendedJobs: any[] = []
  
  if (hasProfileData) {
    const { data: allActiveJobs } = await supabase
      .from('jobs')
      .select('*, organizations:organization_id (*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const unappliedJobs = (allActiveJobs || []).filter(
      job => !appliedJobIds.has(job.uuid || job.id)
    )

    let topSkill = ''
    if (Array.isArray(profile.skills) && profile.skills.length > 0) {
      topSkill = String(profile.skills[0]).toLowerCase().trim()
    } else if (typeof profile.skills === 'string') {
      topSkill = profile.skills.split(',')[0].toLowerCase().trim()
    }

    let matchedJobs = unappliedJobs
    if (topSkill) {
      const filtered = unappliedJobs.filter(job => {
        const descMatch = job.description?.toLowerCase().includes(topSkill)
        const titleMatch = job.title?.toLowerCase().includes(topSkill)
        const reqsMatch = job.structured_requirements
          ? JSON.stringify(job.structured_requirements).toLowerCase().includes(topSkill)
          : false
        return descMatch || titleMatch || reqsMatch
      })
      if (filtered.length > 0) {
        matchedJobs = filtered
      }
    }

    recommendedJobs = matchedJobs.slice(0, 3).map(job => ({
      ...job,
      id: job.uuid || job.id,
      has_applied: false
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CANDIDATE HEADER WITH IDENTITY VERIFIED & TRIAL / PRO PASS BADGES */}
        <header className="mb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Dashboard</h1>
              {isVerified && (
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Identity Verified
                  </div>
                  <form action={resetCandidateVerificationSandbox}>
                    <button
                      type="submit"
                      title="Sandbox: Reset this candidate back to Unverified"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Reset to Unverified
                    </button>
                  </form>
                </div>
              )}
            </div>
            <p className="text-slate-500 mt-2">Manage your anonymous profile and discover new roles.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/billing"
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition-colors border ${
                candidateTierInfo.tier === 'pro'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                  : candidateTierInfo.tier === 'trial'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                  : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
              }`}
            >
              <span>
                {candidateTierInfo.tier === 'pro'
                  ? '★ Candidate Pro ($9/mo)'
                  : candidateTierInfo.tier === 'trial'
                  ? `Trial: ${candidateTierInfo.freeAppsRemaining}/3 Free Apps (${candidateTierInfo.daysRemaining}d left)`
                  : 'Trial Ended (0 Free Apps Left)'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase">
                {candidateTierInfo.tier === 'pro' ? 'Manage' : 'Upgrade $9/mo'}
              </span>
            </Link>
          </div>
        </header>

        {/* CANDIDATE TRIAL EXPIRED BANNER */}
        {isVerified && candidateTierInfo.tier === 'free' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-amber-950">
                  Early Adopter Trial Concluded — Browse & Inbound Pitch Mode Active
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-amber-800 leading-relaxed">
                  You can still browse all open roles, run 5-Point AI Match Radar checks, and accept incoming Employer Pitches for free! Upgrade to the <strong>Candidate Pro Pass ($9/month)</strong> to unlock unlimited outbound blind applications.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="shrink-0 px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors text-center shadow-sm"
            >
              Upgrade to Pro ($9/mo) →
            </Link>
          </div>
        )}

        {/* NEW INCOMING EMPLOYER CONNECTION REQUESTS BANNER */}
        {(pendingRequestsCount ?? 0) > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-950">
                  You have {pendingRequestsCount} pending Employer Connection {pendingRequestsCount === 1 ? 'Request' : 'Requests'}!
                </h2>
                <p className="mt-0.5 text-sm text-indigo-700">
                  Employers matched with your anonymous profile and pitched you open roles. Review their pitches to accept and unlock your identity (always 100% free).
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/requests"
              className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors text-center shadow-sm"
            >
              Review Pitches →
            </Link>
          </div>
        )}

        {/* UNVERIFIED PROMPT BANNER (Disappears permanently once verified) */}
        {!isVerified && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Identity Verification Required</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  To preserve the integrity of the platform, all candidates must verify their identity. Once verified, your 7-Day Early Adopter Trial (3 free blind applications) begins automatically.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <VerifyButton />
                <form action={forceVerifyCandidateIdentity}>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition-colors shadow-sm"
                  >
                    ⚡ Sandbox: Complete Verification
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATE SUMMARY WIDGETS (4 columns) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          <Link href="/dashboard/profile" className="block group h-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-indigo-300">
              <div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Anonymous Profile</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {hasProfileData 
                    ? 'Your skills and bio are successfully extracted and ready for applications.' 
                    : 'Upload your resume to extract your data and begin applying.'}
                </p>
              </div>
              <div className="flex items-center text-indigo-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                {hasProfileData ? 'Manage Profile' : 'Setup Profile'} 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/requests" className="block group h-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-violet-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <span className={`text-3xl font-extrabold px-4 py-1.5 rounded-xl border ${
                    (pendingRequestsCount ?? 0) > 0
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'text-slate-900 bg-slate-50 border-slate-100'
                  }`}>
                    {pendingRequestsCount || 0}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Employer Pitches</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Review incoming connection requests from employers and choose who can unlock your identity.
                </p>
              </div>
              <div className="flex items-center text-violet-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                Open Inbox 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/applications" className="block group h-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-cyan-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span className="text-3xl font-extrabold text-slate-900 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl">
                    {applicationCount || 0}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Application Tracker</h3>
                <p className="text-sm text-slate-500 mb-6">Monitor your pending applications and see when employers unlock your profile.</p>
              </div>
              <div className="flex items-center text-cyan-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                View Applications 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/preferences" className="block group h-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between group-hover:border-emerald-300">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Match Preferences</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Set your dealbreakers and control which employers can send you connection requests.
                </p>
              </div>
              <div className="flex items-center text-emerald-600 text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                Manage Preferences 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>

        </section>

        {/* Personalized Feed Section */}
        <section className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Recommended for You</h2>
            <Link href="/dashboard/jobs" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-1">
              Search All Jobs <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>
          
          <CandidateJobFeed jobs={recommendedJobs} isVerified={isVerified} />
        </section>

      </div>
    </div>
  )
}