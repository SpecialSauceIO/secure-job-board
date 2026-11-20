const CANONICAL_PROD_ORIGIN = 'https://www.specialsauce.io'

function normalizeOriginInput(raw?: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim().replace(/^["']+|["']+$/g, '').trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export function resolveTrustedOriginCandidate(rawCandidate?: string | null): string {
  const configuredOrigins = new Set<string>([
    CANONICAL_PROD_ORIGIN,
    'https://specialsauce.io',
  ])

  for (const envVal of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]) {
    const norm = normalizeOriginInput(envVal)
    if (norm) configuredOrigins.add(norm)
  }

  const reqOrigin = normalizeOriginInput(rawCandidate)
  if (reqOrigin) {
    if (configuredOrigins.has(reqOrigin)) return reqOrigin
    try {
      const parsed = new URL(reqOrigin)
      if (
        process.env.NODE_ENV !== 'production' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      ) {
        return parsed.origin
      }
    } catch {}
  }

  return CANONICAL_PROD_ORIGIN
}

export function resolveTrustedAppOrigin(req: Request): string {
  return resolveTrustedOriginCandidate(req.headers.get('origin') || req.url)
}

export function sanitizeInternalReturnPath(rawPath?: unknown): string | null {
  if (typeof rawPath !== 'string') return null
  const trimmed = rawPath.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null
  }
  try {
    const testUrl = new URL(trimmed, CANONICAL_PROD_ORIGIN)
    if (testUrl.origin !== CANONICAL_PROD_ORIGIN) return null
    return `${testUrl.pathname}${testUrl.search}${testUrl.hash}`
  } catch {
    return null
  }
}
