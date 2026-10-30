'use client'

import { useState, useEffect } from 'react'
import {
  saveOrganizationProfile,
  verifyOrganizationDomain,
  toggleSandboxDomainVerification,
  toggleSandboxEmployerAdminIdentity,
} from '@/app/dashboard/actions'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import VerifyButton from '@/app/dashboard/VerifyButton'

const COMPANY_SIZE_OPTIONS = [
  'Seed / Startup (1–50 Employees)',
  'Growth (50–250 Employees)',
  'Mid-Market (250–1,000 Employees)',
  'Enterprise (1,000+ Employees)',
]

const US_STATES = [
  'Alabama (AL)', 'Alaska (AK)', 'Arizona (AZ)', 'Arkansas (AR)', 'California (CA)',
  'Colorado (CO)', 'Connecticut (CT)', 'Delaware (DE)', 'District of Columbia (DC)',
  'Florida (FL)', 'Georgia (GA)', 'Hawaii (HI)', 'Idaho (ID)', 'Illinois (IL)',
  'Indiana (IN)', 'Iowa (IA)', 'Kansas (KS)', 'Kentucky (KY)', 'Louisiana (LA)',
  'Maine (ME)', 'Maryland (MD)', 'Massachusetts (MA)', 'Michigan (MI)', 'Minnesota (MN)',
  'Mississippi (MS)', 'Missouri (MO)', 'Montana (MT)', 'Nebraska (NE)', 'Nevada (NV)',
  'New Hampshire (NH)', 'New Jersey (NJ)', 'New Mexico (NM)', 'New York (NY)',
  'North Carolina (NC)', 'North Dakota (ND)', 'Ohio (OH)', 'Oklahoma (OK)', 'Oregon (OR)',
  'Pennsylvania (PA)', 'Rhode Island (RI)', 'South Carolina (SC)', 'South Dakota (SD)',
  'Tennessee (TN)', 'Texas (TX)', 'Utah (UT)', 'Vermont (VT)', 'Virginia (VA)',
  'Washington (WA)', 'West Virginia (WV)', 'Wisconsin (WI)', 'Wyoming (WY)',
]

