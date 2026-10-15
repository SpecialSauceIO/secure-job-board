'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { GoogleGenAI } from '@google/genai'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import dns from 'node:dns/promises'

const MIN_MATCH_THRESHOLD = 40
const CANDIDATE_TRIAL_MAX_APPS = 3
const CANDIDATE_TRIAL_DAYS = 7

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'ymail.com',
  'mail.com',
  'gmx.com'
])

// ------------------------------------------------------------------
// HELPER: STRIP INTERNAL METADATA FROM CANDIDATE STRUCTURED_SKILLS
// ------------------------------------------------------------------
function filterVisibleSkills(rawSkills: any): any[] {
  if (!Array.isArray(rawSkills)) return []
  return rawSkills.filter(
    (s: any) => s && typeof s === 'object' && !s._ss_meta && s.skill && !String(s.skill).startsWith('__SS_')
  )
}

function extractCandidateMeta(rawSkills: any): {
  plan?: 'trial' | 'expired' | 'pro'
  trialStart?: string
  trialBaselineApps?: number
} {
  if (!Array.isArray(rawSkills)) return {}
  const metaItem = rawSkills.find((s: any) => s && typeof s === 'object' && s._ss_meta === true)
  return metaItem || {}
}

// ------------------------------------------------------------------
// HELPER: STRIP & EXTRACT JOB METADATA FROM STRUCTURED_REQUIREMENTS
// ------------------------------------------------------------------
export interface JobExtendedMeta {
  pay_type: 'annual' | 'hourly'
  comp_perks: string
  location: string
  employment_type: string
  experience_level: string
  industry: string
  company_size: string
  work_auth: string
}

function filterVisibleJobRequirements(rawReqs: any): any[] {
  if (!Array.isArray(rawReqs)) return []
  return rawReqs.filter(
    (r: any) =>
      r &&
      typeof r === 'object' &&
      !r._ss_job_meta &&
      (r.skill || r.name) &&
      !String(r.skill || r.name).startsWith('__SS_')
  )
}

function extractJobMeta(rawReqs: any, jobRow?: any): JobExtendedMeta {
  const metaItem = Array.isArray(rawReqs)
    ? rawReqs.find((r: any) => r && typeof r === 'object' && r._ss_job_meta === true)
    : null

  const inferredPayType: 'annual' | 'hourly' =
    metaItem?.pay_type === 'hourly' ||
    jobRow?.pay_type === 'hourly' ||
    (jobRow?.salary_max && jobRow.salary_max > 0 && jobRow.salary_max <= 500)
      ? 'hourly'
      : 'annual'

  return {
    pay_type: inferredPayType,
    comp_perks: metaItem?.comp_perks || jobRow?.comp_perks || 'Base Salary Only',
    location: metaItem?.location || jobRow?.location || '',
    employment_type: metaItem?.employment_type || jobRow?.employment_type || 'Full-Time (W-2)',
    experience_level: metaItem?.experience_level || jobRow?.experience_level || 'Senior (5–8 yrs)',
    industry: metaItem?.industry || jobRow?.industry || '',
    company_size: metaItem?.company_size || jobRow?.company_size || '',
    work_auth: metaItem?.work_auth || jobRow?.work_auth || 'US Authorized Only',
  }
}

function enrichJobRecord(job: any) {
  if (!job) return job
  const meta = extractJobMeta(job.structured_requirements, job)
  const visibleReqs = filterVisibleJobRequirements(job.structured_requirements)
  return {
    ...job,
    ...meta,
    job_meta: meta,
    structured_requirements: visibleReqs,
  }
}

export async function resolveCandidateTierInfo(candidateUserId?: string): Promise<{
  tier: 'trial' | 'free' | 'pro'
  label: string
  canApply: boolean
  appsUsed: number
  freeAppsRemaining: number
  daysRemaining: number
  trialExpired: boolean
}> {
  const supabase = await createClient()
  let targetUserId = candidateUserId

  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    targetUserId = user?.id
  }

  if (!targetUserId) {
    return {
      tier: 'trial',
      label: '7-Day Early Adopter Trial',
      canApply: true,
      appsUsed: 0,
      freeAppsRemaining: CANDIDATE_TRIAL_MAX_APPS,
      daysRemaining: CANDIDATE_TRIAL_DAYS,
      trialExpired: false,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('structured_skills, created_at')
    .eq('id', targetUserId)
    .single()

  const { count: totalOutboundApps } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', targetUserId)
    .neq('initiated_by', 'employer')

  const meta = extractCandidateMeta(profile?.structured_skills)
  const rawPlan = meta.plan

  if (rawPlan === 'pro') {
    return {
      tier: 'pro',
      label: 'Candidate Pro ($9/mo)',
      canApply: true,
      appsUsed: totalOutboundApps || 0,
      freeAppsRemaining: 999,
      daysRemaining: 30,
      trialExpired: false,
    }
  }

  if (rawPlan === 'expired') {
    return {
      tier: 'free',
      label: 'Free Explorer (Trial Ended)',
      canApply: false,
      appsUsed: CANDIDATE_TRIAL_MAX_APPS,
      freeAppsRemaining: 0,
      daysRemaining: 0,
      trialExpired: true,
    }
  }

  const baseline = meta.trialBaselineApps || 0
  const appsUsedInTrial = Math.max(0, (totalOutboundApps || 0) - baseline)
  const freeAppsRemaining = Math.max(0, CANDIDATE_TRIAL_MAX_APPS - appsUsedInTrial)

  const startIso = meta.trialStart || profile?.created_at || new Date().toISOString()
  const elapsedMs = Date.now() - new Date(startIso).getTime()
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, CANDIDATE_TRIAL_DAYS - elapsedDays)

  const trialExpired = freeAppsRemaining <= 0 || daysRemaining <= 0

  if (trialExpired) {
    return {
      tier: 'free',
      label: 'Free Explorer (Trial Ended)',
      canApply: false,
      appsUsed: appsUsedInTrial,
      freeAppsRemaining: 0,
      daysRemaining,
      trialExpired: true,
    }
  }

  return {
    tier: 'trial',
    label: `Early Adopter Trial (${freeAppsRemaining}/${CANDIDATE_TRIAL_MAX_APPS} Free Apps Left)`,
    canApply: true,
    appsUsed: appsUsedInTrial,
    freeAppsRemaining,
    daysRemaining,
    trialExpired: false,
  }
}

export async function activateSandboxCandidateTier(
  targetMode: 'trial' | 'expired' | 'pro'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('structured_skills')
    .eq('id', user.id)
    .single()

  const { count: currentApps } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', user.id)
    .neq('initiated_by', 'employer')

  const visibleSkills = filterVisibleSkills(profile?.structured_skills)

  const newMeta = {
    _ss_meta: true,
    plan: targetMode,
    trialStart: new Date().toISOString(),
    trialBaselineApps: targetMode === 'trial' ? (currentApps || 0) : 0,
  }

  const updatedSkillsArray = [...visibleSkills, newMeta]

  const { error } = await supabase
    .from('profiles')
    .update({ structured_skills: updatedSkillsArray })
    .eq('id', user.id)

  if (error) return { error: error.message }

  if (targetMode === 'pro') {
    const refId = `SS-CPRO${Date.now().toString().slice(-5)}`
    await sendPlatformNotification({
      to: user.email,
      subject: 'Candidate Pro Pass ($9/mo) Activated!',
      referenceId: refId,
      heading: 'Welcome to Candidate Pro ($9/month)',
      bodyLines: [
        'Your Candidate Pro Pass is now active.',
        'You have unlocked unlimited blind job applications (for all roles where you score 40%+ on the AI Match Radar) and priority placement in Employer searches.',
        `Subscription Reference ID: ${refId}`,
      ],
      ctaUrl: '/dashboard/jobs',
      ctaLabel: 'Browse & Apply to Roles →',
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/billing')

  const tierInfo = await resolveCandidateTierInfo(user.id)

  return {
    success: true,
    tierInfo,
    message:
      targetMode === 'pro'
        ? 'Activated Candidate Pro Pass ($9/mo)! Unlimited blind applications unlocked.'
        : targetMode === 'expired'
        ? 'Simulated Trial Ended (0 Free Applications Remaining). Try applying to a role on /dashboard/jobs to test the $9/mo upgrade prompt!'
        : 'Reset 7-Day Early Adopter Trial! You have 3 fresh free blind applications and 7 days remaining.',
  }
}

export async function resolveEmployerTierInfo(org: any): Promise<{
  tier: 'free' | 'starter' | 'growth' | 'enterprise'
  label: string
  maxActiveJobs: number
  monthlyCredits: number
  maxSeats: number
}> {
  // 1. Check explicit [TIER:...] marker in description first
  const descMatch = (org?.description || '').match(
    /\[TIER:(free|starter|growth|enterprise)\]/i
  )
  const descTier = descMatch ? descMatch[1].toLowerCase() : ''

  // 2. Check subscription_tier column if non-free
  const rawTierCol = (org?.subscription_tier || '').toLowerCase().trim()

  // 3. Check persistent server cookie fallback (guarantees persistence even if RLS blocks org update)
  let cookieTier = ''
  try {
    const cookieStore = await cookies()
    cookieTier = (cookieStore.get('ss_employer_tier')?.value || '').toLowerCase().trim()
  } catch {
    // Ignore cookie read error outside request context
  }

  const explicitTier =
    descTier ||
    (rawTierCol && rawTierCol !== 'free' ? rawTierCol : '') ||
    cookieTier ||
    rawTierCol

  if (explicitTier === 'enterprise') {
    return {
      tier: 'enterprise',
      label: 'Enterprise Tier',
      maxActiveJobs: 50,
      monthlyCredits: 100,
      maxSeats: 10,
    }
  }
  if (explicitTier === 'growth') {
    return {
      tier: 'growth',
      label: 'Growth Tier',
      maxActiveJobs: 15,
      monthlyCredits: 30,
      maxSeats: 3,
    }
  }
  if (explicitTier === 'starter') {
    return {
      tier: 'starter',
      label: 'Starter Tier',
      maxActiveJobs: 5,
      monthlyCredits: 10,
      maxSeats: 1,
    }
  }
  if (explicitTier === 'free') {
    return {
      tier: 'free',
      label: 'Free Explorer',
      maxActiveJobs: 0,
      monthlyCredits: 0,
      maxSeats: 1,
    }
  }

  // 4. Fallback heuristic based on credits
  const credits = org?.connection_credits || 0
  const sent = org?.total_requests_sent || 0
  const totalCapacity = credits + sent

  if (totalCapacity >= 50) {
    return {
      tier: 'enterprise',
      label: 'Enterprise Tier',
      maxActiveJobs: 50,
      monthlyCredits: 100,
      maxSeats: 10,
    }
  }
  if (totalCapacity >= 20) {
    return {
      tier: 'growth',
      label: 'Growth Tier',
      maxActiveJobs: 15,
      monthlyCredits: 30,
      maxSeats: 3,
    }
  }
  if (credits > 0 || sent > 0) {
    return {
      tier: 'starter',
      label: 'Starter Tier',
      maxActiveJobs: 5,
      monthlyCredits: 10,
      maxSeats: 1,
    }
  }

  return {
    tier: 'free',
    label: 'Free Explorer',
    maxActiveJobs: 0,
    monthlyCredits: 0,
    maxSeats: 1,
  }
}

export async function stripTierTag(description?: string | null): Promise<string> {
  return (description || '')
    .replace(/\s*\[TIER:[a-z]+\]/gi, '')
    .replace(/\s*\[SEATS:[^\]]*\]/gi, '')
    .trim()
}

function parseStoredSeatsTag(description?: string | null): Array<{
  id: string
  email: string
  role: 'hiring_manager' | 'bpo_partner'
  status: 'active' | 'invited'
  addedAt: string
}> {
  const match = (description || '').match(/\[SEATS:([^\]]+)\]/i)
  if (!match || !match[1]) return []
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8')
    const parsed = JSON.parse(decoded)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function encodeStoredSeatsTag(
  seats: Array<{
    id: string
    email: string
    role: 'hiring_manager' | 'bpo_partner'
    status: 'active' | 'invited'
    addedAt: string
  }>
): string {
  if (!seats || seats.length === 0) return ''
  const b64 = Buffer.from(JSON.stringify(seats), 'utf8').toString('base64')
  return `[SEATS:${b64}]`
}

function normalizeDomainInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
    .split(':')[0]
}

function formatReferenceId(applicationId: string): string {
  const clean = (applicationId || '').replace(/-/g, '').substring(0, 8).toUpperCase()
  return `SS-${clean || '00000000'}`
}

// ------------------------------------------------------------------
// HELPER: TRANSACTIONAL EMAIL DISPATCHER (RESEND API + SANDBOX FALLBACK)
// ------------------------------------------------------------------
async function sendPlatformNotification({
  to,
  subject,
  referenceId,
  heading,
  bodyLines,
  ctaUrl,
  ctaLabel
}: {
  to?: string | null
  subject: string
  referenceId: string
  heading: string
  bodyLines: string[]
  ctaUrl?: string
  ctaLabel?: string
}) {
  const rawRecipient = (to || '').trim()
  const fallbackInbox = (process.env.RESEND_TEST_TO_EMAIL || '').trim()

  const isFakeTestAddress = rawRecipient.endsWith('@test.com') || rawRecipient.endsWith('@example.com')
  const primaryRecipient = (!rawRecipient || (isFakeTestAddress && fallbackInbox))
    ? (fallbackInbox || rawRecipient)
    : rawRecipient

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = ctaUrl ? `${appUrl}${ctaUrl}` : `${appUrl}/dashboard`

  console.log('\n======================================================')
  console.log(`📧 EMAIL NOTIFICATION TRIGGERED [${referenceId}]`)
  console.log(`Intended Recipient: ${rawRecipient || '(None)'}`)
  console.log(`Actual Recipient:   ${primaryRecipient || '(None)'}`)
  console.log(`Subject:            [${referenceId}] ${subject}`)
  console.log(`Heading:            ${heading}`)
  bodyLines.forEach(line => console.log(`  - ${line}`))

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `⚠️  EMAIL NOT SENT TO INBOX: RESEND_API_KEY is missing in .env.local! Add RESEND_API_KEY=re_... to send live emails.`
    )
    console.log('======================================================\n')
    return
  }

  if (!primaryRecipient) {
    console.warn(`⚠️  EMAIL NOT SENT: No recipient email address found.`)
    console.log('======================================================\n')
    return
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Special Sauce <onboarding@resend.dev>'

  const buildHtml = (intendedNote?: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      ${
        intendedNote
          ? `<div style="margin-bottom: 12px; padding: 8px 12px; background-color: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 700;">${intendedNote}</div>`
          : ''
      }
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
          Ref ID: ${referenceId}
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        ${heading}
      </h2>
      ${bodyLines.map(line => `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">${line}</p>`).join('')}
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <a href="${fullUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">
          ${ctaLabel || 'Open Dashboard →'}
        </a>
      </div>
    </div>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [primaryRecipient],
        subject: `[${referenceId}] ${subject}`,
        html: buildHtml(
          primaryRecipient !== rawRecipient && rawRecipient
            ? `Sandbox Routing: Originally addressed to ${rawRecipient}`
            : undefined
        )
      })
    })

    const resData = await response.json()

    if (response.ok) {
      console.log(`✅ RESEND DELIVERED SUCCESSFULLY (ID: ${resData?.id}) -> ${primaryRecipient}`)
    } else {
      console.error(`❌ RESEND API REJECTED EMAIL (${response.status}):`, resData)

      if (fallbackInbox && fallbackInbox !== primaryRecipient) {
        console.log(`🔄 Retrying delivery via RESEND_TEST_TO_EMAIL (${fallbackInbox})...`)
        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [fallbackInbox],
            subject: `[${referenceId}] ${subject}`,
            html: buildHtml(`Sandbox Fallback: Originally addressed to ${rawRecipient}`)
          })
        })
        const retryData = await retryRes.json()
        if (retryRes.ok) {
          console.log(`✅ RESEND RETRY DELIVERED (ID: ${retryData?.id}) -> ${fallbackInbox}`)
        } else {
          console.error(`❌ RESEND RETRY FAILED:`, retryData)
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Resend network error:', err.message || err)
  }

  console.log('======================================================\n')
}

