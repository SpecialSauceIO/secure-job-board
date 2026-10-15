'use client'

import { useState, useMemo } from 'react'
import {
  FAQ,
  PLAYBOOK_GUIDES,
  SECURITY_ARCHITECTURE_DATA,
} from '@/constants/faqs'
import { submitSupportTicket } from '@/app/dashboard/actions'
import { SubmitButton } from '@/components/SubmitButton'

export default function SupportCenterClient({
  faqs,
  userRole,
  initialTab = 'guides',
}: {
  faqs: FAQ[]
  userRole: 'candidate' | 'employer' | null
  initialTab?: 'guides' | 'kb' | 'security' | 'ticket'
}) {
  const [activeTab, setActiveTab] = useState<'guides' | 'kb' | 'security' | 'ticket'>(initialTab)
  const [selectedGuide, setSelectedGuide] = useState<'employer' | 'candidate'>(
    userRole === 'employer' ? 'employer' : 'candidate'
  )
  const [copiedGuideId, setCopiedGuideId] = useState<string | null>(null)
  const [copiedSecurity, setCopiedSecurity] = useState(false)

  const [faqRoleFilter, setFaqRoleFilter] = useState<'all' | 'candidate' | 'employer'>(
    userRole === 'employer' ? 'employer' : userRole === 'candidate' ? 'candidate' : 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)
  const [ticketStatus, setTicketStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const currentGuide = PLAYBOOK_GUIDES[selectedGuide]

  const handleCopyGuide = async (guideId: 'employer' | 'candidate') => {
    try {
      await navigator.clipboard.writeText(PLAYBOOK_GUIDES[guideId].copyPasteText)
      setCopiedGuideId(guideId)
      setTimeout(() => setCopiedGuideId(null), 2500)
    } catch {
      // Ignore clipboard error
    }
  }

  const handleCopySecurityBrief = async () => {
    try {
      await navigator.clipboard.writeText(
        SECURITY_ARCHITECTURE_DATA.copyPasteSecurityBrief
      )
      setCopiedSecurity(true)
      setTimeout(() => setCopiedSecurity(false), 2500)
    } catch {
      // Ignore clipboard error
    }
  }

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      if (faqRoleFilter !== 'all' && faq.target !== 'all' && faq.target !== faqRoleFilter) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.category.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [faqs, faqRoleFilter, searchQuery])

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, FAQ[]> = {}
    filteredFaqs.forEach((faq) => {
      if (!groups[faq.category]) groups[faq.category] = []
      groups[faq.category].push(faq)
    })
    return groups
  }, [filteredFaqs])

  const handleTicketSubmit = async (formData: FormData) => {
    setTicketStatus(null)
    const result = await submitSupportTicket(formData)

    if (result.error) {
      setTicketStatus({ type: 'error', message: result.error })
    } else {
      setTicketStatus({
        type: 'success',
        message: `Ticket submitted successfully! Your reference ID is ${result.ticketId}. We've sent a confirmation receipt to your email.`,
      })
      ;(document.getElementById('support-form') as HTMLFormElement)?.reset()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 4-Tab Navigation Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === 'guides'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          1. How It Works & Guides
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kb')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === 'kb'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          2. Searchable FAQs
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          3. Data Security & Stripe
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ticket')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === 'ticket'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          4. Contact Support
        </button>
      </div>

      <div className="p-6 md:p-8">
        {/* =================================================================== */}
        {/* TAB 1: HOW IT WORKS & COPY-PASTE TEAM SHARE GUIDES                  */}
        {/* =================================================================== */}
        {activeTab === 'guides' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Select Playbook View
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  View step-by-step workflows or copy the plain-text cheat sheet to share with your team.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedGuide('employer')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                    selectedGuide === 'employer'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏢 Employer & BPO Guide
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGuide('candidate')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                    selectedGuide === 'candidate'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👤 Candidate Guide
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold">
                {currentGuide.badge}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {currentGuide.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {currentGuide.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentGuide.steps.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 hover:border-indigo-200 transition-colors"
                >
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-black uppercase tracking-wider shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block">
                    Copy-Paste Team Briefing Sheet
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Share this summary in Slack, Microsoft Teams, or Email
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyGuide(currentGuide.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors shrink-0 flex items-center gap-2 ${
                    copiedGuideId === currentGuide.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copiedGuideId === currentGuide.id ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Briefing Sheet
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {currentGuide.copyPasteText}
              </pre>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SEARCHABLE FAQ KNOWLEDGE BASE                                */}
        {/* =================================================================== */}
        {activeTab === 'kb' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search FAQs (e.g. Stripe, BPO seats, hourly pay, credits, verification)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-900 transition-all"
                />
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setFaqRoleFilter('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                    faqRoleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All FAQs
                </button>
                <button
                  type="button"
                  onClick={() => setFaqRoleFilter('employer')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                    faqRoleFilter === 'employer'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Employer FAQs
                </button>
                <button
                  type="button"
                  onClick={() => setFaqRoleFilter('candidate')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                    faqRoleFilter === 'candidate'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Candidate FAQs
                </button>
              </div>
            </div>

            {Object.keys(groupedFaqs).length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-medium">
                No articles found matching &ldquo;{searchQuery}&rdquo;.
                <br />
                <button
                  type="button"
                  onClick={() => setActiveTab('ticket')}
                  className="text-indigo-600 font-bold hover:underline mt-2"
                >
                  Submit a support ticket instead →
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFaqs).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 ml-1">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {items.map((faq) => {
                        const isExpanded = expandedFaqId === faq.id
                        return (
                          <div
                            key={faq.id}
                            className="border border-slate-200 rounded-xl overflow-hidden transition-colors hover:border-indigo-200"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFaqId(isExpanded ? null : faq.id)
                              }
                              className="w-full px-5 py-4 text-left flex items-center justify-between bg-white focus:outline-none"
                            >
                              <span className="font-bold text-slate-800 text-sm pr-4">
                                {faq.question}
                              </span>
                              <svg
                                className={`w-5 h-5 text-indigo-500 shrink-0 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                            {isExpanded && (
                              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100 pt-3">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DATA SECURITY, PRIVACY & STRIPE VAULT ARCHITECTURE           */}
        {/* =================================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Banner */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  PCI-DSS Level 1 & Biometric Isolation via Stripe
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {SECURITY_ARCHITECTURE_DATA.title}
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {SECURITY_ARCHITECTURE_DATA.subtitle}
                </p>
              </div>
            </div>

            {/* 2-Column Data Custody Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Stored Exclusively Inside Stripe */}
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-indigo-200/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black">
                    S
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                      Zero Platform Access • Vaulted by Stripe
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Stored Exclusively in Stripe
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  The following sensitive identity and financial records are captured directly by Stripe’s encrypted infrastructure and are <strong>never stored in Special Sauce databases</strong>:
                </p>

                <div className="space-y-3">
                  {SECURITY_ARCHITECTURE_DATA.stripeVaultItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-1"
                    >
                      <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Stored Inside Special Sauce */}
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-emerald-200/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                      Supabase Row-Level Security (RLS)
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Stored by Special Sauce
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Special Sauce stores only the operational marketplace data required to power blind matching, skill verification, and organization pipelines:
                </p>

                <div className="space-y-3">
                  {SECURITY_ARCHITECTURE_DATA.platformStoredItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-1"
                    >
                      <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Copy-Paste Security & Compliance Brief for IT / Procurement */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">
                    IT & Procurement Security Summary
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Copy-Paste Data Custody & Stripe Security Brief
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCopySecurityBrief}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors shrink-0 flex items-center gap-2 ${
                    copiedSecurity
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copiedSecurity ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied Security Brief!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Security Brief
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {SECURITY_ARCHITECTURE_DATA.copyPasteSecurityBrief}
              </pre>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: TICKET SUBMISSION                                            */}
        {/* =================================================================== */}
        {activeTab === 'ticket' && (
          <div className="animate-in fade-in duration-300 max-w-2xl mx-auto py-2">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Submit a Support Ticket
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Your account ID, role, and organization details are automatically attached to this request.
              </p>
            </div>

            {ticketStatus && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-bold border ${
                  ticketStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {ticketStatus.message}
              </div>
            )}

            <form
              id="support-form"
              action={handleTicketSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
                >
                  <option value="General Support">
                    General Support & Questions
                  </option>
                  <option value="Billing, Credits & Team Seats">
                    Billing, Credits & Team / BPO Seats
                  </option>
                  <option value="Data Security & Privacy">
                    Data Security, Privacy & Stripe Verification
                  </option>
                  <option value="Account & Domain Verification">
                    Identity / Corporate Domain Verification
                  </option>
                  <option value="Technical Issue / Bug Report">
                    Technical Issue / Bug Report
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Brief summary of your question or issue (include SS-XXXXXXXX Ref ID if applicable)..."
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Provide as much detail as possible..."
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3.5 text-sm"
                />
              </div>

              <div className="pt-2">
                <SubmitButton
                  pendingText="Sending to Support..."
                  className="w-full rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-600 transition-colors"
                >
                  Submit Support Ticket
                </SubmitButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}