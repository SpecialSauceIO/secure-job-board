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
 * BRANDED SPECIAL SAUCE PASSWORD RECOVERY (SENT VIA RESEND)
 * Generates a cryptographic recovery token via Supabase Admin SDK and sends
 * a 100% Special Sauce branded HTML email via Resend that opens the "Set New Password"
 * form directly on /login.
 */
export async function requestBrandedPasswordReset(
  rawEmail: string,
  clientOrigin?: string
): Promise<{
  success?: boolean
  error?: string
  message?: string
}> {
  const email = (rawEmail || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid account email address.' }
  }

  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const resendKey = cleanEnvKey(process.env.RESEND_API_KEY)
  const fallbackInbox = cleanEnvKey(process.env.RESEND_TEST_TO_EMAIL)
  const fromAddress =
    cleanEnvKey(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce <onboarding@resend.dev>'

  const baseUrl =
    (clientOrigin && clientOrigin.startsWith('http') ? clientOrigin : '') ||
    cleanEnvKey(process.env.NEXT_PUBLIC_SITE_URL) ||
    'https://specialsauce.io'

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error:
        'Server configuration missing SUPABASE_SERVICE_ROLE_KEY. Please verify environment variables.',
    }
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: linkData, error: linkErr } =
    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

  if (linkErr || !linkData?.properties?.hashed_token) {
    return {
      error:
        linkErr?.message ||
        'Could not generate a recovery link for that email address. Please verify the email is registered.',
    }
  }

  const tokenHash = linkData.properties.hashed_token
  const recoveryUrl = `${baseUrl.replace(
    /\/+$/,
    ''
  )}/login?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`
  const refId = `SS-REC${Date.now().toString().slice(-5)}`

  const isFakeTestAddress =
    email.endsWith('@test.com') || email.endsWith('@example.com')
  const primaryRecipient =
    isFakeTestAddress && fallbackInbox ? fallbackInbox : email

  const buildHtml = (intendedNote?: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      ${
        intendedNote
          ? `<div style="margin-bottom: 14px; padding: 8px 12px; background-color: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 700;">${intendedNote}</div>`
          : ''
      }
      <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #f8fafc; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
          SPECIAL SAUCE™ SECURITY
        </span>
        <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
          Ref: ${refId}
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
        Reset Your Special Sauce Password
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        We received a request to reset the password for the Special Sauce account associated with <strong>${email}</strong>.
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Click the secure button below to choose a new password and access your workspace:
      </p>
      <div style="margin: 24px 0;">
        <a href="${recoveryUrl}" style="display: inline-block; padding: 14px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 10px;">
          Choose New Password →
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        🔒 If you did not request a password reset, you can safely ignore this email. Your account remains locked and protected.
      </p>
    </div>
  `

  if (!resendKey) {
    return {
      error:
        'RESEND_API_KEY is not configured in environment variables. Cannot dispatch recovery email.',
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        subject: `[${refId}] Reset your Special Sauce password`,
        html: buildHtml(
          primaryRecipient !== email
            ? `Sandbox Routing: Password reset requested for ${email}`
            : undefined
        ),
      }),
    })

    if (!response.ok && fallbackInbox && fallbackInbox !== primaryRecipient) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [fallbackInbox],
          subject: `[${refId}] Reset your Special Sauce password`,
          html: buildHtml(
            `Sandbox Fallback: Password reset requested for ${email}`
          ),
        }),
      })
    }
  } catch (err: any) {
    return {
      error: `Failed to send recovery email: ${err?.message || 'Network error'}`,
    }
  }

  return {
    success: true,
    message:
      primaryRecipient !== email
        ? `Branded Special Sauce recovery link generated for ${email} and routed to your test inbox (${primaryRecipient})! Click "Choose New Password →" in that email.`
        : `Branded Special Sauce password reset email sent to ${email}! Check your inbox and click "Choose New Password →".`,
  }
}

/**
 * PRIVACY-SAFE ACCOUNT EMAIL / USERNAME HINT LOOKUP
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