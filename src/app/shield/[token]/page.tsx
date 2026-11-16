'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import {
  getAirlockEmployerContextAction,
  submitEmployerAirlockInvitationAction,
} from '@/app/dashboard/actions'

interface AirlockLiveJob {
  id: string
  title: string
  work_model: string
  salary_min: number | null
  salary_max: number | null
  pay_type: string
}

interface AirlockState {
  active: boolean
  authenticated?: boolean
  viewerRole?: string | null
  hasOrg?: boolean
  orgName?: string
  isDomainVerified?: boolean
  hasEntityMeta?: boolean
  isAdminIdVerified?: boolean
  tier?: string
  credits?: number
  liveJobs?: AirlockLiveJob[]
}

function formatRolePaySummary(job: AirlockLiveJob): string {
  const isHourly = job.pay_type === 'hourly' || (job.salary_max !== null && job.salary_max > 0 && job.salary_max <= 500)
  const fmt = (val: number | null) => {
    if (!val || Number.isNaN(Number(val))) return null
    if (isHourly) return `$${Number(val).toLocaleString()}/hr`
    const k = Math.round(Number(val) / 1000)
    return `$${k}k`
  }
  const minStr = fmt(job.salary_min)
  const maxStr = fmt(job.salary_max)
  if (minStr && maxStr) return `${minStr} – ${maxStr}`
  if (maxStr) return `Up to ${maxStr}`
  if (minStr) return `From ${minStr}`
  return 'Compensation Listed Inside Role'
}

