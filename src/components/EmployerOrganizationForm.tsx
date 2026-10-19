'use client'

import { useState } from 'react'
import {
  saveOrganizationProfile,
  verifyOrganizationDomain,
  toggleSandboxDomainVerification,
} from '@/app/dashboard/actions'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'

const COMPANY_SIZE_OPTIONS = [
  'Seed / Startup (1–50 Employees)',
  'Growth (50–250 Employees)',
  'Mid-Market (250–1,000 Employees)',
  'Enterprise (1,000+ Employees)',
]

export default function EmployerOrganizationForm({
  initialOrg,
  userEmail,
}: {
  initialOrg: any
  userEmail: string
}) {
  const [name, setName] = useState(initialOrg?.name || '')
  const [domain, setDomain] = useState(initialOrg?.domain || '')
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
  const [showDnsInstructions, setShowDnsInstructions] = useState(false)
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
        text: result.message || 'Company profile saved!',
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
        text: result.message || 'Domain verified!',
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

  return (
    <div className="space-y-8">
      {/* DOMAIN VERIFICATION HUB CARD */}
      <div
        className={`p-6 md:p-8 rounded-2xl border shadow-sm transition-all ${
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
                    ? 'Corporate Domain Verified'
                    : 'Corporate Domain Verification Required'}
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
                    }) is verified. The "✓ Verified Company" trust badge and your Primary Industry Vertical (${industryVertical}) now power your blind job listings and outbound candidate pitches.`
                  : 'Verify your corporate domain via work-email match + live DNS check or DNS TXT record to unlock the "✓ Verified Company" badge and your 30-Day Founding Partner Trial.'}
              </p>
            </div>
          </div>

          {/* Primary Verification Action Buttons */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {verificationStatus !== 'verified' ? (
              <button
                type="button"
                disabled={isVerifying || !orgId}
                onClick={handleVerifyDomain}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? 'Checking DNS & Email...' : 'Verify Domain Now'}
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

        {/* Verification Methods & Sandbox Bar */}
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

            {verificationStatus !== 'verified' && orgId && (
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

        {/* Expandable DNS TXT Record Instructions */}
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

      {/* COMPANY PROFILE FORM */}
      <form
        onSubmit={handleSave}
        className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6 border-slate-300"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Organization Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Your company name and description remain hidden on blind job listings until a mutual connection is unlocked, while your Primary Industry Vertical and Company Stage power your anonymous role teasers.
          </p>
        </div>

        <div className="space-y-5 rounded-xl bg-slate-50 p-6 border-2 border-slate-300 border-slate-300">
          {/* Row 1: Company Name & Corporate Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium border-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Corporate Domain
              </label>
              <input
                type="text"
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. test.com or acmecorp.com"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none py-2.5 px-3.5 text-sm font-medium border-slate-300"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: Enter <strong>{userEmailDomain}</strong> to auto-verify with your current login ({userEmail}).
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
                Shown as your anonymous company teaser on blind job cards (e.g., &ldquo;Blind Role • {industryVertical}&rdquo;).
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
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving & Checking Domain...' : 'Save Company Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}