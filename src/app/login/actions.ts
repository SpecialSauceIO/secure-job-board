'use server'

import crypto from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkActionVelocityAndSpray, recordHandshakeTelemetry } from '@/lib/security-telemetry'
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


const SESSION_POLICY_COOKIE = "ss_session_policy"
const TWELVE_HOURS_SECONDS = 12 * 60 * 60
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

async function applySessionLifetimePolicy(rememberMe: boolean) {
  const cookieStore = await cookies()
  const maxAge = rememberMe ? THIRTY_DAYS_SECONDS : TWELVE_HOURS_SECONDS
  const exp = Date.now() + maxAge * 1000
  cookieStore.set(
    SESSION_POLICY_COOKIE,
    JSON.stringify({ remember: Boolean(rememberMe), exp }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
      sameSite: "lax",
    }
  )
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = ((formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''
  const selectedPlan = ((formData.get('plan') as string) || '').trim().toLowerCase()
  const rememberMe = formData.get('rememberMe') === 'true' || formData.get('rememberMe') === 'on'
  await applySessionLifetimePolicy(rememberMe)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    await checkActionVelocityAndSpray({
      actorKey: email.toLowerCase() || 'unknown',
      actorEmail: email.toLowerCase() || 'unknown',
      actorRole: 'unknown',
      actionType: 'login_failure',
      maxAllowedInWindow: 5,
      windowMinutes: 10,
      platformArea: 'Onboarding & Authentication',
    })
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'Invalid email or password. Please try again or reset your password below.'
        )
    )
  }

  await recordHandshakeTelemetry({
    handshakeId: 'auth_and_profiles_rls',
    label: 'User Authentication & Session Login',
    platformArea: 'Onboarding & Authentication',
    ok: true,
  })
  revalidatePath('/', 'layout')
  if (selectedPlan === 'professional' || selectedPlan === 'prestige') {
    redirect('/dashboard/billing?select=' + encodeURIComponent(selectedPlan))
  }
  if (selectedPlan === 'starter' || selectedPlan === 'growth' || selectedPlan === 'enterprise') {
    redirect('/dashboard/employer/billing?select=' + encodeURIComponent(selectedPlan))
  }
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
    'Special Sauce <support@specialsauce.io>'

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
    email.endsWith("@test.com") || email.endsWith("@example.com") || email.endsWith(".demo@specialsauce.io") || email.endsWith("@specialsauce.test")
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
        🔒 Special Sauce™ Security • If you did not request a password reset, you can safely ignore this email.
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
  const trimmed = (queryInput || '').replace(/[,()*%\\]/g, '').trim()
  if (!trimmed || trimmed.length < 4) {
    return {
      found: false,
      message: 'Please enter at least 4 characters (your full name or company domain) to search.',
    }
  }

  const hintVelocity = await checkActionVelocityAndSpray({
    actorKey: 'account_hint_' + trimmed.slice(0, 12).toLowerCase(),
    actorEmail: '',
    actorRole: 'unknown',
    actionType: 'login_failure',
    maxAllowedInWindow: 8,
    windowMinutes: 5,
    platformArea: 'Onboarding & Authentication',
  })
  if (!hintVelocity.allowed) {
    return {
      found: false,
      message: 'Too many account lookup requests. Please wait a few minutes and try again.',
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
        .select('*')
        .ilike('full_name', trimmed)
        .limit(8)

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          const directEmail = p.contact_email || p.email
          const label =
            p.role === 'employer' ? 'Employer Account' : 'Professional Vault'
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
            cName.trim().toLowerCase() === trimmed.toLowerCase() &&
            cEmail
          ) {
            registerRawEmail(cEmail, 'Professional Vault')
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

const LOGIN_OTP_COOKIE = "ss_login_otp_challenge"

function encryptJsonPayload(payload: Record<string, any>): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64url")
}

function decryptJsonPayload<T = any>(token?: string | null): T | null {
  if (!token) return null
  try {
    const buf = Buffer.from(token, "base64url")
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8")
    const parsed = JSON.parse(decrypted)
    if (parsed.exp && Date.now() > Number(parsed.exp)) {
      return null
    }
    return parsed as T
  } catch {
    return null
  }
}

export async function requestAccountLoginOtp(
  emailInput: string,
  passwordInput: string,
  rememberMe = false
): Promise<{
  success: boolean
  maskedEmail?: string
  routedToFallback?: boolean
  bypassedOtp?: boolean
  error?: string
}> {
  const email = (emailInput || "").trim().toLowerCase()
  const password = passwordInput || ""

  if (!email || !password) {
    return {
      success: false,
      error: "Please enter both your email address and password.",
    }
  }

  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      error: "Authentication service configuration is missing.",
    }
  }

  const statelessClient = createSupabaseAdminClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: signInData, error: signInErr } =
    await statelessClient.auth.signInWithPassword({
      email,
      password,
    })

  if (signInErr || !signInData?.user) {
    const vel = await checkActionVelocityAndSpray({
      actorKey: email || "unknown",
      actorEmail: email || "unknown",
      actorRole: "unknown",
      actionType: "login_failure",
      maxAllowedInWindow: 5,
      windowMinutes: 10,
      platformArea: "Onboarding & Authentication",
    })
    return {
      success: false,
      error: !vel.allowed && vel.reason
        ? vel.reason
        : "Invalid email or password. Please try again or reset your password below.",
    }
  }

  const isOfficialDemoStudioAccount =
    email === "alex.mercer.demo@specialsauce.io" ||
    email === "apex.hiring.demo@specialsauce.io"

  if (isOfficialDemoStudioAccount) {
    await applySessionLifetimePolicy(Boolean(rememberMe))
    const supabase = await createClient()
    const { error: sessionErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (sessionErr) {
      return {
        success: false,
        error: sessionErr.message || "Could not establish demo session.",
      }
    }
    await recordHandshakeTelemetry({
      handshakeId: "auth_and_profiles_rls",
      label: "Demo Studio Account Sign-In",
      platformArea: "Onboarding & Authentication",
      ok: true,
    })
    revalidatePath("/", "layout")
    return {
      success: true,
      bypassedOtp: true,
      maskedEmail: maskEmailAddress(email) || email,
    }
  }

  const otpCode = String(crypto.randomInt(100000, 999999))
  const otpHash = crypto
    .createHmac("sha256", getEncryptionKey())
    .update(email + ":" + otpCode)
    .digest("hex")

  const challengeToken = encryptJsonPayload({
    email,
    password,
    otpHash,
    attempts: 0,
    rememberMe: Boolean(rememberMe),
    exp: Date.now() + 5 * 60 * 1000,
  })

  const resendKey = cleanEnvKey(process.env.RESEND_API_KEY)
  const fallbackInbox = cleanEnvKey(process.env.RESEND_TEST_TO_EMAIL)
  const fromAddress =
    cleanEnvKey(process.env.RESEND_FROM_EMAIL) ||
    "Special Sauce Security <support@specialsauce.io>"

  if (!resendKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is missing in environment variables; cannot send 6-digit verification code.",
    }
  }

  const isFakeTestAddress =
    email.endsWith("@test.com") || email.endsWith("@example.com") || email.endsWith(".demo@specialsauce.io")
  const primaryRecipient =
    isFakeTestAddress && fallbackInbox ? fallbackInbox : email
  let routedToFallback = primaryRecipient !== email

  const buildOtpHtml = (sandboxNote?: string) =>
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;\">" +
    (sandboxNote
      ? "<div style=\"margin-bottom: 16px; padding: 8px 12px; background-color: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 700;\">" + sandboxNote + "</div>"
      : "") +
    "<div style=\"margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;\">" +
    "<span style=\"display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #f8fafc; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;\">SPECIAL SAUCE™ 2-STEP VERIFICATION</span>" +
    "</div>" +
    "<h2 style=\"color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 10px 0;\">Your 6-Digit Sign-In Code</h2>" +
    "<p style=\"color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;\">Enter the 6-digit verification code below to finish signing in to your Special Sauce™ account (<strong>" + email + "</strong>). This code expires in <strong>5 minutes</strong>.</p>" +
    "<div style=\"background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 0.28em; color: #0f172a; margin-bottom: 20px;\">" + otpCode + "</div>" +
    "<p style=\"color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; padding-top: 14px; border-top: 1px solid #f1f5f9;\">🔒 Special Sauce™ Security • If you did not attempt to sign in, please reset your password immediately.</p>" +
    "</div>"

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + resendKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        subject: "[" + otpCode + "] Your Special Sauce™ verification code",
        html: buildOtpHtml(
          routedToFallback
            ? "Sandbox Routing: Sign-in OTP code for " + email
            : undefined
        ),
      }),
    })

    if (!res.ok && fallbackInbox && fallbackInbox !== primaryRecipient) {
      const retryRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + resendKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [fallbackInbox],
          subject: "[" + otpCode + "] Your Special Sauce™ verification code",
          html: buildOtpHtml("Sandbox Fallback: Sign-in OTP code for " + email),
        }),
      })
      if (retryRes.ok) {
        routedToFallback = true
      } else {
        const errText = await retryRes.text()
        return {
          success: false,
          error: "Could not dispatch 6-digit verification email: " + errText.slice(0, 100),
        }
      }
    } else if (!res.ok) {
      const errText = await res.text()
      return {
        success: false,
        error: "Could not dispatch 6-digit verification email: " + errText.slice(0, 100),
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: "Network error sending verification code: " + (err?.message || "Unknown error"),
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(LOGIN_OTP_COOKIE, challengeToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
    sameSite: "lax",
  })

  return {
    success: true,
    maskedEmail: maskEmailAddress(email) || email,
    routedToFallback,
  }
}

