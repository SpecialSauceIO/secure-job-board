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
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [launchingId, setLaunchingId] = useState(false)
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
      const { data: prof } = await supabase.from('profiles').select('role, identity_verified, is_verified, structured_skills').eq('id', user.id).maybeSingle()
      const resolvedRole = (prof?.role === 'employer' || metaRole === 'employer') ? 'employer' : 'candidate'
      setRole(resolvedRole)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const billingStatus = params.get('billing')
        const identityStatus = params.get('identity')
        const sessionId = params.get('session_id')
        const planParam = params.get('plan') as 'explorer' | 'professional' | 'prestige' | null
        const tierParam = params.get('tier') as 'starter' | 'growth' | 'enterprise' | null

        const launchStripeIdentityOrEnterDashboard = async () => {
          const { data: latestProf } = await supabase.from('profiles').select('identity_verified, is_verified').eq('id', user.id).maybeSingle()
          if (latestProf?.identity_verified === true || latestProf?.is_verified === true) {
            router.replace('/dashboard')
            router.refresh()
            return
          }
          setStatusText('Payment confirmed! Redirecting to Stripe Identity for your 1-time government ID & selfie check...')
          const idRes = await fetch('/api/identity/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ returnTo: '/onboarding?identity=complete' }),
          }).catch(() => null)
          const idData = idRes ? await idRes.json().catch(() => null) : null
          if (idData?.url) {
            window.location.href = idData.url
            return
          }
          router.replace('/dashboard')
          router.refresh()
        }

        if (identityStatus === 'complete') {
          setStatusText('Confirming your Stripe Identity document & selfie verification...')
          await fetch('/api/identity/create-session', { method: 'PUT' }).catch(() => null)
          router.replace('/dashboard')
          router.refresh()
          return
        }
        if (billingStatus === 'success' && sessionId && planParam && ['explorer', 'professional', 'prestige'].includes(planParam)) {
          setStatusText('Confirming your Stripe payment & preparing ID verification...')
          await activateSandboxCandidateTier(planParam, sessionId)
          await launchStripeIdentityOrEnterDashboard()
          return
        }
        if (billingStatus === 'success' && sessionId && tierParam && ['starter', 'growth', 'enterprise'].includes(tierParam)) {
          setStatusText('Confirming your Stripe plan & preparing ID verification...')
          await activateSandboxEmployerTier(tierParam, sessionId)
          await launchStripeIdentityOrEnterDashboard()
          return
        }
        if (billingStatus === 'verify_success' && sessionId) {
          setStatusText('Confirming your Employer Verification Pass & preparing ID verification...')
          await activateSandboxEmployerTier('free', sessionId)
          await launchStripeIdentityOrEnterDashboard()
          return
        }
      }

      if (resolvedRole === 'candidate') {
        if (Boolean(prof?.identity_verified || prof?.is_verified)) {
          router.replace('/dashboard')
          return
        }
        const tierStr = String((prof as any)?.subscription_tier || '').toLowerCase()
        const skillsArr = Array.isArray((prof as any)?.structured_skills) ? (prof as any).structured_skills : []
        const hasPaidMeta = skillsArr.some((s: any) => s && typeof s === 'object' && ((s._type === 'ss_candidate_plan' && (s.verifiedExplorerPaid || ['explorer', 'professional', 'prestige'].includes(String(s.tier || '').toLowerCase()))) || (s._ss_meta === true && ['explorer', 'professional', 'prestige', 'pro'].includes(String(s.plan || '').toLowerCase()))))
        if (['explorer', 'professional', 'prestige'].includes(tierStr) || hasPaidMeta) {
          setAlreadyPaid(true)
        }
      } else {
        const { data: mem } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
        if (mem?.organization_id) {
          const { data: org } = await supabase.from('organizations').select('verification_status, subscription_status, subscription_tier').eq('id', mem.organization_id).single()
          const orgPaid = org?.verification_status === 'verified' || ['active', 'verified_sandbox'].includes(String(org?.subscription_status || '').toLowerCase()) || ['explorer', 'starter', 'growth', 'enterprise'].includes(String(org?.subscription_tier || '').toLowerCase())
          if (orgPaid && Boolean(prof?.identity_verified || prof?.is_verified)) {
            router.replace('/dashboard')
            return
          }
          if (orgPaid) {
            setAlreadyPaid(true)
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
