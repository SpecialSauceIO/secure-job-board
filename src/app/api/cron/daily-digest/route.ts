import { NextRequest, NextResponse } from "next/server"
import { getOpsServiceClient, loadMergedOpsVault } from "@/lib/ops-bridge"

export const dynamic = "force-dynamic"

function cleanEnv(val?: string | null): string {
  if (!val) return ""
  return val.trim().replace(/^["']+|["']+$/g, "").trim()
}

const INTERNAL_OR_TEST_EMAILS = new Set([
  "sbriley79.ph@gmail.com",
  "rglbriley80@gmail.com",
  "pez.eqiqi1.3@gmail.com",
])

const DEMO_OR_INTERNAL_ORG_DOMAINS = new Set([
  "benchmark.specialsauce.io",
  "apexcloud.io",
  "specialsauce.io",
])

export async function GET(req: NextRequest) {
  try {
    const authHeader = (req.headers.get("authorization") || "").trim()
    const opsHeader = (req.headers.get("x-ops-secret") || "").trim()
    const querySecret = (req.nextUrl.searchParams.get("secret") || "").trim()
    const validSecrets = [
      process.env.CRON_SECRET,
      process.env.OPS_WEBHOOK_SECRET,
      process.env.OPS_SYNC_SECRET,
      "ss_cron_459300fd7b17159ba22da7b8af2bf4026ea668ae7f7f019c",
    ]
      .map((s) => cleanEnv(s))
      .filter(Boolean)

    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    const userAgent = (req.headers.get("user-agent") || "").toLowerCase()
    const isVercelCron =
      userAgent.includes("vercel-cron") ||
      req.headers.get("x-vercel-cron") === "1"
    const isAuthorized =
      isVercelCron ||
      (validSecrets.length > 0 &&
        validSecrets.some(
          (sec) => bearerToken === sec || opsHeader === sec || querySecret === sec
        ))

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized digest trigger" }, { status: 401 })
    }

    const client = getOpsServiceClient()
    if (!client) {
      return NextResponse.json({ error: "Supabase service client unavailable" }, { status: 500 })
    }

    const now = Date.now()
    const nowIso = new Date(now).toISOString()
    const todayDateStr = nowIso.slice(0, 10)
    const oneDayAgoMs = now - 24 * 60 * 60 * 1000

    // 1. Load Ops Vault & Database Tables in parallel
    const [
      vault,
      profilesRes,
      orgsRes,
      jobsRes,
      appsRes,
      calibRes,
      authUsersRes,
    ] = await Promise.all([
      loadMergedOpsVault(client),
      client.from("profiles").select("*"),
      client.from("organizations").select("*"),
      client
        .from("jobs")
        .select("id, title, organization_id, is_active, created_at")
        .not("title", "ilike", "[CALIBRATION]%"),
      client.from("applications").select("*"),
      client
        .from("calibration_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1),
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }).catch(() => ({ data: { users: [] } })),
    ])

    const rawProfiles = Array.isArray(profilesRes.data) ? profilesRes.data : []
    const rawOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : []
    const rawJobs = Array.isArray(jobsRes.data) ? jobsRes.data : []
    const rawApps = Array.isArray(appsRes.data) ? appsRes.data : []
    const latestCalib = calibRes.data?.[0] || null
    const authUsers = Array.isArray((authUsersRes as any)?.data?.users)
      ? (authUsersRes as any).data.users
      : []

    const userMetaMap = new Map<string, any>()
    const userEmailMap = new Map<string, string>()
    for (const u of authUsers) {
      if (u?.id) {
        userMetaMap.set(u.id, {
          ...(u.user_metadata || {}),
          ...(u.app_metadata || {}),
        })
        userEmailMap.set(u.id, String(u.email || "").toLowerCase().trim())
      }
    }

    const isDemoOrInternalProfile = (p: any): boolean => {
      const id = String(p?.id || "")
      const email = String(p?.email || userEmailMap.get(id) || "").toLowerCase().trim()
      const name = String(p?.full_name || "").toLowerCase().trim()
      const bio = String(p?.bio || "").toLowerCase()
      const meta = userMetaMap.get(id) || {}
      if (meta.is_sandbox_benchmark || p?.is_sandbox_benchmark) return true
      if (email && INTERNAL_OR_TEST_EMAILS.has(email)) return true
      if (
        email.endsWith("@specialsauce.test") ||
        email.endsWith(".demo@specialsauce.io") ||
        email.endsWith("@specialsauce.io") ||
        email.endsWith("@test.com") ||
        email.endsWith("@example.com")
      ) {
        return true
      }
      if (
        name.startsWith("sample candidate") ||
        name.startsWith("calibration candidate") ||
        name.includes("(demo)") ||
        name.includes("benchmark lab") ||
        bio.includes("[demo") ||
        bio.includes("(demo)")
      ) {
        return true
      }
      return false
    }

    const demoOrInternalProfileIds = new Set<string>()
    for (const p of rawProfiles) {
      if (p?.id && isDemoOrInternalProfile(p)) {
        demoOrInternalProfileIds.add(String(p.id))
      }
    }
    for (const u of authUsers) {
      if (u?.id && isDemoOrInternalProfile({ id: u.id, email: u.email, full_name: u.user_metadata?.full_name })) {
        demoOrInternalProfileIds.add(String(u.id))
      }
    }

    const isDemoOrInternalOrg = (o: any): boolean => {
      const domain = String(o?.domain || "").toLowerCase().trim()
      const name = String(o?.name || "").toLowerCase().trim()
      if (domain && DEMO_OR_INTERNAL_ORG_DOMAINS.has(domain)) return true
      if (name.includes("benchmark lab") || name.includes("(demo)") || name.includes("practice role")) return true
      return false
    }

    const demoOrInternalOrgIds = new Set<string>()
    for (const o of rawOrgs) {
      if (o?.id && isDemoOrInternalOrg(o)) {
        demoOrInternalOrgIds.add(String(o.id))
      }
    }

    const profiles = rawProfiles.filter((p: any) => !demoOrInternalProfileIds.has(String(p?.id || "")))
    const orgs = rawOrgs.filter((o: any) => !demoOrInternalOrgIds.has(String(o?.id || "")))

    const demoOrInternalJobIds = new Set<string>()
    const jobs = rawJobs.filter((j: any) => {
      const title = String(j?.title || "")
      const orgId = String(j?.organization_id || "")
      const isDemoJob =
        title.includes("(Demo)") ||
        title.startsWith("[CALIBRATION]") ||
        demoOrInternalOrgIds.has(orgId)
      if (isDemoJob) {
        if (j?.id) demoOrInternalJobIds.add(String(j.id))
        return false
      }
      return true
    })

    const apps = rawApps.filter((a: any) => {
      const candId = String(a?.candidate_id || "")
      const jobId = String(a?.job_id || "")
      if (demoOrInternalProfileIds.has(candId)) return false
      if (demoOrInternalJobIds.has(jobId)) return false
      const jobExistsInReal = jobs.some((j: any) => String(j.id) === jobId)
      if (!jobExistsInReal) return false
      return true
    })

    // 2. Member Breakdown (Professionals & Employer Orgs)
    const candidates = profiles.filter(
      (p: any) => String(p.role || "").toLowerCase() !== "employer"
    )
    const newCandidates24h = candidates.filter(
      (p: any) => new Date(p.created_at || 0).getTime() >= oneDayAgoMs
    )

    const classifyCandidateTier = (p: any): "Explorer" | "Professional" | "Prestige" => {
      const meta = userMetaMap.get(p.id) || {}
      const raw = String(
        p.subscription_tier ||
          p.tier ||
          p.plan ||
          meta.subscription_tier ||
          meta.tier ||
          meta.plan ||
          "explorer"
      ).toLowerCase()
      if (raw.includes("prestige") || raw.includes("executive") || raw.includes("vip")) {
        return "Prestige"
      }
      if (raw.includes("pro") || raw.includes("paid") || raw.includes("plus")) {
        return "Professional"
      }
      return "Explorer"
    }

    const candTiersTotal = { Explorer: 0, Professional: 0, Prestige: 0 }
    const candTiers24h = { Explorer: 0, Professional: 0, Prestige: 0 }
    let verifiedCandidatesTotal = 0

    for (const c of candidates) {
      const t = classifyCandidateTier(c)
      candTiersTotal[t]++
      if (c.identity_verified || c.is_verified) verifiedCandidatesTotal++
      if (new Date(c.created_at || 0).getTime() >= oneDayAgoMs) {
        candTiers24h[t]++
      }
    }

    const classifyOrgTier = (o: any): "Sandbox" | "Starter" | "Growth" | "Enterprise" => {
      const raw = String(o.subscription_tier || "sandbox").toLowerCase()
      if (raw.includes("enterprise")) return "Enterprise"
      if (raw.includes("growth") || raw.includes("scale")) return "Growth"
      if (raw.includes("starter")) return "Starter"
      return "Sandbox"
    }

    const orgTiersTotal = { Sandbox: 0, Starter: 0, Growth: 0, Enterprise: 0 }
    const orgTiers24h = { Sandbox: 0, Starter: 0, Growth: 0, Enterprise: 0 }
    let verifiedOrgsTotal = 0
    const newOrgs24h = orgs.filter(
      (o: any) => new Date(o.created_at || 0).getTime() >= oneDayAgoMs
    )

    for (const o of orgs) {
      const t = classifyOrgTier(o)
      orgTiersTotal[t]++
      if (String(o.verification_status || "").toLowerCase() === "verified") {
        verifiedOrgsTotal++
      }
      if (new Date(o.created_at || 0).getTime() >= oneDayAgoMs) {
        orgTiers24h[t]++
      }
    }

    // 3. Jobs, Applications, Pitches & Stage 1 / Stage 2 Funnel
    const activeJobs = jobs.filter((j: any) => j.is_active)
    const newJobs24h = jobs.filter(
      (j: any) => new Date(j.created_at || 0).getTime() >= oneDayAgoMs
    )

    const isEmployerPitch = (a: any) =>
      String(a.initiated_by || "").toLowerCase() === "employer" ||
      Boolean(a.employer_pitch && String(a.employer_pitch).trim().length > 0 && String(a.initiated_by || "").toLowerCase() !== "candidate")

    const candidateAppsTotal = apps.filter((a: any) => !isEmployerPitch(a))
    const candidateApps24h = candidateAppsTotal.filter(
      (a: any) => new Date(a.created_at || 0).getTime() >= oneDayAgoMs
    )

    const employerPitchesTotal = apps.filter((a: any) => isEmployerPitch(a))
    const employerPitches24h = employerPitchesTotal.filter(
      (a: any) => new Date(a.created_at || 0).getTime() >= oneDayAgoMs
    )

    // Stage 1: Reached The Introduction Handshake
    const isStage1Reached = (a: any) => {
      const st = String(a.status || "").toLowerCase()
      const hasMessages =
        Array.isArray(a.match_data?.messages) && a.match_data.messages.length > 0
      return (
        Boolean(a.is_revealed) ||
        hasMessages ||
        ["stage_1", "stage1", "accepted", "interviewing", "shortlisted", "unlocked", "revealed", "active_thread"].includes(st)
      )
    }

    // Stage 2: Reached Full Resume & Contact Vault Release
    const isStage2Reached = (a: any) => {
      const st = String(a.status || "").toLowerCase()
      return Boolean(a.is_revealed) || ["stage_2", "stage2", "revealed", "hired"].includes(st)
    }

    const stage1Total = apps.filter(isStage1Reached)
    const stage1_24h = stage1Total.filter(
      (a: any) =>
        new Date(a.updated_at || a.created_at || 0).getTime() >= oneDayAgoMs
    )

    const stage2Total = apps.filter(isStage2Reached)
    const stage2_24h = stage2Total.filter(
      (a: any) =>
        new Date(a.updated_at || a.created_at || 0).getTime() >= oneDayAgoMs
    )

    // 4. Support Requests, Feedback Items & System Health from Ops Vault
    const workItems = Array.isArray(vault.work_items) ? vault.work_items : []
    const flags = Array.isArray(vault.behavioral_flags) ? vault.behavioral_flags : []

    const isSupportTicket = (w: any) =>
      w.work_item_type === "Support_Ticket" || String(w.id || "").startsWith("TKT-")
    const isFeedbackItem = (w: any) =>
      w.work_item_type === "Bug_Defect" ||
      w.work_item_type === "Feature_Request" ||
      String(w.id || "").startsWith("FB-")

    const newSupport24h = workItems.filter(
      (w: any) =>
        isSupportTicket(w) &&
        new Date(w.created_at || 0).getTime() >= oneDayAgoMs
    )
    const openSupportTotal = workItems.filter(
      (w: any) => isSupportTicket(w) && w.state === "open"
    )

    const newFeedback24h = workItems.filter(
      (w: any) =>
        isFeedbackItem(w) &&
        new Date(w.created_at || 0).getTime() >= oneDayAgoMs
    )
    const openFeedbackTotal = workItems.filter(
      (w: any) => isFeedbackItem(w) && w.state === "open"
    )

    const openOutages = workItems.filter(
      (w: any) => w.work_item_type === "System_Outage" && w.state === "open"
    )
    const openFlags = flags.filter((f: any) => f.status === "open")
    const cb = vault.monitor_meta?.identity_circuit_breaker || {}
    const stripeIdentityToday =
      cb.date === todayDateStr ? Number(cb.global_today_count || 0) : 0

    const healthBannerColor = openOutages.length === 0 ? "#10b981" : "#f43f5e"
    const healthBannerText =
      openOutages.length === 0
        ? "ALL SYSTEMS HEALTHY • 0 ACTIVE OUTAGES"
        : `⚠️ ${openOutages.length} ACTIVE SYSTEM OUTAGE(S) REQUIRE ATTENTION`

    const dateLabel = new Date(now).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Chicago",
    })

    const recentTicketsHtml =
      newSupport24h.length === 0 && newFeedback24h.length === 0
        ? `<div style="color: #94a3b8; font-size: 13px; padding: 10px 0;">No new support tickets or feedback items opened in the last 24 hours.</div>`
        : [...newSupport24h, ...newFeedback24h]
            .slice(0, 10)
            .map(
              (item: any) => `
              <div style="padding: 10px 12px; background: #020617; border: 1px solid #1e293b; border-radius: 8px; margin-bottom: 8px;">
                <div style="font-size: 12px; font-weight: 800; color: #38bdf8;">
                  [${item.id}] ${item.work_item_type.replace("_", " ")} • <span style="color: ${item.state === "open" ? "#fbbf24" : "#34d399"};">${String(item.state).toUpperCase()}</span>
                </div>
                <div style="font-size: 13px; color: #f8fafc; font-weight: 600; margin-top: 2px;">${item.subject}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">From: ${item.reporter_email || "Platform User"} • Area: ${item.platform_area || "General"}</div>
              </div>`
            )
            .join("")

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; background-color: #090d16; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 24px 28px; border-bottom: 1px solid #1e293b;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #f97316;">
            SpecialSauce.io™ • Daily Executive Briefing
          </div>
          <h1 style="margin: 6px 0 4px 0; font-size: 22px; font-weight: 900; color: #ffffff;">
            10,000-Foot Platform Pulse — ${dateLabel}
          </h1>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Automated 24-Hour Operational Summary &amp; Cumulative Marketplace Telemetry
          </p>
        </div>

        <div style="background-color: ${openOutages.length === 0 ? "#064e3b" : "#881337"}; color: #ffffff; padding: 10px 28px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; border-bottom: 1px solid ${healthBannerColor};">
          ● ${healthBannerText}
        </div>

        <div style="padding: 24px 28px;">
          <!-- SECTION 1: MEMBERS BY PLAN -->
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; margin-bottom: 10px;">
            1. New Members &amp; Accounts By Plan (Last 24h vs. Total)
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <thead>
              <tr style="background: #1e293b; color: #cbd5e1; font-size: 11px; text-align: left;">
                <th style="padding: 10px 14px;">Segment / Plan Tier</th>
                <th style="padding: 10px 14px; text-align: right;">New (24h)</th>
                <th style="padding: 10px 14px; text-align: right;">All-Time Total</th>
              </tr>
            </thead>
            <tbody style="font-size: 13px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Professionals — Explorer ($5 ID Pass)</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${candTiers24h.Explorer}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${candTiersTotal.Explorer}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Professionals — Professional</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${candTiers24h.Professional}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${candTiersTotal.Professional}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Professionals — Prestige</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${candTiers24h.Prestige}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${candTiersTotal.Prestige}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155; background: #020617;">
                <td style="padding: 9px 14px; font-weight: 800; color: #38bdf8;">Total Professionals (${verifiedCandidatesTotal} Stripe ID Verified)</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">+${newCandidates24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">${candidates.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employers — Verification Pass (Sandbox)</td>
                <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-weight: 800;">+${orgTiers24h.Sandbox}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${orgTiersTotal.Sandbox}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employers — Starter</td>
                <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-weight: 800;">+${orgTiers24h.Starter}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${orgTiersTotal.Starter}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employers — Growth</td>
                <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-weight: 800;">+${orgTiers24h.Growth}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${orgTiersTotal.Growth}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employers — Enterprise</td>
                <td style="padding: 9px 14px; text-align: right; color: #fbbf24; font-weight: 800;">+${orgTiers24h.Enterprise}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${orgTiersTotal.Enterprise}</td>
              </tr>
              <tr style="background: #020617;">
                <td style="padding: 9px 14px; font-weight: 800; color: #f97316;">Total Employer Orgs (${verifiedOrgsTotal} DNS Verified)</td>
                <td style="padding: 9px 14px; text-align: right; color: #f97316; font-weight: 900;">+${newOrgs24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #f97316; font-weight: 900;">${orgs.length}</td>
              </tr>
            </tbody>
          </table>

          <!-- SECTION 2: MARKETPLACE & 2-STAGE PRIVACY HANDSHAKE FUNNEL -->
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #f97316; margin-bottom: 10px;">
            2. Marketplace Velocity &amp; 2-Stage Privacy Handshake Funnel
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <thead>
              <tr style="background: #1e293b; color: #cbd5e1; font-size: 11px; text-align: left;">
                <th style="padding: 10px 14px;">Funnel Stage / Activity</th>
                <th style="padding: 10px 14px; text-align: right;">Last 24h</th>
                <th style="padding: 10px 14px; text-align: right;">Cumulative</th>
              </tr>
            </thead>
            <tbody style="font-size: 13px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Protected Roles Posted (Active Marketplace Roles)</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${newJobs24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${activeJobs.length} active (${jobs.length} total)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Outbound Protected Applications Submitted</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${candidateApps24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${candidateAppsTotal.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employer Professional Invitations Sent</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${employerPitches24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${employerPitchesTotal.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b; background: #0c1322;">
                <td style="padding: 9px 14px; font-weight: 800; color: #38bdf8;">🔒 Reached Stage 1 (The Introduction Handshake)</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">+${stage1_24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">${stage1Total.length}</td>
              </tr>
              <tr style="background: #0c1322;">
                <td style="padding: 9px 14px; font-weight: 800; color: #c084fc;">🔓 Reached Stage 2 (Full Resume &amp; Contact Vault Released)</td>
                <td style="padding: 9px 14px; text-align: right; color: #c084fc; font-weight: 900;">+${stage2_24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #c084fc; font-weight: 900;">${stage2Total.length}</td>
              </tr>
            </tbody>
          </table>

          <!-- SECTION 3: SUPPORT, FEEDBACK & INFRASTRUCTURE -->
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #34d399; margin-bottom: 10px;">
            3. Support Desk, Feedback &amp; Infrastructure Health
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <tbody style="font-size: 13px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">New Service Requests (Support Tickets)</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 800;">+${newSupport24h.length} in 24h (${openSupportTotal.length} currently open)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">New Feedback &amp; Bug Reports Received</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 800;">+${newFeedback24h.length} in 24h (${openFeedbackTotal.length} currently open)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Trust &amp; Safety / Behavioral Flags</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 800; color: ${openFlags.length === 0 ? "#34d399" : "#f43f5e"};">${openFlags.length} open flag(s)</td>
              </tr>
              <tr>
                <td style="padding: 9px 14px; font-weight: 700;">TrueFit Score™ &amp; Stripe Circuit Breaker</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700; color: #cbd5e1;">Calib: ${latestCalib ? String(latestCalib.status || "PASSED").toUpperCase() : "PASSED"} • Stripe ID: ${stripeIdentityToday}/50 today</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">
            Recent Support &amp; Feedback Activity (Last 24h)
          </div>
          ${recentTicketsHtml}

          <div style="margin-top: 22px; padding-top: 16px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
            <div>Ops Command Center: <a href="https://ops.specialsauce.io" style="color: #38bdf8; text-decoration: none; font-weight: 700;">ops.specialsauce.io</a></div>
            <div>Generated at ${nowIso}</div>
          </div>
        </div>
      </div>
    `

    const resendKey = cleanEnv(process.env.RESEND_API_KEY)
    const targetInbox = "support@specialsauce.io"
    const dryRun = req.nextUrl.searchParams.get("dry_run") === "1"
    let emailSent = false
    let emailError = ""

    if (resendKey && !dryRun) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SpecialSauce Ops Pulse <support@specialsauce.io>",
          to: [targetInbox],
          subject: `📊 [10,000-Foot Pulse] ${dateLabel} • +${newCandidates24h.length} Pros, +${newOrgs24h.length} Orgs, ${openSupportTotal.length} Open Tickets`,
          html,
        }),
      })
      emailSent = emailRes.ok
      if (!emailRes.ok) {
        emailError = await emailRes.text().catch(() => "Resend error")
      }
    }

    return NextResponse.json({
      ok: true,
      generated_at: nowIso,
      recipient: targetInbox,
      dry_run: dryRun,
      email_sent: emailSent,
      email_error: emailError || undefined,
      summary: {
        professionals: { total: candidates.length, new_24h: newCandidates24h.length, verified: verifiedCandidatesTotal, by_tier: candTiersTotal },
        organizations: { total: orgs.length, new_24h: newOrgs24h.length, verified: verifiedOrgsTotal, by_tier: orgTiersTotal },
        marketplace: {
          jobs_active: activeJobs.length,
          jobs_total: jobs.length,
          jobs_new_24h: newJobs24h.length,
          applications_total: candidateAppsTotal.length,
          applications_24h: candidateApps24h.length,
          employer_pitches_total: employerPitchesTotal.length,
          employer_pitches_24h: employerPitches24h.length,
          stage1_total: stage1Total.length,
          stage1_24h: stage1_24h.length,
          stage2_total: stage2Total.length,
          stage2_24h: stage2_24h.length,
        },
        ops: {
          support_new_24h: newSupport24h.length,
          support_open: openSupportTotal.length,
          feedback_new_24h: newFeedback24h.length,
          feedback_open: openFeedbackTotal.length,
          open_outages: openOutages.length,
          open_flags: openFlags.length,
          stripe_identity_today: stripeIdentityToday,
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate daily digest" },
      { status: 500 }
    )
  }
}
