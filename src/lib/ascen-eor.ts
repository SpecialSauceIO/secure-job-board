import crypto from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type EorPlacementStatus =
  | 'pending_sync'
  | 'onboarding_invited'
  | 'i9_pending'
  | 'w4_pending'
  | 'active_w2'
  | 'converted_direct'
  | 'ended'
  | 'sync_failed'

/**
 * TODO(ascen-openapi): Replace stubbed header/field names once Ascen
 * delivers their OpenAPI JSON and Postman collection.
 */
export const ASCEN_SPEC_STUBS = {
  signatureHeaderCandidates: [
    'x-ascen-signature',
    'x-ascen-signature-256',
    'x-webhook-signature',
  ],
  eventIdFields: ['id', 'event_id', 'eventId'],
  eventTypeFields: ['type', 'event_type', 'eventType'],
  placementIdFields: ['placement_id', 'placementId', 'assignment_id'],
  packetIdFields: ['external_id', 'externalId', 'packet_id', 'reference_id'],
} as const

export interface NormalizedAscenWebhookEvent {
  externalEventId: string
  eventType: string
  ascenPlacementId: string | null
  ascenWorkerId: string | null
  packetId: string | null
  onboardingUrl: string | null
  mappedStatus: EorPlacementStatus | null
  rawPayload: Record<string, unknown>
}

function cleanEnv(val?: string | null): string {
  if (!val) return ''
  return val.trim().replace(/^["']+|["']+$/g, '').trim()
}

export function getAscenServiceClient(): SupabaseClient | null {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function verifyAscenWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  const secret = cleanEnv(webhookSecret)
  const sig = cleanEnv(signatureHeader)
  if (!secret || !sig) return false

  const normalizedSig = sig.replace(/^sha256=/i, '').trim()
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  const sigBuf = Buffer.from(normalizedSig, 'utf8')
  const expBuf = Buffer.from(expectedHex, 'utf8')
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

function pickFirstString(
  obj: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string | null {
  if (!obj) return null
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
    if (typeof val === 'number' && Number.isFinite(val)) {
      return String(val)
    }
  }
  return null
}

/**
 * TODO(ascen-openapi): Align event type strings with Ascen's official webhook catalog.
 */
export function mapAscenEventToEorStatus(eventType: string): EorPlacementStatus | null {
  const norm = eventType.trim().toLowerCase()
  if (!norm) return null
  if (norm.includes('onboarding') && norm.includes('invited')) return 'onboarding_invited'
  if (norm.includes('i9')) return 'i9_pending'
  if (norm.includes('w4')) return 'w4_pending'
  if (norm.includes('active') || norm.includes('onboarding.completed')) return 'active_w2'
  if (norm.includes('converted')) return 'converted_direct'
  if (norm.includes('terminated') || norm.includes('ended')) return 'ended'
  if (norm.includes('failed') || norm.includes('rejected')) return 'sync_failed'
  return null
}

export function parseAscenWebhookPayload(
  payload: Record<string, unknown>
): NormalizedAscenWebhookEvent {
  const dataObj =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : payload
  const metaObj =
    dataObj.metadata && typeof dataObj.metadata === 'object'
      ? (dataObj.metadata as Record<string, unknown>)
      : null

  const eventType =
    pickFirstString(payload, ASCEN_SPEC_STUBS.eventTypeFields) || 'unknown'
  const fallbackHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 32)
  const externalEventId =
    pickFirstString(payload, ASCEN_SPEC_STUBS.eventIdFields) ||
    `ascen_sha_${fallbackHash}`

  const ascenPlacementId =
    pickFirstString(dataObj, ASCEN_SPEC_STUBS.placementIdFields) ||
    pickFirstString(payload, ASCEN_SPEC_STUBS.placementIdFields)
  const ascenWorkerId =
    pickFirstString(dataObj, ['worker_id', 'workerId', 'employee_id']) || null
  const packetId =
    pickFirstString(metaObj, ASCEN_SPEC_STUBS.packetIdFields) ||
    pickFirstString(dataObj, ASCEN_SPEC_STUBS.packetIdFields) ||
    pickFirstString(payload, ASCEN_SPEC_STUBS.packetIdFields)
  const onboardingUrl =
    pickFirstString(dataObj, ['onboarding_url', 'onboardingUrl']) || null

  return {
    externalEventId,
    eventType,
    ascenPlacementId,
    ascenWorkerId,
    packetId,
    onboardingUrl,
    mappedStatus: mapAscenEventToEorStatus(eventType),
    rawPayload: payload,
  }
}

export async function applyAscenWebhookStatusUpdate(
  supabase: SupabaseClient,
  evt: NormalizedAscenWebhookEvent
): Promise<{ updated: boolean; reason?: string }> {
  if (!evt.mappedStatus) {
    return { updated: false, reason: 'unmapped_event_type' }
  }
  if (!evt.packetId && !evt.ascenPlacementId) {
    return { updated: false, reason: 'missing_placement_identifier' }
  }

  const nowIso = new Date().toISOString()
  const patch: Record<string, unknown> = {
    eor_status: evt.mappedStatus,
    last_webhook_event_id: evt.externalEventId,
    last_synced_at: nowIso,
    updated_at: nowIso,
  }
  if (evt.ascenPlacementId) patch.ascen_placement_id = evt.ascenPlacementId
  if (evt.ascenWorkerId) patch.ascen_worker_id = evt.ascenWorkerId
  if (evt.onboardingUrl) patch.ascen_onboarding_url = evt.onboardingUrl

  let query = supabase.from('eor_placements').update(patch)
  if (evt.packetId) {
    query = query.eq('packet_id', evt.packetId)
  } else if (evt.ascenPlacementId) {
    query = query.eq('ascen_placement_id', evt.ascenPlacementId)
  }

  const { data, error } = await query.select('id')
  if (error) {
    throw new Error(`eor_placements update failed: ${error.message}`)
  }
  return { updated: Array.isArray(data) && data.length > 0 }
}
