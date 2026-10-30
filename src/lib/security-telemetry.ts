import {
  getOpsServiceClient,
  loadMergedOpsVault,
  saveMergedOpsVault,
  pushToOpsControlPlane,
} from "@/lib/ops-bridge"

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
])

export async function recordHandshakeTelemetry(params: {
  handshakeId: string
  label: string
  platformArea: string
  ok: boolean
  latencyMs?: number
  errorDetail?: string
}) {
  try {
    const client = getOpsServiceClient()
    if (!client) return
    const vault = await loadMergedOpsVault(client)
    const nowIso = new Date().toISOString()

    const handshakes =
      vault.monitor_meta?.handshakes && typeof vault.monitor_meta.handshakes === "object"
        ? vault.monitor_meta.handshakes
        : {}

    const prev = handshakes[params.handshakeId] || {
      id: params.handshakeId,
      label: params.label,
      platform_area: params.platformArea,
      success_count: 0,
      error_count: 0,
    }

    handshakes[params.handshakeId] = {
      ...prev,
      label: params.label,
      platform_area: params.platformArea,
      status: params.ok ? "healthy" : "critical",
      last_checked_at: nowIso,
      last_latency_ms: params.latencyMs ?? prev.last_latency_ms ?? 0,
      success_count: (prev.success_count || 0) + (params.ok ? 1 : 0),
      error_count: (prev.error_count || 0) + (params.ok ? 0 : 1),
      last_error: params.ok ? null : params.errorDetail || "Handshake failure",
    }

    vault.monitor_meta = {
      ...vault.monitor_meta,
      handshakes,
    }

    if (!params.ok) {
      const existingOutage = vault.work_items.find(
        (w: any) =>
          w.state === "open" &&
          w.work_item_type === "System_Outage" &&
          w.platform_area === params.platformArea
      )

      if (!existingOutage) {
        const incId = `INC-${Date.now().toString().slice(-6)}`
        const openAreaChildren = vault.work_items.filter(
          (w: any) =>
            w.state === "open" &&
            w.work_item_type !== "System_Outage" &&
            w.work_item_type !== "Security_Alert" &&
            w.platform_area === params.platformArea &&
            !w.parent_ticket_id
        )
        const childIds = openAreaChildren.map((c: any) => String(c.id))
        for (const child of openAreaChildren) {
          child.parent_ticket_id = incId
        }

        vault.work_items.unshift({
          id: incId,
          work_item_type: "System_Outage",
          state: "open",
          status: "new",
          priority: "P0_Critical",
          owned_by: "Steve Briley (Founder / Lead Ops)",
          subject: `🚨 [OUTAGE DETECTED] ${params.label} Handshake Failure`,
          category: "Technical Issue / Bug Report",
          platform_area: params.platformArea,
          root_cause: "Confirmed Bug / Technical Defect",
          related_ref_id: params.handshakeId,
          account_tier: "SYSTEM WATCHDOG",
          description: `Real-time handshake monitor detected a failure in "${params.label}" (${params.platformArea}).\n\nDiagnostic Error: ${
            params.errorDetail || "Unexpected error"
          }\nAuto-Linked Open Area Tickets (${childIds.length}): ${
            childIds.join(", ") || "None"
          }\nDetected At: ${nowIso}`,
          reporter_user_id: "system-watchdog",
          reporter_name: "Special Sauce Watchdog",
          reporter_email: "support@specialsauce.io",
          reporter_role: "SYSTEM",
          organization_context: "Automated Handshake Telemetry",
          page_url: "/api/ops-health",
          user_agent: "SpecialSauce-Watchdog/1.0",
          attachments: [],
          parent_ticket_id: null,
          child_ticket_ids: childIds,
          created_at: nowIso,
          updated_at: nowIso,
          closed_at: null,
          thread: [],
        })
      } else {
        existingOutage.updated_at = nowIso
        existingOutage.thread = Array.isArray(existingOutage.thread)
          ? existingOutage.thread
          : []
        existingOutage.thread.push({
          id: `err-${Date.now()}`,
          author: "Handshake Watchdog",
          direction: "internal_note",
          text: `Additional failure in ${params.label}: ${params.errorDetail || "Failed"}`,
          created_at: nowIso,
        })
      }
    }

    await saveMergedOpsVault(client, vault)
  } catch {}
}

