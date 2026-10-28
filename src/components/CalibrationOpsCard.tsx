"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { updateSystemStatusBannerAction } from "@/app/dashboard/status-banner-actions"
import type { SystemStatusBanner } from "@/lib/ops-bridge"

interface TierResult {
  overall: number
  expected: string
  passed: boolean
  latency_ms: number
  provider?: string
}

interface CalibrationRunRecord {
  id?: string
  status: string
  provider_used: string
  avg_latency_ms: number
  tier_scores: Record<string, TierResult>
  failures: string[]
  created_at?: string
}

const TIER_LABELS: Record<string, { label: string; subtitle: string }> = {
  TIER_1_100: { label: "Tier 1 (5/5 Reqs)", subtitle: "Exact Domain Match" },
  TIER_2_80: { label: "Tier 2 (4/5 Reqs)", subtitle: "Strong Senior Fit" },
  TIER_3_60: { label: "Tier 3 (3/5 Reqs)", subtitle: "Mid-Tier Partial Fit" },
  TIER_4_40: { label: "Tier 4 (2/5 Reqs)", subtitle: "40% Firewall Boundary" },
  TIER_5_20_BAKER: { label: "Tier 5 (0/5 Reqs)", subtitle: "Pastry Chef Mismatch" },
}

export default function CalibrationOpsCard() {
  const router = useRouter()
  const [calib, setCalib] = useState<CalibrationRunRecord | null>(null)
  const [history, setHistory] = useState<CalibrationRunRecord[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [runningTier1, setRunningTier1] = useState<boolean>(false)
  const [runningQwen, setRunningQwen] = useState<boolean>(false)
  const [alertSending, setAlertSending] = useState<boolean>(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

  // Global Incident & Outage Banner State inside Ops Dashboard
  const [liveStatusBanner, setLiveStatusBanner] = useState<SystemStatusBanner | null>(null)
  const [showBannerControls, setShowBannerControls] = useState<boolean>(true)
  const [severity, setSeverity] = useState<"info" | "degraded" | "outage">("degraded")
  const [targetRole, setTargetRole] = useState<"all" | "candidate" | "employer">("all")
  const [platformArea, setPlatformArea] = useState<string>("5-Point AI Fit Radar & Dealbreakers")
  const [bannerTitle, setBannerTitle] = useState<string>("")
  const [bannerBody, setBannerBody] = useState<string>("")
  const [savingBanner, setSavingBanner] = useState<boolean>(false)

  const fetchLatestHealth = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/ops-health", { cache: "no-store" })
      const data = await res.json()
      if (data?.latest_calibration) {
        setCalib(data.latest_calibration)
      }
      if (Array.isArray(data?.calibration_history)) {
        setHistory(data.calibration_history)
      }
      if (data?.active_status_banner) {
        const b: SystemStatusBanner = data.active_status_banner
        setLiveStatusBanner(b)
        setSeverity(b.severity || "degraded")
        setTargetRole(b.target_role || "all")
        setPlatformArea(b.platform_area || "General Platform")
        setBannerTitle(b.title || "")
        setBannerBody(b.message || "")
      } else {
        setLiveStatusBanner(null)
      }
    } catch (err) {
      console.error("Failed to load calibration health:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLatestHealth()
  }, [fetchLatestHealth])

  const handlePublishOrClearBanner = async (active: boolean) => {
    setSavingBanner(true)
    setBannerMsg(null)
    try {
      const res = await updateSystemStatusBannerAction({
        active,
        severity,
        title: bannerTitle,
        message: bannerBody,
        platform_area: platformArea,
        target_role: targetRole,
        suppress_watchdog: !active,
      })
      if (!res.ok) {
        setBannerMsg("Error: " + (res.error || "Could not update status banner"))
      } else {
        setLiveStatusBanner(res.banner)
        setBannerMsg(
          active
            ? "📣 Published Global Incident Banner to Top Navbar & Quick Feedback Widget!"
            : "✓ Global Incident Banner cleared across all user dashboards."
        )
        router.refresh()
      }
    } catch (err: any) {
      setBannerMsg("Error updating banner: " + (err?.message || "Unknown error"))
    } finally {
      setSavingBanner(false)
    }
  }

  const runCalibrationNow = async (opts: { provider?: "groq120b" | "qwen"; withTestAlert?: boolean }) => {
    const isQwen = opts.provider === "qwen"
    const withTestAlert = Boolean(opts.withTestAlert)
    try {
      if (withTestAlert) setAlertSending(true)
      else if (isQwen) setRunningQwen(true)
      else setRunningTier1(true)
      setBannerMsg(null)

      const params = new URLSearchParams()
      if (isQwen) params.set("provider", "qwen")
      if (withTestAlert) params.set("test_alert", "1")
      const qs = params.toString()
      const url = "/api/cron/calibrate-matching" + (qs ? "?" + qs : "")

      const res = await fetch(url, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setBannerMsg("Error: " + (data?.error || "Failed to run calibration"))
        return
      }
      const usedModel = data.provider_used || (isQwen ? "openai/gpt-oss-20b" : "openai/gpt-oss-120b")
      const newRecord: CalibrationRunRecord = {
        id: "live-" + Date.now(),
        status: data.status,
        provider_used: usedModel,
        avg_latency_ms: data.avg_latency_ms,
        tier_scores: data.results || {},
        failures: data.failures || [],
        created_at: new Date().toISOString(),
      }
      setCalib(newRecord)
      setHistory((prev) => [newRecord, ...prev].slice(0, 12))
      const pruneNote = data.pruned_runs > 0 ? " (Pruned " + data.pruned_runs + " old runs)" : ""
      if (withTestAlert) {
        setBannerMsg("Live 5-tier QA sweep complete on " + usedModel + " & Resend alert dispatched!" + pruneNote)
      } else {
        setBannerMsg("Live 5-tier QA sweep on " + usedModel + " completed in " + data.avg_latency_ms + "ms avg latency." + pruneNote)
      }
    } catch (err: any) {
      setBannerMsg("Error triggering calibration: " + (err?.message || "Unknown error"))
    } finally {
      setRunningTier1(false)
      setRunningQwen(false)
      setAlertSending(false)
    }
  }

  const isBusy = runningTier1 || runningQwen || alertSending
  const isPassed = calib?.status === "passed"
  const tierKeys = ["TIER_1_100", "TIER_2_80", "TIER_3_60", "TIER_4_40", "TIER_5_20_BAKER"]

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Founder Ops Control Plane &amp; QA Watchdog
            </span>
            {calib && (
              <span
                className={
                  "px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider " +
                  (isPassed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40")
                }
              >
                {isPassed ? "PASSED • ALL 5 TIERS IN BAND" : "DRIFT DETECTED"}
              </span>
            )}
            <span
              className={
                "px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider " +
                (liveStatusBanner?.active
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800")
              }
            >
              {liveStatusBanner?.active
                ? `📣 OUTAGE BANNER LIVE (${liveStatusBanner.severity.toUpperCase()})`
                : "📣 STATUS BANNER: OFF"}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Ops Incident Banner &amp; 5-Point AI Fit Calibration Monitor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Active Provider: <code className="text-indigo-300 font-mono">{calib?.provider_used || "openai/gpt-oss-120b"}</code>
            {calib?.avg_latency_ms ? " • Avg Latency: " + calib.avg_latency_ms + "ms" : ""}
            {calib?.created_at ? " • Last Verified: " + new Date(calib.created_at).toLocaleString() : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBannerControls((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
          >
            {showBannerControls ? "▾ Hide Banner Control" : "📣 Manage Outage Banner"}
          </button>
          <button
            type="button"
            onClick={() => runCalibrationNow({ provider: "groq120b" })}
            disabled={isBusy}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer shadow-sm"
          >
            {runningTier1 ? "Running Tier 1 (120B)..." : "Run Tier 1 (120B) QA"}
          </button>
          <button
            type="button"
            onClick={() => runCalibrationNow({ provider: "qwen" })}
            disabled={isBusy}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-cyan-600/90 hover:bg-cyan-500 disabled:opacity-50 text-white transition cursor-pointer shadow-sm"
          >
            {runningQwen ? "Running Tier 2 (20B)..." : "Benchmark Tier 2 (20B)"}
          </button>
          <button
            type="button"
            onClick={() => runCalibrationNow({ provider: "groq120b", withTestAlert: true })}
            disabled={isBusy}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {alertSending ? "Dispatching Alert..." : "Test Email Alert"}
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="rounded-xl bg-slate-900 border border-indigo-500/40 px-4 py-2.5 text-xs sm:text-sm text-indigo-200 flex items-center justify-between">
          <span>{bannerMsg}</span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-slate-400 hover:text-white ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* EMBEDDED OPS DASHBOARD CUSTOMER INCIDENT & OUTAGE BANNER CONTROL */}
      {showBannerControls && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>📣 Proactive Customer Incident &amp; Outage Banner Control</span>
                {liveStatusBanner?.active && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                    Currently Broadcasting ({liveStatusBanner.incident_ref || "LIVE"})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Publishes flush at the base of the top navigation bar across all user dashboards and injects a duplicate-ticket deflector into the Quick Feedback widget.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSeverity("degraded")
                  setTargetRole("all")
                  setPlatformArea("5-Point AI Fit Radar & Dealbreakers")
                  setBannerTitle("Elevated AI Match & Resume Parsing Latency")
                  setBannerBody(
                    "We are experiencing higher-than-normal latency from our upstream AI providers. Fit checks may take up to 25 seconds. Your retries and credits are 100% preserved."
                  )
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
              >
                ⚡ AI Fit / PDF Latency
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeverity("degraded")
                  setTargetRole("all")
                  setPlatformArea("Stripe Identity Verification")
                  setBannerTitle("Stripe Identity Verification Sync Delay")
                  setBannerBody(
                    "Stripe Identity verification callbacks are taking 1–2 minutes longer than usual. Click Refresh Status on your Dashboard after completing your photo ID check."
                  )
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
              >
                🪪 Stripe ID Delay
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeverity("info")
                  setTargetRole("all")
                  setPlatformArea("General Platform")
                  setBannerTitle("Scheduled Platform Maintenance Window")
                  setBannerBody(
                    "We are performing a brief zero-downtime upgrade. All active vaults, applications, and message threads remain safe."
                  )
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-bold cursor-pointer"
              >
                🛠️ Maintenance Notice
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="info">🔵 Info / Scheduled Maintenance</option>
                <option value="degraded">🟠 Degraded Performance</option>
                <option value="outage">🔴 Major Service Outage</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Target Audience
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="all">All Users (Candidates + Employers)</option>
                <option value="candidate">Candidates Only</option>
                <option value="employer">Employers Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Platform Area
              </label>
              <input
                type="text"
                value={platformArea}
                onChange={(e) => setPlatformArea(e.target.value)}
                placeholder="e.g. 5-Point AI Fit Radar"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Headline Title
              </label>
              <input
                type="text"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="e.g. Elevated AI Match & Resume Parsing Latency"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Proactive Customer Advisory Message
              </label>
              <input
                type="text"
                value={bannerBody}
                onChange={(e) => setBannerBody(e.target.value)}
                placeholder="Explain what is happening so users know they don't need to submit a ticket..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {liveStatusBanner?.active
                ? `Active Banner: "${liveStatusBanner.title}" (Updated ${new Date(liveStatusBanner.updated_at).toLocaleTimeString()})`
                : "No manual or watchdog outage banner is currently active."}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={savingBanner}
                onClick={() => handlePublishOrClearBanner(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                Clear / Turn Off Banner
              </button>
              <button
                type="button"
                disabled={savingBanner || !bannerTitle.trim()}
                onClick={() => handlePublishOrClearBanner(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {savingBanner ? "Publishing..." : "📣 Publish Live Banner →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !calib ? (
        <div className="text-xs text-slate-400 py-4">Loading latest AI scoring accuracy check...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {tierKeys.map((tKey) => {
            const item = calib?.tier_scores?.[tKey]
            const meta = TIER_LABELS[tKey] || { label: tKey, subtitle: "" }
            const tierPassed = item ? item.passed : true
            return (
              <div
                key={tKey}
                className={
                  "rounded-xl p-3.5 border transition " +
                  (tierPassed
                    ? "bg-slate-900/90 border-slate-800"
                    : "bg-rose-950/40 border-rose-500/50")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">{meta.label}</span>
                  <span
                    className={
                      "text-[10px] font-extrabold px-1.5 py-0.5 rounded " +
                      (tierPassed
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300")
                    }
                  >
                    {item ? (tierPassed ? "PASS" : "DRIFT") : "—"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{meta.subtitle}</p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    {item !== undefined ? String(item.overall).replace(/%/g, "") + "%" : "—"}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Band: {item?.expected || "—"}
                  </span>
                </div>
                {item?.latency_ms !== undefined && (
                  <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                    Latency: {item.latency_ms}ms
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{showHistory ? "▾ Hide" : "▸ View"} Recent Run History &amp; Latency Trend ({history.length} runs)</span>
          </button>

          {showHistory && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">5-Tier Curve (T1→T5)</th>
                    <th className="py-2.5 px-3">Avg Latency</th>
                    <th className="py-2.5 px-3">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((run, idx) => {
                    const curve = tierKeys
                      .map((k) => (run.tier_scores?.[k]?.overall !== undefined ? String(run.tier_scores[k].overall).replace(/%/g, "") + "%" : "—"))
                      .join(" / ")
                    const ok = run.status === "passed"
                    return (
                      <tr key={run.id || idx} className="hover:bg-slate-900/90">
                        <td className="py-2 px-3 font-mono text-slate-300">
                          {run.created_at ? new Date(run.created_at).toLocaleString() : "Just now"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={
                              "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase " +
                              (ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300")
                            }
                          >
                            {ok ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-white font-semibold">{curve}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{run.avg_latency_ms}ms</td>
                        <td className="py-2 px-3 font-mono text-indigo-300">{run.provider_used}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
