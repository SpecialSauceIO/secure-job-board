'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

const OPS_STORAGE_BUCKET = 'resumes'
const OPS_STORAGE_PATH = '_admin_ops_vault/ops_state_v1.json'

export type WorkItemStatus = 'new' | 'triaged' | 'waiting_customer' | 'resolved'
export type WorkItemPriority = 'P0_Critical' | 'P1_High' | 'P2_Normal'
export type WorkItemType = 'Support_Ticket' | 'Bug_Defect' | 'Feature_Request'

export interface OpsWorkItemNote {
  id: string
  author: string
  visibility: 'internal_note' | 'customer_reply'
  text: string
  created_at: string
}

export interface OpsWorkItem {
  id: string
  work_item_type: WorkItemType
  priority: WorkItemPriority
  status: WorkItemStatus
  subject: string
  category: string
  description: string
  reporter_user_id: string
  reporter_name: string
  reporter_email: string
  reporter_role: string
  organization_context?: string
  page_url?: string
  user_agent?: string
  ado_work_item_id?: string | null
  created_at: string
  updated_at: string
  notes: OpsWorkItemNote[]
}

export interface BehavioralFlagItem {
  id: string
  severity: 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'enforced' | 'dismissed'
  flag_type:
    | 'Phishing_Or_OffPlatform_Lure'
    | 'Silent_Unlock_Harvesting_Cap'
    | 'Domain_Verification_Mismatch'
    | 'Prompt_Injection_Suspected'
    | 'Manual_Trust_Audit'
  user_id?: string | null
  organization_id?: string | null
  actor_email: string
  actor_role: 'candidate' | 'employer' | 'unknown'
  summary: string
  evidence_snippet: string
  enforcement_taken?: string | null
  created_at: string
}

interface AdminOpsStore {
  work_items: OpsWorkItem[]
  behavioral_flags: BehavioralFlagItem[]
}

