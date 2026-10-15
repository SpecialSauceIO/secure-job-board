import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_IDENTITY_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''

// Initialize Stripe with your Restricted Identity Key and latest API version
const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-09-30.endive' as any,
})

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user via Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the origin URL safely for the redirect back to your app
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // 3. Create the Stripe Identity Verification Session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        user_id: user.id,
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url: `${origin}/dashboard?verification=pending`,
    })

    // 4. Store the Verification Session ID in a cookie so /dashboard can retrieve it directly on return
    const cookieStore = await cookies()
    cookieStore.set('stripe_vs_id', verificationSession.id, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    })

    // 5. Return the hosted Stripe URL to the client
    return NextResponse.json({ url: verificationSession.url })

  } catch (error: any) {
    console.error('Stripe Identity Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}