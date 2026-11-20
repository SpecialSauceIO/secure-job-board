'use server'

import crypto from 'crypto'
import dns from 'dns/promises'
import net from 'net'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveEmployerTierInfo } from '@/app/dashboard/actions'
import { recordHandshakeTelemetry } from '@/lib/security-telemetry'

export interface EnterpriseAtsConfig {
  webhookUrl: string
  webhookSecret: string
  greenhouseApiKey: string
  greenhouseOnBehalfOf: string
  autoPushStage2: boolean
}

function getAtsVaultKey(): Buffer | null {
  const raw = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STRIPE_SECRET_KEY || '').trim().replace(/^["\u0027]+|["\u0027]+$/g, '').trim()
  if (!raw) return null
  return crypto.createHash('sha256').update('ss_ats_cfg_v1:' + raw).digest()
}

function isBlockedIpAddress(ip: string): boolean {
  const normalized = ip.trim().toLowerCase().replace(/^::ffff:/, '')
  if (net.isIPv4(normalized)) {
    const parts = normalized.split('.').map(Number)
    const [a, b] = parts
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 198 && (b === 18 || b === 19)) return true
    if (a >= 224) return true
    return false
  }
  if (net.isIPv6(ip)) {
    const lower = ip.trim().toLowerCase()
    if (lower === '::' || lower === '::1') return true
    if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true
    return false
  }
  return true
}

async function validateSafeAtsWebhookUrl(rawUrl: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return { ok: false, error: 'Webhook URL is empty.' }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'Webhook Endpoint URL must be a valid https:// URL.' }
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Webhook Endpoint URL must use https:// (unencrypted http:// is blocked).' }
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Webhook Endpoint URL cannot include embedded credentials.' }
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host === 'metadata.google.internal' || !host.includes('.')) {
    return { ok: false, error: 'Webhook Endpoint URL must point to a public external domain.' }
  }
  if (net.isIP(host)) {
    if (isBlockedIpAddress(host)) {
      return { ok: false, error: 'Private, loopback, and metadata IP addresses are blocked for webhooks.' }
    }
    return { ok: true, url: parsed.toString() }
  }
  try {
    const resolved = await dns.lookup(host, { all: true })
    if (!resolved.length || resolved.some((entry) => isBlockedIpAddress(entry.address))) {
      return { ok: false, error: 'Webhook Endpoint hostname resolves to a restricted or non-routable network address.' }
    }
  } catch {
    return { ok: false, error: 'Unable to resolve Webhook Endpoint hostname via public DNS.' }
  }
  return { ok: true, url: parsed.toString() }
}

function parseAtsConfigFromDescription(desc?: string | null): EnterpriseAtsConfig {
  const raw = String(desc || '')
  const match = raw.match(/\[ATS_CFG:([A-Za-z0-9+/=]+)\]/i)
  if (match?.[1]) {
    try {
      const decodedBuf = Buffer.from(match[1], 'base64')
      const decodedStr = decodedBuf.toString('utf-8')
      let jsonStr = decodedStr
      if (decodedStr.startsWith('v1:')) {
        const key = getAtsVaultKey()
        if (!key) throw new Error('Missing ATS vault key')
        const [, ivHex, tagHex, ctHex] = decodedStr.split(':')
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
        jsonStr = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf-8')
      }
      const parsed = JSON.parse(jsonStr)
      return {
        webhookUrl: parsed.webhookUrl || '',
        webhookSecret: parsed.webhookSecret || 'whsec_' + crypto.randomBytes(16).toString('hex'),
        greenhouseApiKey: parsed.greenhouseApiKey || '',
        greenhouseOnBehalfOf: parsed.greenhouseOnBehalfOf || '',
        autoPushStage2: parsed.autoPushStage2 !== false,
      }
    } catch {
      // Fallback below
    }
  }

  return {
    webhookUrl: '',
    webhookSecret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
    greenhouseApiKey: '',
    greenhouseOnBehalfOf: '',
    autoPushStage2: true,
  }
}

