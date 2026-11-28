'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface StepDef {
  id: number
  num: string
  label: string
}

const STEPS: StepDef[] = [
  { id: 0, num: '01', label: 'ID Verified' },
  { id: 1, num: '02', label: 'Identity Hidden' },
  { id: 2, num: '03', label: 'Chat First' },
  { id: 3, num: '04', label: 'Unlock When Ready' },
]

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const rangeProgress = (p: number, start: number, end: number) =>
  clamp((p - start) / (end - start), 0, 1)

export function PrivacyHandshakeScrollStage() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const stickyRef = useRef<HTMLDivElement | null>(null)
  const beamFillRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([null, null, null, null])

  // Animated SVG internal elements driven at 60fps without React re-renders
  const checkBadgeRef = useRef<SVGGElement | null>(null)
  const checkPathRef = useRef<SVGPathElement | null>(null)
  const closedShackleRef = useRef<SVGPathElement | null>(null)
  const hiddenShieldRef = useRef<SVGCircleElement | null>(null)
  const leftBubbleRef = useRef<SVGGElement | null>(null)
  const rightBubbleRef = useRef<SVGGElement | null>(null)
  const openShackleRef = useRef<SVGPathElement | null>(null)
  const unlockRaysRef = useRef<SVGGElement | null>(null)

  const activeStageRef = useRef(0)
  const [activeStage, setActiveStage] = useState(0)

  const applyProgress = useCallback((p: number) => {
    const clamped = clamp(p, 0, 1)
    // Complete all 4 steps by 78% of scroll so 78%–100% holds the full 4-step story cleanly in view
    const s1 = rangeProgress(clamped, 0.02, 0.18)
    const s2 = rangeProgress(clamped, 0.22, 0.38)
    const s3 = rangeProgress(clamped, 0.42, 0.58)
    const s4 = rangeProgress(clamped, 0.62, 0.78)
    const stepProgress = [s1, s2, s3, s4]

    const nextStage =
      clamped < 0.21 ? 0 : clamped < 0.41 ? 1 : clamped < 0.61 ? 2 : 3

    if (nextStage !== activeStageRef.current) {
      activeStageRef.current = nextStage
      setActiveStage(nextStage)
    }

    // Left-to-right connecting beam
    if (beamFillRef.current) {
      const beamP = clamp(clamped / 0.78, 0, 1)
      beamFillRef.current.style.transform = `scaleX(${beamP.toFixed(4)})`
    }

    // Step cards scale + opacity lift as the beam reaches each icon
    cardRefs.current.forEach((card, idx) => {
      if (!card) return
      const sp = stepProgress[idx] ?? 0
      const baseOp = idx === 0 ? Math.max(0.55, sp) : 0.32 + sp * 0.68
      const liftY = (1 - sp) * 14
      const scl = 0.94 + sp * 0.06
      card.style.opacity = baseOp.toFixed(3)
      card.style.transform = `translate3d(0, ${liftY.toFixed(1)}px, 0) scale3d(${scl.toFixed(3)}, ${scl.toFixed(3)}, 1)`
    })

    // Step 1: Stamp checkmark onto ID card
    if (checkBadgeRef.current) {
      const pop = 0.5 + s1 * 0.5
      checkBadgeRef.current.style.opacity = (0.2 + s1 * 0.8).toFixed(3)
      checkBadgeRef.current.style.transform = `scale(${pop.toFixed(3)})`
    }
    if (checkPathRef.current) {
      checkPathRef.current.style.strokeDashoffset = `${((1 - s1) * 28).toFixed(1)}`
    }

    // Step 2: Padlock shackle snaps down shut
    if (closedShackleRef.current) {
      const dropY = (1 - s2) * -10
      closedShackleRef.current.style.transform = `translateY(${dropY.toFixed(1)}px)`
    }
    if (hiddenShieldRef.current) {
      hiddenShieldRef.current.style.opacity = (0.15 + s2 * 0.85).toFixed(3)
    }

    // Step 3: Two chat bubbles slide in & illuminate
    if (leftBubbleRef.current) {
      const x = (1 - s3) * -8
      leftBubbleRef.current.style.transform = `translateX(${x.toFixed(1)}px)`
      leftBubbleRef.current.style.opacity = (0.35 + s3 * 0.65).toFixed(3)
    }
    if (rightBubbleRef.current) {
      const x = (1 - s3) * 8
      const pop = 0.85 + s3 * 0.15
      rightBubbleRef.current.style.transform = `translateX(${x.toFixed(1)}px) scale(${pop.toFixed(3)})`
      rightBubbleRef.current.style.opacity = (0.15 + s3 * 0.85).toFixed(3)
    }

    // Step 4: Padlock shackle lifts & swings open in bright emerald
    if (openShackleRef.current) {
      const lift = s4 * -9
      const rot = s4 * 22
      openShackleRef.current.style.transform = `translateY(${lift.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`
    }
    if (unlockRaysRef.current) {
      unlockRaysRef.current.style.opacity = s4.toFixed(3)
      const rayScale = 0.75 + s4 * 0.25
      unlockRaysRef.current.style.transform = `scale(${rayScale.toFixed(3)})`
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let rafId = 0

    const updateScroll = () => {
      rafId = 0
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewportH = window.innerHeight || 1
      const headerH = window.innerWidth >= 640 ? 96 : 80
      const stickyH = stickyRef.current?.offsetHeight || Math.max(1, viewportH - headerH)
      const scrollable = Math.max(1, rect.height - stickyH)
      const raw = (headerH - rect.top) / scrollable
      applyProgress(raw)
    }

    const onScrollOrResize = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(updateScroll)
    }

    updateScroll()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [applyProgress])

  const jumpToStage = (stageIdx: number) => {
    const el = trackRef.current
    if (!el || typeof window === 'undefined') return
    const anchors = [0.16, 0.36, 0.56, 0.82]
    const targetP = anchors[stageIdx] ?? 0
    const rect = el.getBoundingClientRect()
    const headerH = window.innerWidth >= 640 ? 96 : 80
    const stickyH = stickyRef.current?.offsetHeight || Math.max(1, window.innerHeight - headerH)
    const trackTopDoc = window.scrollY + rect.top - headerH
    const scrollable = Math.max(1, el.offsetHeight - stickyH)
    window.scrollTo({
      top: trackTopDoc + scrollable * targetP,
      behavior: 'smooth',
    })
  }

  const activeBorderClass = (idx: number) => {
    if (activeStage < idx) return 'border-slate-800 bg-[#0b1222]'
    if (idx === 0) return 'border-sky-400/70 bg-[#0c182e] shadow-[0_0_35px_rgba(56,189,248,0.18)]'
    if (idx === 1) return 'border-indigo-400/70 bg-[#101631] shadow-[0_0_35px_rgba(129,140,248,0.20)]'
    if (idx === 2) return 'border-cyan-400/70 bg-[#0b1c2c] shadow-[0_0_35px_rgba(34,211,238,0.18)]'
    return 'border-emerald-400/80 bg-[#09221c] shadow-[0_0_40px_rgba(16,185,129,0.24)]'
  }

  const badgeColorClass = (idx: number) => {
    if (activeStage < idx) return 'bg-slate-900 text-slate-500 border-slate-800'
    if (idx === 0) return 'bg-sky-500/20 text-sky-300 border-sky-400/50'
    if (idx === 1) return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50'
    if (idx === 2) return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
  }

  return (
    <section
      aria-label="Your Privacy. Your Control."
      className="relative bg-[#050914] text-white border-b border-slate-800 pb-20 sm:pb-28"
    >
      <div ref={trackRef} className="relative h-[320vh]">
        <div
          ref={stickyRef}
          className="sticky top-20 sm:top-24 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] w-full flex flex-col items-center justify-center px-4 sm:px-8"
        >
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              background:
                activeStage === 3
                  ? 'radial-gradient(circle at 50% 54%, rgba(16,185,129,0.16) 0%, rgba(14,165,233,0.06) 42%, transparent 70%)'
                  : 'radial-gradient(circle at 50% 54%, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.07) 42%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-6xl mx-auto w-full">
            {/* Minimal Headline Only — Zero Subtext */}
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                Your Privacy.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                  Your Control.
                </span>
              </h2>
            </div>

            {/* 4-Step Left-to-Right Visual Concept Track */}
            <div className="relative">
              {/* Desktop Horizontal Connecting Track */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute left-[12%] right-[12%] top-[44%] -translate-y-1/2 h-1.5 rounded-full bg-slate-800/90 overflow-hidden z-0"
              >
                <div
                  ref={beamFillRef}
                  className="h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 will-change-transform"
                  style={{ transform: 'scaleX(0)' }}
                />
              </div>

              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {/* STEP 01: ID Verified */}
                <button
                  ref={(el) => {
                    cardRefs.current[0] = el
                  }}
                  type="button"
                  onClick={() => jumpToStage(0)}
                  className={`group rounded-3xl border-2 p-5 sm:p-7 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer will-change-transform ${activeBorderClass(0)}`}
                >
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-4 ${badgeColorClass(0)}`}
                  >
                    {STEPS[0].num}
                  </span>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                      {/* ID Card Frame */}
                      <rect
                        x="12"
                        y="22"
                        width="64"
                        height="46"
                        rx="10"
                        stroke="#38bdf8"
                        strokeWidth="3.5"
                        fill="#081226"
                      />
                      {/* Avatar Silhouette */}
                      <circle cx="31" cy="41" r="7" stroke="#7dd3fc" strokeWidth="3" />
                      <path
                        d="M20 58c2.2-5.5 6.2-8 11-8s8.8 2.5 11 8"
                        stroke="#7dd3fc"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {/* Minimal Credential Bars */}
                      <line x1="48" y1="37" x2="66" y2="37" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                      <line x1="48" y1="47" x2="61" y2="47" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />

                      {/* Animated Stamp Checkmark */}
                      <g
                        ref={checkBadgeRef}
                        style={{ transformOrigin: '72px 62px' }}
                      >
                        <circle cx="72" cy="62" r="15" fill="#0ea5e9" stroke="#050914" strokeWidth="3" />
                        <path
                          ref={checkPathRef}
                          d="M65 62.5l4.8 4.8 9.2-10"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="28"
                          strokeDashoffset="28"
                        />
                      </g>
                    </svg>
                  </div>
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                    {STEPS[0].label}
                  </span>
                </button>

                {/* STEP 02: Identity Hidden */}
                <button
                  ref={(el) => {
                    cardRefs.current[1] = el
                  }}
                  type="button"
                  onClick={() => jumpToStage(1)}
                  className={`group rounded-3xl border-2 p-5 sm:p-7 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer will-change-transform ${activeBorderClass(1)}`}
                >
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-4 ${badgeColorClass(1)}`}
                  >
                    {STEPS[1].num}
                  </span>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                      <circle
                        ref={hiddenShieldRef}
                        cx="48"
                        cy="52"
                        r="34"
                        fill="rgba(99,102,241,0.12)"
                      />
                      {/* Animated Shackle Snapping Shut */}
                      <path
                        ref={closedShackleRef}
                        d="M34 44V32c0-7.7 6.3-14 14-14s14 6.3 14 14v12"
                        stroke="#818cf8"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      {/* Lock Body */}
                      <rect
                        x="24"
                        y="42"
                        width="48"
                        height="36"
                        rx="10"
                        fill="#0e1530"
                        stroke="#818cf8"
                        strokeWidth="3.5"
                      />
                      {/* Keyhole */}
                      <circle cx="48" cy="57" r="4.5" fill="#c7d2fe" />
                      <path d="M48 61v6" stroke="#c7d2fe" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                    {STEPS[1].label}
                  </span>
                </button>

                {/* STEP 03: Chat First */}
                <button
                  ref={(el) => {
                    cardRefs.current[2] = el
                  }}
                  type="button"
                  onClick={() => jumpToStage(2)}
                  className={`group rounded-3xl border-2 p-5 sm:p-7 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer will-change-transform ${activeBorderClass(2)}`}
                >
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-4 ${badgeColorClass(2)}`}
                  >
                    {STEPS[2].num}
                  </span>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                      {/* Employer Bubble */}
                      <g ref={leftBubbleRef}>
                        <path
                          d="M16 28c0-5.5 4.5-10 10-10h26c5.5 0 10 4.5 10 10v16c0 5.5-4.5 10-10 10H31l-11 8v-8h-4c-2.2 0-4-1.8-4-4V28z"
                          fill="#0a1929"
                          stroke="#38bdf8"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <circle cx="31" cy="36" r="2.5" fill="#7dd3fc" />
                        <circle cx="39" cy="36" r="2.5" fill="#7dd3fc" />
                        <circle cx="47" cy="36" r="2.5" fill="#7dd3fc" />
                      </g>

                      {/* Professional Reply Bubble */}
                      <g ref={rightBubbleRef} style={{ transformOrigin: '62px 58px' }}>
                        <path
                          d="M80 46c0-5.5-4.5-10-10-10H46c-5.5 0-10 4.5-10 10v15c0 5.5 4.5 10 10 10h19l11 8v-8c2.2 0 4-1.8 4-4V46z"
                          fill="#08262c"
                          stroke="#22d3ee"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M51 53.5l5 5 10-10"
                          stroke="#67e8f9"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </svg>
                  </div>
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                    {STEPS[2].label}
                  </span>
                </button>

                {/* STEP 04: Unlock When Ready */}
                <button
                  ref={(el) => {
                    cardRefs.current[3] = el
                  }}
                  type="button"
                  onClick={() => jumpToStage(3)}
                  className={`group rounded-3xl border-2 p-5 sm:p-7 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer will-change-transform ${activeBorderClass(3)}`}
                >
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-4 ${badgeColorClass(3)}`}
                  >
                    {STEPS[3].num}
                  </span>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                      {/* Emerald Unlock Rays */}
                      <g ref={unlockRaysRef} style={{ transformOrigin: '48px 30px', opacity: 0 }}>
                        <line x1="48" y1="6" x2="48" y2="13" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="24" y1="14" x2="29" y2="19" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="72" y1="14" x2="67" y2="19" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
                      </g>

                      {/* Animated Shackle Lifting & Swinging Open */}
                      <path
                        ref={openShackleRef}
                        style={{ transformOrigin: '62px 42px' }}
                        d="M34 38V30c0-7.7 6.3-14 14-14s14 6.3 14 14v12"
                        stroke="#34d399"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      {/* Unlocked Vault Body */}
                      <rect
                        x="24"
                        y="42"
                        width="48"
                        height="36"
                        rx="10"
                        fill="#07241d"
                        stroke="#10b981"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M41 60l5 5 10-10"
                        stroke="#6ee7b7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                    {STEPS[3].label}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
