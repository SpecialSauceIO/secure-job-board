import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EmployerRoutesLayout({
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

  // Strict Role Gate: Prevent candidates from viewing any /dashboard/employer/* routes
  if (profile?.role !== 'employer') {
    redirect('/dashboard/profile')
  }

  return <>{children}</>
}