export async function raiseSecurityAlertAndFlag(params: {
  flagType:
    | "Prompt_Injection_Suspected"
    | "Phishing_Or_OffPlatform_Lure"
    | "Silent_Unlock_Harvesting_Cap"
    | "Domain_Verification_Mismatch"
    | "Manual_Trust_Audit"
  severity: "high" | "medium" | "low"
  actorEmail: string
  actorRole: "candidate" | "employer" | "unknown"
  userId?: string | null
  organizationId?: string | null
  platformArea: string
  summary: string
  evidenceSnippet: string
  createSecTicket?: boolean
}) {
  const secId = `SEC-${Date.now().toString().slice(-6)}`
  const flagId = `FLG-${Date.now().toString().slice(-6)}`

  await pushToOpsControlPlane({
    event_type: "behavioral_flag",
    id: flagId,
    severity: params.severity,
    flag_type: params.flagType,
    user_id: params.userId || null,
    organization_id: params.organizationId || null,
    actor_email: params.actorEmail,
    actor_role: params.actorRole,
    summary: params.summary,
    evidence_snippet: params.evidenceSnippet.slice(0, 300),
  })

  if (params.createSecTicket !== false) {
    await pushToOpsControlPlane({
      event_type: "work_item",
      id: secId,
      work_item_type: "Security_Alert",
      state: "open",
      status: "new",
      priority: params.severity === "high" ? "P0_Critical" : "P1_High",
      owned_by: "Steve Briley (Founder / Lead Ops)",
      subject: `🛡️ [SECURITY ALERT] ${params.summary}`,
      category: "Security & Trust Guardrail",
      platform_area: params.platformArea,
      root_cause: "Account / Access Assistance",
      related_ref_id: flagId,
      account_tier: `${params.actorRole.toUpperCase()} • SECURITY WATCH`,
      description: `Automated Bad-Actor Telemetry tripped a ${params.severity.toUpperCase()} severity alert.\n\nActor: ${
        params.actorEmail
      } (ID: ${params.userId || params.organizationId || "N/A"})\nFlag Type: ${
        params.flagType
      }\nLinked Behavioral Flag: ${flagId}\n\nEvidence / Payload Snippet:\n${
        params.evidenceSnippet
      }`,
      reporter_user_id: params.userId || "security-sentinel",
      reporter_name: "Security Sentinel",
      reporter_email: params.actorEmail || "security@specialsauce.io",
      reporter_role: params.actorRole.toUpperCase(),
      organization_context: params.organizationId || "Security Telemetry",
      page_url: "/dashboard",
    })
  }
}

