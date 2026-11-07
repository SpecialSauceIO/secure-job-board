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
    .replace(/\[TIER:(free|explorer|starter|growth|enterprise)\]/gi, '')
    .replace(/\[TOPUP:\d+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function resolveUserSummary(userId?: string | null, fallbackEmail?: string | null) {
  let email = fallbackEmail || ''
  let fullName = ''
  let role = ''
  if (userId) {
    try {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', userId)
        .maybeSingle()
      if (prof) {
        fullName = prof.full_name || ''
        email = email || prof.email || ''
        role = prof.role || ''
      }
      if (!email) {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (authData?.user?.email) {
          email = authData.user.email
        }
      }
    } catch (e) {
      console.error('resolveUserSummary lookup error:', e)
    }
  }
  return {
    email: email || 'unknown-email@specialsauce.io',
    fullName: fullName || 'Verified Member',
    role: role === 'employer' ? 'Employer' : role === 'candidate' ? 'Professional' : 'Member',
  }
}

async function sendRealtimeOpsAlert(params: {
  subject: string
  badge: string
  headline: string
  details: Array<{ label: string; value: string }>
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping real-time ops email alert:', params.subject)
    return
  }

  const timestampCst = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }) + ' CST'

  const rowsHtml = [
    ...params.details,
    { label: 'Timestamp', value: timestampCst },
  ]
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;font-weight:600;width:160px;">${r.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#f8fafc;font-size:13px;font-family:monospace;">${r.value}</td>
      </tr>`
    )
    .join('')

  const html = `
    <div style="background-color:#090d16;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;border-radius:12px;max-width:600px;margin:0 auto;border:1px solid #1e293b;">
      <div style="display:inline-block;background-color:#10b98120;border:1px solid #10b98160;color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.08em;padding:4px 10px;border-radius:999px;text-transform:uppercase;margin-bottom:12px;">
        ${params.badge}
      </div>
      <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">${params.headline}</h2>
      <table style="width:100%;border-collapse:collapse;background-color:#0f172a;border-radius:8px;overflow:hidden;border:1px solid #1e293b;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">
        SpecialSauce.io Real-Time Onboarding & Billing Telemetry • Routed to support@specialsauce.io
      </p>
    </div>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SpecialSauce.io Telemetry <support@specialsauce.io>',
        to: ['support@specialsauce.io'],
        reply_to: 'support@specialsauce.io',
        subject: params.subject,
        html,
      }),
    })
  } catch (err) {
    console.error('Failed to send real-time ops alert email:', err)
  }
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
  // 1. CHECKOUT COMPLETED (Professional Plans, Employer Verification, Employer Plans, Top-Up Packs)
  // ============================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const audience = session.metadata?.audience || ''
    const tierId = (session.metadata?.tierId || '').toLowerCase()
    const packId = (session.metadata?.packId || '').toLowerCase()
    const userId = session.metadata?.userId || session.client_reference_id || ''
    const organizationId = session.metadata?.organizationId || session.client_reference_id || ''

    // A) Professional Plans (explorer $5 one-time -> $0/mo forever, professional $12/mo, or prestige $19/mo)
    if (
      audience === 'candidate' ||
      tierId === 'explorer' ||
      tierId === 'professional' ||
      tierId === 'prestige' ||
      tierId === 'pro'
    ) {
      const normalizedPlan =
        tierId === 'pro' || tierId === 'prestige'
          ? 'prestige'
          : tierId === 'explorer'
          ? 'explorer'
          : 'professional'
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
          verifiedExplorerPaid: true,
          trialStart: new Date().toISOString(),
          trialBaselineApps: normalizedPlan === 'professional' ? currentApps || 0 : 0,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ structured_skills: [...filtered, newMeta], identity_verified: true, is_verified: true, is_discoverable: true })
          .eq('id', userId)

        if (error) console.error('Database Update Error (Professional Plan):', error)
      }
    }
    // A2) Employer One-Time Verification Pass ($25 One-Time -> Unlocks Explorer Sandbox)
    else if (audience === 'employer_verify' || tierId === 'employer_verify') {
      if (organizationId) {
        const { data: orgObj } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .maybeSingle()

        const currentTotal = Math.max(0, orgObj?.connection_credits || 0)
        const preservedRollover = Math.min(currentTotal, parseRolloverCreditsTag(orgObj?.description))
        const cleanDesc = stripTags(orgObj?.description)
        const topupTag = preservedRollover > 0 ? `[TOPUP:${preservedRollover}]` : ''
        const taggedDesc = `${cleanDesc} [TIER:explorer] ${topupTag}`.replace(/\s+/g, ' ').trim()

        await supabaseAdmin
          .from('organizations')
          .update({
            subscription_status: orgObj?.subscription_status === 'active' ? 'active' : 'verified_sandbox',
            subscription_tier:
              orgObj?.subscription_tier && ['starter', 'growth', 'enterprise'].includes(orgObj.subscription_tier)
                ? orgObj.subscription_tier
                : 'explorer',
            description: taggedDesc,
            ...(typeof session.customer === 'string' ? { stripe_customer_id: session.customer } : {}),
          })
          .eq('id', organizationId)
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

          const tierMatch = (orgObj.description || '').match(/\[TIER:(free|explorer|starter|growth|enterprise)\]/i)
          const activeTierTag = tierMatch ? tierMatch[1].toLowerCase() : (orgObj.subscription_tier || 'starter')
          const cleanDesc = stripTags(orgObj.description)
          const taggedDesc = `${cleanDesc} [TIER:${activeTierTag}] [TOPUP:${newRollover}]`.replace(/\s+/g, ' ').trim()

          await supabaseAdmin
            .from('organizations')
            .update({
              connection_credits: newTotal,
              description: taggedDesc,
              ...(typeof session.customer === 'string'
                ? { stripe_customer_id: session.customer }
                : {}),
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

    // Send real-time onboarding / subscription notification to support@specialsauce.io
    const customerEmail = session.customer_details?.email || session.customer_email || ''
    const userSummary = await resolveUserSummary(userId, customerEmail)
    const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)} ${(session.currency || 'usd').toUpperCase()}`
    const checkoutLabel = packId
      ? `Employer Top-Up Pack (${packId.toUpperCase()})`
      : audience === 'employer_verify' || tierId === 'employer_verify'
      ? 'Employer Verification Pass ($25 One-Time)'
      : tierId
      ? `Plan Tier: ${tierId.toUpperCase()}`
      : `Checkout (${session.mode || 'payment'})`

    await sendRealtimeOpsAlert({
      subject: `💳 [NEW CHECKOUT] ${checkoutLabel} (${amountFormatted}) — ${userSummary.email}`,
      badge: session.mode === 'subscription' ? 'New Subscription' : 'One-Time Purchase / Gate',
      headline: `${checkoutLabel} Completed`,
      details: [
        { label: 'Customer Email', value: userSummary.email },
        { label: 'Member Name', value: userSummary.fullName },
        { label: 'Audience / Role', value: audience || userSummary.role },
        { label: 'Tier / Pack', value: tierId || packId || 'standard' },
        { label: 'Amount Paid', value: amountFormatted },
        { label: 'User / Org ID', value: userId || organizationId || 'N/A' },
        { label: 'Stripe Session ID', value: session.id },
      ],
    })
  }

  // ============================================================================
  // 1B. RECURRING MONTHLY RENEWAL (invoice.payment_succeeded)
  //     - Replenishes Employer monthly Pitch Credits (10 / 35 / 120) while
  //       preserving unused [TOPUP:X] rollover credits.
  //     - Resets Professional ($12/mo) monthly 15-application counter.
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
        // 2) Otherwise check if a Professional Profile holds this subscription
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
  //     - Steps Employer back to Verified Explorer Sandbox ('explorer') while preserving [TOPUP:X]
  //     - Downgrades Professional back to 'explorer' ($0/mo forever passive vault)
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
      const taggedDesc = `${cleanDesc} [TIER:explorer] ${topupTag}`
        .replace(/\s+/g, ' ')
        .trim()

      await supabaseAdmin
        .from('organizations')
        .update({
          subscription_status: 'verified_sandbox',
          subscription_tier: 'explorer',
          connection_credits: preservedRollover,
          description: taggedDesc,
        })
        .eq('id', orgObj.id)
    } else {
      // 2) Check Professional Profile — Downgrade to 'explorer' ($0/mo forever passive vault)
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
            verifiedExplorerPaid: true,
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
  // 2. PROFESSIONAL IDENTITY: Handle successful verification
  // ============================================================================
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    const userId =
      session.metadata?.userId ||
      session.metadata?.user_id ||
      session.client_reference_id

    if (userId) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      const isEmployerRole = existingProfile?.role === 'employer'
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          identity_verified: true,
          is_verified: true,
          ...(isEmployerRole ? {} : { is_discoverable: true }),
        })
        .eq('id', userId)

      if (error) {
        console.error('Database Update Error (Profile Identity):', error)
      } else {
        console.log(`Professional ${userId} successfully verified!`)
        const verifiedUser = await resolveUserSummary(userId, (session as any)?.provided_details?.email)
        const roleLabel = isEmployerRole ? 'Employer' : 'Professional'
        await sendRealtimeOpsAlert({
          subject: `🟢 [ID VERIFIED] ${roleLabel} Identity Verified — ${verifiedUser.email}`,
          badge: 'Stripe Identity Verified',
          headline: `New ${roleLabel} Completed ID Verification`,
          details: [
            { label: 'Account Role', value: roleLabel },
            { label: 'Member Email', value: verifiedUser.email },
            { label: 'Member Name', value: verifiedUser.fullName },
            { label: 'User ID', value: userId },
            { label: 'Discoverable', value: isEmployerRole ? 'N/A (Employer)' : 'true (Live in Vault)' },
            { label: 'Verification ID', value: session.id },
          ],
        })
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
