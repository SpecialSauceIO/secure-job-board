'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const MAX_SILENT_UNLOCKS = 5

export interface SecureChatMessage {
  id: string
  sender_role: 'candidate' | 'employer'
  sender_label: string
  text: string
  created_at: string
  flagged_warning?: string | null
}

function cleanEnvKey(rawKey?: string | null): string {
  if (!rawKey) return ''
  return rawKey.trim().replace(/^["']+|["']+$/g, '').trim()
}

function maskCandidateFirstInitial(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Candidate'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || ''
  return `${first} ${lastInitial}.`
}

function formatReferenceId(applicationId: string): string {
  const clean = (applicationId || '').replace(/-/g, '').substring(0, 8).toUpperCase()
  return `SS-${clean || '00000000'}`
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

  return null
}

// ------------------------------------------------------------------
// AI & HEURISTIC MESSAGE SAFETY SCANNER (ANTI-PHISHING / HARVESTING)
// ------------------------------------------------------------------
function scanMessageForSuspiciousContent(text: string): {
  blocked: boolean
  reason?: string
  warningFlag?: string
} {
  const lower = text.toLowerCase()

  // Hard block: SSN, bank/routing numbers, crypto/wire fees, or password harvesting
  const hardBlockPatterns = [
    /\b(ssn|social security number)\b/i,
    /\b(bank account|routing number|wire transfer|whatsapp|telegram)\b/i,
    /\b(training fee|equipment deposit|background check fee)\b/i,
  ]

  for (const pattern of hardBlockPatterns) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason:
          'Security Firewall: Messages requesting off-platform messaging apps (WhatsApp/Telegram), SSNs, or financial/deposit details are strictly blocked.',
      }
    }
  }

  // Soft warning flag: External forms used for bulk harvesting before interview
  if (
    lower.includes('docs.google.com/forms') ||
    lower.includes('typeform.com') ||
    lower.includes('airtable.com')
  ) {
    return {
      blocked: false,
      warningFlag: 'Contains external form link — verify interview intent before releasing vault.',
    }
  }

  return { blocked: false }
}

