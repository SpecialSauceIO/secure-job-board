import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const cookieStore = await cookies()
      const pendingRole = cookieStore.get('pending_role')?.value

      if (user && pendingRole) {
        await supabase
          .from('profiles')
          .update({ role: pendingRole })
          .eq('id', user.id)

        cookieStore.delete('pending_role')
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}