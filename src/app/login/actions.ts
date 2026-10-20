'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

export interface AccountHintItem {
  maskedEmail: string
  encryptedToken: string
  roleLabel: string
}

function cleanEnvKey(rawKey?: string | null): string {
  if (!rawKey) return ''
  return rawKey.trim().replace(/^["']+|["']+$/g, '').trim()
}

function getEncryptionKey(): Buffer {
  const secret =
    cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    cleanEnvKey(process.env.RESEND_API_KEY) ||
    'special-sauce-default-secret-key-2026'
  return crypto.createHash('sha256').update(secret).digest()
}

function encryptEmailToken(rawEmail: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(rawEmail.trim().toLowerCase(), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

function decryptEmailToken(token: string): string | null {
  try {
    const buf = Buffer.from(token, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      iv
    )
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
    return decrypted && decrypted.includes('@') ? decrypted : null
  } catch {
    return null
  }
}

function maskEmailAddress(rawEmail?: string | null): string | null {
  if (!rawEmail || !rawEmail.includes('@')) return null
  const parts = rawEmail.trim().toLowerCase().split('@')
  const localPart = parts[0] || ''
  const domainPart = parts[1] || ''
  if (!localPart || !domainPart) return null

  const firstChar = localPart.charAt(0) || '*'
  const lastChar = localPart.charAt(localPart.length - 1) || '*'
  const maskedLocal =
    localPart.length <= 2 ? firstChar + '***' : firstChar + '***' + lastChar

  return maskedLocal + '@' + domainPart
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
      '/login?error=' +
        encodeURIComponent(
          'Invalid email or password. Please try again or reset your password below.'
        )
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
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function requestBrandedPasswordReset(
  rawEmailOrToken: string,
  clientOrigin?: string,
  isEncryptedToken = false
): Promise<{
  success?: boolean
  error?: string
  message?: string
}> {
  const resolvedEmail = isEncryptedToken
    ? decryptEmailToken(rawEmailOrToken)
    : (rawEmailOrToken || '').trim().toLowerCase()

  if (!resolvedEmail || !resolvedEmail.includes('@')) {
    return { error: 'Please enter a valid account email address.' }
  }

  const email = resolvedEmail.trim().toLowerCase()
  const maskedForDisplay = maskEmailAddress(email) || email

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
        'Could not generate a recovery link for that account. Please verify the email is registered.',
    }
  }

  const tokenHash = linkData.properties.hashed_token
  const cleanBase = baseUrl.replace(/\/+$/, '')

  // Gmail & Outlook require a public https:// URL (not localhost) to render embedded images
  const publicLogoBase = cleanBase.includes('localhost')
    ? cleanEnvKey(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, '') ||
      'https://specialsauce.io'
    : cleanBase
  const publicLogoUrl = publicLogoBase + '/logo.png'

  const recoveryUrl =
    cleanBase +
    '/login?token_hash=' +
    encodeURIComponent(tokenHash) +
    '&type=recovery'
  const refId = 'SS-REC' + Date.now().toString().slice(-5)

  const isFakeTestAddress =
    email.endsWith('@test.com') || email.endsWith('@example.com')
  const primaryRecipient =
    isFakeTestAddress && fallbackInbox ? fallbackInbox : email

  const buildHtml = (intendedNote?: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      ${
        intendedNote
          ? `<div style="margin-bottom: 16px; padding: 8px 12px; background-color: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 700;">${intendedNote}</div>`
          : ''
      }
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 52px; width: auto; display: block; margin-bottom: 14px;" />
        <div>
          <span style="display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #f8fafc; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-right: 8px;">
            SPECIAL SAUCE™ SECURITY
          </span>
          <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
            Ref: ${refId}
          </span>
        </div>
      </div>
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
        Reset Your Special Sauce Password
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        We received a request to reset the password for the Special Sauce account associated with <strong>${email}</strong>.
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
        Click the secure button below to choose a new password and access your workspace:
      </p>
      <div style="margin: 26px 0;">
        <a href="${recoveryUrl}" style="display: inline-block; padding: 14px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 10px;">
          Choose New Password →
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        🔒 securely connecting professionals and employers • If you did not request a password reset, you can safely ignore this email.
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
        Authorization: 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        subject: '[' + refId + '] Reset your Special Sauce password',
        html: buildHtml(
          primaryRecipient !== email
            ? 'Sandbox Routing: Password reset requested for ' + email
            : undefined
        ),
      }),
    })

    if (!response.ok && fallbackInbox && fallbackInbox !== primaryRecipient) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + resendKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [fallbackInbox],
          subject: '[' + refId + '] Reset your Special Sauce password',
          html: buildHtml(
            'Sandbox Fallback: Password reset requested for ' + email
          ),
        }),
      })
    }
  } catch (err: any) {
    return {
      error:
        'Failed to send recovery email: ' + (err?.message || 'Network error'),
    }
  }

  const targetDisplay = isEncryptedToken ? maskedForDisplay : email

  return {
    success: true,
    message:
      primaryRecipient !== email
        ? '✓ Branded Special Sauce recovery link generated for ' +
          targetDisplay +
          ' and routed to your test inbox (' +
          primaryRecipient +
          ')! Click "Choose New Password →" in that email.'
        : '✓ Branded Special Sauce password reset email sent to ' +
          targetDisplay +
          '! Check your inbox and click "Choose New Password →".',
  }
}

