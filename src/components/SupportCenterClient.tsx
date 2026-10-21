'use client'

import { useState, useMemo } from 'react'
import {
  FAQ,
  PLAYBOOK_GUIDES,
  SECURITY_ARCHITECTURE_DATA,
} from '@/constants/faqs'
import { submitSupportTicket } from '@/app/dashboard/actions'
import {
  fetchMySupportTicketsAction,
  replyToSupportTicketAction,
} from '@/app/dashboard/support/actions'
import type { UserVisibleTicket } from '@/lib/ops-bridge'
import { SubmitButton } from '@/components/SubmitButton'

function getCustomerStatusBadge(ticket: UserVisibleTicket) {
  if (ticket.state === 'closed' || ticket.status === 'resolved') {
    return {
      label: 'Resolved / Closed',
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    }
  }
  const lastMsg =
    ticket.thread.length > 0 ? ticket.thread[ticket.thread.length - 1] : null
  if (
    ticket.status === 'waiting_customer' ||
    lastMsg?.direction === 'outbound_reply'
  ) {
    return {
      label: '⚡ Support Replied • Waiting on You',
      classes: 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse',
    }
  }
  if (ticket.status === 'pending_support') {
    return {
      label: 'Pending Support Review',
      classes: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    }
  }
  if (ticket.status === 'in_progress' || ticket.status === 'triaged') {
    return {
      label: 'In Progress',
      classes: 'bg-sky-100 text-sky-800 border-sky-300',
    }
  }
  return {
    label: 'Open • Submitted',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
  }
}

