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

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [statusText, setStatusText] = useState('Loading your onboarding step...')
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate')
  const [email, setEmail] = useState<string>('')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [showLocalQaUnlock, setShowLocalQaUnlock] = useState(
    process.env.NODE_ENV === 'development'
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      setShowLocalQaUnlock(true)
    }
  }, [])

  const handleLocalQaRestore = async () => {
    setLoading(true)
    setStatusText('Restoring verified QA access...')
    if (role === 'employer') {
      await activateSandboxEmployerTier('free')
      window.location.href = '/dashboard/employer/billing'
    } else {
      await activateSandboxCandidateTier('explorer')
      window.location.href = '/dashboard/billing'
    }
  }

  const launchStripeIdentityOrEnterDashboard = async () => {
    try {
      setLoading(true)
      setStatusText('Launching Stripe Identity Verification (Government ID & Selfie)...')
      const idRes = await fetch('/api/identity/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: '/onboarding?identity=complete' }),
      })
      const idData = await idRes.json().catch(() => ({}))
      if (idRes.ok && idData?.url) {
        window.location.href = idData.url
        return
      }
      console.error('Stripe Identity session error:', idData?.error)
      setLoading(false)
    } catch (err) {
      console.error('Identity session launch error:', err)
            fetch('/api/ops-health', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error_type: 'CLIENT_IDENTITY_LAUNCH_ERROR',
                message: (err as any)?.message || 'Identity session launch error',
                url: typeof window !== 'undefined' ? window.location.pathname : '/onboarding',
              }),
            }).catch(() => {})
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function init() {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()
      if (authErr || !user) {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }
      if (active) setEmail(user.email || '')

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, role, identity_verified, is_verified, structured_skills')
        .eq('id', user.id)
        .maybeSingle()

      if (!prof?.id) {
        await supabase.auth.signOut()
        router.replace('/signup/candidate')
        return
      }

      const resolvedRole = (prof?.role || user.user_metadata?.role || 'candidate') as 'candidate' | 'employer'
      if (active) setRole(resolvedRole)

      const params = new URLSearchParams(window.location.search)
      const billingStatus = params.get('billing')
      const planParam = params.get('plan')
      const sessionId = params.get('session_id') || undefined
      const identityStatus = params.get('identity')

        if (identityStatus === "complete") {
          if (active) setStatusText("Confirming your government ID verification...")
          try {
            const putRes = await fetch("/api/identity/create-session", { method: "PUT" })
            const putData = await putRes.json().catch(() => ({}))
            if (putData?.verified) {
              window.location.href = "/dashboard"
              return
            }
          } catch (_) {}
          if (active) {
            setAlreadyPaid(true)
            setLoading(false)
          }
          return
        }

      if (billingStatus === 'success' || billingStatus === 'verify_success') {
        if (active) setStatusText('Recording your plan and preparing ID verification...')
        if (resolvedRole === 'candidate' && planParam) {
          await activateSandboxCandidateTier(planParam as any, sessionId)
          await launchStripeIdentityOrEnterDashboard()
          return
        } else if (resolvedRole === 'employer') {
          const empTarget = (planParam && ['starter', 'growth', 'enterprise'].includes(planParam)) ? (planParam as any) : 'free'
          await activateSandboxEmployerTier(empTarget, sessionId)
          await launchStripeIdentityOrEnterDashboard()
          return
        }
      }

      if (resolvedRole === 'candidate') {
        if (Boolean(prof?.identity_verified || prof?.is_verified)) {
          router.replace('/dashboard')
          return
        }
        const skillsArr = Array.isArray((prof as any)?.structured_skills) ? (prof as any).structured_skills : []
        const hasPaidMeta = skillsArr.some((s: any) => s && typeof s === 'object' && ((s._type === 'ss_candidate_plan' && (s.verifiedExplorerPaid || ['explorer', 'professional', 'prestige'].includes(String(s.tier || '').toLowerCase()))) || (s._ss_meta === true && ['explorer', 'professional', 'prestige', 'pro'].includes(String(s.plan || '').toLowerCase()))))
        if (hasPaidMeta && active) {
          setAlreadyPaid(true)
        }
      } else if (resolvedRole === 'employer') {
        const { data: mem } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
        if (mem?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('verification_status, subscription_tier, subscription_status')
            .eq('id', mem.organization_id)
            .single()
          const orgPaid = Boolean(org?.verification_status === 'verified' || org?.subscription_status === 'active' || (org?.subscription_tier && org.subscription_tier !== 'free'))
          if (orgPaid && Boolean(prof?.identity_verified || prof?.is_verified)) {
            router.replace('/dashboard')
            return
          }
          if (orgPaid && active) {
            setAlreadyPaid(true)
          }
        }
      }

      if (active) setLoading(false)
    }
    init()
    return () => {
      active = false
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col overflow-x-clip">
      <PublicHeader />
      <main className="flex-1 flex flex-col px-4 py-10 sm:py-14">
        {loading ? (
          <div className="my-auto max-w-md mx-auto text-center py-20 px-4">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-medium">{statusText}</p>
          </div>
        ) : (
          <div className="my-auto w-full space-y-6">
            {showLocalQaUnlock && (
              <div className="max-w-3xl mx-auto px-4">
                <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                      🧪 QA Controls (Local Only)
                    </span>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Account was reset to Unsubscribed during QA. Restore verified access to return to your dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLocalQaRestore}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors shrink-0 cursor-pointer"
                  >
                    Restore Verified Access &amp; Enter Dashboard →
                  </button>
                </div>
              </div>
            )}
            <OnboardingPlanStep
              role={role}
              userEmail={email}
              onSignOut={handleSignOut}
              alreadyPaid={alreadyPaid}
              onVerifyIdentity={launchStripeIdentityOrEnterDashboard}
            />
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
