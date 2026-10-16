'use client'

import { useState } from 'react'
import {
  sendApplicationMessage,
  releaseCandidateVaultToEmployer,
  getVaultReleasedResumeUrl,
  ThreadMessage,
} from '@/app/dashboard/messaging-actions'

export default function SecureMessageThread({
  applicationId,
  referenceId,
  viewerRole,
  initialMessages = [],
  initialVaultReleased = false,
  employerName = 'Verified Employer',
  candidateDisplayName = 'Verified Candidate',
  candidateFullName,
  candidateEmail,
  employerEmail,
  initialResumeUrl,
}: {
  applicationId: string
  referenceId: string
  viewerRole: 'employer' | 'candidate'
  initialMessages?: ThreadMessage[]
  initialVaultReleased?: boolean
  employerName?: string
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
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [liveResumeUrl, setLiveResumeUrl] = useState<string | null>(
    initialResumeUrl || null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

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
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender_role: 'system',
          sender_name: 'Special Sauce Vault',
          text: `🔓 Full Identity Vault (Direct Email & Signed Resume PDF) released to ${employerName}.`,
          created_at: new Date().toISOString(),
        },
      ])
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
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Top Vault Status Header */}
      <div
        className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          vaultReleased
            ? 'bg-emerald-50/80 border-emerald-200'
            : 'bg-indigo-50/70 border-indigo-100'
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
                  ? 'Stage 2 Complete: Full Contact & Resume Vault Released'
                  : 'Stage 1 Active: Encrypted In-Platform Thread (Anti-Harvesting Protection)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                {referenceId}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {vaultReleased
                ? viewerRole === 'employer'
                  ? 'Candidate has released their full name, direct email, and signed PDF resume.'
                  : `You have released your direct contact details and PDF resume to ${employerName}.`
                : viewerRole === 'employer'
                ? 'To prevent passive resume harvesting, raw email & PDF resume remain vaulted until you message the candidate and they approve Stage 2 release.'
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
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              📄 View Unlocked PDF Resume
            </button>
          )}

          {viewerRole === 'employer' && !vaultReleased && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              🔒 PDF Resume Vaulted (Message Candidate First)
            </span>
          )}
        </div>
      </div>

      {/* Stage 2 Unlocked Contact Card (Only visible AFTER Candidate clicks Release Vault) */}
      {vaultReleased && (
        <div className="px-4 py-2.5 bg-emerald-50/40 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
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
      <div className="p-4 max-h-64 overflow-y-auto space-y-3 bg-slate-50/60">
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
                  className="text-center py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800"
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
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
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
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs font-bold text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-xs font-bold text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Message Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
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
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
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