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
  } catch {}

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

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const stripeKey =
    process.env.STRIPE_IDENTITY_SECRET_KEY || process.env.STRIPE_SECRET_KEY

  if (profile?.role === 'candidate' && isReturningFromStripe && stripeKey) {
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
      const cookieSessionId =
        cookieStore.get('stripe_vs_id')?.value || resolvedParams?.session_id

      if (cookieSessionId) {
        try {
          const retrieved =
            await stripe.identity.verificationSessions.retrieve(cookieSessionId)
          if (
            belongsToCurrentUser(retrieved) &&
            isCompletedStatus(retrieved.status)
          ) {
            matchedSession = retrieved
          }
        } catch (retrieveErr: any) {
          console.warn(
            '[STRIPE IDENTITY SYNC] Retrieve by cookie ID warning:',
            retrieveErr.message
          )
        }
      }

      if (!matchedSession) {
        try {
          const sessions = await stripe.identity.verificationSessions.list({
            limit: 10,
          })
          matchedSession = sessions.data.find(
            (s) => belongsToCurrentUser(s) && isCompletedStatus(s.status)
          )
        } catch (listErr: any) {
          console.warn(
            '[STRIPE IDENTITY SYNC] List sessions warning:',
            listErr.message
          )
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
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-10 text-center bg-slate-900 text-white">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Welcome to Special Sauce
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Select your account type below to launch your workspace.
            </p>
          </div>

          <div className="p-10 bg-white">
            <form
              action={setRole}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <button
                type="submit"
                name="role"
                value="candidate"
                className="group relative p-8 border-2 border-slate-200 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-5">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  I&apos;m a Candidate
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Create an anonymous skill profile, run AI match checks, and
                  apply blind to verified roles.
                </p>
              </button>

              <button
                type="submit"
                name="role"
                value="employer"
                className="group relative p-8 border-2 border-slate-200 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-5">
                  <svg
                    className="w-6 h-6"
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
                  I&apos;m an Employer
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Verify your corporate domain, post roles, and pitch anonymous
                  candidates on merit.
                </p>
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // STREAMLINED EMPLOYER DASHBOARD (MINIMALIST WIREFRAME LAYOUT)
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
        .select(
          `
          id,
          status,
          is_revealed,
          initiated_by,
          jobs!inner (
            organization_id
          )
        `
        )
        .eq('jobs.organization_id', member.organization_id)

      const orgApps = allApps || []

      const inboundApps = orgApps.filter((app) => app.initiated_by !== 'employer')
      inboundTotalCount = inboundApps.length
      pendingAppsCount = inboundApps.filter((app) => !app.is_revealed).length

      const outboundPitches = orgApps.filter(
        (app) => app.initiated_by === 'employer'
      )
      sentPitchesCount = outboundPitches.length
      acceptedPitchesCount = outboundPitches.filter(
        (app) => app.status === 'accepted' || app.is_revealed === true
      ).length

      const { count: jobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .eq('is_active', true)

      activeJobsCount = jobsCount || 0
    }

    const canPostNewJob =
      isOrgVerified &&
      tierInfo.maxActiveJobs > 0 &&
      activeJobsCount < tierInfo.maxActiveJobs

    return (
      <div className="max-w-6xl mx-auto py-4 space-y-8">
        {/* CALM HERO ROW: 1 Title, 1 Quiet Status Line, 1 Primary Action Button */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Employer Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs font-medium text-slate-500">
              {isOrgVerified ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {orgData?.domain || 'Domain'} Verified
                </span>
              ) : (
                <Link
                  href="/dashboard/employer/organization"
                  className="inline-flex items-center gap-1.5 text-amber-700 font-bold hover:underline"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Domain Unverified (Click to Verify)
                </Link>
              )}
              <span>·</span>
              <span>
                {tierInfo.label} ({activeJobsCount}/{tierInfo.maxActiveJobs} Active Roles)
              </span>
              <span>·</span>
              <Link
                href="/dashboard/employer/billing"
                className="text-indigo-600 hover:text-indigo-800 font-bold"
              >
                {connectionCredits} Pitch {connectionCredits === 1 ? 'Credit' : 'Credits'} Available
              </Link>
            </div>
          </div>

          <div className="shrink-0">
            {!isOrgVerified ? (
              <Link
                href="/dashboard/employer/organization"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-colors"
              >
                Verify Domain to Start →
              </Link>
            ) : canPostNewJob ? (
              <Link
                href="/dashboard/employer/jobs/new"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-colors"
              >
                + Post New Job
              </Link>
            ) : (
              <Link
                href="/dashboard/employer/billing"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {tierInfo.tier === 'free'
                  ? 'Choose Plan to Post Jobs →'
                  : `Role Slots Full (${activeJobsCount}/${tierInfo.maxActiveJobs}) · Upgrade →`}
              </Link>
            )}
          </div>
        </header>

        {/* 4 CORE METRIC CARDS (DIRECTLY ABOVE THE FOLD — ZERO BANNER CLUTTER) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Company & Seats */}
          <Link
            href="/dashboard/employer/organization"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base">
                  🏢
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${
                    isOrgVerified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isOrgVerified ? '✓ Verified' : 'Setup Needed'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Company & Seats
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1 truncate">
                {orgData?.name || orgData?.domain || 'Setup Company'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isOrgVerified
                  ? `Up to ${tierInfo.maxSeats} ${
                      tierInfo.maxSeats === 1 ? 'seat' : 'seats'
                    } on ${tierInfo.label}`
                  : 'Verify domain to unlock talent search'}
              </p>
            </div>
            <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 mt-5">
              Manage company & seats →
            </p>
          </Link>

          {/* Card 2: Active Roles */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/jobs'
                : '/dashboard/employer/organization'
            }
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
                  💼
                </span>
                <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {activeJobsCount} / {tierInfo.maxActiveJobs}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Roles
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Manage Jobs
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {tierInfo.tier === 'free'
                  ? 'Activate a plan to publish roles'
                  : `${Math.max(
                      0,
                      tierInfo.maxActiveJobs - activeJobsCount
                    )} role slots remaining`}
              </p>
            </div>
            <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 mt-5">
              View & edit roles →
            </p>
          </Link>

          {/* Card 3: Sent Pitches */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/pitches'
                : '/dashboard/employer/organization'
            }
            className={`group bg-white p-6 rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
              acceptedPitchesCount > 0
                ? 'border-2 border-emerald-500/40'
                : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                  📐
                </span>
                <div className="flex items-center gap-1.5">
                  {acceptedPitchesCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-md">
                      {acceptedPitchesCount} Unlocked!
                    </span>
                  )}
                  <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    {sentPitchesCount}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sent Pitches
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {acceptedPitchesCount > 0
                  ? `${acceptedPitchesCount} Accepted`
                  : 'Outbound Pipeline'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {acceptedPitchesCount > 0
                  ? 'Candidate identity & resume PDF unlocked'
                  : 'Track connection pitches sent to talent'}
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 mt-5">
              View unlocked resumes →
            </p>
          </Link>

          {/* Card 4: Inbound Applications */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/applications'
                : '/dashboard/employer/organization'
            }
            className={`group bg-white p-6 rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
              pendingAppsCount > 0
                ? 'border-2 border-indigo-500/40'
                : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">
                  👥
                </span>
                <div className="flex items-center gap-1.5">
                  {pendingAppsCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-600 text-white rounded-md">
                      {pendingAppsCount} New
                    </span>
                  )}
                  <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    {inboundTotalCount}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Inbound Pipeline
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {pendingAppsCount > 0
                  ? `${pendingAppsCount} Awaiting Review`
                  : 'Applicant Pipeline'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review blind skill matrices & unlock profiles
              </p>
            </div>
            <p className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 mt-5">
              Review blind applicants →
            </p>
          </Link>
        </section>
      </div>
    )
  }

  // ============================================================================
  // STREAMLINED CANDIDATE VIEW
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
      .filter((a) => a.initiated_by !== 'employer')
      .map((a) => a.job_id)
  )

  let recommendedJobs: any[] = []

  if (hasProfileData) {
    const { data: allActiveJobs } = await supabase
      .from('jobs')
      .select('*, organizations:organization_id (*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const unappliedJobs = (allActiveJobs || []).filter(
      (job) => !appliedJobIds.has(job.uuid || job.id)
    )

    let topSkill = ''
    if (Array.isArray(profile.skills) && profile.skills.length > 0) {
      topSkill = String(profile.skills[0]).toLowerCase().trim()
    } else if (typeof profile.skills === 'string') {
      topSkill = profile.skills.split(',')[0].toLowerCase().trim()
    }

    let matchedJobs = unappliedJobs
    if (topSkill) {
      const filtered = unappliedJobs.filter((job) => {
        const descMatch = job.description?.toLowerCase().includes(topSkill)
        const titleMatch = job.title?.toLowerCase().includes(topSkill)
        const reqsMatch = job.structured_requirements
          ? JSON.stringify(job.structured_requirements)
              .toLowerCase()
              .includes(topSkill)
          : false
        return descMatch || titleMatch || reqsMatch
      })
      if (filtered.length > 0) {
        matchedJobs = filtered
      }
    }

    recommendedJobs = matchedJobs.slice(0, 3).map((job) => ({
      ...job,
      id: job.uuid || job.id,
      has_applied: false,
    }))
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* CALM CANDIDATE HERO ROW */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Candidate Dashboard
            </h1>
            {isVerified && (
              <form action={resetCandidateVerificationSandbox}>
                <button
                  type="submit"
                  title="Sandbox: Reset this candidate back to Unverified"
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-700 border border-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Sandbox: Reset Verification
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs font-medium text-slate-500">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Identity Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Verification Required
              </span>
            )}
            <span>·</span>
            <span>{candidateTierInfo.label}</span>
            <span>·</span>
            <Link
              href="/dashboard/billing"
              className="text-indigo-600 hover:text-indigo-800 font-bold"
            >
              {candidateTierInfo.tier === 'pro'
                ? 'Manage Pro Pass'
                : 'Upgrade to Pro ($9/mo)'}
            </Link>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-colors"
          >
            Browse Open Roles →
          </Link>
        </div>
      </header>

      {/* UNVERIFIED PROMPT BANNER (Only shows if Candidate is not yet verified) */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Step 1: Verify Your Identity to Unlock Blind Applications
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Once verified via Stripe Identity, your 7-Day Early Adopter Trial (3 free blind applications) begins automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <VerifyButton />
            <form action={forceVerifyCandidateIdentity}>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                ⚡ Sandbox: Complete Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4 CORE CANDIDATE CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/dashboard/profile"
          className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">
                📄
              </span>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${
                  hasProfileData
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {hasProfileData ? '✓ Ready' : 'Setup'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Anonymous Profile
            </p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Skill Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {hasProfileData
                ? 'Resume parsed & ready for AI matching'
                : 'Upload your PDF resume to auto-fill skills'}
            </p>
          </div>
          <p className="text-xs font-bold text-indigo-600 mt-5">
            {hasProfileData ? 'Edit profile →' : 'Upload resume →'}
          </p>
        </Link>

        <Link
          href="/dashboard/requests"
          className={`group bg-white p-6 rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            (pendingRequestsCount ?? 0) > 0
              ? 'border-2 border-violet-500/40'
              : 'border-slate-200 hover:border-slate-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-base">
                ⚡
              </span>
              <div className="flex items-center gap-1.5">
                {(pendingRequestsCount ?? 0) > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-violet-600 text-white rounded-md">
                    {pendingRequestsCount} New!
                  </span>
                )}
                <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {pendingRequestsCount || 0}
                </span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Employer Pitches
            </p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {(pendingRequestsCount ?? 0) > 0
                ? `${pendingRequestsCount} Pending`
                : 'Inbound Inbox'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Review direct role pitches from verified employers
            </p>
          </div>
          <p className="text-xs font-bold text-violet-600 mt-5">
            Open pitch inbox →
          </p>
        </Link>

        <Link
          href="/dashboard/applications"
          className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-base">
                🎯
              </span>
              <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                {applicationCount || 0}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Outbound Pipeline
            </p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Applications
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Track blind applications & unlocked employers
            </p>
          </div>
          <p className="text-xs font-bold text-cyan-600 mt-5">
            Track status →
          </p>
        </Link>

        <Link
          href="/dashboard/preferences"
          className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                🛡️
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Filters & Guardrails
            </p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set minimum salary & work model dealbreakers
            </p>
          </div>
          <p className="text-xs font-bold text-emerald-600 mt-5">
            Edit dealbreakers →
          </p>
        </Link>
      </section>

      {/* RECOMMENDED ROLES SECTION (Blue duplicate link removed!) */}
      <section className="pt-6 border-t border-slate-200">
        <div className="mb-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Recommended Roles
          </h2>
        </div>

        <CandidateJobFeed jobs={recommendedJobs} isVerified={isVerified} />
      </section>
    </div>
  )
}