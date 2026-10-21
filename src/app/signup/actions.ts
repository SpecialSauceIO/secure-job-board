'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  checkSignupAbuseAndVelocity,
  recordHandshakeTelemetry,
} from '@/lib/security-telemetry'

export async function signupCandidate(formData: FormData) {
  const startMs = Date.now()
  const supabase = await createClient()
  const email = ((formData.get('email') as string) || '').trim()
  const password = formData.get('password') as string

  const guard = await checkSignupAbuseAndVelocity({
    email,
    role: 'candidate',
  })
  if (!guard.allowed) {
    return redirect(
      '/signup/candidate?message=' + encodeURIComponent(guard.error || 'Signup blocked')
    )
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    await recordHandshakeTelemetry({
      handshakeId: 'candidate_auth_signup',
      label: 'Candidate Auth & Registration',
      platformArea: 'Onboarding & Authentication',
      ok: false,
      latencyMs: Date.now() - startMs,
      errorDetail: error.message,
    })
    return redirect('/signup/candidate?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    await supabase
      .from('profiles')
      .update({ role: 'candidate' })
      .eq('id', data.user.id)
  }

  await recordHandshakeTelemetry({
    handshakeId: 'candidate_auth_signup',
    label: 'Candidate Auth & Registration',
    platformArea: 'Onboarding & Authentication',
    ok: true,
    latencyMs: Date.now() - startMs,
  })

  redirect('/dashboard')
}

export async function signupEmployer(formData: FormData) {
  const startMs = Date.now()
  const supabase = await createClient()
  const email = ((formData.get('email') as string) || '').trim()
  const password = formData.get('password') as string

  const freeDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'live.com',
    'msn.com',
    'protonmail.com',
    'proton.me',
  ]
  const domain = email.split('@')[1]?.toLowerCase()

  if (!domain || freeDomains.includes(domain)) {
    return redirect(
      '/signup/employer?message=Employers must use a valid corporate email address.'
    )
  }

  const guard = await checkSignupAbuseAndVelocity({
    email,
    role: 'employer',
  })
  if (!guard.allowed) {
    return redirect(
      '/signup/employer?message=' + encodeURIComponent(guard.error || 'Signup blocked')
    )
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    await recordHandshakeTelemetry({
      handshakeId: 'employer_auth_signup',
      label: 'Employer Auth & Registration',
      platformArea: 'Onboarding & Authentication',
      ok: false,
      latencyMs: Date.now() - startMs,
      errorDetail: error.message,
    })
    return redirect('/signup/employer?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    await supabase
      .from('profiles')
      .update({ role: 'employer' })
      .eq('id', data.user.id)
  }

  await recordHandshakeTelemetry({
    handshakeId: 'employer_auth_signup',
    label: 'Employer Auth & Registration',
    platformArea: 'Onboarding & Authentication',
    ok: true,
    latencyMs: Date.now() - startMs,
  })

  redirect('/dashboard/employer/organization')
}
