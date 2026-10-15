import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Stripe from 'stripe'
import EmployerBillingClient from '@/components/EmployerBillingClient'
import { resolveEmployerTierInfo, stripTierTag } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function EmployerBillingPage({
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) {
    redirect('/dashboard/employer/organization')
  }

  let { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const { count: activeJobsCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', member.organization_id)
    .eq('is_active', true)

  const resolvedParams = searchParams ? await searchParams : {}
  let initialBanner: { type: 'success' | 'error'; text: string } | null = null

  if (resolvedParams?.billing === 'cancelled') {
    initialBanner = {
      type: 'error',
      text: 'Stripe Subscription Checkout was cancelled. No charges were made.',
    }
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY

  if (resolvedParams?.billing === 'success' && stripeKey) {
    const cookieStore = await cookies()
    const sessionId =
      resolvedParams?.session_id || cookieStore.get('stripe_billing_cs_id')?.value
    const lastCreditedSession = cookieStore.get('stripe_last_credited_cs')?.value

    if (sessionId && sessionId !== lastCreditedSession) {
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2026-09-30.endive' as any,
        })

        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (
          session &&
          (session.payment_status === 'paid' || session.status === 'complete') &&
          session.metadata?.organizationId === member.organization_id
        ) {
          const tierId = (session.metadata?.tierId || 'starter') as 'starter' | 'growth' | 'enterprise'
          const creditsToAdd = parseInt(session.metadata?.creditsToAdd || '10', 10)
          const maxActiveJobs = parseInt(session.metadata?.maxActiveJobs || '5', 10)

          const currentCredits = orgData?.connection_credits || 0
          const newTotal = currentCredits + creditsToAdd

          const cleanDesc = await stripTierTag(orgData?.description)
          const existingSeatsMatch = (orgData?.description || '').match(/\[SEATS:[^\]]+\]/i)
          const seatsTag = existingSeatsMatch ? existingSeatsMatch[0] : ''
          const taggedDesc = `${cleanDesc} [TIER:${tierId}] ${seatsTag}`.trim()

          let { data: updatedOrg, error: updateErr } = await supabase
            .from('organizations')
            .update({
              connection_credits: newTotal,
              subscription_tier: tierId,
              max_active_jobs: maxActiveJobs,
            })
            .eq('id', member.organization_id)
            .select('*')
            .single()

          if (updateErr) {
            const { data: fallbackOrg } = await supabase
              .from('organizations')
              .update({
                connection_credits: newTotal,
                description: taggedDesc,
              })
              .eq('id', member.organization_id)
              .select('*')
              .single()
            updatedOrg = fallbackOrg
          }

          if (updatedOrg) {
            orgData = updatedOrg
          } else {
            orgData = {
              ...orgData,
              connection_credits: newTotal,
              subscription_tier: tierId,
              max_active_jobs: maxActiveJobs,
            }
          }

          initialBanner = {
            type: 'success',
            text: `Subscription active! ${orgData?.name || 'Your organization'} is now on the ${tierId.toUpperCase()} Tier (${maxActiveJobs} Active Role Slots & +${creditsToAdd} Pitch Credits added).`,
          }
        }
      } catch (err: any) {
        console.warn('[STRIPE BILLING SYNC] Warning:', err.message || err)
      }
    }
  }

  const tierInfo = await resolveEmployerTierInfo(orgData)

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Employer Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Employer Plans & Subscription Billing
            </h1>
            <p className="text-slate-500 mt-1">
              Scale your active blind job slots, monthly passive candidate pitch credits (2:1 ratio), and delegated BPO/Team seats.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employer/jobs"
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
            >
              Manage Roles ({activeJobsCount || 0}/{tierInfo.maxActiveJobs})
            </Link>
            <Link
              href="/dashboard/employer/search"
              className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Search Passive Talent →
            </Link>
          </div>
        </header>

        <EmployerBillingClient
          initialCredits={orgData?.connection_credits || 0}
          initialTier={tierInfo.tier}
          initialMaxJobs={tierInfo.maxActiveJobs}
          initialMaxSeats={tierInfo.maxSeats}
          activeJobsCount={activeJobsCount || 0}
          totalSent={orgData?.total_requests_sent || 0}
          orgName={orgData?.name || 'Your Organization'}
          initialBanner={initialBanner}
        />
      </div>
    </div>
  )
}