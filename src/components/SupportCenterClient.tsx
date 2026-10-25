'use client'
import Link from 'next/link'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FAQ,
  PLAYBOOK_GUIDES,
  SECURITY_ARCHITECTURE_DATA,
} from '@/constants/faqs'
import { submitSupportTicket } from '@/app/dashboard/actions'
import {
  fetchMySupportTicketsAction,
  replyToSupportTicketAction,
  submitTicketCsatAction,
} from '@/app/dashboard/support/actions'
import type { UserVisibleTicket } from '@/lib/ops-bridge'
import { SubmitButton } from '@/components/SubmitButton'

function getCustomerStatusMeta(ticket: UserVisibleTicket) {
  if (ticket.state === 'closed' || ticket.status === 'resolved') {
    return {
      label: 'Resolved',
      pillClasses: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    }
  }
  const lastMsg =
    ticket.thread.length > 0 ? ticket.thread[ticket.thread.length - 1] : null
  if (
    ticket.status === 'waiting_customer' ||
    lastMsg?.direction === 'outbound_reply'
  ) {
    return {
      label: 'Waiting on You',
      pillClasses: 'bg-amber-100 text-amber-900 border-amber-400',
      dotColor: 'bg-amber-500',
    }
  }
  if (ticket.status === 'pending_support') {
    return {
      label: 'Pending Support',
      pillClasses: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dotColor: 'bg-indigo-500',
    }
  }
  if (ticket.status === 'in_progress' || ticket.status === 'triaged') {
    return {
      label: 'In Progress',
      pillClasses: 'bg-sky-100 text-sky-800 border-sky-300',
      dotColor: 'bg-sky-500',
    }
  }
  return {
    label: 'Open',
    pillClasses: 'bg-sky-100 text-sky-800 border-sky-300',
    dotColor: 'bg-sky-500',
  }
}