// ------------------------------------------------------------------
// HELPER: CASCADING MULTI-MODEL PDF EXTRACTOR (BYPASSES QUOTA LIMITS)
// ------------------------------------------------------------------
async function extractPdfWithRetry(prompt: string, base64Data: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
          model: model,
          contents: [
              { text: prompt },
              { 
                  inlineData: {
                      data: base64Data,
                      mimeType: 'application/pdf'
                  } 
              }
          ]
      })
      if (response.text) {
        console.log(`PDF successfully extracted using model: ${model}`)
        return response.text
      }
    } catch (error: any) {
      console.warn(`Model ${model} rate-limited or unavailable, falling back to next model...`)
      continue
    }
  }
  throw new Error("All Gemini Flash free-tier quotas have been exhausted for the day. Please wait for reset or check your Google AI Studio billing.")
}

// ------------------------------------------------------------------
// PROFILE & GLOBAL ACTIONS
// ------------------------------------------------------------------

export async function setRole(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const role = formData.get('role') as string
  if (!role) return

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user.id)

  if (error) console.error('Error setting role:', error)
  revalidatePath('/dashboard')
}

export async function forceVerifyCandidateIdentity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error: err1 } = await supabase
    .from('profiles')
    .update({ identity_verified: true })
    .eq('id', user.id)

  if (err1) {
    console.warn('Update identity_verified warning:', err1.message)
    await supabase
      .from('profiles')
      .update({ verification_status: 'verified' })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function updateApplicationStatus(formData: FormData) {
  const supabase = await createClient()
  const applicationId = formData.get('application_id') as string
  const status = formData.get('status') as string

  if (!applicationId || !status) return

  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) console.error('Error updating status:', error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/employer/applications')
}

export async function revealProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const applicationId = formData.get('application_id') as string
  if (!applicationId) return { error: 'Missing application ID' }

  const { data: existingApp } = await supabase
    .from('applications')
    .select(`
      id,
      candidate_id,
      match_data,
      jobs (
        title,
        organizations:organization_id (name, domain)
      ),
      profiles (*)
    `)
    .eq('id', applicationId)
    .single()

  const referenceId = formatReferenceId(applicationId)
  const employerEmail = existingApp?.match_data?.employer_contact_email || user.email || null
  const profileObj: any = Array.isArray(existingApp?.profiles) ? existingApp?.profiles[0] : existingApp?.profiles

  const candidateEmail =
    existingApp?.match_data?.candidate_contact_email ||
    profileObj?.contact_email ||
    profileObj?.email ||
    null

  const candidateFullName =
    profileObj?.full_name ||
    profileObj?.name ||
    existingApp?.match_data?.candidate_full_name ||
    'Verified Candidate'

  const updatedMatchData = {
    ...(existingApp?.match_data || {}),
    employer_contact_email: employerEmail,
    candidate_contact_email: candidateEmail,
    candidate_full_name: candidateFullName,
    reference_id: referenceId,
    unlocked_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('applications')
    .update({
      is_revealed: true,
      match_data: updatedMatchData
    })
    .eq('id', applicationId)

  if (error) {
    console.error('Error revealing profile:', error)
    return { error: error.message }
  }

  const jobObj: any = Array.isArray(existingApp?.jobs) ? existingApp?.jobs[0] : existingApp?.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj?.organizations[0] : jobObj?.organizations
  const companyName = orgObj?.name || 'A Verified Employer'
  const roleTitle = jobObj?.title || 'Open Role'

  await sendPlatformNotification({
    to: candidateEmail,
    subject: `${companyName} unlocked your application for ${roleTitle}`,
    referenceId,
    heading: 'Your Anonymous Application Was Unlocked!',
    bodyLines: [
      `${companyName} reviewed your blind application for "${roleTitle}" and unlocked your profile.`,
      `Connection Reference ID: ${referenceId}`,
      employerEmail
        ? `Hiring Team Contact Email: ${employerEmail}`
        : 'Log in to your Application Tracker to view their full company profile and contact info.'
    ],
    ctaUrl: '/dashboard/applications',
    ctaLabel: 'View Unlocked Employer Info →'
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/employer/applications')
  return {
    success: true,
    referenceId,
    employer_contact_email: employerEmail,
    candidate_contact_email: candidateEmail,
    candidate_full_name: candidateFullName
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const full_name = (formData.get('full_name') as string || '').trim()
  const experience_years = formData.get('experience_years') as string
  const bio = formData.get('bio') as string
  const structured_skills_raw = formData.get('structured_skills') as string
  
  const min_salary_expectation = formData.get('min_salary_expectation')
  const preferred_work_model = formData.get('preferred_work_model') as string
  const location = formData.get('location') as string

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('structured_skills')
    .eq('id', user.id)
    .single()

  const existingMeta = extractCandidateMeta(currentProfile?.structured_skills)
  
  let structured_skills: any[] = []
  try {
    if (structured_skills_raw) {
      structured_skills = filterVisibleSkills(JSON.parse(structured_skills_raw))
    }
  } catch (e) {
    console.error("Failed to parse structured skills")
  }

  const skills_string = structured_skills.map((s: any) => s.skill).join(', ')

  if (existingMeta && (existingMeta as any)._ss_meta) {
    structured_skills = [...structured_skills, existingMeta]
  }

  const basePayload: any = {
    experience_years, 
    skills: skills_string,
    structured_skills, 
    bio,
    is_discoverable: true
  }

  if (min_salary_expectation) basePayload.min_salary_expectation = parseInt(min_salary_expectation.toString(), 10)
  if (preferred_work_model) basePayload.preferred_work_model = preferred_work_model
  if (location) basePayload.location = location

  if (full_name || user.email) {
    const { data: existingApps } = await supabase
      .from('applications')
      .select('id, match_data')
      .eq('candidate_id', user.id)

    if (existingApps && existingApps.length > 0) {
      for (const appRow of existingApps) {
        const mergedMatchData = {
          ...(appRow.match_data || {}),
          ...(full_name ? { candidate_full_name: full_name } : {}),
          ...(user.email ? { candidate_contact_email: user.email } : {})
        }
        await supabase
          .from('applications')
          .update({ match_data: mergedMatchData })
          .eq('id', appRow.id)
      }
    }
  }

  if (full_name) {
    const { error: nameErr } = await supabase
      .from('profiles')
      .update({ ...basePayload, full_name })
      .eq('id', user.id)

    if (!nameErr) {
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/profile')
      revalidatePath('/dashboard/employer/applications')
      revalidatePath('/dashboard/employer/pitches')
      return
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(basePayload)
    .eq('id', user.id)

  if (error) console.error('Error updating profile:', error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/employer/applications')
  revalidatePath('/dashboard/employer/pitches')
}

export async function parseResumeAutoFill(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const file = formData.get('resume') as File
  if (!file) return

  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('structured_skills')
      .eq('id', user.id)
      .single()

    const existingMeta = extractCandidateMeta(currentProfile?.structured_skills)

    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file)
    
    let resumeUrl = ''
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName)
      resumeUrl = publicUrlData.publicUrl
    } else {
      console.error("Storage upload error:", uploadError)
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')
    
    const prompt = `
      You are an expert technical recruiter. Analyze the attached resume document and extract the key information.
      Return ONLY a raw JSON object.
      The JSON object must have these keys:
      1. "full_name": The candidate's full name extracted from the resume header (string, or "" if not found).
      2. "experience_years": A single number representing the total years of professional experience. If unsure, provide your best estimate based on the dates provided.
      3. "structured_skills": An array of objects representing the 5-8 most relevant technical or professional skills. Each object MUST have exactly two keys: "skill" (string, the name of the skill) and "years" (number, the estimated years of experience with that specific skill based on the resume timeline).
      4. "bio": A 2-3 sentence professional summary focusing on achievements and core competencies, written in the third person. Do NOT include the candidate's name or contact information inside the bio text to maintain anonymity.
    `

    const responseText = await extractPdfWithRetry(prompt, base64Data)

    const cleanJsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const extractedData = JSON.parse(cleanJsonString)

    let extractedSkills = filterVisibleSkills(extractedData.structured_skills || [])
    const skillsString = extractedSkills.map((s: any) => s.skill).join(', ')

    if (existingMeta && (existingMeta as any)._ss_meta) {
      extractedSkills = [...extractedSkills, existingMeta]
    }

    const baseUpdatePayload: any = {
      experience_years: extractedData.experience_years?.toString() || '',
      skills: skillsString,
      structured_skills: extractedSkills,
      bio: extractedData.bio || '',
      is_discoverable: true
    }

    if (resumeUrl) {
      baseUpdatePayload.resume_url = resumeUrl
    }

    if (extractedData.full_name) {
      const { error: withNameErr } = await supabase
        .from('profiles')
        .update({ ...baseUpdatePayload, full_name: extractedData.full_name })
        .eq('id', user.id)

      if (!withNameErr) {
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/profile')
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(baseUpdatePayload)
      .eq('id', user.id)

    if (error) console.error("Database Update Error:", error)

  } catch (error: any) {
    console.error("AI Parsing Error:", error.message || error)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
}

// ------------------------------------------------------------------
// CANDIDATE JOB ACTIONS & CONNECTION REQUESTS INBOX
// ------------------------------------------------------------------

export async function applyBlind(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const jobId = formData.get('job_id') as string
  if (!jobId) return { error: 'Missing job ID' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isVerified = Boolean(
    profile?.identity_verified === true ||
    profile?.is_verified === true ||
    profile?.verification_status === 'verified'
  )

  if (!isVerified) {
    return {
      error: 'Application Blocked: Please complete Stripe Identity verification on your dashboard before applying.'
    }
  }

  const candidateTier = await resolveCandidateTierInfo(user.id)
  if (!candidateTier.canApply) {
    return {
      error: 'Early Adopter Trial Concluded: You have used all 3 free trial blind applications (or your 7-day trial window has ended). Subscribe to the Candidate Pro Pass ($9/month) on your Membership page to unlock unlimited blind applications!'
    }
  }

  const matchScoreRaw = formData.get('match_score')
  const employerPitch = formData.get('employer_pitch') as string
  const matchDataRaw = formData.get('match_data') as string

  const parsedMatchScore = matchScoreRaw ? parseInt(matchScoreRaw.toString(), 10) : null

  if (parsedMatchScore === null || isNaN(parsedMatchScore) || parsedMatchScore < MIN_MATCH_THRESHOLD) {
    return {
      error: `Application Blocked: A minimum ${MIN_MATCH_THRESHOLD}% AI Match Score is required to apply.`
    }
  }

  let match_data: any = {}
  if (matchDataRaw) {
    try {
      match_data = JSON.parse(matchDataRaw)
    } catch (e) {
      console.error("Failed to parse match_data")
    }
  }

  const { data: jobInfo } = await supabase
    .from('jobs')
    .select('title, employer_id, organizations:organization_id (name, domain)')
    .eq('id', jobId)
    .single()

  const candidateLiveEmail = user.email || profile?.contact_email || profile?.email || null

  match_data = {
    ...match_data,
    candidate_contact_email: candidateLiveEmail,
    candidate_full_name: profile?.full_name || profile?.name || null
  }

  const { data: existingApp } = await supabase
    .from('applications')
    .select('id, match_data')
    .eq('job_id', jobId)
    .eq('candidate_id', user.id)
    .maybeSingle()

  let finalApplicationId = existingApp?.id || ''

  if (existingApp?.id) {
    const mergedMatchData = {
      ...(existingApp.match_data || {}),
      ...match_data,
      reference_id: formatReferenceId(existingApp.id)
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'pending',
        initiated_by: 'candidate',
        match_score: parsedMatchScore,
        employer_pitch: employerPitch || null,
        match_data: mergedMatchData
      })
      .eq('id', existingApp.id)

    if (updateError) {
      console.error('Error updating existing application:', updateError)
      return { error: updateError.message }
    }
  } else {
    const { data: insertedApp, error: insertError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: user.id,
        status: 'pending',
        initiated_by: 'candidate',
        match_score: parsedMatchScore,
        employer_pitch: employerPitch || null,
        match_data: match_data,
        is_revealed: false
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error applying to job:', insertError)
      return { error: insertError.message }
    }

    finalApplicationId = insertedApp?.id || ''
  }

  const refId = formatReferenceId(finalApplicationId)
  const roleTitle = jobInfo?.title || 'Open Role'
  const orgObj: any = Array.isArray(jobInfo?.organizations) ? jobInfo?.organizations[0] : jobInfo?.organizations
  const employerTargetEmail =
    existingApp?.match_data?.employer_contact_email ||
    (orgObj?.domain ? `hiring@${orgObj.domain}` : null)

  await sendPlatformNotification({
    to: candidateLiveEmail,
    subject: `Blind Application Submitted: ${roleTitle} (${parsedMatchScore}% Match)`,
    referenceId: refId,
    heading: 'Your Blind Application Has Been Submitted!',
    bodyLines: [
      `Your anonymous profile was submitted for "${roleTitle}" with a ${parsedMatchScore}% AI Match Score.`,
      `Connection Reference ID: ${refId}`,
      `Your identity and contact details remain hidden until the employer unlocks your application. We will notify you by email as soon as they unlock your profile.`
    ],
    ctaUrl: '/dashboard/applications',
    ctaLabel: 'Track Application Status →'
  })

  await sendPlatformNotification({
    to: employerTargetEmail,
    subject: `New ${parsedMatchScore}% Match Blind Application for ${roleTitle}`,
    referenceId: refId,
    heading: `New Verified Candidate Application (${parsedMatchScore}% AI Match)`,
    bodyLines: [
      `An Identity-Verified candidate just submitted a blind application for "${roleTitle}".`,
      `AI Match Score: ${parsedMatchScore}%`,
      `Transaction Reference ID: ${refId}`,
      `Open your Inbound Applications pipeline to review their anonymous skill matrix and unlock their identity.`
    ],
    ctaUrl: '/dashboard/employer/applications',
    ctaLabel: 'Review Application in Pipeline →'
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/employer/applications')
  return { success: true, referenceId: refId }
}

export async function searchJobs(query: string, workModel: string, locationFilter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let dbQuery = supabase
    .from('jobs')
    .select(`*, organizations:organization_id (*)`)
    .eq('is_active', true)
  
  if (workModel && workModel.trim() !== '' && workModel.toLowerCase() !== 'all') {
    dbQuery = dbQuery.ilike('work_model', workModel.trim())
  }

  const { data: jobs, error: jobsError } = await dbQuery.order('created_at', { ascending: false })

  if (jobsError) {
    console.error('searchJobs Query Error:', jobsError.message)
    return []
  }
  
  if (!jobs) return []

  const enrichedJobs = jobs.map(j => enrichJobRecord(j))

  let filteredJobs = enrichedJobs
  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim()
    filteredJobs = filteredJobs.filter((j: any) => {
      const titleMatch = j.title?.toLowerCase().includes(q)
      const descMatch = j.description?.toLowerCase().includes(q)
      const locMatch = j.location?.toLowerCase().includes(q)
      const indMatch = j.industry?.toLowerCase().includes(q)
      const reqMatch = JSON.stringify(j.structured_requirements || []).toLowerCase().includes(q)
      return titleMatch || descMatch || locMatch || indMatch || reqMatch
    })
  }

  if (locationFilter && locationFilter.trim() !== '') {
    const locQ = locationFilter.toLowerCase().trim()
    filteredJobs = filteredJobs.filter((j: any) =>
      (j.location || '').toLowerCase().includes(locQ)
    )
  }

  if (!user) return filteredJobs

  const { data: applications } = await supabase
    .from('applications')
    .select('job_id, initiated_by')
    .eq('candidate_id', user.id)

  const appliedJobIds = new Set(
    (applications || [])
      .filter(app => app.initiated_by !== 'employer')
      .map(app => app.job_id)
  )

  return filteredJobs
    .filter((job: any) => !appliedJobIds.has(job.id))
    .map((job: any) => ({
      ...job,
      has_applied: false,
    }))
}

export async function getCandidateApplications(
  statusFilter?: string,
  daysFilter?: number,
  searchQuery?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  let dbQuery = supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id,
        title,
        description,
        work_model,
        salary_min,
        salary_max,
        structured_requirements,
        organizations:organization_id (*)
      )
    `)
    .eq('candidate_id', user.id)
    .neq('initiated_by', 'employer')
    .order('created_at', { ascending: false })

  if (daysFilter && daysFilter > 0) {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - daysFilter)
    dbQuery = dbQuery.gte('created_at', dateLimit.toISOString())
  }

  const { data, error } = await dbQuery
  if (error) return { data: [], error: error.message }

  let processedData = (data || []).map((app: any) => {
    let normalizedStatus: 'pending' | 'unlocked' | 'shortlisted' | 'rejected' = 'pending'

    if (app.status === 'rejected' || app.status === 'declined') {
      normalizedStatus = 'rejected'
    } else if (
      app.status === 'accepted' ||
      app.status === 'shortlisted' ||
      app.status === 'interviewing' ||
      app.match_data?.employer_decision === 'shortlisted'
    ) {
      normalizedStatus = 'shortlisted'
    } else if (app.is_revealed === true) {
      normalizedStatus = 'unlocked'
    } else {
      normalizedStatus = 'pending'
    }

    const isUnlocked = Boolean(app.is_revealed || normalizedStatus === 'unlocked' || normalizedStatus === 'shortlisted')
    const enrichedJob = app.jobs ? enrichJobRecord(app.jobs) : null
    const org = enrichedJob?.organizations || {}
    const fallbackEmployerEmail = org?.domain ? `hiring@${org.domain}` : null

    return {
      ...app,
      jobs: enrichedJob,
      normalized_status: normalizedStatus,
      reference_id: formatReferenceId(app.id),
      unlocked_employer_email: isUnlocked
        ? app.match_data?.employer_contact_email || fallbackEmployerEmail
        : null,
      unlocked_candidate_email: isUnlocked
        ? app.match_data?.candidate_contact_email || user.email || null
        : null
    }
  })

  if (statusFilter && statusFilter !== 'all') {
    processedData = processedData.filter((app: any) => app.normalized_status === statusFilter)
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const lowerQuery = searchQuery.toLowerCase().trim()
    processedData = processedData.filter((app: any) => {
      const titleMatch = app.jobs?.title?.toLowerCase().includes(lowerQuery)
      const descMatch = app.jobs?.description?.toLowerCase().includes(lowerQuery)
      const refMatch = app.reference_id?.toLowerCase().includes(lowerQuery)
      const orgMatch =
        app.is_revealed || app.normalized_status === 'shortlisted'
          ? app.jobs?.organizations?.name?.toLowerCase().includes(lowerQuery)
          : false
      const reqsMatch = app.jobs?.structured_requirements
        ? JSON.stringify(app.jobs.structured_requirements).toLowerCase().includes(lowerQuery)
        : false

      return titleMatch || descMatch || orgMatch || reqsMatch || refMatch
    })
  }

  return { data: processedData, error: null }
}

export async function getCandidateConnectionRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data: requests, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id,
        title,
        description,
        work_model,
        salary_min,
        salary_max,
        structured_requirements,
        organizations:organization_id (*)
      )
    `)
    .eq('candidate_id', user.id)
    .eq('initiated_by', 'employer')
    .order('created_at', { ascending: false })

  if (error || !requests) {
    return { data: [], error: error?.message || null }
  }

  const enriched = requests.map((req: any) => {
    const isAccepted = req.status === 'accepted' || req.is_revealed === true
    const enrichedJob = req.jobs ? enrichJobRecord(req.jobs) : null
    const org = enrichedJob?.organizations || {}
    const fallbackEmployerEmail = org?.domain ? `hiring@${org.domain}` : null

    return {
      ...req,
      jobs: enrichedJob,
      reference_id: formatReferenceId(req.id),
      unlocked_employer_email: isAccepted
        ? req.match_data?.employer_contact_email || fallbackEmployerEmail
        : null,
      unlocked_candidate_email: isAccepted
        ? req.match_data?.candidate_contact_email || user.email || null
        : null
    }
  })

  return { data: enriched, error: null }
}

export async function recalculatePitchMatch(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('experience_years, skills, structured_skills, bio')
    .eq('id', user.id)
    .single()

  const visibleSkills = filterVisibleSkills(profile?.structured_skills)
  if (!profile || (!profile.skills && visibleSkills.length === 0)) {
    return { error: 'Your candidate profile does not have extracted skills yet. Please save skills on your profile first.' }
  }

  const { data: app } = await supabase
    .from('applications')
    .select(`
      id,
      job_id,
      match_data,
      jobs (
        id,
        title,
        description,
        work_model,
        structured_requirements
      )
    `)
    .eq('id', applicationId)
    .eq('candidate_id', user.id)
    .single()

  if (!app || !app.jobs) {
    return { error: 'Job details not found for this request.' }
  }

  const rawJob = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
  const jobObj = enrichJobRecord(rawJob)
  const matchResult = await analyzeMatchRouter({ ...profile, structured_skills: visibleSkills }, jobObj, 'candidate')

  if (matchResult.error || !matchResult.data) {
    return { error: matchResult.error || 'Failed to recalculate AI match. Please try again.' }
  }

  const newScore = matchResult.data.overall_score ?? 0
  const newPitch = matchResult.data.employer_pitch || matchResult.data.brief_analysis || null

  const mergedMatchData = {
    ...(app.match_data || {}),
    ...matchResult.data,
    reference_id: formatReferenceId(applicationId)
  }

  await supabase
    .from('applications')
    .update({
      match_score: newScore,
      match_data: mergedMatchData
    })
    .eq('id', applicationId)
    .eq('candidate_id', user.id)

  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/employer/pitches')
  return {
    data: {
      match_score: newScore,
      employer_pitch: newPitch,
      match_data: mergedMatchData
    }
  }
}

export async function respondToConnectionRequest(
  applicationId: string,
  decision: 'accepted' | 'declined'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!applicationId || !['accepted', 'declined'].includes(decision)) {
    return { error: 'Invalid request parameters' }
  }

  const { data: existingApp } = await supabase
    .from('applications')
    .select(`
      id,
      match_data,
      jobs (
        title,
        organizations:organization_id (name, domain)
      ),
      profiles (
        full_name,
        name
      )
    `)
    .eq('id', applicationId)
    .eq('candidate_id', user.id)
    .single()

  const referenceId = formatReferenceId(applicationId)

  if (decision === 'declined') {
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'rejected',
        is_revealed: false
      })
      .eq('id', applicationId)
      .eq('candidate_id', user.id)

    if (error) {
      console.error('Error declining connection request:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/employer/search')
    revalidatePath('/dashboard/employer/pitches')
    return { success: true, storedStatus: 'rejected', referenceId }
  }

  const candidateName =
    (existingApp?.profiles as any)?.full_name ||
    (existingApp?.profiles as any)?.name ||
    existingApp?.match_data?.candidate_full_name ||
    'Verified Candidate'

  const updatedMatchData = {
    ...(existingApp?.match_data || {}),
    candidate_contact_email: user.email || existingApp?.match_data?.candidate_contact_email || null,
    candidate_full_name: candidateName,
    reference_id: referenceId,
    unlocked_at: new Date().toISOString()
  }

  let { error: acceptError } = await supabase
    .from('applications')
    .update({
      status: 'accepted',
      is_revealed: true,
      match_data: updatedMatchData
    })
    .eq('id', applicationId)
    .eq('candidate_id', user.id)

  let storedStatus = 'accepted'

  if (acceptError && acceptError.code === '23514') {
    const { error: fallbackError } = await supabase
      .from('applications')
      .update({
        is_revealed: true,
        match_data: updatedMatchData
      })
      .eq('id', applicationId)
      .eq('candidate_id', user.id)

    acceptError = fallbackError
    storedStatus = 'pending'
  }

  if (acceptError) {
    console.error('Error accepting connection request:', acceptError)
    return { error: acceptError.message }
  }

  const jobObj: any = Array.isArray(existingApp?.jobs) ? existingApp?.jobs[0] : existingApp?.jobs
  const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj?.organizations[0] : jobObj?.organizations
  const employerEmail =
    updatedMatchData.employer_contact_email ||
    (orgObj?.domain ? `hiring@${orgObj.domain}` : null)

  await sendPlatformNotification({
    to: employerEmail,
    subject: `Candidate Accepted Your Pitch for ${jobObj?.title || 'Open Role'}!`,
    referenceId,
    heading: 'Connection Request Accepted — Candidate Identity Unlocked!',
    bodyLines: [
      `${candidateName} accepted your connection request for "${jobObj?.title || 'Open Role'}".`,
      `Connection Reference ID: ${referenceId}`,
      `Candidate Contact Email: ${user.email || 'Available in Sent Pitches tracker'}`,
      `Open your Sent Pitches tracker to view their unlocked resume PDF and contact card.`
    ],
    ctaUrl: '/dashboard/employer/pitches',
    ctaLabel: 'View Unlocked Candidate & Resume →'
  })

  await sendPlatformNotification({
    to: user.email,
    subject: `You Unlocked ${orgObj?.name || 'Employer'} Contact Info for ${jobObj?.title || 'Open Role'}`,
    referenceId,
    heading: 'Connection Confirmed & Contact Info Unlocked!',
    bodyLines: [
      `You accepted the connection pitch from ${orgObj?.name || 'Verified Employer'} for "${jobObj?.title || 'Open Role'}".`,
      `Connection Reference ID: ${referenceId}`,
      employerEmail ? `Employer Contact Email: ${employerEmail}` : `View their contact info in your Employer Pitches inbox.`
    ],
    ctaUrl: '/dashboard/requests',
    ctaLabel: 'View Connection Details →'
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/employer/pitches')
  return {
    success: true,
    storedStatus,
    referenceId,
    unlocked_employer_email: employerEmail,
    unlocked_candidate_email: user.email || null
  }
}

// ------------------------------------------------------------------
// AI MATCH SCORING (Candidate <-> Job) WITH CASCADING FALLBACKS
// ------------------------------------------------------------------

export async function analyzeJobFit(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('experience_years, skills, structured_skills, bio').eq('id', user.id).single()
  const visibleSkills = filterVisibleSkills(profile?.structured_skills)
  if (!profile || (!profile.skills && visibleSkills.length === 0)) {
    return { error: 'Profile incomplete' }
  }

  const { data: rawJob } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!rawJob) return { error: 'Job not found' }

  const job = enrichJobRecord(rawJob)
  return await analyzeMatchRouter({ ...profile, structured_skills: visibleSkills }, job, 'candidate')
}

export async function analyzeCandidateFit(candidateId: string, jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('experience_years, skills, structured_skills, bio')
    .eq('id', candidateId)
    .single()

  if (!profile) return { error: 'Candidate profile not found' }

  const { data: rawJob } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!rawJob) return { error: 'Job not found' }

  const job = enrichJobRecord(rawJob)
  const visibleSkills = filterVisibleSkills(profile.structured_skills)
  return await analyzeMatchRouter({ ...profile, structured_skills: visibleSkills }, job, 'employer')
}

function getMatchPrompt(
  profile: any,
  job: any,
  viewerRole: 'candidate' | 'employer' = 'candidate'
) {
  const visibleSkills = filterVisibleSkills(profile.structured_skills)
  const skillsToAssess = visibleSkills.length > 0 
    ? JSON.stringify(visibleSkills) 
    : (profile.skills || 'None listed');

  const visibleReqs = filterVisibleJobRequirements(job.structured_requirements)
  const jobReqsToAssess = visibleReqs.length > 0
    ? JSON.stringify(visibleReqs)
    : 'See job description';

  const briefAnalysisInstruction =
    viewerRole === 'employer'
      ? "<A 1-sentence objective assessment addressed directly TO the employer/hiring manager about the candidate in the third person (e.g., 'This candidate is a strong fit because their experience...' or 'This candidate is not an ideal fit for this role because they lack...'). NEVER use 'you' or 'your' when referring to the candidate.>"
      : "<A 1-sentence explanation addressed directly TO the candidate (e.g., 'You are a strong fit because...') of why they are or aren't a good match.>";

  return `
    You are an expert technical recruiter and data analyst. 
    Compare this candidate's profile against the job posting and calculate their fit.
    
    IMPORTANT MATCHING RULES:
    - Evaluate skills semantically, NOT by strict character-for-character string equality.
    - Recognize synonyms, abbreviations, pluralizations, and minor spelling variations as full matches (for example: "Tech Support" = "Technical Support", "JS" = "JavaScript", "React.js" = "React").
    - Weigh the job's Core Requirements and Seniority Level heavily when determining the overall_score and Technical Skills score.

    CANDIDATE PROFILE:
    Experience: ${profile.experience_years || 'Not specified'} years
    Skills & Experience Matrix: ${skillsToAssess}
    Bio: ${profile.bio || 'No bio provided'}

    JOB POSTING:
    Title: ${job.title}
    Seniority / Experience Level: ${job.experience_level || 'Not specified'}
    Employment Type: ${job.employment_type || 'Full-Time'}
    Work Model & Location: ${job.work_model} (${job.location || 'Flexible'})
    Core Requirements: ${jobReqsToAssess}
    Job Description Overview: ${job.description || ''}

    Return ONLY a raw JSON object with no markdown formatting, no backticks, and no extra text.
    The JSON object must have EXACTLY this structure:
    {
      "overall_score": <number between 0-100>,
      "radar_data": [
        { "subject": "Technical Skills", "score": <number 0-100> },
        { "subject": "Experience Level", "score": <number 0-100> },
        { "subject": "Role Alignment", "score": <number 0-100> },
        { "subject": "Domain Expertise", "score": <number 0-100> },
        { "subject": "Culture & Soft Skills", "score": <number 0-100> }
      ],
      "brief_analysis": "${briefAnalysisInstruction}",
      "employer_pitch": "<A 3-sentence enthusiastic summary addressed directly TO the candidate (e.g., 'You will bring...', 'Your experience with...') explaining why they are a great fit for this role.>"
    }
  `
}

function parseAiResponse(text: string) {
  const cleanJsonString = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const firstBrace = cleanJsonString.indexOf('{')
  const lastBrace = cleanJsonString.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1) {
    return JSON.parse(cleanJsonString.slice(firstBrace, lastBrace + 1))
  }
  return JSON.parse(cleanJsonString)
}

async function analyzeMatchRouter(
  profile: any,
  job: any,
  viewerRole: 'candidate' | 'employer' = 'candidate'
) {
  const prompt = getMatchPrompt(profile, job, viewerRole)

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const geminiModelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash'
      ]

      for (const model of geminiModelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt
          })

          if (response.text) {
            const parsed = parseAiResponse(response.text)
            console.log(`[${viewerRole}] Match generated via Gemini (${model})`)
            return { data: parsed }
          }
        } catch (error: any) {
          console.warn(`[${viewerRole}] Gemini Match (${model}) failed:`, error.message || error)
          continue
        }
      }
    } catch (initError: any) {
      console.warn(`[${viewerRole}] Gemini SDK initialization error:`, initError.message || initError)
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const groqModelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

      for (const groqModel of groqModelsToTry) {
        try {
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are a data extraction API. You MUST output valid JSON.' },
              { role: 'user', content: prompt }
            ],
            model: groqModel,
            response_format: { type: 'json_object' }
          })

          if (chatCompletion.choices[0]?.message?.content) {
            const parsed = parseAiResponse(chatCompletion.choices[0].message.content)
            console.log(`[${viewerRole}] Match generated via Groq (${groqModel})`)
            return { data: parsed }
          }
        } catch (error: any) {
          console.warn(`[${viewerRole}] Groq Match (${groqModel}) failed:`, error.message || error)
          continue
        }
      }
    } catch (initError: any) {
      console.error(`[${viewerRole}] Groq SDK initialization error:`, initError.message || initError)
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const openAiModelsToTry = ['gpt-4o-mini', 'gpt-4o']

      for (const openAiModel of openAiModelsToTry) {
        try {
          const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: openAiModel,
            response_format: { type: 'json_object' }
          })

          if (completion.choices[0]?.message?.content) {
            const parsed = parseAiResponse(completion.choices[0].message.content)
            console.log(`[${viewerRole}] Match generated via OpenAI (${openAiModel})`)
            return { data: parsed }
          }
        } catch (error: any) {
          console.warn(`[${viewerRole}] OpenAI Match (${openAiModel}) failed:`, error.message || error)
          continue
        }
      }
    } catch (initError: any) {
      console.error(`[${viewerRole}] OpenAI SDK initialization error:`, initError.message || initError)
    }
  }

  return { error: 'Failed to analyze fit across all available services. Please try again.' }
}

