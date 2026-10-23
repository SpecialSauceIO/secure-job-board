import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { recordHandshakeTelemetry, raiseSecurityAlertAndFlag } from '@/lib/security-telemetry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-09-30.endive' as any,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseRolloverCreditsTag(desc?: string | null): number {
  const m = (desc || '').match(/\[TOPUP:(\d+)\]/i)
  return m ? Math.max(0, parseInt(m[1], 10) || 0) : 0
}

function stripTags(desc?: string | null): string {
  return (desc || '')
    .replace(/\[TIER:(free|starter|growth|enterprise)\]/gi, '')
    .replace(/\[TOPUP:\d+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    await raiseSecurityAlertAndFlag({
      flagType: 'Manual_Trust_Audit',
      severity: 'high',
      actorEmail: 'stripe-webhook@external',
      actorRole: 'unknown',
      platformArea: 'Billing, Subscriptions & Credits',
      summary: 'Invalid Stripe Webhook Signature Detected',
      evidenceSnippet: err.message || 'Signature verification failed',
      createSecTicket: true,
    })
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // ============================================================================
  // 1. CHECKOUT COMPLETED (Candidate Plans, Employer Plans, Top-Up Credit Packs)
  // ============================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const audience = session.metadata?.audience || ''
    const tierId = (session.metadata?.tierId || '').toLowerCase()
    const packId = (session.metadata?.packId || '').toLowerCase()
    const userId = session.metadata?.userId || session.client_reference_id || ''
    const organizationId = session.metadata?.organizationId || session.client_reference_id || ''

    // A) Candidate Subscription (professional $9/mo or prestige $15/mo)
    if (audience === 'candidate' || tierId === 'professional' || tierId === 'prestige' || tierId === 'pro') {
      const normalizedPlan = tierId === 'pro' || tierId === 'prestige' ? 'prestige' : 'professional'
      if (userId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('structured_skills')
          .eq('id', userId)
          .maybeSingle()

        const { count: currentApps } = await supabaseAdmin
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', userId)
          .neq('initiated_by', 'employer')

        const rawSkills = Array.isArray(profile?.structured_skills) ? profile.structured_skills : []
        const filtered = rawSkills.filter((item: any) => !(item && typeof item === 'object' && item._ss_meta))
        const newMeta = {
          _ss_meta: true,
          plan: normalizedPlan,
          trialStart: new Date().toISOString(),
          trialBaselineApps: normalizedPlan === 'professional' ? currentApps || 0 : 0,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ structured_skills: [...filtered, newMeta] })
          .eq('id', userId)

        if (error) console.error('Database Update Error (Candidate Plan):', error)
      }
    }
    // B) Employer Top-Up Credit Pack (boost +10 / surge +25 / scale +75)
    else if (audience === 'employer_topup' || packId) {
      const creditsToAdd = Math.max(0, parseInt(session.metadata?.creditsToAdd || '0', 10) || 0)
      if (organizationId && creditsToAdd > 0) {
        const { data: orgObj } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .maybeSingle()

        if (orgObj) {
          const currentTotal = Math.max(0, orgObj.connection_credits || 0)
          const currentRollover = Math.min(currentTotal, parseRolloverCreditsTag(orgObj.description))
          const currentPlanCredits = Math.max(0, currentTotal - currentRollover)
          const newRollover = currentRollover + creditsToAdd
          const newTotal = currentPlanCredits + newRollover

          const tierMatch = (orgObj.description || '').match(/\[TIER:(free|starter|growth|enterprise)\]/i)
          const activeTierTag = tierMatch ? tierMatch[1].toLowerCase() : (orgObj.subscription_tier || 'starter')
          const cleanDesc = stripTags(orgObj.description)
          const taggedDesc = `${cleanDesc} [TIER:${activeTierTag}] [TOPUP:${newRollover}]`.replace(/\s+/g, ' ').trim()

          await supabaseAdmin
            .from('organizations')
            .update({
              connection_credits: newTotal,
              description: taggedDesc,
            })
            .eq('id', organizationId)
        }
      }
    }
    // C) Employer Recurring Subscription (starter / growth / enterprise)
    else if (organizationId) {
      const targetTier = ['starter', 'growth', 'enterprise'].includes(tierId) ? tierId : 'starter'
      const planCreditsMap: Record<string, number> = { starter: 10, growth: 35, enterprise: 120 }
      const planCredits = planCreditsMap[targetTier] || 10

      const { data: orgObj } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle()

      const currentTotal = Math.max(0, orgObj?.connection_credits || 0)
      const preservedRollover = Math.min(currentTotal, parseRolloverCreditsTag(orgObj?.description))
      const newTotalCredits = planCredits + preservedRollover
      const cleanDesc = stripTags(orgObj?.description)
      const topupTag = preservedRollover > 0 ? `[TOPUP:${preservedRollover}]` : ''
      const taggedDesc = `${cleanDesc} [TIER:${targetTier}] ${topupTag}`.replace(/\s+/g, ' ').trim()

      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          subscription_status: 'active',
          subscription_tier: targetTier,
          connection_credits: newTotalCredits,
          description: taggedDesc,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', organizationId)

      if (error) console.error('Database Update Error (Organization Subscription):', error)
    }
  }


  // ============================================================================
  // 1B. RECURRING MONTHLY RENEWAL (invoice.payment_succeeded)
  //     - Replenishes Employer monthly Pitch Credits (10 / 35 / 120) while
  //       preserving unused [TOPUP:X] rollover credits.
  //     - Resets Candidate Professional ($9/mo) monthly 15-application counter.
  // ============================================================================
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const billingReason = (invoice as any).billing_reason || ''
    const subId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id || ''
    const custId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as any)?.id || ''

    if (billingReason === 'subscription_cycle' && (subId || custId)) {
      // 1) Check if this subscription belongs to an Employer Organization
      let orgQuery = supabaseAdmin.from('organizations').select('*')
      orgQuery = subId
        ? orgQuery.eq('stripe_subscription_id', subId)
        : orgQuery.eq('stripe_customer_id', custId)
      const { data: orgObj } = await orgQuery.maybeSingle()

      if (orgObj) {
        const tierMatch = (orgObj.description || '').match(/\[TIER:(starter|growth|enterprise)\]/i)
        const activeTier = (
          tierMatch ? tierMatch[1] : orgObj.subscription_tier || 'starter'
        ).toLowerCase()
        const planCreditsMap: Record<string, number> = {
          starter: 10,
          growth: 35,
          enterprise: 120,
        }
        const monthlyAllowance = planCreditsMap[activeTier] || 10
        const currentTotal = Math.max(0, orgObj.connection_credits || 0)
        const preservedRollover = Math.min(
          currentTotal,
          parseRolloverCreditsTag(orgObj.description)
        )
        const renewedTotal = monthlyAllowance + preservedRollover
        const cleanDesc = stripTags(orgObj.description)
        const topupTag = preservedRollover > 0 ? `[TOPUP:${preservedRollover}]` : ''
        const taggedDesc = `${cleanDesc} [TIER:${activeTier}] ${topupTag}`
          .replace(/\s+/g, ' ')
          .trim()

        await supabaseAdmin
          .from('organizations')
          .update({
            subscription_status: 'active',
            connection_credits: renewedTotal,
            description: taggedDesc,
          })
          .eq('id', orgObj.id)
      } else {
        // 2) Otherwise check if a Candidate Profile holds this subscription
        const { data: candidates } = await supabaseAdmin
          .from('profiles')
          .select('id, structured_skills')
          .eq('role', 'candidate')

        for (const cand of candidates || []) {
          const skills = Array.isArray(cand.structured_skills) ? cand.structured_skills : []
          const meta = skills.find((item: any) => item && typeof item === 'object' && item._ss_meta)
          if (
            meta &&
            ((subId && meta.stripeSubscriptionId === subId) ||
              (custId && meta.stripeCustomerId === custId))
          ) {
            const { count: currentApps } = await supabaseAdmin
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('candidate_id', cand.id)
              .neq('initiated_by', 'employer')

            const filtered = skills.filter(
              (item: any) => !(item && typeof item === 'object' && item._ss_meta)
            )
            const updatedMeta = {
              ...meta,
              trialStart: new Date().toISOString(),
              trialBaselineApps: meta.plan === 'professional' ? currentApps || 0 : 0,
            }
            await supabaseAdmin
              .from('profiles')
              .update({ structured_skills: [...filtered, updatedMeta] })
              .eq('id', cand.id)
            break
          }
        }
      }
    }
  }

  // ============================================================================
  // 1C. SUBSCRIPTION CANCELED / EXPIRED (customer.subscription.deleted)
  //     - Downgrades Employer to 'free' while preserving any purchased [TOPUP:X]
  //     - Downgrades Candidate back to 'explorer' ($0/forever)
  // ============================================================================
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const subId = subscription.id
    const custId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer as any)?.id || ''

    // 1) Check Employer Organization
    let orgQuery = supabaseAdmin.from('organizations').select('*')
    orgQuery = subId
      ? orgQuery.eq('stripe_subscription_id', subId)
      : orgQuery.eq('stripe_customer_id', custId)
    const { data: orgObj } = await orgQuery.maybeSingle()

    if (orgObj) {
      const currentTotal = Math.max(0, orgObj.connection_credits || 0)
      const preservedRollover = Math.min(
        currentTotal,
        parseRolloverCreditsTag(orgObj.description)
      )
      const cleanDesc = stripTags(orgObj.description)
      const topupTag = preservedRollover > 0 ? `[TOPUP:${preservedRollover}]` : ''
      const taggedDesc = `${cleanDesc} [TIER:free] ${topupTag}`
        .replace(/\s+/g, ' ')
        .trim()

      await supabaseAdmin
        .from('organizations')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'free',
          connection_credits: preservedRollover,
          description: taggedDesc,
        })
        .eq('id', orgObj.id)
    } else {
      // 2) Check Candidate Profile
      const { data: candidates } = await supabaseAdmin
        .from('profiles')
        .select('id, structured_skills')
        .eq('role', 'candidate')

      for (const cand of candidates || []) {
        const skills = Array.isArray(cand.structured_skills) ? cand.structured_skills : []
        const meta = skills.find((item: any) => item && typeof item === 'object' && item._ss_meta)
        if (
          meta &&
          ((subId && meta.stripeSubscriptionId === subId) ||
            (custId && meta.stripeCustomerId === custId))
        ) {
          const filtered = skills.filter(
            (item: any) => !(item && typeof item === 'object' && item._ss_meta)
          )
          const downgradedMeta = {
            ...meta,
            plan: 'explorer',
          }
          await supabaseAdmin
            .from('profiles')
            .update({ structured_skills: [...filtered, downgradedMeta] })
            .eq('id', cand.id)
          break
        }
      }
    }
  }

  // ============================================================================
  // 2. CANDIDATE IDENTITY: Handle successful verification
  // ============================================================================
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    const userId = session.metadata?.userId

    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ identity_verified: true })
        .eq('id', userId)

      if (error) {
        console.error('Database Update Error (Profile Identity):', error)
      } else {
        console.log(`Candidate ${userId} successfully verified!`)
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'charge.dispute.created') {
    const obj: any = event.data.object
    await raiseSecurityAlertAndFlag({
      flagType: 'Manual_Trust_Audit',
      severity: 'high',
      actorEmail: obj?.receipt_email || obj?.billing_details?.email || 'stripe-customer',
      actorRole: 'unknown',
      platformArea: 'Billing, Subscriptions & Credits',
      summary: `Suspicious Stripe Transactional Event: ${event.type}`,
      evidenceSnippet: `Event ${event.id} (${event.type}): ${obj?.last_payment_error?.message || 'Dispute or failed card attempt'}`,
      createSecTicket: true,
    })
  }
  await recordHandshakeTelemetry({
    handshakeId: 'stripe_webhook_receiver',
    label: `Stripe Webhook (${event.type})`,
    platformArea: 'Billing, Subscriptions & Credits',
    ok: true,
  })
  return NextResponse.json({ received: true })
}
