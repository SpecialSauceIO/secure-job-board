'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import {
  getAirlockEmployerContextAction,
  submitEmployerAirlockInvitationAction,
  getTalentShieldProfessionalContextAction,
  redeemEmployerTalentShieldLinkAction,
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

function ShieldWorkspaceHeader({ viewerRole }: { viewerRole?: string | null }) {
  const isEmployer = viewerRole === 'employer'
  const dashboardHref = '/dashboard'
  const secondaryHref = isEmployer ? '/dashboard/employer/hiring-bridge' : '/dashboard/profile'
  const secondaryLabel = isEmployer ? 'Hiring Bridge' : 'My Profile'
  const primaryLabel = isEmployer ? 'Employer Workspace →' : 'Professional Dashboard →'

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 h-20 sm:h-24 flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0">
          <Link
            href={dashboardHref}
            className="flex items-center hover:opacity-90 transition-opacity focus:outline-none"
          >
            <img
              src="/logo.png?v=20261024"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-11 sm:h-15 md:h-[68px] w-auto max-w-[200px] sm:max-w-none object-contain"
            />
          </Link>
        </div>

        <div className="hidden xl:flex items-center justify-center gap-3 mx-auto px-2 pointer-events-none shrink-0">
          <span className="h-5 w-px bg-slate-400" />
          <p className="text-[11px] font-semibold text-slate-700 tracking-[0.12em] uppercase whitespace-nowrap">
            THE WORLD&apos;S FIRST SECURED WORKFORCE ECOSYSTEM™
          </p>
          <span className="h-5 w-px bg-slate-400" />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href={secondaryHref}
            className="hidden sm:inline-flex items-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition"
          >
            {secondaryLabel}
          </Link>
          <Link
            href={dashboardHref}
            className="inline-flex items-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </nav>
  )
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

interface TalentShieldProfessionalState {
  active: boolean
  mode?: 'outbound_sourcing' | 'inbound_dm_gate'
  authenticated?: boolean
  viewerRole?: string | null
  isIdVerified?: boolean
  employerSponsoredAvailable?: boolean
  sponsorshipGate?: {
    minYearsExperience: number | null
    minYearsField: string
    topSkills?: string[]
    workModel: string
    salaryMin: number | null
    salaryMax: number | null
    payType: string
  } | null
  hasStructuredSkills?: boolean
  canApplyOutbound?: boolean
  tierLabel?: string
  protectedRolePreview?: {
    title: string
    work_model: string
    salary_min: number | null
    salary_max: number | null
    industry_vertical: string
    employer_pitch: string
  }
}

