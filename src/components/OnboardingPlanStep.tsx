'use client'
import { useState } from 'react'

export default function OnboardingPlanStep({
  role,
  userEmail,
  onSignOut,
}: {
  role: 'candidate' | 'employer'
  userEmail?: string
  onSignOut?: () => void
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const startStripeCheckout = async (planId: string) => {
    setLoadingPlan(planId)
    setErrorMsg(null)
    try {
      const payload = role === 'employer'
        ? { role: 'employer', tier: planId, plan: planId, targetId: planId, targetPlan: planId, isTopUp: false, fromOnboarding: true }
        : { role: 'candidate', tier: planId, plan: planId, targetId: planId, targetPlan: planId, fromOnboarding: true }
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setErrorMsg(data?.error || 'Unable to start Stripe Checkout. Please try again.')
      setLoadingPlan(null)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error launching Stripe Checkout.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-slate-700/80 bg-[#0B1221]/95 p-6 sm:p-8 shadow-2xl text-white">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
          Step 2 of 2 · Identity Verification &amp; Plan Selection
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {role === 'employer' ? 'Verify Your Company & Choose Your Plan' : 'Verify Your Identity & Choose Your Plan'}
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl mx-auto">
          {role === 'employer'
            ? 'Every employer completes a one-time corporate & Stripe identity verification before entering the workspace. Start with the $25 Verification Pass or activate a monthly hiring plan.'
            : 'Every professional completes a one-time Stripe identity check to keep our talent pool 100% real people. Start in Explorer for a $5 one-time fee ($0/mo forever) or activate a monthly plan to apply outbound.'}
        </p>
        {userEmail && (
          <p className="mt-1 text-xs text-slate-400">Signed in as <span className="font-semibold text-slate-200">{userEmail}</span></p>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-500/50 bg-rose-950/50 px-4 py-3 text-xs font-medium text-rose-200 text-center">
          {errorMsg}
        </div>
      )}

      {role === 'candidate' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">$0/Mo Forever After ID Check</div>
              <h3 className="mt-1 text-xl font-extrabold text-white">Explorer</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$5</span>
                <span className="text-xs text-slate-400">one-time ID check · $0/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ 1-Time Stripe ID Check &amp; Verified Shield</li>
                <li>✓ Live Anonymous Profile in Employer Search</li>
                <li>✓ Unlimited Inbound Employer Invitations</li>
                <li>✓ Instant TrueFit Score™ Checks</li>
                <li>✓ Automatic Weekly 1-Year Prestige Drawing</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('explorer')}
              className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-3 text-xs font-bold text-white transition"
            >
              {loadingPlan === 'explorer' ? 'Opening Stripe...' : 'Verify & Start Explorer ($5 One-Time) →'}
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border-2 border-indigo-500 bg-slate-900/95 p-5 shadow-lg">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Job Seeker</div>
              <h3 className="mt-1 text-xl font-extrabold text-white">Professional</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$12</span>
                <span className="text-xs text-slate-400">/ month (ID check included)</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Everything in Explorer + ID Verification</li>
                <li>✓ 15 Outbound Protected Applications / mo</li>
                <li>✓ Elevated Placement in Employer Search</li>
                <li>✓ Founding Member Status &amp; Badge</li>
                <li>✓ Downgrade to $0/mo Explorer anytime</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('professional')}
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-3 text-xs font-bold text-white transition"
            >
              {loadingPlan === 'professional' ? 'Opening Stripe...' : 'Start Professional ($12/mo) →'}
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-amber-500/60 bg-slate-900/80 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Priority &amp; Unlimited</div>
              <h3 className="mt-1 text-xl font-extrabold text-white">Prestige</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$19</span>
                <span className="text-xs text-slate-400">/ month (ID check included)</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Everything in Professional</li>
                <li>✓ Unlimited Outbound Protected Applications</li>
                <li>✓ Top-Priority Spotlight in Talent Search</li>
                <li>✓ Priority Shortlist Placement &amp; 1-on-1 Support</li>
                <li>✓ Downgrade to $0/mo Explorer anytime</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('prestige')}
              className="mt-6 w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-3 text-xs font-bold text-slate-950 transition"
            >
              {loadingPlan === 'prestige' ? 'Opening Stripe...' : 'Start Prestige ($19/mo) →'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col justify-between rounded-xl border border-emerald-500/50 bg-slate-900/80 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">One-Time Verification</div>
              <h3 className="mt-1 text-lg font-extrabold text-white">Verification Pass</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$25</span>
                <span className="text-xs text-slate-400">one-time · $0/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Domain, EIN &amp; Admin Stripe ID Check</li>
                <li>✓ Configure Company Profile &amp; Draft Roles</li>
                <li>✓ Preview Verified Professional Matches</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('employer_verify')}
              className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-3 text-xs font-bold text-white transition"
            >
              {loadingPlan === 'employer_verify' ? 'Opening Stripe...' : 'Verify Company ($25) →'}
            </button>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">12-Mo Founding Rate</div>
              <h3 className="mt-1 text-lg font-extrabold text-white">Starter</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$149</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Up to 5 Active Protected Roles</li>
                <li>✓ 10 Outbound Invitation Credits/mo</li>
                <li>✓ Unlimited Free Inbound Applicants</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('starter')}
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-3 text-xs font-bold text-white transition"
            >
              {loadingPlan === 'starter' ? 'Opening Stripe...' : 'Start Starter ($149/mo) →'}
            </button>
          </div>
          <div className="flex flex-col justify-between rounded-xl border-2 border-indigo-500 bg-slate-900/95 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">Most Popular</div>
              <h3 className="mt-1 text-lg font-extrabold text-white">Growth</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$499</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Up to 15 Active Protected Roles</li>
                <li>✓ 35 Outbound Invitation Credits/mo</li>
                <li>✓ Up to 5 Team &amp; Recruiter Seats</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('growth')}
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-3 text-xs font-bold text-white transition"
            >
              {loadingPlan === 'growth' ? 'Opening Stripe...' : 'Start Growth ($499/mo) →'}
            </button>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-amber-500/60 bg-slate-900/80 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Scale &amp; ATS Sync</div>
              <h3 className="mt-1 text-lg font-extrabold text-white">Enterprise</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">$1,250</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li>✓ Unlimited Active Protected Roles</li>
                <li>✓ 120 Outbound Invitation Credits/mo</li>
                <li>✓ Unlimited Seats &amp; ATS Sync</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => startStripeCheckout('enterprise')}
              className="mt-6 w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-3 py-3 text-xs font-bold text-slate-950 transition"
            >
              {loadingPlan === 'enterprise' ? 'Opening Stripe...' : 'Start Enterprise ($1,250/mo) →'}
            </button>
          </div>
        </div>
      )}

      {onSignOut && (
        <div className="mt-6 text-center">
          <button type="button" onClick={onSignOut} className="text-xs text-slate-400 hover:text-white underline">
            Sign out or use a different email
          </button>
        </div>
      )}
    </div>
  )
}
