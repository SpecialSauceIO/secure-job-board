'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveEmployerTierInfo } from '@/app/dashboard/actions'
import {
  OrganizationEorConfig,
  EorContractTrack,
  EOR_EQUIPMENT_POLICY_OPTIONS,
  DEFAULT_ORG_EOR_CONFIG,
  parseEorConfigFromDescription,
  hasExplicitEorConfigTag,
  embedEorConfigInDescription,
} from '@/lib/eor-config'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_TRACKS = new Set<string>([
  'none',
  'trial_to_hire_90d',
  'fixed_term_w2',
  'open_ended_w2',
])

export async function getOrganizationEorSettings() {
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
  const parsedCfg = parseEorConfigFromDescription(org.description)
  const config: OrganizationEorConfig = {
    ...parsedCfg,
    legalEntityName: parsedCfg.legalEntityName || String(org.name || '').trim(),
  }

  return {
    organizationId: org.id,
    organizationName: org.name || org.domain || 'Verified Organization',
    tier: tierInfo.tier,
    tierLabel: tierInfo.label,
    hasSavedDefaults: hasExplicitEorConfigTag(org.description),
    config,
  }
}

export async function saveOrganizationEorSettings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.organization_id) {
    return { error: 'Save your company profile first before configuring W-2 & EOR defaults.' }
  }
  if (member.role === 'bpo_partner') {
    return { error: 'Forbidden: External recruiting partner seats cannot modify organization legal or payroll settings.' }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single()

  if (!org) return { error: 'Organization not found.' }

  const rawTrack = String(formData.get('defaultContractTrack') || 'none').trim()
  const defaultContractTrack: EorContractTrack = ALLOWED_TRACKS.has(rawTrack)
    ? (rawTrack as EorContractTrack)
    : 'none'

  const defaultDurationMonths = Math.min(
    24,
    Math.max(1, Number(formData.get('defaultDurationMonths')) || 6)
  )
  const defaultBgCheck = String(formData.get('defaultBgCheck')) === 'true'
  const defaultDrugCheck = String(formData.get('defaultDrugCheck')) === 'true'

  const rawEq = String(
    formData.get('defaultEquipmentPolicy') ||
      DEFAULT_ORG_EOR_CONFIG.defaultEquipmentPolicy
  ).trim()
  const defaultEquipmentPolicy = EOR_EQUIPMENT_POLICY_OPTIONS.includes(rawEq)
    ? rawEq
    : DEFAULT_ORG_EOR_CONFIG.defaultEquipmentPolicy

  const defaultEquipmentNotes = String(formData.get('defaultEquipmentNotes') || '')
    .trim()
    .slice(0, 240)
  const timecardApproverName = String(formData.get('timecardApproverName') || '')
    .trim()
    .slice(0, 120)
  const timecardApproverEmail = String(formData.get('timecardApproverEmail') || '')
    .trim()
    .toLowerCase()
    .slice(0, 160)
  const billingApEmail = String(formData.get('billingApEmail') || '')
    .trim()
    .toLowerCase()
    .slice(0, 160)

  if (timecardApproverEmail && !EMAIL_PATTERN.test(timecardApproverEmail)) {
    return { error: 'Enter a valid Timecard Approver email address or leave it blank.' }
  }
  if (billingApEmail && !EMAIL_PATTERN.test(billingApEmail)) {
    return { error: 'Enter a valid Billing / Accounts Payable email address or leave it blank.' }
  }

  const legalEntityName = String(formData.get('legalEntityName') || '').trim().slice(0, 128)
  const defaultSupervisorName = String(formData.get('defaultSupervisorName') || '').trim().slice(0, 120)
  const defaultPoNumber = String(formData.get('defaultPoNumber') || '').trim().slice(0, 64)
  const billingStreet1 = String(formData.get('billingStreet1') || '').trim().slice(0, 120)
  const billingCity = String(formData.get('billingCity') || '').trim().slice(0, 80)
  const billingState = String(formData.get('billingState') || '').trim().toUpperCase().slice(0, 2)
  const billingZip = String(formData.get('billingZip') || '').trim().slice(0, 16)
  const defaultWcCode = String(formData.get('defaultWcCode') || '8810').trim().slice(0, 10) || '8810'
  const diffWorksite = String(formData.get('diffWorksite')) === 'true'
  const worksiteStreet1 = String(formData.get('worksiteStreet1') || '').trim().slice(0, 120)
  const worksiteCity = String(formData.get('worksiteCity') || '').trim().slice(0, 80)
  const worksiteState = String(formData.get('worksiteState') || '').trim().toUpperCase().slice(0, 2)
  const worksiteZip = String(formData.get('worksiteZip') || '').trim().slice(0, 16)

  const nextConfig: OrganizationEorConfig = {
    defaultContractTrack,
    defaultDurationMonths,
    defaultBgCheck,
    defaultDrugCheck,
    defaultEquipmentPolicy,
    defaultEquipmentNotes,
    legalEntityName,
    timecardApproverName,
    timecardApproverEmail,
    billingApEmail,
    defaultSupervisorName,
    defaultPoNumber,
    billingStreet1,
    billingCity,
    billingState,
    billingZip,
    defaultWcCode,
    diffWorksite,
    worksiteStreet1,
    worksiteCity,
    worksiteState,
    worksiteZip,
  }

  const updatedDescription = embedEorConfigInDescription(org.description, nextConfig)

  const { error: updateErr } = await supabase
    .from('organizations')
    .update({ description: updatedDescription })
    .eq('id', org.id)

  if (updateErr) {
    return { error: updateErr.message }
  }

  revalidatePath('/dashboard/employer/organization')
  revalidatePath('/dashboard/employer/jobs/new')
  revalidatePath('/dashboard/employer/jobs')
  revalidatePath('/dashboard/employer/requests')

  return { success: true, config: nextConfig }
}
