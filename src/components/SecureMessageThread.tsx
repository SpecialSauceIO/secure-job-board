'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  sendApplicationMessage,
  releaseCandidateVaultToEmployer,
  getVaultReleasedResumeUrl,
  getApplicationThreadState,
  ThreadMessage,
} from '@/app/dashboard/messaging-actions'

// Synthesize a clean, pleasant 2-note harmonic chime using the browser's native Web Audio API
function playIncomingMessageChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Note 1: A5 (880 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.08, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.18)

    // Note 2: E6 (1318.5 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.11)
    gain2.gain.setValueAtTime(0.09, ctx.currentTime + 0.11)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.11)
    osc2.stop(ctx.currentTime + 0.42)
  } catch {
    // Ignore if browser autoplay policy blocks audio prior to first click
  }
}

export default function SecureMessageThread({
  applicationId,
  referenceId,
  viewerRole,
  initialMessages = [],
  initialVaultReleased = false,
  employerName = 'Verified Employer',
  candidateDisplayName = 'Verified Candidate',
  candidateFullName: initialCandidateFullName,
  candidateEmail: initialCandidateEmail,
  employerEmail: initialEmployerEmail,
  initialResumeUrl,
}: {
  applicationId: string
  referenceId: string
  viewerRole: 'employer' | 'candidate'
  initialMessages?: ThreadMessage[]
  initialVaultReleased?: boolean
  employerName?: string
  employerDomain?: string | null;
  candidateDisplayName?: string
  candidateFullName?: string | null
  candidateEmail?: string | null
  employerEmail?: string | null
  initialResumeUrl?: string | null
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(
    Array.isArray(initialMessages) ? initialMessages : []
  )
  const [vaultReleased, setVaultReleased] = useState<boolean>(
    Boolean(initialVaultReleased)
  )
  const [candidateFullName, setCandidateFullName] = useState<string | null>(
    initialCandidateFullName || null
  )
  const [candidateEmail, setCandidateEmail] = useState<string | null>(
    initialCandidateEmail || null
  )
  const [employerEmail, setEmployerEmail] = useState<string | null>(
    initialEmployerEmail || null
  )
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [justReceivedAlert, setJustReceivedAlert] = useState(false)
  const [liveResumeUrl, setLiveResumeUrl] = useState<string | null>(
    initialResumeUrl || null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const prevMsgCountRef = useRef<number>(messages.length)
  const hasHydratedRef = useRef<boolean>(false)
  const soundEnabledRef = useRef<boolean>(soundEnabled)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Keep state in sync if parent re-fetches applications list
  useEffect(() => {
    if (
      Array.isArray(initialMessages) &&
      initialMessages.length > messages.length
    ) {
      setMessages(initialMessages)
    }
  }, [initialMessages, messages.length])

  useEffect(() => {
    if (initialVaultReleased && !vaultReleased) {
      setVaultReleased(true)
    }
  }, [initialVaultReleased, vaultReleased])

  // Auto-scroll & chime when a new message from the OTHER party arrives
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
      }

      const newestMsg = messages[messages.length - 1]
      if (
        hasHydratedRef.current &&
        newestMsg &&
        newestMsg.sender_role !== viewerRole
      ) {
        if (soundEnabledRef.current) {
          playIncomingMessageChime()
        }
        setJustReceivedAlert(true)
        setTimeout(() => setJustReceivedAlert(false), 4000)
      }
    }
    prevMsgCountRef.current = messages.length
    hasHydratedRef.current = true
  }, [messages, viewerRole])

  // Direct, uncached server state pull
  const syncLatestThreadState = useCallback(async () => {
    if (!applicationId) return
    try {
      const res = await getApplicationThreadState(applicationId, viewerRole)
      if (!res.error) {
        setMessages((prev) => {
          if (
            res.messages.length !== prev.length ||
            res.messages[res.messages.length - 1]?.id !==
              prev[prev.length - 1]?.id
          ) {
            return res.messages
          }
          return prev
        })
        setVaultReleased((prev) =>
          prev !== res.vaultReleased ? res.vaultReleased : prev
        )
        if (res.candidateFullName) setCandidateFullName(res.candidateFullName)
        if (res.candidateEmail) setCandidateEmail(res.candidateEmail)
        if (res.employerEmail) setEmployerEmail(res.employerEmail)
      }
    } catch {
      // Ignore transient network hiccups during polling
    }
  }, [applicationId, viewerRole])

  // Subscribe to Instant WebSocket Broadcast + Postgres Changes + 2.5s Uncached Poll
  useEffect(() => {
    if (!applicationId) return

    syncLatestThreadState()

    const supabase = createClient()
    const channel = supabase
      .channel(`ss-live-thread-${applicationId}`)
      .on('broadcast', { event: 'thread-update' }, () => {
        syncLatestThreadState()
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`,
        },
        () => {
          syncLatestThreadState()
        }
      )
      .subscribe()

    channelRef.current = channel

    const intervalId = setInterval(() => {
      syncLatestThreadState()
    }, 2500)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [applicationId, syncLatestThreadState])

  const broadcastInstantPing = async () => {
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'thread-update',
          payload: { updatedAt: Date.now() },
        })
      }
    } catch {
      // Fallback polling handles it
    }
  }

  const hasEmployerMessaged = messages.some((m) => m.sender_role === 'employer')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || isSending) return

    setIsSending(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await sendApplicationMessage(applicationId, draft)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.messages) {
      setMessages(res.messages)
      setDraft('')
      await broadcastInstantPing()
    }
    setIsSending(false)
  }

  const handleReleaseVault = async () => {
    if (isReleasing || vaultReleased) return
    setIsReleasing(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await releaseCandidateVaultToEmployer(applicationId)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setVaultReleased(true)
      setSuccessMsg(
        `Full Identity Vault (Resume PDF & Direct Email) released to ${employerName}!`
      )
      await syncLatestThreadState()
      await broadcastInstantPing()
    }
    setIsReleasing(false)
  }

  const handleOpenResume = async () => {
    if (liveResumeUrl) {
      window.open(liveResumeUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const res = await getVaultReleasedResumeUrl(applicationId)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.signedUrl) {
      setLiveResumeUrl(res.signedUrl)
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
        justReceivedAlert
          ? 'border-indigo-500 ring-4 ring-indigo-500/15 shadow-md'
          : 'border-slate-300 shadow-xs'
      }`}
    >
      {/* Top Vault Status Header */}
      <div
        className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          vaultReleased
            ? 'bg-emerald-50/80 border-emerald-300'
            : 'bg-indigo-50/70 border-indigo-300'
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              vaultReleased
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {vaultReleased ? '🔓' : '🛡️'}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">
                {vaultReleased
                  ? 'Resume Unlocked: Full Contact Info & PDF Shared'
                  : 'Private Chat Active: Your Name, Email & PDF Resume Remain Hidden'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-[10px] font-mono font-bold text-slate-600">
                {referenceId}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled
                  setSoundEnabled(next)
                  if (next) playIncomingMessageChime()
                }}
                title={
                  soundEnabled
                    ? 'Audio chime enabled for incoming messages (Click to mute)'
                    : 'Audio chime muted (Click to enable & test chime)'
                }
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                    : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? '🔔 Chime On' : '🔕 Muted'}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {vaultReleased
                ? viewerRole === 'employer'
                  ? 'Candidate has released their full name, direct email, and signed PDF resume.'
                  : `You have released your direct contact details and PDF resume to ${employerName}.`
                : viewerRole === 'employer'
                ? 'To prevent passive resume harvesting, raw email & PDF resume remain vaulted until you message the candidate and they choose to share it.'
                : `Your raw email & PDF resume are still hidden from ${employerName}. Chat below first, then click "Release Resume & Contact Vault" whenever you feel comfortable.`}
            </p>
          </div>
        </div>

        {/* Stage 2 Action Button */}
        <div className="shrink-0">
          {viewerRole === 'candidate' && !vaultReleased && (
            <button
              type="button"
              disabled={isReleasing}
              onClick={handleReleaseVault}
              className="w-full sm:w-auto text-center justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isReleasing
                ? 'Releasing Vault...'
                : '🔓 Release Resume & Contact Vault'}
            </button>
          )}

          {viewerRole === 'employer' && vaultReleased && (
            <button
              type="button"
              onClick={handleOpenResume}
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              📄 View Unlocked PDF Resume
            </button>
          )}

          {viewerRole === 'employer' && !vaultReleased && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold">
              🔒 PDF Resume Vaulted (Message Candidate First)
            </span>
          )}
        </div>
      </div>

      {/* Stage 2 Unlocked Contact Card (Only visible AFTER Candidate clicks Release Vault) */}
      {vaultReleased && (
        <div className="px-4 py-2.5 bg-emerald-50/40 border-b border-emerald-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {candidateFullName && (
              <span>
                <strong className="text-slate-600">Candidate:</strong>{' '}
                <span className="font-extrabold text-slate-900">
                  {candidateFullName}
                </span>
              </span>
            )}
            {candidateEmail && (
              <span>
                <strong className="text-slate-600">Candidate Email:</strong>{' '}
                <a
                  href={`mailto:${candidateEmail}`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {candidateEmail}
                </a>
              </span>
            )}
            {employerEmail && (
              <span>
                <strong className="text-slate-600">Hiring Team Email:</strong>{' '}
                <a
                  href={`mailto:${employerEmail}`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {employerEmail}
                </a>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Message History Feed */}
      <div
        ref={scrollContainerRef}
        className="p-4 max-h-64 overflow-y-auto space-y-3 bg-slate-50/60"
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-xs font-bold text-slate-600">
              {viewerRole === 'employer'
                ? `Start the conversation with ${candidateDisplayName} to introduce your role and schedule an interview.`
                : `No messages from ${employerName} yet. You can send the first note below or wait for their outreach before releasing your resume vault.`}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            if (m.sender_role === 'system') {
              return (
                <div
                  key={m.id}
                  className="text-center py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-800"
                >
                  {m.text}
                </div>
              )
            }

            const isMe = m.sender_role === viewerRole

            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-extrabold text-slate-600">
                    {isMe ? 'You' : m.sender_name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-slate-300 text-slate-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-300 text-xs font-bold text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-300 text-xs font-bold text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Message Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-300 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            viewerRole === 'employer' && !hasEmployerMessaged
              ? `Write an introductory message to ${candidateDisplayName} to request interview & resume release...`
              : 'Write a secure message...'
          }
          className="flex-1 min-w-0 rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
        >
          {isSending ? 'Sending...' : 'Send →'}
        </button>
      </form>
    </div>
  )
}