export default function SupportCenterClient({
  faqs,
  userRole,
  initialTab = 'guides',
  initialTickets = [],
}: {
  faqs: FAQ[]
  userRole: 'candidate' | 'employer' | null
  initialTab?: 'guides' | 'kb' | 'security' | 'ticket'
  initialTickets?: UserVisibleTicket[]
}) {
  const [activeTab, setActiveTab] = useState<
    'guides' | 'kb' | 'security' | 'ticket'
  >(initialTab)
  const [selectedGuide, setSelectedGuide] = useState<'employer' | 'candidate'>(
    userRole === 'employer' ? 'employer' : 'candidate'
  )
  const [copiedGuideId, setCopiedGuideId] = useState<string | null>(null)
  const [copiedSecurity, setCopiedSecurity] = useState(false)

  const [faqRoleFilter, setFaqRoleFilter] = useState<
    'all' | 'candidate' | 'employer'
  >(
    userRole === 'employer'
      ? 'employer'
      : userRole === 'candidate'
      ? 'candidate'
      : 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)
  const [ticketStatus, setTicketStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [myTickets, setMyTickets] = useState<UserVisibleTicket[]>(initialTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id || null
  )
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [isRefreshingTickets, setIsRefreshingTickets] = useState(false)
  const [replyFeedback, setReplyFeedback] = useState<{
    ticketId: string
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const awaitingCustomerCount = useMemo(() => {
    return myTickets.filter((t) => {
      if (t.state === 'closed' || t.status === 'resolved') return false
      const lastMsg = t.thread.length > 0 ? t.thread[t.thread.length - 1] : null
      return (
        t.status === 'waiting_customer' ||
        lastMsg?.direction === 'outbound_reply'
      )
    }).length
  }, [myTickets])

  const currentGuide = PLAYBOOK_GUIDES[selectedGuide]

  const handleCopyGuide = async (guideId: 'employer' | 'candidate') => {
    try {
      await navigator.clipboard.writeText(PLAYBOOK_GUIDES[guideId].copyPasteText)
      setCopiedGuideId(guideId)
      setTimeout(() => setCopiedGuideId(null), 2500)
    } catch {}
  }

  const handleCopySecurityBrief = async () => {
    try {
      await navigator.clipboard.writeText(
        SECURITY_ARCHITECTURE_DATA.copyPasteSecurityBrief
      )
      setCopiedSecurity(true)
      setTimeout(() => setCopiedSecurity(false), 2500)
    } catch {}
  }

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      if (
        faqRoleFilter !== 'all' &&
        faq.target !== 'all' &&
        faq.target !== faqRoleFilter
      ) {
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

  const handleRefreshTickets = async () => {
    setIsRefreshingTickets(true)
    try {
      const res = await fetchMySupportTicketsAction()
      if (res.tickets) {
        setMyTickets(res.tickets)
        if (!selectedTicketId && res.tickets.length > 0) {
          setSelectedTicketId(res.tickets[0].id)
        }
      }
    } finally {
      setIsRefreshingTickets(false)
    }
  }

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
      const refreshed = await fetchMySupportTicketsAction()
      if (refreshed.tickets) {
        setMyTickets(refreshed.tickets)
        if (result.ticketId) {
          setSelectedTicketId(result.ticketId)
        }
      }
    }
  }

  const handleSendInAppReply = async (ticketId: string) => {
    const text = (replyTextMap[ticketId] || '').trim()
    if (!text) return
    setIsSendingReply(true)
    setReplyFeedback(null)

    try {
      const res = await replyToSupportTicketAction(ticketId, text)
      if (!res.ok) {
        setReplyFeedback({
          ticketId,
          type: 'error',
          message: res.error || 'Failed to send reply.',
        })
      } else {
        if (res.tickets) {
          setMyTickets(res.tickets)
        }
        setReplyTextMap((prev) => ({ ...prev, [ticketId]: '' }))
        setReplyFeedback({
          ticketId,
          type: 'success',
          message:
            'Reply posted to ticket thread! Our support team has been notified (Status: Pending Support).',
        })
      }
    } finally {
      setIsSendingReply(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-slate-300">
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'guides'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          1. How It Works &amp; Guides
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kb')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 cursor-pointer ${
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
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          3. 2-Stage Vault &amp; Stripe
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ticket')}
          className={`py-4 px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'ticket'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>4. Support &amp; My Tickets</span>
          {myTickets.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                awaitingCustomerCount > 0
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {awaitingCustomerCount > 0
                ? `${awaitingCustomerCount} Reply`
                : myTickets.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'guides' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-300">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Select Playbook View
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  View step-by-step workflows (including the 2-Stage Identity Vault &amp; 30-Day Freshness rules) or copy the plain-text cheat sheet.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-white p-1 border-2 border-slate-300 shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedGuide('employer')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    selectedGuide === 'employer'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏢 Employer &amp; BPO Guide
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGuide('candidate')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs font-extrabold">
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
                  className="p-5 rounded-xl bg-white border-2 border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 transition-colors"
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors shrink-0 flex items-center gap-2 cursor-pointer ${
                    copiedGuideId === currentGuide.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copiedGuideId === currentGuide.id
                    ? 'Copied to Clipboard!'
                    : 'Copy Briefing Sheet'}
                </button>
              </div>

              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {currentGuide.copyPasteText}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'kb' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search FAQs (e.g. 2-Stage Vault, 30-day expiry, shortlist, W-2 vs 1099, Stripe)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 text-sm font-medium text-slate-900 transition-all"
                />
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 border-2 border-slate-300 shrink-0">
                <button
                  type="button"
                  onClick={() => setFaqRoleFilter('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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
                            className="border-2 border-slate-300 rounded-xl overflow-hidden transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFaqId(isExpanded ? null : faq.id)
                              }
                              className="w-full px-5 py-4 text-left flex items-center justify-between bg-white focus:outline-none cursor-pointer"
                            >
                              <span className="font-bold text-slate-800 text-sm pr-4">
                                {faq.question}
                              </span>
                              <span className="text-indigo-600 font-extrabold text-xs">
                                {isExpanded ? 'Hide' : 'View'}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-300 pt-3">
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

        {activeTab === 'security' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-slate-300/30 text-emerald-300 text-xs font-extrabold">
                  PCI-DSS Level 1 • Biometric Isolation • 2-Stage Anti-Harvesting Vault
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {SECURITY_ARCHITECTURE_DATA.title}
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {SECURITY_ARCHITECTURE_DATA.subtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-indigo-300/80 pb-4">
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
                <div className="space-y-3">
                  {SECURITY_ARCHITECTURE_DATA.stripeVaultItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-indigo-300 shadow-sm space-y-1"
                    >
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-emerald-300/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black">
                    SS
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                      Row-Level Security (RLS) &amp; 2-Stage Identity Vault
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Protected by Special Sauce
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {SECURITY_ARCHITECTURE_DATA.platformStoredItems.map(
                    (item, i) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-emerald-300 shadow-sm space-y-1"
                      >
                        <div className="text-sm font-extrabold text-slate-900">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">
                    IT &amp; Procurement Security Summary
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Copy-Paste Data Custody, 2-Stage Vault &amp; Stripe Brief
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCopySecurityBrief}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors shrink-0 cursor-pointer ${
                    copiedSecurity
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copiedSecurity ? 'Copied Security Brief!' : 'Copy Security Brief'}
                </button>
              </div>

              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {SECURITY_ARCHITECTURE_DATA.copyPasteSecurityBrief}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'ticket' && (
          <div className="animate-in fade-in duration-300 space-y-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 block">
                    In-App Support Inbox
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    My Support Tickets &amp; Conversation Threads ({myTickets.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshTickets}
                  disabled={isRefreshingTickets}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {isRefreshingTickets ? 'Refreshing...' : '↻ Refresh Threads'}
                </button>
              </div>

              {myTickets.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  You don&apos;t have any support or feedback tickets yet. Use the form below to submit a new request.
                </div>
              ) : (
                <div className="space-y-4">
                  {myTickets.map((ticket) => {
                    const isOpenThread = selectedTicketId === ticket.id
                    const badge = getCustomerStatusBadge(ticket)
                    const replyDraft = replyTextMap[ticket.id] || ''

                    return (
                      <div
                        key={ticket.id}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          isOpenThread
                            ? 'border-indigo-500 bg-white shadow-md'
                            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTicketId(isOpenThread ? null : ticket.id)
                          }
                          className="w-full p-4 sm:p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                                {ticket.id}
                              </span>
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${badge.classes}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                Updated{' '}
                                {new Date(ticket.updated_at).toLocaleString()}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {ticket.subject}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-indigo-600">
                              {isOpenThread
                                ? 'Hide Thread ▲'
                                : `View Thread (${ticket.thread.length + 1}) ▼`}
                            </span>
                          </div>
                        </button>

                        {isOpenThread && (
                          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50/50 space-y-5">
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                                  <span className="font-extrabold text-slate-800">
                                    You • Original Request ({ticket.category})
                                  </span>
                                  <span>
                                    {new Date(
                                      ticket.created_at
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {ticket.description}
                                </p>
                              </div>

                              {ticket.thread.map((msg) => {
                                const isSupport =
                                  msg.direction === 'outbound_reply'
                                return (
                                  <div
                                    key={msg.id}
                                    className={`p-4 rounded-xl border ${
                                      isSupport
                                        ? 'bg-indigo-50/80 border-indigo-200 ml-0 sm:mr-6'
                                        : 'bg-emerald-50/70 border-emerald-200 ml-0 sm:ml-6'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                      <span
                                        className={`font-extrabold ${
                                          isSupport
                                            ? 'text-indigo-900'
                                            : 'text-emerald-900'
                                        }`}
                                      >
                                        {isSupport
                                          ? '🛡️ Special Sauce Support Desk'
                                          : '👤 Your Reply'}
                                      </span>
                                      <span className="text-slate-500">
                                        {new Date(
                                          msg.created_at
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                      {msg.text}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>

                            {replyFeedback &&
                              replyFeedback.ticketId === ticket.id && (
                                <div
                                  className={`p-3.5 rounded-xl text-xs font-bold border ${
                                    replyFeedback.type === 'error'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {replyFeedback.message}
                                </div>
                              )}

                            <div className="bg-white p-4 rounded-xl border border-slate-300 space-y-3">
                              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                                Reply to Ticket {ticket.id}
                              </label>
                              <textarea
                                rows={3}
                                value={replyDraft}
                                onChange={(e) =>
                                  setReplyTextMap((prev) => ({
                                    ...prev,
                                    [ticket.id]: e.target.value,
                                  }))
                                }
                                placeholder={`Type a reply for ${ticket.id}... (Submitting will reopen/mark this ticket Pending Support)`}
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                              />
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-500">
                                  You can reply right here or reply via email with{' '}
                                  <strong className="font-mono">
                                    [{ticket.id}]
                                  </strong>{' '}
                                  in the subject.
                                </span>
                                <button
                                  type="button"
                                  disabled={
                                    isSendingReply || !replyDraft.trim()
                                  }
                                  onClick={() =>
                                    handleSendInAppReply(ticket.id)
                                  }
                                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isSendingReply
                                    ? 'Sending Reply...'
                                    : 'Send Reply to Support →'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto pt-6 border-t-2 border-slate-200">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Open a New Support Ticket
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Your account ID, role, and organization details are automatically attached to this request.
                </p>
              </div>

              {ticketStatus && (
                <div
                  className={`mb-6 p-4 rounded-xl text-sm font-bold border ${
                    ticketStatus.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
                    >
                      <option value="General Support">General Support &amp; Questions</option>
                      <option value="2-Stage Vault & Encrypted Messaging">2-Stage Identity Vault &amp; Messaging</option>
                      <option value="Billing, Plans & Pitch Credits">Billing, Plans &amp; Pitch Credits</option>
                      <option value="Account & Domain Verification">Stripe ID / Corporate Domain Verification</option>
                      <option value="Enterprise ATS & Webhook Integration">Enterprise ATS &amp; Webhook Hub</option>
                      <option value="Technical Issue / Bug Report">Technical Issue / Bug Report</option>
                      <option value="Feature Request / Documentation Feedback">Feature Request / Documentation Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Platform Area / Feature
                    </label>
                    <select
                      name="platform_area"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
                    >
                      <option value="Onboarding & Authentication">Onboarding &amp; Authentication</option>
                      <option value="Stripe Identity Verification (Candidate)">Stripe Identity Verification (Candidate)</option>
                      <option value="Corporate Domain / DNS Verification (Employer)">Corporate Domain / DNS Verification (Employer)</option>
                      <option value="2-Stage Resume & Contact Vault">2-Stage Resume &amp; Contact Vault</option>
                      <option value="5-Point AI Fit Radar & Dealbreakers">5-Point AI Fit Radar &amp; Dealbreakers</option>
                      <option value="Billing, Subscriptions & Credits">Billing, Subscriptions &amp; Credits</option>
                      <option value="Enterprise ATS & Webhook Hub">Enterprise ATS &amp; Webhook Hub</option>
                      <option value="Encrypted Stage 1/2 Messaging">Encrypted Stage 1/2 Messaging</option>
                      <option value="Other / General Platform">Other / General Platform</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="Brief summary of your question or issue..."
                      className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Ref ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="related_ref_id"
                      placeholder="e.g. SS-8F92A1B0"
                      className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Message &amp; Steps to Reproduce
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Provide as much detail as possible so our team can assist you quickly..."
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Screenshots or File Attachments <span className="text-slate-400 font-normal">(Optional • Up to 3 files, PNG/JPG/PDF/TXT)</span>
                  </label>
                  <input
                    type="file"
                    name="attachments"
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.log,.json"
                    className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-700 py-2.5 px-3.5 text-xs font-medium file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <SubmitButton
                    pendingText="Uploading & Sending to Support..."
                    className="w-full rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    Submit Support Ticket
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
