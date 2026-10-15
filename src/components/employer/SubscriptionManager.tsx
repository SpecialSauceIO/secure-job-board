import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { SubmitButton } from '@/components/SubmitButton'

export async function SubscriptionManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get the employer's organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) return null

  // Fetch the organization to check its subscription status
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('id', member.organization_id)
    .single()

  const isSubscribed = org?.subscription_status === 'active'

  // INLINE SERVER ACTION for Stripe Checkout
  async function checkout() {
    'use server'
    
    // Initialize Stripe using the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20' as any, 
    })
    
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      managed_payments: { enabled: false } as any, // Bypasses the new Stripe tax code requirement
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/dashboard?checkout=canceled`,
      client_reference_id: member.organization_id, // This tells Stripe which company paid!
      customer_email: user.email,
    })

    if (session.url) {
      redirect(session.url)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Employer Pro Plan</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isSubscribed 
              ? 'Your subscription is active. You have full access to post jobs and review candidates.' 
              : 'Upgrade to the Pro plan to unlock job posting and team management features.'}
          </p>
        </div>
        
        {isSubscribed ? (
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-bold text-sm">
            Active Subscription
          </span>
        ) : (
          <form action={checkout}>
            <SubmitButton pendingText="Redirecting..." className="bg-indigo-600 px-6 py-2 text-white font-bold rounded-md hover:bg-indigo-500 shadow-sm whitespace-nowrap">
              Upgrade Now
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  )
}