// ------------------------------------------------------------------
// EMPLOYER ACTIONS (WITH RICH METADATA & ANNUAL/HOURLY PAY TYPES)
// ------------------------------------------------------------------

export async function parseJobAutoFill(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('job_description') as File
  if (!file) return { error: 'No file provided' }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')
    
    const prompt = `
      You are an expert technical recruiter. Analyze the attached job description document.
      Extract the core requirements and return ONLY a raw JSON object with no markdown formatting.
      The JSON object must have these keys:
      1. "title": The job title (string).
      2. "description": A 3-4 sentence summary of the role (string, do NOT include the company name so the listing stays blind).
      3. "work_model": Either "remote", "hybrid", or "onsite" (string).
      4. "location": City/State or Remote Region/Timezone (e.g., "Dallas-Fort Worth-Arlington (DFW Metro), TX" or "Remote — US Nationwide") (string).
      5. "pay_type": Either "annual" or "hourly" (string).
      6. "salary_min": Minimum pay number if mentioned, or "" (number or string).
      7. "salary_max": Maximum pay number if mentioned, or "" (number or string).
      8. "employment_type": One of "Full-Time (W-2)", "Contract / 1099", "Contract-to-Hire", or "Part-Time".
      9. "experience_level": One of "Entry / Junior (0–2 yrs)", "Mid-Level (3–5 yrs)", "Senior (5–8 yrs)", "Lead / Staff / Principal (8+ yrs)", or "Executive / Director".
      10. "industry": Short industry category (e.g., "SaaS / AI", "FinTech", "Healthcare", "Cybersecurity", "Enterprise IT").
      11. "structured_requirements": A JSON array of objects representing the 5-8 most critical skills required. 
          Each object MUST have two keys: "skill" (string) and "level" ("Beginner", "Intermediate", or "Expert").
    `

    const responseText = await extractPdfWithRetry(prompt, base64Data)

    const cleanJsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    return { data: JSON.parse(cleanJsonString) }

  } catch (error: any) {
    console.error("AI Job Parsing Error:", error.message || error)
    return { error: error.message || 'Failed to parse job description' }
  }
}

