'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

const MAX_SILENT_UNLOCKS = 5

export interface ThreadMessage {
  id: string
  sender_role: 'employer' | 'candidate' | 'system'
  sender_name: string
  text: string
  created_at: string
}

function cleanEnvKey(rawKey?: string | null): string {
  if (!rawKey) return ''
  return rawKey.trim().replace(/^["']+|["']+$/g, '').trim()
}

function formatReferenceId(applicationId: string): string {
  const clean = (applicationId || '').replace(/-/g, '').substring(0, 8).toUpperCase()
  return `SS-${clean || '00000000'}`
}

function maskCandidateNameForStage1(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Candidate'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || ''
  return `${firstName} ${lastInitial}.`
}

function extractResumeStoragePath(rawUrlOrPath?: string | null): string | null {
  if (!rawUrlOrPath) return null
  const trimmed = rawUrlOrPath.trim()
  if (!trimmed) return null

  const bucketMarker = '/resumes/'
  const idx = trimmed.indexOf(bucketMarker)
  if (idx !== -1) {
    const afterBucket = trimmed.slice(idx + bucketMarker.length).split('?')[0]
    return decodeURIComponent(afterBucket)
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.replace(/^\/+/, '')
  }

  return null
}

async function mintSignedResumeUrl(
  rawUrlOrPath?: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  const storagePath = extractResumeStoragePath(rawUrlOrPath)
  if (!storagePath) return rawUrlOrPath || null

  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminClient = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await adminClient.storage
        .from('resumes')
        .createSignedUrl(storagePath, expiresInSeconds)

      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
    } catch (err) {
      console.warn('Admin signed URL fallback triggered:', err)
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, expiresInSeconds)

    if (!error && data?.signedUrl) {
      return data.signedUrl
    }
  } catch (err) {
    console.warn('Standard signed URL error:', err)
  }

  return null
}

// ------------------------------------------------------------------
// AI / HEURISTIC ANTI-HARVESTING & PHISHING SCANNER
// ------------------------------------------------------------------
function scanMessageForSuspiciousContent(text: string): {
  flagged: boolean
  reason?: string
} {
  const lower = text.toLowerCase()

  if (
    /\b(ssn|social security|bank account|routing number|wire transfer|whatsapp|telegram|signal app|crypto|usdt)\b/i.test(
      lower
    )
  ) {
    return {
      flagged: true,
      reason:
        'Security Guardrail: Messages requesting SSNs, banking details, or off-platform encrypted chat apps (WhatsApp/Telegram) are blocked to protect users.',
    }
  }

  if (/\b(forms\.gle|docs\.google\.com\/forms|bit\.ly|tinyurl\.com)\b/i.test(lower)) {
    return {
      flagged: true,
      reason:
        'Anti-Harvesting Guardrail: External survey/form shortlinks are blocked inside initial messages. Please converse directly in the thread.',
    }
  }

  return { flagged: false }
}

async function sendThreadEmailNotification({
  to,
  subject,
  referenceId,
  heading,
  bodyLines,
  ctaUrl,
  ctaLabel,
}: {
  to?: string | null
  subject: string
  referenceId: string
  heading: string
  bodyLines: string[]
  ctaUrl: string
  ctaLabel: string
}) {
  const rawRecipient = (to || '').trim()
  const fallbackInbox = cleanEnvKey(process.env.RESEND_TEST_TO_EMAIL)
  const resendKey = cleanEnvKey(process.env.RESEND_API_KEY)
  if (!resendKey) return

  const isFakeTestAddress =
    rawRecipient.endsWith('@test.com') || rawRecipient.endsWith('@example.com')
  const primaryRecipient =
    !rawRecipient || (isFakeTestAddress && fallbackInbox)
      ? fallbackInbox || rawRecipient
      : rawRecipient

  if (!primaryRecipient) return

  const appUrl =
    cleanEnvKey(process.env.NEXT_PUBLIC_SITE_URL) || 'http://localhost:3000'
  const fullUrl = `${appUrl}${ctaUrl}`
  const fromAddress =
    cleanEnvKey(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce <onboarding@resend.dev>'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
          Secure Thread: ${referenceId}
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        ${heading}
      </h2>
      ${bodyLines
        .map(
          (line) =>
            `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">${line}</p>`
        )
        .join('')}
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <a href="${fullUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">
          ${ctaLabel}
        </a>
      </div>
    </div>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        subject: `[${referenceId}] ${subject}`,
        html,
      }),
    })
  } catch (err) {
    console.warn('Thread email notification warning:', err)
  }
}