export async function checkAndRecordStripeIdentityCircuitBreaker(params: {
  userId: string
  userEmail: string
  candidateTier: string
  isAlreadyVerified: boolean
}): Promise<{ allowed: boolean; reason?: string }> {
  if (params.isAlreadyVerified) {
    return {
      allowed: false,
      reason: "Your identity is already verified. No additional verification session is needed.",
    }
  }

  const tierLower = String(params.candidateTier || "").toLowerCase()
  if (
    tierLower !== "explorer" &&
    tierLower !== "professional" &&
    tierLower !== "prestige" &&
    tierLower !== "pro" &&
    tierLower !== "trial" &&
    tierLower !== "employer" &&
    tierLower !== "starter" &&
    tierLower !== "growth" &&
    tierLower !== "enterprise"
  ) {
    await raiseSecurityAlertAndFlag({
      flagType: "Manual_Trust_Audit",
      severity: "medium",
      actorEmail: params.userEmail,
      actorRole: "candidate",
      userId: params.userId,
      platformArea: "Stripe Identity Verification (Professional)",
      summary: "Blocked unsubscribed candidate attempt to initiate Stripe Identity session",
      evidenceSnippet: `User ${params.userEmail} on tier="${tierLower}" attempted to trigger /api/identity/create-session without an active subscription.`,
      createSecTicket: false,
    })
    return {
      allowed: false,
      reason:
        "1-Time Stripe Identity Verification unlocks automatically as soon as you complete your $5 One-Time Explorer Verification Pass (or activate Professional $12/mo or Prestige $19/mo) on your Billing page.",
    }
  }

  const client = getOpsServiceClient()
  if (!client) return { allowed: true }

  const vault = await loadMergedOpsVault(client)
  const todayKey = new Date().toISOString().slice(0, 10)
  const cb = vault.monitor_meta?.identity_circuit_breaker || {
    date: todayKey,
    global_today_count: 0,
    user_daily: {},
    user_lifetime: {},
  }

  if (cb.date !== todayKey) {
    cb.date = todayKey
    cb.global_today_count = 0
    cb.user_daily = {}
  }

  const userTodayCount = Number(cb.user_daily?.[params.userId] || 0)
  const userLifetimeCount = Number(cb.user_lifetime?.[params.userId] || 0)
  const globalTodayCount = Number(cb.global_today_count || 0)

  if (globalTodayCount >= 50) {
    await raiseSecurityAlertAndFlag({
      flagType: "Manual_Trust_Audit",
      severity: "high",
      actorEmail: params.userEmail,
      actorRole: "candidate",
      userId: params.userId,
      platformArea: "Stripe Identity Verification (Professional)",
      summary: "GLOBAL CIRCUIT BREAKER TRIPPED: 50/day Stripe Identity limit reached",
      evidenceSnippet: `Global daily cap (50/day) reached. Blocked request from ${params.userEmail}.`,
      createSecTicket: true,
    })
    return {
      allowed: false,
      reason:
        "Daily verification capacity reached. Please contact Special Sauce Support for priority verification assistance.",
    }
  }

  if (userLifetimeCount >= 2) {
    await raiseSecurityAlertAndFlag({
      flagType: "Manual_Trust_Audit",
      severity: "high",
      actorEmail: params.userEmail,
      actorRole: "candidate",
      userId: params.userId,
      platformArea: "Stripe Identity Verification (Professional)",
      summary: "Per-Account Lifetime Circuit Breaker (2/account) tripped on Stripe Identity",
      evidenceSnippet: `Professional ${params.userEmail} (${params.userId}) attempted a 3rd lifetime Stripe Identity session.`,
      createSecTicket: true,
    })
    return {
      allowed: false,
      reason:
        "Maximum verification attempts (2 per account) reached. Please open a Support Ticket so our team can manually review your verification.",
    }
  }

  if (userTodayCount >= 1) {
    await raiseSecurityAlertAndFlag({
      flagType: "Manual_Trust_Audit",
      severity: "medium",
      actorEmail: params.userEmail,
      actorRole: "candidate",
      userId: params.userId,
      platformArea: "Stripe Identity Verification (Professional)",
      summary: "Per-User Daily Circuit Breaker (1/day) tripped on Stripe Identity",
      evidenceSnippet: `Professional ${params.userEmail} attempted multiple Stripe Identity sessions within 24 hours.`,
      createSecTicket: false,
    })
    return {
      allowed: false,
      reason:
        "You can initiate at most 1 identity verification session per 24 hours. Please complete your existing session or contact support.",
    }
  }

  cb.global_today_count = globalTodayCount + 1
  cb.user_daily[params.userId] = userTodayCount + 1
  cb.user_lifetime[params.userId] = userLifetimeCount + 1

  vault.monitor_meta = {
    ...vault.monitor_meta,
    identity_circuit_breaker: cb,
  }
  await saveMergedOpsVault(client, vault)

  return { allowed: true }
}

export async function inspectResumeAndTextForBadActorPayloads(params: {
  userId: string
  userEmail: string
  actorRole: "candidate" | "employer"
  rawText?: string
  pdfBuffer?: Buffer | null
  contextLabel: string
}): Promise<{ safe: boolean; findings: string[] }> {
  const findings: string[] = []
  const text = String(params.rawText || "")

  if (params.pdfBuffer && params.pdfBuffer.length > 0) {
    const rawPdfLatin = params.pdfBuffer.toString("latin1")
    if (/\/JavaScript\b|\/JS\b|\/Launch\b|\/OpenAction\b|\/RichMedia\b/i.test(rawPdfLatin)) {
      findings.push(
        "Executable PDF script tag (/JavaScript, /OpenAction, or /Launch) embedded inside uploaded resume binary"
      )
    }
  }

  if (
    /ignore\s+(all\s+)?previous\s+instructions|disregard\s+(all\s+)?prior|system\s+prompt|you\s+are\s+now\s+a|overall_score\s*[:=]\s*100|rate\s+this\s+candidate\s+100|bypass\s+dealbreaker/i.test(
      text
    )
  ) {
    findings.push("Adversarial LLM Prompt-Injection override command detected in text")
  }

  const zeroWidthMatches = text.match(/[\u200B-\u200D\uFEFF\u2060]/g)
  if (zeroWidthMatches && zeroWidthMatches.length > 15) {
    findings.push(
      `Suspicious hidden zero-width Unicode steganography (${zeroWidthMatches.length} invisible characters)`
    )
  }

  if (findings.length > 0) {
    await raiseSecurityAlertAndFlag({
      flagType: "Prompt_Injection_Suspected",
      severity: "high",
      actorEmail: params.userEmail,
      actorRole: params.actorRole,
      userId: params.userId,
      platformArea: "Intro/Convo Resume & Contact Vault",
      summary: `${findings[0]} (${params.contextLabel})`,
      evidenceSnippet: `Findings: ${findings.join(" | ")} • Sample: ${text.slice(0, 220)}`,
      createSecTicket: true,
    })
  }

  return { safe: findings.length === 0, findings }
}

