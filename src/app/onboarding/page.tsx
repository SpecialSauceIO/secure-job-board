'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import OnboardingPlanStep from '@/components/OnboardingPlanStep'

export default function OnboardingStepTwoPage() {
  const router = useRouter()
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate')
  const [email, setEmail] = useState<string>('')
  const [ready, setReady] = useState(false)

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
      if (resolvedRole === 'candidate') {
        const tier = String(prof?.subscription_tier || '').toLowerCase()
        if (Boolean(prof?.identity_verified || prof?.is_verified) || ['explorer', 'professional', 'prestige', 'pro'].includes(tier)) {
          router.replace('/dashboard')
          return
        }
      }
      setRole(resolvedRole)
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
          <div className="text-sm text-slate-400 font-semibold">Loading Step 2: Identity Verification &amp; Plan Selection...</div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