function embedAtsConfigInDescription(
  existingDesc: string | null | undefined,
  cfg: EnterpriseAtsConfig
): string {
  const cleaned = String(existingDesc || '')
    .replace(/\[ATS_CFG:[A-Za-z0-9+/=]+\]/gi, '')
    .trim()
  const key = getAtsVaultKey()
  if (!key) {
    throw new Error('Missing ATS encryption secret in environment.')
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(cfg), 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const envelope = `v1:${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`
  const base64Cfg = Buffer.from(envelope, 'utf-8').toString('base64')
  return (cleaned + ' [ATS_CFG:' + base64Cfg + ']').trim()
}

export async function getEnterpriseAtsSettings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'No organization found' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  if (!org) return { error: 'Organization not found' }

  const tierInfo = await resolveEmployerTierInfo(org)
  const isEnterprise = tierInfo.tier === 'enterprise'
  const rawCfg = parseAtsConfigFromDescription(org.description)
  const config: EnterpriseAtsConfig = isEnterprise
    ? rawCfg
    : {
        webhookUrl: rawCfg.webhookUrl,
        webhookSecret: '',
        greenhouseApiKey: '',
        greenhouseOnBehalfOf: rawCfg.greenhouseOnBehalfOf,
        autoPushStage2: rawCfg.autoPushStage2,
      }

  return {
    organizationId: org.id,
    organizationName: org.name || org.domain || 'Verified Employer',
    isEnterprise,
    tierLabel: tierInfo.label,
    config,
  }
}

export async function saveEnterpriseAtsSettings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Organization membership required.' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  if (!org) return { error: 'Organization not found.' }

  const tierInfo = await resolveEmployerTierInfo(org)
  if (tierInfo.tier !== 'enterprise') {
    return {
      error: 'Enterprise Tier ($1,250/mo Founding ($1,999 Retail)) is required to configure Workday & Greenhouse HR software connections.',
    }
  }

  const existingCfg = parseAtsConfigFromDescription(org.description)
  const regenerateSecret = formData.get('regenerate_secret') === 'true'

  const rawWebhookUrl = String(formData.get('webhook_url') || '').trim()
  let validatedWebhookUrl = ''
  if (rawWebhookUrl) {
    const urlCheck = await validateSafeAtsWebhookUrl(rawWebhookUrl)
    if (!urlCheck.ok || !urlCheck.url) {
      return { error: urlCheck.error || 'Invalid Webhook Endpoint URL.' }
    }
    validatedWebhookUrl = urlCheck.url
  }

  const updatedCfg: EnterpriseAtsConfig = {
    webhookUrl: validatedWebhookUrl,
    webhookSecret: regenerateSecret
      ? 'whsec_' + crypto.randomBytes(16).toString('hex')
      : String(formData.get('webhook_secret') || existingCfg.webhookSecret).trim(),
    greenhouseApiKey: String(formData.get('greenhouse_api_key') || '').trim(),
    greenhouseOnBehalfOf: String(formData.get('greenhouse_on_behalf_of') || '').trim(),
    autoPushStage2: formData.get('auto_push_stage2') === 'true',
  }

  const updatedDescription = embedAtsConfigInDescription(org.description, updatedCfg)

  const { error: updateErr } = await supabase
    .from('organizations')
    .update({ description: updatedDescription })
    .eq('id', org.id)

  if (updateErr) {
    return { error: updateErr.message }
  }

  revalidatePath('/dashboard/employer/organization')
  return {
    success: true,
    config: updatedCfg,
    message: regenerateSecret
      ? 'New HMAC Webhook Signing Secret generated and saved.'
      : 'Enterprise ATS & Webhook configuration saved.',
  }
}

