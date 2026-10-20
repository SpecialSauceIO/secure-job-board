import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export const EMPLOYER_SAAS_TIERS: Record<
  string,
  {
    id: 'starter' | 'growth' | 'enterprise'
    name: string
    priceCents: number
    maxActiveJobs: number
    monthlyCredits: number
    description: string
  }
> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan ($99/mo — 5 Active Roles & 10 Pitch Credits)',
    priceCents: 9900,
    maxActiveJobs: 5,
    monthlyCredits: 10,
    description:
      'Up to 5 simultaneous active blind job postings and 10 monthly passive candidate pitch credits (2:1 ratio).',
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan ($299/mo — 15 Active Roles & 30 Pitch Credits)',
    priceCents: 29900,
    maxActiveJobs: 15,
    monthlyCredits: 30,
    description:
      'Up to 15 simultaneous active blind job postings, 30 monthly passive candidate pitch credits (2:1 ratio), and credit rollover.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan ($899/mo — 50 Active Roles, 100 Credits + ATS Sync)',
    priceCents: 89900,
    maxActiveJobs: 50,
    monthlyCredits: 100,
    description:
      'Up to 50 simultaneous active blind job postings, 100 monthly pitch credits (2:1 ratio), and Workday/Greenhouse ATS webhook integration.',
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
    const tierId = (body?.tierId || body?.packId || '').toLowerCase()

    const stripeKey =
      process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY || ''
    if (!stripeKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not configured in .env.local yet. Use the Developer Sandbox Switcher below to activate this plan locally, or add STRIPE_SECRET_KEY=sk_test_... to .env.local.',
        },
        { status: 400 }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-09-30.endive' as any,
    })

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // =========================================================================
    // CANDIDATE PRO PASS ($9/MONTH SUBSCRIPTION)
    // =========================================================================
    if (tierId === 'candidate_pro') {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          planType: 'candidate_pro',
          userId: user.id,
          tierId: 'pro',
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 900, // $9.00 / month
              recurring: {
                interval: 'month',
              },
              product_data: {
                name: 'Candidate Pro Pass ($9/mo)',
                description:
                  'Unlimited blind job applications (40%+ AI Match required), priority spotlight in Employer Talent Search, and full AI Fit Radar access.',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/dashboard/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
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
    // EMPLOYER SAAS TIERS ($99 / $299 / $899 PER MONTH)
    // =========================================================================
    const tier = EMPLOYER_SAAS_TIERS[tierId]
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid subscription tier selected.' },
        { status: 400 }
      )
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member?.organization_id) {
      return NextResponse.json(
        { error: 'Please set up your Company Profile before subscribing to a plan.' },
        { status: 400 }
      )
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: member.organization_id,
      metadata: {
        organizationId: member.organization_id,
        userId: user.id,
        tierId: tier.id,
        maxActiveJobs: String(tier.maxActiveJobs),
        creditsToAdd: String(tier.monthlyCredits),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tier.priceCents,
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: tier.name,
              description: tier.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/employer/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
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
          'Stripe Checkout failed. If you are using a Restricted Identity Key (rk_test_...), add your standard STRIPE_SECRET_KEY (sk_test_...) to .env.local or use the Developer Sandbox Switcher below.',
      },
      { status: 500 }
    )
  }
}