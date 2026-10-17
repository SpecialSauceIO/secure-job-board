'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

function cleanEnvKey(rawKey?: string | null): string {
  if (!rawKey) return ''
  return rawKey.trim().replace(/^["']+|["']+$/g, '').trim()
}

function maskEmailAddress(rawEmail?: string | null): string | null {
  if (!rawEmail || !rawEmail.includes('@')) return null
  const [localPart, domainPart] = rawEmail.trim().toLowerCase().split('@')
  if (!localPart || !domainPart) return null

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] || '*'}***`
      : `${localPart[0]}***${localPart[localPart.length - 1]}`

  return `${maskedLocal}@${domainPart}`
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = ((formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    redirect(
      `/login?error=${encodeURIComponent(
        'Invalid email or password. Please try again or reset your password below.'
      )}`
    )
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = ((formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * PRIVACY-SAFE ACCOUNT EMAIL / USERNAME HINT LOOKUP
 * Returns only a masked email hint (e.g. s***9@gmail.com) so the legitimate
 * user recognizes which email inbox they used without exposing raw PII.
 */
export async function lookupAccountEmailHint(
  lookupType: 'candidate' | 'employer',
  queryInput: string
): Promise<{
  found: boolean
  hints?: string[]
  message: string
}> {
  const trimmed = (queryInput || '').trim()
  if (!trimmed || trimmed.length < 2) {
    return {
      found: false,
      message: 'Please enter at least 2 characters to search.',
    }
  }

  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)

  const db =
    supabaseUrl && serviceRoleKey
      ? createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : await createClient()

  const discoveredEmails = new Set<string>()

  try {
    if (lookupType === 'employer') {
      const cleanDomain = trimmed
        .toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]

      const { data: orgs } = await db
        .from('organizations')
        .select('id, name, domain, description')
        .or(`domain.ilike.%${cleanDomain}%,name.ilike.%${trimmed}%`)
        .limit(5)

      if (orgs && orgs.length > 0) {
        const orgIds = orgs.map((o: any) => o.id)
        const { data: members } = await db
          .from('organization_members')
          .select('user_id')
          .in('organization_id', orgIds)
          .limit(10)

        if (members && members.length > 0 && supabaseUrl && serviceRoleKey) {
          for (const m of members) {
            try {
              const { data: authUser } = await (db as any).auth.admin.getUserById(
                m.user_id
              )
              const masked = maskEmailAddress(authUser?.user?.email)
              if (masked) discoveredEmails.add(masked)
            } catch {}
          }
        }

        for (const o of orgs) {
          if (o.domain && discoveredEmails.size === 0) {
            discoveredEmails.add(`***@${o.domain.toLowerCase()}`)
          }
        }
      }
    } else {
      // Candidate lookup by Full Name
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, email, contact_email')
        .ilike('full_name', `%${trimmed}%`)
        .limit(5)

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          const directMasked = maskEmailAddress(p.contact_email || p.email)
          if (directMasked) {
            discoveredEmails.add(directMasked)
          } else if (supabaseUrl && serviceRoleKey) {
            try {
              const { data: authUser } = await (db as any).auth.admin.getUserById(
                p.id
              )
              const masked = maskEmailAddress(authUser?.user?.email)
              if (masked) discoveredEmails.add(masked)
            } catch {}
          }
        }
      }

      // Also check applications.match_data fallback for candidate_full_name
      if (discoveredEmails.size === 0) {
        const { data: apps } = await db
          .from('applications')
          .select('match_data')
          .limit(50)

        for (const app of apps || []) {
          const cName = String(app?.match_data?.candidate_full_name || '')
          const cEmail = String(app?.match_data?.candidate_contact_email || '')
          if (
            cName &&
            cName.toLowerCase().includes(trimmed.toLowerCase()) &&
            cEmail
          ) {
            const masked = maskEmailAddress(cEmail)
            if (masked) discoveredEmails.add(masked)
          }
        }
      }
    }
  } catch (err) {
    console.warn('Account hint lookup warning:', err)
  }

  const hintsList = Array.from(discoveredEmails)
  if (hintsList.length === 0) {
    return {
      found: false,
      message:
        lookupType === 'employer'
          ? `No registered employer organization found matching "${trimmed}". Try your exact company domain (e.g., company.com).`
          : `No candidate vault found matching "${trimmed}". Note: Only profiles where a full name was saved or extracted from a resume can be looked up by name.`,
    }
  }

  return {
    found: true,
    hints: hintsList,
    message:
      hintsList.length === 1
        ? `We found an account matching "${trimmed}" registered under:`
        : `We found ${hintsList.length} accounts matching "${trimmed}":`,
  }
}