'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserBookmarks(): Promise<{
  savedJobIds: string[]
  savedCandidateIds: string[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { savedJobIds: [], savedCandidateIds: [] }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('structured_skills')
    .eq('id', user.id)
    .single()

  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []

  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )

  return {
    savedJobIds: Array.isArray(metaEntry?.saved_job_ids)
      ? metaEntry.saved_job_ids.map(String)
      : [],
    savedCandidateIds: Array.isArray(metaEntry?.saved_candidate_ids)
      ? metaEntry.saved_candidate_ids.map(String)
      : [],
  }
}

export async function toggleBookmarkItem(
  itemId: string,
  type: 'job' | 'candidate'
): Promise<{ savedIds: string[]; isSaved: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { savedIds: [], isSaved: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('structured_skills')
    .eq('id', user.id)
    .single()

  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []

  const existingMeta =
    rawSkills.find((item: any) => item && item._ss_pref_meta === true) || {
      _ss_pref_meta: true,
    }

  const key = type === 'job' ? 'saved_job_ids' : 'saved_candidate_ids'
  const currentList: string[] = Array.isArray(existingMeta[key])
    ? existingMeta[key].map(String)
    : []

  const normalizedId = String(itemId)
  const exists = currentList.includes(normalizedId)

  const updatedList = exists
    ? currentList.filter((id) => id !== normalizedId)
    : [...currentList, normalizedId]

  const updatedMeta = {
    ...existingMeta,
    _ss_pref_meta: true,
    [key]: updatedList,
  }

  const otherItems = rawSkills.filter(
    (item: any) => !(item && item._ss_pref_meta === true)
  )

  const updatedSkills = [...otherItems, updatedMeta]

  const { error } = await supabase
    .from('profiles')
    .update({ structured_skills: updatedSkills })
    .eq('id', user.id)

  if (error) {
    return { savedIds: currentList, isSaved: exists, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/employer/search')

  return { savedIds: updatedList, isSaved: !exists }
}