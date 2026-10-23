import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

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

    const body = await req.json().catch(() => ({}))
    const audience = body?.audience === 'employer' ? 'employer' : 'candidate'

    const stripeKey =
      process.env.STRIPE_SECRET_KEY || process.env.STRIPE_IDENTITY_SECRET_KEY || ''
    if (!stripeKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not configured in .env.local yet. Use the QA Sandbox controls on this page to switch plans locally.',
        },
        { status: 400 }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-09-30.endive' as any,
    })

    const origin = req.headers.get('origin') || 'https://www.specialsauce.io'
    let stripeCustomerId: string | null = null

    if (audience === 'employer') {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (member?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('stripe_customer_id, name')
          .eq('id', member.organization_id)
          .maybeSingle()

        if (org?.stripe_customer_id) {
          stripeCustomerId = org.stripe_customer_id
        }
      }
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('structured_skills')
        .eq('id', user.id)
        .maybeSingle()

      const skills = Array.isArray(profile?.structured_skills)
        ? profile.structured_skills
        : []
      const meta = skills.find(
        (item: any) => item && typeof item === 'object' && item._ss_meta
      )
      if (meta?.stripeCustomerId) {
        stripeCustomerId = meta.stripeCustomerId
      }
    }

    // Fallback: search existing Stripe Customers by email or create one so Portal works seamlessly in Sandbox/Live
    if (!stripeCustomerId && user.email) {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id
      } else {
        const createdCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
            audience,
          },
        })
        stripeCustomerId = createdCustomer.id
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            'No active Stripe billing profile found for your account yet. Subscribe to a plan first or use the QA Sandbox controls below.',
        },
        { status: 400 }
      )
    }

    const returnUrl =
      audience === 'employer'
        ? `${origin}/dashboard/employer/billing`
        : `${origin}/dashboard/billing`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Stripe Customer Portal Error:', error)
    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to open Stripe Customer Portal. Ensure the Customer Portal is saved in your Stripe Dashboard settings.',
      },
      { status: 500 }
    )
  }
}
