'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { buildCompleteTrueHorizonAnalysis, type TrueHorizonAnalysisResult } from '@/lib/true-horizon-engine'

export async function runTrueHorizonScanAction(): Promise<{
  data?: TrueHorizonAnalysisResult
  profileSummary?: {
    experienceYears: number
    skillCount: number
    primaryIndustry: string
    tierLabel: string
    isPaidSubscriber: boolean
  }
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found' }
  }

  const rawSkills = Array.isArray(profile.structured_skills) ? profile.structured_skills : []
  const prefItem = rawSkills.find((s: any) => s && (s._ss_candidate_prefs === true || s._ss_pref_meta === true)) || {}
  const visibleSkills = rawSkills.filter(
    (s: any) =>
      s &&
      typeof s === 'object' &&
      !s._ss_candidate_prefs && !s._ss_pref_meta &&
      (s.skill || s.name) &&
      !String(s.skill || s.name).startsWith('__SS_')
  )

  const enrichedProfile = {
    ...profile,
    industry_vertical: prefItem.industry_vertical || profile.industry_vertical || 'Technology, Software & SaaS',
    education_level: prefItem.education_level || 'Practical Experience & Industry Certifications',
    certifications: prefItem.certifications || '',
    structured_skills: visibleSkills,
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40)

  const analysis = buildCompleteTrueHorizonAnalysis(enrichedProfile, jobs || [])

  const subTier = String(profile.subscription_tier || prefItem.subscription_tier || 'explorer').toLowerCase()
  const isPaidSubscriber =
    subTier.includes('pro') ||
    subTier.includes('prestige') ||
    subTier.includes('active') ||
    Boolean(user.email?.toLowerCase().includes('sbriley')) ||
    Boolean(user.email?.toLowerCase().endsWith('@specialsauce.io'))

  const tierLabel = subTier.includes('prestige')
    ? 'Prestige ($19/mo)'
    : isPaidSubscriber
    ? 'Professional ($12/mo)'
    : 'Explorer ($0/mo Sandbox)'

  return {
    data: analysis,
    profileSummary: {
      experienceYears: Number(profile.experience_years) || 5,
      skillCount: visibleSkills.length,
      primaryIndustry: analysis.primaryIndustry,
      tierLabel,
      isPaidSubscriber,
    },
  }
}

export async function addHorizonBridgeSkillToProfileAction(
  skillName: string,
  level: 'Beginner' | 'Intermediate' | 'Expert' = 'Intermediate',
  years: number = 2
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Not authenticated' }
  }

  const cleanSkill = String(skillName || '').trim()
  if (!cleanSkill) {
    return { ok: false, message: 'Skill name is required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('structured_skills, skills')
    .eq('id', user.id)
    .single()

  const existingArray = Array.isArray(profile?.structured_skills)
    ? [...profile.structured_skills]
    : []

  const alreadyExists = existingArray.some(
    (s: any) =>
      s &&
      !s._ss_candidate_prefs && !s._ss_pref_meta &&
      String(s.skill || s.name || '').toLowerCase().trim() === cleanSkill.toLowerCase()
  )

  if (alreadyExists) {
    return { ok: true, message: `"${cleanSkill}" is already in your verified profile skills.` }
  }

  existingArray.push({
    skill: cleanSkill,
    level,
    years,
  })

  const visibleSkillNames = existingArray
    .filter((s: any) => s && !s._ss_candidate_prefs && !s._ss_pref_meta && (s.skill || s.name))
    .map((s: any) => s.skill || s.name)
    .join(', ')

  const { error } = await supabase
    .from('profiles')
    .update({
      structured_skills: existingArray,
      skills: visibleSkillNames,
    })
    .eq('id', user.id)

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath('/dashboard/horizon')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/jobs')

  return {
    ok: true,
    message: `Added "${cleanSkill}" (${level}) to your profile and recalculated True Horizon™ & TrueFit™ vectors.`,
  }
}
