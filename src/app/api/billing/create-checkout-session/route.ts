import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export const CANDIDATE_SAAS_TIERS: Record<
  string,
  {
    id: 'explorer' | 'professional' | 'prestige'
    name: string
    priceCents: number
    billingMode: 'payment' | 'subscription'
    envVar: string
    defaultPriceId: string
    description: string
  }
> = {
  explorer: {
    id: 'explorer',
    name: 'Special Sauce - Explorer Plan ($5 One-Time Verification · $0/mo Forever)',
    priceCents: 500,
    billingMode: 'payment',
    envVar: 'STRIPE_PRICE_CANDIDATE_EXPLORER_5_ONETIME',
    defaultPriceId: 'price_1UYCkwLAill3LX5XeuEcLOxC',
    description:
      'One-Time Real-Person ID Verification ($0/mo forever after): Includes Verified Professional Shield, live profile in Employer Search, unlimited employer invitations, and Weekly 1-Year Prestige Drawing entry.',
  },
  candidate_explorer: {
    id: 'explorer',
    name: 'Special Sauce - Explorer Plan ($5 One-Time Verification · $0/mo Forever)',
    priceCents: 500,
    billingMode: 'payment',
    envVar: 'STRIPE_PRICE_CANDIDATE_EXPLORER_5_ONETIME',
    defaultPriceId: 'price_1UYCkwLAill3LX5XeuEcLOxC',
    description:
      'One-Time Real-Person ID Verification ($0/mo forever after): Includes Verified Professional Shield, live profile in Employer Search, unlimited employer invitations, and Weekly 1-Year Prestige Drawing entry.',
  },
  professional: {
    id: 'professional',
    name: 'Special Sauce - Professional Plan ($12/mo)',
    priceCents: 1200,
    billingMode: 'subscription',
    envVar: 'STRIPE_PRICE_CANDIDATE_PROFESSIONAL_12',
    defaultPriceId: 'price_1UYCkxLAill3LX5X9ZT7w1w5',
    description:
      'Includes Real-Person ID Verification, unlimited employer invitations, and 15 outbound protected applications per month. Downgrade to $0/mo Explorer anytime.',
  },
  candidate_pro: {
    id: 'professional',
    name: 'Special Sauce - Professional Plan ($12/mo)',
    priceCents: 1200,
    billingMode: 'subscription',
    envVar: 'STRIPE_PRICE_CANDIDATE_PROFESSIONAL_12',
    defaultPriceId: 'price_1UYCkxLAill3LX5X9ZT7w1w5',
    description:
      'Includes Real-Person ID Verification, unlimited employer invitations, and 15 outbound protected applications per month. Downgrade to $0/mo Explorer anytime.',
  },
  prestige: {
    id: 'prestige',
    name: 'Special Sauce - Prestige Plan ($19/mo)',
    priceCents: 1900,
    billingMode: 'subscription',
    envVar: 'STRIPE_PRICE_CANDIDATE_PRESTIGE_19',
    defaultPriceId: 'price_1UYCkxLAill3LX5XSZkyC6dF',
    description:
      'Includes Real-Person ID Verification, unlimited outbound protected applications, and top-priority placement in Employer Search. Downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.',
  },
  candidate_prestige: {
    id: 'prestige',
    name: 'Special Sauce - Prestige Plan ($19/mo)',
    priceCents: 1900,
    billingMode: 'subscription',
    envVar: 'STRIPE_PRICE_CANDIDATE_PRESTIGE_19',
    defaultPriceId: 'price_1UYCkxLAill3LX5XSZkyC6dF',
    description:
      'Includes Real-Person ID Verification, unlimited outbound protected applications, and top-priority placement in Employer Search. Downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.',
  },
}

export const EMPLOYER_VERIFICATION_PASS = {
  id: 'employer_verify',
  name: 'Special Sauce - Employer Organization Verification Pass ($25 One-Time)',
  priceCents: 0,
  envVar: 'STRIPE_PRICE_EMPLOYER_VERIFY_25_ONETIME',
  defaultPriceId: 'price_1UYCkyLAill3LX5X3jDyohLy',
  description:
    'One-Time Organization Verification Pass ($0/mo Sandbox): Draft roles and preview verified talent matches before activating a monthly plan.',
}

export const EMPLOYER_SAAS_TIERS: Record<
  string,
  {
    id: 'starter' | 'growth' | 'enterprise'
    name: string
    priceCents: number
    retailPriceCents: number
    foundingEnvVar: string
    retailEnvVar: string
    defaultFoundingPriceId: string
    defaultRetailPriceId: string
    maxActiveJobs: number
    monthlyCredits: number
    maxSeats: number
    description: string
  }
> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan ($149/mo Founding Rate — 5 Active Roles & 10 Invitation Credits)',
    priceCents: 14900,
    retailPriceCents: 29900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_STARTER_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_STARTER_RETAIL',
    defaultFoundingPriceId: 'price_1UYCkyLAill3LX5XYaFupN5s',
    defaultRetailPriceId: 'price_1UYCl0LAill3LX5XNQu4NTLo',
    maxActiveJobs: 5,
    monthlyCredits: 10,
    maxSeats: 2,
    description:
      'Locked at $149/mo for your first 12 months ($299/mo Month 13+). Up to 5 active roles, 10 monthly Invitation Credits, and 2 team seats.',
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan ($499/mo Founding Rate — 15 Active Roles & 35 Invitation Credits)',
    priceCents: 49900,
    retailPriceCents: 79900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_RETAIL',
    defaultFoundingPriceId: 'price_1UYCkzLAill3LX5XNVTDyNnN',
    defaultRetailPriceId: 'price_1UYCl0LAill3LX5XalxQ4Uu6',
    maxActiveJobs: 15,
    monthlyCredits: 35,
    maxSeats: 5,
    description:
      'Locked at $499/mo for your first 12 months ($799/mo Month 13+). Up to 15 active roles, 35 monthly Invitation Credits, and 5 team seats.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan ($1,250/mo Founding Rate — Unlimited Roles, 120 Credits & HR Sync)',
    priceCents: 125000,
    retailPriceCents: 199900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_RETAIL',
    defaultFoundingPriceId: 'price_1UYCkzLAill3LX5XWOgUs4m2',
    defaultRetailPriceId: 'price_1UYCl1LAill3LX5XkgUpeLDP',
    maxActiveJobs: 999,
    monthlyCredits: 120,
    maxSeats: 999,
    description:
      'Locked at $1,250/mo for your first 12 months ($1,999/mo Month 13+). Unlimited active roles, 120 monthly Invitation Credits, unlimited seats, and Workday/Greenhouse sync.',
  },
}

export const EMPLOYER_TOPUP_PACKS: Record<
  string,
  {
    id: 'boost' | 'surge' | 'scale'
    name: string
    credits: number
    priceCents: number
    envVar: string
    defaultPriceId: string
    description: string
  }
> = {
  boost: {
    id: 'boost',
    name: 'Boost Invitation Credit Pack (+10 Rollover Credits)',
    credits: 10,
    priceCents: 15000,
    envVar: 'STRIPE_PRICE_TOPUP_BOOST',
    defaultPriceId: 'price_1UYCl1LAill3LX5XB4E8fbpp',
    description:
      '+10 non-expiring Rollover Invitation Credits ($15/invite). Declined invitations are automatically refunded.',
  },
  topup_boost: {
    id: 'boost',
    name: 'Boost Invitation Credit Pack (+10 Rollover Credits)',
    credits: 10,
    priceCents: 15000,
    envVar: 'STRIPE_PRICE_TOPUP_BOOST',
    defaultPriceId: 'price_1UYCl1LAill3LX5XB4E8fbpp',
    description:
      '+10 non-expiring Rollover Invitation Credits ($15/invite). Declined invitations are automatically refunded.',
  },
  surge: {
    id: 'surge',
    name: 'Surge Invitation Credit Pack (+25 Rollover Credits)',
    credits: 25,
    priceCents: 35000,
    envVar: 'STRIPE_PRICE_TOPUP_SURGE',
    defaultPriceId: 'price_1UYCl2LAill3LX5Xru1LvJuh',
    description:
      '+25 non-expiring Rollover Invitation Credits ($14/invite). Declined invitations are automatically refunded.',
  },
  topup_surge: {
    id: 'surge',
    name: 'Surge Invitation Credit Pack (+25 Rollover Credits)',
    credits: 25,
    priceCents: 35000,
    envVar: 'STRIPE_PRICE_TOPUP_SURGE',
    defaultPriceId: 'price_1UYCl2LAill3LX5Xru1LvJuh',
    description:
      '+25 non-expiring Rollover Invitation Credits ($14/invite). Declined invitations are automatically refunded.',
  },
  scale: {
    id: 'scale',
    name: 'Scale Invitation Credit Pack (+75 Rollover Credits)',
    credits: 75,
    priceCents: 90000,
    envVar: 'STRIPE_PRICE_TOPUP_SCALE',
    defaultPriceId: 'price_1UYCl2LAill3LX5XeP7ZpM8C',
    description:
      '+75 non-expiring Rollover Invitation Credits ($12/invite). Declined invitations are automatically refunded.',
  },
  topup_scale: {
    id: 'scale',
    name: 'Scale Invitation Credit Pack (+75 Rollover Credits)',
    credits: 75,
    priceCents: 90000,
    envVar: 'STRIPE_PRICE_TOPUP_SCALE',
    defaultPriceId: 'price_1UYCl2LAill3LX5XeP7ZpM8C',
    description:
      '+75 non-expiring Rollover Invitation Credits ($12/invite). Declined invitations are automatically refunded.',
  },
}