function buildJobRequirementsWithMeta(formData: FormData): any[] {
  const structured_requirements_raw = formData.get('structured_requirements') as string
  let visibleReqs: any[] = []
  try {
    if (structured_requirements_raw) {
      visibleReqs = filterVisibleJobRequirements(JSON.parse(structured_requirements_raw))
    }
  } catch (e) {
    console.error('Failed to parse structured requirements')
  }

  const pay_type = ((formData.get('pay_type') as string) || 'annual') === 'hourly' ? 'hourly' : 'annual'
  const comp_perks = ((formData.get('comp_perks') as string) || 'Base Salary Only').trim()
  const location = ((formData.get('location') as string) || '').trim()
  const employment_type = ((formData.get('employment_type') as string) || 'Full-Time (W-2)').trim()
  const experience_level = ((formData.get('experience_level') as string) || 'Senior (5–8 yrs)').trim()
  const industry = ((formData.get('industry') as string) || '').trim()
  const company_size = ((formData.get('company_size') as string) || '').trim()
  const work_auth = ((formData.get('work_auth') as string) || 'US Authorized Only').trim()

  const metaObject = {
    _ss_job_meta: true,
    pay_type,
    comp_perks,
    location,
    employment_type,
    experience_level,
    industry,
    company_size,
    work_auth,
  }

  return [...visibleReqs, metaObject]
}

