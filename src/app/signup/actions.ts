'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signupCandidate(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/signup/candidate?message=' + error.message)
  }

  if (data.user) {
    // Hardcode the candidate role immediately
    await supabase.from('profiles').update({ role: 'candidate' }).eq('id', data.user.id)
  }

  // Redirect to their dashboard to begin profile setup & Stripe Identity (future step)
  redirect('/dashboard')
}

export async function signupEmployer(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Server-side firewall: Block free email providers
  const freeDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com', 'proton.me'
  ]
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain || freeDomains.includes(domain)) {
    return redirect('/signup/employer?message=Employers must use a valid corporate email address.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/signup/employer?message=' + error.message)
  }

  if (data.user) {
    // Hardcode the employer role immediately
    await supabase.from('profiles').update({ role: 'employer' }).eq('id', data.user.id)
  }

  // Redirect to their organization setup to begin Domain Verification (future step)
  redirect('/dashboard/employer/organization')
}