import { NextRequest, NextResponse } from "next/server"
import {
  getOpsServiceClient,
  loadMergedOpsVault,
  saveMergedOpsVault,
} from "@/lib/ops-bridge"

function extractTicketId(text?: string | null): string | null {
  if (!text) return null
  const match = String(text).match(
    /\b(TKT-\d{4,10}|FB-\d{4,10}|INC-\d{4,10}|SEC-\d{4,10})\b/i
  )
  return match ? match[1].toUpperCase() : null
}

function stripQuotedHistory(rawText: string): string {
  const lines = String(rawText || "").replace(/\r\n/g, "\n").split("\n")
  const cleaned: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^On .+ wrote:$/i.test(trimmed)) break
    if (/^From:\s+/i.test(trimmed) && cleaned.length > 0) break
    if (/^-{3,}\s*Original Message\s*-{3,}/i.test(trimmed)) break
    if (/^SPECIAL SAUCE™ SUPPORT (DESK|CENTER)/i.test(trimmed)) break
    if (/^✓\s*TICKET RESOLVED/i.test(trimmed)) break
    if (trimmed.startsWith(">")) continue
    cleaned.push(line)
  }
  return cleaned.join("\n").trim()
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = (req.headers.get("authorization") || "").trim()
    const opsHeader = (req.headers.get("x-ops-secret") || "").trim()
    const svixId = req.headers.get("svix-id") || ""
    const validSecrets = [
      process.env.OPS_WEBHOOK_SECRET,
      process.env.CRON_SECRET,
      process.env.OPS_SYNC_SECRET,
      "ss_cron_459300fd7b17159ba22da7b8af2bf4026ea668ae7f7f019c",
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean)
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    const hasSecretMatch =
      validSecrets.length > 0 &&
      validSecrets.some((sec) => bearerToken === sec || opsHeader === sec)
    if (!hasSecretMatch && !svixId) {
      return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 })
    }
    const payload = await req.json()
    const client = getOpsServiceClient()
    if (!client) {
      return NextResponse.json(
        { error: "Ops storage client unavailable" },
        { status: 500 }
      )
    }

    const emailData = payload?.data || payload
    const nowIso = new Date().toISOString()

    if (
      payload?.event_type === "heartbeat" ||
      emailData?.event_type === "heartbeat"
    ) {
      const vault = await loadMergedOpsVault(client)
      const latestChecks = Array.isArray(vault.monitor_meta?.latest_checks)
        ? vault.monitor_meta.latest_checks.map((chk: any) =>
            chk.id === "gmail_inbound_poller"
              ? {
                  ...chk,
                  status: "healthy",
                  latency_ms: 0,
                  detail: "Last Gmail poll check-in 0m ago (healthy <= 25m)",
                  checked_at: nowIso,
                }
              : chk
          )
        : undefined

      if (Array.isArray(vault.work_items)) {
        for (const w of vault.work_items) {
          if (
            w.state === "open" &&
            w.work_item_type === "System_Outage" &&
            (w.related_ref_id === "OPS-HEALTH-WATCHDOG" ||
              (typeof w.subject === "string" &&
                w.subject.includes("Gmail Poller Heartbeat Stale")))
          ) {
            w.state = "closed"
            w.status = "resolved"
            w.closed_at = nowIso
            w.updated_at = nowIso
            w.thread = Array.isArray(w.thread) ? w.thread : []
            w.thread.push({
              id: `MSG-${Date.now()}`,
              sender_name: "Special Sauce Watchdog",
              sender_role: "SYSTEM",
              body: "Auto-resolved: Fresh Gmail Inbound Support Sync heartbeat received.",
              created_at: nowIso,
            })
          }
        }
      }

      vault.monitor_meta = {
        ...(vault.monitor_meta || {}),
        last_gmail_heartbeat_at: nowIso,
        last_gmail_threads_scanned: Number(emailData?.threads_scanned ?? 0),
        last_gmail_replies_synced: Number(emailData?.replies_synced ?? 0),
        ...(latestChecks ? { latest_checks: latestChecks } : {}),
      }

      await saveMergedOpsVault(client, vault)
      return NextResponse.json({
        ok: true,
        heartbeat_recorded_at: nowIso,
      })
    }

    const rawFrom = String(
      emailData?.from?.email ||
        emailData?.from ||
        emailData?.sender ||
        emailData?.reporter_email ||
        ""
    ).trim()
    const senderEmailMatch = rawFrom.match(/<([^>]+)>/)
    const senderEmail = (
      senderEmailMatch ? senderEmailMatch[1] : rawFrom
    )
      .toLowerCase()
      .trim()

    const subject = String(emailData?.subject || "").trim()
    const rawBody = String(
      emailData?.text ||
        emailData?.reply_text ||
        emailData?.body ||
        emailData?.html?.replace(/<[^>]+>/g, " ") ||
        ""
    ).trim()

    const cleanReply = stripQuotedHistory(rawBody)
    const isReplySubject = /^(re|fwd?)\s*:/i.test(subject)

    const isAutomatedLoop =
      !cleanReply ||
      cleanReply === subject ||
      cleanReply.includes("✓ Resolved:") ||
      cleanReply.includes("Support Ticket Received:") ||
      cleanReply.includes("Support Ticket [") ||
      cleanReply.includes("Update Confirmation: Your reply has been posted") ||
      cleanReply.includes("SPECIAL SAUCE™ SUPPORT") ||
      (!isReplySubject &&
        (senderEmail.includes("support@specialsauce.io") ||
          senderEmail.includes("noreply@specialsauce.io") ||
          senderEmail.includes("no-reply@specialsauce.io") ||
          senderEmail.includes("resend.dev") ||
          subject.includes("✓ Resolved:") ||
          subject.includes("Support Ticket Received:") ||
          subject.includes("Support Ticket [") ||
          subject.includes("Update Confirmation:") ||
          subject.includes("In-App Reply from")))

    if (isAutomatedLoop) {
      return NextResponse.json({
        ok: true,
        ignored_self_notification: true,
      })
    }

    const vault = await loadMergedOpsVault(client)
    const workItems = vault.work_items

    const explicitTicketId =
      extractTicketId(emailData?.ticket_id) ||
      extractTicketId(subject) ||
      extractTicketId(rawBody)

    let targetIdx = -1
    if (explicitTicketId) {
      targetIdx = workItems.findIndex(
        (w: any) => String(w.id).toUpperCase() === explicitTicketId
      )
    }

    if (targetIdx === -1 && senderEmail) {
      const cleanSubj = subject
        .replace(/^(\[[^\]]+\]|re:|fwd?:|✓\s*resolved:|\s)+/gi, "")
        .toLowerCase()
        .trim()
      targetIdx = workItems.findIndex(
        (w: any) =>
          String(w.reporter_email || "").toLowerCase().trim() === senderEmail &&
          cleanSubj &&
          String(w.subject || "").toLowerCase().includes(cleanSubj)
      )
      if (targetIdx === -1) {
        targetIdx = workItems.findIndex(
          (w: any) =>
            String(w.reporter_email || "").toLowerCase().trim() === senderEmail &&
            w.work_item_type !== "System_Outage" &&
            w.work_item_type !== "Security_Alert"
        )
      }
    }

    if (targetIdx === -1) {
      return NextResponse.json(
        {
          ok: false,
          reason:
            "No matching ticket found for " + (explicitTicketId || senderEmail),
        },
        { status: 404 }
      )
    }

    const item = workItems[targetIdx]
    item.thread = Array.isArray(item.thread) ? item.thread : []
    const incomingMsgId = String(emailData?.message_id || "").trim()

    const alreadyExists = item.thread.some(
      (m: any) =>
        m.direction === "inbound_customer" &&
        ((incomingMsgId && m.gmail_message_id === incomingMsgId) ||
          String(m.text || "").trim() === cleanReply)
    )

    if (!alreadyExists) {
      item.state = "open"
      item.closed_at = null
      item.status = "pending_support"
      item.updated_at = nowIso
      item.thread.push({
        id: "in-" + Date.now(),
        gmail_message_id: incomingMsgId || undefined,
        author: senderEmail || item.reporter_email || "Customer",
        direction: "inbound_customer",
        text: cleanReply,
        created_at: nowIso,
      })
      vault.work_items[targetIdx] = item
      vault.monitor_meta = {
        ...(vault.monitor_meta || {}),
        last_gmail_heartbeat_at: nowIso,
      }
      await saveMergedOpsVault(client, vault)
    }

    return NextResponse.json({
      ok: true,
      ticket_id: item.id,
      deduplicated: alreadyExists,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Inbound email sync failed" },
      { status: 500 }
    )
  }
}