export async function createStructuredJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!currentMember?.organization_id) {
    return { error: 'Organization profile required before posting jobs.' }
  }

  const { data: orgObj } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', currentMember.organization_id)
    .single()

  if (orgObj?.verification_status !== 'verified') {
    return {
      error: 'Job Posting Blocked: Your corporate domain must be verified before posting open roles.'
    }
  }

  const tierInfo = await resolveEmployerTierInfo(orgObj)
  if (tierInfo.tier === 'free' || tierInfo.maxActiveJobs < 1) {
    return {
      error: 'Subscription Required: Your account is currently on the Free Explorer plan (browse-only). Subscribe to Starter ($99/mo), Growth ($299/mo), or Enterprise ($899/mo) on your Billing page to publish active roles.'
    }
  }

  const { count: currentActiveJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', currentMember.organization_id)
    .eq('is_active', true)

  if ((currentActiveJobs || 0) >= tierInfo.maxActiveJobs) {
    return {
      error: `Active Role Limit Reached: Your ${tierInfo.label} allows up to ${tierInfo.maxActiveJobs} simultaneous active roles (currently ${currentActiveJobs}/${tierInfo.maxActiveJobs}). Please close an existing role or upgrade your subscription tier.`
    }
  }

  const title = formData.get('title') as string
  const work_model = formData.get('work_model') as string
  const description = formData.get('description') as string
  
  const salary_min_raw = formData.get('salary_min')
  const salary_max_raw = formData.get('salary_max')
  
  const salary_min = salary_min_raw ? Math.round(parseFloat(salary_min_raw.toString())) : null
  const salary_max = salary_max_raw ? Math.round(parseFloat(salary_max_raw.toString())) : null
  
  const structured_requirements = buildJobRequirementsWithMeta(formData)

  const { error } = await supabase.from('jobs').insert({
    organization_id: currentMember.organization_id,
    employer_id: user.id,
    title,
    work_model,
    description,
    salary_min,
    salary_max,
    structured_requirements,
    is_active: true
  })

  if (error) {
    console.error("Insert Job Error:", error)
    return { error: 'Failed to create job' }
  }
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/employer/billing')
}

export async function updateStructuredJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const jobId = formData.get('job_id') as string
  if (!jobId) return { error: 'Missing job ID' }

  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!currentMember?.organization_id) {
    return { error: 'Organization profile required.' }
  }

  const title = (formData.get('title') as string || '').trim()
  const work_model = (formData.get('work_model') as string || 'hybrid').trim()
  const description = (formData.get('description') as string || '').trim()

  const salary_min_raw = formData.get('salary_min')
  const salary_max_raw = formData.get('salary_max')

  const salary_min = salary_min_raw ? Math.round(parseFloat(salary_min_raw.toString())) : null
  const salary_max = salary_max_raw ? Math.round(parseFloat(salary_max_raw.toString())) : null

  const structured_requirements = buildJobRequirementsWithMeta(formData)

  const { error } = await supabase
    .from('jobs')
    .update({
      title,
      work_model,
      description,
      salary_min,
      salary_max,
      structured_requirements
    })
    .eq('id', jobId)
    .eq('organization_id', currentMember.organization_id)

  if (error) {
    console.error('Update Job Error:', error)
    return { error: error.message || 'Failed to update job' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath(`/dashboard/employer/jobs/${jobId}/edit`)
  return { success: true }
}

// ------------------------------------------------------------------
// EMPLOYER: CANDIDATE SEARCH & CONNECTIONS
// ------------------------------------------------------------------

export async function searchCandidates(query: string, workModel?: string, location?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) {
    return { error: 'Organization profile required.' }
  }

  const { data: orgObj } = await supabase
    .from('organizations')
    .select('verification_status')
    .eq('id', member.organization_id)
    .single()

  if (orgObj?.verification_status !== 'verified') {
    return {
      error: 'Search Locked: Please verify your corporate domain on your Company Profile before searching the talent pool.'
    }
  }

  let pitchedCandidateIds: string[] = []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('organization_id', member.organization_id)

  if (jobs && jobs.length > 0) {
    const jobIds = jobs.map(j => j.id)
    
    const { data: applications } = await supabase
      .from('applications')
      .select('candidate_id, status')
      .in('job_id', jobIds)
      .eq('initiated_by', 'employer')

    if (applications) {
      pitchedCandidateIds = applications
        .filter(app => app.status !== 'rejected' && app.status !== 'declined')
        .map(app => app.candidate_id)
    }
  }
  
  let dbQuery = supabase
    .from('profiles')
    .select('id, skills, structured_skills, bio, min_salary_expectation, preferred_work_model, location, identity_verified')
    .eq('role', 'candidate')
    .eq('is_discoverable', true)

  if (query) {
    dbQuery = dbQuery.or(`skills.ilike.%${query}%,bio.ilike.%${query}%`)
  }

  if (workModel) {
    const modelTerm = workModel.toLowerCase().trim()
    if (modelTerm === 'remote') {
      dbQuery = dbQuery.in('preferred_work_model', ['remote', 'Remote', 'Remote Only', 'any', 'Any'])
    } else if (modelTerm === 'hybrid') {
      dbQuery = dbQuery.in('preferred_work_model', ['hybrid', 'Hybrid', 'any', 'Any'])
    } else if (modelTerm === 'onsite') {
      dbQuery = dbQuery.in('preferred_work_model', ['onsite', 'On-site', 'Onsite', 'any', 'Any'])
    } else {
      dbQuery = dbQuery.ilike('preferred_work_model', `%${modelTerm}%`)
    }
  }

  if (location) {
    dbQuery = dbQuery.ilike('location', `%${location.trim()}%`)
  }

  const { data, error } = await dbQuery.limit(50)
  
  if (error) {
    console.error("Supabase Search Error:", error.message)
    return { error: error.message }
  }

  const filteredData = (data || [])
    .filter(candidate => !pitchedCandidateIds.includes(candidate.id))
    .map(candidate => ({
      ...candidate,
      structured_skills: filterVisibleSkills(candidate.structured_skills),
    }))

  return { data: filteredData.slice(0, 20) }
}

