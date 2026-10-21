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
  created_at: string
  updated_at: string
  thread: UserVisibleTicketMessage[]
}

async function loadMergedOpsVault(client: NonNullable<ReturnType<typeof getOpsServiceClient>>) {
  const vault: { work_items: any[]; behavioral_flags: any[] } = {
    work_items: [],
    behavioral_flags: [],
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

    for (const res of [baseRes, latestRes]) {
      if (res?.data && !res.error) {
        try {
          const parsed = JSON.parse(await res.data.text())
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
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
    )
    vault.behavioral_flags = Array.from(flagMap.values()).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
  } catch {}

  return vault
}

async function saveMergedOpsVault(
  client: NonNullable<ReturnType<typeof getOpsServiceClient>>,
  vault: { work_items: any[]; behavioral_flags: any[] }
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
      created_at: String(item.created_at || new Date().toISOString()),
      updated_at: String(item.updated_at || item.created_at || new Date().toISOString()),
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

export async function pushToOpsControlPlane(payload: Record<string, any>): Promise<void> {
  const nowIso = new Date().toISOString()

  try {
    const client = getOpsServiceClient()
    if (client) {
      const vault = await loadMergedOpsVault(client)
      let shouldSave = false

      const extractExistingTicketId = (txt?: string | null) => {
        if (!txt) return null
        const m = String(txt).match(/\b(TKT-\d{4,10}|FB-\d{4,10})\b/i)
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
          const newItem = {
            id: payload.id || `TKT-${Date.now().toString().slice(-6)}`,
            work_item_type: payload.work_item_type || "Support_Ticket",
            state: payload.state || "open",
            status: payload.status || "new",
            priority: payload.priority || "P2_Normal",
            owned_by: payload.owned_by || "Unassigned",
            subject: payload.subject || "Incoming Support Request",
            category: payload.category || "General Support",
            platform_area: payload.platform_area || "General Platform",
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
            created_at: nowIso,
            updated_at: nowIso,
            closed_at: null,
            thread: [],
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

  const ingestUrl = cleanEnv(process.env.OPS_INGEST_URL)
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