export async function fireTestAtsWebhook() {
  const settings = await getEnterpriseAtsSettings()
  if (settings.error || !settings.config) {
    return { error: settings.error || 'Unable to load ATS settings.' }
  }
  if (!settings.isEnterprise) {
    return { error: 'Enterprise Tier is required to fire ATS webhooks.' }
  }

  const { webhookUrl, webhookSecret } = settings.config
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return {
      error: 'Please save a valid https:// Webhook Endpoint URL first before firing a test event.',
    }
  }

  const samplePayload = {
    event: 'candidate.vault_released',
    timestamp: new Date().toISOString(),
    environment: 'enterprise_test',
    reference_id: 'SS-ENT9824A',
    organization: settings.organizationName,
    job: {
      title: 'Senior Enterprise Program Manager',
      work_model: 'remote',
      employment_type: 'Full-Time (W-2)',
    },
    ai_match_evaluation: {
      overall_score: 94,
      brief_analysis:
        'Exceptional alignment across technical enablement, enterprise documentation, and cross-functional program leadership.',
      radar_breakdown: [
        { subject: 'Core Skills', score: 96 },
        { subject: 'Experience Depth', score: 95 },
        { subject: 'Domain Fit', score: 92 },
        { subject: 'Credentials & Certs', score: 90 },
        { subject: 'Role Alignment', score: 97 },
      ],
    },
    candidate_vault: {
      full_name: 'Alex Rivera (Test Professional)',
      email: 'alex.rivera.test@example.com',
      identity_verified: true,
      experience_years: 12,
      education_level: "Bachelor's Degree",
      resume_pdf_url: 'https://specialsauce.io/sample-vault-resume.pdf',
    },
  }

  const bodyString = JSON.stringify(samplePayload)
  const signature = crypto
    .createHmac('sha256', webhookSecret || 'whsec_default')
    .update(bodyString)
    .digest('hex')

  const urlCheck = await validateSafeAtsWebhookUrl(webhookUrl)
  if (!urlCheck.ok || !urlCheck.url) {
    return { error: urlCheck.error || 'Blocked Webhook Endpoint URL.' }
  }

  try {
    const response = await fetch(urlCheck.url, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        'X-SpecialSauce-Event': 'candidate.vault_released',
        'X-SpecialSauce-Signature': 'sha256=' + signature,
        'User-Agent': 'SpecialSauce-Enterprise-Webhook/1.0',
      },
      body: bodyString,
    })

    return {
      success: response.ok,
      status: response.status,
      message: response.ok
        ? '✓ Test Webhook delivered to ' + webhookUrl + ' (HTTP ' + response.status + ' OK • Signed with HMAC-SHA256).'
        : 'Webhook endpoint responded with HTTP ' + response.status + '. Verify your receiver URL accepts POST JSON payloads.',
      samplePayload,
    }
  } catch (err: any) {
    return {
      error: 'Failed to reach ' + webhookUrl + ': ' + (err?.message || 'Network error'),
    }
  }
}

/**
 * LIVE STAGE 2 VAULT TRIGGER:
 * Automatically dispatches the unlocked Professional Vault & TrueFit Score™
 * to the employer's Workday/Enterprise Webhook and/or Greenhouse HR Software
 * when a professional releases their Conversation Vault.
 */