export async function verifyAccountLoginOtp(
  otpInput: string,
  rememberMeInput?: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  const code = (otpInput || "").replace(/\D/g, "").trim()
  if (code.length !== 6) {
    return {
      success: false,
      error: "Please enter the 6-digit verification code sent to your email.",
    }
  }

  const cookieStore = await cookies()
  const rawToken = cookieStore.get(LOGIN_OTP_COOKIE)?.value
  const challenge = decryptJsonPayload<{
    email: string
    password: string
    otpHash: string
    attempts: number
    exp: number
    rememberMe?: boolean
  }>(rawToken)

  if (!challenge) {
    return {
      success: false,
      error: "Your 6-digit verification code has expired. Please sign in again to request a new code.",
    }
  }

  if (challenge.attempts >= 5) {
    cookieStore.delete(LOGIN_OTP_COOKIE)
    await checkActionVelocityAndSpray({
      actorKey: challenge.email,
      actorEmail: challenge.email,
      actorRole: "unknown",
      actionType: "login_failure",
      maxAllowedInWindow: 5,
      windowMinutes: 10,
      platformArea: "Onboarding & Authentication",
    })
    return {
      success: false,
      error: "Too many invalid verification attempts. Please sign in again.",
    }
  }

  const candidateHash = crypto
    .createHmac("sha256", getEncryptionKey())
    .update(challenge.email + ":" + code)
    .digest("hex")

  const isMatch =
    candidateHash.length === challenge.otpHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(candidateHash, "utf8"),
      Buffer.from(challenge.otpHash, "utf8")
    )

  if (!isMatch) {
    const nextAttempts = (challenge.attempts || 0) + 1
    cookieStore.set(
      LOGIN_OTP_COOKIE,
      encryptJsonPayload({
        ...challenge,
        attempts: nextAttempts,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 5 * 60,
        sameSite: "lax",
      }
    )
    return {
      success: false,
      error: "Invalid 6-digit verification code (" + (5 - nextAttempts) + " attempt(s) remaining).",
    }
  }

  cookieStore.delete(LOGIN_OTP_COOKIE)
  const effectiveRememberMe = typeof rememberMeInput === "boolean" ? rememberMeInput : Boolean(challenge.rememberMe)
  await applySessionLifetimePolicy(effectiveRememberMe)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: challenge.email,
    password: challenge.password,
  })

  if (error) {
    return {
      success: false,
      error: error.message || "Could not establish session after OTP verification.",
    }
  }

  await recordHandshakeTelemetry({
    handshakeId: "auth_and_profiles_rls",
    label: "User Authentication & Session Login (2FA OTP Verified)",
    platformArea: "Onboarding & Authentication",
    ok: true,
  })

  revalidatePath("/", "layout")
  return { success: true }
}
