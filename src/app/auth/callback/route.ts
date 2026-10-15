import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Where to send them after successful login - adjust if needed
  const next = searchParams.get('next') ?? '/dashboard/employer/organization'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // --- BEGIN INVITE PROCESSING ---
      // 1. Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      const cookieStore = cookies()
      
      // 2. Check if they have a pending invite cookie
      const token = cookieStore.get('pending_org_invite')?.value

      if (user && token) {
        // 3. Look up the invite in the database
        const { data: invite } = await supabase
          .from('organization_invites')
          .select('id, organization_id, role')
          .eq('token', token)
          .single()

        if (invite) {
          // 4. Add the user to the organization
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: invite.organization_id,
              user_id: user.id,
              role: invite.role
            })

          if (!memberError) {
            // 5. Delete the used invite
            await supabase
              .from('organization_invites')
              .delete()
              .eq('id', invite.id)
              
            // 6. Delete the cookie
            cookieStore.delete('pending_org_invite')
          } else {
             console.error('Error adding member to organization:', memberError)
          }
        }
      }
      // --- END INVITE PROCESSING ---
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error with the login code, send them to an error page or back to login
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`)
}