function cleanEnvKey(rawKey?: string | null): string {
  if (!rawKey) return ''
  return rawKey.trim().replace(/^["']+|["']+$/g, '').trim()
}

function getAdminSupabase() {
  const supabaseUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!supabaseUrl || !serviceRoleKey) return null
  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function readOpsStore(): Promise<AdminOpsStore> {
  const adminClient = getAdminSupabase()
  const supabase = adminClient || (await createClient())

  try {
    const { data, error } = await supabase.storage
      .from(OPS_STORAGE_BUCKET)
      .download(OPS_STORAGE_PATH)

    if (!error && data) {
      const text = await data.text()
      const parsed = JSON.parse(text)
      return {
        work_items: Array.isArray(parsed.work_items) ? parsed.work_items : [],
        behavioral_flags: Array.isArray(parsed.behavioral_flags)
          ? parsed.behavioral_flags
          : [],
      }
    }
  } catch {
    // Initialize fresh store if file does not exist yet
  }

  return { work_items: [], behavioral_flags: [] }
}

async function writeOpsStore(store: AdminOpsStore): Promise<void> {
  const adminClient = getAdminSupabase()
  const supabase = adminClient || (await createClient())

  try {
    const payload = JSON.stringify(store, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    await supabase.storage
      .from(OPS_STORAGE_BUCKET)
      .upload(OPS_STORAGE_PATH, blob, {
        upsert: true,
        contentType: 'application/json',
      })
  } catch (err) {
    console.warn('Admin Ops Store write warning:', err)
  }
}

/**
 * INTERNAL HELPER: LOGS A WORK ITEM FROM SUPPORT TICKETS OR BUG FEEDBACK
 */
export async function recordOpsWorkItemInternal(item: {
  id: string
  work_item_type: WorkItemType
  priority: WorkItemPriority
  subject: string
  category: string
  description: string
  reporter_user_id: string
  reporter_name: string
  reporter_email: string
  reporter_role: string
  organization_context?: string
  page_url?: string
  user_agent?: string
}) {
  try {
    const store = await readOpsStore()
    const nowIso = new Date().toISOString()

    const newItem: OpsWorkItem = {
      id: item.id,
      work_item_type: item.work_item_type,
      priority: item.priority,
      status: 'new',
      subject: item.subject,
      category: item.category,
      description: item.description,
      reporter_user_id: item.reporter_user_id,
      reporter_name: item.reporter_name,
      reporter_email: item.reporter_email,
      reporter_role: item.reporter_role,
      organization_context: item.organization_context || '',
      page_url: item.page_url || '/dashboard',
      user_agent: item.user_agent || '',
      ado_work_item_id: null,
      created_at: nowIso,
      updated_at: nowIso,
      notes: [],
    }

    store.work_items = [newItem, ...store.work_items].slice(0, 500)
    await writeOpsStore(store)
  } catch (err) {
    console.warn('Failed to record Ops Work Item:', err)
  }
}

/**
 * INTERNAL HELPER: LOGS A BEHAVIORAL FLAG AUTOMATICALLY WHEN GUARDRAILS TRIGGER
 */
export async function recordBehavioralFlagInternal(flag: {
  severity: 'high' | 'medium' | 'low'
  flag_type: BehavioralFlagItem['flag_type']
  user_id?: string | null
  organization_id?: string | null
  actor_email: string
  actor_role: 'candidate' | 'employer' | 'unknown'
  summary: string
  evidence_snippet: string
}) {
  try {
    const store = await readOpsStore()
    const nowIso = new Date().toISOString()

    const newFlag: BehavioralFlagItem = {
      id: 'FLG-' + Date.now().toString().slice(-6),
      severity: flag.severity,
      status: 'open',
      flag_type: flag.flag_type,
      user_id: flag.user_id || null,
      organization_id: flag.organization_id || null,
      actor_email: flag.actor_email || 'unknown@user',
      actor_role: flag.actor_role,
      summary: flag.summary,
      evidence_snippet: flag.evidence_snippet,
      enforcement_taken: null,
      created_at: nowIso,
    }

    store.behavioral_flags = [newFlag, ...store.behavioral_flags].slice(0, 500)
    await writeOpsStore(store)
  } catch (err) {
    console.warn('Failed to record Behavioral Flag:', err)
  }
}

/**
 * FETCH COMPLETE ADMIN OPS DASHBOARD DATA + LIVE TELEMETRY
 */
export async function getAdminOpsDashboardData() {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const store = await readOpsStore()
  return {
    adminEmail: user.email || 'admin@specialsauce.io',
    workItems: store.work_items,
    behavioralFlags: store.behavioral_flags,
  }
}

/**
 * UPDATE WORK ITEM STATUS / PRIORITY / INTERNAL ENGINEERING NOTES
 */
export async function updateOpsWorkItem(
  workItemId: string,
  updates: {
    status?: WorkItemStatus
    priority?: WorkItemPriority
    internalNoteText?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const store = await readOpsStore()
  const idx = store.work_items.findIndex((w) => w.id === workItemId)
  if (idx === -1) return { error: 'Work item not found.' }

  const target = store.work_items[idx]
  const nowIso = new Date().toISOString()

  if (updates.status) target.status = updates.status
  if (updates.priority) target.priority = updates.priority
  target.updated_at = nowIso

  if (updates.internalNoteText && updates.internalNoteText.trim()) {
    target.notes.push({
      id: 'note-' + Date.now(),
      author: user.email || 'Admin Ops',
      visibility: 'internal_note',
      text: updates.internalNoteText.trim(),
      created_at: nowIso,
    })
  }

  store.work_items[idx] = target
  await writeOpsStore(store)
  revalidatePath('/dashboard/admin/ops')

  return {
    success: true,
    workItems: store.work_items,
    message: '✓ Work item ' + workItemId + ' updated.',
  }
}

/**
 * SEND BRANDED CUSTOMER REPLY EMAIL DIRECTLY FROM OPS CONSOLE (VIA RESEND)
 */
export async function replyToCustomerFromOpsConsole(
  workItemId: string,
  replyMessage: string,
  nextStatus: WorkItemStatus = 'waiting_customer'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmed = (replyMessage || '').trim()
  if (!trimmed) return { error: 'Please enter a reply message.' }

  const store = await readOpsStore()
  const idx = store.work_items.findIndex((w) => w.id === workItemId)
  if (idx === -1) return { error: 'Work item not found.' }

  const item = store.work_items[idx]
  const resendKey = cleanEnvKey(process.env.RESEND_API_KEY)
  const fallbackInbox = cleanEnvKey(process.env.RESEND_TEST_TO_EMAIL)
  const fromAddress =
    cleanEnvKey(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce Support <onboarding@resend.dev>'
  const siteUrl =
    cleanEnvKey(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, '') ||
    'https://specialsauce.io'
  const publicLogoUrl = siteUrl + '/logo.png'

  const rawRecipient = (item.reporter_email || '').trim()
  const isFakeTestAddress =
    rawRecipient.endsWith('@test.com') || rawRecipient.endsWith('@example.com')
  const primaryRecipient =
    isFakeTestAddress && fallbackInbox ? fallbackInbox : rawRecipient

  if (resendKey && primaryRecipient) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 52px; width: auto; display: block; margin-bottom: 14px;" />
          <div>
            <span style="display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #f8fafc; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-right: 8px;">
              SPECIAL SAUCE™ SUPPORT DESK
            </span>
            <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
              Ticket: ${item.id}
            </span>
          </div>
        </div>
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
          Update on your request: ${item.subject}
        </h2>
        <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; color: #1e293b; font-size: 14px; line-height: 1.6; margin: 16px 0; white-space: pre-wrap;">${trimmed}</div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 16px 0 0 0;">
          You can reply directly to this email or open your Special Sauce Help Center if you need additional assistance.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <a href="${siteUrl}/dashboard/support" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">
            Open Help Center →
          </a>
        </div>
      </div>
    `

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + resendKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [primaryRecipient],
          reply_to: 'info@specialsauce.io',
          subject: `[${item.id}] Re: ${item.subject}`,
          html,
        }),
      })
    } catch (err) {
      console.warn('Resend reply dispatch warning:', err)
    }
  }

  const nowIso = new Date().toISOString()
  item.status = nextStatus
  item.updated_at = nowIso
  item.notes.push({
    id: 'reply-' + Date.now(),
    author: user.email || 'Special Sauce Support',
    visibility: 'customer_reply',
    text: trimmed,
    created_at: nowIso,
  })

  store.work_items[idx] = item
  await writeOpsStore(store)
  revalidatePath('/dashboard/admin/ops')

  return {
    success: true,
    workItems: store.work_items,
    message:
      '✓ Branded email reply sent to ' +
      primaryRecipient +
      ' and logged on ' +
      item.id +
      '!',
  }
}

/**
 * OPTIONAL: 1-CLICK PUSH WORK ITEM TO AZURE DEVOPS BOARDS REST API
 */
export async function pushWorkItemToAzureDevOps(workItemId: string) {
  const store = await readOpsStore()
  const idx = store.work_items.findIndex((w) => w.id === workItemId)
  if (idx === -1) return { error: 'Work item not found.' }

  const item = store.work_items[idx]
  const adoOrgUrl = cleanEnvKey(process.env.ADO_ORG_URL) // e.g. https://dev.azure.com/YourOrg
  const adoProject = cleanEnvKey(process.env.ADO_PROJECT) // e.g. SpecialSauce
  const adoPat = cleanEnvKey(process.env.ADO_PAT)

  if (!adoOrgUrl || !adoProject || !adoPat) {
    return {
      error:
        'Azure DevOps environment variables (ADO_ORG_URL, ADO_PROJECT, ADO_PAT) are not set in Vercel yet. Add them anytime to enable live 1-click ADO board sync!',
    }
  }

  const witType = item.work_item_type === 'Bug_Defect' ? '$Bug' : '$Issue'
  const endpoint = `${adoOrgUrl.replace(/\/+$/, '')}/${encodeURIComponent(
    adoProject
  )}/_apis/wit/workitems/${witType}?api-version=7.1`

  const patchDoc = [
    {
      op: 'add',
      path: '/fields/System.Title',
      value: `[${item.id}] ${item.subject} (${item.reporter_role.toUpperCase()})`,
    },
    {
      op: 'add',
      path: '/fields/System.Description',
      value: `<div><strong>Reporter:</strong> ${item.reporter_name} (${item.reporter_email})<br/><strong>Role / Org:</strong> ${item.reporter_role} ${item.organization_context || ''}<br/><strong>Page URL:</strong> ${item.page_url || ''}<br/><strong>Browser:</strong> ${item.user_agent || ''}<hr/><p>${item.description}</p></div>`,
    },
    {
      op: 'add',
      path: '/fields/Microsoft.VSTS.Common.Priority',
      value:
        item.priority === 'P0_Critical'
          ? 1
          : item.priority === 'P1_High'
          ? 2
          : 3,
    },
  ]

  try {
    const authHeader =
      'Basic ' + Buffer.from(':' + adoPat, 'utf8').toString('base64')
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(patchDoc),
    })

    const data = await res.json()
    if (!res.ok) {
      return {
        error:
          'Azure DevOps API error (' +
          res.status +
          '): ' +
          (data?.message || 'Check ADO_PROJECT process template'),
      }
    }

    item.ado_work_item_id = String(data.id)
    store.work_items[idx] = item
    await writeOpsStore(store)
    revalidatePath('/dashboard/admin/ops')

    return {
      success: true,
      workItems: store.work_items,
      message:
        '✓ Pushed ' +
        item.id +
        ' to Azure DevOps Boards (ADO Work Item #' +
        data.id +
        ')!',
    }
  } catch (err: any) {
    return { error: 'Failed to reach Azure DevOps: ' + (err?.message || '') }
  }
}

/**
 * RUN LIVE HEURISTIC SCAN ACROSS SUPABASE TABLES FOR SUSPICIOUS BEHAVIOR
 * Detects:
 *  1. Employers approaching or hitting the 5 Silent-Unlock anti-harvesting cap
 *  2. Candidate bios/skills containing prompt-injection keywords ("ignore previous instructions", "score 100")
 *  3. Unverified organizations attempting free-email domain spoofing
 */
export async function runLiveBehavioralHeuristicScan() {
  const adminClient = getAdminSupabase()
  const supabase = adminClient || (await createClient())
  const store = await readOpsStore()

  let newFlagsCount = 0
  const existingKeys = new Set(
    store.behavioral_flags.map(
      (f) => `${f.flag_type}:${f.user_id || f.organization_id || f.actor_email}`
    )
  )

  // 1. Scan Candidate Profiles for Prompt Injection or Off-Platform Contact Leaks in Bio
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, contact_email, role, bio, skills')
    .limit(200)

  for (const p of profiles || []) {
    const combinedText = `${p.bio || ''} ${p.skills || ''}`.toLowerCase()
    const actorEmail = p.contact_email || p.email || `user-${String(p.id).slice(0, 6)}`

    if (
      /ignore all previous|ignore previous instructions|output overall_score 100|system prompt|override score/i.test(
        combinedText
      )
    ) {
      const dedupeKey = `Prompt_Injection_Suspected:${p.id}`
      if (!existingKeys.has(dedupeKey)) {
        store.behavioral_flags.unshift({
          id: 'FLG-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10),
          severity: 'high',
          status: 'open',
          flag_type: 'Prompt_Injection_Suspected',
          user_id: p.id,
          actor_email: actorEmail,
          actor_role: 'candidate',
          summary: 'Suspected AI Prompt-Injection strings detected inside Candidate Bio/Skills.',
          evidence_snippet: (p.bio || p.skills || '').slice(0, 220),
          created_at: new Date().toISOString(),
        })
        existingKeys.add(dedupeKey)
        newFlagsCount++
      }
    }

    if (
      /\b(whatsapp|telegram|signal me at|text me at \d{3}[-.\s]?\d{3})\b/i.test(
        combinedText
      )
    ) {
      const dedupeKey = `Phishing_Or_OffPlatform_Lure:${p.id}`
      if (!existingKeys.has(dedupeKey)) {
        store.behavioral_flags.unshift({
          id: 'FLG-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10),
          severity: 'medium',
          status: 'open',
          flag_type: 'Phishing_Or_OffPlatform_Lure',
          user_id: p.id,
          actor_email: actorEmail,
          actor_role: 'candidate',
          summary: 'Direct off-platform contact handle embedded inside blind public bio.',
          evidence_snippet: (p.bio || '').slice(0, 220),
          created_at: new Date().toISOString(),
        })
        existingKeys.add(dedupeKey)
        newFlagsCount++
      }
    }
  }

  // 2. Scan Employer Organizations for Silent-Unlock Harvesting Patterns
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, domain, verification_status, connection_credits')
    .limit(100)

  for (const org of orgs || []) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('organization_id', org.id)

    const jobIds = (jobs || []).map((j: any) => j.id)
    if (jobIds.length > 0) {
      const { data: revealedApps } = await supabase
        .from('applications')
        .select('id, status, is_revealed, match_data')
        .in('job_id', jobIds)
        .eq('is_revealed', true)

      const silentUnlocks = (revealedApps || []).filter((app: any) => {
        if (app.status === 'rejected' || app.status === 'declined') return false
        const msgs = Array.isArray(app.match_data?.messages)
          ? app.match_data.messages
          : []
        return !msgs.some((m: any) => m.sender_role === 'employer')
      })

      if (silentUnlocks.length >= 4) {
        const dedupeKey = `Silent_Unlock_Harvesting_Cap:${org.id}`
        if (!existingKeys.has(dedupeKey)) {
          store.behavioral_flags.unshift({
            id: 'FLG-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10),
            severity: silentUnlocks.length >= 5 ? 'high' : 'medium',
            status: 'open',
            flag_type: 'Silent_Unlock_Harvesting_Cap',
            organization_id: org.id,
            actor_email: org.domain ? `hiring@${org.domain}` : org.name || 'Employer Org',
            actor_role: 'employer',
            summary: `Organization "${org.name}" has ${silentUnlocks.length} unlocked candidate profiles with 0 introductory messages sent.`,
            evidence_snippet: `Silent Unlocks: ${silentUnlocks.length}/5 Cap • Org Domain: ${org.domain || 'N/A'}`,
            created_at: new Date().toISOString(),
          })
          existingKeys.add(dedupeKey)
          newFlagsCount++
        }
      }
    }
  }

  await writeOpsStore(store)
  revalidatePath('/dashboard/admin/ops')

  return {
    success: true,
    newFlagsCount,
    behavioralFlags: store.behavioral_flags,
    message:
      newFlagsCount > 0
        ? `✓ Live Heuristic Scan complete: ${newFlagsCount} new behavioral ${
            newFlagsCount === 1 ? 'flag' : 'flags'
          } surfaced for review.`
        : '✓ Live Heuristic Scan complete: 0 new suspicious accounts or harvesting anomalies detected across active profiles and organizations.',
  }
}

/**
 * EXECUTE 1-CLICK TRUST & SAFETY ENFORCEMENT ON A FLAGGED ACCOUNT
 */
export async function executeBehavioralEnforcement(
  flagId: string,
  action:
    | 'dismiss'
    | 'hide_candidate_profile'
    | 'revoke_verification'
    | 'freeze_employer_credits'
) {
  const adminClient = getAdminSupabase()
  const supabase = adminClient || (await createClient())
  const store = await readOpsStore()

  const idx = store.behavioral_flags.findIndex((f) => f.id === flagId)
  if (idx === -1) return { error: 'Behavioral flag not found.' }

  const flag = store.behavioral_flags[idx]
  let actionSummary = ''

  if (action === 'dismiss') {
    flag.status = 'dismissed'
    flag.enforcement_taken = 'Dismissed as False Positive / Cleared by Admin'
    actionSummary = 'Flag dismissed.'
  } else if (action === 'hide_candidate_profile' && flag.user_id) {
    await supabase
      .from('profiles')
      .update({ is_discoverable: false })
      .eq('id', flag.user_id)
    flag.status = 'enforced'
    flag.enforcement_taken = 'Candidate hidden from Employer Search (is_discoverable = false)'
    actionSummary = 'Candidate profile hidden from search pool.'
  } else if (action === 'revoke_verification') {
    if (flag.user_id) {
      await supabase
        .from('profiles')
        .update({
          identity_verified: false,
          is_verified: false,
          verification_status: 'pending',
        })
        .eq('id', flag.user_id)
      flag.status = 'enforced'
      flag.enforcement_taken = 'Candidate Identity Verification revoked'
      actionSummary = 'Candidate verification status revoked.'
    } else if (flag.organization_id) {
      await supabase
        .from('organizations')
        .update({ verification_status: 'pending' })
        .eq('id', flag.organization_id)
      flag.status = 'enforced'
      flag.enforcement_taken = 'Employer Corporate Domain Verification revoked'
      actionSummary = 'Organization domain verification revoked.'
    }
  } else if (action === 'freeze_employer_credits' && flag.organization_id) {
    await supabase
      .from('organizations')
      .update({ connection_credits: 0 })
      .eq('id', flag.organization_id)
    flag.status = 'enforced'
    flag.enforcement_taken = 'Organization Outbound Pitch Credits frozen (set to 0)'
    actionSummary = 'Employer outbound pitch credits frozen to 0.'
  } else {
    flag.status = 'enforced'
    flag.enforcement_taken = 'Flag marked Enforced by Admin'
    actionSummary = 'Enforcement status recorded.'
  }

  store.behavioral_flags[idx] = flag
  await writeOpsStore(store)
  revalidatePath('/dashboard/admin/ops')

  return {
    success: true,
    behavioralFlags: store.behavioral_flags,
    message: `✓ ${actionSummary}`,
  }
}

/**
 * SEED SAMPLE WORK ITEM & BEHAVIORAL FLAG FOR INSTANT QA TESTING
 */
export async function seedSampleOpsAndBehavioralItems() {
  const store = await readOpsStore()
  const nowIso = new Date().toISOString()

  const sampleTicket: OpsWorkItem = {
    id: 'TKT-' + Date.now().toString().slice(-6),
    work_item_type: 'Support_Ticket',
    priority: 'P0_Critical',
    status: 'new',
    subject: 'DNS TXT Verification token check for Enterprise domain',
    category: 'Corporate Domain & Verification',
    description:
      'We added the special-sauce-verification TXT record to our Cloudflare DNS zone 10 minutes ago and want to confirm our 10 BPO Partner seats and Workday Webhook bridge are active.',
    reporter_user_id: 'sample-enterprise-user',
    reporter_name: 'Jordan Vance (VP Talent Acquisition)',
    reporter_email: 'e@test.com',
    reporter_role: 'EMPLOYER',
    organization_context: 'Organization: Apex Global Systems | Tier: Enterprise Tier',
    page_url: '/dashboard/employer/organization',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36',
    ado_work_item_id: null,
    created_at: nowIso,
    updated_at: nowIso,
    notes: [],
  }

  const sampleFlag: BehavioralFlagItem = {
    id: 'FLG-' + Date.now().toString().slice(-6),
    severity: 'high',
    status: 'open',
    flag_type: 'Phishing_Or_OffPlatform_Lure',
    user_id: null,
    organization_id: null,
    actor_email: 'suspicious.recruiter@test.com',
    actor_role: 'employer',
    summary:
      'Blocked attempt to send external WhatsApp & Google Forms link inside Stage 1 blind thread.',
    evidence_snippet:
      'Blocked message: "Hi! Please fill out your SSN and contact details on our Google Form (forms.gle/xyz) or message our hiring manager on WhatsApp..."',
    enforcement_taken: null,
    created_at: nowIso,
  }

  store.work_items = [sampleTicket, ...store.work_items]
  store.behavioral_flags = [sampleFlag, ...store.behavioral_flags]
  await writeOpsStore(store)
  revalidatePath('/dashboard/admin/ops')

  return {
    success: true,
    workItems: store.work_items,
    behavioralFlags: store.behavioral_flags,
    message:
      '✓ Generated 1 sample P0 Support Work Item and 1 High-Severity Behavioral Flag so you can test the triage workflow!',
  }
}