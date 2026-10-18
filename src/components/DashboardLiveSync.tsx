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
    <div className="rounded-2xl border-2 border-indigo-600 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-xl">
          💬
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
              {pulseState.totalUnreadMessages} Unread {pulseState.totalUnreadMessages === 1 ? "Message" : "Messages"}
            </span>
            <h2 className="text-sm sm:text-base font-black text-white">
              {isEmployer
                ? "Candidate Reply Waiting in Your Pipeline"
                : "Employer Message Waiting in Your Thread"}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {isEmployer
              ? `You have ${inboundOrAppUnread > 0 ? `${inboundOrAppUnread} unread in Inbound Applications` : ""}${inboundOrAppUnread > 0 && pitchUnread > 0 ? " and " : ""}${pitchUnread > 0 ? `${pitchUnread} unread in Sent Pitches` : ""}. Open the thread to respond.`
              : `You have ${inboundOrAppUnread > 0 ? `${inboundOrAppUnread} unread in My Applications` : ""}${inboundOrAppUnread > 0 && pitchUnread > 0 ? " and " : ""}${pitchUnread > 0 ? `${pitchUnread} unread in Employer Pitches` : ""}. Open the thread to reply.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {isEmployer ? (
          <>
            {inboundOrAppUnread > 0 && (
              <Link
                href="/dashboard/employer/applications"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors shadow-sm"
              >
                Open Inbound Messages ({inboundOrAppUnread}) →
              </Link>
            )}
            {pitchUnread > 0 && (
              <Link
                href="/dashboard/employer/pitches"
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black transition-colors shadow-sm"
              >
                Open Pitch Replies ({pitchUnread}) →
              </Link>
            )}
          </>
        ) : (
          <>
            {inboundOrAppUnread > 0 && (
              <Link
                href="/dashboard/applications"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors shadow-sm"
              >
                Open Application Thread ({inboundOrAppUnread}) →
              </Link>
            )}
            {pitchUnread > 0 && (
              <Link
                href="/dashboard/requests"
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black transition-colors shadow-sm"
              >
                Open Employer Pitch ({pitchUnread}) →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
