'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  inviteOrganizationSeat,
  removeOrganizationSeat,
} from '@/app/dashboard/actions'

export interface SeatMemberItem {
  id: string
  email: string
  role: 'owner' | 'hiring_manager' | 'bpo_partner'
  status: 'active' | 'invited'
  addedAt?: string
}

export default function EmployerTeamSeatsPanel({
  orgName,
  tier,
  tierLabel,
  maxSeats,
  initialSeats,
}: {
  orgName: string
  tier: 'free' | 'starter' | 'growth' | 'enterprise'
  tierLabel: string
  maxSeats: number
  initialSeats: SeatMemberItem[]
}) {
  const [seats, setSeats] = useState<SeatMemberItem[]>(initialSeats)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'hiring_manager' | 'bpo_partner'>('hiring_manager')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const seatsUsed = seats.length
  const canAddMoreSeats = seatsUsed < maxSeats && (tier === 'growth' || tier === 'enterprise')

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsSubmitting(true)
    setFeedback(null)

    const formData = new FormData()
    formData.append('email', inviteEmail.trim())
    formData.append('seat_role', inviteRole)

    const result = await inviteOrganizationSeat(formData)
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success && result.seats) {
      setSeats(result.seats)
      setInviteEmail('')
      setFeedback({
        type: 'success',
        text: result.message || 'Team / BPO Partner seat invited and notified via email!',
      })
    }

    setIsSubmitting(false)
  }

  const handleRemoveSeat = async (seatId: string, email: string) => {
    setRemovingId(seatId)
    setFeedback(null)

    const result = await removeOrganizationSeat(seatId, email)
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success && result.seats) {
      setSeats(result.seats)
      setFeedback({
        type: 'success',
        text: `Removed ${email} from your organization seats.`,
      })
    }

    setRemovingId(null)
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-2-slate-200 shadow-sm space-y-6 border-slate-300">
      {/* Header & Live Seat Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Team & Delegated BPO Partner Seats
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold">
              {seatsUsed} / {maxSeats} {maxSeats === 1 ? 'Seat' : 'Seats'} Used ({tierLabel})
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Invite internal hiring managers or authorized W-2 BPO delivery partners to collaborate inside{' '}
            <strong>{orgName || 'your organization'}</strong> and share your verified domain, active roles, and pitch credit pool.
          </p>
        </div>

        {tier === 'free' || tier === 'starter' ? (
          <Link
            href="/dashboard/employer/billing"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition-colors shadow-sm text-center"
          >
            Upgrade to Growth (3 Seats) →
          </Link>
        ) : seatsUsed >= maxSeats && tier === 'growth' ? (
          <Link
            href="/dashboard/employer/billing"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm text-center"
          >
            Upgrade to Enterprise (10 Seats) →
          </Link>
        ) : null}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Upgrade Callout for Starter / Free Explorer */}
      {(tier === 'free' || tier === 'starter') && (
        <div className="p-5 rounded-xl bg-indigo-50/70 border border-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-indigo-950">
              Need to add a Hiring Manager or BPO / RPO Delivery Partner?
            </h3>
            <p className="text-xs text-indigo-800/90 leading-relaxed">
              The <strong>Starter Tier ($99/mo)</strong> includes 1 Owner seat. Upgrade to the{' '}
              <strong>Growth Tier ($299/mo)</strong> to unlock up to <strong>3 Team & Partner Seats</strong>, or{' '}
              <strong>Enterprise ($899/mo)</strong> for up to <strong>10 Seats + ATS Auto-Sync</strong>.
            </p>
          </div>
          <Link
            href="/dashboard/employer/billing"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition-colors text-center shadow-sm"
          >
            View Plans →
          </Link>
        </div>
      )}

      {/* Invite Form (Active on Growth & Enterprise when seats are available) */}
      {(tier === 'growth' || tier === 'enterprise') && (
        <form
          onSubmit={handleInviteSubmit}
          className="p-5 rounded-xl bg-slate-50 border-2 border-2-slate-200 space-y-4 border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Invite Collaborator or BPO Partner Seat
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {Math.max(0, maxSeats - seatsUsed)} {maxSeats - seatsUsed === 1 ? 'Seat' : 'Seats'} Remaining
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="email"
                required
                disabled={!canAddMoreSeats || isSubmitting}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com or lead@bpo-partner.com"
                className="w-full rounded-xl border-2 border-2-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-2-indigo-500 focus:outline-none disabled:bg-slate-100 border-slate-300"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                disabled={!canAddMoreSeats || isSubmitting}
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'hiring_manager' | 'bpo_partner')
                }
                className="w-full rounded-xl border-2 border-2-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:border-2-indigo-500 focus:outline-none disabled:bg-slate-100 border-slate-300"
              >
                <option value="hiring_manager">Internal Hiring Manager</option>
                <option value="bpo_partner">Delegated BPO / W-2 Partner</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={!canAddMoreSeats || isSubmitting}
                className="w-full h-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Sending Invite...'
                  : canAddMoreSeats
                  ? '+ Assign Seat'
                  : 'Seat Limit Reached'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Current Seats Roster */}
      <div className="divide-y divide-slate-300 border-2 border-2-slate-200 rounded-xl overflow-hidden border-slate-300">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                  seat.role === 'owner'
                    ? 'bg-slate-900 text-white'
                    : seat.role === 'bpo_partner'
                    ? 'bg-violet-100 text-violet-700 border border-violet-300'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                }`}
              >
                {seat.email.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{seat.email}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                      seat.role === 'owner'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : seat.role === 'bpo_partner'
                        ? 'bg-violet-50 text-violet-700 border-violet-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    }`}
                  >
                    {seat.role === 'owner'
                      ? 'Account Owner'
                      : seat.role === 'bpo_partner'
                      ? 'Delegated BPO Partner'
                      : 'Hiring Manager'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      seat.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {seat.status === 'active' ? '● Active Seat' : '● Invite Sent'}
                  </span>
                </div>
                {seat.addedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Added {new Date(seat.addedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {seat.role !== 'owner' && (
              <button
                type="button"
                disabled={removingId === seat.id}
                onClick={() => handleRemoveSeat(seat.id, seat.email)}
                className="self-end sm:self-auto px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {removingId === seat.id ? 'Removing...' : 'Revoke Seat'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}