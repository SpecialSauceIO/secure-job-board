'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { submitQuickFeedbackReliable } from '@/app/dashboard/feedback-actions'
import type { SystemStatusBanner } from '@/lib/ops-bridge'

export default function QuickFeedbackWidget({
  activeBanner,
}: {
  activeBanner?: SystemStatusBanner | null
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'Bug' | 'UX Idea' | 'Praise'>(
    'Bug'
  )
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMsg, setResultMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return

    setIsSubmitting(true)
    setResultMsg(null)

    const formData = new FormData()
    formData.append('feedback_type', feedbackType)
    formData.append('notes', notes.trim())
    formData.append('page_url', pathname || '/dashboard')
    formData.append(
      'user_agent',
      typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser'
    )

    const res = await submitQuickFeedbackReliable(formData)

    if (res?.error) {
      setResultMsg({ type: 'error', text: res.error })
      setIsSubmitting(false)
      return
    }

    setResultMsg({
      type: 'success',
      text: `Delivered (${res.referenceId}) to ${
        res.deliveredTo || 'inbox'
      }! Thank you for helping improve Special Sauce.`,
    })
    setNotes('')
    setIsSubmitting(false)

    setTimeout(() => {
      setIsOpen(false)
      setResultMsg(null)
    }, 2600)
  }

  return (
    <div className="relative">
      {/* Compact Top Navbar Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev)
          setResultMsg(null)
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300/90 text-xs font-extrabold transition-colors shadow-2xs cursor-pointer"
        title="Report a bug or share quick feedback (Auto-attaches current page URL)"
      >
        <span>🐞</span>
        <span className="hidden sm:inline">Feedback</span>
        {activeBanner?.active && (
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              activeBanner.severity === 'outage'
                ? 'bg-rose-600'
                : activeBanner.severity === 'degraded'
                ? 'bg-amber-600'
                : 'bg-indigo-600'
            }`}
          />
        )}
      </button>

      {/* Popover Telemetry Feedback Form */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border-2 border-slate-300 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>🐞 Quick Beta Feedback</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Auto-attaches page:{' '}
                  <code className="text-indigo-600 font-bold">
                    {pathname || '/dashboard'}
                  </code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* PROACTIVE TICKET DEFLECTOR WHEN AN INCIDENT BANNER IS ACTIVE */}
            {activeBanner?.active && (
              <div
                className={`mb-3 p-3 rounded-xl border text-left space-y-1 ${
                  activeBanner.severity === 'outage'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : activeBanner.severity === 'degraded'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-950'
                }`}
              >
                <div className="text-[11px] font-black uppercase tracking-wider flex items-center justify-between gap-2">
                  <span>
                    {activeBanner.severity === 'outage'
                      ? '🚨 Active Service Outage'
                      : activeBanner.severity === 'degraded'
                      ? '⚠️ Known Issue In Progress'
                      : 'ℹ️ Scheduled Maintenance Notice'}
                  </span>
                  {activeBanner.incident_ref && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-current/20">
                      {activeBanner.incident_ref}
                    </span>
                  )}
                </div>
                <p className="text-xs font-extrabold leading-snug">
                  {activeBanner.title}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {activeBanner.message}
                </p>
                <p className="text-[10px] font-bold pt-1 opacity-80">
                  ✓ Our team is already resolving this—no need to submit a duplicate ticket unless reporting a separate issue.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {(['Bug', 'UX Idea', 'Praise'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFeedbackType(t)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                      feedbackType === t
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'Bug'
                      ? '🐛 Bug'
                      : t === 'UX Idea'
                      ? '💡 Idea'
                      : '🙌 Praise'}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What happened or what can we make better on this page?"
                required
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none p-3 text-xs font-medium text-slate-900"
              />

              {resultMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold leading-relaxed ${
                    resultMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {resultMsg.text}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  Includes current page link
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !notes.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Sending...' : 'Send Report →'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