function resolveCanonicalPriceId(envVarName: string, defaultPriceId: string): string {
  const envVal = (process.env[envVarName] || '').trim()
  if (!envVal || !envVal.startsWith('price_1UYC')) {
    return defaultPriceId
  }
  return envVal
}

async function ensureEmployerOrganizationId(supabase: any, user: any): Promise<string | null> {
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (member?.organization_id) return member.organization_id
  const emailDomain = (user.email || '').split('@')[1] || 'company.com'
  const defaultOrgName = user.user_metadata?.company_name || emailDomain.split('.')[0].toUpperCase() || 'New Organization'
  const { data: newOrg } = await supabase
    .from('organizations')
    .insert({ name: defaultOrgName, website_domain: emailDomain, verification_status: 'unverified', subscription_tier: 'free' })
    .select('id')
    .single()
  if (newOrg?.id) {
    await supabase.from('organization_members').insert({ organization_id: newOrg.id, user_id: user.id, role: 'owner' })
    return newOrg.id
  }
  return null
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const rawKey = (body?.tierId || body?.packId || body?.tier || body?.plan || body?.targetId || '').toLowerCase().trim()
    const rateType = (body?.rateType || 'founding').toLowerCase().trim()

    const stripeKey =
      process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY || ''
    if (!stripeKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not configured in .env.local yet. Use the QA controls below to test plans locally.',
        },
        { status: 400 }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-09-30.endive' as any,
    })

    const origin = req.headers.get('origin') || 'https://www.specialsauce.io'

    // 1. PROFESSIONAL PLANS
    const candidateTier = CANDIDATE_SAAS_TIERS[rawKey]
    if (candidateTier) {
      const catalogPriceId = resolveCanonicalPriceId(candidateTier.envVar, candidateTier.defaultPriceId)
      const isOneTimeExplorer = candidateTier.billingMode === 'payment'

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: isOneTimeExplorer ? 'payment' : 'subscription',
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          audience: 'candidate',
          planType: `candidate_${candidateTier.id}`,
          userId: user.id,
          tierId: candidateTier.id,
        },
        line_items: [
          (catalogPriceId && candidateTier.priceCents > 0)
            ? { price: catalogPriceId, quantity: 1 }
            : {
                price_data: {
                  currency: 'usd',
                  unit_amount: candidateTier.priceCents,
                  ...(isOneTimeExplorer ? {} : { recurring: { interval: 'month' } }),
                  product_data: {
                    tax_code: 'txcd_10103001',
                    name: candidateTier.name,
                    description: candidateTier.description,
                  },
                },
                quantity: 1,
              },
        ],
        ...(candidateTier.billingMode === 'subscription' ? { payment_method_collection: 'always' as const } : {}),
        ...(isOneTimeExplorer
          ? (candidateTier.priceCents > 0 ? { invoice_creation: { enabled: true } } : {})
          : {
              subscription_data: {
                metadata: {
                  audience: 'candidate',
                  userId: user.id,
                  tierId: candidateTier.id,
                },
              },
            }),
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        success_url: body?.fromOnboarding ? `${origin}/onboarding?billing=success&plan=${candidateTier.id}&session_id={CHECKOUT_SESSION_ID}` : `${origin}/dashboard/billing?billing=success&plan=${candidateTier.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body?.fromOnboarding ? `${origin}/onboarding?billing=cancelled` : `${origin}/dashboard/billing?billing=cancelled`,
      })

      const cookieStore = await cookies()
      cookieStore.set('stripe_candidate_cs_id', checkoutSession.id, {
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // 1B. EMPLOYER ONE-TIME ORGANIZATION VERIFICATION PASS ($25)
    if (rawKey === 'employer_verify' || rawKey === 'verify_org' || rawKey === 'employer_explorer') {
      const autoOrgId = await ensureEmployerOrganizationId(supabase, user)
      const member = autoOrgId ? { organization_id: autoOrgId } : null

      if (!member?.organization_id) {
        return NextResponse.json(
          { error: 'Please set up your Company Profile before completing Organization Verification.' },
          { status: 400 }
        )
      }

      const catalogPriceId =
        resolveCanonicalPriceId(EMPLOYER_VERIFICATION_PASS.envVar, EMPLOYER_VERIFICATION_PASS.defaultPriceId)

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email,
        client_reference_id: member.organization_id,
        metadata: {
          audience: 'employer_verify',
          organizationId: member.organization_id,
          userId: user.id,
          tierId: 'employer_verify',
        },
        line_items: [
          catalogPriceId
            ? { price: catalogPriceId, quantity: 1 }
            : {
                price_data: {
                  currency: 'usd',
                  unit_amount: EMPLOYER_VERIFICATION_PASS.priceCents,
                  product_data: {
                    tax_code: 'txcd_10103001',
                    name: EMPLOYER_VERIFICATION_PASS.name,
                    description: EMPLOYER_VERIFICATION_PASS.description,
                  },
                },
                quantity: 1,
              },
        ],
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
        invoice_creation: { enabled: true },
        success_url: body?.fromOnboarding ? `${origin}/onboarding?billing=verify_success&session_id={CHECKOUT_SESSION_ID}` : `${origin}/dashboard/employer/billing?billing=verify_success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body?.fromOnboarding ? `${origin}/onboarding?billing=cancelled` : `${origin}/dashboard/employer/billing?billing=cancelled`,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // 2. EMPLOYER TOP-UP CREDIT PACKS (BOOST $150 / SURGE $350 / SCALE $900)
    const topupPack = EMPLOYER_TOPUP_PACKS[rawKey]
    if (topupPack) {
      const autoOrgId = await ensureEmployerOrganizationId(supabase, user)
      const member = autoOrgId ? { organization_id: autoOrgId } : null

      if (!member?.organization_id) {
        return NextResponse.json(
          { error: 'Please set up your Company Profile before purchasing Top-Up Credits.' },
          { status: 400 }
        )
      }

      const catalogPriceId = resolveCanonicalPriceId(topupPack.envVar, topupPack.defaultPriceId)

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email,
        client_reference_id: member.organization_id,
        metadata: {
          audience: 'employer_topup',
          organizationId: member.organization_id,
          userId: user.id,
          packId: topupPack.id,
          creditsToAdd: String(topupPack.credits),
        },
        line_items: [
          catalogPriceId
            ? { price: catalogPriceId, quantity: 1 }
            : {
                price_data: {
                  currency: 'usd',
                  unit_amount: topupPack.priceCents,
                  product_data: {
                    tax_code: 'txcd_10103001',
                    name: topupPack.name,
                    description: topupPack.description,
                  },
                },
                quantity: 1,
              },
        ],
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
        invoice_creation: { enabled: true },
        success_url: `${origin}/dashboard/employer/billing?billing=topup_success&pack=${topupPack.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body?.fromOnboarding ? `${origin}/onboarding?billing=cancelled` : `${origin}/dashboard/employer/billing?billing=cancelled`,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // 3. EMPLOYER SUBSCRIPTIONS ($149 / $499 / $1,250)
    const tier = EMPLOYER_SAAS_TIERS[rawKey]
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or top-up pack selected.' },
        { status: 400 }
      )
    }

    const autoOrgId = await ensureEmployerOrganizationId(supabase, user)
      const member = autoOrgId ? { organization_id: autoOrgId } : null

    if (!member?.organization_id) {
      return NextResponse.json(
        { error: 'Please set up your Company Profile before subscribing to a plan.' },
        { status: 400 }
      )
    }

    const isRetail = rateType === 'retail'
    const catalogPriceId = isRetail
      ? resolveCanonicalPriceId(tier.retailEnvVar, tier.defaultRetailPriceId)
      : resolveCanonicalPriceId(tier.foundingEnvVar, tier.defaultFoundingPriceId)

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: member.organization_id,
      metadata: {
        audience: 'employer',
        organizationId: member.organization_id,
        userId: user.id,
        tierId: tier.id,
        rateType: isRetail ? 'retail' : 'founding',
        maxActiveJobs: String(tier.maxActiveJobs),
        creditsToAdd: String(tier.monthlyCredits),
        maxSeats: String(tier.maxSeats),
      },
      line_items: [
        catalogPriceId
          ? { price: catalogPriceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: isRetail ? tier.retailPriceCents : tier.priceCents,
                recurring: { interval: 'month' },
                product_data: {
                  tax_code: 'txcd_10103001',
                  name: tier.name,
                  description: tier.description,
                },
              },
              quantity: 1,
            },
      ],
      payment_method_collection: 'always',
      subscription_data: {
        metadata: {
          audience: 'employer',
          organizationId: member.organization_id,
          userId: user.id,
          tierId: tier.id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
      success_url: body?.fromOnboarding ? `${origin}/onboarding?billing=success&tier=${tier.id}&session_id={CHECKOUT_SESSION_ID}` : `${origin}/dashboard/employer/billing?billing=success&tier=${tier.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body?.fromOnboarding ? `${origin}/onboarding?billing=cancelled` : `${origin}/dashboard/employer/billing?billing=cancelled`,
    })

    const cookieStore = await cookies()
    cookieStore.set('stripe_billing_cs_id', checkoutSession.id, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe Subscription Checkout Error:', error)
    return NextResponse.json(
      {
        error:
          error.message ||
          'Stripe Checkout failed. Check your Stripe API permissions or use the QA controls below.',
      },
      { status: 500 }
    )
  }
}