export default function PublicInboundShieldAirlockPage() {
  const params = useParams()
  const rawTokenParam = params?.token
  const token = Array.isArray(rawTokenParam) ? rawTokenParam[0] || '' : String(rawTokenParam || '')

  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<AirlockState | null>(null)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [employerPitch, setEmployerPitch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [deliverySuccess, setDeliverySuccess] = useState<{
    referenceId: string
    remainingCredits: number
  } | null>(null)

  const loadContext = useCallback(async () => {
    if (!token) {
      setCtx({ active: false })
      setLoading(false)
      return
    }
    const res = await getAirlockEmployerContextAction(token)
    setCtx(res as AirlockState)
    if (res?.liveJobs && res.liveJobs.length > 0) {
      setSelectedJobId(res.liveJobs[0].id)
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const handleSubmitInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJobId) {
      setErrorMsg('Please select an active Protected Role to submit.')
      return
    }
    setErrorMsg(null)
    setSubmitting(true)
    const res = await submitEmployerAirlockInvitationAction({
      rawToken: token,
      jobId: selectedJobId,
      employerPitch,
    })
    setSubmitting(false)
    if (res.error) {
      setErrorMsg(res.error)
      return
    }
    if (res.success && res.referenceId) {
      setDeliverySuccess({
        referenceId: res.referenceId,
        remainingCredits: Number(res.remainingCredits ?? 0),
      })
    }
  }

  const returnPath = `/shield/${encodeURIComponent(token)}`
  const isEmployerReady =
    Boolean(ctx?.isDomainVerified) &&
    Boolean(ctx?.hasEntityMeta) &&
    Boolean(ctx?.isAdminIdVerified) &&
    Boolean(ctx?.tier && ctx.tier !== 'free') &&
    Number(ctx?.credits || 0) >= 1

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">
              Checking one-time Inbound Shield verification link...
            </p>
          </div>
        ) : deliverySuccess ? (
          <div className="rounded-2xl border-2 border-emerald-500 bg-white p-8 sm:p-10 shadow-sm space-y-6">
            <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
              ✓ Protected Role Delivered • Single-Use Link Burned
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Verified Invitation Sent
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Your Protected Role invitation has been delivered to this Professional's private inbox (`Ref: ${deliverySuccess.referenceId}`), and this one-time Inbound Shield link is now permanently retired.
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 space-y-1.5">
              <p>
                <strong>2-Stage Privacy Handshake:</strong> If the Professional accepts your invitation, a secure conversation opens immediately. Under our Accepted-Only Guarantee, declined or unanswered invitations are protected.
              </p>
              <p>
                <strong>Remaining Outbound Credits:</strong> {deliverySuccess.remainingCredits}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard/employer/pitches"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              >
                View Sent Invitations →
              </Link
              >
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
              >
                Employer Overview
              </Link>
            </div>
          </div>
        ) : !ctx?.active ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
              One-Time Link Inactive
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              This one-time verification link is no longer active.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              SpecialSauce.io Inbound Shield links are single-use and time-limited. Once a verified Protected Role invitation is delivered, expired, or retired by the member, the link closes permanently and reveals zero member details.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup/employer"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              >
                Explore Verified Employer Access →
              </Link>
              <Link
                href="/workflows"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
              >
                How the 2-Stage Privacy Handshake Works
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
                🛡️ SpecialSauce.io Inbound Shield • Verified Employer Gate
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Submit a Verified Protected Role
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                A verified Professional in The World's First Secured Workforce Ecosystem shared this single-use link to review your opportunity privately. To protect member privacy, this page displays zero personal, company, or profile details—personal contact info stays private until the member chooses to unlock it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Verify Organization
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  Confirm your corporate domain, business entity, and real-person admin ID ($25 verification fee, 100% credited toward Month 1 upon subscribing).
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Select Live Role
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  Choose an active Protected Role with transparent pay band and work model—no cold spam or vague pitches.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Mutual Handshake
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  Backed by our Accepted-Only Guarantee—your invitation delivers privately and this single-use link burns immediately.
                </p>
              </div>
            </div>

            {!ctx.authenticated ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-6 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Sign In or Verify Your Employer Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Already a verified SpecialSauce Employer? Sign in below and you will return right back to this one-time link to submit your Protected Role. New to SpecialSauce? Create your Employer account in minutes.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(returnPath)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                  >
                    Employer Sign In →
                  </Link>
                  <Link
                    href="/signup/employer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                  >
                    Create Verified Employer Account
                  </Link>
                </div>
              </div>
            ) : ctx.viewerRole !== 'employer' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
                <p className="text-sm font-bold text-emerald-950">
                  ✓ Link Preview Active (Zero Personal Details Exposed)
                </p>
                <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                  You are viewing this page while signed in with a Professional account. External recruiters who open this URL see zero personal or profile details and must sign in with a verified Employer account to submit a Protected Role.
                </p>
                <Link
                  href="/dashboard/shield"
                  className="inline-flex items-center text-xs sm:text-sm font-semibold text-indigo-700 hover:underline">
                  ← Back to Your Inbound Shield Hub
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      Organization: {ctx.orgName || 'Employer Workspace'}
                    </p>
                    <span className="text-xs font-semibold text-slate-600">
                      Outbound Credits Available: {Number(ctx.credits || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={ctx.isDomainVerified ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {ctx.isDomainVerified ? '✓ Corporate Domain Verified' : '○ Step 1: Verify Corporate Domain'}
                    </div>
                    <div className={ctx.hasEntityMeta ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {ctx.hasEntityMeta ? '✓ Federal EIN & Entity Saved' : '○ Step 2: Save Federal EIN & State'}
                    </div>
                    <div className={ctx.isAdminIdVerified ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {ctx.isAdminIdVerified ? '✓ Admin Real-Person ID Verified' : '○ Step 3: Verify Admin Real-Person ID'}
                    </div>
                    <div className={ctx.tier && ctx.tier !== 'free' && Number(ctx.credits || 0) >= 1 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {ctx.tier && ctx.tier !== 'free' && Number(ctx.credits || 0) >= 1
                        ? `✓ Active Plan (${String(ctx.tier).toUpperCase()})`
                        : '○ Step 4: Active Plan & Outbound Credit Required'}
                    </div>
                  </div>

                  {!isEmployerReady && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {(!ctx.isDomainVerified || !ctx.hasEntityMeta || !ctx.isAdminIdVerified) && (
                        <Link
                          href="/dashboard/employer/organization"
                          className="inline-flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition"
                        >
                          Complete Company Verification →
                        </Link>
                      )}
                      {(!ctx.tier || ctx.tier === 'free' || Number(ctx.credits || 0) < 1) && (
                        <Link
                          href="/dashboard/employer/billing"
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white transition"
                        >
                          Activate Plan ($25 Fee 100% Credited Toward Month 1) →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {errorMsg}
                  </div>
                )}

                {isEmployerReady && (!ctx.liveJobs || ctx.liveJobs.length === 0) ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-3">
                    <p className="text-sm font-bold text-amber-950">
                      Publish an Active Protected Role First
                    </p>
                    <p className="text-xs sm:text-sm text-amber-900">
                      You do not have an active published Protected Role yet. Publish your role on Manage Roles, then reopen this link to deliver your verified invitation.
                    </p>
                    <Link
                      href="/dashboard/employer/jobs"
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition"
                    >
                      Go to Manage Roles →
                    </Link>
                  </div>
                ) : isEmployerReady ? (
                  <form onSubmit={handleSubmitInvitation} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                        Select Active Protected Role
                      </label>
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {(ctx.liveJobs || []).map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.work_model} • {formatRolePaySummary(j)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                        Optional Context Note for the Professional (Max 600 Characters)
                      </label>
                      <textarea
                        rows={3}
                        maxLength={600}
                        value={employerPitch}
                        onChange={(e) => setEmployerPitch(e.target.value)}
                        placeholder="Share why you reached out and what makes this team and Protected Role compelling..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-slate-500">
                        Uses 1 Outbound Credit • Protected by our Accepted-Only Guarantee
                      </p>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
                      >
                        {submitting ? 'Verifying Alignment & Sending...' : 'Send Verified Role Invitation →'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