export async function inspectStage1TextForContactLeakOrInjection(params: {
  userId: string
  userEmail: string
  actorRole: "candidate" | "employer"
  text: string
  platformArea: string
  contextLabel: string
  isStage2Unlocked?: boolean
}): Promise<{ blocked: boolean; reason?: string }> {
  const raw = String(params.text || "").trim()
  if (!raw) return { blocked: false }

  if (
    /ignore\s+(all\s+)?previous\s+instructions|disregard\s+(all\s+)?prior|system\s+prompt|overall_score\s*[:=]\s*100|bypass\s+dealbreaker/i.test(
      raw
    )
  ) {
    await raiseSecurityAlertAndFlag({
      flagType: "Prompt_Injection_Suspected",
      severity: "high",
      actorEmail: params.userEmail,
      actorRole: params.actorRole,
      userId: params.userId,
      platformArea: params.platformArea,
      summary: `Blocked LLM Prompt Injection in ${params.contextLabel}`,
      evidenceSnippet: raw.slice(0, 240),
      createSecTicket: true,
    })
    return {
      blocked: true,
      reason:
        "Security Guardrail: Your submission contained restricted system-override keywords.",
    }
  }

  if (!params.isStage2Unlocked) {
    const obfuscatedEmail =
      /\b[A-Za-z0-9._%+-]+\s*(\[at\]|\(at\)|@|\s+at\s+)\s*[A-Za-z0-9.-]+\s*(\[dot\]|\(dot\)|\.|\s+dot\s+)\s*(com|io|net|org|co|us|me)\b/i.test(
        raw
      )
    const obfuscatedPhone =
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]{1,3}\d{3}[-.\s]{1,3}\d{4}\b/.test(raw)
    const offPlatformHandle =
      /\b(whatsapp|telegram|signal\s+me|t\.me\/|wa\.me\/|calendly\.com\/|linkedin\.com\/in\/)/i.test(
        raw
      )

    if (obfuscatedEmail || obfuscatedPhone || offPlatformHandle) {
      await raiseSecurityAlertAndFlag({
        flagType: "Phishing_Or_OffPlatform_Lure",
        severity: "high",
        actorEmail: params.userEmail,
        actorRole: params.actorRole,
        userId: params.userId,
        platformArea: params.platformArea,
        summary: `Intro/Convo Protected Vault Circumvention Attempt in ${params.contextLabel}`,
        evidenceSnippet: raw.slice(0, 240),
        createSecTicket: true,
      })
      return {
        blocked: true,
        reason:
          "Intro/Convo Vault Guardrail: Direct email addresses, phone numbers, and off-platform contact links cannot be embedded inside Introduction messages prior to The Conversation Vault Release.",
      }
    }
  }

  return { blocked: false }
}

