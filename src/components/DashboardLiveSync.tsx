"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { getDashboardLivePulse } from "@/app/dashboard/messaging-actions"

function playDashboardChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.08, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.18)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.11)
    gain2.gain.setValueAtTime(0.09, ctx.currentTime + 0.11)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.11)
    osc2.stop(ctx.currentTime + 0.42)
  } catch {
    // Ignore if autoplay policy blocks audio before first click
  }
}

export default function DashboardLiveSync() {
  const router = useRouter()
  const prevSigRef = useRef<string | null>(null)
  const prevUnreadRef = useRef<number | null>(null)

  const [pulseState, setPulseState] = useState<{
    role: "employer" | "candidate" | "anon"
    totalUnreadMessages: number
    primaryUnreadCount: number
    secondaryUnreadCount: number
    pendingActionCount: number
  } | null>(null)

  useEffect(() => {
    let mounted = true

    const checkPulse = async () => {
      try {
        const res = await getDashboardLivePulse()
        if (!mounted || !res) return

        setPulseState({
          role: res.role || "anon",
          totalUnreadMessages: res.totalUnreadMessages || 0,
          primaryUnreadCount: res.primaryUnreadCount || 0,
          secondaryUnreadCount: res.secondaryUnreadCount || 0,
          pendingActionCount: res.pendingActionCount || 0,
        })

        if (
          prevUnreadRef.current !== null &&
          res.totalUnreadMessages > prevUnreadRef.current
        ) {
          playDashboardChime()
        }

        if (
          prevSigRef.current !== null &&
          prevSigRef.current !== res.signature
        ) {
          router.refresh()
        }

        prevSigRef.current = res.signature
        prevUnreadRef.current = res.totalUnreadMessages
      } catch {
        // Ignore transient network hiccups
      }
    }

    checkPulse()

    const supabase = createClient()
    const channel = supabase
      .channel("ss-dashboard-global-sync")
      .on("broadcast", { event: "dashboard-update" }, () => {
        checkPulse()
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        () => {
          checkPulse()
        }
      )
      .subscribe()

    const intervalId = setInterval(() => {
      checkPulse()
    }, 3500)

    return () => {
      mounted = false
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [router])

  if (!pulseState || pulseState.totalUnreadMessages <= 0) {
    return null
  }

  const isEmployer = pulseState.role === "employer"
  const inboundOrAppUnread = pulseState.primaryUnreadCount
  const pitchUnread = pulseState.secondaryUnreadCount

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
          {pulseState.totalUnreadMessages} Unread
        </span>
        <span className="font-extrabold text-slate-900">
          {isEmployer
            ? 'Candidate reply waiting in your pipeline'
            : 'Employer message waiting in your thread'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isEmployer ? (
          <>
            {inboundOrAppUnread > 0 && (
              <Link
                href="/dashboard/employer/applications"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors"
              >
                Inbound Applications ({inboundOrAppUnread}) →
              </Link>
            )}
            {pitchUnread > 0 && (
              <Link
                href="/dashboard/employer/pitches"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors"
              >
                Outbound Pitches ({pitchUnread}) →
              </Link>
            )}
          </>
        ) : (
          <>
            {inboundOrAppUnread > 0 && (
              <Link
                href="/dashboard/applications"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors"
              >
                Outbound Applications ({inboundOrAppUnread}) →
              </Link>
            )}
            {pitchUnread > 0 && (
              <Link
                href="/dashboard/requests"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors"
              >
                Inbound Pitches ({pitchUnread}) →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
