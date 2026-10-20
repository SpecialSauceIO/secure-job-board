import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/login?error=Invalid+invite+link`)
  }

  const supabase = await createClient()

  // Verify token exists and is valid
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.redirect(`${siteUrl}/login?error=Invite+not+found+or+expired`)
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(`${siteUrl}/login?error=Invite+expired`)
  }

  // Store the valid token in a secure cookie to process AFTER they sign up/log in
  (await cookies()).set('pending_org_invite', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  // Redirect them to create an account
  return NextResponse.redirect(`${siteUrl}/signup?email=${encodeURIComponent(invite.email)}&message=Please+create+an+account+to+accept+your+invitation`)
}