function formatEinInput(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

export default function EmployerOrganizationForm({
  initialOrg,
  userEmail,
  initialAdminIdVerified = false,
}: {
  initialOrg: any
  userEmail: string
  initialAdminIdVerified?: boolean
}) {
  const [name, setName] = useState(initialOrg?.name || '')
  const [domain, setDomain] = useState(initialOrg?.domain || '')
  const [ein, setEin] = useState(initialOrg?.ein || '')
  const [incorporationState, setIncorporationState] = useState(
    initialOrg?.incorporation_state || 'Delaware (DE)'
  )
  const [attestedEntity, setAttestedEntity] = useState(
    Boolean(initialOrg?.ein && initialOrg?.incorporation_state)
  )
  const [rdapStatus] = useState(initialOrg?.rdap_status || '')
  const [adminIdVerified, setAdminIdVerified] = useState(initialAdminIdVerified)

  const [industryVertical, setIndustryVertical] = useState(
    initialOrg?.industry_vertical
      ? normalizeIndustryVertical(initialOrg.industry_vertical)
      : 'Technology, Software & SaaS'
  )
  const [companySize, setCompanySize] = useState(
    initialOrg?.company_size || 'Growth (50–250 Employees)'
  )
  const [description, setDescription] = useState(initialOrg?.description || '')
  const [logoUrl, setLogoUrl] = useState(initialOrg?.logo_url || '')
  const [verificationStatus, setVerificationStatus] = useState<
    'verified' | 'pending'
  >(initialOrg?.verification_status === 'verified' ? 'verified' : 'pending')
  const [orgId, setOrgId] = useState<string | null>(initialOrg?.id || null)

  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isTogglingAdminId, setIsTogglingAdminId] = useState(false)
  const [showDnsInstructions, setShowDnsInstructions] = useState(false)
  const [showQaControls, setShowQaControls] = useState(
    process.env.NODE_ENV === 'development'
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    if (isLocal) {
      setShowQaControls(true)
    }
  }, [])

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const userEmailDomain = (userEmail.split('@')[1] || '').toLowerCase().trim()
  const cleanedDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]

  const isEmailMatchingDomain = Boolean(
    cleanedDomain && userEmailDomain === cleanedDomain
  )
  const dnsTxtToken = `special-sauce-verification=${(orgId || 'org').split('-')[0]}`
  const hasValidEinFormat = /^\d{2}-\d{7}$/.test(ein.trim())
  const pillar1Done = verificationStatus === 'verified'
  const pillar2Done = Boolean(hasValidEinFormat && incorporationState && attestedEntity)
  const pillar3Done = adminIdVerified
  const completedPillarsCount =
    (pillar1Done ? 1 : 0) + (pillar2Done ? 1 : 0) + (pillar3Done ? 1 : 0)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!attestedEntity) {
      setFeedback({
        type: 'error',
        text: 'Please check the Authorized Corporate Entity Attestation box before saving.',
      })
      return
    }
    setIsSaving(true)
    setFeedback(null)

    const cleanDescText = description
      .replace(/\s*\[IND:[^\]]*\]/gi, '')
      .replace(/\s*\[SIZE:[^\]]*\]/gi, '')
      .trim()

    const encodedDescription = `${cleanDescText} [IND:${industryVertical}] [SIZE:${companySize}]`.trim()

    const formData = new FormData()
    formData.append('name', name)
    formData.append('domain', domain)
    formData.append('ein', ein.trim())
    formData.append('incorporation_state', incorporationState)
    formData.append('industry_vertical', industryVertical)
    formData.append('company_size', companySize)
    formData.append('description', encodedDescription)
    formData.append('logo_url', logoUrl)

    const result = await saveOrganizationProfile(formData)

    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success) {
      setDomain(result.domain || '')
      setVerificationStatus(
        result.verification_status === 'verified' ? 'verified' : 'pending'
      )
      if (result.organizationId) setOrgId(result.organizationId)
      setFeedback({
        type: 'success',
        text: result.message || 'Company profile & EIN attestation saved!',
      })
    }

    setIsSaving(false)
  }

  const handleVerifyDomain = async () => {
    setIsVerifying(true)
    setFeedback(null)

    const result = await verifyOrganizationDomain(domain)

    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success) {
      setDomain(result.domain || domain)
      setVerificationStatus('verified')
      setFeedback({
        type: 'success',
        text: result.message || 'Domain & 90-Day RDAP Age Check verified!',
      })
    }

    setIsVerifying(false)
  }

  const handleSandboxToggle = async (target: 'verified' | 'pending') => {
    setIsVerifying(true)
    setFeedback(null)

    const result = await toggleSandboxDomainVerification(target)

    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success) {
      setVerificationStatus(target)
      setFeedback({
        type: 'success',
        text: result.message || 'Status updated!',
      })
    }

    setIsVerifying(false)
  }

  const handleSandboxAdminIdToggle = async (target: boolean) => {
    setIsTogglingAdminId(true)
    setFeedback(null)
    const result = await toggleSandboxEmployerAdminIdentity(target)
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success) {
      setAdminIdVerified(target)
      setFeedback({ type: 'success', text: result.message || 'Updated!' })
    }
    setIsTogglingAdminId(false)
  }

  return (
    <div className="space-y-8">
      {/* 3-PILLAR EMPLOYER TRUST & ANTI-HARVESTING SUMMARY BANNER */}
      <div className="p-4 sm:p-6 rounded-2xl border-2 border-slate-300 bg-white shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-300">
                🛡️ 3-Pillar Anti-Harvesting Gate
              </span>
              <span className="text-xs font-extrabold text-slate-600">
                {completedPillarsCount}/3 Pillars Verified
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1.5">
              Employer Trust &amp; Professional Vault Protection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              To protect candidate resumes from burner-domain harvesting, all 3 security pillars below are required before publishing roles or sending outbound pitches.
            </p>
          </div>
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border shrink-0 ${
              completedPillarsCount === 3
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {completedPillarsCount === 3
              ? '✓ Full Vault Access Unlocked'
              : '🔒 Action Required to Unlock Invitations'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Pillar 1 */}
          <div
            className={`p-4 rounded-xl border ${
              pillar1Done
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-extrabold text-slate-900 mb-1">
              <span>1. Domain &amp; 90-Day RDAP</span>
              <span className={pillar1Done ? 'text-emerald-700' : 'text-amber-700'}>
                {pillar1Done ? '✓ Verified' : 'Pending'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Live DNS MX/TXT check + automated RDAP registry check blocking burner domains registered &lt;90 days ago.
              {rdapStatus ? ` (${rdapStatus})` : ''}
            </p>
          </div>

          {/* Pillar 2 */}
          <div
            className={`p-4 rounded-xl border ${
              pillar2Done
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-extrabold text-slate-900 mb-1">
              <span>2. Federal EIN &amp; State</span>
              <span className={pillar2Done ? 'text-emerald-700' : 'text-amber-700'}>
                {pillar2Done ? `✓ ${ein}` : 'Required Below'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              IRS 9-digit EIN prefix validation + State of Incorporation legal representative attestation.
            </p>
          </div>

          {/* Pillar 3 */}
          <div
            className={`p-4 rounded-xl border ${
              pillar3Done
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-extrabold text-slate-900 mb-1">
              <span>3. Admin Stripe Identity</span>
              <span className={pillar3Done ? 'text-emerald-700' : 'text-amber-700'}>
                {pillar3Done ? '✓ Biometric ID Verified' : 'Action Required'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              1-time government ID + live selfie verification for the Employer Account Admin via Stripe Identity.
            </p>
          </div>
        </div>

        {/* PILLAR 3 ACTION BAR: EMPLOYER ADMIN STRIPE IDENTITY */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            pillar3Done
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-indigo-50/70 border-indigo-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                {pillar3Done
                  ? '✓ Employer Admin Identity Verified (Stripe Biometric ID)'
                  : '🔒 Step 3: Verify Employer Admin Identity with Stripe'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {pillar3Done
                ? 'Your personal identity is cryptographically verified. Professionals see the "🛡️ ID-Verified Hiring Manager" trust signal on your invitations.'
                : 'Just like candidates, Employer Admins complete a 60-second Stripe Identity check so candidates know a real, accountable hiring leader is behind every role.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!pillar3Done ? (
              <VerifyButton />
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold">
                ✓ Admin ID Verified
              </span>
            )}

            {showQaControls && (
              <button
                type="button"
                disabled={isTogglingAdminId}
                onClick={() => handleSandboxAdminIdToggle(!pillar3Done)}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-50 transition-colors cursor-pointer"
              >
                {pillar3Done
                  ? '⚡ Sandbox: Reset Admin ID'
                  : '⚡ Sandbox: Mark Admin ID Verified'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DOMAIN VERIFICATION HUB CARD */}
      <div
        className={`p-4 sm:p-6 md:p-8 rounded-2xl border shadow-sm transition-all ${
          verificationStatus === 'verified'
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-amber-50/70 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                verificationStatus === 'verified'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {verificationStatus === 'verified' ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3
                  className={`text-lg font-extrabold ${
                    verificationStatus === 'verified'
                      ? 'text-emerald-950'
                      : 'text-amber-950'
                  }`}
                >
                  {verificationStatus === 'verified'
                    ? 'Corporate Domain & 90-Day RDAP Age Verified'
                    : 'Step 1: Corporate Domain & 90-Day RDAP Verification'}
                </h3>

                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    verificationStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {verificationStatus === 'verified' ? '✓ Verified' : 'Pending'}
                </span>
              </div>

              <p
                className={`text-sm mt-1 leading-relaxed ${
                  verificationStatus === 'verified'
                    ? 'text-emerald-800'
                    : 'text-amber-800'
                }`}
              >
                {verificationStatus === 'verified'
                  ? `Your organization domain (${
                      cleanedDomain || 'company domain'
                    }) passed live DNS and 90-day RDAP domain age checks. The "✓ Verified Company" trust badge and your Primary Industry Vertical (${industryVertical}) now power your protected job listings.`
                  : 'Verify your corporate domain via work-email match + live DNS MX/TXT check and automated 90-day RDAP domain age check.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {verificationStatus !== 'verified' ? (
              <button
                type="button"
                disabled={isVerifying || !orgId}
                onClick={handleVerifyDomain}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? 'Checking DNS & RDAP Age...' : 'Verify Domain Now'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleSandboxToggle('pending')}
                className="px-4 py-2 bg-white text-slate-600 border-2 border-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border-slate-300"
              >
                Reset to Pending
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700">
              Logged-in Email:{' '}
              <span className="text-indigo-700">{userEmail}</span>
            </span>
            {cleanedDomain && (
              <span
                className={`px-2.5 py-1 rounded-md font-bold border ${
                  isEmailMatchingDomain
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                    : 'bg-white/80 text-slate-600 border-slate-300'
                }`}
              >
                {isEmailMatchingDomain
                  ? `✓ Matches @${cleanedDomain}`
                  : `Email domain (@${userEmailDomain}) ≠ @${cleanedDomain}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDnsInstructions(!showDnsInstructions)}
              className="font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
            >
              {showDnsInstructions
                ? 'Hide DNS TXT Instructions'
                : 'Verify via DNS TXT Record'}
            </button>

            {showQaControls && verificationStatus !== 'verified' && orgId && (
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleSandboxToggle('verified')}
                className="px-3 py-1.5 rounded-lg bg-white/90 border border-amber-300 text-amber-900 font-bold hover:bg-white transition-colors shadow-sm cursor-pointer"
              >
                ⚡ Sandbox: Simulate Verified
              </button>
            )}
          </div>
        </div>

        {showDnsInstructions && (
          <div className="mt-4 p-4 rounded-xl bg-white border-2 border-slate-300 text-xs space-y-2 border-slate-300">
            <p className="font-bold text-slate-800">
              Alternative Method: DNS TXT Record Ownership Verification
            </p>
            <p className="text-slate-600">
              If your login email (<span className="font-mono">{userEmail}</span>
              ) uses a different domain than{' '}
              <span className="font-mono font-bold">
                {cleanedDomain || 'your-company.com'}
              </span>
              , add the following <strong>TXT</strong> record to your
              domain&apos;s DNS settings and click{' '}
              <strong>Verify Domain Now</strong>:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs flex items-center justify-between gap-2 overflow-x-auto">
              <span>{dnsTxtToken}</span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-bold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* COMPANY PROFILE & LEGAL ENTITY ATTESTATION FORM */}
      <form
        onSubmit={handleSave}
        className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Step 2: Organization Details &amp; Legal Entity Attestation (EIN)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Your company name, Federal EIN, and description remain strictly vaulted on protected job listings until a mutual connection is unlocked.
          </p>
        </div>

        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          {/* Row 1: Company Name & Corporate Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Legal / Operating Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp LLC"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium border-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Corporate Domain *
              </label>
              <input
                type="text"
                name="domain"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. acmecorp.com"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium border-slate-300"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: Enter <strong>{userEmailDomain}</strong> to auto-verify with your current login ({userEmail}).
              </p>
            </div>
          </div>

          {/* Row 1B: Federal EIN & State of Incorporation (Pillar 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-300">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Federal Tax ID / IRS EIN (XX-XXXXXXX) *
              </label>
              <input
                type="text"
                name="ein"
                required
                maxLength={10}
                value={ein}
                onChange={(e) => setEin(formatEinInput(e.target.value))}
                placeholder="e.g. 43-2607769"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-mono font-bold border-slate-300"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Encrypted &amp; never displayed publicly. Used exclusively to verify legitimate US/corporate tax entities.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                State of Incorporation / Registration *
              </label>
              <select
                name="incorporation_state"
                value={incorporationState}
                onChange={(e) => setIncorporationState(e.target.value)}
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium cursor-pointer border-slate-300"
              >
                {US_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Jurisdiction where your legal business entity is registered with the Secretary of State.
              </p>
            </div>
          </div>

          {/* Row 2: Primary Industry Vertical & Company Stage / Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-300">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Primary Industry Vertical
              </label>
              <select
                name="industry_vertical"
                value={industryVertical}
                onChange={(e) => setIndustryVertical(e.target.value)}
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium cursor-pointer border-slate-300"
              >
                {STANDARD_INDUSTRY_VERTICALS.map((vertical) => (
                  <option key={vertical} value={vertical}>
                    {vertical}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Shown as your anonymous company teaser on protected job cards (e.g., &ldquo;Protected Role • {industryVertical}&rdquo;).
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Company Stage / Size
              </label>
              <select
                name="company_size"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium cursor-pointer border-slate-300"
              >
                {COMPANY_SIZE_OPTIONS.map((sizeOpt) => (
                  <option key={sizeOpt} value={sizeOpt}>
                    {sizeOpt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Helps candidates understand your organization scale before unlocking.
              </p>
            </div>
          </div>

          {/* Row 3: Company Description */}
          <div className="pt-3 border-t border-slate-300">
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Company Description
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Kept anonymous until you unlock a candidate&apos;s application or a candidate accepts your pitch.
            </p>
            <textarea
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your company build, and what makes your team or culture unique?"
              className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm border-slate-300"
            />
          </div>

          {/* Row 4: Logo URL */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              name="logo_url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm border-slate-300"
            />
          </div>

          {/* Legal Entity Attestation Checkbox */}
          <div className="pt-3 border-t border-slate-300">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attestedEntity}
                onChange={(e) => setAttestedEntity(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Authorized Corporate Entity Attestation:</strong> I certify that I am an authorized officer, hiring manager, or recruiter for <strong>{name || 'this legal entity'}</strong>, that the Federal EIN and State of Incorporation provided above are accurate, and that I will only access candidate profiles for genuine employment opportunities in accordance with the Special Sauce Terms of Service.
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Validating EIN, Domain & Saving...' : 'Save Company Profile & EIN Attestation'}
          </button>
        </div>
      </form>
    </div>
  )
}