export async function checkActionVelocityAndSpray(params: {
  actorKey: string
  actorEmail: string
  actorRole: "candidate" | "employer" | "unknown"
  actionType: "blind_apply" | "employer_pitch" | "login_failure" | "ai_fit_check" | "resume_parse"
  maxAllowedInWindow: number
  windowMinutes: number
  platformArea: string
}): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const client = getOpsServiceClient()
    if (!client) return { allowed: true }

    const vault = await loadMergedOpsVault(client)
    const now = Date.now()

    const frozenMap: Record<
      string,
      { frozen_at: string; expires_at: number; reason: string; actor_email: string }
    > =
      vault.monitor_meta?.frozen_accounts &&
      typeof vault.monitor_meta.frozen_accounts === "object"
        ? vault.monitor_meta.frozen_accounts
        : {}

    const activeFreeze = frozenMap[params.actorKey]
    if (activeFreeze && Number(activeFreeze.expires_at) > now) {
      const minsLeft = Math.max(1, Math.ceil((Number(activeFreeze.expires_at) - now) / 60000))
      return {
        allowed: false,
        reason: "Security Auto-Freeze Active: This account has been temporarily locked for " + minsLeft + " more minute(s) due to anomalous high-velocity activity (" + activeFreeze.reason + "). Please contact Special Sauce Support if you need immediate assistance.",
      }
    }

    const cutoff = now - params.windowMinutes * 60 * 1000
    const bucketKey = params.actionType + ":" + params.actorKey

    const velocityMap: Record<string, number[]> =
      vault.monitor_meta?.velocity_buckets &&
      typeof vault.monitor_meta.velocity_buckets === "object"
        ? vault.monitor_meta.velocity_buckets
        : {}

    const history = Array.isArray(velocityMap[bucketKey])
      ? velocityMap[bucketKey].filter((ts: number) => ts > cutoff)
      : []

    history.push(now)
    velocityMap[bucketKey] = history.slice(-30)

    if (history.length > params.maxAllowedInWindow) {
      const freezeDurationMinutes = 60
      frozenMap[params.actorKey] = {
        frozen_at: new Date(now).toISOString(),
        expires_at: now + freezeDurationMinutes * 60 * 1000,
        reason: params.actionType + " burst (" + history.length + " in " + params.windowMinutes + "m)",
        actor_email: params.actorEmail,
      }

      vault.monitor_meta = {
        ...vault.monitor_meta,
        velocity_buckets: velocityMap,
        frozen_accounts: frozenMap,
      }
      await saveMergedOpsVault(client, vault)

      await raiseSecurityAlertAndFlag({
        flagType: "Manual_Trust_Audit",
        severity: "high",
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        userId: params.actorKey,
        platformArea: params.platformArea,
        summary: "[AUTO-FROZEN 60M] High-Velocity " + params.actionType.toUpperCase() + " Burst (" + history.length + " actions in " + params.windowMinutes + "m)",
        evidenceSnippet: "Actor " + params.actorEmail + " triggered " + history.length + " " + params.actionType + " actions within " + params.windowMinutes + " minutes (limit: " + params.maxAllowedInWindow + "). Account automatically frozen for " + freezeDurationMinutes + " minutes.",
        createSecTicket: true,
      })

      return {
        allowed: false,
        reason: "Security Auto-Freeze Guardrail: Too many rapid " + params.actionType.replace("_", " ") + " requests detected. Your account has been temporarily frozen for 60 minutes to prevent automated abuse.",
      }
    }

    vault.monitor_meta = {
      ...vault.monitor_meta,
      velocity_buckets: velocityMap,
      frozen_accounts: frozenMap,
    }
    await saveMergedOpsVault(client, vault)
  } catch {}

  return { allowed: true }
}

export async function checkSignupAbuseAndVelocity(params: {
  email: string
  role: "candidate" | "employer"
}): Promise<{ allowed: boolean; error?: string }> {
  const cleanEmail = String(params.email || "").toLowerCase().trim()
  const domain = cleanEmail.split("@")[1] || ""

  if (!domain || DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    await raiseSecurityAlertAndFlag({
      flagType: "Phishing_Or_OffPlatform_Lure",
      severity: "medium",
      actorEmail: cleanEmail,
      actorRole: params.role,
      platformArea: "Onboarding & Authentication",
      summary: `Blocked disposable/burner email signup attempt (${domain})`,
      evidenceSnippet: `Blocked registration attempt using burner domain: ${cleanEmail}`,
      createSecTicket: false,
    })
    return {
      allowed: false,
      error: "Disposable or temporary email addresses are not permitted on Special Sauce.",
    }
  }

  try {
    const client = getOpsServiceClient()
    if (client) {
      const vault = await loadMergedOpsVault(client)
      const now = Date.now()
      const tenMinAgo = now - 10 * 60 * 1000
      const recentSignups: number[] = Array.isArray(
        vault.monitor_meta?.recent_signup_timestamps
      )
        ? vault.monitor_meta.recent_signup_timestamps.filter(
            (ts: number) => ts > tenMinAgo
          )
        : []

      recentSignups.push(now)
      vault.monitor_meta = {
        ...vault.monitor_meta,
        recent_signup_timestamps: recentSignups.slice(-50),
      }
      await saveMergedOpsVault(client, vault)

      if (recentSignups.length > 8) {
        await raiseSecurityAlertAndFlag({
          flagType: "Manual_Trust_Audit",
          severity: "high",
          actorEmail: cleanEmail,
          actorRole: params.role,
          platformArea: "Onboarding & Authentication",
          summary: `High-velocity account creation burst detected (${recentSignups.length} signups in 10m)`,
          evidenceSnippet: `Latest signup in burst: ${cleanEmail} (${params.role})`,
          createSecTicket: true,
        })
      }
    }
  } catch {}

  return { allowed: true }
}
