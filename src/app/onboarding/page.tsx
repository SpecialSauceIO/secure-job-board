'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import OnboardingPlanStep from '@/components/OnboardingPlanStep'
import {
  activateSandboxCandidateTier,
  activateSandboxEmployerTier,
} from '@/app/dashboard/actions'

export default function OnboardingStepTwoPage() {
  const router = useRouter()
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate')
  const [email, setEmail] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [statusText, setStatusText] = useState<string>('Loading Step 2: Identity Verification & Plan Selection...')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      setEmail(user.email || '')
      const metaRole = user.user_metadata?.role === 'employer' ? 'employer' : 'candidate'
      const { data: prof } = await supabase.from('profiles').select('role, identity_verified, is_verified, subscription_tier').eq('id', user.id).maybeSingle()
      const resolvedRole = (prof?.role === 'employer' || metaRole === 'employer') ? 'employer' : 'candidate'
      setRole(resolvedRole)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const billingStatus = params.get('billing')
        const sessionId = params.get('session_id')
        const planParam = params.get('plan') as 'explorer' | 'professional' | 'prestige' | null
        const tierParam = params.get('tier') as 'starter' | 'growth' | 'enterprise' | null

        if (billingStatus === 'success' && sessionId && planParam && ['explorer', 'professional', 'prestige'].includes(planParam)) {
          setStatusText('Confirming your Stripe verification & activating your workspace...')
          await activateSandboxCandidateTier(planParam, sessionId)
          router.replace('/dashboard')
          router.refresh()
          return
        }
        if (billingStatus === 'success' && sessionId && tierParam && ['starter', 'growth', 'enterprise'].includes(tierParam)) {
          setStatusText('Confirming your Stripe plan & activating your employer workspace...')
          await activateSandboxEmployerTier(tierParam, sessionId)
          router.replace('/dashboard')
          router.refresh()
          return
        }
        if (billingStatus === 'verify_success' && sessionId) {
          setStatusText('Confirming your Employer Verification Pass & unlocking your workspace...')
          await activateSandboxEmployerTier('free', sessionId)
          const { data: mem } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
          if (mem?.organization_id) {
            await supabase.from('organizations').update({ verification_status: 'verified' }).eq('id', mem.organization_id)
          }
          await supabase.from('profiles').update({ is_verified: true, identity_verified: true }).eq('id', user.id)
          router.replace('/dashboard')
          router.refresh()
          return
        }
      }

      if (resolvedRole === 'candidate') {
        const tier = String(prof?.subscription_tier || '').toLowerCase()
        if (Boolean(prof?.identity_verified || prof?.is_verified) || ['explorer', 'professional', 'prestige', 'pro'].includes(tier)) {
          router.replace('/dashboard')
          return
        }
      } else {
        const { data: mem } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
        if (mem?.organization_id) {
          const { data: org } = await supabase.from('organizations').select('verification_status, subscription_tier').eq('id', mem.organization_id).maybeSingle()
          if (org?.verification_status === 'verified' || ['starter', 'growth', 'enterprise'].includes(String(org?.subscription_tier || '').toLowerCase())) {
            router.replace('/dashboard')
            return
          }
        }
      }
      setReady(true)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060B14] text-white">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {ready ? (
          <OnboardingPlanStep role={role} userEmail={email} onSignOut={handleSignOut} />
        ) : (
          <div className="text-sm text-slate-400 font-semibold">{statusText}</div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
