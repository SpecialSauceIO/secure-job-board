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

export async function pushToOpsControlPlane(payload: Record<string, any>): Promise<void> {
  const nowIso = new Date().toISOString()

  try {
    const client = getOpsServiceClient()
    if (client) {
      let vault: { work_items: any[]; behavioral_flags: any[] } = {
        work_items: [],
        behavioral_flags: [],
      }

      try {
        const { data: fileList } = await client.storage
          .from(OPS_BUCKET)
          .list(OPS_VAULT_DIR, {
            limit: 20,
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
                  if (
                    !existing ||
                    new Date(item.updated_at || item.created_at || 0).getTime() >=
                      new Date(existing.updated_at || existing.created_at || 0).getTime()
                  ) {
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
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        vault.behavioral_flags = Array.from(flagMap.values()).sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      } catch {}

      let shouldSave = false

      if (payload.event_type === "work_item") {
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