function getPriorityDisplay(priorityRaw?: string) {
  if (priorityRaw === 'P0_Critical') {
    return { label: 'Critical', icon: '⇈', color: 'text-rose-600' }
  }
  if (priorityRaw === 'P1_High') {
    return { label: 'High', icon: '⌃', color: 'text-rose-600' }
  }
  if (priorityRaw === 'P3_Low') {
    return { label: 'Low', icon: '⌄', color: 'text-slate-500' }
  }
  return { label: 'Normal', icon: '⌃', color: 'text-amber-600' }
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatMessageTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function SupportCenterClient({
  faqs,
  userRole,
  userName = 'You',
  userEmail = '',
  initialTab = 'kb',
  initialTickets = [],
  initialSelectedTicketId,
  canUploadAttachments = false,
  initialCsatRating,
}: {
  faqs: FAQ[]
  userRole: 'candidate' | 'employer' | null
  userName?: string
  userEmail?: string
  initialTab?: 'guides' | 'kb' | 'security' | 'ticket'
  initialTickets?: UserVisibleTicket[]
  initialSelectedTicketId?: string
  canUploadAttachments?: boolean
  initialCsatRating?: number
}) {
  const [activeTab, setActiveTab] = useState<
    'guides' | 'kb' | 'security' | 'ticket'
  >(initialTab === 'guides' ? 'kb' : initialTab)
  const [securityVaultTab, setSecurityVaultTab] = useState<'stripe' | 'platform'>('stripe')
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
    initialSelectedTicketId || initialTickets[0]?.id || null
  )
  const [isComposingNewTicket, setIsComposingNewTicket] = useState<boolean>(
    initialTickets.length === 0
  )

  // Right sidebar collapsible sections matching template.webp
  const [openTicketInfo, setOpenTicketInfo] = useState(true)
  const [openAssignment, setOpenAssignment] = useState(true)
  const [openTags, setOpenTags] = useState(true)
  const [openRecentList, setOpenRecentList] = useState(true)

  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [isRefreshingTickets, setIsRefreshingTickets] = useState(false)
  const [replyFeedback, setReplyFeedback] = useState<{
    ticketId: string
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [csatRatingMap, setCsatRatingMap] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {}
      for (const t of initialTickets) {
        if (t.csat_score) init[t.id] = t.csat_score
      }
      if (initialSelectedTicketId && initialCsatRating) {
        init[initialSelectedTicketId] = initialCsatRating
      }
      return init
    }
  )
  const [csatCommentMap, setCsatCommentMap] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {}
      for (const t of initialTickets) {
        if (t.csat_comment) init[t.id] = t.csat_comment
      }
      return init
    }
  )
  const [editingCsatMap, setEditingCsatMap] = useState<Record<string, boolean>>(
    () =>
      initialSelectedTicketId && initialCsatRating
        ? { [initialSelectedTicketId]: true }
        : {}
  )
  const [isSubmittingCsat, setIsSubmittingCsat] = useState(false)

  const switchTab = (nextTab: 'ticket' | 'guides' | 'kb' | 'security') => {
    setActiveTab(nextTab)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', nextTab)
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  const selectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsComposingNewTicket(false)
    setReplyFeedback(null)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', 'ticket')
      url.searchParams.set('ticket', ticketId)
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  const activeTicket = useMemo(() => {
    if (!myTickets.length) return null
    return (
      myTickets.find((t) => t.id === selectedTicketId) || myTickets[0] || null
    )
  }, [myTickets, selectedTicketId])

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

  const handleRefreshTickets = useCallback(async () => {
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
  }, [selectedTicketId])

  useEffect(() => {
    setMyTickets(initialTickets)
  }, [initialTickets])

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const urlTab = params.get('tab')
      const urlTicket = params.get('ticket')
      if (urlTab === 'ticket' || urlTicket) {
        setActiveTab('ticket')
        if (urlTicket) {
          setSelectedTicketId(urlTicket.toUpperCase().trim())
          setIsComposingNewTicket(false)
        }
      }
    } catch {}
    handleRefreshTickets()
  }, [handleRefreshTickets])

  useEffect(() => {
    if (activeTab !== 'ticket') return
    const timer = setInterval(() => {
      fetchMySupportTicketsAction()
        .then((res) => {
          if (res.tickets) setMyTickets(res.tickets)
        })
        .catch(() => {})
    }, 12000)
    return () => clearInterval(timer)
  }, [activeTab])

  const handleTicketSubmit = async (formData: FormData) => {
    setTicketStatus(null)
    const result = await submitSupportTicket(formData)

    if (result.error) {
      setTicketStatus({ type: 'error', message: result.error })
    } else {
      setTicketStatus({
        type: 'success',
        message: `Ticket submitted! Reference ID: ${result.ticketId}. A confirmation receipt has been sent to your email.`,
      })
      ;(document.getElementById('support-form') as HTMLFormElement)?.reset()
      const refreshed = await fetchMySupportTicketsAction()
      if (refreshed.tickets) {
        setMyTickets(refreshed.tickets)
        if (result.ticketId) {
          selectTicket(result.ticketId)
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
          message: 'Reply posted to conversation thread.',
        })
      }
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleSubmitCsat = async (ticketId: string) => {
    const rating = csatRatingMap[ticketId] || 0
    if (rating < 1 || rating > 5) {
      setReplyFeedback({
        ticketId,
        type: 'error',
        message: 'Please select 1 to 5 stars to rate your support experience.',
      })
      return
    }
    setIsSubmittingCsat(true)
    setReplyFeedback(null)

    try {
      const comment = (csatCommentMap[ticketId] || '').trim()
      const res = await submitTicketCsatAction(ticketId, rating, comment)
      if (!res.ok) {
        setReplyFeedback({
          ticketId,
          type: 'error',
          message: res.error || 'Could not submit rating.',
        })
      } else {
        if (res.tickets) {
          setMyTickets(res.tickets)
        }
        setEditingCsatMap((prev) => ({ ...prev, [ticketId]: false }))
        setIsComposingNewTicket(true)
        setTicketStatus({
          type: 'success',
          message: `✓ Thank you! Your ${rating}/5 star rating for #${ticketId} has been saved and your ticket is complete.`,
        })
        try {
          const url = new URL(window.location.href)
          url.searchParams.set('tab', 'ticket')
          url.searchParams.delete('ticket')
          url.searchParams.delete('rate')
          window.history.replaceState({}, '', url.toString())
        } catch {}
      }
    } finally {
      setIsSubmittingCsat(false)
    }
  }

  const userInitial = (userName || userEmail || 'U').charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
      {/* Top Sub-Navigation Tabs (Streamlined 3-Tab Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-700 bg-slate-900">
        <button
          type="button"
          onClick={() => switchTab('kb')}
          className={`py-4 px-5 text-sm sm:text-base font-extrabold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'kb'
              ? 'border-indigo-400 text-white bg-indigo-600/20'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          1. Searchable FAQs &amp; Knowledge Base
        </button>

        <button
          type="button"
          onClick={() => switchTab('security')}
          className={`py-4 px-5 text-sm sm:text-base font-extrabold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-emerald-400 text-white bg-emerald-600/20'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          2. 2-Stage Vault &amp; Stripe Security
        </button>

        <button
          type="button"
          onClick={() => switchTab('ticket')}
          className={`py-4 px-5 text-sm sm:text-base font-extrabold transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'ticket'
              ? 'border-indigo-400 text-white bg-indigo-600/20'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>3. Support &amp; My Tickets</span>
          {myTickets.length > 0 && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                awaitingCustomerCount > 0
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-indigo-500 text-white'
              }`}
            >
              {awaitingCustomerCount > 0
                ? `${awaitingCustomerCount} Reply`
                : myTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SPLIT-PANE HELPDESK WORKSPACE MODELED ON template.webp */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px] divide-y lg:divide-y-0 lg:divide-x divide-slate-300">
          {/* LEFT 8 COLUMNS: CONVERSATION STREAM OR NEW TICKET COMPOSER */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-white">
            {isComposingNewTicket || !activeTicket ? (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                      New Support Conversation
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Open a New Support Ticket
                    </h2>
                  </div>
                  {myTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsComposingNewTicket(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-700 cursor-pointer"
                    >
                      ← Back to Ticket #{activeTicket?.id}
                    </button>
                  )}
                </div>

                {ticketStatus && (
                  <div
                    className={`p-4 rounded-xl text-xs font-bold border ${
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
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Category
                      </label>
                      <select
                        name="category"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2.5 px-3.5 text-sm font-medium"
                      >
                        <option value="General Support">General Support &amp; Questions</option>
                        <option value="2-Stage Vault & Encrypted Messaging">2-Stage Identity Vault &amp; Messaging</option>
                        <option value="Billing, Plans & Pitch Credits">Billing, Plans &amp; Pitch Credits</option>
                        <option value="Account & Domain Verification">Stripe ID / Corporate Domain Verification</option>
                        <option value="Enterprise ATS & Webhook Integration">HR Software Sync Hub</option>
                        <option value="Technical Issue / Bug Report">Technical Issue / Bug Report</option>
                        <option value="Feature Request / Documentation Feedback">Feature Request / Documentation Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Platform Area / Feature
                      </label>
                      <select
                        name="platform_area"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2.5 px-3.5 text-sm font-medium"
                      >
                        <option value="Onboarding & Authentication">Onboarding &amp; Authentication</option>
                        <option value="Stripe Identity Verification (Candidate)">Stripe Identity Verification (Candidate)</option>
                        <option value="Corporate Domain / DNS Verification (Employer)">Corporate Domain / DNS Verification (Employer)</option>
                        <option value="2-Stage Resume & Contact Vault">2-Stage Resume &amp; Contact Vault</option>
                        <option value="5-Point AI Fit Radar & Dealbreakers">5-Point AI Fit Radar &amp; Dealbreakers</option>
                        <option value="Billing, Subscriptions & Credits">Billing, Subscriptions &amp; Credits</option>
                        <option value="HR Software Sync Hub">HR Software Sync Hub</option>
                        <option value="Encrypted Stage 1/2 Messaging">Encrypted Stage 1/2 Messaging</option>
                        <option value="Other / General Platform">Other / General Platform</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        placeholder="Brief summary of your question or issue..."
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2.5 px-3.5 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Ref ID <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="related_ref_id"
                        placeholder="e.g. SS-8F92A1B0"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2.5 px-3.5 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                      Message &amp; Steps to Reproduce
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="Provide as much detail as possible so our support team can assist you..."
                      className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-3 px-3.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                      Screenshots or File Attachments <span className="text-slate-400 font-normal">(Optional • Up to 3 files)</span>
                    </label>
                    {canUploadAttachments ? (
                      <input
                        type="file"
                        name="attachments"
                        multiple
                        accept="image/png,image/jpeg,image/webp,application/pdf,.txt"
                        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-700 py-2.5 px-3.5 text-xs font-medium file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 flex items-start gap-2.5">
                        <span className="text-sm leading-none mt-0.5">🔒</span>
                        <div>
                          <span className="font-extrabold text-amber-300 block mb-0.5">
                            File Attachments Locked (Paid &amp; ID-Verified Subscribers Only)
                          </span>
                          <span className="text-slate-300 leading-relaxed">
                            For platform security, file and screenshot uploads are restricted to ID-verified accounts on an active paid plan. You may still submit a plain-text support request below.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <SubmitButton
                      pendingText="Submitting Ticket..."
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm transition-colors cursor-pointer"
                    >
                      Submit Support Ticket →
                    </SubmitButton>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* CONVERSATION PANE HEADER (Modeled on "SSO Setup for New Workspace #78901") */}
                <div className="px-6 py-4 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                      {activeTicket.subject}{' '}
                      <span className="text-slate-400 font-mono font-bold">
                        #{activeTicket.id}
                      </span>
                    </h2>
                    {(() => {
                      const st = getCustomerStatusMeta(activeTicket)
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.pillClasses}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`}
                          />
                          {st.label}
                        </span>
                      )
                    })()}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRefreshTickets}
                      disabled={isRefreshingTickets}
                      title="Refresh Conversation"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {isRefreshingTickets ? '↻...' : '↻ Refresh'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsComposingNewTicket(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer shadow-2xs"
                    >
                      + New Ticket
                    </button>
                  </div>
                </div>

                {/* MESSAGE BUBBLES STREAM */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[540px]">
                  {/* Prominent Resolved + CSAT Banner at Top of Stream when Ticket is Resolved */}
                  {(activeTicket.state === 'closed' ||
                    activeTicket.status === 'resolved' ||
                    editingCsatMap[activeTicket.id]) && (
                    <div className="p-5 rounded-2xl bg-slate-50 border-2 border-emerald-500/50 space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                            ✓ Resolved &amp; Closed
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                            This support ticket has been marked as resolved. How was your support experience?
                          </h4>
                        </div>
                        {activeTicket.csat_score &&
                          !editingCsatMap[activeTicket.id] && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCsatMap((prev) => ({
                                  ...prev,
                                  [activeTicket.id]: true,
                                }))
                              }
                              className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Update Rating
                            </button>
                          )}
                      </div>

                      {activeTicket.csat_score &&
                      !editingCsatMap[activeTicket.id] ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-base text-amber-500 tracking-wider">
                            {'★'.repeat(activeTicket.csat_score)}
                            <span className="text-slate-400">
                              {'★'.repeat(5 - activeTicket.csat_score)}
                            </span>
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {activeTicket.csat_score}/5 Stars Submitted
                          </span>
                          {activeTicket.csat_comment && (
                            <span className="text-slate-600 italic">
                              — &ldquo;{activeTicket.csat_comment}&rdquo;
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const selectedScore =
                                csatRatingMap[activeTicket.id] ??
                                activeTicket.csat_score ??
                                0
                              const active = star <= selectedScore
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setCsatRatingMap((prev) => ({
                                      ...prev,
                                      [activeTicket.id]: star,
                                    }))
                                  }
                                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                    active
                                      ? 'bg-amber-400 border-amber-500 text-slate-950'
                                      : 'bg-white border-slate-300 text-slate-600 hover:border-amber-400'
                                  }`}
                                >
                                  <span>★</span>
                                  <span>{star}</span>
                                </button>
                              )
                            })}
                          </div>
                          <textarea
                            rows={2}
                            value={
                              csatCommentMap[activeTicket.id] ??
                              activeTicket.csat_comment ??
                              ''
                            }
                            onChange={(e) =>
                              setCsatCommentMap((prev) => ({
                                ...prev,
                                [activeTicket.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional: Add a comment about your support experience..."
                            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={
                                isSubmittingCsat ||
                                (csatRatingMap[activeTicket.id] ??
                                  activeTicket.csat_score ??
                                  0) < 1
                              }
                              onClick={() => handleSubmitCsat(activeTicket.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingCsat
                                ? 'Saving...'
                                : 'Submit Rating & Complete Ticket ★'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Initial Customer Request Bubble (Left-aligned like Jordan Lee) */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {userInitial}
                    </div>
                    <div className="space-y-1.5 max-w-[82%]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">
                          {activeTicket.reporter_name || userName}
                        </span>
                        <span className="text-slate-400">
                          {formatMessageTime(activeTicket.created_at)}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300/80 text-sm text-slate-800 space-y-2">
                        <div className="text-xs text-slate-500 space-y-0.5 pb-1.5 border-b border-slate-300/60">
                          <div>
                            From: {activeTicket.reporter_email || userEmail}
                          </div>
                          <div>Reply to: support@specialsauce.io</div>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {activeTicket.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subsequent Thread Messages */}
                  {activeTicket.thread.map((msg) => {
                    const isSupport = msg.direction === 'outbound_reply'
                    if (isSupport) {
                      // Right-aligned Support Agent Bubble (like Mark Benson in template.webp)
                      return (
                        <div
                          key={msg.id}
                          className="flex items-start justify-end gap-3.5"
                        >
                          <div className="space-y-1.5 max-w-[82%] flex flex-col items-end">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-900">
                                {msg.author || 'Special Sauce Support'}
                              </span>
                              <span className="text-slate-400">
                                {formatMessageTime(msg.created_at)}
                              </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                            SS
                          </div>
                        </div>
                      )
                    }

                    // Left-aligned Customer Follow-up Bubble
                    return (
                      <div key={msg.id} className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {userInitial}
                        </div>
                        <div className="space-y-1.5 max-w-[82%]">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-900">
                              {activeTicket.reporter_name || userName}
                            </span>
                            <span className="text-slate-400">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* CSAT Rating Card (Shows when ticket is resolved/closed or when user clicks Rate in sidebar) */}
                  {(activeTicket.state === 'closed' ||
                    activeTicket.status === 'resolved' ||
                    editingCsatMap[activeTicket.id]) && (
                    <div className="p-5 rounded-2xl bg-slate-50 border-2 border-emerald-500/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                            ✓ Ticket Resolved
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                            Rate your support experience on #{activeTicket.id}
                          </h4>
                        </div>
                        {activeTicket.csat_score &&
                          !editingCsatMap[activeTicket.id] && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCsatMap((prev) => ({
                                  ...prev,
                                  [activeTicket.id]: true,
                                }))
                              }
                              className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Update Rating
                            </button>
                          )}
                      </div>

                      {activeTicket.csat_score &&
                      !editingCsatMap[activeTicket.id] ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-base text-amber-500 tracking-wider">
                            {'★'.repeat(activeTicket.csat_score)}
                            <span className="text-slate-400">
                              {'★'.repeat(5 - activeTicket.csat_score)}
                            </span>
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {activeTicket.csat_score}/5 Stars Submitted
                          </span>
                          {activeTicket.csat_comment && (
                            <span className="text-slate-600 italic">
                              — &ldquo;{activeTicket.csat_comment}&rdquo;
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const selectedScore =
                                csatRatingMap[activeTicket.id] ??
                                activeTicket.csat_score ??
                                0
                              const active = star <= selectedScore
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setCsatRatingMap((prev) => ({
                                      ...prev,
                                      [activeTicket.id]: star,
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                    active
                                      ? 'bg-amber-400 border-amber-500 text-slate-950'
                                      : 'bg-white border-slate-300 text-slate-600 hover:border-amber-400'
                                  }`}
                                >
                                  <span>★</span>
                                  <span>{star}</span>
                                </button>
                              )
                            })}
                          </div>
                          <textarea
                            rows={2}
                            value={
                              csatCommentMap[activeTicket.id] ??
                              activeTicket.csat_comment ??
                              ''
                            }
                            onChange={(e) =>
                              setCsatCommentMap((prev) => ({
                                ...prev,
                                [activeTicket.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional: Add a comment about your support experience..."
                            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={
                                isSubmittingCsat ||
                                (csatRatingMap[activeTicket.id] ??
                                  activeTicket.csat_score ??
                                  0) < 1
                              }
                              onClick={() => handleSubmitCsat(activeTicket.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingCsat
                                ? 'Saving...'
                                : 'Submit Rating ★'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DOCKED BOTTOM COMPOSER (Modeled on template.webp bottom bar) */}
                <div className="p-4 sm:p-5 border-t border-slate-300 bg-slate-50/60 space-y-2.5">
                  {replyFeedback &&
                    replyFeedback.ticketId === activeTicket.id && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold border ${
                          replyFeedback.type === 'error'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {replyFeedback.message}
                      </div>
                    )}

                  <div className="rounded-2xl border border-slate-300 bg-white p-3.5 space-y-2.5 shadow-2xs">
                    <div className="text-[11px] text-slate-400 font-medium flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <span>
                        To: support@specialsauce.io • From:{' '}
                        {activeTicket.reporter_email || userEmail}
                      </span>
                      <span className="font-mono">
                        Subject: [{activeTicket.id}] Re: {activeTicket.subject}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={replyTextMap[activeTicket.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({
                          ...prev,
                          [activeTicket.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        activeTicket.state === 'closed' ||
                        activeTicket.status === 'resolved'
                          ? `Reply to reopen #${activeTicket.id}...`
                          : `Write a message to Special Sauce Support...`
                      }
                      className="w-full text-sm text-slate-900 bg-transparent focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCsatMap((prev) => ({
                            ...prev,
                            [activeTicket.id]: !prev[activeTicket.id],
                          }))
                        }
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        ★ Rate Support Experience
                      </button>
                      <button
                        type="button"
                        disabled={
                          isSendingReply ||
                          !(replyTextMap[activeTicket.id] || '').trim()
                        }
                        onClick={() => handleSendInAppReply(activeTicket.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSendingReply ? 'Sending...' : 'Send Reply →'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT 4 COLUMNS: STRUCTURED INSPECTOR SIDEBAR (Modeled on template.webp) */}
          <div className="lg:col-span-4 bg-slate-50/40 divide-y divide-slate-300">
            {/* Reporter Identity Header */}
            <div className="p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-black shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {activeTicket?.reporter_name || userName}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="truncate">
                      {userEmail || 'Online now'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Ticket info */}
            {activeTicket && (
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenTicketInfo((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-extrabold text-slate-900">
                    Ticket info
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {openTicketInfo ? '⌃' : '⌄'}
                  </span>
                </button>

                {openTicketInfo && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Ticket ID</span>
                      <span className="font-mono font-bold text-slate-900">
                        {activeTicket.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Creation date</span>
                      <span className="font-medium text-slate-800">
                        {formatShortDate(activeTicket.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Last message</span>
                      <span className="font-medium text-slate-800">
                        {formatShortDate(activeTicket.updated_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Status</span>
                      <div>
                        {(() => {
                          const st = getCustomerStatusMeta(activeTicket)
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.pillClasses}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`}
                              />
                              {st.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Priority</span>
                      <div>
                        {(() => {
                          const pr = getPriorityDisplay(activeTicket.priority)
                          return (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                              <span className={`font-black ${pr.color}`}>
                                {pr.icon}
                              </span>
                              {pr.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Source</span>
                      <span className="font-medium text-slate-800">
                        Support Portal
                      </span>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Rating</span>
                      <div>
                        {activeTicket.csat_score ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCsatMap((prev) => ({
                                ...prev,
                                [activeTicket.id]: true,
                              }))
                            }
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            <span>😊</span>
                            <span>
                              {activeTicket.csat_score >= 4
                                ? 'Good'
                                : activeTicket.csat_score === 3
                                ? 'Neutral'
                                : 'Rated'}{' '}
                              ({activeTicket.csat_score}/5 ★)
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCsatMap((prev) => ({
                                ...prev,
                                [activeTicket.id]: true,
                              }))
                            }
                            className="text-indigo-600 font-bold hover:underline cursor-pointer"
                          >
                            + Rate experience
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Assignment */}
            {activeTicket && (
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenAssignment((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-extrabold text-slate-900">
                    Assignment
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {openAssignment ? '⌃' : '⌄'}
                  </span>
                </button>

                {openAssignment && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Team</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="w-4 h-4 rounded bg-indigo-600 text-white text-[10px] font-black inline-flex items-center justify-center">
                          S
                        </span>
                        Support
                      </span>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-slate-500">Teammate</span>
                      <span className="font-medium text-slate-800 truncate">
                        {activeTicket.owned_by &&
                        activeTicket.owned_by !== 'Unassigned'
                          ? activeTicket.owned_by.replace(/\s*\(.*\)/, '')
                          : 'Special Sauce Support'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Ticket tags */}
            {activeTicket && (
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenTags((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-extrabold text-slate-900">
                    Ticket tags
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {openTags ? '⌃' : '⌄'}
                  </span>
                </button>

                {openTags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 border border-slate-300 text-[11px] font-semibold text-slate-700">
                      {activeTicket.category
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 border border-slate-300 text-[11px] font-semibold text-slate-700">
                      {activeTicket.platform_area
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')}
                    </span>
                    {activeTicket.related_ref_id && (
                      <span className="px-2.5 py-1 rounded-lg border border-dashed border-slate-400 text-[11px] font-mono font-semibold text-slate-600">
                        {activeTicket.related_ref_id}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Recent conversations (Ticket Switcher) */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOpenRecentList((prev) => !prev)}
                  className="flex items-center gap-2 text-left cursor-pointer"
                >
                  <span className="text-xs font-extrabold text-slate-900">
                    Recent conversations ({myTickets.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposingNewTicket(true)}
                  className="text-[11px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                >
                  + New
                </button>
              </div>

              {openRecentList && (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {myTickets.map((t) => {
                    const isSelected =
                      !isComposingNewTicket && activeTicket?.id === t.id
                    const st = getCustomerStatusMeta(t)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTicket(t.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs'
                            : 'bg-white border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${st.dotColor}`}
                            />
                            <span className="font-mono text-[11px] font-black text-slate-900">
                              #{t.id}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatShortDate(t.updated_at)}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                            {t.subject}
                          </div>
                        </div>
                        {t.csat_score && (
                          <span className="text-[10px] font-black text-amber-600 shrink-0">
                            {t.csat_score}★
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SEARCHABLE FAQS & KNOWLEDGE BASE */}
      {activeTab === 'kb' && (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
          {/* Top Shortcut Banner to /workflows + 1-Click Copy Team Brief */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block">
                Looking for the Step-by-Step Visual Walkthrough?
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Explore the Interactive 5-Step Candidate &amp; Employer Workflows
              </h3>
              <p className="text-sm sm:text-base text-slate-200">
                Our full visual walkthrough is available anytime on the public Platform Workflows page—or copy a plain-text team briefing sheet below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyGuide(userRole === 'employer' ? 'employer' : 'candidate')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer border ${
                  copiedGuideId
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600'
                }`}
              >
                {copiedGuideId ? '✓ Copied Quick-Start Brief!' : '📋 Copy Quick-Start Brief'}
              </button>
              <Link
                href="/workflows"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold transition-colors"
              >
                View Platform Workflows →
              </Link>
            </div>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search FAQs (e.g. 2-Stage Vault, 30-day expiry, shortlist, W-2 vs 1099, Stripe)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-600 bg-slate-900 focus:border-indigo-400 text-base font-medium text-white placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-900 p-1.5 border border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setFaqRoleFilter('all')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                  faqRoleFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All FAQs
              </button>
              <button
                type="button"
                onClick={() => setFaqRoleFilter('employer')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                  faqRoleFilter === 'employer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Employer FAQs
              </button>
              <button
                type="button"
                onClick={() => setFaqRoleFilter('candidate')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                  faqRoleFilter === 'candidate'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Candidate FAQs
              </button>
            </div>
          </div>

          {Object.keys(groupedFaqs).length === 0 ? (
            <div className="text-center py-12 text-slate-200 text-base font-medium">
              No articles found matching &ldquo;{searchQuery}&rdquo;.
              <br />
              <button
                type="button"
                onClick={() => {
                  switchTab('ticket')
                  setIsComposingNewTicket(true)
                }}
                className="text-indigo-400 font-bold hover:underline mt-2 cursor-pointer"
              >
                Submit a support ticket instead →
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFaqs).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-400 ml-1">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {items.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id
                      return (
                        <div
                          key={faq.id}
                          className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedFaqId(isExpanded ? null : faq.id)
                            }
                            className="w-full px-6 py-4 text-left flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 focus:outline-none cursor-pointer"
                          >
                            <span className="font-extrabold text-white text-base sm:text-lg pr-4">
                              {faq.question}
                            </span>
                            <span className="text-indigo-400 font-extrabold text-xs sm:text-sm shrink-0">
                              {isExpanded ? 'Hide ▲' : 'View ▼'}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-6 pb-5 text-base text-slate-100 leading-relaxed bg-slate-950 border-t border-slate-800 pt-4">
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

      {/* TAB 4: 2-STAGE VAULT & STRIPE */}
      {activeTab === 'security' && (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700 shadow-lg">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                PCI-DSS Level 1 • Stripe ID Protection • 2-Stage Anti-Harvesting Vault
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {SECURITY_ARCHITECTURE_DATA.title}
              </h2>
              <p className="text-base sm:text-lg text-slate-100 max-w-3xl leading-relaxed">
                {SECURITY_ARCHITECTURE_DATA.subtitle}
              </p>
            </div>
          </div>

          {/* Interactive Segmented Toggle: Stripe Vault (S) vs Special Sauce Vault (SS) */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSecurityVaultTab('stripe')}
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base sm:text-lg font-extrabold transition-all cursor-pointer ${
                  securityVaultTab === 'stripe'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-black">
                  S
                </span>
                <span>Stored Exclusively in Stripe (3 Pillars)</span>
              </button>

              <button
                type="button"
                onClick={() => setSecurityVaultTab('platform')}
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base sm:text-lg font-extrabold transition-all cursor-pointer ${
                  securityVaultTab === 'platform'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-black">
                  SS
                </span>
                <span>Protected by Special Sauce (4 Pillars)</span>
              </button>
            </div>
          </div>

          {/* Active Vault Section */}
          {securityVaultTab === 'stripe' ? (
            <div className="rounded-2xl border-2 border-indigo-500/60 bg-slate-950 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-xl shadow-md">
                  S
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-400 block">
                    Zero Platform Access • Vaulted by Stripe
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    Stored Exclusively in Stripe
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SECURITY_ARCHITECTURE_DATA.stripeVaultItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-md space-y-3"
                  >
                    <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                      Stripe Vault Pillar {i + 1}
                    </div>
                    <h4 className="text-xl font-extrabold text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-base text-slate-100 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-emerald-500/60 bg-slate-950 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-xl shadow-md">
                  SS
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Row-Level Security (RLS) &amp; 2-Stage Identity Vault
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    Protected by Special Sauce
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECURITY_ARCHITECTURE_DATA.platformStoredItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-md space-y-3"
                  >
                    <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                      Special Sauce Pillar {i + 1}
                    </div>
                    <h4 className="text-xl font-extrabold text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-base text-slate-100 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400 block">
                  IT &amp; Procurement Security Summary
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  Copy-Paste Data Custody, 2-Stage Vault &amp; Stripe Brief
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCopySecurityBrief}
                className={`px-5 py-3 rounded-xl text-sm font-extrabold transition-colors shrink-0 cursor-pointer ${
                  copiedSecurity
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {copiedSecurity ? 'Copied Security Brief!' : 'Copy Security Brief'}
              </button>
            </div>

            <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-5 rounded-xl border border-slate-800 overflow-x-auto">
              {SECURITY_ARCHITECTURE_DATA.copyPasteSecurityBrief}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
