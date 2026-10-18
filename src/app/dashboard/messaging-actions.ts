'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { autoSyncStage2VaultToEnterpriseAts } from '@/app/dashboard/ats-actions'
import { pushToOpsControlPlane } from '@/lib/ops-bridge'

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

function getAdminSupabaseClient() {
  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!supabaseUrl || !serviceRoleKey) return null
  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function resolveAuthUserEmail(userId?: string | null): Promise<string | null> {
  if (!userId) return null
  const adminClient = getAdminSupabaseClient()
  if (!adminClient) return null
  try {
    const { data } = await adminClient.auth.admin.getUserById(userId)
    return data?.user?.email || null
  } catch {
    return null
  }
}

async function resolveOrganizationOwnerEmail(
  supabase: any,
  organizationId?: string | null
): Promise<string | null> {
  if (!organizationId) return null
  try {
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', organizationId)

    if (!members || members.length === 0) return null
    const owner = members.find((m: any) => m.role === 'owner') || members[0]
    return await resolveAuthUserEmail(owner.user_id)
  } catch {
    return null
  }
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

  const adminClient = getAdminSupabaseClient()
  if (adminClient) {
    try {
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

function hasUnreadMsgForRole(
  app: any,
  viewerRole: 'employer' | 'candidate'
): boolean {
  const matchData = app?.match_data || {}
  const messages = Array.isArray(matchData.messages) ? matchData.messages : []
  if (messages.length === 0) return false

  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.sender_role === viewerRole) return false

  const readKey =
    viewerRole === 'candidate'
      ? 'candidate_last_read_at'
      : 'employer_last_read_at'
  const lastReadIso = matchData[readKey]
  if (!lastReadIso) return true

  return (
    new Date(lastMsg.created_at).getTime() > new Date(lastReadIso).getTime()
  )
}

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

  const isFakeTestAddress =
    rawRecipient.endsWith('@test.com') || rawRecipient.endsWith('@example.com')
  const primaryRecipient =
    !rawRecipient || (isFakeTestAddress && fallbackInbox)
      ? fallbackInbox || rawRecipient
      : rawRecipient

  const rawAppUrl =
    cleanEnvKey(process.env.NEXT_PUBLIC_SITE_URL) || 'https://specialsauce.io'
  const appUrl = rawAppUrl.replace(/\/+$/, '')
  const publicLogoBase = appUrl.includes('localhost')
    ? 'https://specialsauce.io'
    : appUrl
  const publicLogoUrl = `${publicLogoBase}/logo.png`
  const fullUrl = `${appUrl}${ctaUrl}`

  if (!resendKey || !primaryRecipient) {
    return
  }

  const fromAddress =
    cleanEnvKey(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce <onboarding@resend.dev>'

  const buildHtml = (intendedNote?: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      ${
        intendedNote
          ? `<div style="margin-bottom: 14px; padding: 8px 12px; background-color: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 700;">${intendedNote}</div>`
          : ''
      }
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 48px; width: auto; display: block; margin-bottom: 12px;" />
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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        reply_to: 'support@specialsauce.io',
        subject: `[${referenceId}] ${subject}`,
        html: buildHtml(
          primaryRecipient !== rawRecipient && rawRecipient
            ? `Sandbox Routing: Originally addressed to ${rawRecipient}`
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
          reply_to: 'support@specialsauce.io',
          subject: `[${referenceId}] ${subject}`,
          html: buildHtml(
            `Sandbox Fallback: Originally addressed to ${rawRecipient}`
          ),
        }),
      })
    }
  } catch (err) {
    console.warn('Thread email notification warning:', err)
  }
}

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
    await pushToOpsControlPlane({
      event_type: "behavioral_flag",
      severity: "high",
      flag_type: "Phishing_Or_OffPlatform_Lure",
      user_id: user.id,
      actor_email: user.email || "authenticated-user",
      actor_role: "unknown",
      summary: safetyScan.reason || "Blocked suspicious message in thread",
      evidence_snippet: `Thread ${applicationId}: "${trimmed.slice(0, 180)}"`,
    })
    return { error: safetyScan.reason }
  }

  const { data: appRow, error: fetchErr } = await supabase
    .from('applications')
    .select(
      `
      id,
      candidate_id,
      initiated_by,
      is_revealed,
      status,
      match_data,
      jobs (
        id,
        title,
        employer_id,
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

  const resolvedCandidateEmail =
    existingMatchData.candidate_contact_email ||
    profileObj?.contact_email ||
    profileObj?.email ||
    (isCandidate ? user.email : await resolveAuthUserEmail(appRow.candidate_id)) ||
    null

  const resolvedEmployerEmail =
    existingMatchData.employer_contact_email ||
    (!isCandidate ? user.email : null) ||
    (await resolveAuthUserEmail(jobObj?.employer_id)) ||
    (await resolveOrganizationOwnerEmail(supabase, jobObj?.organization_id)) ||
    (orgObj?.domain ? `hiring@${orgObj.domain}` : null)

  const updatedMatchData = {
    ...existingMatchData,
    messages: updatedMessages,
    employer_messaged_at: employerMessagedAt,
    last_message_at: nowIso,
    last_message_sender: senderRole,
    ...(resolvedCandidateEmail
      ? { candidate_contact_email: resolvedCandidateEmail }
      : {}),
    ...(resolvedEmployerEmail
      ? { employer_contact_email: resolvedEmployerEmail }
      : {}),
    ...(senderRole === 'employer'
      ? { employer_last_read_at: nowIso }
      : { candidate_last_read_at: nowIso }),
  }

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
  const isEmployerInitiatedPitch = appRow.initiated_by === 'employer'

  if (senderRole === 'employer') {
    await sendThreadEmailNotification({
      to: resolvedCandidateEmail,
      subject: `New secure message from ${senderDisplayName} regarding ${roleTitle}`,
      referenceId: refId,
      heading: `New Secure Message from ${senderDisplayName}`,
      bodyLines: [
        `${senderDisplayName} sent you a secure message regarding "${roleTitle}":`,
        `"${trimmed}"`,
        isVaultReleased
          ? 'Your contact card and resume are unlocked for this employer.'
          : '🔒 Stage 1 Privacy Active: Your raw email and PDF resume are still vaulted. You can reply in the thread and release your full resume whenever you are ready.',
      ],
      ctaUrl: isEmployerInitiatedPitch
        ? '/dashboard/requests'
        : '/dashboard/applications',
      ctaLabel: 'View & Reply in Secure Thread →',
    })
  } else {
    await sendThreadEmailNotification({
      to: resolvedEmployerEmail,
      subject: `New reply from ${senderDisplayName} for ${roleTitle}`,
      referenceId: refId,
      heading: `Candidate Reply for ${roleTitle}`,
      bodyLines: [
        `${senderDisplayName} replied in your encrypted thread (${refId}):`,
        `"${trimmed}"`,
      ],
      ctaUrl: isEmployerInitiatedPitch
        ? '/dashboard/employer/pitches'
        : '/dashboard/employer/applications',
      ctaLabel: 'Open Secure Thread →',
    })
  }

  revalidatePath('/dashboard')
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

export async function releaseCandidateVaultToEmployer(
  applicationId: string
): Promise<{
  success?: boolean
  error?: string
  releasedAt?: string
  atsSynced?: boolean
  atsSyncStatus?: string | null
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
      initiated_by,
      match_score,
      match_data,
      jobs (
        id,
        title,
        employer_id,
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

  const signedResumeUrl = await mintSignedResumeUrl(profileObj?.resume_url)
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
    candidate_email: candidateEmail,
    candidate_resume_url: signedResumeUrl || profileObj?.resume_url || null,
    last_message_at: nowIso,
    last_message_sender: 'candidate',
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

  const atsSyncResult = await autoSyncStage2VaultToEnterpriseAts(applicationId, {
    fullName,
    email: candidateEmail || undefined,
    resumeUrl: signedResumeUrl || undefined,
  })

  const refId = formatReferenceId(applicationId)
  const employerEmail =
    existingMatchData.employer_contact_email ||
    (await resolveAuthUserEmail(jobObj?.employer_id)) ||
    (await resolveOrganizationOwnerEmail(supabase, jobObj?.organization_id)) ||
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
      atsSyncResult?.success
        ? `✓ Enterprise ATS Auto-Sync: Candidate vault & 5-Point AI Match Radar were automatically pushed to your configured ATS/Webhook (${atsSyncResult.syncStatus}).`
        : `You can now download their original PDF resume and contact them directly.`,
    ],
    ctaUrl:
      appRow.initiated_by === 'employer'
        ? '/dashboard/employer/pitches'
        : '/dashboard/employer/applications',
    ctaLabel: 'View Released Resume & Contact Card →',
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')

  return {
    success: true,
    releasedAt: nowIso,
    atsSynced: Boolean(atsSyncResult?.success),
    atsSyncStatus: atsSyncResult?.syncStatus || null,
  }
}

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

export async function getApplicationThreadState(
  applicationId: string,
  viewerRole?: 'employer' | 'candidate'
): Promise<{
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

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
  const role: 'employer' | 'candidate' =
    viewerRole || (appRow.candidate_id === user.id ? 'candidate' : 'employer')

  if (lastMsg && lastMsg.sender_role !== role) {
    const readKey =
      role === 'candidate' ? 'candidate_last_read_at' : 'employer_last_read_at'
    const lastReadIso = matchData[readKey]
    if (
      !lastReadIso ||
      new Date(lastReadIso).getTime() < new Date(lastMsg.created_at).getTime()
    ) {
      await supabase
        .from('applications')
        .update({
          match_data: {
            ...matchData,
            [readKey]: new Date().toISOString(),
          },
        })
        .eq('id', applicationId)
    }
  }

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

export async function getDashboardLivePulse() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      signature: "anon",
      totalUnreadMessages: 0,
      role: "anon" as const,
      primaryUnreadCount: 0,
      secondaryUnreadCount: 0,
      pendingActionCount: 0,
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "employer") {
    const { data: members } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)

    const orgIds = Array.from(
      new Set((members || []).map((m: any) => m.organization_id).filter(Boolean))
    )

    if (orgIds.length === 0) {
      return {
        signature: "emp-none",
        totalUnreadMessages: 0,
        role: "employer" as const,
        primaryUnreadCount: 0,
        secondaryUnreadCount: 0,
        pendingActionCount: 0,
      }
    }

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .in("organization_id", orgIds)

    const jobIds = (jobs || []).map((j: any) => j.id)
    if (jobIds.length === 0) {
      return {
        signature: "emp-0",
        totalUnreadMessages: 0,
        role: "employer" as const,
        primaryUnreadCount: 0,
        secondaryUnreadCount: 0,
        pendingActionCount: 0,
      }
    }

    const { data: apps } = await supabase
      .from("applications")
      .select("id, status, is_revealed, initiated_by, match_data")
      .in("job_id", jobIds)

    const list = apps || []
    const inboundApps = list.filter((a: any) => a.initiated_by !== "employer")
    const outboundPitches = list.filter((a: any) => a.initiated_by === "employer")

    const inboundUnread = inboundApps.filter((a: any) =>
      hasUnreadMsgForRole(a, "employer")
    ).length
    const pitchesUnread = outboundPitches.filter((a: any) =>
      hasUnreadMsgForRole(a, "employer")
    ).length
    const unreadCount = inboundUnread + pitchesUnread

    const unlockedCount = list.filter(
      (a: any) => a.is_revealed || a.status === "accepted"
    ).length
    const pendingInbound = inboundApps.filter(
      (a: any) => !a.is_revealed && a.status !== "rejected" && a.status !== "declined"
    ).length

    return {
      signature: `emp:${list.length}:${unlockedCount}:${unreadCount}:${pendingInbound}`,
      totalUnreadMessages: unreadCount,
      role: "employer" as const,
      primaryUnreadCount: inboundUnread,
      secondaryUnreadCount: pitchesUnread,
      pendingActionCount: pendingInbound,
    }
  }

  const { data: candidateApps } = await supabase
    .from("applications")
    .select("id, status, is_revealed, initiated_by, match_data")
    .eq("candidate_id", user.id)

  const list = candidateApps || []
  const outboundApps = list.filter((a: any) => a.initiated_by !== "employer")
  const inboundPitches = list.filter((a: any) => a.initiated_by === "employer")

  const outboundUnread = outboundApps.filter((a: any) =>
    hasUnreadMsgForRole(a, "candidate")
  ).length
  const pitchesUnread = inboundPitches.filter((a: any) =>
    hasUnreadMsgForRole(a, "candidate")
  ).length
  const unreadCount = outboundUnread + pitchesUnread

  const revealedCount = list.filter(
    (a: any) => a.is_revealed || a.status === "accepted"
  ).length
  const pendingPitches = inboundPitches.filter(
    (a: any) => a.status === "pending" && !a.is_revealed
  ).length

  return {
    signature: `cand:${list.length}:${revealedCount}:${pendingPitches}:${unreadCount}`,
    totalUnreadMessages: unreadCount,
    role: "candidate" as const,
    primaryUnreadCount: outboundUnread,
    secondaryUnreadCount: pitchesUnread,
    pendingActionCount: pendingPitches,
  }
}