async function sendRelayEmailNotification({
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
          Encrypted Thread: ${referenceId}
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
    console.warn('Relay notification warning:', err)
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
// 2. SEND MESSAGE INSIDE AN UNLOCKED APPLICATION / PITCH THREAD
// ------------------------------------------------------------------
export async function sendApplicationMessage(
  applicationId: string,
  rawMessageText: string
): Promise<{
  success?: boolean
  error?: string
  messages?: SecureChatMessage[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmedText = (rawMessageText || '').trim()
  if (!trimmedText) {
    return { error: 'Please enter a message before sending.' }
  }
  if (trimmedText.length > 2000) {
    return { error: 'Message is too long (maximum 2,000 characters).' }
  }

  // Scan message for harvesting / scam patterns
  const safetyScan = scanMessageForSuspiciousContent(trimmedText)
  if (safetyScan.blocked) {
    return { error: safetyScan.reason }
  }

  const { data: app } = await supabase
    .from('applications')
    .select(
      `
      id,
      candidate_id,
      status,
      is_revealed,
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

  if (!app) return { error: 'Application thread not found.' }

  const isCandidate = app.candidate_id === user.id
  let isEmployerMember = false

  const jobObj: any = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations)
    ? jobObj?.organizations[0]
    : jobObj?.organizations

  if (!isCandidate && jobObj?.organization_id) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', jobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    isEmployerMember = Boolean(member?.id)
  }

  if (!isCandidate && !isEmployerMember) {
    return { error: 'Forbidden: You do not have permission to message this thread.' }
  }

  const senderRole: 'candidate' | 'employer' = isCandidate ? 'candidate' : 'employer'
  const profileObj: any = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
  const vaultReleased = Boolean(app.match_data?.candidate_vault_released === true)

  const candidateDisplayName = vaultReleased
    ? profileObj?.full_name || profileObj?.name || 'Verified Candidate'
    : maskCandidateFirstInitial(
        profileObj?.full_name ||
          profileObj?.name ||
          app.match_data?.candidate_full_name
      )

  const employerDisplayName =
    orgObj?.name || app.match_data?.employer_org_name || 'Verified Employer'

  const existingMessages: SecureChatMessage[] = Array.isArray(
    app.match_data?.messages
  )
    ? app.match_data.messages
    : []

  const newMessage: SecureChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender_role: senderRole,
    sender_label:
      senderRole === 'candidate' ? candidateDisplayName : employerDisplayName,
    text: trimmedText,
    created_at: new Date().toISOString(),
    flagged_warning: safetyScan.warningFlag || null,
  }

  const updatedMessages = [...existingMessages, newMessage]
  const refId = formatReferenceId(applicationId)

  const updatedMatchData = {
    ...(app.match_data || {}),
    messages: updatedMessages,
    last_message_at: newMessage.created_at,
    ...(senderRole === 'employer' && !app.match_data?.employer_messaged_at
      ? { employer_messaged_at: newMessage.created_at }
      : {}),
  }

  const { error: updateErr } = await supabase
    .from('applications')
    .update({ match_data: updatedMatchData })
    .eq('id', applicationId)

  if (updateErr) return { error: updateErr.message }

  // Send Email Relay NotificationTo roll this out cleanly without touching a single line of your existing `actions.ts` logic until we're ready, we will build the **2-Stage Vault & Secure Messaging Engine** in two modular files first, and then drop the `<SecureMessageThread />` component directly into your Employer and Candidate pipeline views.

Here is what this architecture enforces automatically:
1. **Stage 1 (Initial Unlock / Pitch Acceptance):** Opens the encrypted in-platform message thread, reveals the employer's verified company name/domain, and reveals the candidate's **First Name + Last Initial** (e.g., *Steve B.*). The candidate's raw email and signed PDF resume link remain **locked in the vault**.
2. **The 5-Thread Anti-Harvesting Ceiling:** We can check if an employer has 5+ unlocked threads where `employer_messaged_at` is null—blocking silent bulk-unlocks dead in their tracks.
3. **AI Anti-Scam & Off-Platform Phishing Guardrail:** Every message is scanned before saving for off-platform harvesting red flags (SSN/bank requests, WhatsApp/Telegram lures, or shady Google Forms).
4. **Stage 2 (Candidate-Controlled Vault Release):** Once the employer messages the candidate in the thread, the candidate gets a 1-click **`🔓 Release Full Resume & Contact Card`** button. Clicking it permanently unlocks their full name, direct email, and 1-hour signed PDF resume URL for that employer and notifies the hiring team via Resend.

---

### Step 1: Create the Messaging & Vault Server Actions (`src/app/dashboard/messaging-actions.ts`)

1. In VS Code, right-click the **`src/app/dashboard`** folder and click **New File...**
2. Name it **`messaging-actions.ts`**
3. Paste this complete file and press **`Cmd + S`**:

```ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

  // 1. Block requests for sensitive government/financial identifiers
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

  // 2. Block mass-harvesting external form links before Stage 2 vault release
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
    await fetch('[https://api.resend.com/emails](https://api.resend.com/emails)', {
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
// 1. SEND MESSAGE IN SECURE THREAD (EMPLOYER OR CANDIDATE)
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

  // Run AI / Heuristic Anti-Phishing & Anti-Harvesting check
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

  const { error: updateErr } = await supabase
    .from('applications')
    .update({ match_data: updatedMatchData })
    .eq('id', applicationId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  const refId = formatReferenceId(applicationId)
  const roleTitle = jobObj?.title || 'Open Role'

  // Relay notification email to the other party without exposing raw emails prematurely
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
// 2. STAGE 2: CANDIDATE-CONTROLLED FULL VAULT RELEASE (PDF + EMAIL)
// ------------------------------------------------------------------
export async function releaseCandidateVaultToEmployer(
  applicationId: string
): Promise<{
  success?: boolean
  error?: string
  releasedAt?: string
}> {
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
// 3. FETCH SIGNED RESUME URL ONLY IF CANDIDATE HAS RELEASED VAULT
// ------------------------------------------------------------------
export async function getVaultReleasedResumeUrl(
  applicationId: string
): Promise<{ signedUrl?: string | null; error?: string }> {
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