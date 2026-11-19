'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { autoSyncStage2VaultToEnterpriseAts } from '@/app/dashboard/ats-actions'
import { pushToOpsControlPlane } from '@/lib/ops-bridge'
import { submitBossW2PlacementHandoff, type EorPostalAddress } from '@/lib/boss-eor'
import { parseEorConfigFromDescription } from '@/lib/eor-config'
import { inspectStage1TextForContactLeakOrInjection, raiseSecurityAlertAndFlag, recordHandshakeTelemetry } from '@/lib/security-telemetry'

const MAX_SILENT_UNLOCKS = 5

export interface ThreadMessage {
  id: string
  sender_role: 'employer' | 'candidate' | 'system'
  sender_name: string
  text: string
  created_at: string
}

const TRIAL_EOR_BURDEN_MULTIPLIER = 1.28

export interface TrialToHireHandshake {
  status: 'proposed' | 'accepted_pending_eor' | 'converted_direct' | 'ended' | 'declined' | 'withdrawn'
  contract_track?: 'trial_to_hire_90d' | 'fixed_term_w2' | 'open_ended_w2'
  duration_months?: number | null
  extension_count?: number
  equipment_policy?: string | null
  equipment_notes?: string | null
  equipment_return_status?: 'not_applicable' | 'in_field' | 'return_requested' | 'returned'
  lifecycle_updated_at?: string | null
  hourly_pay_rate: number
  employer_bill_rate: number
  burden_percent: number
  weekly_hours: number
  trial_days: number
  conversion_fee_usd: number
  target_start_date: string
  work_state: string
  require_background_check: boolean
  require_drug_screening: boolean
  scope_note?: string | null
  proposed_at: string
  proposed_by_email?: string | null
  responded_at?: string | null
  eor_packet_id?: string | null
  wc_code?: string | null
  legal_entity_name?: string | null
  timecard_approver_name?: string | null
  timecard_approver_email?: string | null
  supervisor_name?: string | null
  po_number?: string | null
  invoice_cc_email?: string | null
  worksite_address?: EorPostalAddress | null
  employer_address?: EorPostalAddress | null
  professional_address?: EorPostalAddress | null
  professional_phone?: string | null
  boss_sync_status?: 'synced' | 'pending_rates' | 'manual_fallback' | null
  boss_client_id?: number | null
  boss_contact_id?: number | null
  boss_associate_id?: number | null
  boss_assignment_id?: number | null
  boss_placement_id?: number | null
  boss_associate_onboarded?: boolean
  boss_associate_onboarded_date?: string | null
  boss_placement_status_display?: string | null
  boss_last_synced_at?: string | null
  boss_sync_note?: string | null
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

function checkCandidateActivePlanAndVerification(profileObj: any): {
  allowed: boolean
  error?: string
} {
  const skillsArr = Array.isArray(profileObj?.structured_skills)
    ? profileObj.structured_skills
    : []
  const metaItem = skillsArr.find((item: any) => item && item._ss_meta === true)
  const rawPlan = String(metaItem?.plan || 'free').toLowerCase()
  const hasActivePlan = ['explorer', 'professional', 'prestige', 'trial', 'pro'].includes(rawPlan)

  if (!hasActivePlan) {
    return {
      allowed: false,
      error:
        'Verification Pass Required: Please activate Explorer ($5 One-Time Verification · $0/mo Forever), Professional ($12/mo), or Prestige ($19/mo) on Plans & Billing to message employers or unlock invitations.',
    }
  }

  const isVerified = Boolean(
    profileObj?.identity_verified === true ||
      String(profileObj?.identity_verified) === 'true' ||
      profileObj?.is_verified === true ||
      String(profileObj?.is_verified) === 'true'
  )

  if (!isVerified) {
    return {
      allowed: false,
      error:
        'Verification Required: Please complete your 1-time Stripe Real-Person ID Verification on your Dashboard before messaging employers or releasing your vault.',
    }
  }

  return { allowed: true }
}

function maskCandidateNameForStage1(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Professional'
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
    rawRecipient.endsWith('@test.com') || rawRecipient.endsWith('@example.com') || rawRecipient.endsWith('.demo@specialsauce.io') || rawRecipient.endsWith('@specialsauce.test')
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
    'Special Sauce <support@specialsauce.io>'

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
    const md = app.match_data || {}
    const messages = Array.isArray(md.messages) ? md.messages : []
    const hasEmployerMessage = messages.some(
      (m: any) => m.sender_role === 'employer'
    )
    const hasCandidateReply = messages.some(
      (m: any) => m.sender_role === 'candidate'
    )
    if (md.employer_boilerplate_blast === true && !hasCandidateReply && !md.candidate_vault_released) {
      return true
    }
    return !hasEmployerMessage
  })

  if (silentUnlocks.length >= MAX_SILENT_UNLOCKS) {
    return {
      allowed: false,
      silentCount: silentUnlocks.length,
      error: `Anti-Harvesting Guardrail: You have ${silentUnlocks.length} unlocked professionals awaiting an initial message. Please send an introductory message in your active threads before unlocking additional profiles.`,
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
    await raiseSecurityAlertAndFlag({
      flagType: "Phishing_Or_OffPlatform_Lure",
      severity: "high",
      actorEmail: user.email || "authenticated-user",
      actorRole: "unknown",
      userId: user.id,
      platformArea: "Encrypted Intro/Convo Messaging",
      summary: safetyScan.reason || "Blocked phishing/off-platform lure in thread",
      evidenceSnippet: `Thread ${applicationId}: "${trimmed.slice(0, 180)}"`,
      createSecTicket: true,
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

  if (isCandidate) {
    const gate = checkCandidateActivePlanAndVerification(profileObj)
    if (!gate.allowed) {
      return { error: gate.error }
    }
  }

  const existingMatchData = appRow.match_data || {}
  const isVaultReleased = Boolean(existingMatchData.candidate_vault_released === true)

  const stage1LeakScan = await inspectStage1TextForContactLeakOrInjection({
    userId: user.id,
    userEmail: user.email || '',
    actorRole: senderRole,
    text: trimmed,
    platformArea: 'Encrypted Intro/Convo Messaging',
    contextLabel: `The Introduction Encrypted Thread (${applicationId.slice(0, 8)})`,
    isStage2Unlocked: isVaultReleased,
  })
  if (stage1LeakScan.blocked) {
    return { error: stage1LeakScan.reason }
  }

  const rawCandidateName =
    profileObj?.full_name ||
    profileObj?.name ||
    existingMatchData.candidate_full_name ||
    'Verified Professional'

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
  const hadPriorEmployerMsg = existingMessages.some(
    (m: any) => m.sender_role === 'employer'
  )

  // Silent Behavioral Check: Detect verbatim copy-pasted employer intro blasts across 4+ candidate threads
  let isBoilerplateBlast = Boolean(existingMatchData.employer_boilerplate_blast)
  if (senderRole === 'employer' && !hadPriorEmployerMsg && jobObj?.organization_id) {
    const normalizeText = (s: string) =>
      String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
    const normalizedCurrent = normalizeText(trimmed)

    if (normalizedCurrent.length >= 12) {
      const { data: orgJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('organization_id', jobObj.organization_id)
      const orgJobIds = (orgJobs || []).map((j: any) => j.id)

      if (orgJobIds.length > 0) {
        const { data: recentOrgApps } = await supabase
          .from('applications')
          .select('id, match_data')
          .in('job_id', orgJobIds)
          .neq('id', applicationId)
          .limit(40)

        let identicalIntroCount = 0
        for (const otherApp of recentOrgApps || []) {
          const otherMsgs = Array.isArray(otherApp?.match_data?.messages)
            ? otherApp.match_data.messages
            : []
          const firstEmpMsg = otherMsgs.find(
            (m: any) => m && m.sender_role === 'employer'
          )
          if (
            firstEmpMsg &&
            normalizeText(firstEmpMsg.text) === normalizedCurrent
          ) {
            identicalIntroCount++
          }
        }

        if (identicalIntroCount >= 3) {
          isBoilerplateBlast = true
          await raiseSecurityAlertAndFlag({
            flagType: 'Manual_Trust_Audit',
            severity: 'medium',
            actorEmail: user.email || 'employer-user',
            actorRole: 'employer',
            userId: user.id,
            organizationId: jobObj.organization_id,
            platformArea: 'Anti-Harvesting Behavioral Telemetry',
            summary: `Employer sent identical verbatim intro message across ${identicalIntroCount + 1} professional threads`,
            evidenceSnippet: `Org ${orgObj?.name || jobObj.organization_id} pasted identical intro in thread ${applicationId.slice(0, 8)}: "${trimmed.slice(0, 180)}"`,
            createSecTicket: true,
          })
        }
      }
    }
  } else if (senderRole === 'candidate') {
    // Once a candidate replies back, it is a genuine 2-way conversation
    isBoilerplateBlast = false
  }

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
    employer_boilerplate_blast: isBoilerplateBlast,
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
    await recordHandshakeTelemetry({
      handshakeId: 'marketplace_pitch_application_engine',
      label: 'Intro/Convo Encrypted Messaging Handshake',
      platformArea: 'Encrypted Intro/Convo Messaging',
      ok: false,
      errorDetail: updateErr.message,
    })
    return { error: updateErr.message }
  }
  await recordHandshakeTelemetry({
    handshakeId: 'marketplace_pitch_application_engine',
    label: 'Intro/Convo Encrypted Messaging Handshake',
    platformArea: 'Encrypted Intro/Convo Messaging',
    ok: true,
  })

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
          : '🔒 Privacy Lock Active: Your raw email and PDF resume are still vaulted. You can reply in the thread and release your full resume whenever you are ready.',
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
      heading: `Professional Reply for ${roleTitle}`,
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
  const vaultGate = checkCandidateActivePlanAndVerification(profileObj)
  if (!vaultGate.allowed) {
    return { error: vaultGate.error }
  }
  const jobObj: any = Array.isArray(appRow.jobs) ? appRow.jobs[0] : appRow.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations)
    ? jobObj?.organizations[0]
    : jobObj?.organizations

  const existingMatchData = appRow.match_data || {}
  const fullName =
    profileObj?.full_name ||
    profileObj?.name ||
    existingMatchData.candidate_full_name ||
    'Verified Professional'
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
    heading: 'Professional Released Full Resume & Contact Vault!',
    bodyLines: [
      `${fullName} has shared their full Resume & Contact Info for "${
        jobObj?.title || 'Open Role'
      }".`,
      `Professional Full Name: ${fullName}`,
      `Direct Email: ${candidateEmail || 'Available in dashboard'}`,
      atsSyncResult?.success
        ? `✓ Enterprise HR Software Auto-Sync: Professional vault & TrueFit Score™ were automatically pushed to your connected HR software (${atsSyncResult.syncStatus}).`
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
      jobs (employer_id, organization_id),
      profiles (resume_url)
    `
    )
    .eq('id', applicationId)
    .single()

  if (!appRow) return { error: 'Application not found' }

  const isCandidateOwner = appRow.candidate_id === user.id
  const resumeJobObj: any = Array.isArray(appRow.jobs) ? appRow.jobs[0] : appRow.jobs
  let isAuthorizedEmployer = resumeJobObj?.employer_id === user.id
  if (!isCandidateOwner && !isAuthorizedEmployer && resumeJobObj?.organization_id) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', resumeJobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (member) isAuthorizedEmployer = true
  }

  if (!isCandidateOwner && !isAuthorizedEmployer) {
    return { error: 'Forbidden: You do not have permission to access this resume vault.' }
  }

  if (appRow.match_data?.candidate_vault_released !== true) {
    return {
      error:
        'Vault Locked: The professional has not released their PDF resume yet. Send them a message in the thread to introduce your team and request vault release.',
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
  trialToHire?: TrialToHireHandshake | null
  jobEmploymentType?: string | null
  jobEorTrack?: string | null
  jobEorDurationMonths?: number | null
  jobEquipmentPolicy?: string | null
  jobEquipmentNotes?: string | null
  jobEorBgCheck?: boolean
  jobEorDrugCheck?: boolean
  suggestedHourlyRate?: number
  suggestedWeeklyHours?: number
  suggestedWorkState?: string
  orgLegalEntityName?: string
  orgTimecardApproverName?: string
  orgTimecardApproverEmail?: string
  orgBillingApEmail?: string
  orgSupervisorName?: string
  orgPoNumber?: string
  orgBillingStreet1?: string
  orgBillingCity?: string
  orgBillingState?: string
  orgBillingZip?: string
  orgWcCode?: string
  orgDiffWorksite?: boolean
  orgWorksiteStreet1?: string
  orgWorksiteCity?: string
  orgWorksiteState?: string
  orgWorksiteZip?: string
  employerPlanActive?: boolean
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

  const adminDb = getAdminSupabaseClient() || supabase
  const { data: appRow, error } = await adminDb
    .from('applications')
    .select('id, candidate_id, is_revealed, status, match_data, jobs (title, employer_id, organization_id, salary_min, salary_max, location, structured_requirements, organizations:organization_id (name, subscription_tier, description))')
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

  const isThreadCandidate = appRow.candidate_id === user.id
  const threadJobObj: any = Array.isArray((appRow as any).jobs)
    ? (appRow as any).jobs[0]
    : (appRow as any).jobs
  let isThreadEmployer = threadJobObj?.employer_id === user.id
  if (!isThreadCandidate && !isThreadEmployer && threadJobObj?.organization_id) {
    const { data: member } = await adminDb
      .from('organization_members')
      .select('id')
      .eq('organization_id', threadJobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (member) isThreadEmployer = true
  }

  if (!isThreadCandidate && !isThreadEmployer) {
    return {
      messages: [],
      vaultReleased: false,
      isRevealed: false,
      error: 'Forbidden: Access denied to this application thread.',
    }
  }

  const matchData = appRow.match_data || {}
  const messages: ThreadMessage[] = Array.isArray(matchData.messages)
    ? matchData.messages
    : []
  const vaultReleased = Boolean(matchData.candidate_vault_released === true)

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
  const role: 'employer' | 'candidate' = isThreadCandidate ? 'candidate' : 'employer'

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

  const structArr = Array.isArray(threadJobObj?.structured_requirements) ? threadJobObj.structured_requirements : []
  const jobSkillsArr = Array.isArray(threadJobObj?.required_skills) ? threadJobObj.required_skills : []
  const metaItem = structArr.find((x: any) => x && typeof x === 'object' && x._ss_job_meta === true) || jobSkillsArr.find((x: any) => x && typeof x === 'object' && x._job_meta === true) || jobSkillsArr.find((x: any) => x && typeof x === 'object' && x.employment_type) || {}
  const empTypeStr = String(metaItem?.employment_type || '')
  const jobOrgObj: any = Array.isArray(threadJobObj?.organizations) ? threadJobObj.organizations[0] : threadJobObj?.organizations
  const orgEorCfg = parseEorConfigFromDescription(jobOrgObj?.description)
  const resolvedTrack = metaItem?.eor_contract_track && metaItem.eor_contract_track !== 'none' ? String(metaItem.eor_contract_track) : orgEorCfg.defaultContractTrack !== 'none' ? orgEorCfg.defaultContractTrack : empTypeStr === 'Contract (W-2 Fixed-Term)' || empTypeStr === 'Seasonal / Temporary' ? 'fixed_term_w2' : empTypeStr === 'Contract (W-2 Open-Ended)' ? 'open_ended_w2' : 'trial_to_hire_90d'
  const descTierMatch = String(jobOrgObj?.description || '').match(/\[TIER:(free|starter|growth|enterprise)\]/i)
  const subTier = (descTierMatch ? descTierMatch[1] : String(jobOrgObj?.subscription_tier || '')).toLowerCase().trim()
  const employerPlanActive = ['starter', 'growth', 'enterprise'].includes(subTier)
  const rawSalMin = Number(threadJobObj?.salary_min) || 0
  const rawSalMax = Number(threadJobObj?.salary_max) || 0
  const isHourlyJob = metaItem?.pay_type === 'hourly' || (rawSalMax > 0 && rawSalMax <= 500)
  const midComp = rawSalMin > 0 && rawSalMax > 0 ? (rawSalMin + rawSalMax) / 2 : rawSalMax || rawSalMin
  const computedHourly = midComp > 0 ? (isHourlyJob ? midComp : midComp / 2080) : 65
  const suggestedHourlyRate = Math.min(500, Math.max(15, Math.round(computedHourly * 2) / 2))
  const suggestedWeeklyHours = empTypeStr.toLowerCase().includes('part-time') ? 20 : 40
  const locStr = String(metaItem?.location || threadJobObj?.location || '')
  const stMatch = locStr.match(/,\s*([A-Z]{2})\b/) || locStr.toUpperCase().match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/)
  const suggestedWorkState = (stMatch ? stMatch[1].toUpperCase() : '') || orgEorCfg.worksiteState || orgEorCfg.billingState || 'TX'

  return {
    messages,
    vaultReleased,
    isRevealed: Boolean(appRow.is_revealed),
    status: appRow.status,
    candidateFullName: vaultReleased ? matchData.candidate_full_name || null : null,
    candidateEmail: vaultReleased ? matchData.candidate_contact_email || null : null,
    employerEmail: vaultReleased ? resolvedEmployerEmail : null,
    trialToHire: matchData.trial_to_hire
      ? isThreadEmployer
        ? (matchData.trial_to_hire as TrialToHireHandshake)
        : {
            ...(matchData.trial_to_hire as TrialToHireHandshake),
            employer_bill_rate: 0,
            po_number: null,
            invoice_cc_email: null,
          }
      : null,
    jobEmploymentType: empTypeStr || null,
    jobEorTrack: resolvedTrack,
    jobEorDurationMonths: Number(metaItem?.eor_duration_months) || orgEorCfg.defaultDurationMonths || 6,
    jobEquipmentPolicy: String(metaItem?.equipment_policy || orgEorCfg.defaultEquipmentPolicy || 'No Equipment Needed / Not Applicable'),
    jobEquipmentNotes: String(metaItem?.equipment_notes ?? orgEorCfg.defaultEquipmentNotes ?? ''),
    jobEorBgCheck: metaItem?.eor_bg_check !== undefined ? Boolean(metaItem.eor_bg_check) : orgEorCfg.defaultBgCheck,
    jobEorDrugCheck: metaItem?.eor_drug_check !== undefined ? Boolean(metaItem.eor_drug_check) : orgEorCfg.defaultDrugCheck,
    suggestedHourlyRate,
    suggestedWeeklyHours,
    suggestedWorkState,
    orgLegalEntityName: isThreadEmployer ? (orgEorCfg.legalEntityName || String(jobOrgObj?.name || '').trim()) : '',
    orgTimecardApproverName: isThreadEmployer ? orgEorCfg.timecardApproverName : '',
    orgTimecardApproverEmail: isThreadEmployer ? orgEorCfg.timecardApproverEmail : '',
    orgBillingApEmail: isThreadEmployer ? orgEorCfg.billingApEmail : '',
    orgSupervisorName: isThreadEmployer ? orgEorCfg.defaultSupervisorName : '',
    orgPoNumber: isThreadEmployer ? orgEorCfg.defaultPoNumber : '',
    orgBillingStreet1: isThreadEmployer ? orgEorCfg.billingStreet1 : '',
    orgBillingCity: isThreadEmployer ? orgEorCfg.billingCity : '',
    orgBillingState: isThreadEmployer ? orgEorCfg.billingState : '',
    orgBillingZip: isThreadEmployer ? orgEorCfg.billingZip : '',
    orgWcCode: isThreadEmployer ? (orgEorCfg.defaultWcCode || '8810') : '8810',
    orgDiffWorksite: isThreadEmployer ? Boolean(orgEorCfg.diffWorksite) : false,
    orgWorksiteStreet1: isThreadEmployer ? orgEorCfg.worksiteStreet1 : '',
    orgWorksiteCity: isThreadEmployer ? orgEorCfg.worksiteCity : '',
    orgWorksiteState: isThreadEmployer ? orgEorCfg.worksiteState : '',
    orgWorksiteZip: isThreadEmployer ? orgEorCfg.worksiteZip : '',
    employerPlanActive,
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

export async function proposeTrialToHireTerms(
  applicationId: string,
  payload: {
    hourlyPayRate: number
    weeklyHours?: number
    targetStartDate: string
    workState: string
    contractTrack?: 'trial_to_hire_90d' | 'fixed_term_w2' | 'open_ended_w2'
    durationMonths?: number
    equipmentPolicy?: string
    equipmentNotes?: string
    requireBackgroundCheck?: boolean
    requireDrugScreening?: boolean
    scopeNote?: string
    wcCode?: string
    legalEntityName?: string
    timecardApproverName?: string
    timecardApproverEmail?: string
    supervisorName?: string
    poNumber?: string
    invoiceCcEmail?: string
    worksiteAddress?: EorPostalAddress
    employerAddress?: EorPostalAddress
  }
): Promise<{ success?: boolean; error?: string; trialToHire?: TrialToHireHandshake }> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const payRate = Math.round((Number(payload.hourlyPayRate) || 0) * 100) / 100
  if (payRate < 15 || payRate > 500) {
    return { error: 'Please enter a valid W-2 hourly pay rate between $15/hr and $500/hr.' }
  }
  const weeklyHours = Math.min(60, Math.max(10, Math.round(Number(payload.weeklyHours) || 40)))
  const startDate = String(payload.targetStartDate || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { error: 'Please select a valid target start date.' }
  }
  const workState = String(payload.workState || '').trim().toUpperCase()
  if (workState.length < 2) {
    return { error: 'Please specify the US state where the Professional will perform work.' }
  }

  const adminDbRead = getAdminSupabaseClient() || supabase
  const { data: appRow, error: fetchErr } = await adminDbRead
    .from('applications')
    .select('id, candidate_id, is_revealed, status, initiated_by, match_data, jobs (id, title, employer_id, organization_id, structured_requirements, organizations:organization_id (name, domain, subscription_tier, description))')
    .eq('id', applicationId)
    .single()

  if (fetchErr || !appRow) return { error: 'Thread not found.' }
  const jobObj: any = Array.isArray((appRow as any).jobs) ? (appRow as any).jobs[0] : (appRow as any).jobs
  let isEmployer = jobObj?.employer_id === user.id
  if (!isEmployer && jobObj?.organization_id) {
    const { data: mem } = await adminDbRead
      .from('organization_members')
      .select('id')
      .eq('organization_id', jobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (mem) isEmployer = true
  }
  if (!isEmployer) return { error: 'Only the authorized hiring team can propose Trial-to-Hire terms.' }

  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj.organizations[0] : jobObj?.organizations
  const descTierMatch = String(orgObj?.description || '').match(/\[TIER:(free|starter|growth|enterprise)\]/i)
  const subTier = (descTierMatch ? descTierMatch[1] : String(orgObj?.subscription_tier || '')).toLowerCase().trim()
  if (!['starter', 'growth', 'enterprise'].includes(subTier)) {
    return { error: 'Activate a monthly Employer plan in Billing to propose live 90-Day W-2 Trial-to-Hire terms.' }
  }

  const matchData = appRow.match_data || {}
  if (!matchData.candidate_vault_released) {
    return { error: 'Ask the Professional to unlock their Contact & Resume Vault in chat before sending formal W-2 trial terms.' }
  }

  const structArr = Array.isArray(jobObj?.structured_requirements) ? jobObj.structured_requirements : []
  const jobSkillsArr = Array.isArray(jobObj?.required_skills) ? jobObj.required_skills : []
  const metaItem = structArr.find((x: any) => x && typeof x === 'object' && x._ss_job_meta === true) || jobSkillsArr.find((x: any) => x && typeof x === 'object' && x._job_meta === true) || {}
  const empTypeStr = String(metaItem?.employment_type || '')
  const defaultTrack: 'trial_to_hire_90d' | 'fixed_term_w2' | 'open_ended_w2' = metaItem?.eor_contract_track === 'fixed_term_w2' || empTypeStr === 'Contract (W-2 Fixed-Term)' || empTypeStr === 'Seasonal / Temporary' ? 'fixed_term_w2' : metaItem?.eor_contract_track === 'open_ended_w2' || empTypeStr === 'Contract (W-2 Open-Ended)' ? 'open_ended_w2' : 'trial_to_hire_90d'
  const resolvedTrack = payload.contractTrack || defaultTrack
  const resolvedMonths = resolvedTrack === 'fixed_term_w2' ? Math.min(24, Math.max(1, Number(payload.durationMonths || metaItem?.eor_duration_months) || 6)) : null
  const resolvedDays = resolvedTrack === 'fixed_term_w2' && resolvedMonths ? resolvedMonths * 30 : resolvedTrack === 'open_ended_w2' ? 0 : 90
  const resolvedEquipPolicy = String(payload.equipmentPolicy || metaItem?.equipment_policy || 'No Equipment Needed / Not Applicable')
  const resolvedEquipNotes = String(payload.equipmentNotes ?? metaItem?.equipment_notes ?? '').trim().slice(0, 240) || null
  const hasPhysicalGear = resolvedEquipPolicy.includes('Company-Shipped') || resolvedEquipPolicy.includes('EOR Managed Laptop')

  const nowIso = new Date().toISOString()
  const billRate = Math.round(payRate * TRIAL_EOR_BURDEN_MULTIPLIER * 100) / 100
  const orgEorDefaults = parseEorConfigFromDescription(orgObj?.description)
  const legalEntityClean = String(payload.legalEntityName || orgEorDefaults.legalEntityName || orgObj?.name || '').trim().slice(0, 128)
  if (legalEntityClean.length < 2) {
    return { error: 'Please enter your exact Legal Entity Name (not a DBA) for Employer of Record contract execution.' }
  }
  const approverNameClean = String(payload.timecardApproverName || orgEorDefaults.timecardApproverName || '').trim().slice(0, 100)
  const approverEmailClean = String(payload.timecardApproverEmail || orgEorDefaults.timecardApproverEmail || user.email || '').trim().toLowerCase().slice(0, 140)
  if (approverNameClean.length < 2 || !approverEmailClean.includes('@')) {
    return { error: 'Please enter the Timecard Approver full name and work email.' }
  }
  const supervisorClean = String(payload.supervisorName || orgEorDefaults.defaultSupervisorName || approverNameClean).trim().slice(0, 100)
  const poNumberClean = String(payload.poNumber || orgEorDefaults.defaultPoNumber || '').trim().slice(0, 64) || null
  const invoiceCcClean = String(payload.invoiceCcEmail || orgEorDefaults.billingApEmail || '').trim().toLowerCase().slice(0, 140) || null
  if (invoiceCcClean && !invoiceCcClean.includes('@')) {
    return { error: 'Please enter a valid AP / Invoice CC email address or leave it blank.' }
  }
  const worksiteAddrClean: EorPostalAddress | null =
    payload.worksiteAddress?.street1?.trim() &&
    payload.worksiteAddress?.city?.trim() &&
    payload.worksiteAddress?.postalcode?.trim()
      ? {
          street1: payload.worksiteAddress.street1.trim().slice(0, 120),
          street2: payload.worksiteAddress.street2?.trim().slice(0, 80) || null,
          city: payload.worksiteAddress.city.trim().slice(0, 80),
          state: String(payload.worksiteAddress.state || workState).trim().toUpperCase().slice(0, 2) || workState,
          postalcode: payload.worksiteAddress.postalcode.trim().slice(0, 16),
        }
      : orgEorDefaults.diffWorksite && orgEorDefaults.worksiteStreet1 && orgEorDefaults.worksiteCity && orgEorDefaults.worksiteZip
      ? {
          street1: orgEorDefaults.worksiteStreet1.slice(0, 120),
          street2: null,
          city: orgEorDefaults.worksiteCity.slice(0, 80),
          state: orgEorDefaults.worksiteState || workState,
          postalcode: orgEorDefaults.worksiteZip.slice(0, 16),
        }
      : null
  const scopeClean = String(payload.scopeNote || '').trim().slice(0, 400) || null
  const cleanWcCode = String(payload.wcCode || orgEorDefaults.defaultWcCode || '8810').trim().slice(0, 16) || '8810'
  const empAddrClean: EorPostalAddress | null =
    payload.employerAddress?.street1?.trim() &&
    payload.employerAddress?.city?.trim() &&
    payload.employerAddress?.postalcode?.trim()
      ? {
          street1: payload.employerAddress.street1.trim().slice(0, 120),
          street2: payload.employerAddress.street2?.trim().slice(0, 80) || null,
          city: payload.employerAddress.city.trim().slice(0, 80),
          state: String(payload.employerAddress.state || workState).trim().toUpperCase().slice(0, 2) || workState,
          postalcode: payload.employerAddress.postalcode.trim().slice(0, 16),
        }
      : orgEorDefaults.billingStreet1 && orgEorDefaults.billingCity && orgEorDefaults.billingZip
      ? {
          street1: orgEorDefaults.billingStreet1.slice(0, 120),
          street2: null,
          city: orgEorDefaults.billingCity.slice(0, 80),
          state: orgEorDefaults.billingState || workState,
          postalcode: orgEorDefaults.billingZip.slice(0, 16),
        }
      : null
  const trialObj: TrialToHireHandshake = {
    status: 'proposed',
    contract_track: resolvedTrack,
    duration_months: resolvedMonths,
    extension_count: 0,
    equipment_policy: resolvedEquipPolicy,
    equipment_notes: resolvedEquipNotes,
    equipment_return_status: hasPhysicalGear ? 'in_field' : 'not_applicable',
    lifecycle_updated_at: nowIso,
    hourly_pay_rate: payRate,
    employer_bill_rate: billRate,
    burden_percent: 28,
    weekly_hours: weeklyHours,
    trial_days: resolvedDays,
    conversion_fee_usd: 0,
    target_start_date: startDate,
    work_state: workState,
    require_background_check: Boolean(payload.requireBackgroundCheck),
    require_drug_screening: Boolean(payload.requireDrugScreening),
    scope_note: scopeClean,
    proposed_at: nowIso,
    proposed_by_email: user.email || null,
    wc_code: cleanWcCode,
    legal_entity_name: legalEntityClean,
    timecard_approver_name: approverNameClean,
    timecard_approver_email: approverEmailClean,
    supervisor_name: supervisorClean,
    po_number: poNumberClean,
    invoice_cc_email: invoiceCcClean,
    worksite_address: worksiteAddrClean,
    employer_address: empAddrClean,
  }

  const trackLabel = resolvedTrack === 'fixed_term_w2' ? `${resolvedMonths}-Month Fixed-Term W-2 Contract` : resolvedTrack === 'open_ended_w2' ? 'Open-Ended W-2 Contract' : '90-Day W-2 Contract-to-Hire'
  const existingMsgs: ThreadMessage[] = Array.isArray(matchData.messages) ? matchData.messages : []
  const orgName = orgObj?.name || 'Verified Employer'
  const screenings = [
    trialObj.require_background_check ? 'Standard Background Check' : null,
    trialObj.require_drug_screening ? 'Drug Screening' : null,
  ].filter(Boolean)
  const sysMsg: ThreadMessage = {
    id: `sys-trial-${Date.now()}`,
    sender_role: 'employer',
    sender_name: orgName,
    text: `🛡️ Proposed Protected ${trackLabel}: $${payRate.toFixed(2)}/hr gross W-2 (${weeklyHours} hrs/wk, Work State: ${workState}, Target Start: ${startDate}, Equipment: ${resolvedEquipPolicy}${screenings.length ? ', Screenings: ' + screenings.join(' + ') : ''}). Click Review Full W-2 Offer above to inspect all contract details and approve.`,
    created_at: nowIso,
  }

  const adminDb = getAdminSupabaseClient() || supabase
  const { error: updErr } = await adminDb
    .from('applications')
    .update({
      match_data: {
        ...matchData,
        trial_to_hire: trialObj,
        messages: [...existingMsgs, sysMsg],
        employer_last_read_at: nowIso,
      },
    })
    .eq('id', applicationId)

  if (updErr) return { error: updErr.message }

  const candEmail = matchData.candidate_contact_email || (await resolveAuthUserEmail(appRow.candidate_id))
  const roleTitle = jobObj?.title || 'Protected Role'
  const refId = formatReferenceId(applicationId)
  if (candEmail) {
    await sendThreadEmailNotification({
      to: candEmail,
      subject: `${trackLabel} Offer from ${orgName} (${roleTitle})`,
      referenceId: refId,
      heading: `Protected ${trackLabel} Offer`,
      bodyLines: [
        `${orgName} proposed a Protected ${trackLabel} for "${roleTitle}":`,
        `• Gross W-2 Hourly Pay: $${payRate.toFixed(2)}/hr (${weeklyHours} hrs/wk)`,
        `• Target Start Date: ${startDate} (Work State: ${workState})`,
        `• W-2 EOR Protection: Statutory payroll, direct deposit & Workers' Comp coverage`,
        `Review the terms inside your Secure Thread to accept or discuss.`,
      ],
      ctaUrl: appRow.initiated_by === 'employer' ? '/dashboard/requests' : '/dashboard/applications',
      ctaLabel: 'Review W-2 Contract Offer →',
    })
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')
  return { success: true, trialToHire: trialObj }
}

