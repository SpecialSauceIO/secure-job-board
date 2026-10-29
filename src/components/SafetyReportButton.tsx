'use client'

import { useState } from 'react'
import { submitSafetyReport } from '@/app/dashboard/actions'

const REPORT_REASONS: Record<string, string[]> = {
  application: [
    'Misrepresented Skills, Experience, or Credentials',
    'Prompt Injection / TrueFit Score™ Manipulation Attempt',
    'Off-Platform Contact Lure or Solicitation',
    'Spam, Duplicate Account, or Abusive Conduct',
  ],
  candidate: [
    'Suspected Fake Profile or Misrepresented Credentials',
    'Adversarial Bio / Keyword Stuffing Manipulation',
    'Spam or Policy Violation',
  ],
  pitch: [
    'Ghost Role or Inaccurate Compensation Band',
    'Off-Platform Lure (WhatsApp / Telegram / Wire Request)',
    'Unverified Third-Party Headhunter / Recruiting Spam',
    'Unprofessional or Abusive Communication',
  ],
  job: [
    'Suspected Ghost Job / No Active Hiring Intent',
    'Misleading Compensation or Work Model',
    'Request for Personal Contact Info or Off-Platform Payment',
  ],
}

export default function SafetyReportButton({
  targetType,
  referenceId,
  compact = true,
}: {
  targetType: 'application' | 'pitch' | 'job' | 'candidate'
  referenceId: string
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const reasons = REPORT_REASONS[targetType] || REPORT_REASONS.application

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    setIsSubmitting(true)
    setErrorMsg(null)
    const res: any = await submitSafetyReport({
      targetType,
      referenceId,
      reason,
      details,
    })
    setIsSubmitting(false)
    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      setSubmittedTicket(res?.ticketId || 'Submitted')
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    }
  }

  if (submittedTicket && !isOpen) {
    return (
      <span
        title="Trust & Safety team notified"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700"
      >
        ⚑ Reported ({submittedTicket})
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev)
          if (!reason) setReason(reasons[0])
        }}
        title={`Report this ${targetType} (${referenceId}) to Trust & Safety`}
        className={`inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-700 font-bold transition-colors cursor-pointer ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <span>⚑</span>
        <span>Report</span>
      </button>

      {isOpen && (
        <div className="mt-2 p-4 rounded-xl bg-white border-2 border-rose-300 shadow-lg space-y-3 text-left z-30 min-w-[280px] sm:min-w-[340px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
              ⚑ Trust &amp; Safety Report ({referenceId})
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {submittedTicket ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800">
              ✓ Report logged ({submittedTicket}). Our Trust &amp; Safety team will review Ref {referenceId}.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Flagging
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Optional Details
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Brief context for Trust & Safety..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] font-bold text-rose-600">{errorMsg}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
