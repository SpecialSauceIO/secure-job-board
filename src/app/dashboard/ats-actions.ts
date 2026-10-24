'use server'

import crypto from 'crypto'
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

function parseAtsConfigFromDescription(desc?: string | null): EnterpriseAtsConfig {
  const raw = String(desc || '')
  const match = raw.match(/\[ATS_CFG:([A-Za-z0-9+/=]+)\]/i)
  if (match?.[1]) {
    try {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
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
  const base64Cfg = Buffer.from(JSON.stringify(cfg), 'utf-8').toString('base64')
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
  const config = parseAtsConfigFromDescription(org.description)

  return {
    organizationId: org.id,
    organizationName: org.name || org.domain || 'Verified Employer',
    isEnterprise: tierInfo.tier === 'enterprise',
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

  const updatedCfg: EnterpriseAtsConfig = {
    webhookUrl: String(formData.get('webhook_url') || '').trim(),
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
      full_name: 'Alex Rivera (Test Candidate)',
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
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
 * Automatically dispatches the unlocked Candidate Vault & 5-Point AI Match Radar
 * to the employer's Workday/Enterprise Webhook and/or Greenhouse HR Software
 * when a candidate releases their Stage 2 Vault.
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
    if (!app.match_data?.candidate_vault_released && !releasedVaultOverride) {
      return { skipped: true, reason: 'Candidate Stage 2 vault has not been released yet' }
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
      return { skipped: true, reason: 'Auto-push on Stage 2 is disabled by org' }
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
      releasedVaultOverride?.fullName ||
      matchData.candidate_full_name ||
      candObj?.full_name ||
      'Verified Candidate'

    const candidateEmail =
      releasedVaultOverride?.email ||
      matchData.candidate_email ||
      candObj?.email ||
      ''

    const candidatePhone =
      releasedVaultOverride?.phone || matchData.candidate_phone || ''

    const resumePdfUrl =
      releasedVaultOverride?.resumeUrl ||
      matchData.candidate_resume_url ||
      candObj?.resume_url ||
      ''

    const linkedinUrl =
      releasedVaultOverride?.linkedinUrl || matchData.candidate_linkedin || ''

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
            'Verified 5-Point AI Match on Special Sauce.',
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
        const res = await fetch(atsConfig.webhookUrl, {
          method: 'POST',
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
          nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Candidate'

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
            'Imported via Special Sauce Stage 2 Vault Release (Ref: ' +
            refId +
            ' | Role: ' +
            (jobObj?.title || 'Open Role') +
            ' | 5-Point AI Match Score: ' +
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
      error: 'Enterprise Tier ($1,250/mo Founding ($1,999 Retail)) is required for bulk CSV candidate exports.',
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
    const s = String(val ?? '').replace(/"/g, '""')
    return '"' + s + '"'
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
      ? 'Stage 2 Vault Released'
      : app.is_revealed || app.status === 'accepted'
      ? 'Stage 1 Thread Active'
      : 'Stage 0 Protected'

    const candidateName = vaultReleased
      ? matchData.candidate_full_name || cand?.full_name || 'Released Candidate'
      : 'Anonymous #' + String(cand?.id || 'ANON').split('-')[0].toUpperCase()

    const candidateEmail = vaultReleased
      ? matchData.candidate_email || 'Released in Thread'
      : 'Locked (Stage 2 Vault)'

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