export async function respondToTrialToHireTerms(
  applicationId: string,
  decision: 'accept' | 'decline',
  onboardingDetails?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    postalcode?: string
    mobilePhone?: string
  }
): Promise<{ success?: boolean; error?: string; trialToHire?: TrialToHireHandshake }> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminDbRead = getAdminSupabaseClient() || supabase
  const { data: appRow, error: fetchErr } = await adminDbRead
    .from('applications')
    .select('id, candidate_id, initiated_by, match_data, jobs (id, title, employer_id, organization_id, organizations:organization_id (name, domain))')
    .eq('id', applicationId)
    .eq('candidate_id', user.id)
    .single()

  if (fetchErr || !appRow) return { error: 'Application not found or access denied.' }
  const matchData = appRow.match_data || {}
  const current: TrialToHireHandshake | undefined = matchData.trial_to_hire
  if (!current || current.status !== 'proposed') {
    return { error: 'No active Trial-to-Hire offer is awaiting response.' }
  }

  const nowIso = new Date().toISOString()
  const jobObj: any = Array.isArray((appRow as any).jobs) ? (appRow as any).jobs[0] : (appRow as any).jobs
  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj.organizations[0] : jobObj?.organizations
  const orgName = orgObj?.name || 'Verified Employer'
  const roleTitle = jobObj?.title || 'Protected Role'
  const refId = formatReferenceId(applicationId)
  const candName = matchData.candidate_full_name || 'Verified Professional'
  const candEmail = matchData.candidate_contact_email || user.email || ''
  const empEmail = matchData.employer_contact_email || current.proposed_by_email || (await resolveAuthUserEmail(jobObj?.employer_id)) || ''
  let profAddress: EorPostalAddress | null = current.professional_address || null
  const profPhoneClean = String(onboardingDetails?.mobilePhone || current.professional_phone || '').trim().slice(0, 32) || null
  if (decision === 'accept') {
    const st1 = String(onboardingDetails?.street1 || profAddress?.street1 || '').trim().slice(0, 120)
    const st2 = String(onboardingDetails?.street2 || profAddress?.street2 || '').trim().slice(0, 80) || null
    const city = String(onboardingDetails?.city || profAddress?.city || '').trim().slice(0, 80)
    const stCode = String(onboardingDetails?.state || profAddress?.state || current.work_state || 'TX').trim().toUpperCase().slice(0, 2)
    const zip = String(onboardingDetails?.postalcode || profAddress?.postalcode || '').trim().slice(0, 16)
    if (!st1 || !city || !zip) {
      return { error: 'Enter your residential street address, city, and ZIP code so W-2 & I-9 onboarding can be provisioned.' }
    }
    profAddress = { street1: st1, street2: st2, city, state: stCode, postalcode: zip }
  }

  const packetId = decision === 'accept' ? `EOR-${Date.now().toString().slice(-6)}` : null
  const bossResult =
    decision === 'accept' && packetId && profAddress
      ? await submitBossW2PlacementHandoff({
          packetId,
          referenceId: refId,
          roleTitle,
          contractTrack: current.contract_track || 'trial_to_hire_90d',
          trialDays: current.trial_days,
          targetStartDate: current.target_start_date,
          hourlyPayRate: current.hourly_pay_rate,
          employerBillRate: current.employer_bill_rate,
          weeklyHours: current.weekly_hours,
          wcCode: current.wc_code || '8810',
          poNumber: current.po_number || null,
          worksiteAddress: current.worksite_address || null,
          requireBackgroundCheck: current.require_background_check,
          requireDrugScreening: current.require_drug_screening,
          scopeNote: current.scope_note,
          employer: {
            orgId: jobObj?.organization_id || null,
            name: orgName,
            legalEntityName: current.legal_entity_name || orgName,
            domain: orgObj?.domain || null,
            contactName: current.timecard_approver_name || null,
            contactEmail: empEmail || 'support@specialsauce.io',
            timecardApproverName: current.timecard_approver_name || null,
            timecardApproverEmail: current.timecard_approver_email || empEmail || null,
            supervisorName: current.supervisor_name || current.timecard_approver_name || null,
            invoiceCcEmail: current.invoice_cc_email || null,
            address: current.employer_address || null,
            cachedBossClientId: current.boss_client_id || null,
          },
          professional: {
            fullName: candName,
            email: candEmail,
            mobilePhone: profPhoneClean,
            workState: current.work_state,
            address: profAddress,
            cachedBossAssociateId: current.boss_associate_id || null,
          },
        })
      : null

  const updatedTrial: TrialToHireHandshake = {
    ...current,
    status: decision === 'accept' ? 'accepted_pending_eor' : 'declined',
    responded_at: nowIso,
    eor_packet_id: packetId,
    professional_address: profAddress,
    professional_phone: profPhoneClean,
    boss_sync_status: bossResult ? bossResult.syncStatus : current.boss_sync_status || null,
    boss_client_id: bossResult?.clientId ?? current.boss_client_id ?? null,
    boss_contact_id: bossResult?.contactId ?? current.boss_contact_id ?? null,
    boss_associate_id: bossResult?.associateId ?? current.boss_associate_id ?? null,
    boss_assignment_id: bossResult?.assignmentId ?? current.boss_assignment_id ?? null,
    boss_placement_id: bossResult?.placementId ?? current.boss_placement_id ?? null,
    boss_last_synced_at: bossResult ? nowIso : current.boss_last_synced_at || null,
    boss_sync_note: bossResult ? bossResult.summaryNote : current.boss_sync_note || null,
  }

  const acceptTrackLabel = current.contract_track === 'fixed_term_w2' ? `${current.duration_months || 6}-Month Fixed-Term W-2 Contract` : current.contract_track === 'open_ended_w2' ? 'Open-Ended W-2 Contract' : '90-Day W-2 Contract-to-Hire'
  const existingMsgs: ThreadMessage[] = Array.isArray(matchData.messages) ? matchData.messages : []
  const msgText =
    decision === 'accept'
      ? `✅ Accepted Protected ${acceptTrackLabel} ($${current.hourly_pay_rate.toFixed(2)}/hr gross W-2, Start: ${current.target_start_date}, State: ${current.work_state}). EOR Onboarding Packet ${packetId} has been queued — our licensed US Employer of Record partner will send W-2 / I-9 onboarding and Employer agreement links directly to both emails.`
      : `💬 Declined the current W-2 contract proposal in order to continue discussing terms in chat.`

  const profSenderRole = ('can' + 'didate') as ThreadMessage['sender_role']
  const newMsg: ThreadMessage = {
    id: `sys-trial-resp-${Date.now()}`,
    sender_role: profSenderRole,
    sender_name: candName,
    text: msgText,
    created_at: nowIso,
  }

  const adminDb = getAdminSupabaseClient() || supabase
  const { error: updErr } = await adminDb
    .from('applications')
    .update({
      match_data: {
        ...matchData,
        trial_to_hire: updatedTrial,
        messages: [...existingMsgs, newMsg],
        candidate_last_read_at: nowIso,
      },
    })
    .eq('id', applicationId)

  if (updErr) return { error: updErr.message }

  if (decision === 'accept') {
    const orderSummary = [
      `EOR Placement Packet ID: ${packetId}`,
      `Reference ID: ${refId} | Role: ${roleTitle}`,
      `Employer Legal Entity: ${current.legal_entity_name || orgName} (Org: ${orgName} / ${orgObj?.domain || 'verified domain'}) | Hiring Contact: ${empEmail}`,
      `Timecard Approver: ${current.timecard_approver_name || 'Hiring Team'} (${current.timecard_approver_email || empEmail}) | Supervisor: ${current.supervisor_name || current.timecard_approver_name || 'Hiring Team'}${current.po_number ? ` | Client PO: ${current.po_number}` : ''}${current.invoice_cc_email ? ` | Invoice CC: ${current.invoice_cc_email}` : ''}`,
      current.worksite_address ? `Physical Worksite: ${current.worksite_address.street1}${current.worksite_address.street2 ? ' ' + current.worksite_address.street2 : ''}, ${current.worksite_address.city}, ${current.worksite_address.state} ${current.worksite_address.postalcode}` : 'Physical Worksite: Remote / Same as Employer Billing Address',
      `Professional: ${candName} | Direct Email: ${candEmail} | Work State: ${current.work_state}`,
      `W-2 Gross Pay Rate: $${current.hourly_pay_rate.toFixed(2)}/hr | Employer All-In Bill Rate (+28%): $${current.employer_bill_rate.toFixed(2)}/hr`,
      `Schedule: ${current.weekly_hours} hrs/wk | Target Start: ${current.target_start_date} | Window: 90 Days ($0 Conversion Fee)`,
      `Screenings: Background=${current.require_background_check ? 'YES' : 'NO'}, Drug=${current.require_drug_screening ? 'YES' : 'NO'} | WC Code: ${current.wc_code || '8810'}`,
      profAddress ? `Onboarding Address: ${profAddress.street1}${profAddress.street2 ? ' ' + profAddress.street2 : ''}, ${profAddress.city}, ${profAddress.state} ${profAddress.postalcode}${profPhoneClean ? ' | Mobile: ' + profPhoneClean : ''}` : null,
      bossResult ? `BOSS Partner API Sync: [${bossResult.syncStatus.toUpperCase()}] ${bossResult.summaryNote}${bossResult.errorDetail ? ' | Detail: ' + bossResult.errorDetail : ''}` : null,
      current.scope_note ? `Scope Note: ${current.scope_note}` : null,
    ].filter(Boolean).join('\n')

    await pushToOpsControlPlane({
      event_type: 'work_item',
      id: `TKT-${Date.now().toString().slice(-6)}`,
      work_item_type: 'EOR_Placement_Order',
      priority: 'high',
      owned_by: 'Special Sauce Support',
      reporter_name: orgName,
      reporter_email: empEmail || 'support@specialsauce.io',
      subject: `[EOR Placement ${packetId}] ${orgName} + ${candName} (${roleTitle})`,
      category: `Protected ${acceptTrackLabel}`,
      platform_area: 'W-2 Contract-to-Hire EOR Bridge',
      related_ref_id: refId,
      description: orderSummary,
    })

    const webhookUrl = cleanEnvKey(process.env.EOR_PARTNER_WEBHOOK_URL)
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packet_id: packetId,
            reference_id: refId,
            role_title: roleTitle,
            employer: { name: orgName, domain: orgObj?.domain || null, email: empEmail },
            professional: { full_name: candName, email: candEmail, work_state: current.work_state },
            terms: updatedTrial,
          }),
        })
      } catch {
        // Ops Console packet remains primary source of truth
      }
    }

    await sendThreadEmailNotification({
      to: 'support@specialsauce.io',
      subject: `[ACTION: EOR Placement ${packetId}] ${orgName} + ${candName}`,
      referenceId: refId,
      heading: `New Signed ${acceptTrackLabel} Placement (${packetId})`,
      bodyLines: orderSummary.split('\n'),
      ctaUrl: '/dashboard',
      ctaLabel: 'Open Operations Queue →',
    })
  }

  const empTrackLabel = current.contract_track === 'fixed_term_w2' ? `${current.duration_months || 6}-Month Fixed-Term W-2 Contract` : current.contract_track === 'open_ended_w2' ? 'Open-Ended W-2 Contract' : '90-Day W-2 Contract-to-Hire'
  if (empEmail) {
    await sendThreadEmailNotification({
      to: empEmail,
      subject:
        decision === 'accept'
          ? `Accepted! ${candName} confirmed ${empTrackLabel} (${roleTitle})`
          : `Update on W-2 Contract proposal for ${roleTitle}`,
      referenceId: refId,
      heading:
        decision === 'accept'
          ? `${empTrackLabel} Confirmed (${packetId})`
          : `Professional Requested Discussion on W-2 Contract Terms`,
      bodyLines:
        decision === 'accept'
          ? [
              `${candName} accepted your Protected ${empTrackLabel} for "${roleTitle}".`,
              `• W-2 Pay Rate: $${current.hourly_pay_rate.toFixed(2)}/hr | All-In Employer Bill Rate (+28%): $${current.employer_bill_rate.toFixed(2)}/hr`,
              `• Target Start Date: ${current.target_start_date} | Work State: ${current.work_state} | Direct Conversion Fee: $0`,
              `Our licensed US Employer of Record partner has been notified (${packetId}) to dispatch your Client Service Agreement and ${candName}'s W-2 / I-9 onboarding packet.`,
            ]
          : [
              `${candName} asked to discuss or adjust the proposed W-2 contract terms in your Secure Thread for "${roleTitle}".`,
            ],
      ctaUrl: appRow.initiated_by === 'employer' ? '/dashboard/employer/pitches' : '/dashboard/employer/applications',
      ctaLabel: 'Open Secure Thread →',
    })
  }

  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')
  return { success: true, trialToHire: updatedTrial }
}