// ------------------------------------------------------------------
// 1. CHECK EMPLOYER "SILENT UNLOCK" ANTI-HARVESTING CAP (MAX 5)
// ------------------------------------------------------------------
export async function checkEmployerSilentUnlockQuota(organizationId: string): Promise<{
  allowed: boolean
  silentCount: number
  error?: string
}> {
  noStore()
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('organization_id', organizationId)

  if (!jobs || jobs.length === 0) {
    return { allowed: true, silentCount: 0 }
  }

  const jobIds = jobs.map((j) => j.id)
  const { data: unlockedApps } = await supabase
    .from('applications')
    .select('id, status, is_revealed, match_data')
    .in('job_id', jobIds)
    .eq('is_revealed', true)

  const silentUnlocks = (unlockedApps || []).filter((app: any) => {
    if (app.status === 'rejected' || app.status === 'declined') return false
    const messages = Array.isArray(app.match_data?.messages)
      ? app.match_data.messages
      : []
    const hasEmployerMessage = messages.some(
      (m: any) => m.sender_role === 'employer'
    )
    return !hasEmployerMessage
  })

  if (silentUnlocks.length >= MAX_SILENT_UNLOCKS) {
    return {
      allowed: false,
      silentCount: silentUnlocks.length,
      error: `Anti-Harvesting Guardrail: You have ${silentUnlocks.length} unlocked candidates awaiting an initial message. Please send an introductory message in your active threads before unlocking additional profiles.`,
    }
  }

  return { allowed: true, silentCount: silentUnlocks.length }
}

