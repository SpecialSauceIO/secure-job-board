import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { recordHandshakeTelemetry, raiseSecurityAlertAndFlag } from '@/lib/security-telemetry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
})

// We must use the Supabase Service Role key here to bypass RLS security policies.
// Because Stripe is calling this endpoint (not a logged-in user), standard auth won't work.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  // 1. EMPLOYER PAYMENTS: Handle checkout completion
  // ============================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const organizationId = session.client_reference_id

    if (organizationId) {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ 
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string
        })
        .eq('id', organizationId)

      if (error) console.error('Database Update Error (Organization):', error)
    }
  }

  // ============================================================================
  // 2. CANDIDATE IDENTITY: Handle successful verification
  // ============================================================================
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession
    
    // Extract the Supabase User ID we planted in the metadata when creating the session
    const userId = session.metadata?.userId

    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ identity_verified: true })
        .eq('id', userId)

      if (error) {
        console.error('Database Update Error (Profile Identity):', error)
      } else {
        console.log(`✅ Candidate ${userId} successfully verified!`)
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