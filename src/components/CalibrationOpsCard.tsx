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
  const [loading, setLoading] = useState<boolean>(true)
  const [running, setRunning] = useState<boolean>(false)
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
    } catch (err) {
      console.error("Failed to load calibration health:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLatestHealth()
  }, [fetchLatestHealth])

  const runCalibrationNow = async (withTestAlert = false) => {
    try {
      if (withTestAlert) setAlertSending(true)
      else setRunning(true)
      setBannerMsg(null)
      const url = withTestAlert
        ? "/api/cron/calibrate-matching?test_alert=1"
        : "/api/cron/calibrate-matching"
      const res = await fetch(url, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setBannerMsg("Error: " + (data?.error || "Failed to run calibration"))
        return
      }
      setCalib({
        status: data.status,
        provider_used: "openai/gpt-oss-120b",
        avg_latency_ms: data.avg_latency_ms,
        tier_scores: data.results || {},
        failures: data.failures || [],
        created_at: new Date().toISOString(),
      })
      if (withTestAlert) {
        setBannerMsg("Live 5-tier QA sweep complete & Resend alert dispatched to info@specialsauce.io!")
      } else {
        setBannerMsg("Live 5-tier QA calibration completed in " + data.avg_latency_ms + "ms avg latency.")
      }
    } catch (err: any) {
      setBannerMsg("Error triggering calibration: " + (err?.message || "Unknown error"))
    } finally {
      setRunning(false)
      setAlertSending(false)
    }
  }

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
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            5-Point AI Fit Radar Calibration &amp; Guardrail Monitor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated Monday 06:00 UTC benchmark sweep on <code className="text-indigo-300 font-mono">openai/gpt-oss-120b</code>
            {calib?.avg_latency_ms ? " • Avg Latency: " + calib.avg_latency_ms + "ms" : ""}
            {calib?.created_at ? " • Last Verified: " + new Date(calib.created_at).toLocaleString() : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => runCalibrationNow(false)}
            disabled={running || alertSending}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer shadow-sm"
          >
            {running ? "Running 5-Tier Sweep..." : "Run QA Calibration Now"}
          </button>
          <button
            type="button"
            onClick={() => runCalibrationNow(true)}
            disabled={running || alertSending}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {alertSending ? "Dispatching Alert..." : "Run + Test Email Alert"}
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
                    {item !== undefined ? item.overall + "%" : "—"}
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
    </section>
  )
}