export async function autoSyncStage2VaultToEnterpriseAts(
  applicationId: string,
  releasedVaultOverride?: {
    fullName?: string
    email?: string
    phone?: string
    resumeUrl?: string
    linkedinUrl?: string
  }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { skipped: true, reason: 'Not authenticated' }

    const { data: app } = await supabase
      .from('applications')
      .select(
        `
        id,
        job_id,
        candidate_id,
        status,
        is_revealed,
        initiated_by,
        match_score,
        match_data,
        jobs:job_id (
          id,
          title,
          work_model,
          salary_min,
          salary_max,
          organization_id,
          structured_requirements
        ),
        profiles:candidate_id (
          id,
          full_name,
          experience_years,
          location,
          skills,
          resume_url,
          identity_verified,
          is_verified
        )
      `
      )
      .eq('id', applicationId)
      .maybeSingle()

    if (!app) return { skipped: true, reason: 'Application not found' }

    const jobObj: any = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
    const isCandidateCaller = app.candidate_id === user.id
    let isEmployerCaller = false
    if (!isCandidateCaller && jobObj?.organization_id) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', jobObj.organization_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (member) isEmployerCaller = true
    }
    if (!isCandidateCaller && !isEmployerCaller) {
      return { skipped: true, reason: 'Unauthorized caller for ATS sync' }
    }
    if (app.match_data?.candidate_vault_released !== true) {
      return { skipped: true, reason: 'Professional Conversation vault has not been released yet' }
    }
    const candObj: any = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
    const orgId = jobObj?.organization_id
    if (!orgId) return { skipped: true, reason: 'No organization linked to job' }

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle()

    if (!org) return { skipped: true, reason: 'Organization not found' }

    const tierInfo = await resolveEmployerTierInfo(org)
    if (tierInfo.tier !== 'enterprise') {
      return { skipped: true, reason: 'Organization is not on Enterprise Tier' }
    }

    const atsConfig = parseAtsConfigFromDescription(org.description)
    if (!atsConfig.autoPushStage2) {
      return { skipped: true, reason: 'Auto-push on Conversation Vault release is disabled by org' }
    }

    const hasWebhook = Boolean(
      atsConfig.webhookUrl && atsConfig.webhookUrl.startsWith('http')
    )
    const hasGreenhouse = Boolean(
      atsConfig.greenhouseApiKey && atsConfig.greenhouseApiKey.trim().length > 4
    )

    if (!hasWebhook && !hasGreenhouse) {
      return {
        skipped: true,
        reason: 'No webhook URL or Greenhouse API key configured',
      }
    }

    const matchData =
      app.match_data && typeof app.match_data === 'object' ? app.match_data : {}

    const refId =
      matchData.reference_id ||
      'SS-' + String(app.id).replace(/-/g, '').substring(0, 8).toUpperCase()

    const fullName =
      matchData.candidate_full_name ||
      candObj?.full_name ||
      'Verified Professional'

    const candidateEmail =
      matchData.candidate_email ||
      matchData.candidate_contact_email ||
      candObj?.email ||
      ''

    const candidatePhone = matchData.candidate_phone || ''

    const resumePdfUrl =
      matchData.candidate_resume_url ||
      candObj?.resume_url ||
      ''

    const linkedinUrl = matchData.candidate_linkedin || ''

    const overallScore =
      app.match_score ?? matchData.overall_score ?? 85

    const syncResults: string[] = []

    // 1. Dispatch Signed Webhook (Workday Integration Studio / Universal Receiver)
    if (hasWebhook) {
      const payload = {
        event: 'candidate.vault_released',
        timestamp: new Date().toISOString(),
        environment: 'production',
        reference_id: refId,
        application_id: app.id,
        organization: org.name || org.domain || 'Verified Employer',
        job: {
          id: jobObj?.id,
          title: jobObj?.title || 'Open Role',
          work_model: jobObj?.work_model || 'remote',
        },
        ai_match_evaluation: {
          overall_score: overallScore,
          brief_analysis:
            matchData.brief_analysis ||
            matchData.employer_pitch ||
            'Verified TrueFit Score™ on Special Sauce.',
          radar_breakdown: Array.isArray(matchData.radar_data)
            ? matchData.radar_data
            : [],
        },
        candidate_vault: {
          full_name: fullName,
          email: candidateEmail,
          phone: candidatePhone,
          linkedin_url: linkedinUrl,
          identity_verified: true,
          experience_years: candObj?.experience_years ?? null,
          location: candObj?.location || '',
          resume_pdf_url: resumePdfUrl,
        },
      }

      const bodyString = JSON.stringify(payload)
      const signature = crypto
        .createHmac('sha256', atsConfig.webhookSecret || 'whsec_default')
        .update(bodyString)
        .digest('hex')

      try {
        const urlCheck = await validateSafeAtsWebhookUrl(atsConfig.webhookUrl)
        if (!urlCheck.ok || !urlCheck.url) {
          throw new Error(urlCheck.error || 'Blocked Webhook Endpoint URL')
        }
        const res = await fetch(urlCheck.url, {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
          headers: {
            'Content-Type': 'application/json',
            'X-SpecialSauce-Event': 'candidate.vault_released',
            'X-SpecialSauce-Signature': 'sha256=' + signature,
            'User-Agent': 'SpecialSauce-Enterprise-Webhook/1.0',
          },
          body: bodyString,
        })
        syncResults.push('webhook:' + res.status)
        await recordHandshakeTelemetry({
          handshakeId: 'enterprise_ats_webhook',
          label: 'Enterprise ATS Outbound Webhook',
          platformArea: 'HR Software Sync Hub',
          ok: res.ok,
          errorDetail: res.ok ? undefined : `ATS Webhook HTTP ${res.status}`,
        })
      } catch (wErr: any) {
        syncResults.push('webhook_err:' + (wErr?.message || 'failed'))
        await recordHandshakeTelemetry({
          handshakeId: 'enterprise_ats_webhook',
          label: 'Enterprise ATS Outbound Webhook',
          platformArea: 'HR Software Sync Hub',
          ok: false,
          errorDetail: wErr?.message || 'Webhook delivery exception',
        })
      }
    }

    // 2. Dispatch to Native Greenhouse HR Software (if API key configured)
    if (hasGreenhouse) {
      try {
        const nameParts = String(fullName).trim().split(/\s+/)
        const firstName = nameParts[0] || 'Verified'
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Professional'

        const basicAuth = Buffer.from(
          atsConfig.greenhouseApiKey.trim() + ':'
        ).toString('base64')

        const ghHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + basicAuth,
        }
        if (atsConfig.greenhouseOnBehalfOf) {
          ghHeaders['On-Behalf-Of'] = atsConfig.greenhouseOnBehalfOf.trim()
        }

        const ghBody: Record<string, any> = {
          first_name: firstName,
          last_name: lastName,
          email_addresses: candidateEmail
            ? [{ value: candidateEmail, type: 'personal' }]
            : [],
          phone_numbers: candidatePhone
            ? [{ value: candidatePhone, type: 'mobile' }]
            : [],
          website_addresses: resumePdfUrl
            ? [{ value: resumePdfUrl, type: 'other' }]
            : [],
          notes:
            'Imported via Special Sauce The Conversation Vault Release (Ref: ' +
            refId +
            ' | Role: ' +
            (jobObj?.title || 'Open Role') +
            ' | TrueFit Score™: ' +
            overallScore +
            '%).',
        }

        const ghRes = await fetch(
          'https://harvest.greenhouse.io/v1/candidates',
          {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify(ghBody),
          }
        )
        syncResults.push('greenhouse:' + ghRes.status)
      } catch (ghErr: any) {
        syncResults.push('greenhouse_err:' + (ghErr?.message || 'failed'))
      }
    }

    // 3. Record audit stamp inside applications.match_data
    const updatedMatchData = {
      ...matchData,
      ats_synced_at: new Date().toISOString(),
      ats_sync_status: syncResults.join(', '),
    }

    await supabase
      .from('applications')
      .update({ match_data: updatedMatchData })
      .eq('id', applicationId)

    return {
      success: true,
      syncStatus: syncResults.join(', '),
    }
  } catch (err: any) {
    return {
      error: err?.message || 'ATS auto-sync failed',
    }
  }
}