export async function sendConnectionRequest(
  candidateId: string,
  jobId: string,
  precomputedMatchData?: any
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) return { error: 'No organization found.' }

  const { data: orgObj } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  if (orgObj?.verification_status !== 'verified') {
    return {
      error: 'Action Blocked: Your corporate domain must be verified before sending connection requests.'
    }
  }

  const tierInfo = await resolveEmployerTierInfo(orgObj)
  const credits = orgObj?.connection_credits || 0
  const totalSent = orgObj?.total_requests_sent || 0
  
  if (tierInfo.tier === 'free' || credits < 1) {
    return {
      error: 'Subscription / Pitch Credits Required: Subscribe to Starter ($99/mo), Growth ($299/mo), or Enterprise ($899/mo) to unlock outbound candidate pitches.'
    }
  }

  const { data: rawJob } = await supabase
    .from('jobs')
    .select('title, description, salary_min, salary_max, work_model, structured_requirements')
    .eq('id', jobId)
    .eq('organization_id', member.organization_id)
    .single()

  if (!rawJob) return { error: 'Job not found or access denied.' }
  const job = enrichJobRecord(rawJob)

  const { data: candidate } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (!candidate) return { error: 'Candidate profile not found.' }

  const annualizedMaxPay =
    job.pay_type === 'hourly' && job.salary_max
      ? job.salary_max * 2080
      : job.salary_max

  if (candidate.min_salary_expectation > 0 && annualizedMaxPay && annualizedMaxPay < candidate.min_salary_expectation) {
    return { error: `Request Blocked: Candidate requires a minimum salary of $${(candidate.min_salary_expectation / 1000).toFixed(0)}k/yr.` }
  }

  const candidatePrefModel = (candidate.preferred_work_model || 'any').toLowerCase().trim()
  const jobWorkModel = (job.work_model || '').toLowerCase().trim()

  if (candidatePrefModel !== 'any' && candidatePrefModel !== 'open' && jobWorkModel !== candidatePrefModel) {
    return { error: `Request Blocked: Candidate is only accepting ${candidate.preferred_work_model} roles.` }
  }

  let matchData = precomputedMatchData || null
  if (!matchData) {
    const { data: matchResult, error: matchErr } = await analyzeMatchRouter(
      { ...candidate, structured_skills: filterVisibleSkills(candidate.structured_skills) },
      job,
      'employer'
    )
    if (matchErr) return { error: matchErr }
    matchData = matchResult || null
  }
  const matchScore = matchData?.overall_score ?? null

  if (matchScore === null || matchScore < MIN_MATCH_THRESHOLD) {
    return {
      error: `Request Blocked: AI Match Score (${matchScore ?? 0}%) is below the ${MIN_MATCH_THRESHOLD}% minimum relevance threshold.`
    }
  }

  let knownCandidateEmail = candidate?.contact_email || candidate?.email || null
  let knownCandidateName = candidate?.full_name || candidate?.name || null

  if (!knownCandidateEmail || !knownCandidateName) {
    const { data: priorApp } = await supabase
      .from('applications')
      .select('match_data')
      .eq('candidate_id', candidateId)
      .limit(1)
      .maybeSingle()

    if (!knownCandidateEmail) {
      knownCandidateEmail = priorApp?.match_data?.candidate_contact_email || null
    }
    if (!knownCandidateName) {
      knownCandidateName = priorApp?.match_data?.candidate_full_name || null
    }
  }

  const enrichedMatchData = {
    ...(matchData || {}),
    employer_contact_email: user.email || (orgObj?.domain ? `hiring@${orgObj.domain}` : null),
    candidate_contact_email: knownCandidateEmail,
    candidate_full_name: knownCandidateName
  }

  const { data: existingPitch } = await supabase
    .from('applications')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
    .maybeSingle()

  let finalPitchId = existingPitch?.id || ''

  if (existingPitch?.id) {
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'pending',
        initiated_by: 'employer',
        is_revealed: false,
        match_score: matchScore,
        match_data: {
          ...enrichedMatchData,
          reference_id: formatReferenceId(existingPitch.id)
        }
      })
      .eq('id', existingPitch.id)

    if (updateError) {
      console.error("RAW UPDATE ERROR:", updateError)
      return { error: `DB Error: ${updateError.message}` }
    }
  } else {
    const { data: insertedPitch, error: insertError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        status: 'pending',
        initiated_by: 'employer',
        is_revealed: false,
        match_score: matchScore,
        match_data: enrichedMatchData
      })
      .select('id')
      .single()

    if (insertError) {
      console.error("RAW INSERT ERROR:", insertError) 
      if (insertError.code === '23505') return { error: 'You have already sent a request to this candidate for this role.' }
      return { error: `DB Error: ${insertError.message} (Code: ${insertError.code})` } 
    }

    finalPitchId = insertedPitch?.id || ''
  }

  await supabase
    .from('organizations')
    .update({ 
      connection_credits: credits - 1,
      total_requests_sent: totalSent + 1 
    })
    .eq('id', member.organization_id)

  const refId = formatReferenceId(finalPitchId)

  await sendPlatformNotification({
    to: enrichedMatchData.candidate_contact_email,
    subject: `${orgObj?.name || 'A Verified Employer'} pitched you a role: ${job.title} (${matchScore}% Match)`,
    referenceId: refId,
    heading: `New Employer Connection Pitch (${matchScore}% AI Match)`,
    bodyLines: [
      `${orgObj?.name || 'A Domain-Verified Employer'} matched with your anonymous profile and spent a connection credit to pitch you their "${job.title}" role.`,
      `Transaction Reference ID: ${refId}`,
      `Your identity remains hidden until you accept the request in your Employer Pitches inbox.`
    ],
    ctaUrl: '/dashboard/requests',
    ctaLabel: 'Review Pitch in Inbox →'
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/employer/search')
  revalidatePath('/dashboard/employer/pitches')
  revalidatePath('/dashboard/employer/billing')
  revalidatePath('/dashboard/requests')
  return { success: true, referenceId: refId, remainingCredits: credits - 1 }
}

// ------------------------------------------------------------------
// EMPLOYER: SENT PITCHES & INBOUND APPLICATIONS PIPELINE MANAGEMENT
// ------------------------------------------------------------------

export async function getEmployerPitches(statusFilter?: string, daysFilter?: number, searchQuery?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) return { error: 'No organization found.' }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('organization_id', member.organization_id)

  if (!jobs || jobs.length === 0) return { data: [] }
  const jobIds = jobs.map(j => j.id)

  let dbQuery = supabase
    .from('applications')
    .select(`
      id,
      created_at,
      status,
      candidate_id,
      is_revealed,
      match_score,
      match_data,
      jobs (
        id,
        title,
        work_model,
        salary_min,
        salary_max,
        structured_requirements
      ),
      profiles (*)
    `)
    .in('job_id', jobIds)
    .eq('initiated_by', 'employer')
    .order('created_at', { ascending: false })

  if (daysFilter && daysFilter > 0) {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - daysFilter)
    dbQuery = dbQuery.gte('created_at', dateLimit.toISOString())
  }

  const { data, error } = await dbQuery
  if (error) return { error: error.message }

  let processedData = (data || []).map((app: any) => {
    const normalizedStatus =
      app.status === 'rejected' || app.status === 'declined'
        ? 'declined'
        : app.status === 'accepted' || app.is_revealed === true
        ? 'accepted'
        : 'pending'

    const isUnlocked = normalizedStatus === 'accepted'
    const rawProfile = app.profiles || {}
    const resolvedFullName =
      rawProfile.full_name ||
      rawProfile.name ||
      app.match_data?.candidate_full_name ||
      null

    const safeProfile = app.profiles
      ? {
          ...rawProfile,
          structured_skills: filterVisibleSkills(rawProfile.structured_skills),
          full_name: isUnlocked ? resolvedFullName : null,
          resume_url: isUnlocked ? rawProfile.resume_url : null
        }
      : null

    return {
      ...app,
      jobs: app.jobs ? enrichJobRecord(app.jobs) : null,
      normalized_status: normalizedStatus,
      reference_id: formatReferenceId(app.id),
      unlocked_candidate_name: isUnlocked ? resolvedFullName : null,
      unlocked_candidate_email: isUnlocked
        ? app.match_data?.candidate_contact_email || rawProfile.contact_email || rawProfile.email || null
        : null,
      unlocked_employer_email: isUnlocked
        ? app.match_data?.employer_contact_email || user.email || null
        : null,
      profiles: safeProfile
    }
  })

  if (statusFilter && statusFilter !== 'all') {
    processedData = processedData.filter((app: any) => app.normalized_status === statusFilter)
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const lowerQuery = searchQuery.toLowerCase().trim()
    processedData = processedData.filter((app: any) => {
      const titleMatch = app.jobs?.title?.toLowerCase().includes(lowerQuery)
      const skillsMatch = app.profiles?.skills?.toLowerCase().includes(lowerQuery)
      const bioMatch = app.profiles?.bio?.toLowerCase().includes(lowerQuery)
      const refMatch = app.reference_id?.toLowerCase().includes(lowerQuery)
      const nameMatch = app.normalized_status === 'accepted'
        ? (app.unlocked_candidate_name || '').toLowerCase().includes(lowerQuery)
        : false
      return titleMatch || skillsMatch || bioMatch || refMatch || nameMatch
    })
  }

  return { data: processedData }
}