export async function lookupAccountEmailHint(
  lookupType: 'candidate' | 'employer',
  queryInput: string
): Promise<{
  found: boolean
  hints?: string[]
  hintItems?: AccountHintItem[]
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

  const discoveredMap = new Map<string, AccountHintItem>()

  const registerRawEmail = (
    rawEmail?: string | null,
    roleLabel = 'Matched Account'
  ) => {
    if (!rawEmail || !rawEmail.includes('@')) return
    const clean = rawEmail.trim().toLowerCase()
    const masked = maskEmailAddress(clean)
    if (!masked) return
    if (!discoveredMap.has(clean)) {
      discoveredMap.set(clean, {
        maskedEmail: masked,
        encryptedToken: encryptEmailToken(clean),
        roleLabel,
      })
    }
  }

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
        .or('domain.ilike.%' + cleanDomain + '%,name.ilike.%' + trimmed + '%')
        .limit(5)

      if (orgs && orgs.length > 0) {
        const orgIds = orgs.map((o: any) => o.id)
        const { data: members } = await db
          .from('organization_members')
          .select('user_id, organization_id')
          .in('organization_id', orgIds)
          .limit(10)

        if (members && members.length > 0 && supabaseUrl && serviceRoleKey) {
          for (const m of members) {
            try {
              const { data: authUser } = await (db as any).auth.admin.getUserById(
                m.user_id
              )
              const matchedOrg = orgs.find(
                (o: any) => o.id === m.organization_id
              )
              registerRawEmail(
                authUser?.user?.email,
                matchedOrg?.name || 'Employer Seat'
              )
            } catch {}
          }
        }
      }
    } else {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, role, email, contact_email')
        .ilike('full_name', '%' + trimmed + '%')
        .limit(8)

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          const directEmail = p.contact_email || p.email
          const label =
            p.role === 'employer' ? 'Employer Account' : 'Candidate Vault'
          if (directEmail) {
            registerRawEmail(directEmail, label)
          } else if (supabaseUrl && serviceRoleKey) {
            try {
              const { data: authUser } = await (db as any).auth.admin.getUserById(
                p.id
              )
              registerRawEmail(authUser?.user?.email, label)
            } catch {}
          }
        }
      }

      if (discoveredMap.size === 0) {
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
            registerRawEmail(cEmail, 'Candidate Vault')
          }
        }
      }
    }
  } catch (err) {
    console.warn('Account hint lookup warning:', err)
  }

  const hintItems = Array.from(discoveredMap.values())
  if (hintItems.length === 0) {
    return {
      found: false,
      message:
        lookupType === 'employer'
          ? 'No registered employer organization found matching "' +
            trimmed +
            '". Try your exact company domain (e.g., company.com).'
          : 'No candidate vault found matching "' +
            trimmed +
            '". Note: Only profiles where a full name was saved or extracted from a resume can be looked up by name.',
    }
  }

  return {
    found: true,
    hints: hintItems.map((h) => h.maskedEmail),
    hintItems,
    message:
      hintItems.length === 1
        ? 'We found 1 account matching "' +
          trimmed +
          '". Click "Send Reset Link" below to email a recovery link directly to that address, or "Sign In" if you recognize it:'
        : 'We found ' +
          hintItems.length +
          ' accounts matching "' +
          trimmed +
          '". Click "Send Reset Link" on any account below to send a recovery email directly to that inbox:',
  }
}