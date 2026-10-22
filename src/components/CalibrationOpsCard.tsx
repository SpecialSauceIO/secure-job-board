"use client"

import React, { useEffect, useState, useCallback } from "react"

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
  const [calib, setCalib] = useState<CalibrationRunRecord | null>(null)
  const [history, setHistory] = useState<CalibrationRunRecord[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [runningTier1, setRunningTier1] = useState<boolean>(false)
  const [runningQwen, setRunningQwen] = useState<boolean>(false)
  const [alertSending, setAlertSending] = useState<boolean>(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

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
    } catch (err) {
      console.error("Failed to load calibration health:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLatestHealth()
  }, [fetchLatestHealth])

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
      const usedModel = data.provider_used || (isQwen ? "qwen/qwen3.8-27b" : "openai/gpt-oss-120b")
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
              Founder Ops QA Watchdog
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
            <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
              Retention: Last 50 Runs
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            5-Point AI Fit Radar Calibration &amp; Guardrail Monitor
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
            {runningQwen ? "Running Tier 2 (Qwen)..." : "Benchmark Tier 2 (Qwen)"}
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
            className="text-slate-400 hover:text-white ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {loading && !calib ? (
        <div className="text-xs text-slate-400 py-4">Loading latest calibration telemetry from public.calibration_runs...</div>
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
