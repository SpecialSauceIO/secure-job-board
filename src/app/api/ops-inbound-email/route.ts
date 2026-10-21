import { NextRequest, NextResponse } from 'next/server'
import { getOpsServiceClient } from '@/lib/ops-bridge'

const OPS_BUCKET = 'resumes'
const OPS_VAULT_DIR = '_isolated_ops_control_plane'
const OPS_VAULT_PREFIX = 'ops_vault_v2_'
const OPS_VAULT_PATH = '_isolated_ops_control_plane/ops_vault_v2.json'

function extractTicketId(text?: string | null): string | null {
  if (!text) return null
  const match = String(text).match(/\b(TKT-\d{4,10}|FB-\d{4,10})\b/i)
  return match ? match[1].toUpperCase() : null
}

function stripQuotedHistory(rawText: string): string {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n')
  const cleaned: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^On .+ wrote:$/i.test(trimmed)) break
    if (/^From:\s+/i.test(trimmed) && cleaned.length > 0) break
    if (/^-{3,}\s*Original Message\s*-{3,}/i.test(trimmed)) break
    if (trimmed.startsWith('>')) continue
    cleaned.push(line)
  }
  return cleaned.join('\n').trim() || String(rawText || '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const client = getOpsServiceClient()
    if (!client) {
      return NextResponse.json({ error: 'Ops storage client unavailable' }, { status: 500 })
    }

    const emailData = payload?.data || payload
    const rawFrom = String(
      emailData?.from?.email ||
        emailData?.from ||
        emailData?.sender ||
        emailData?.reporter_email ||
        ''
    ).trim()
    const senderEmailMatch = rawFrom.match(/<([^>]+)>/)
    const senderEmail = (senderEmailMatch ? senderEmailMatch[1] : rawFrom).toLowerCase().trim()

    const subject = String(emailData?.subject || '')
    const rawBody = String(
      emailData?.text ||
        emailData?.reply_text ||
        emailData?.body ||
        emailData?.html?.replace(/<[^>]+>/g, ' ') ||
        ''
    ).trim()

    const cleanReply = stripQuotedHistory(rawBody)
    if (!cleanReply) {
      return NextResponse.json({ ok: false, reason: 'Empty reply body' }, { status: 400 })
    }

    // Load latest vault from shared Supabase Storage
    const { data: fileList } = await client.storage
      .from(OPS_BUCKET)
      .list(OPS_VAULT_DIR, { limit: 25, sortBy: { column: 'name', order: 'desc' } })

    const versionedFiles = (fileList || [])
      .filter((f) => f.name.startsWith(OPS_VAULT_PREFIX) && f.name.endsWith('.json'))
      .sort((a, b) => b.name.localeCompare(a.name))

    const latestPath =
      versionedFiles.length > 0
        ? `${OPS_VAULT_DIR}/${versionedFiles[0].name}`
        : OPS_VAULT_PATH

    const [latestRes, baseRes] = await Promise.all([
      client.storage.from(OPS_BUCKET).download(latestPath),
      latestPath !== OPS_VAULT_PATH
        ? client.storage.from(OPS_BUCKET).download(OPS_VAULT_PATH)
        : Promise.resolve({ data: null, error: null }),
    ])

    const itemMap = new Map<string, any>()
    const flagMap = new Map<string, any>()

    for (const res of [baseRes, latestRes]) {
      if (res?.data && !res.error) {
        try {
          const parsed = JSON.parse(await res.data.text())
          if (Array.isArray(parsed.work_items)) {
            for (const item of parsed.work_items) {
              if (!item?.id) continue
              const existing = itemMap.get(item.id)
              const itemTs = new Date(item.updated_at || item.created_at || 0).getTime()
              const existTs = existing ? new Date(existing.updated_at || existing.created_at || 0).getTime() : -1
              const itemLen = Array.isArray(item.thread) ? item.thread.length : 0
              const existLen = existing && Array.isArray(existing.thread) ? existing.thread.length : 0
              if (!existing || itemTs > existTs || itemLen > existLen) {
                itemMap.set(item.id, item)
              }
            }
          }
          if (Array.isArray(parsed.behavioral_flags)) {
            for (const flag of parsed.behavioral_flags) {
              if (flag?.id) flagMap.set(flag.id, flag)
            }
          }
        } catch {}
      }
    }

    const workItems = Array.from(itemMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    const explicitTicketId =
      extractTicketId(emailData?.ticket_id) ||
      extractTicketId(subject) ||
      extractTicketId(rawBody)

    let targetIdx = -1
    if (explicitTicketId) {
      targetIdx = workItems.findIndex(
        (w) => String(w.id).toUpperCase() === explicitTicketId
      )
    }

    if (targetIdx === -1 && senderEmail) {
      const cleanSubj = subject.replace(/^(\[[^\]]+\]|re:|fwd?:|\s)+/gi, '').toLowerCase().trim()
      targetIdx = workItems.findIndex(
        (w) =>
          String(w.reporter_email || '').toLowerCase().trim() === senderEmail &&
          cleanSubj &&
          String(w.subject || '').toLowerCase().includes(cleanSubj)
      )
      if (targetIdx === -1) {
        targetIdx = workItems.findIndex(
          (w) =>
            String(w.reporter_email || '').toLowerCase().trim() === senderEmail &&
            w.state === 'open'
        )
      }
    }

    if (targetIdx === -1) {
      return NextResponse.json(
        { ok: false, reason: 'No matching ticket found for ' + (explicitTicketId || senderEmail) },
        { status: 404 }
      )
    }

    const nowIso = new Date().toISOString()
    const item = workItems[targetIdx]
    item.thread = Array.isArray(item.thread) ? item.thread : []

    // Deduplicate: do not append if the exact same message text was already appended in the last 10 minutes
    const alreadyExists = item.thread.some(
      (m: any) =>
        m.direction === 'inbound_customer' &&
        String(m.text || '').trim() === cleanReply
    )

    if (!alreadyExists) {
      item.state = 'open'
      if (item.status === 'waiting_customer' || item.status === 'resolved') {
        item.status = 'in_progress'
      }
      item.updated_at = nowIso
      item.thread.push({
        id: `in-${Date.now()}`,
        author: senderEmail || item.reporter_email || 'Customer',
        direction: 'inbound_customer',
        text: cleanReply,
        created_at: nowIso,
      })
      workItems[targetIdx] = item

      const vaultPayload = {
        work_items: workItems,
        behavioral_flags: Array.from(flagMap.values()),
      }
      const nowTs = Date.now()
      const newVersionPath = `${OPS_VAULT_DIR}/${OPS_VAULT_PREFIX}${nowTs}.json`
      const buffer = Buffer.from(JSON.stringify(vaultPayload, null, 2), 'utf-8')

      await Promise.all([
        client.storage.from(OPS_BUCKET).upload(newVersionPath, buffer, {
          upsert: true,
          cacheControl: '0',
          contentType: 'application/json',
        }),
        client.storage.from(OPS_BUCKET).upload(OPS_VAULT_PATH, buffer, {
          upsert: true,
          cacheControl: '0',
          contentType: 'application/json',
        }),
      ])
    }

    return NextResponse.json({
      ok: true,
      ticket_id: item.id,
      deduplicated: alreadyExists,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Inbound email sync failed' },
      { status: 500 }
    )
  }
}
