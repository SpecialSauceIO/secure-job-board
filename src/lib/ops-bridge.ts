import { createClient } from "@supabase/supabase-js"

const OPS_BUCKET = "resumes"
const OPS_VAULT_PATH = "_isolated_ops_control_plane/ops_vault_v2.json"

function cleanEnv(val?: string | null): string {
  if (!val) return ""
  return val.trim().replace(/^["']+|["']+$/g, "").trim()
}

function getServiceClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function pushToOpsControlPlane(payload: Record<string, any>): Promise<void> {
  const nowIso = new Date().toISOString()

  try {
    const client = getServiceClient()
    if (client) {
      let vault: { work_items: any[]; behavioral_flags: any[] } = {
        work_items: [],
        behavioral_flags: [],
      }

      try {
        const { data, error } = await client.storage
          .from(OPS_BUCKET)
          .download(OPS_VAULT_PATH)
        if (!error && data) {
          const parsed = JSON.parse(await data.text())
          vault = {
            work_items: Array.isArray(parsed.work_items) ? parsed.work_items : [],
            behavioral_flags: Array.isArray(parsed.behavioral_flags)
              ? parsed.behavioral_flags
              : [],
          }
        }
      } catch {}

      if (payload.event_type === "work_item") {
        const newItem = {
          id: payload.id || `TKT-${Date.now().toString().slice(-6)}`,
          work_item_type: payload.work_item_type || "Support_Ticket",
          priority: payload.priority || "P2_Normal",
          status: "new",
          subject: payload.subject || "Incoming Support Request",
          category: payload.category || "General",
          description: payload.description || "",
          reporter_user_id: payload.reporter_user_id || "unknown",
          reporter_name: payload.reporter_name || "Platform User",
          reporter_email: payload.reporter_email || "unknown@user",
          reporter_role: payload.reporter_role || "USER",
          organization_context: payload.organization_context || "",
          page_url: payload.page_url || "/dashboard",
          user_agent: payload.user_agent || "",
          created_at: nowIso,
          updated_at: nowIso,
          thread: [],
        }
        vault.work_items = [newItem, ...vault.work_items].slice(0, 600)
        const blob = new Blob([JSON.stringify(vault, null, 2)], {
          type: "application/json",
        })
        await client.storage.from(OPS_BUCKET).upload(OPS_VAULT_PATH, blob, {
          upsert: true,
          contentType: "application/json",
        })
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
        vault.behavioral_flags = [newFlag, ...vault.behavioral_flags].slice(0, 600)
        const blob = new Blob([JSON.stringify(vault, null, 2)], {
          type: "application/json",
        })
        await client.storage.from(OPS_BUCKET).upload(OPS_VAULT_PATH, blob, {
          upsert: true,
          contentType: "application/json",
        })
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
