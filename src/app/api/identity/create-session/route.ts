import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { resolveCandidateTierInfo } from '@/app/dashboard/actions'
import { resolveTrustedAppOrigin, sanitizeInternalReturnPath } from '@/lib/trusted-origin'
import { resolveActiveEmployerTalentShieldTarget } from '@/lib/inbound-shield'
import { getEmployerSponsoredVerificationBalance } from '@/lib/sponsored-verification'
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
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe Identity is not configured' }, { status: 503 })
    }

    const [{ data: profile }, tierInfo] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      resolveCandidateTierInfo(user.id),
    ])

    const isEmployer = profile?.role === 'employer'
    let effectiveTier: string = tierInfo.tier
    if (isEmployer) {
      const { data: memberRow } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(subscription_status, subscription_tier)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      const orgObj: any = Array.isArray(memberRow?.organizations)
        ? memberRow?.organizations[0]
        : memberRow?.organizations
      const subStatus = String(orgObj?.subscription_status || '').toLowerCase()
      const subTier = String(orgObj?.subscription_tier || '').toLowerCase()
      const hasEmployerPlan =
        subStatus === 'active' ||
        subStatus === 'verified_sandbox' ||
        subStatus === 'trialing' ||
        subTier === 'explorer' ||
        subTier === 'starter' ||
        subTier === 'growth' ||
        subTier === 'enterprise' ||
        ((user.email || '').toLowerCase().endsWith('@specialsauce.io') && !(user.email || '').toLowerCase().includes('.demo@'))
      if (!hasEmployerPlan) {
        return NextResponse.json(
          {
            error:
              '1-Time Admin Stripe Identity Verification unlocks automatically as soon as you complete your $25 One-Time Organization Verification Pass (or activate a Founding Partner plan) on Billing & Plans.',
          },
          { status: 403 }
        )
      }
      effectiveTier = 'employer'
    }

    const isVerified =
      profile?.identity_verified === true

    const body = await req.json().catch(() => ({}))
    const bridgeToken = typeof body?.bridgeToken === 'string' ? body.bridgeToken.trim() : ''
    let sponsoredByOrgId = ''

    if (!isEmployer && !isVerified && bridgeToken.startsWith('ss_inv_')) {
      const target = await resolveActiveEmployerTalentShieldTarget(bridgeToken)
      if (!target.active || !target.organizationId) {
        return NextResponse.json(
          { error: 'This Verified Hiring Bridge link is no longer active.' },
          { status: 403 }
        )
      }
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      const sbAdmin = sbUrl && sbKey ? createSupabaseAdminClient(sbUrl, sbKey) : supabase
      const { data: orgObj } = await sbAdmin
        .from('organizations')
        .select('id, subscription_tier, subscription_status, sponsored_verifications_monthly_allowance, sponsored_verifications_monthly_remaining, sponsored_verifications_rollover_balance')
        .eq('id', target.organizationId)
        .maybeSingle()
      const bal = getEmployerSponsoredVerificationBalance(orgObj)
      if (bal.totalAvailable <= 0) {
        return NextResponse.json(
          { error: 'This Employer has reached their monthly Sponsored Verification allowance. They can add a rollover Bridge Pack in Billing & Plans, or you can verify directly with the $5 Explorer Verification Pass.' },
          { status: 403 }
        )
      }
      sponsoredByOrgId = target.organizationId
      effectiveTier = 'bridge_sponsored'
    }

    const guard = await checkAndRecordStripeIdentityCircuitBreaker({
      userId: user.id,
      userEmail: profile?.contact_email || profile?.email || user.email || '',
      candidateTier: effectiveTier,
      isAlreadyVerified: isVerified,
    })

    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason }, { status: 403 })
    }

    const customReturnPath = sanitizeInternalReturnPath(body?.returnTo)
    const origin = resolveTrustedAppOrigin(req)

    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: 'document',
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          user_id: user.id,
          tier: sponsoredByOrgId ? 'bridge_sponsored' : tierInfo.tier,
          ...(sponsoredByOrgId ? { sponsoredByOrgId } : {}),
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
        return_url: customReturnPath ? `${origin}${customReturnPath}` : ( isEmployer ? `${origin}/dashboard/employer/organization?verification=pending` : `${origin}/dashboard?verification=pending`),
      })

    const cookieStore = await cookies()
    cookieStore.set('stripe_vs_id', verificationSession.id, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    await recordHandshakeTelemetry({
      handshakeId: 'stripe_identity_session',
      label: 'Stripe Identity Session Handshake',
      platformArea: 'Stripe Identity Verification (Professional)',
      ok: true,
      latencyMs: Date.now() - startMs,
    })

    return NextResponse.json({ url: verificationSession.url })
  } catch (error: any) {
    await recordHandshakeTelemetry({
      handshakeId: 'stripe_identity_session',
      label: 'Stripe Identity Session Handshake',
      platformArea: 'Stripe Identity Verification (Professional)',
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

export async function PUT() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ verified: false, error: "Unauthorized" }, { status: 401 })
    if (!stripeKey) return NextResponse.json({ verified: false, error: "Stripe Identity is not configured" }, { status: 503 })
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    const sbAdmin = sbUrl && sbKey ? createAdminClient(sbUrl, sbKey) : supabase
    const matchesCurrentUser = (s: any) =>
      Boolean(
        s &&
          (s.client_reference_id === user.id ||
            s.metadata?.userId === user.id ||
            s.metadata?.user_id === user.id)
      )
    const cookieStore = await cookies()
    const vsCookie = cookieStore.get("stripe_vs_id")?.value
    let matchedSession: any = null
    if (vsCookie && /^vs_[A-Za-z0-9]+$/.test(vsCookie)) {
      const s = await stripe.identity.verificationSessions.retrieve(vsCookie).catch(() => null)
      if (matchesCurrentUser(s) && (s?.status === "verified" || s?.status === "processing")) {
        matchedSession = s
      }
    }
    if (!matchedSession) {
      const list = await stripe.identity.verificationSessions.list({ limit: 15 })
      matchedSession = list.data.find((s) => matchesCurrentUser(s) && (s.status === "verified" || s.status === "processing"))
    }
    if (matchedSession?.status === "verified") {
      const { data: profRow } = await sbAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle()
      const isEmployerRole = profRow?.role === "employer"
      await sbAdmin
        .from("profiles")
        .update({
          identity_verified: true,
          is_verified: true,
          ...(isEmployerRole ? {} : { is_discoverable: true }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
      return NextResponse.json({ verified: true, status: "verified" })
    }
    if (matchedSession?.status === "processing") {
      return NextResponse.json({ verified: false, status: "processing" })
    }
    return NextResponse.json({ verified: false })
  } catch (err: any) {
    return NextResponse.json({ verified: false, error: err?.message || "Verification check failed" }, { status: 500 })
  }
}
