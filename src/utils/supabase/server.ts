import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export const SESSION_POLICY_COOKIE = "ss_session_policy"
export const TWELVE_HOURS_SECONDS = 12 * 60 * 60
export const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

export async function createClient() {
  const cookieStore = await cookies()

  const rawPolicy = cookieStore.get(SESSION_POLICY_COOKIE)?.value
  let isExpiredSession = false
  let policyMaxAgeSeconds = TWELVE_HOURS_SECONDS

  if (rawPolicy) {
    try {
      const parsed = JSON.parse(rawPolicy) as { remember?: boolean; exp?: number }
      if (parsed.exp && Date.now() > parsed.exp) {
        isExpiredSession = true
      } else if (parsed.remember) {
        policyMaxAgeSeconds = THIRTY_DAYS_SECONDS
      } else if (parsed.exp) {
        policyMaxAgeSeconds = Math.max(60, Math.floor((parsed.exp - Date.now()) / 1000))
      }
    } catch {
      // Fallback to 12-hour window if malformed
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (isExpiredSession && name.startsWith("sb-")) {
            return undefined
          }
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const boundedOptions: CookieOptions =
              name.startsWith("sb-") && value
                ? { ...options, maxAge: policyMaxAgeSeconds }
                : options
            cookieStore.set({ name, value, ...boundedOptions })
          } catch (error) {
            // The `set` method was called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  )
}
