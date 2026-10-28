'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  getActiveSystemStatusBanner,
  setManualSystemStatusBanner,
  SystemStatusBanner,
} from '@/lib/ops-bridge'

function isFounderEmail(email?: string | null): boolean {
  if (!email) return false
  const lower = email.toLowerCase().trim()
  return lower.endsWith('@specialsauce.io') && !lower.includes('.demo@')
}

export async function fetchCurrentStatusBannerAction(
  role?: 'candidate' | 'employer' | null
): Promise<SystemStatusBanner | null> {
  return await getActiveSystemStatusBanner(role)
}

export async function updateSystemStatusBannerAction(payload: {
  active: boolean
  severity?: 'info' | 'degraded' | 'outage'
  title?: string
  message?: string
  platform_area?: string
  target_role?: 'all' | 'candidate' | 'employer'
  suppress_watchdog?: boolean
}): Promise<{ ok: boolean; banner: SystemStatusBanner | null; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isFounderEmail(user.email)) {
    return {
      ok: false,
      banner: null,
      error: 'Forbidden: Only Founder Admin (@specialsauce.io) can manage the global status banner.',
    }
  }

  const res = await setManualSystemStatusBanner(payload)
  revalidatePath('/dashboard', 'layout')
  return res
}
