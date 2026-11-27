import { redirect } from 'next/navigation'

export default async function LegacyProfessionalSignupRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = await searchParams
  const qs = new URLSearchParams()
  for (const [key, val] of Object.entries(resolved || {})) {
    if (typeof val === 'string' && val) {
      qs.set(key, val)
    } else if (Array.isArray(val) && val[0]) {
      qs.set(key, val[0])
    }
  }
  const suffix = qs.toString()
  redirect(suffix ? `/signup/professional?${suffix}` : '/signup/professional')
}