// ------------------------------------------------------------------
// 2. SEND MESSAGE IN SECURE THREAD (EMPLOYER OR CANDIDATE)
// ------------------------------------------------------------------
export async function sendApplicationMessage(
  applicationId: string,
  messageText: string
): Promise<{
  success?: boolean
  error?: string
  messages?: ThreadMessage[]
  employerMessagedAt?: string | null
}> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = (messageText || '').trim()
  if (!trimmed) return { error: 'Please enter a message.' }
  if (trimmed.length > 2000) {
    return { error: 'Message is too long (max 2,000 characters).' }
  }

  const safetyScan = scanMessageForSuspiciousContent(trimmed)
  if (safetyScan.flagged) {
    return { error: safetyScan.reason }
  }

  const { data: appRow, error: fetchErr } = await supabase
    .from('applications')
    .select(
      `
      id,
      candidate_id,
      is_revealed,
      status,
      match_data,
      jobs (
        id,
        title,
        organization_id,
        organizations:organization_id (name, domain)
      ),
      profiles (*)
    `
    )
    .eq('id', applicationId)
    .single()

  if (fetchErr || !appRow) {
    return { error: 'Application thread not found.' }
  }

  const isCandidate = appRow.candidate_id === user.id
  const jobObj: any = Array.isArray(appRow.jobs) ? appRow.jobs[0] : appRow.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations)
    ? jobObj?.organizations[0]
    : jobObj?.organizations

  let isEmployerMember = false
  if (!isCandidate && jobObj?.organization_id) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', jobObj.organization_id)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    isEmployerMember = Boolean(member?.id)
  }

  if (!isCandidate && !isEmployerMember) {
    return { error: 'Forbidden: You do not have permission to message this thread.' }
  }

  const senderRole: 'employer' | 'candidate' = isCandidate ? 'candidate' : 'employer'
  const profileObj: any = Array.isArray(appRow.profiles)
    ? appRow.profiles[0]
    : appRow.profiles

  const existingMatchData = appRow.match_data || {}
  const isVaultReleased = Boolean(existingMatchData.candidate_vault_released === true)

  const rawCandidateName =
    profileObj?.full_name ||
    profileObj?.name ||
    existingMatchData.candidate_full_name ||
    'Verified Candidate'

  const senderDisplayName =
    senderRole === 'employer'
      ? orgObj?.name || existingMatchData.employer_org_name || 'Hiring Team'
      : isVaultReleased
      ? rawCandidateName
      : maskCandidateNameForStage1(rawCandidateName)

  const existingMessages: ThreadMessage[] = Array.isArray(existingMatchData.messages)
    ? existingMatchData.messages
    : []

  const nowIso = new Date().toISOString()
  const newMsg: ThreadMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender_role: senderRole,
    sender_name: senderDisplayName,
    text: trimmed,
    created_at: nowIso,
  }

  const updatedMessages = [...existingMessages, newMsg]
  const employerMessagedAt =
    senderRole === 'employer'
      ? existingMatchData.employer_messaged_at || nowIso
      : existingMatchData.employer_messaged_at || null

  const updatedMatchData = {
    ...existingMatchData,
    messages: updatedMessages,
    employer_messaged_at: employerMessagedAt,
    last_message_at: nowIso,
  }

  // Also ensure is_revealed is true whenever an employer messages a thread
  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      is_revealed: true,
      match_data: updatedMatchData,
    })
    .eq('id', applicationId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  const refId = formatReferenceId(applicationId)
  const roleTitle = jobObj?.title || 'Open Role'

  if (senderRole === 'employer') {
    const candidateEmail =
      existingMatchData.candidate_contact_email ||
      profileObj?.contact_email ||
      profileObj?.email ||
      null

    await sendThreadEmailNotification({
      to: candidateEmail,
      subject: `New message from ${senderDisplayName} regarding ${roleTitle}`,
      referenceId: refId,
      heading: `New Message from ${senderDisplayName}`,
      bodyLines: [
        `${senderDisplayName} sent you a message regarding "${roleTitle}":`,
        `"${trimmed}"`,
        isVaultReleased
          ? 'Your contact card and resume are unlocked for this employer.'
          : '🔒 Stage 1 Privacy Active: Your raw email and PDF resume are still vaulted. You can reply in the thread and release your full resume whenever you are ready.',
      ],
      ctaUrl: '/dashboard/applications',
      ctaLabel: 'Reply & Manage Vault Access →',
    })
  } else {
    const employerEmail =
      existingMatchData.employer_contact_email ||
      (orgObj?.domain ? `hiring@${orgObj.domain}` : null)

    await sendThreadEmailNotification({
      to: employerEmail,
      subject: `New reply from ${senderDisplayName} for ${roleTitle}`,
      referenceId: refId,
      heading: `Candidate Reply for ${roleTitle}`,
      bodyLines: [
        `${senderDisplayName} replied in your secure thread (${refId}):`,
        `"${trimmed}"`,
      ],
      ctaUrl: '/dashboard/employer/applications',
      ctaLabel: 'Open Secure Thread →',
    })
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')

  return {
    success: true,
    messages: updatedMessages,
    employerMessagedAt,
  }
}

// ------------------------------------------------------------------
// 3. STAGE 2: CANDIDATE-CONTROLLED FULL VAULT RELEASE (PDF + EMAIL)
// ------------------------------------------------------------------
export async function releaseCandidateVaultToEmployer(
  applicationId: string
): Promise<{
  success?: boolean
  error?: string
  releasedAt?: string
}> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: appRow, error: fetchErr } = await supabase
    .from('applications')
    .select(
      `
      id,
      candidate_id,
      match_data,
      jobs (
        id,
        title,
        organization_id,
        organizations:organization_id (name, domain)
      ),
      profiles (*)
    `
    )
    .eq('id', applicationId)
    .eq('candidate_id', user.id)
    .single()

  if (fetchErr || !appRow) {
    return { error: 'Application not found or access denied.' }
  }

  const profileObj: any = Array.isArray(appRow.profiles)
    ? appRow.profiles[0]
    : appRow.profiles
  const jobObj: any = Array.isArray(appRow.jobs) ? appRow.jobs[0] : appRow.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations)
    ? jobObj?.organizations[0]
    : jobObj?.organizations

  const existingMatchData = appRow.match_data || {}
  const fullName =
    profileObj?.full_name ||
    profileObj?.name ||
    existingMatchData.candidate_full_name ||
    'Verified Candidate'
  const candidateEmail =
    user.email ||
    profileObj?.contact_email ||
    profileObj?.email ||
    existingMatchData.candidate_contact_email ||
    null

  const nowIso = new Date().toISOString()
  const existingMessages: ThreadMessage[] = Array.isArray(existingMatchData.messages)
    ? existingMatchData.messages
    : []

  const systemMessage: ThreadMessage = {
    id: `sys-${Date.now()}`,
    sender_role: 'system',
    sender_name: 'Special Sauce Vault',
    text: `🔓 ${fullName} released their full Identity Vault (Direct Email & Signed Resume PDF) to ${
      orgObj?.name || 'the Hiring Team'
    }.`,
    created_at: nowIso,
  }

  const updatedMatchData = {
    ...existingMatchData,
    candidate_vault_released: true,
    candidate_vault_released_at: nowIso,
    candidate_full_name: fullName,
    candidate_contact_email: candidateEmail,
    messages: [...existingMessages, systemMessage],
  }

  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      is_revealed: true,
      match_data: updatedMatchData,
    })
    .eq('id', applicationId)
    .eq('candidate_id', user.id)

  if (updateErr) {
    return { error: updateErr.message }
  }

  const refId = formatReferenceId(applicationId)
  const employerEmail =
    existingMatchData.employer_contact_email ||
    (orgObj?.domain ? `hiring@${orgObj.domain}` : null)

  await sendThreadEmailNotification({
    to: employerEmail,
    subject: `🔓 ${fullName} released their Resume & Contact Vault for ${
      jobObj?.title || 'Open Role'
    }!`,
    referenceId: refId,
    heading: 'Candidate Released Full Resume & Contact Vault!',
    bodyLines: [
      `${fullName} has approved Stage 2 Vault Release for "${
        jobObj?.title || 'Open Role'
      }".`,
      `Candidate Full Name: ${fullName}`,
      `Direct Email: ${candidateEmail || 'Available in dashboard'}`,
      `You can now download their original PDF resume and contact them directly.`,
    ],
    ctaUrl: '/dashboard/employer/applications',
    ctaLabel: 'View Released Resume & Contact Card →',
  })

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')

  return {
    success: true,
    releasedAt: nowIso,
  }
}

