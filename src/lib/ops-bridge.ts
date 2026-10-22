import { createClient } from "@supabase/supabase-js"

const OPS_BUCKET = "resumes"
const OPS_VAULT_DIR = "_isolated_ops_control_plane"
const OPS_VAULT_PREFIX = "ops_vault_v2_"
const OPS_VAULT_PATH = "_isolated_ops_control_plane/ops_vault_v2.json"

function cleanEnv(val?: string | null): string {
  if (!val) return ""
  return val.trim().replace(/^["']+|["']+$/g, "").trim()
}

export function getOpsServiceClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  })
}

export interface UserVisibleTicketMessage {
  id: string
  author: string
  direction: "outbound_reply" | "inbound_customer"
  text: string
  created_at: string
}

export interface UserVisibleTicket {
  id: string
  work_item_type: string
  state: "open" | "closed"
  status: string
  subject: string
  category: string
  platform_area: string
  description: string
  parent_ticket_id?: string | null
  created_at: string
  updated_at: string
  closed_at?: string | null
  csat_score?: number | null
  csat_comment?: string | null
  csat_submitted_at?: string | null
  thread: UserVisibleTicketMessage[]
}

export async function loadMergedOpsVault(
  client: NonNullable<ReturnType<typeof getOpsServiceClient>>
) {
  const vault: {
    work_items: any[]
    behavioral_flags: any[]
    monitor_meta: Record<string, any>
  } = {
    work_items: [],
    behavioral_flags: [],
    monitor_meta: {},
  }

  try {
    const { data: fileList } = await client.storage
      .from(OPS_BUCKET)
      .list(OPS_VAULT_DIR, {
        limit: 25,
        sortBy: { column: "name", order: "desc" },
      })

    const versionedFiles = (fileList || [])
      .filter((f) => f.name.startsWith(OPS_VAULT_PREFIX) && f.name.endsWith(".json"))
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
    let mergedMeta: Record<string, any> = {}

    for (const res of [baseRes, latestRes]) {
      if (res?.data && !res.error) {
        try {
          const parsed = JSON.parse(await res.data.text())
          if (parsed?.monitor_meta && typeof parsed.monitor_meta === "object") {
            mergedMeta = { ...mergedMeta, ...parsed.monitor_meta }
          }
          if (Array.isArray(parsed.work_items)) {
            for (const item of parsed.work_items) {
              if (!item?.id) continue
              const existing = itemMap.get(item.id)
              const itemTs = new Date(item.updated_at || item.created_at || 0).getTime()
              const existTs = existing
                ? new Date(existing.updated_at || existing.created_at || 0).getTime()
                : -1
              const itemLen = Array.isArray(item.thread) ? item.thread.length : 0
              const existLen =
                existing && Array.isArray(existing.thread) ? existing.thread.length : 0
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

    vault.work_items = Array.from(itemMap.values()).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    vault.behavioral_flags = Array.from(flagMap.values()).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    vault.monitor_meta = mergedMeta
  } catch {}

  return vault
}

export async function saveMergedOpsVault(
  client: NonNullable<ReturnType<typeof getOpsServiceClient>>,
  vault: { work_items: any[]; behavioral_flags: any[]; monitor_meta?: Record<string, any> }
) {
  const nowTs = Date.now()
  const newVersionPath = `${OPS_VAULT_DIR}/${OPS_VAULT_PREFIX}${nowTs}.json`
  const payloadBuffer = Buffer.from(JSON.stringify(vault, null, 2), "utf-8")

  await Promise.all([
    client.storage.from(OPS_BUCKET).upload(newVersionPath, payloadBuffer, {
      upsert: true,
      cacheControl: "0",
      contentType: "application/json",
    }),
    client.storage.from(OPS_BUCKET).upload(OPS_VAULT_PATH, payloadBuffer, {
      upsert: true,
      cacheControl: "0",
      contentType: "application/json",
    }),
  ])
}

export async function getUserOpsTickets(
  userId: string,
  userEmail?: string | null
): Promise<UserVisibleTicket[]> {
  const client = getOpsServiceClient()
  if (!client) return []

  const vault = await loadMergedOpsVault(client)
  const cleanEmail = String(userEmail || "").toLowerCase().trim()

  return vault.work_items
    .filter((item: any) => {
      if (item.work_item_type === "System_Outage" || item.work_item_type === "Security_Alert") {
        return false
      }
      const matchId = userId && String(item.reporter_user_id || "") === userId
      const matchEmail =
        cleanEmail &&
        String(item.reporter_email || "").toLowerCase().trim() === cleanEmail
      return Boolean(matchId || matchEmail)
    })
    .map((item: any) => ({
      id: String(item.id),
      work_item_type: String(item.work_item_type || "Support_Ticket"),
      state: item.state === "closed" ? "closed" : "open",
      status: String(item.status || "new"),
      subject: String(item.subject || "Support Request"),
      category: String(item.category || "General Support"),
      platform_area: String(item.platform_area || "General Platform"),
      description: String(item.description || ""),
      parent_ticket_id: item.parent_ticket_id || null,
      created_at: String(item.created_at || new Date().toISOString()),
      updated_at: String(item.updated_at || item.created_at || new Date().toISOString()),
      closed_at: item.closed_at ? String(item.closed_at) : null,
      csat_score: typeof item.csat_score === "number" ? item.csat_score : null,
      csat_comment: item.csat_comment ? String(item.csat_comment) : null,
      csat_submitted_at: item.csat_submitted_at ? String(item.csat_submitted_at) : null,
      thread: (Array.isArray(item.thread) ? item.thread : [])
        .filter(
          (m: any) =>
            m &&
            (m.direction === "outbound_reply" || m.direction === "inbound_customer")
        )
        .map((m: any) => ({
          id: String(m.id || `msg-${Date.now()}`),
          author:
            m.direction === "outbound_reply"
              ? "Special Sauce Support"
              : String(m.author || "You"),
          direction: m.direction as "outbound_reply" | "inbound_customer",
          text: String(m.text || ""),
          created_at: String(m.created_at || new Date().toISOString()),
        })),
    }))
}

export async function appendUserTicketReply(params: {
  ticketId: string
  userId: string
  userEmail: string
  replyText: string
}): Promise<{ ok: boolean; error?: string; ticket?: UserVisibleTicket }> {
  const client = getOpsServiceClient()
  if (!client) {
    return { ok: false, error: "Support storage service unavailable." }
  }

  const trimmed = String(params.replyText || "").trim()
  if (!trimmed) {
    return { ok: false, error: "Please enter a reply message." }
  }

  const vault = await loadMergedOpsVault(client)
  const cleanId = String(params.ticketId || "").toUpperCase().trim()
  const cleanEmail = String(params.userEmail || "").toLowerCase().trim()

  const idx = vault.work_items.findIndex((w: any) => {
    const idMatches = String(w.id || "").toUpperCase().trim() === cleanId
    if (!idMatches) return false
    const ownerMatches =
      (params.userId && String(w.reporter_user_id || "") === params.userId) ||
      (cleanEmail &&
        String(w.reporter_email || "").toLowerCase().trim() === cleanEmail)
    return ownerMatches
  })

  if (idx === -1) {
    return { ok: false, error: "Ticket not found or access denied." }
  }

  const nowIso = new Date().toISOString()
  const item = vault.work_items[idx]
  item.state = "open"
  item.status = "pending_support"
  item.updated_at = nowIso
  item.thread = Array.isArray(item.thread) ? item.thread : []

  item.thread.push({
    id: `in-${Date.now()}`,
    author: params.userEmail || item.reporter_email || "Customer",
    direction: "inbound_customer",
    text: trimmed,
    created_at: nowIso,
  })

  vault.work_items[idx] = item
  await saveMergedOpsVault(client, vault)

  const updatedTickets = await getUserOpsTickets(params.userId, params.userEmail)
  const updatedTicket = updatedTickets.find((t) => t.id.toUpperCase() === cleanId)

  return { ok: true, ticket: updatedTicket }
}

export async function submitSupportTicketCsat(params: {
  ticketId: string
  userId: string
  userEmail: string
  rating: number
  comment?: string
}): Promise<{ ok: boolean; error?: string; ticket?: UserVisibleTicket }> {
  const client = getOpsServiceClient()
  if (!client) {
    return { ok: false, error: "Support storage service unavailable." }
  }

  const score = Math.round(Number(params.rating))
  if (!score || score < 1 || score > 5) {
    return { ok: false, error: "Please select a star rating between 1 and 5." }
  }

  const vault = await loadMergedOpsVault(client)
  const cleanId = String(params.ticketId || "").toUpperCase().trim()
  const cleanEmail = String(params.userEmail || "").toLowerCase().trim()

  const idx = vault.work_items.findIndex((w: any) => {
    const idMatches = String(w.id || "").toUpperCase().trim() === cleanId
    if (!idMatches) return false
    const ownerMatches =
      (params.userId && String(w.reporter_user_id || "") === params.userId) ||
      (cleanEmail &&
        String(w.reporter_email || "").toLowerCase().trim() === cleanEmail)
    return ownerMatches
  })

  if (idx === -1) {
    return { ok: false, error: "Ticket not found or access denied." }
  }

  const nowIso = new Date().toISOString()
  const cleanComment = String(params.comment || "").trim()
  const item = vault.work_items[idx]
  item.csat_score = score
  item.csat_comment = cleanComment || null
  item.csat_submitted_at = nowIso
  item.updated_at = nowIso
  item.thread = Array.isArray(item.thread) ? item.thread : []

  const starsVisual = "★".repeat(score) + "☆".repeat(5 - score)
  item.thread.push({
    id: "csat-" + Date.now(),
    author: params.userEmail || item.reporter_email || "Customer",
    direction: "internal_note",
    text:
      "[Customer CSAT Rating: " +
      score +
      "/5 " +
      starsVisual +
      "]" +
      (cleanComment ? " — " + cleanComment : ""),
    created_at: nowIso,
  })

  vault.work_items[idx] = item
  await saveMergedOpsVault(client, vault)

  const updatedTickets = await getUserOpsTickets(params.userId, params.userEmail)
  const updatedTicket = updatedTickets.find((t) => t.id.toUpperCase() === cleanId)

  return { ok: true, ticket: updatedTicket }
}

export async function pushToOpsControlPlane(payload: Record<string, any>): Promise<void> {
  const nowIso = new Date().toISOString()

  try {
    const client = getOpsServiceClient()
    if (client) {
      const vault = await loadMergedOpsVault(client)
      let shouldSave = false

      const extractExistingTicketId = (txt?: string | null) => {
        if (!txt) return null
        const m = String(txt).match(/\b(TKT-\d{4,10}|FB-\d{4,10}|INC-\d{4,10}|SEC-\d{4,10})\b/i)
        return m ? m[1].toUpperCase() : null
      }

      if (payload.event_type === "work_item") {
        const refTicketId =
          extractExistingTicketId(payload.related_ref_id) ||
          extractExistingTicketId(payload.subject)
        const refIdx = refTicketId
          ? vault.work_items.findIndex((w: any) => String(w.id).toUpperCase() === refTicketId)
          : -1

        if (refIdx >= 0 && payload.id !== refTicketId) {
          const item = vault.work_items[refIdx]
          item.state = "open"
          item.status = "pending_support"
          item.updated_at = nowIso
          item.thread = Array.isArray(item.thread) ? item.thread : []
          item.thread.push({
            id: `in-${Date.now()}`,
            author: payload.reporter_email || item.reporter_email || "Customer",
            direction: "inbound_customer",
            text: String(payload.description || "").trim(),
            created_at: nowIso,
          })
          if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
            item.attachments = [...(item.attachments || []), ...payload.attachments]
          }
          vault.work_items[refIdx] = item
          shouldSave = true
        } else {
          const itemType = payload.work_item_type || "Support_Ticket"
          const defaultPrefix =
            itemType === "System_Outage"
              ? "INC"
              : itemType === "Security_Alert"
              ? "SEC"
              : "TKT"
          const newId = payload.id || `${defaultPrefix}-${Date.now().toString().slice(-6)}`
          const area = payload.platform_area || "Other / General Platform"

          let parentId: string | null = payload.parent_ticket_id || null

          if (
            !parentId &&
            itemType !== "System_Outage" &&
            itemType !== "Security_Alert"
          ) {
            const activeOutageIdx = vault.work_items.findIndex(
              (w: any) =>
                w.state === "open" &&
                w.work_item_type === "System_Outage" &&
                w.platform_area === area
            )

            if (activeOutageIdx >= 0) {
              const parentOutage = vault.work_items[activeOutageIdx]
              parentId = parentOutage.id
              const children = new Set<string>(
                Array.isArray(parentOutage.child_ticket_ids)
                  ? parentOutage.child_ticket_ids
                  : []
              )
              children.add(newId)
              parentOutage.child_ticket_ids = Array.from(children)
              parentOutage.updated_at = nowIso
              parentOutage.thread = Array.isArray(parentOutage.thread)
                ? parentOutage.thread
                : []
              parentOutage.thread.push({
                id: `link-${Date.now()}`,
                author: "Incident Auto-Linker",
                direction: "internal_note",
                text: `🔗 Auto-linked incoming ${itemType} [${newId}] from ${
                  payload.reporter_email || "Customer"
                } ("${payload.subject}") to this Master Outage.`,
                created_at: nowIso,
              })
              vault.work_items[activeOutageIdx] = parentOutage
            } else if (itemType === "Bug_Defect") {
              const thirtyMinAgo = Date.now() - 30 * 60 * 1000
              const recentAreaBugs = vault.work_items.filter(
                (w: any) =>
                  w.state === "open" &&
                  w.work_item_type !== "System_Outage" &&
                  w.work_item_type !== "Security_Alert" &&
                  w.platform_area === area &&
                  new Date(w.created_at || 0).getTime() >= thirtyMinAgo
              )

              if (recentAreaBugs.length >= 2) {
                const incId = `INC-${Date.now().toString().slice(-6)}`
                const childIds = [
                  ...recentAreaBugs.map((b: any) => String(b.id)),
                  newId,
                ]
                parentId = incId

                for (const bug of recentAreaBugs) {
                  bug.parent_ticket_id = incId
                }

                const autoOutageItem = {
                  id: incId,
                  work_item_type: "System_Outage",
                  state: "open",
                  status: "new",
                  priority: "P0_Critical",
                  owned_by: "Steve Briley (Founder / Lead Ops)",
                  subject: `[AUTO-DETECTED OUTAGE] Multiple Bug Reports in ${area}`,
                  category: "Technical Issue / Bug Report",
                  platform_area: area,
                  root_cause: "Confirmed Bug / Technical Defect",
                  related_ref_id: "",
                  account_tier: "SYSTEM MONITOR",
                  description: `Automated Burst Detector created this Master Outage Ticket (${incId}) because ${childIds.length} tickets were reported in "${area}" within 30 minutes.\n\nLinked Child Tickets: ${childIds.join(", ")}`,
                  reporter_user_id: "system-watchdog",
                  reporter_name: "Special Sauce Watchdog",
                  reporter_email: "support@specialsauce.io",
                  reporter_role: "SYSTEM",
                  organization_context: "Platform-Wide Incident Tracking",
                  page_url: "/dashboard",
                  user_agent: "Automated Anomaly Engine",
                  attachments: [],
                  parent_ticket_id: null,
                  child_ticket_ids: childIds,
                  created_at: nowIso,
                  updated_at: nowIso,
                  closed_at: null,
                  thread: [
                    {
                      id: `note-${Date.now()}`,
                      author: "System Watchdog",
                      direction: "internal_note",
                      text: `🚨 Auto-created Master Outage ${incId} and linked ${childIds.length} child tickets: ${childIds.join(", ")}`,
                      created_at: nowIso,
                    },
                  ],
                }
                vault.work_items.unshift(autoOutageItem)
              }
            }
          }

          const newItem = {
            id: newId,
            work_item_type: itemType,
            state: payload.state || "open",
            status: payload.status || "new",
            priority: payload.priority || "P2_Normal",
            owned_by: payload.owned_by || "Unassigned",
            subject: payload.subject || "Incoming Support Request",
            category: payload.category || "General Support",
            platform_area: area,
            root_cause: payload.root_cause || "Unclassified",
            related_ref_id: payload.related_ref_id || "",
            account_tier: payload.account_tier || "",
            description: payload.description || "",
            reporter_user_id: payload.reporter_user_id || "unknown",
            reporter_name: payload.reporter_name || "Platform User",
            reporter_email: payload.reporter_email || "unknown@user",
            reporter_role: payload.reporter_role || "USER",
            organization_context: payload.organization_context || "",
            page_url: payload.page_url || "/dashboard",
            user_agent: payload.user_agent || "",
            attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
            parent_ticket_id: parentId,
            child_ticket_ids: Array.isArray(payload.child_ticket_ids)
              ? payload.child_ticket_ids
              : [],
            created_at: nowIso,
            updated_at: nowIso,
            closed_at: null,
            thread: Array.isArray(payload.thread) ? payload.thread : [],
          }
          vault.work_items = [
            newItem,
            ...vault.work_items.filter((i) => i.id !== newItem.id),
          ].slice(0, 800)
          shouldSave = true
        }
      } else if (payload.event_type === "behavioral_flag") {
        const newFlag = {
          id: payload.id || `FLG-${Date.now().toString().slice(-6)}`,
          severity: payload.severity || "medium",
          status: "open",
          flag_type: payload.flag_type || "Manual_Trust_Audit",
          user_id: payload.user_id || null,
          organization_id: payload.organization_id || null,
          actor_email: payload.actor_email || "unknown@user",
          actor_role: payload.actor_role || "unknown",
          summary: payload.summary || "Behavioral guardrail triggered",
          evidence_snippet: payload.evidence_snippet || "",
          enforcement_taken: null,
          created_at: nowIso,
        }
        vault.behavioral_flags = [
          newFlag,
          ...vault.behavioral_flags.filter((f) => f.id !== newFlag.id),
        ].slice(0, 600)
        shouldSave = true
      }

      if (shouldSave) {
        await saveMergedOpsVault(client, vault)
      }
    }
  } catch (err) {
    console.warn("Ops vault sync warning:", err)
  }

  const ingestUrl =
    cleanEnv(process.env.OPS_INGEST_URL) ||
    "https://ops.specialsauce.io/api/ingest"
  const ingestSecret =
    cleanEnv(process.env.OPS_INGEST_SECRET) ||
    "ss_ops_webhook_secret_9948271625"

  if (ingestUrl) {
    try {
      await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-secret": ingestSecret,
        },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.warn("Ops webhook warning:", err)
    }
  }
}