export default function PublicInboundShieldAirlockPage() {
  const params = useParams()
  const rawTokenParam = params?.token
  const token = Array.isArray(rawTokenParam) ? rawTokenParam[0] || '' : String(rawTokenParam || '')
  const isEmployerInviteToken = token.startsWith('ss_inv_')

  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<AirlockState | null>(null)
  const [profCtx, setProfCtx] = useState<TalentShieldProfessionalState | null>(null)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [employerPitch, setEmployerPitch] = useState('')
  const [professionalNote, setProfessionalNote] = useState('')
  const [gateYearsInput, setGateYearsInput] = useState('')
  const [gateWorkModelOk, setGateWorkModelOk] = useState<'yes' | 'no' | null>(null)
  const [gatePayRangeOk, setGatePayRangeOk] = useState<'yes' | 'no' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [belowThresholdInfo, setBelowThresholdInfo] = useState<{
    matchScore: number
    minThreshold: number
  } | null>(null)
  const [deliverySuccess, setDeliverySuccess] = useState<{
    referenceId: string
    remainingCredits: number
  } | null>(null)
  const [profRedeemSuccess, setProfRedeemSuccess] = useState<{
    mode: 'outbound_sourcing' | 'inbound_dm_gate'
    referenceId: string
    matchScore: number
    destinationUrl: string
  } | null>(null)

  const loadContext = useCallback(async () => {
    if (!token) {
      setCtx({ active: false })
      setProfCtx({ active: false })
      setLoading(false)
      return
    }
    if (token.startsWith('ss_inv_')) {
      const previewGate = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview_gate') === '1'
      const res = await getTalentShieldProfessionalContextAction(token, previewGate)
      setProfCtx(res as TalentShieldProfessionalState)
      setLoading(false)
      return
    }
    setCtx({ active: false })
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

  const handleRedeemProtectedRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setBelowThresholdInfo(null)
    setSubmitting(true)
    const res = await redeemEmployerTalentShieldLinkAction({
      rawToken: token,
      candidateNote: professionalNote,
    })
    setSubmitting(false)
    if ('belowThreshold' in res && res.belowThreshold) {
      setBelowThresholdInfo({
        matchScore: Number(res.matchScore ?? 0),
        minThreshold: Number(res.minThreshold ?? 40),
      })
      return
    }
    if (res.error) {
      setErrorMsg(res.error)
      return
    }
    if (res.success && res.referenceId && res.mode) {
      setProfRedeemSuccess({
        mode: res.mode,
        referenceId: res.referenceId,
        matchScore: Number(res.matchScore ?? 0),
        destinationUrl: String(res.destinationUrl || '/dashboard'),
      })
    }
  }

  const returnPath = `/hiring-bridge/${encodeURIComponent(token)}`

  const handleLaunchSponsoredIdentity = async () => {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ss_shield_return_to', returnPath)
      }
      const res = await fetch('/api/identity/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridgeToken: token,
          returnTo: '/onboarding?identity=complete',
          gateConfirmed: true,
          yearsExperience: gateYearsInput.trim() === '' ? null : Number(gateYearsInput),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.url) {
        window.location.href = data.url
        return
      }
      setErrorMsg(data?.error || 'Unable to launch Employer-Sponsored ID Verification. Please try again.')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error launching Employer-Sponsored ID Verification.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isEmployerInviteToken) {
    const preview = profCtx?.protectedRolePreview
    const previewPay = preview
      ? formatRolePaySummary({
          id: 'preview',
          title: preview.title,
          work_model: preview.work_model,
          salary_min: preview.salary_min,
          salary_max: preview.salary_max,
          pay_type: 'annual',
        })
      : ''
    const isDmGate = profCtx?.mode === 'inbound_dm_gate'

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {profCtx?.authenticated ? (
          <ShieldWorkspaceHeader viewerRole={profCtx.viewerRole} />
        ) : (
          <PublicHeader />
        )}

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600">
                Checking one-time Verified Hiring Bridge link...
              </p>
            </div>
          ) : profRedeemSuccess ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-8 sm:p-10 shadow-sm space-y-6">
              <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                ✓ {profRedeemSuccess.matchScore}% TrueFit™ Verified • Single-Use Link Burned
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {profRedeemSuccess.mode === 'inbound_dm_gate'
                  ? 'Protected Application Submitted'
                  : 'Protected Role Invitation Delivered'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {profRedeemSuccess.mode === 'inbound_dm_gate'
                  ? `Your anonymous Stage 1 TrueFit™ scorecard (${profRedeemSuccess.matchScore}%) has been delivered to this Employer's Inbound Applications queue (Ref: ${profRedeemSuccess.referenceId}). Your personal info stays private until you both choose to unlock Stage 2.`
                  : `This Protected Role invitation (${profRedeemSuccess.matchScore}% TrueFit™) is now in your Professional Invitations inbox (Ref: ${profRedeemSuccess.referenceId}). Review the full role details and choose whether to accept and unlock Stage 2.`}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={profRedeemSuccess.destinationUrl}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                >
                  {profRedeemSuccess.mode === 'inbound_dm_gate'
                    ? 'View My Applications →'
                    : 'Open Professional Invitations →'}
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                >
                  Dashboard Overview
                </Link>
              </div>
            </div>
          ) : !profCtx?.active ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
                One-Time Link Inactive
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                This one-time Protected Role link is no longer active.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                SpecialSauce.io Verified Hiring Bridge links are single-use and time-limited. Once redeemed, expired, or retired by the verified Employer, the link closes permanently and exposes zero company or role details.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                >
                  Join as a Verified Professional →
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
                  🛡️ SpecialSauce.io Verified Hiring Bridge •{' '}
                  {isDmGate ? 'Verified Hiring-Manager Gate' : 'Verified Protected Role Invitation'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {isDmGate
                    ? 'Verify & Submit Your Protected Application'
                    : 'Unlock Your Private Protected Role Invitation'}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  A 3/3 verified Employer in The World's First Secured Workforce Ecosystem shared this single-use Protected Role link with you. Your personal name, resume, and contact details stay completely private until you both choose to unlock Stage 2.
                </p>
              </div>

              {belowThresholdInfo && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 space-y-3 text-amber-950">
                  <p className="text-sm font-bold">
                    TrueFit™ Alignment Below {belowThresholdInfo.minThreshold}% Threshold (Verified Score: {belowThresholdInfo.matchScore}%)
                  </p>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                    Protected Role handshakes require at least {belowThresholdInfo.minThreshold}% TrueFit™ alignment. Your personal identity remained completely private, 0 credits were used, and this one-time link was not burned.
                  </p>
                  <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                    If your profile is missing relevant skills, certifications, or experience for this role, update your verified Professional profile and re-check alignment here — or head back to your dashboard to explore stronger Protected Role matches.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      href="/dashboard/profile"
                      className="inline-flex items-center justify-center rounded-xl bg-amber-900 hover:bg-amber-950 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition"
                    >
                      Update My Profile →
                    </Link
                    >
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center rounded-xl border border-amber-400 bg-white hover:bg-amber-100/60 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-950 transition"
                    >
                      Back to Professional Dashboard
                    </Link>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {errorMsg}
                </div>
              )}

              {!profCtx.authenticated ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-6 space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Sign In or Verify Your Professional Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {isDmGate
                      ? 'Sign in or create your SpecialSauce Professional account to verify your identity for $0 (Employer-sponsored via this Verified Hiring Bridge link), check your 40%+ TrueFit™ alignment, and submit your Protected Application.'
                      : 'Sign in or create your SpecialSauce Professional account to verify your identity for $0 (Employer-sponsored via this Verified Hiring Bridge link) and return right here to receive this Protected Role invitation.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/login?next=${encodeURIComponent(returnPath)}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                    >
                      Professional Sign In →
                    </Link>
                    <Link
                      href={`/signup/professional?next=${encodeURIComponent(returnPath)}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                    >
                      Create Verified Professional Account
                    </Link>
                  </div>
                </div>
              ) : profCtx.viewerRole === 'employer' ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
                  <p className="text-sm font-bold text-emerald-950">
                    ✓ Link Preview Active (Zero Company or Role Details Exposed Publicly)
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                    You are viewing this link while signed in with an Employer account. Unverified visitors see zero company names, compensation bands, or role titles — only Real-Person ID-verified Professionals can preview and redeem this Protected Role.
                  </p>
                  <Link
                    href="/dashboard/employer/hiring-bridge"
                    className="inline-flex items-center text-xs sm:text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    ← Back to Verified Hiring Bridge
                  </Link>
                </div>
              ) : !profCtx.isIdVerified ? (
                profCtx.employerSponsoredAvailable ? (
                  (() => {
                    const gate = profCtx.sponsorshipGate
                    const requiresYears = Boolean(gate?.minYearsExperience && gate.minYearsExperience > 0)
                    const parsedYears = gateYearsInput.trim() === '' ? null : Number(gateYearsInput)
                    const yearsValidNum = parsedYears !== null && Number.isFinite(parsedYears) && parsedYears >= 0
                    const yearsPassed = !requiresYears || (yearsValidNum && (parsedYears as number) >= Number(gate?.minYearsExperience || 0))
                    const gateFailed =
                      (requiresYears && yearsValidNum && !yearsPassed) ||
                      gateWorkModelOk === 'no' ||
                      gatePayRangeOk === 'no'
                    const gatePassed =
                      (!requiresYears || (yearsValidNum && yearsPassed)) &&
                      gateWorkModelOk === 'yes' &&
                      gatePayRangeOk === 'yes'
                    const gateWorkModelLabel = String(gate?.workModel || 'remote').replace(/_/g, '-')
                    const gatePaySummary = gate
                      ? formatRolePaySummary({
                          id: 'gate',
                          title: 'Role',
                          work_model: gate.workModel,
                          salary_min: gate.salaryMin,
                          salary_max: gate.salaryMax,
                          pay_type: gate.payType,
                        })
                      : 'Listed inside role'
                    return (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-5 sm:p-6 space-y-5">
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-emerald-950">
                            ✓ Employer-Sponsored Real-Person ID Verification ($0 Due)
                          </p>
                          <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                            Confirm these quick role requirements first. If you meet them, this Employer covers your one-time government ID check at $0 cost so you can enter their pipeline directly.
                          </p>
                        </div>

                        <div className="space-y-4 rounded-xl border border-emerald-200 bg-white p-4">
                          {Array.isArray(gate?.topSkills) && gate.topSkills.length > 0 && (
                            <div className="space-y-1.5 pb-2 border-b border-slate-100">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                Key Core Skills for This Role
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {gate.topSkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {requiresYears && (
                            <div className="space-y-1.5">
                              <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                                1. How many years of relevant experience do you have in {gate?.minYearsField || 'this role'}?
                              </label>
                              <p className="text-xs text-slate-500">
                                Enter a whole number (role requires at least {gate?.minYearsExperience} years for Employer sponsorship).
                              </p>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={gateYearsInput}
                                onChange={(e) => setGateYearsInput(e.target.value)}
                                placeholder="Enter years of experience"
                                className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">
                              {requiresYears ? '2.' : '1.'} This role is <span className="uppercase">{gateWorkModelLabel}</span>. Are you comfortable with this work model?
                            </p>
                            <div className="flex gap-2.5">
                              <button
                                type="button"
                                onClick={() => setGateWorkModelOk('yes')}
                                className={`rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                                  gateWorkModelOk === 'yes'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setGateWorkModelOk('no')}
                                className={`rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                                  gateWorkModelOk === 'no'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">
                              {requiresYears ? '3.' : '2.'} The pay range for this role is {gatePaySummary}. Are you comfortable with this pay range?
                            </p>
                            <div className="flex gap-2.5">
                              <button
                                type="button"
                                onClick={() => setGatePayRangeOk('yes')}
                                className={`rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                                  gatePayRangeOk === 'yes'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setGatePayRangeOk('no')}
                                className={`rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                                  gatePayRangeOk === 'no'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </div>

                        {gateFailed ? (
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2.5">
                            <p className="text-sm font-bold text-amber-950">
                              Not Eligible for Employer-Sponsored Verification on This Role
                            </p>
                            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                              Because this role's requirements do not match your answers, this Employer's $0 sponsorship does not apply. You can still join SpecialSauce.io on your own with the one-time $5 Explorer Verification Pass ($0/mo forever, and 100% credited toward Month 1 if you ever subscribe) to access all verified Employers and Protected Roles.
                            </p>
                            <Link
                              href="/dashboard/billing"
                              className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition">
                              Verify on Your Own ($5 One-Time) →
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={submitting || !gatePassed}
                            onClick={handleLaunchSponsoredIdentity}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition cursor-pointer">
                            {submitting ? 'Launching $0 Stripe Identity...' : 'Verify Real-Person ID for $0 →'}
                          </button>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-3">
                    <p className="text-sm font-bold text-amber-950">
                      Complete Real-Person ID Verification First
                    </p>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      This Employer has used their monthly Sponsored Verification allowance. You can still verify directly with the one-time $5 Explorer Verification Pass ($0/mo forever, and 100% credited toward Month 1 if you ever subscribe), then reopen this link.
                    </p>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition"
                    >
                      Complete Real-Person ID Check →
                    </Link>
                  </div>
                )
              ) : !profCtx.hasStructuredSkills ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-3">
                  <p className="text-sm font-bold text-amber-950">
                    Add Your Anonymous Structured Skills First
                  </p>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                    Add your Structured Skills on My Profile so Special Sauce can verify your 40%+ TrueFit™ alignment without exposing your resume or identity.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition"
                  >
                    Complete Structured Skills →
                  </Link>
                </div>
              ) : isDmGate && !profCtx.canApplyOutbound ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 space-y-3">
                  <p className="text-sm font-bold text-slate-900">
                    Active Application Plan Required
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    This link is an Inbound Hiring-Manager DM Gate. Activate Professional ($12/mo — 15 Protected Applications/mo, with your $5 verification fee 100% credited toward Month 1) or Prestige ($19/mo — Unlimited) on Membership & Plan Settings, then reopen this link.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition"
                  >
                    Upgrade Plan →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRedeemProtectedRole} className="space-y-5">
                  {preview && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-bold text-slate-900">{preview.title}</p>
                        <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-700">
                          {String(preview.work_model || 'remote').toUpperCase()} • {previewPay}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        3/3 Verified Employer (Company Name Unlocks After Stage 1 Handshake)
                        {preview.industry_vertical ? ` • ${preview.industry_vertical}` : ''}
                      </p>
                      {preview.employer_pitch && (
                        <div className="mt-2 rounded-lg border border-indigo-100 bg-white p-3 text-xs sm:text-sm text-slate-700">
                          <strong className="text-slate-900">Hiring Team Note:</strong> {preview.employer_pitch}
                        </div>
                      )}
                    </div>
                  )}

                  {isDmGate && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                        Optional Stage 1 Cover Note (No Personal Contact Info — Max 600 Characters)
                      </label>
                      <textarea
                        rows={3}
                        maxLength={600}
                        value={professionalNote}
                        onChange={(e) => setProfessionalNote(e.target.value)}
                        placeholder="Highlight relevant systems, outcomes, or why you reached out (keep personal email, phone, and links private until Stage 2)..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-slate-500">
                      Requires 40%+ TrueFit™ Alignment • Zero Personal Info Shared in Stage 1
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
                    >
                      {submitting
                        ? 'Verifying 40%+ TrueFit™...'
                        : isDmGate
                          ? 'Verify TrueFit™ & Submit Application →'
                          : 'Verify TrueFit™ & Receive Invitation →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>

        <PublicFooter />
      </div>
    )
  }
  const isEmployerReady =
    Boolean(ctx?.isDomainVerified) &&
    Boolean(ctx?.hasEntityMeta) &&
    Boolean(ctx?.isAdminIdVerified) &&
    Boolean(ctx?.tier && ctx.tier !== 'free') &&
    Number(ctx?.credits || 0) >= 1

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {ctx?.authenticated ? (
        <ShieldWorkspaceHeader viewerRole={ctx.viewerRole} />
      ) : (
        <PublicHeader />
      )}

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">
              Checking one-time Verified Hiring Bridge link...
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
              SpecialSauce.io Verified Hiring Bridge links are time-limited and tied to active Protected Roles. Legacy personal recruiter links have been retired, and expired or retired links close permanently while revealing zero member details.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup/employer"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              >
                Explore Verified Employer Access →
              </Link>
              <Link
                href="/how-it-works"
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
                    href={`/signup/employer?next=${encodeURIComponent(returnPath)}`}
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
                  href="/dashboard"
                  className="inline-flex items-center text-xs sm:text-sm font-semibold text-indigo-700 hover:underline">
                  ← Back to Professional Dashboard
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
