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
    envVar: string
    defaultPriceId: string
    description: string
  }
> = {
  explorer: {
    id: 'explorer',
    name: 'Special Sauce - Candidate Explorer Plan ($3/mo)',
    priceCents: 300,
    envVar: 'STRIPE_PRICE_CANDIDATE_EXPLORER',
    defaultPriceId: 'price_1UU2OnR0rSVwN0zEdfBhqFRZ',
    description:
      'ID-Verified Passive & Inbound Tier: Includes 1-time Real-Person ID Verification, live placement in Employer Talent Search, and unlimited inbound employer pitch unlocks.',
  },
  candidate_explorer: {
    id: 'explorer',
    name: 'Special Sauce - Candidate Explorer Plan ($3/mo)',
    priceCents: 300,
    envVar: 'STRIPE_PRICE_CANDIDATE_EXPLORER',
    defaultPriceId: 'price_1UU2OnR0rSVwN0zEdfBhqFRZ',
    description:
      'ID-Verified Passive & Inbound Tier: Includes 1-time Real-Person ID Verification, live placement in Employer Talent Search, and unlimited inbound employer pitch unlocks.',
  },
  professional: {
    id: 'professional',
    name: 'Special Sauce - Candidate Professional Plan ($9/mo)',
    priceCents: 900,
    envVar: 'STRIPE_PRICE_CANDIDATE_PROFESSIONAL',
    defaultPriceId: 'price_1UTpwyR0rSVwN0zEQeqE0pvy',
    description:
      'ID-Verified Active Tier: Unlock and accept unlimited inbound employer pitches, plus 15 outbound protected applications/month (40%+ AI Fit).',
  },
  candidate_pro: {
    id: 'professional',
    name: 'Special Sauce - Candidate Professional Plan ($9/mo)',
    priceCents: 900,
    envVar: 'STRIPE_PRICE_CANDIDATE_PROFESSIONAL',
    defaultPriceId: 'price_1UTpwyR0rSVwN0zEQeqE0pvy',
    description:
      'ID-Verified Active Tier: Unlock and accept unlimited inbound employer pitches, plus 15 outbound protected applications/month (40%+ AI Fit).',
  },
  prestige: {
    id: 'prestige',
    name: 'Special Sauce - Candidate Prestige Plan ($15/mo)',
    priceCents: 1500,
    envVar: 'STRIPE_PRICE_CANDIDATE_PRESTIGE',
    defaultPriceId: 'price_1UTpwyR0rSVwN0zETADS2cmp',
    description:
      'Priority Spotlight & Unlimited: Unlimited outbound protected applications (40%+ AI Fit), top-priority placement in Employer Talent Search, and priority shortlist placement.',
  },
  candidate_prestige: {
    id: 'prestige',
    name: 'Special Sauce - Candidate Prestige Plan ($15/mo)',
    priceCents: 1500,
    envVar: 'STRIPE_PRICE_CANDIDATE_PRESTIGE',
    defaultPriceId: 'price_1UTpwyR0rSVwN0zETADS2cmp',
    description:
      'Priority Spotlight & Unlimited: Unlimited outbound protected applications (40%+ AI Fit), top-priority placement in Employer Talent Search, and priority shortlist placement.',
  },
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
    name: 'Starter Plan ($149/mo Founding Partner Rate — $299/mo Retail — 5 Active Roles & 10 Pitch Credits)',
    priceCents: 14900,
    retailPriceCents: 29900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_STARTER_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_STARTER_RETAIL',
    defaultFoundingPriceId: 'price_1UTpwyR0rSVwN0zEa6QpXA8F',
    defaultRetailPriceId: 'price_1UTpwzR0rSVwN0zEabaW5Sta',
    maxActiveJobs: 5,
    monthlyCredits: 10,
    maxSeats: 2,
    description:
      'Up to 5 simultaneous active protected job postings, 10 monthly passive candidate pitch credits, and 2 team seats.',
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan ($499/mo Founding Partner Rate — $799/mo Retail — 15 Active Roles & 35 Pitch Credits)',
    priceCents: 49900,
    retailPriceCents: 79900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_GROWTH_RETAIL',
    defaultFoundingPriceId: 'price_1UTpwzR0rSVwN0zEtmTHVCBd',
    defaultRetailPriceId: 'price_1UTpx0R0rSVwN0zElkkrbtTG',
    maxActiveJobs: 15,
    monthlyCredits: 35,
    maxSeats: 5,
    description:
      'Up to 15 simultaneous active protected job postings, 35 monthly passive candidate pitch credits, and 5 team/recruiter seats.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan ($1,250/mo Founding Partner Rate — $1,999/mo Retail — Unlimited Roles, 120 Credits + HR Software Sync)',
    priceCents: 125000,
    retailPriceCents: 199900,
    foundingEnvVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_FOUNDING',
    retailEnvVar: 'STRIPE_PRICE_EMPLOYER_ENTERPRISE_RETAIL',
    defaultFoundingPriceId: 'price_1UTpwzR0rSVwN0zExo1SFwbL',
    defaultRetailPriceId: 'price_1UTpx0R0rSVwN0zEnC8VnVET',
    maxActiveJobs: 999,
    monthlyCredits: 120,
    maxSeats: 999,
    description:
      'Unlimited simultaneous active protected job postings, 120 monthly pitch credits, unlimited seats, and Workday/Greenhouse ATS webhook integration.',
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
    name: 'Boost Pitch Credit Top-Up (+10 Rollover Credits)',
    credits: 10,
    priceCents: 15000,
    envVar: 'STRIPE_PRICE_TOPUP_BOOST',
    defaultPriceId: 'price_1UTpx0R0rSVwN0zEKbw5XRnc',
    description:
      '+10 non-expiring Rollover Pitch Credits ($15.00/pitch) protected by our 100% Accepted-Only Credit Guarantee.',
  },
  topup_boost: {
    id: 'boost',
    name: 'Boost Pitch Credit Top-Up (+10 Rollover Credits)',
    credits: 10,
    priceCents: 15000,
    envVar: 'STRIPE_PRICE_TOPUP_BOOST',
    defaultPriceId: 'price_1UTpx0R0rSVwN0zEKbw5XRnc',
    description:
      '+10 non-expiring Rollover Pitch Credits ($15.00/pitch) protected by our 100% Accepted-Only Credit Guarantee.',
  },
  surge: {
    id: 'surge',
    name: 'Surge Pitch Credit Top-Up (+25 Rollover Credits)',
    credits: 25,
    priceCents: 32500,
    envVar: 'STRIPE_PRICE_TOPUP_SURGE',
    defaultPriceId: 'price_1UTpx1R0rSVwN0zEHHg42r6s',
    description:
      '+25 non-expiring Rollover Pitch Credits ($13.00/pitch - Save 13%) protected by our 100% Accepted-Only Credit Guarantee.',
  },
  topup_surge: {
    id: 'surge',
    name: 'Surge Pitch Credit Top-Up (+25 Rollover Credits)',
    credits: 25,
    priceCents: 32500,
    envVar: 'STRIPE_PRICE_TOPUP_SURGE',
    defaultPriceId: 'price_1UTpx1R0rSVwN0zEHHg42r6s',
    description:
      '+25 non-expiring Rollover Pitch Credits ($13.00/pitch - Save 13%) protected by our 100% Accepted-Only Credit Guarantee.',
  },
  scale: {
    id: 'scale',
    name: 'Scale Pitch Credit Top-Up (+75 Rollover Credits)',
    credits: 75,
    priceCents: 82500,
    envVar: 'STRIPE_PRICE_TOPUP_SCALE',
    defaultPriceId: 'price_1UTpx1R0rSVwN0zEMGzzbsQV',
    description:
      '+75 non-expiring Rollover Pitch Credits ($11.00/pitch - Save 27%) protected by our 100% Accepted-Only Credit Guarantee.',
  },
  topup_scale: {
    id: 'scale',
    name: 'Scale Pitch Credit Top-Up (+75 Rollover Credits)',
    credits: 75,
    priceCents: 82500,
    envVar: 'STRIPE_PRICE_TOPUP_SCALE',
    defaultPriceId: 'price_1UTpx1R0rSVwN0zEMGzzbsQV',
    description:
      '+75 non-expiring Rollover Pitch Credits ($11.00/pitch - Save 27%) protected by our 100% Accepted-Only Credit Guarantee.',
  },
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
    const rawKey = (body?.tierId || body?.packId || '').toLowerCase().trim()
    const rateType = (body?.rateType || 'founding').toLowerCase().trim()

    const stripeKey =
      process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY || ''
    if (!stripeKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not configured in .env.local yet. Use the QA Sandbox controls below to test plans locally.',
        },
        { status: 400 }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-09-30.endive' as any,
    })

    const origin = req.headers.get('origin') || 'https://www.specialsauce.io'

    // =========================================================================
    // 1. CANDIDATE SUBSCRIPTIONS: PROFESSIONAL ($9/MO) & PRESTIGE ($15/MO)
    // =========================================================================
    const candidateTier = CANDIDATE_SAAS_TIERS[rawKey]
    if (candidateTier) {
      const catalogPriceId = process.env[candidateTier.envVar] || candidateTier.defaultPriceId

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          audience: 'candidate',
          planType: `candidate_${candidateTier.id}`,
          userId: user.id,
          tierId: candidateTier.id,
        },
        line_items: [
          catalogPriceId
            ? { price: catalogPriceId, quantity: 1 }
            : {
                price_data: {
                  currency: 'usd',
                  unit_amount: candidateTier.priceCents,
                  recurring: { interval: 'month' },
                  product_data: { tax_code: "txcd_10103001", name: candidateTier.name,
                    description: candidateTier.description,
                  },
                },
                quantity: 1,
              },
        ],
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        custom_text: {
          submit: {
            message:
              '🔒 Identity-Protected Privacy Guarantee: Your payment details are encrypted by Stripe and never shared with employers. Cancel anytime in 1 click.',
          },
        },
        success_url: `${origin}/dashboard/billing?billing=success&plan=${candidateTier.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/billing?billing=cancelled`,
      })

      const cookieStore = await cookies()
      cookieStore.set('stripe_candidate_cs_id', checkoutSession.id, {
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // =========================================================================
    // 2. EMPLOYER TOP-UP CREDIT PACKS (BOOST $150 / SURGE $325 / SCALE $825)
    // =========================================================================
    const topupPack = EMPLOYER_TOPUP_PACKS[rawKey]
    if (topupPack) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!member?.organization_id) {
        return NextResponse.json(
          { error: 'Please set up your Company Profile before purchasing Top-Up Credits.' },
          { status: 400 }
        )
      }

      const catalogPriceId = process.env[topupPack.envVar] || topupPack.defaultPriceId

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
                  product_data: { tax_code: "txcd_10103001", name: topupPack.name,
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
        custom_text: {
          submit: {
            message:
              '🔒 100% Accepted-Only Guarantee: Rollover Pitch Credits never expire and are added to your organization balance immediately.',
          },
        },
        success_url: `${origin}/dashboard/employer/billing?billing=topup_success&pack=${topupPack.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/employer/billing?billing=cancelled`,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // =========================================================================
    // 3. EMPLOYER SAAS SUBSCRIPTIONS ($149 / $499 / $1,250 FOUNDING OR RETAIL)
    // =========================================================================
    const tier = EMPLOYER_SAAS_TIERS[rawKey]
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or top-up pack selected.' },
        { status: 400 }
      )
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member?.organization_id) {
      return NextResponse.json(
        { error: 'Please set up your Company Profile before subscribing to a plan.' },
        { status: 400 }
      )
    }

    const isRetail = rateType === 'retail'
    const catalogPriceId = isRetail ? (process.env[tier.retailEnvVar] || tier.defaultRetailPriceId) : (process.env[tier.foundingEnvVar] || tier.defaultFoundingPriceId)

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
                product_data: { tax_code: "txcd_10103001", name: tier.name,
                  description: tier.description,
                },
              },
              quantity: 1,
            },
      ],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
      custom_text: {
        submit: {
          message:
            '🔒 Protected by our 100% Accepted-Only Pitch Credit Guarantee. Manage seats, invoices, or cancel anytime from your Employer Billing dashboard.',
        },
      },
      success_url: `${origin}/dashboard/employer/billing?billing=success&tier=${tier.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/employer/billing?billing=cancelled`,
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
          'Stripe Checkout failed. Check your Stripe API permissions or use the QA Sandbox controls below.',
      },
      { status: 500 }
    )
  }
}
