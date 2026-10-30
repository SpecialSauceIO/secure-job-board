import { NextRequest, NextResponse } from "next/server"
import { getOpsServiceClient, loadMergedOpsVault } from "@/lib/ops-bridge"

export const dynamic = "force-dynamic"

function cleanEnv(val?: string | null): string {
  if (!val) return ""
  return val.trim().replace(/^["']+|["']+$/g, "").trim()
}

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

    const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : []
    const orgs = Array.isArray(orgsRes.data) ? orgsRes.data : []
    const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : []
    const apps = Array.isArray(appsRes.data) ? appsRes.data : []
    const latestCalib = calibRes.data?.[0] || null
    const authUsers = Array.isArray((authUsersRes as any)?.data?.users)
      ? (authUsersRes as any).data.users
      : []

    const userMetaMap = new Map<string, any>()
    for (const u of authUsers) {
      if (u?.id) {
        userMetaMap.set(u.id, {
          ...(u.user_metadata || {}),
          ...(u.app_metadata || {}),
        })
      }
    }

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

    const classifyOrgTier = (o: any): "Starter" | "Growth" | "Enterprise" => {
      const raw = String(o.subscription_tier || "starter").toLowerCase()
      if (raw.includes("enterprise")) return "Enterprise"
      if (raw.includes("growth") || raw.includes("scale")) return "Growth"
      return "Starter"
    }

    const orgTiersTotal = { Starter: 0, Growth: 0, Enterprise: 0 }
    const orgTiers24h = { Starter: 0, Growth: 0, Enterprise: 0 }
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

    // 3. Jobs, Applications, Pitches & Level 1 / Level 2 Funnel
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

    // Level 1: Reached Stage 1 Encrypted Handshake / Mutual Interest
    const isLevel1Reached = (a: any) => {
      const st = String(a.status || "").toLowerCase()
      const hasMessages =
        Array.isArray(a.match_data?.messages) && a.match_data.messages.length > 0
      return (
        Boolean(a.is_revealed) ||
        hasMessages ||
        ["stage_1", "stage1", "accepted", "interviewing", "shortlisted", "unlocked", "revealed", "active_thread"].includes(st)
      )
    }

    // Level 2: Reached Stage 2 Contact & Resume Vault Release
    const isLevel2Reached = (a: any) => {
      const st = String(a.status || "").toLowerCase()
      return Boolean(a.is_revealed) || ["stage_2", "stage2", "revealed", "hired"].includes(st)
    }

    const level1Total = apps.filter(isLevel1Reached)
    const level1_24h = level1Total.filter(
      (a: any) =>
        new Date(a.updated_at || a.created_at || 0).getTime() >= oneDayAgoMs
    )

    const level2Total = apps.filter(isLevel2Reached)
    const level2_24h = level2Total.filter(
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
    const stripeIdentityToday =
      vault.monitor_meta?.identity_circuit_breaker?.global_today_count || 0

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

        <div style="background-color: ${ openOutages.length === 0 ? "#064e3b" : "#881337" }; color: #ffffff; padding: 10px 28px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; border-bottom: 1px solid ${healthBannerColor};">
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
                <td style="padding: 9px 14px; font-weight: 700;">Professionals — Explorer (Free)</td>
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

          <!-- SECTION 2: MARKETPLACE & LEVEL 1 / LEVEL 2 FUNNEL -->
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #f97316; margin-bottom: 10px;">
            2. Marketplace Velocity &amp; Double-Blind Handshake Funnel
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
                <td style="padding: 9px 14px; font-weight: 700;">Jobs Posted (Active Marketplace Roles)</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${newJobs24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${activeJobs.length} active (${jobs.length} total)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Professional Applications Submitted</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${candidateApps24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${candidateAppsTotal.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Employer Professional Invitations Sent</td>
                <td style="padding: 9px 14px; text-align: right; color: #34d399; font-weight: 800;">+${employerPitches24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700;">${employerPitchesTotal.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b; background: #020617;">
                <td style="padding: 9px 14px; font-weight: 800; color: #38bdf8;">🔒 Reached Level 1 (The Introduction Handshake)</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">+${level1_24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #38bdf8; font-weight: 900;">${level1Total.length}</td>
              </tr>
              <tr style="background: #020617;">
                <td style="padding: 9px 14px; font-weight: 800; color: #a855f7;">🔓 Reached Level 2 (Full Resume &amp; Contact Vault Released)</td>
                <td style="padding: 9px 14px; text-align: right; color: #a855f7; font-weight: 900;">+${level2_24h.length}</td>
                <td style="padding: 9px 14px; text-align: right; color: #a855f7; font-weight: 900;">${level2Total.length}</td>
              </tr>
            </tbody>
          </table>

          <!-- SECTION 3: SUPPORT, FEEDBACK & SYSTEM HEALTH -->
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #34d399; margin-bottom: 10px;">
            3. Support Desk, Feedback &amp; Infrastructure Health
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <tbody style="font-size: 13px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">New Service Requests (Support Tickets)</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 800; color: #ffffff;">+${newSupport24h.length} in 24h (${openSupportTotal.length} currently open)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">New Feedback &amp; Bug Reports Received</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 800; color: #ffffff;">+${newFeedback24h.length} in 24h (${openFeedbackTotal.length} currently open)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 9px 14px; font-weight: 700;">Trust &amp; Safety / Behavioral Flags</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700; color: ${openFlags.length > 0 ? "#fbbf24" : "#34d399"};">${openFlags.length} open flag(s)</td>
              </tr>
              <tr>
                <td style="padding: 9px 14px; font-weight: 700;">TrueFit Score™ &amp; Stripe Circuit Breaker</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: 700; color: #cbd5e1;">Calib: ${latestCalib ? String(latestCalib.status).toUpperCase() : "ARMED"} • Stripe ID: ${stripeIdentityToday}/50 today</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">
            New Tickets &amp; Feedback Opened (Last 24 Hours):
          </div>
          ${recentTicketsHtml}

          <div style="margin-top: 22px; text-align: center;">
            <a href="https://ops.specialsauce.io" style="display: inline-block; padding: 12px 24px; background: #f97316; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; border-radius: 10px;">
              Open Special Sauce™ Ops Command Center →
            </a>
          </div>
        </div>

        <div style="background: #020617; padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
          Delivered automatically to steve@specialsauce.io &amp; rochelle@specialsauce.io • Generated at ${nowIso}
        </div>
      </div>
    `

    const resendKey = cleanEnv(process.env.RESEND_API_KEY)
    const fromEmail = cleanEnv(process.env.RESEND_FROM_EMAIL)
    const sender =
      fromEmail && !fromEmail.includes("resend.dev")
        ? fromEmail
        : "Special Sauce Ops <support@specialsauce.io>"
    const queryTo = cleanEnv(req.nextUrl.searchParams.get("to"))
    const envTo = cleanEnv(process.env.OPS_DAILY_DIGEST_EMAIL)
    const recipients = queryTo
      ? queryTo.split(",").map((e) => e.trim()).filter(Boolean)
      : Array.from(
          new Set([
            "steve@specialsauce.io",
            "rochelle@specialsauce.io",
            ...envTo.split(",").map((e) => e.trim()).filter(Boolean),
          ])
        )

    let emailDispatched = false
    let emailResponse: any = null

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: recipients,
          reply_to: "support@specialsauce.io",
          subject: `📊 SpecialSauce.io Daily Ops Summary (${dateLabel}) — +${newCandidates24h.length + newOrgs24h.length} Members, +${candidateApps24h.length} Apps, +${newSupport24h.length} Tickets`,
          html,
        }),
      })
      emailResponse = await res.json().catch(() => ({}))
      emailDispatched = res.ok
    }

    return NextResponse.json({
      ok: true,
      dispatched_to: recipients,
      email_dispatched: emailDispatched,
      resend_response: emailResponse,
      summary: {
        candidates: { total: candidates.length, new_24h: newCandidates24h.length, by_tier_total: candTiersTotal, by_tier_24h: candTiers24h },
        organizations: { total: orgs.length, new_24h: newOrgs24h.length, by_tier_total: orgTiersTotal, by_tier_24h: orgTiers24h },
        jobs: { active: activeJobs.length, total: jobs.length, new_24h: newJobs24h.length },
        applications: { candidate_apps_total: candidateAppsTotal.length, candidate_apps_24h: candidateApps24h.length, employer_pitches_total: employerPitchesTotal.length, employer_pitches_24h: employerPitches24h.length },
        funnel: { level1_total: level1Total.length, level1_24h: level1_24h.length, level2_total: level2Total.length, level2_24h: level2_24h.length },
        ops: { new_support_24h: newSupport24h.length, open_support: openSupportTotal.length, new_feedback_24h: newFeedback24h.length, open_feedback: openFeedbackTotal.length, open_outages: openOutages.length },
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate daily digest" },
      { status: 500 }
    )
  }
}