export async function exportEnterpriseCandidatesCsv() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Organization membership required.' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const tierInfo = await resolveEmployerTierInfo(org)
  if (tierInfo.tier !== 'enterprise') {
    return {
      error: 'Enterprise Tier ($1,250/mo Founding ($1,999 Retail)) is required for bulk CSV professional exports.',
    }
  }

  const { data: apps } = await supabase
    .from('applications')
    .select(
      `
      id,
      status,
      is_revealed,
      initiated_by,
      match_score,
      match_data,
      created_at,
      jobs!inner (
        id,
        title,
        work_model,
        organization_id
      ),
      profiles:candidate_id (
        id,
        full_name,
        experience_years,
        location,
        min_salary_expectation,
        skills
      )
    `
    )
    .eq('jobs.organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  const rows = apps || []
  const headers = [
    'Reference_ID',
    'Pipeline_Type',
    'Role_Title',
    'Stage_Status',
    'AI_Match_Score',
    'Candidate_Identifier_Or_Name',
    'Candidate_Email',
    'Experience_Years',
    'Location',
    'Min_Salary_USD',
    'ATS_Sync_Status',
    'Date_Logged',
  ]

  const escapeCsv = (val: any) => {
    const raw = String(val ?? '')
    const safe = typeof val === 'number' ? raw : /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw
    return '"' + safe.replace(/"/g, '""') + '"'
  }

  const csvLines = [headers.join(',')]

  for (const app of rows) {
    const job: any = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
    const cand: any = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
    const matchData = app.match_data || {}
    const vaultReleased = Boolean(matchData.candidate_vault_released === true)
    const refId =
      matchData.reference_id ||
      'SS-' + String(app.id).replace(/-/g, '').substring(0, 8).toUpperCase()

    const stageLabel = vaultReleased
      ? 'The Conversation Vault Released'
      : app.is_revealed || app.status === 'accepted'
      ? 'Introduction Thread Active'
      : 'Identity Protected'

    const candidateName = vaultReleased
      ? matchData.candidate_full_name || cand?.full_name || 'Released Professional'
      : 'Anonymous #' + String(cand?.id || 'ANON').split('-')[0].toUpperCase()

    const candidateEmail = vaultReleased
      ? matchData.candidate_email || 'Released in Thread'
      : 'Locked (Conversation Vault)'

    const atsSyncCol = matchData.ats_synced_at
      ? 'Synced (' + (matchData.ats_sync_status || 'OK') + ')'
      : 'Not Synced'

    csvLines.push(
      [
        escapeCsv(refId),
        escapeCsv(app.initiated_by === 'employer' ? 'Outbound Pitch' : 'Inbound App'),
        escapeCsv(job?.title || 'Open Role'),
        escapeCsv(stageLabel),
        escapeCsv(app.match_score ?? matchData.overall_score ?? ''),
        escapeCsv(candidateName),
        escapeCsv(candidateEmail),
        escapeCsv(cand?.experience_years ?? ''),
        escapeCsv(cand?.location ?? ''),
        escapeCsv(cand?.min_salary_expectation ?? ''),
        escapeCsv(atsSyncCol),
        escapeCsv(new Date(app.created_at).toISOString().split('T')[0]),
      ].join(',')
    )
  }

  const dateStamp = new Date().toISOString().split('T')[0]

  return {
    csvContent: csvLines.join('\n'),
    rowCount: rows.length,
    filename: 'specialsauce-ats-export-' + dateStamp + '.csv',
  }
}