export async function getEmployerInboundApplications(
  statusFilter?: string,
  daysFilter?: number,
  searchQuery?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.organization_id) return { error: 'No organization found.' }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('organization_id', member.organization_id)

  if (!jobs || jobs.length === 0) return { data: [] }
  const jobIds = jobs.map(j => j.id)

  let dbQuery = supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id,
        title,
        work_model,
        salary_min,
        salary_max,
        structured_requirements
      ),
      profiles (*)
    `)
    .in('job_id', jobIds)
    .neq('initiated_by', 'employer')
    .order('created_at', { ascending: false })

  if (daysFilter && daysFilter > 0) {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - daysFilter)
    dbQuery = dbQuery.gte('created_at', dateLimit.toISOString())
  }

  const { data, error } = await dbQuery
  if (error) return { error: error.message }

  let processedData = (data || []).map((app: any) => {
    let normalizedStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected' = 'unrevealed'

    if (app.status === 'rejected' || app.status === 'declined') {
      normalizedStatus = 'rejected'
    } else if (
      app.status === 'accepted' ||
      app.status === 'shortlisted' ||
      app.status === 'interviewing' ||
      app.match_data?.employer_decision === 'shortlisted'
    ) {
      normalizedStatus = 'shortlisted'
    } else if (app.is_revealed === true) {
      normalizedStatus = 'unlocked'
    } else {
      normalizedStatus = 'unrevealed'
    }

    const isUnlocked = Boolean(app.is_revealed || normalizedStatus === 'unlocked' || normalizedStatus === 'shortlisted')
    const rawProfile = app.profiles || {}
    const resolvedFullName =
      rawProfile.full_name ||
      rawProfile.name ||
      app.match_data?.candidate_full_name ||
      null

    return {
      ...app,
      jobs: app.jobs ? enrichJobRecord(app.jobs) : null,
      normalized_status: normalizedStatus,
      reference_id: formatReferenceId(app.id),
      unlocked_candidate_name: isUnlocked ? resolvedFullName : null,
      unlocked_candidate_email: isUnlocked
        ? app.match_data?.candidate_contact_email || rawProfile.contact_email || rawProfile.email || null
        : null,
      unlocked_employer_email: isUnlocked
        ? app.match_data?.employer_contact_email || user.email || null
        : null,
      profiles: app.profiles
        ? {
            ...rawProfile,
            structured_skills: filterVisibleSkills(rawProfile.structured_skills),
          }
        : null,
    }
  })

  if (statusFilter && statusFilter !== 'all') {
    processedData = processedData.filter((app: any) => app.normalized_status === statusFilter)
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const lowerQuery = searchQuery.toLowerCase().trim()
    processedData = processedData.filter((app: any) => {
      const titleMatch = app.jobs?.title?.toLowerCase().includes(lowerQuery)
      const skillsMatch = app.profiles?.skills?.toLowerCase().includes(lowerQuery)
      const bioMatch = app.profiles?.bio?.toLowerCase().includes(lowerQuery)
      const refMatch = app.reference_id?.toLowerCase().includes(lowerQuery)
      const nameMatch = app.is_revealed
        ? (app.unlocked_candidate_name || '').toLowerCase().includes(lowerQuery)
        : false
      return titleMatch || skillsMatch || bioMatch || nameMatch || refMatch
    })
  }

  return { data: processedData }
}

export async function updateInboundApplicationDecision(
  applicationId: string,
  decision: 'shortlisted' | 'rejected' | 'unlocked'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: existingApp } = await supabase
    .from('applications')
    .select(`
      id,
      match_data,
      jobs (
        title,
        organizations:organization_id (name, domain)
      ),
      profiles (*)
    `)
    .eq('id', applicationId)
    .single()

  const referenceId = formatReferenceId(applicationId)
  const employerEmail = existingApp?.match_data?.employer_contact_email || user.email || null
  const profileObj: any = Array.isArray(existingApp?.profiles) ? existingApp?.profiles[0] : existingApp?.profiles
  const candidateEmail =
    existingApp?.match_data?.candidate_contact_email ||
    profileObj?.contact_email ||
    profileObj?.email ||
    null

  const updatedMatchData = {
    ...(existingApp?.match_data || {}),
    employer_decision: decision,
    employer_contact_email: employerEmail,
    candidate_contact_email: candidateEmail,
    reference_id: referenceId
  }

  if (decision === 'rejected') {
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'rejected',
        match_data: updatedMatchData
      })
      .eq('id', applicationId)

    if (error) return { error: error.message }
  } else if (decision === 'shortlisted') {
    let { error } = await supabase
      .from('applications')
      .update({
        status: 'accepted',
        is_revealed: true,
        match_data: updatedMatchData
      })
      .eq('id', applicationId)

    if (error && error.code === '23514') {
      const { error: fallbackErr } = await supabase
        .from('applications')
        .update({
          status: 'pending',
          is_revealed: true,
          match_data: updatedMatchData
        })
        .eq('id', applicationId)
      error = fallbackErr
    }

    if (error) return { error: error.message }

    const jobObj: any = Array.isArray(existingApp?.jobs) ? existingApp?.jobs[0] : existingApp?.jobs
    const orgObj: any = Array.isArray(jobObj?.organizations) ? jobObj?.organizations[0] : jobObj?.organizations

    await sendPlatformNotification({
      to: candidateEmail,
      subject: `You Were Shortlisted by ${orgObj?.name || 'Verified Employer'} for ${jobObj?.title || 'Open Role'}!`,
      referenceId,
      heading: 'Congratulations! You Have Been Shortlisted for an Interview',
      bodyLines: [
        `${orgObj?.name || 'A Verified Employer'} shortlisted your application for "${jobObj?.title || 'Open Role'}".`,
        `Connection Reference ID: ${referenceId}`,
        employerEmail ? `Hiring Team Contact Email: ${employerEmail}` : `View their contact info in your Application Tracker.`
      ],
      ctaUrl: '/dashboard/applications',
      ctaLabel: 'View Shortlisted Application →'
    })
  } else {
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'pending',
        is_revealed: true,
        match_data: updatedMatchData
      })
      .eq('id', applicationId)

    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/employer/applications')
  return { success: true, decision }
}

// ------------------------------------------------------------------
// EMPLOYER: ORGANIZATION, DOMAIN VERIFICATION, TEAM SEATS & TIERS
// ------------------------------------------------------------------

export async function saveOrganizationProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string || '').trim()
  const rawDomain = (formData.get('domain') as string || '').trim()
  const rawDescription = (formData.get('description') as string || '').trim()
  const logo_url = (formData.get('logo_url') as string || '').trim()

  if (!name) return { error: 'Company Name is required.' }

  const cleanedDomain = rawDomain ? normalizeDomainInput(rawDomain) : ''
  const userEmailDomain = (user.email?.split('@')[1] || '').toLowerCase().trim()

  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId = existingMember?.organization_id || null
  let currentStatus = 'pending'
  let existingTierMarker = '[TIER:free]'
  let existingSeatsTag = ''

  if (orgId) {
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (currentOrg?.domain && normalizeDomainInput(currentOrg.domain) === cleanedDomain) {
      currentStatus = currentOrg.verification_status || 'pending'
    }

    const tierInfo = await resolveEmployerTierInfo(currentOrg)
    existingTierMarker = `[TIER:${tierInfo.tier}]`
    const seatsMatch = (currentOrg?.description || '').match(/\[SEATS:[^\]]+\]/i)
    if (seatsMatch) existingSeatsTag = seatsMatch[0]
  }

  let autoVerified = false
  if (
    cleanedDomain &&
    !FREE_EMAIL_DOMAINS.has(cleanedDomain) &&
    userEmailDomain === cleanedDomain
  ) {
    currentStatus = 'verified'
    autoVerified = true
  }

  const cleanUserDesc = await stripTierTag(rawDescription)
  const storedDescription = `${cleanUserDesc} ${existingTierMarker} ${existingSeatsTag}`.trim()

  if (orgId) {
    const { error } = await supabase
      .from('organizations')
      .update({
        name,
        domain: cleanedDomain,
        description: storedDescription,
        logo_url,
        verification_status: currentStatus
      })
      .eq('id', orgId)

    if (error) return { error: error.message }
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        domain: cleanedDomain,
        description: `${cleanUserDesc} [TIER:free]`.trim(),
        logo_url,
        verification_status: currentStatus,
        connection_credits: 0
      })
      .select()
      .single()

    if (orgError || !newOrg) return { error: orgError?.message || 'Failed to create organization.' }
    orgId = newOrg.id

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) return { error: memberError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/search')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/employer/billing')
  revalidatePath('/dashboard/jobs')

  return {
    success: true,
    organizationId: orgId,
    domain: cleanedDomain,
    verification_status: currentStatus,
    message: autoVerified
      ? `Profile saved & ${cleanedDomain} automatically verified via your matching work email (${user.email})!`
      : 'Company profile saved successfully.'
  }
}

export async function getOrganizationSeats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) return []

  const { data: org } = await supabase
    .from('organizations')
    .select('description, created_at')
    .eq('id', member.organization_id)
    .single()

  const ownerSeat = {
    id: `owner-${user.id}`,
    email: user.email || 'owner@company.com',
    role: 'owner' as const,
    status: 'active' as const,
    addedAt: org?.created_at || new Date().toISOString(),
  }

  const storedSeats = parseStoredSeatsTag(org?.description)
  return [ownerSeat, ...storedSeats]
}

export async function inviteOrganizationSeat(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const rawEmail = ((formData.get('email') as string) || '').trim().toLowerCase()
  const seatRole =
    (formData.get('seat_role') as string) === 'bpo_partner'
      ? 'bpo_partner'
      : 'hiring_manager'

  if (!rawEmail || !rawEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  if (rawEmail === (user.email || '').toLowerCase()) {
    return { error: 'You are already the Account Owner of this organization.' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Please save your Company Profile first.' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const tierInfo = await resolveEmployerTierInfo(org)
  const existingInvited = parseStoredSeatsTag(org?.description)
  const totalSeatsCurrentlyUsed = 1 + existingInvited.length

  if (totalSeatsCurrentlyUsed >= tierInfo.maxSeats) {
    return {
      error: `Seat Limit Reached (${totalSeatsCurrentlyUsed}/${tierInfo.maxSeats} Seats): Your ${tierInfo.label} includes up to ${tierInfo.maxSeats} ${tierInfo.maxSeats === 1 ? 'seat' : 'seats'}. Upgrade your plan to add more collaborators or BPO partners.`
    }
  }

  if (existingInvited.some(s => s.email.toLowerCase() === rawEmail)) {
    return { error: `${rawEmail} is already assigned a seat in your organization.` }
  }

  let seatStatus: 'active' | 'invited' = 'invited'
  try {
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.ilike.${rawEmail},contact_email.ilike.${rawEmail}`)
      .limit(1)
      .maybeSingle()

    if (matchedProfile?.id) {
      const { error: memberInsertErr } = await supabase
        .from('organization_members')
        .insert({
          organization_id: member.organization_id,
          user_id: matchedProfile.id,
          role: seatRole === 'bpo_partner' ? 'bpo_partner' : 'member'
        })
      if (!memberInsertErr) {
        seatStatus = 'active'
      }
    }
  } catch {
    // Fallback to invited status
  }

  const newSeat = {
    id: `seat-${Date.now()}`,
    email: rawEmail,
    role: seatRole as 'hiring_manager' | 'bpo_partner',
    status: seatStatus,
    addedAt: new Date().toISOString(),
  }

  const updatedInvited = [...existingInvited, newSeat]
  const cleanDesc = await stripTierTag(org?.description)
  const seatsTag = encodeStoredSeatsTag(updatedInvited)
  const newDescription = `${cleanDesc} [TIER:${tierInfo.tier}] ${seatsTag}`.trim()

  const { error: updateErr } = await supabase
    .from('organizations')
    .update({ description: newDescription })
    .eq('id', member.organization_id)

  if (updateErr) return { error: updateErr.message }

  const inviteRef = `SS-SEAT${Date.now().toString().slice(-5)}`
  const roleLabel =
    seatRole === 'bpo_partner' ? 'Delegated BPO / W-2 Recruiting Partner' : 'Hiring Manager'

  await sendPlatformNotification({
    to: rawEmail,
    subject: `You've been assigned a ${roleLabel} seat at ${org?.name || 'Verified Organization'}`,
    referenceId: inviteRef,
    heading: `Organization Seat Assigned: ${org?.name || 'Special Sauce Employer'}`,
    bodyLines: [
      `${user.email} assigned you a ${roleLabel} seat inside "${org?.name || 'their organization'}" on Special Sauce.`,
      `Seat Role: ${roleLabel}`,
      `Invite Reference ID: ${inviteRef}`,
      `Log in to access the shared candidate pipeline, 5-Point AI Match Radar, and connection credits.`
    ],
    ctaUrl: '/dashboard',
    ctaLabel: 'Accept Seat & Open Dashboard →'
  })

  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/billing')

  const allSeats = await getOrganizationSeats()
  return {
    success: true,
    seats: allSeats,
    message: `Assigned ${roleLabel} seat to ${rawEmail} (${allSeats.length}/${tierInfo.maxSeats} seats used) and sent invitation email!`
  }
}

