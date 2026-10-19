import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Stripe from 'stripe'
import { CandidateJobFeed } from '@/components/CandidateJobFeed'
import DashboardLiveSync from '@/components/DashboardLiveSync'
import ReputationBadgeCase, {
  RankAndFounderPill,
} from '@/components/ReputationBadgeCase'
import {
  calculateCandidateGamification,
  calculateEmployerGamification,
} from '@/constants/gamification'
import {
  setRole,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'
import VerifyButton from './VerifyButton'
import EmployerBrandLogoUploader from '@/components/EmployerBrandLogoUploader'

export const dynamic = 'force-dynamic'

function extractBookmarkCounts(profile: any): {
  savedJobsCount: number
  savedCandidatesCount: number
  savedJobIds: string[]
} {
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []
  const prefMeta = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  const savedJobIds = Array.isArray(prefMeta?.saved_job_ids)
    ? prefMeta.saved_job_ids.map(String)
    : []
  const savedCandidateIds = Array.isArray(prefMeta?.saved_candidate_ids)
    ? prefMeta.saved_candidate_ids.map(String)
    : []

  return {
    savedJobsCount: savedJobIds.length,
    savedCandidatesCount: savedCandidateIds.length,
    savedJobIds,
  }
}

function hasUnreadThreadMessage(
  app: any,
  viewerRole: 'employer' | 'candidate'
): boolean {
  const matchData = app?.match_data || {}
  const messages = Array.isArray(matchData.messages) ? matchData.messages : []
  if (messages.length === 0) return false

  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.sender_role === viewerRole) return false

  const readKey =
    viewerRole === 'candidate'
      ? 'candidate_last_read_at'
      : 'employer_last_read_at'
  const lastReadIso = matchData[readKey]
  if (!lastReadIso) return true

  return (
    new Date(lastMsg.created_at).getTime() > new Date(lastReadIso).getTime()
  )
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
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border-2 border-slate-300 overflow-hidden border-slate-300">
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
                className="group relative p-8 border-2 border-slate-300 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
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
                className="group relative p-8 border-2 border-slate-300 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
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

  const cookieStoreForA11y = await cookies()
  const a11yColorTiles = cookieStoreForA11y.get('ss_a11y_color_tiles')?.value === '1'

  const { savedJobsCount, savedCandidatesCount } = extractBookmarkCounts(profile)

  // ============================================================================
  // STREAMLINED EMPLOYER DASHBOARD (ZERO REDUNDANT PLAN LINKS)
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
    let inboundUnreadMsgsCount = 0
    let sentPitchesCount = 0
    let acceptedPitchesCount = 0
    let pitchesUnreadMsgsCount = 0
    let orgAppsList: any[] = []
    let orgJobsList: any[] = []

    if (member?.organization_id) {
      const { data: allApps } = await supabase
        .from('applications')
        .select(
          `
          id,
          status,
          is_revealed,
          initiated_by,
          match_score,
          match_data,
          jobs!inner (
            organization_id
          )
        `
        )
        .eq('jobs.organization_id', member.organization_id)

      orgAppsList = allApps || []

      const inboundApps = orgAppsList.filter(
        (app) => app.initiated_by !== 'employer'
      )
      inboundTotalCount = inboundApps.length
      pendingAppsCount = inboundApps.filter((app) => !app.is_revealed).length
      inboundUnreadMsgsCount = inboundApps.filter((app) =>
        hasUnreadThreadMessage(app, 'employer')
      ).length

      const outboundPitches = orgAppsList.filter(
        (app) => app.initiated_by === 'employer'
      )
      sentPitchesCount = outboundPitches.length
      acceptedPitchesCount = outboundPitches.filter(
        (app) => app.status === 'accepted' || app.is_revealed === true
      ).length
      pitchesUnreadMsgsCount = outboundPitches.filter((app) =>
        hasUnreadThreadMessage(app, 'employer')
      ).length

      const { data: fetchedOrgJobs } = await supabase
        .from('jobs')
        .select('id, is_active, salary_min, salary_max')
        .eq('organization_id', member.organization_id)

      orgJobsList = fetchedOrgJobs || []
      activeJobsCount = orgJobsList.filter(
        (j: any) => j.is_active !== false
      ).length
    }

    const employerGamification = calculateEmployerGamification(
      orgData,
      orgJobsList,
      orgAppsList
    )

    const canPostNewJob =
      isOrgVerified &&
      tierInfo.maxActiveJobs > 0 &&
      activeJobsCount < tierInfo.maxActiveJobs

    const companyDisplayName =
      orgData?.name || orgData?.domain || 'Set Up Your Company'
    const rolesBadgeText =
      tierInfo.maxActiveJobs >= 500
        ? `${activeJobsCount} Active`
        : `${activeJobsCount} / ${tierInfo.maxActiveJobs}`

    return (
      <div className="max-w-6xl mx-auto py-3 space-y-6">
        <DashboardLiveSync />

        {/* WHITE-LABEL COMPANY BRAND HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-300">
          <div className="flex items-center gap-4">
            <EmployerBrandLogoUploader
              companyName={companyDisplayName}
              initialLogoUrl={orgData?.logo_url}
              hasOrg={hasOrg}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {companyDisplayName}
                </h1>
                <RankAndFounderPill
                  level={employerGamification.level}
                  tier={employerGamification.tier}
                  isFounder={employerGamification.isFounder}
                  founderText="Founding Partner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs font-semibold text-slate-500">
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
                    Verify Corporate Domain →
                  </Link>
                )}
                <span>·</span>
                <span>{rolesBadgeText} Roles</span>
                <span>·</span>
                <span>
                  {connectionCredits} Pitch{' '}
                  {connectionCredits === 1 ? 'Credit' : 'Credits'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isOrgVerified && (
              <Link
                href="/dashboard/employer/search?saved=true"
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-colors shadow-xs ${
                  savedCandidatesCount > 0
                    ? 'bg-amber-50 border-slate-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    savedCandidatesCount > 0
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-400'
                  }`}
                  fill={savedCandidatesCount > 0 ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                Shortlist ({savedCandidatesCount})
              </Link>
            )}

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
                + Post New Role
              </Link>
            ) : (
              <Link
                href="/dashboard/employer/billing"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {tierInfo.tier === 'free'
                  ? 'Choose Plan to Post Roles →'
                  : `Role Slots Full (${activeJobsCount}/${tierInfo.maxActiveJobs}) · Upgrade →`}
              </Link>
            )}
          </div>
        </header>

        {/* 4 EMPLOYER WIDGETS (DEFAULT MINIMALIST WHITE B2B OR ACCESSIBILITY COLOR-CODED) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Manage Profile */}
          <Link
            href="/dashboard/employer/organization"
            className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              a11yColorTiles
                ? 'bg-slate-100/90 hover:bg-slate-200/70 border-slate-400 hover:border-slate-500 shadow-xs'
                : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    isOrgVerified
                      ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold'
                      : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  }`}
                >
                  {isOrgVerified ? 'Verified' : 'Setup Needed'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Manage Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isOrgVerified
                  ? `Domain verified · Up to ${tierInfo.maxSeats} team ${
                      tierInfo.maxSeats === 1 ? 'seat' : 'seats'
                    }`
                  : 'Verify domain, manage seats & ATS webhooks'}
              </p>
            </div>
            <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-950 mt-5">
              Company, logo &amp; seats →
            </p>
          </Link>

          {/* Card 2: Manage Active Roles */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/jobs'
                : '/dashboard/employer/organization'
            }
            className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              a11yColorTiles
                ? 'bg-blue-100/75 hover:bg-blue-200/60 border-blue-400 hover:border-blue-500 shadow-xs'
                : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <svg
                  className={`w-5 h-5 ${
                    a11yColorTiles ? 'text-blue-800' : 'text-slate-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    a11yColorTiles
                      ? 'text-blue-950 bg-white/90 border-blue-300 font-bold'
                      : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                  }`}
                >
                  {rolesBadgeText}
                </span>
              </div>
              <h3
                className={`text-lg font-bold ${
                  a11yColorTiles ? 'text-blue-950' : 'text-slate-900'
                }`}
              >
                Manage Active Roles
              </h3>
              <p
                className={`text-xs mt-1 ${
                  a11yColorTiles ? 'text-blue-900/80' : 'text-slate-500'
                }`}
              >
                {tierInfo.maxActiveJobs >= 500
                  ? 'Unlimited active role slots enabled'
                  : `${Math.max(
                      0,
                      tierInfo.maxActiveJobs - activeJobsCount
                    )} active role slots remaining`}
              </p>
            </div>
            <p
              className={`text-xs font-semibold mt-5 ${
                a11yColorTiles
                  ? 'text-blue-900 group-hover:text-blue-950 font-bold'
                  : 'text-slate-700 group-hover:text-slate-950'
              }`}
            >
              View &amp; edit roles →
            </p>
          </Link>

          {/* Card 3: Outbound Pitches */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/pitches'
                : '/dashboard/employer/organization'
            }
            className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              a11yColorTiles
                ? 'bg-amber-100/80 hover:bg-amber-200/65 border-slate-300 hover:border-slate-300 shadow-xs'
                : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <svg
                  className={`w-5 h-5 ${
                    a11yColorTiles ? 'text-amber-900' : 'text-slate-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
                <div className="flex items-center gap-1.5">
                  {pitchesUnreadMsgsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">
                      {pitchesUnreadMsgsCount} Unread
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                      a11yColorTiles
                        ? 'text-amber-950 bg-white/90 border-amber-300 font-bold'
                        : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                    }`}
                  >
                    {sentPitchesCount} Sent
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Outbound Pitches
              </h3>
              <p
                className={`text-xs mt-1 ${
                  a11yColorTiles ? 'text-amber-950/80' : 'text-slate-500'
                }`}
              >
                {pitchesUnreadMsgsCount > 0
                  ? `${pitchesUnreadMsgsCount} unread candidate ${
                      pitchesUnreadMsgsCount === 1 ? 'reply' : 'replies'
                    } waiting`
                  : acceptedPitchesCount > 0
                  ? `${acceptedPitchesCount} accepted · Direct pitches sent to talent`
                  : 'Candidates you pitched from Talent Search'}
              </p>
            </div>
            <p
              className={`text-xs font-semibold mt-5 ${
                a11yColorTiles
                  ? 'text-amber-950 group-hover:text-slate-950 font-bold'
                  : 'text-slate-700 group-hover:text-slate-950'
              }`}
            >
              Open outbound pitches →
            </p>
          </Link>

          {/* Card 4: Inbound Applications */}
          <Link
            href={
              hasOrg
                ? '/dashboard/employer/applications'
                : '/dashboard/employer/organization'
            }
            className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              a11yColorTiles
                ? 'bg-purple-100/75 hover:bg-purple-200/60 border-purple-400 hover:border-purple-500 shadow-xs'
                : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <svg
                  className={`w-5 h-5 ${
                    a11yColorTiles ? 'text-purple-800' : 'text-slate-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  />
                </svg>
                <div className="flex items-center gap-1.5">
                  {inboundUnreadMsgsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">
                      {inboundUnreadMsgsCount} Unread
                    </span>
                  ) : pendingAppsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[11px] font-semibold">
                      {pendingAppsCount} Awaiting
                    </span>
                  ) : null}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                      a11yColorTiles
                        ? 'text-purple-950 bg-white/90 border-purple-300 font-bold'
                        : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                    }`}
                  >
                    {inboundTotalCount} Total
                  </span>
                </div>
              </div>
              <h3
                className={`text-lg font-bold ${
                  a11yColorTiles ? 'text-purple-950' : 'text-slate-900'
                }`}
              >
                Inbound Applications
              </h3>
              <p
                className={`text-xs mt-1 ${
                  a11yColorTiles ? 'text-purple-900/80' : 'text-slate-500'
                }`}
              >
                {inboundUnreadMsgsCount > 0
                  ? `${inboundUnreadMsgsCount} unread applicant ${
                      inboundUnreadMsgsCount === 1 ? 'message' : 'messages'
                    }`
                  : pendingAppsCount > 0
                  ? `${pendingAppsCount} new blind applications (free to unlock)`
                  : 'Candidates who applied to your roles (free unlock)'}
              </p>
            </div>
            <p
              className={`text-xs font-semibold mt-5 ${
                a11yColorTiles
                  ? 'text-purple-900 group-hover:text-purple-950 font-bold'
                  : 'text-slate-700 group-hover:text-slate-950'
              }`}
            >
              Review inbound applicants →
            </p>
          </Link>
        </section>

        {/* COLLAPSIBLE EMPLOYER REPUTATION & MERIT BADGE BAR */}
        <ReputationBadgeCase summary={employerGamification} />
      </div>
    )
  }

  // ============================================================================
  // STREAMLINED CANDIDATE VIEW (PASTEL COLOR-CODED WIDGETS)
  // ============================================================================
  const isVerified = Boolean(
    profile?.identity_verified === true ||
      String(profile?.identity_verified) === 'true' ||
      profile?.is_verified === true ||
      String(profile?.is_verified) === 'true' ||
      profile?.verification_status === 'verified'
  )

  const { data: allCandidateApps } = await supabase
    .from('applications')
    .select(
      'id, job_id, status, is_revealed, initiated_by, match_score, match_data'
    )
    .eq('candidate_id', user.id)

  const candidateRecords = allCandidateApps || []
  const outboundCandidateApps = candidateRecords.filter(
    (a) => a.initiated_by !== 'employer'
  )
  const inboundEmployerPitches = candidateRecords.filter(
    (a) => a.initiated_by === 'employer'
  )

  const applicationCount = outboundCandidateApps.length
  const pendingRequestsCount = inboundEmployerPitches.filter(
    (a) => a.status === 'pending' && !a.is_revealed
  ).length

  const unreadOutboundMsgsCount = outboundCandidateApps.filter((a) =>
    hasUnreadThreadMessage(a, 'candidate')
  ).length
  const unreadPitchMsgsCount = inboundEmployerPitches.filter((a) =>
    hasUnreadThreadMessage(a, 'candidate')
  ).length

  const candidateGamification = calculateCandidateGamification(
    profile,
    candidateRecords
  )

  const hasProfileData = !!(profile?.skills && profile?.bio)
  const appliedJobIds = new Set(outboundCandidateApps.map((a) => a.job_id))
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

  const candidateDisplayName =
    profile?.full_name || profile?.name || 'Candidate Workspace'

  return (
    <div className="max-w-6xl mx-auto py-3 space-y-6">
      <DashboardLiveSync />

      {/* CANDIDATE HERO ROW */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-300">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {candidateDisplayName}
            </h1>
            <RankAndFounderPill
              level={candidateGamification.level}
              tier={candidateGamification.tier}
              isFounder={candidateGamification.isFounder}
              founderText="Founding Member"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs font-semibold text-slate-500">
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
            <span>2-Stage Identity &amp; Resume Vault Active</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/jobs?saved=true"
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-colors shadow-xs ${
              savedJobsCount > 0
                ? 'bg-amber-50 border-slate-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${
                savedJobsCount > 0
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-slate-400'
              }`}
              fill={savedJobsCount > 0 ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Saved Roles ({savedJobsCount})
          </Link>

          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-colors"
          >
            Browse Open Roles →
          </Link>
        </div>
      </header>

      {!isVerified && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Step 1: Verify Your Identity to Unlock Blind Applications
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Once verified via Stripe Identity, your 30-Day Founding Member access (15 free blind applications) begins automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <VerifyButton />
          </div>
        </div>
      )}

      {/* 4 CANDIDATE WIDGETS (DEFAULT MINIMALIST WHITE B2B OR ACCESSIBILITY COLOR-CODED) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Manage Profile */}
        <Link
          href="/dashboard/profile"
          className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            a11yColorTiles
              ? 'bg-slate-100/90 hover:bg-slate-200/70 border-slate-400 hover:border-slate-500 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                  hasProfileData
                    ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold'
                    : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                }`}
              >
                {hasProfileData ? 'Ready' : 'Setup'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Manage Profile
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {hasProfileData
                ? 'Resume parsed & ready for AI matching'
                : 'Upload your PDF resume to auto-fill skills'}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-950 mt-5">
            {hasProfileData ? 'Skill matrix & resume →' : 'Upload resume →'}
          </p>
        </Link>

        {/* Card 2: Inbound Pitches */}
        <Link
          href="/dashboard/requests"
          className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            a11yColorTiles
              ? 'bg-blue-100/75 hover:bg-blue-200/60 border-blue-400 hover:border-blue-500 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <svg
                className={`w-5 h-5 ${
                  a11yColorTiles ? 'text-blue-800' : 'text-slate-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M17 13l-5 5m0 0l-5-5m5 5V6"
                />
              </svg>
              <div className="flex items-center gap-1.5">
                {unreadPitchMsgsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">
                    {unreadPitchMsgsCount} Unread
                  </span>
                )}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    a11yColorTiles
                      ? 'text-blue-950 bg-white/90 border-blue-300 font-bold'
                      : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                  }`}
                >
                  {inboundEmployerPitches.length} Total
                </span>
              </div>
            </div>
            <h3
              className={`text-lg font-bold ${
                a11yColorTiles ? 'text-blue-950' : 'text-slate-900'
              }`}
            >
              Inbound Pitches
            </h3>
            <p
              className={`text-xs mt-1 ${
                a11yColorTiles ? 'text-blue-900/80' : 'text-slate-500'
              }`}
            >
              {unreadPitchMsgsCount > 0
                ? 'An employer sent you a message in your pitch inbox'
                : pendingRequestsCount > 0
                ? `${pendingRequestsCount} pending pitch — free to accept & unlock`
                : 'Direct role pitches from verified employers'}
            </p>
          </div>
          <p
            className={`text-xs font-semibold mt-5 ${
              a11yColorTiles
                ? 'text-blue-900 group-hover:text-blue-950 font-bold'
                : 'text-slate-700 group-hover:text-slate-950'
            }`}
          >
            Open inbound pitches →
          </p>
        </Link>

        {/* Card 3: Outbound Applications */}
        <Link
          href="/dashboard/applications"
          className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            a11yColorTiles
              ? 'bg-amber-100/80 hover:bg-amber-200/65 border-slate-300 hover:border-slate-300 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <svg
                className={`w-5 h-5 ${
                  a11yColorTiles ? 'text-amber-900' : 'text-slate-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              <div className="flex items-center gap-1.5">
                {unreadOutboundMsgsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">
                    {unreadOutboundMsgsCount} Unread
                  </span>
                )}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    a11yColorTiles
                      ? 'text-amber-950 bg-white/90 border-amber-300 font-bold'
                      : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                  }`}
                >
                  {applicationCount} Sent
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Outbound Applications
            </h3>
            <p
              className={`text-xs mt-1 ${
                a11yColorTiles ? 'text-amber-950/80' : 'text-slate-500'
              }`}
            >
              {unreadOutboundMsgsCount > 0
                ? 'An employer messaged you about your application'
                : 'Track blind applications & unlocked employers'}
            </p>
          </div>
          <p
            className={`text-xs font-semibold mt-5 ${
              a11yColorTiles
                ? 'text-amber-950 group-hover:text-slate-950 font-bold'
                : 'text-slate-700 group-hover:text-slate-950'
            }`}
          >
            Track applications →
          </p>
        </Link>

        {/* Card 4: Match Preferences */}
        <Link
          href="/dashboard/preferences"
          className={`group p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            a11yColorTiles
              ? 'bg-purple-100/75 hover:bg-purple-200/60 border-purple-400 hover:border-purple-500 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-300 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <svg
                className={`w-5 h-5 ${
                  a11yColorTiles ? 'text-purple-800' : 'text-slate-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3
              className={`text-lg font-bold ${
                a11yColorTiles ? 'text-purple-950' : 'text-slate-900'
              }`}
            >
              Match Preferences
            </h3>
            <p
              className={`text-xs mt-1 ${
                a11yColorTiles ? 'text-purple-900/80' : 'text-slate-500'
              }`}
            >
              Set minimum salary, employment types &amp; work model
            </p>
          </div>
          <p
            className={`text-xs font-semibold mt-5 ${
              a11yColorTiles
                ? 'text-purple-900 group-hover:text-purple-950 font-bold'
                : 'text-slate-700 group-hover:text-slate-950'
            }`}
          >
            Edit dealbreakers →
          </p>
        </Link>
      </section>

      {/* COLLAPSIBLE CANDIDATE REPUTATION & MERIT BADGE BAR */}
      <ReputationBadgeCase summary={candidateGamification} />

      {/* RECOMMENDED ROLES SECTION */}
      <section className="pt-6 border-t-2 border-slate-300">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Recommended Roles
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top active roles aligned with your skill matrix.
            </p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Search &amp; filter all roles →
          </Link>
        </div>

        <CandidateJobFeed
          jobs={recommendedJobs}
          isVerified={isVerified}
          showSortControls={false}
        />
      </section>
    </div>
  )
}
