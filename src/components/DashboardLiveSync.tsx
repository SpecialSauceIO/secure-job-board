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

  // Card badges update automatically via router.refresh(); no redundant top banner needed
  return null
}