export async function removeOrganizationSeat(seatId: string, seatEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) return { error: 'No organization found.' }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const tierInfo = await resolveEmployerTierInfo(org)
  const existingInvited = parseStoredSeatsTag(org?.description)
  const updatedInvited = existingInvited.filter(
    s => s.id !== seatId && s.email.toLowerCase() !== (seatEmail || '').toLowerCase()
  )

  const cleanDesc = await stripTierTag(org?.description)
  const seatsTag = encodeStoredSeatsTag(updatedInvited)
  const newDescription = `${cleanDesc} [TIER:${tierInfo.tier}] ${seatsTag}`.trim()

  const { error } = await supabase
    .from('organizations')
    .update({ description: newDescription })
    .eq('id', member.organization_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/billing')

  const allSeats = await getOrganizationSeats()
  return {
    success: true,
    seats: allSeats,
  }
}

export async function verifyOrganizationDomain(domainInput?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Please save your Company Profile first before running domain verification.' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const targetDomain = normalizeDomainInput(domainInput || org?.domain || '')
  if (!targetDomain || !targetDomain.includes('.')) {
    return { error: 'Please enter a valid corporate domain (e.g., acmecorp.com).' }
  }

  if (FREE_EMAIL_DOMAINS.has(targetDomain)) {
    return {
      error: `"${targetDomain}" is a public consumer email provider. Corporate domain verification requires a dedicated company domain.`
    }
  }

  const userEmailDomain = (user.email?.split('@')[1] || '').toLowerCase().trim()
  const expectedTxtToken = `special-sauce-verification=${member.organization_id.split('-')[0]}`

  let hasActiveDns = false
  let hasMatchingTxtToken = false

  try {
    const mxRecords = await dns.resolveMx(targetDomain)
    if (mxRecords && mxRecords.length > 0) hasActiveDns = true
  } catch {
    try {
      const aRecords = await dns.resolve4(targetDomain)
      if (aRecords && aRecords.length > 0) hasActiveDns = true
    } catch {
      hasActiveDns = false
    }
  }

  try {
    const txtRecords = await dns.resolveTxt(targetDomain)
    const flatTxt = txtRecords.map(chunk => chunk.join('')).join(' ')
    if (flatTxt.includes(expectedTxtToken)) {
      hasMatchingTxtToken = true
      hasActiveDns = true
    }
  } catch {
    // Ignore TXT lookup failure
  }

  const isWorkEmailMatch = userEmailDomain === targetDomain

  if (!isWorkEmailMatch && !hasMatchingTxtToken) {
    return {
      error: `Domain Mismatch: Your account email (${user.email}) does not match @${targetDomain}, and the DNS TXT token (${expectedTxtToken}) was not found on ${targetDomain}. Either sign in with an @${targetDomain} email, add the DNS TXT record, or use the Sandbox Verification button below for local testing.`
    }
  }

  if (!hasActiveDns && targetDomain !== 'test.com') {
    return {
      error: `DNS Lookup Failed: "${targetDomain}" does not appear to have active DNS or MX mail records configured.`
    }
  }

  const { error: updateErr } = await supabase
    .from('organizations')
    .update({
      domain: targetDomain,
      verification_status: 'verified'
    })
    .eq('id', member.organization_id)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/search')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/jobs')

  return {
    success: true,
    domain: targetDomain,
    verification_status: 'verified',
    message: hasMatchingTxtToken
      ? `Domain ${targetDomain} verified via DNS TXT record!`
      : `Domain ${targetDomain} verified via corporate email match (${user.email}) & live DNS check!`
  }
}

export async function toggleSandboxDomainVerification(targetStatus: 'verified' | 'pending') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Please save your Company Profile first before toggling verification.' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ verification_status: targetStatus })
    .eq('id', member.organization_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/search')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/jobs')

  return {
    success: true,
    verification_status: targetStatus,
    message:
      targetStatus === 'verified'
        ? 'Sandbox Override: Organization marked as Domain Verified!'
        : 'Organization reset to Pending Verification.'
  }
}

export async function activateSandboxEmployerTier(
  targetTier: 'free' | 'starter' | 'growth' | 'enterprise'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Please set up your Company Profile first.' }
  }

  const { data: orgObj } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  const tierMap = {
    free: { label: 'Free Explorer ($0/mo)', maxActiveJobs: 0, credits: 0, maxSeats: 1 },
    starter: { label: 'Starter Tier ($99/mo)', maxActiveJobs: 5, credits: 10, maxSeats: 1 },
    growth: { label: 'Growth Tier ($299/mo)', maxActiveJobs: 15, credits: 30, maxSeats: 3 },
    enterprise: { label: 'Enterprise Tier ($899/mo)', maxActiveJobs: 50, credits: 100, maxSeats: 10 },
  }

  const chosen = tierMap[targetTier]
  const currentCredits = orgObj?.connection_credits || 0
  const newCredits = targetTier === 'free' ? 0 : currentCredits + chosen.credits

  const cleanDesc = await stripTierTag(orgObj?.description)
  const seatsMatch = (orgObj?.description || '').match(/\[SEATS:[^\]]+\]/i)
  const existingSeatsTag = seatsMatch ? seatsMatch[0] : ''
  const taggedDesc = `${cleanDesc} [TIER:${targetTier}] ${existingSeatsTag}`.trim()

  // Persist tier in HTTP-only cookie as well so navigation never loses state
  try {
    const cookieStore = await cookies()
    cookieStore.set('ss_employer_tier', targetTier, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    })
  } catch {
    // Ignore cookie error if any
  }

  // Always update description + connection_credits first (guaranteed columns on organizations)
  const { error: baseErr } = await supabase
    .from('organizations')
    .update({
      connection_credits: newCredits,
      description: taggedDesc,
    })
    .eq('id', member.organization_id)

  // Also attempt updating optional subscription_tier / max_active_jobs columns if they exist
  await supabase
    .from('organizations')
    .update({
      subscription_tier: targetTier,
      max_active_jobs: chosen.maxActiveJobs,
    })
    .eq('id', member.organization_id)

  if (baseErr) {
    console.warn('Update organizations warning:', baseErr.message)
  }

  if (targetTier !== 'free') {
    const billingRef = `SS-SUB${Date.now().toString().slice(-5)}`
    await sendPlatformNotification({
      to: user.email,
      subject: `Subscription Activated: ${chosen.label} (${chosen.maxActiveJobs} Roles / +${chosen.credits} Credits / ${chosen.maxSeats} Seats)`,
      referenceId: billingRef,
      heading: `${chosen.label} Activated!`,
      bodyLines: [
        `Your organization (${orgObj?.name || 'Verified Employer'}) is now subscribed to ${chosen.label}.`,
        `Active Role Slot Limit: Up to ${chosen.maxActiveJobs} simultaneous active roles.`,
        `Monthly Pitch Credits Added: +${chosen.credits} Credits (New Balance: ${newCredits} Credits).`,
        `Team & BPO Partner Seats: Up to ${chosen.maxSeats} ${chosen.maxSeats === 1 ? 'Seat' : 'Seats'}.`,
        `Subscription Reference ID: ${billingRef}`,
      ],
      ctaUrl: '/dashboard/employer/organization',
      ctaLabel: 'Manage Team Seats & Roles →',
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/search')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/employer/billing')

  return {
    success: true,
    tier: targetTier,
    maxActiveJobs: chosen.maxActiveJobs,
    maxSeats: chosen.maxSeats,
    newCredits,
    message:
      targetTier === 'free'
        ? 'Organization reset to Free Explorer ($0/mo — 0 Active Role Slots, 0 Pitch Credits, 1 Seat).'
        : `Activated ${chosen.label}! Unlocked up to ${chosen.maxActiveJobs} Active Role Slots, ${chosen.maxSeats} Team/BPO Seats, and added +${chosen.credits} Pitch Credits.`,
  }
}

export async function addSandboxConnectionCredits(amountToAdd: number) {
  return activateSandboxEmployerTier(
    amountToAdd >= 50 ? 'enterprise' : amountToAdd >= 15 ? 'growth' : 'starter'
  )
}

// ------------------------------------------------------------------
// NATIVE HELP CENTER & SUPPORT TICKETING
// ------------------------------------------------------------------

export async function submitSupportTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const subject = (formData.get('subject') as string || '').trim()
  const category = (formData.get('category') as string || '').trim()
  const message = (formData.get('message') as string || '').trim()

  if (!subject || !message) {
    return { error: 'Please provide both a subject and a message.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, name, email, contact_email')
    .eq('id', user.id)
    .single()

  let orgContext = ''
  if (profile?.role === 'employer') {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (member?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single()
      if (org) {
        const tInfo = await resolveEmployerTierInfo(org)
        orgContext = `Organization: ${org.name} (${org.domain}) | Tier: ${tInfo.label}`
      }
    }
  }

  const ticketId = `TKT-${Date.now().toString().slice(-6)}`
  const userFullName = profile?.full_name || profile?.name || 'User'
  const userEmail = profile?.contact_email || profile?.email || user.email

  await sendPlatformNotification({
    to: 'info@specialsauce.io',
    subject: `Support Ticket [${ticketId}]: ${subject}`,
    referenceId: ticketId,
    heading: `New Support Request: ${category}`,
    bodyLines: [
      `User ID: ${user.id}`,
      `Role: ${profile?.role?.toUpperCase() || 'UNKNOWN'}`,
      `Name: ${userFullName}`,
      `Email: ${userEmail}`,
      orgContext ? orgContext : 'No organization attached.',
      '',
      '--- MESSAGE ---',
      message
    ],
  })

  await sendPlatformNotification({
    to: userEmail,
    subject: `Support Ticket Received: ${subject} [${ticketId}]`,
    referenceId: ticketId,
    heading: 'We received your support request',
    bodyLines: [
      `Hi ${userFullName},`,
      `Thank you for contacting Special Sauce support. We have received your request regarding "${category}" and our team will review it shortly.`,
      `Your Ticket ID is ${ticketId}.`,
      `We typically respond within 1-2 business days.`
    ],
    ctaUrl: '/dashboard/support',
    ctaLabel: 'Return to Help Center →'
  })

  return { success: true, ticketId }
}

// ------------------------------------------------------------------
// LEGACY COMPATIBILITY EXPORT FOR /dashboard/post-job/page.tsx
// ------------------------------------------------------------------

export async function createJob(formData: FormData) {
  await createStructuredJob(formData)
}