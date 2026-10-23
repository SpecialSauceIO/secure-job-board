import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveCandidateTierInfo } from '@/app/dashboard/actions'
import {
  checkAndRecordStripeIdentityCircuitBreaker,
  recordHandshakeTelemetry,
} from '@/lib/security-telemetry'
import Stripe from 'stripe'

const stripeKey =
  process.env.STRIPE_IDENTITY_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''

const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-09-30.endive' as any,
})

export async function POST(req: Request) {
  const startMs = Date.now()
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: profile }, tierInfo] = await Promise.all([
      supabase
        .from('profiles')
        .select('identity_verified, verification_status, email, contact_email')
        .eq('id', user.id)
        .single(),
      resolveCandidateTierInfo(user.id),
    ])

    const isVerified =
      profile?.identity_verified === true ||
      profile?.verification_status === 'verified'

    const guard = await checkAndRecordStripeIdentityCircuitBreaker({
      userId: user.id,
      userEmail: profile?.contact_email || profile?.email || user.email || '',
      candidateTier: tierInfo.tier,
      isAlreadyVerified: isVerified,
    })

    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason }, { status: 403 })
    }

    const origin = req.headers.get('origin') || 'https://www.specialsauce.io'

    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: 'document',
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          user_id: user.id,
          tier: tierInfo.tier,
        },
        provided_details: {
          email: profile?.contact_email || profile?.email || user.email || undefined,
        },
        options: {
          document: {
            allowed_types: ['driving_license', 'passport', 'id_card'],
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        return_url: `${origin}/dashboard?verification=pending`,
      })

    const cookieStore = await cookies()
    cookieStore.set('stripe_vs_id', verificationSession.id, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    })

    await recordHandshakeTelemetry({
      handshakeId: 'stripe_identity_session',
      label: 'Stripe Identity Session Handshake',
      platformArea: 'Stripe Identity Verification (Candidate)',
      ok: true,
      latencyMs: Date.now() - startMs,
    })

    return NextResponse.json({ url: verificationSession.url })
  } catch (error: any) {
    await recordHandshakeTelemetry({
      handshakeId: 'stripe_identity_session',
      label: 'Stripe Identity Session Handshake',
      platformArea: 'Stripe Identity Verification (Candidate)',
      ok: false,
      latencyMs: Date.now() - startMs,
      errorDetail: error?.message || 'Stripe Identity session error',
    })
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
