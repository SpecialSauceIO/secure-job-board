import { NextResponse } from 'next/server'
import {
  ASCEN_SPEC_STUBS,
  applyAscenWebhookStatusUpdate,
  getAscenServiceClient,
  parseAscenWebhookPayload,
  verifyAscenWebhookSignature,
} from '@/lib/ascen-eor'
import { pushToOpsControlPlane } from '@/lib/ops-bridge'

const MAX_WEBHOOK_BYTES = 256 * 1024

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function POST(req: Request) {
  const rawWebhookSecret = process.env.ASCEN_WEBHOOK_SECRET
  const webhookSecret = typeof rawWebhookSecret === 'string' ? rawWebhookSecret.trim() : ''
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Ascen webhook endpoint not yet configured' },
      { status: 503 }
    )
  }

  const rawBody = await req.text()
  if (!rawBody || Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
    return NextResponse.json(
      { error: 'Invalid webhook payload size' },
      { status: 400 }
    )
  }

  let sigHeader: string | null = null
  for (const headerName of ASCEN_SPEC_STUBS.signatureHeaderCandidates) {
    const candidateVal = req.headers.get(headerName)
    if (candidateVal) {
      sigHeader = candidateVal
      break
    }
  }

  if (!verifyAscenWebhookSignature(rawBody, sigHeader, webhookSecret)) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }

  let parsedJson: Record<string, unknown>
  try {
    const raw = JSON.parse(rawBody)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return NextResponse.json({ error: 'Invalid JSON object' }, { status: 400 })
    }
    parsedJson = raw as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 })
  }

  const supabase = getAscenServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service database unavailable' },
      { status: 503 }
    )
  }

  const evt = parseAscenWebhookPayload(parsedJson)

  const { error: insertErr } = await supabase
    .from('eor_webhook_events')
    .insert({
      provider: 'ascen',
      external_event_id: evt.externalEventId,
      event_type: evt.eventType,
      signature_verified: true,
      processing_status: 'received',
      placement_packet_id: evt.packetId,
      ascen_placement_id: evt.ascenPlacementId,
      payload: evt.rawPayload,
    })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({
        received: true,
        duplicate: true,
        eventId: evt.externalEventId,
      })
    }
    return NextResponse.json(
      { error: 'Failed to record webhook event' },
      { status: 500 }
    )
  }

  try {
    const result = await applyAscenWebhookStatusUpdate(supabase, evt)
    const finalStatus = result.updated ? 'processed' : 'ignored'

    await supabase
      .from('eor_webhook_events')
      .update({
        processing_status: finalStatus,
        processed_at: new Date().toISOString(),
      })
      .eq('external_event_id', evt.externalEventId)

    if (evt.mappedStatus === 'sync_failed') {
      await pushToOpsControlPlane({
        event_type: 'work_item',
        id: `TKT-${Date.now().toString().slice(-6)}`,
        work_item_type: 'EOR_Placement_Order',
        priority: 'high',
        owned_by: 'Special Sauce Support',
        reporter_name: 'Ascen Webhook',
        reporter_email: 'support@specialsauce.io',
        subject: `Ascen EOR Sync Attention Needed (${evt.packetId || evt.ascenPlacementId || evt.externalEventId})`,
        category: 'W-2 Payroll',
        platform_area: 'EOR Integration',
        description: `Inbound Ascen webhook ${evt.eventType} flagged sync_failed for event ${evt.externalEventId}.`,
      }).catch((err) => {
        console.error('Ascen Ops escalation failed:', err)
      })
    }

    return NextResponse.json({
      received: true,
      eventId: evt.externalEventId,
      status: finalStatus,
      mappedStatus: evt.mappedStatus,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown processing error'
    await supabase
      .from('eor_webhook_events')
      .update({
        processing_status: 'failed',
        error_message: message.slice(0, 500),
        processed_at: new Date().toISOString(),
      })
      .eq('external_event_id', evt.externalEventId)

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
