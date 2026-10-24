import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CandidateRouteGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Strict Role Gate: Prevent employers from viewing candidate-only routes
  if (profile?.role === 'employer') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