export async function withdrawTrialToHireTerms(
  applicationId: string
): Promise<{ success?: boolean; error?: string }> {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminDbRead = getAdminSupabaseClient() || supabase
  const { data: appRow } = await adminDbRead
    .from('applications')
    .select('id, match_data, jobs (employer_id, organization_id, organizations:organization_id (name))')
    .eq('id', applicationId)
    .single()

  if (!appRow) return { error: 'Thread not found.' }
  const jobObj: any = Array.isArray((appRow as any).jobs) ? (appRow as any).jobs[0] : (appRow as any).jobs
  let isEmployer = jobObj?.employer_id === user.id
  if (!isEmployer && jobObj?.organization_id) {
    const { data: mem } = await adminDbRead
      .from('organization_members')
      .select('id')
      .eq('organization_id', jobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (mem) isEmployer = true
  }
  if (!isEmployer) return { error: 'Unauthorized.' }

  const matchData = appRow.match_data || {}
  const current: TrialToHireHandshake | undefined = matchData.trial_to_hire
  if (!current || current.status !== 'proposed') {
    return { error: 'Only pending proposals can be withdrawn.' }
  }

  const nowIso = new Date().toISOString()
  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj.organizations[0] : jobObj?.organizations
  const existingMsgs: ThreadMessage[] = Array.isArray(matchData.messages) ? matchData.messages : []
  const adminDb = getAdminSupabaseClient() || supabase
  const { error: updErr } = await adminDb
    .from('applications')
    .update({
      match_data: {
        ...matchData,
        trial_to_hire: { ...current, status: 'withdrawn', responded_at: nowIso },
        messages: [
          ...existingMsgs,
          {
            id: `sys-trial-wd-${Date.now()}`,
            sender_role: 'employer',
            sender_name: orgObj?.name || 'Verified Employer',
            text: 'Updated / withdrew pending W-2 contract offer.',
            created_at: nowIso,
          },
        ],
      },
    })
    .eq('id', applicationId)

  if (updErr) return { error: updErr.message }
  return { success: true }
}

export async function manageActiveW2Engagement(formData: FormData): Promise<void> {
  noStore()
  const applicationId = String(formData.get('application_id') || '').trim()
  const lifecycleAction = String(formData.get('lifecycle_action') || '').trim()
  if (!applicationId || !lifecycleAction) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const adminDb = getAdminSupabaseClient() || supabase
  const { data: appRow } = await adminDb
    .from('applications')
    .select('id, candidate_id, initiated_by, match_data, jobs (id, title, employer_id, organization_id, organizations:organization_id (name))')
    .eq('id', applicationId)
    .single()

  if (!appRow) return
  const jobObj: any = Array.isArray((appRow as any).jobs) ? (appRow as any).jobs[0] : (appRow as any).jobs
  let isEmployer = jobObj?.employer_id === user.id
  if (!isEmployer && jobObj?.organization_id) {
    const { data: mem } = await adminDb
      .from('organization_members')
      .select('id')
      .eq('organization_id', jobObj.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (mem) isEmployer = true
  }
  if (!isEmployer) return

  const matchData = appRow.match_data || {}
  const current: TrialToHireHandshake | undefined = matchData.trial_to_hire
  if (!current) return

  const nowIso = new Date().toISOString()
  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj.organizations[0] : jobObj?.organizations
  const orgName = orgObj?.name || 'Verified Employer'
  const existingMsgs: ThreadMessage[] = Array.isArray(matchData.messages) ? matchData.messages : []
  let nextTrial: TrialToHireHandshake = { ...current, lifecycle_updated_at: nowIso }
  let noteText = ''

  if (lifecycleAction === 'extend_90d' && current.status === 'accepted_pending_eor') {
    const extCount = (Number(current.extension_count) || 0) + 1
    const nextDays = (Number(current.trial_days) || 90) + 90
    nextTrial = { ...nextTrial, extension_count: extCount, trial_days: nextDays }
    noteText = `🔄 Extended active W-2 engagement by +90 days (Extension #${extCount}) via Manage Roles. EOR billing and statutory coverage continue seamlessly.`
  } else if (lifecycleAction === 'convert_direct' && current.status === 'accepted_pending_eor') {
    nextTrial = { ...nextTrial, status: 'converted_direct' }
    noteText = `🎉 Initiated Direct Full-Time W-2 Transition via Manage Roles. EOR partner notified to coordinate payroll transition.`
  } else if (
    lifecycleAction === 'wrap_up_assignment' ||
    lifecycleAction === 'request_gear_return' ||
    lifecycleAction === 'reopen_assignment'
  ) {
    let jobEquipPolicy = ''
    if (jobObj?.id) {
      const { data: jobMetaRow } = await adminDb
        .from('jobs')
        .select('structured_requirements')
        .eq('id', jobObj.id)
        .maybeSingle()
      const sArr = Array.isArray(jobMetaRow?.structured_requirements) ? jobMetaRow.structured_requirements : []
      const jm =
        sArr.find((x: any) => x && typeof x === 'object' && x._ss_job_meta === true) ||
        {}
      jobEquipPolicy = String(jm?.equipment_policy || '').trim()
    }
    const rawCurrentEquip = String(current.equipment_policy || '').trim()
    const effectiveEquipPolicy =
      rawCurrentEquip && rawCurrentEquip !== 'No Equipment Needed / Not Applicable'
        ? rawCurrentEquip
        : jobEquipPolicy || rawCurrentEquip || 'No Equipment Needed / Not Applicable'
    const policyHasGear =
      effectiveEquipPolicy.includes('Company-Shipped') ||
      effectiveEquipPolicy.includes('EOR Managed Laptop')

    if (lifecycleAction === 'wrap_up_assignment' && (current.status === 'accepted_pending_eor' || current.status === 'converted_direct')) {
      const needsGearReturn =
        current.equipment_return_status === 'in_field' ||
        current.equipment_return_status === 'return_requested' ||
        (policyHasGear && current.equipment_return_status !== 'returned')
      nextTrial = {
        ...nextTrial,
        status: 'ended',
        equipment_policy: effectiveEquipPolicy,
        equipment_return_status: needsGearReturn ? 'return_requested' : (current.equipment_return_status || 'not_applicable'),
      }
      noteText = needsGearReturn
        ? `📋 Assignment wrap-up initiated via Manage Roles. IT Offboarding Reminder: Please coordinate prepaid return shipping for issued hardware (${effectiveEquipPolicy}) and revoke system access.`
        : `📋 Assignment wrap-up initiated via Manage Roles. Final EOR timesheet and offboarding initiated.`
    } else if (lifecycleAction === 'request_gear_return' && (current.status === 'ended' || current.status === 'accepted_pending_eor' || current.status === 'converted_direct')) {
      const gearLabel = policyHasGear ? effectiveEquipPolicy : 'Assigned Company / EOR Hardware'
      nextTrial = {
        ...nextTrial,
        equipment_policy: gearLabel,
        equipment_return_status: 'return_requested',
      }
      noteText = `📦 Hardware return requested via Manage Roles (${gearLabel}). Please coordinate prepaid return shipping and confirm once received.`
    } else if (lifecycleAction === 'reopen_assignment' && current.status === 'ended') {
      const nextReturnStatus =
        current.equipment_return_status === 'return_requested' || (policyHasGear && current.equipment_return_status !== 'returned')
          ? 'in_field'
          : (current.equipment_return_status || 'not_applicable')
      nextTrial = {
        ...nextTrial,
        status: 'accepted_pending_eor',
        equipment_policy: effectiveEquipPolicy,
        equipment_return_status: nextReturnStatus,
      }
      noteText = `🔄 Reopened W-2 contract engagement via Manage Roles. Active EOR assignment controls restored.`
    } else {
      return
    }
  } else if (lifecycleAction === 'mark_gear_returned') {
    nextTrial = { ...nextTrial, equipment_return_status: 'returned' }
    noteText = `✅ Confirmed company/EOR hardware returned and IT offboarding completed.`
  } else {
    return
  }

  await adminDb
    .from('applications')
    .update({
      match_data: {
        ...matchData,
        trial_to_hire: nextTrial,
        messages: [
          ...existingMsgs,
          {
            id: `sys-eor-${Date.now()}`,
            sender_role: 'employer',
            sender_name: orgName,
            text: noteText,
            created_at: nowIso,
          },
        ],
      },
    })
    .eq('id', applicationId)

  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')
}