// ------------------------------------------------------------------
// 4. FETCH SIGNED RESUME URL ONLY IF CANDIDATE HAS RELEASED VAULT
// ------------------------------------------------------------------
export async function getVaultReleasedResumeUrl(
  applicationId: string
): Promise<{ signedUrl?: string | null; error?: string }> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: appRow } = await supabase
    .from('applications')
    .select(
      `
      id,
      candidate_id,
      match_data,
      jobs (organization_id),
      profiles (resume_url)
    `
    )
    .eq('id', applicationId)
    .single()

  if (!appRow) return { error: 'Application not found' }

  if (appRow.match_data?.candidate_vault_released !== true) {
    return {
      error:
        'Vault Locked: The candidate has not released their PDF resume yet. Send them a message in the thread to introduce your team and request vault release.',
    }
  }

  const profileObj: any = Array.isArray(appRow.profiles)
    ? appRow.profiles[0]
    : appRow.profiles

  const signedUrl = await mintSignedResumeUrl(profileObj?.resume_url)
  return { signedUrl }
}

// ------------------------------------------------------------------
// 5. DIRECT, ZERO-JOIN LIVE THREAD SYNC (NEVER CACHED BY NEXT.JS 16)
// ------------------------------------------------------------------
export async function getApplicationThreadState(applicationId: string): Promise<{
  messages: ThreadMessage[]
  vaultReleased: boolean
  isRevealed: boolean
  status?: string
  candidateFullName?: string | null
  candidateEmail?: string | null
  employerEmail?: string | null
  error?: string
}> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      messages: [],
      vaultReleased: false,
      isRevealed: false,
      error: 'Not authenticated',
    }
  }

  // Direct query on `applications` only (zero joins so RLS on profiles/organizations never blocks polling)
  const { data: appRow, error } = await supabase
    .from('applications')
    .select('id, candidate_id, is_revealed, status, match_data')
    .eq('id', applicationId)
    .single()

  if (error || !appRow) {
    return {
      messages: [],
      vaultReleased: false,
      isRevealed: false,
      error: error?.message || 'Thread not found',
    }
  }

  const matchData = appRow.match_data || {}
  const messages: ThreadMessage[] = Array.isArray(matchData.messages)
    ? matchData.messages
    : []
  const vaultReleased = Boolean(matchData.candidate_vault_released === true)

  const resolvedEmployerEmail =
    matchData.employer_contact_email ||
    (matchData.employer_org_domain
      ? `hiring@${matchData.employer_org_domain}`
      : null)

  return {
    messages,
    vaultReleased,
    isRevealed: Boolean(appRow.is_revealed),
    status: appRow.status,
    candidateFullName: vaultReleased ? matchData.candidate_full_name || null : null,
    candidateEmail: vaultReleased ? matchData.candidate_contact_email || null : null,
    employerEmail: vaultReleased ? resolvedEmployerEmail : null,
  }
}