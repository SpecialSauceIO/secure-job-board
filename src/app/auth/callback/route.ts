import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { resolveTrustedAppOrigin, sanitizeInternalReturnPath } from '@/lib/trusted-origin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = resolveTrustedAppOrigin(request)
  const code = searchParams.get('code')
  const next = sanitizeInternalReturnPath(searchParams.get('next')) ?? '/dashboard'

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
        if (pendingRole === 'candidate' || pendingRole === 'employer') {
          await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id)
        }
        cookieStore.delete('pending_role')
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}