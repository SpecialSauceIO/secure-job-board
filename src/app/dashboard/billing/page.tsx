import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Stripe from 'stripe'
import CandidateBillingClient from '@/components/CandidateBillingClient'
import {
  resolveCandidateTierInfo,
  activateSandboxCandidateTier,
} from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function CandidateBillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string; session_id?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') {
    redirect('/dashboard/employer/billing')
  }

  const resolvedParams = searchParams ? await searchParams : {}
  let initialBanner: { type: 'success' | 'error'; text: string } | null = null

  if (resolvedParams?.billing === 'cancelled') {
    initialBanner = {
      type: 'error',
      text: 'Stripe Checkout was cancelled. No charges were made.',
    }
  }

  // ============================================================================
  // AUTOMATIC STRIPE CANDIDATE PRO SUBSCRIPTION SYNC
  // ============================================================================
  const stripeKey =
    process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY

  if (resolvedParams?.billing === 'success' && stripeKey) {
    const cookieStore = await cookies()
    const sessionId =
      resolvedParams?.session_id || cookieStore.get('stripe_candidate_cs_id')?.value

    if (sessionId) {
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2026-09-30.endive' as any,
        })

        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (
          session &&
          (session.payment_status === 'paid' || session.status === 'complete')
        ) {
          await activateSandboxCandidateTier('pro')
          initialBanner = {
            type: 'success',
            text: 'Candidate Pro Pass ($9/mo) activated! You now have unlimited blind applications to matching roles.',
          }
        }
      } catch (err: any) {
        console.warn('[CANDIDATE BILLING SYNC] Warning:', err.message || err)
      }
    }
  }

  const isVerified = Boolean(
    profile?.identity_verified === true ||
      profile?.is_verified === true ||
      profile?.verification_status === 'verified'
  )

  const tierInfo = await resolveCandidateTierInfo(user.id)

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Candidate Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Membership & Trial Status
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your 7-Day Early Adopter Trial or upgrade to the $9/month Candidate Pro Pass for unlimited blind applications.
            </p>
          </div>

          <Link
            href="/dashboard/jobs"
            className="shrink-0 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Browse Open Roles →
          </Link>
        </header>

        <CandidateBillingClient
          initialTierInfo={tierInfo}
          isVerified={isVerified}
          initialBanner={initialBanner}
        />
      </div>
    </div>
  )
}