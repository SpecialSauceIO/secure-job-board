'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const rangeProgress = (p: number, start: number, end: number) =>
  clamp((p - start) / (end - start), 0, 1)

export function ProblemSolvedScrollStage() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const stickyRef = useRef<HTMLDivElement | null>(null)
  const beamFillRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([null, null, null, null])

  const shieldAuraRef = useRef<SVGCircleElement | null>(null)
  const shieldCheckRef = useRef<SVGPathElement | null>(null)

  const botArtRef = useRef<SVGGElement | null>(null)
  const botSlashARef = useRef<SVGLineElement | null>(null)
  const botSlashBRef = useRef<SVGLineElement | null>(null)

  const spamArtRef = useRef<SVGGElement | null>(null)
  const spamSlashARef = useRef<SVGLineElement | null>(null)
  const spamSlashBRef = useRef<SVGLineElement | null>(null)

  const scamArtRef = useRef<SVGGElement | null>(null)
  const scamSlashARef = useRef<SVGLineElement | null>(null)
  const scamSlashBRef = useRef<SVGLineElement | null>(null)

  const activeStageRef = useRef(0)
  const [activeStage, setActiveStage] = useState(0)

  const applyProgress = useCallback((p: number) => {
    const clamped = clamp(p, 0, 1)
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

    if (beamFillRef.current) {
      const beamP = clamp(clamped / 0.78, 0, 1)
      beamFillRef.current.style.transform = `scaleX(${beamP.toFixed(4)})`
    }

    cardRefs.current.forEach((card, idx) => {
      if (!card) return
      const sp = stepProgress[idx] ?? 0
      const baseOp = idx === 0 ? Math.max(0.65, sp) : 0.34 + sp * 0.66
      const liftY = (1 - sp) * 14
      const scl = 0.94 + sp * 0.06
      card.style.opacity = baseOp.toFixed(3)
      card.style.transform = `translate3d(0, ${liftY.toFixed(1)}px, 0) scale3d(${scl.toFixed(3)}, ${scl.toFixed(3)}, 1)`
    })

    if (shieldAuraRef.current) {
      const scl = 0.8 + s1 * 0.2
      shieldAuraRef.current.style.opacity = (0.2 + s1 * 0.8).toFixed(3)
      shieldAuraRef.current.style.transform = `scale(${scl.toFixed(3)})`
    }
    if (shieldCheckRef.current) {
      shieldCheckRef.current.style.strokeDashoffset = `${((1 - s1) * 36).toFixed(1)}`
    }

    const applyStrike = (
      sp: number,
      art: SVGGElement | null,
      lineA: SVGLineElement | null,
      lineB: SVGLineElement | null
    ) => {
      const firstStroke = rangeProgress(sp, 0, 0.55)
      const secondStroke = rangeProgress(sp, 0.4, 1)
      if (art) {
        art.style.opacity = (1 - sp * 0.52).toFixed(3)
      }
      if (lineA) {
        lineA.style.strokeDashoffset = `${((1 - firstStroke) * 92).toFixed(1)}`
        lineA.style.opacity = sp > 0.02 ? '1' : '0'
      }
      if (lineB) {
        lineB.style.strokeDashoffset = `${((1 - secondStroke) * 92).toFixed(1)}`
        lineB.style.opacity = sp > 0.38 ? '1' : '0'
      }
    }

    applyStrike(s2, botArtRef.current, botSlashARef.current, botSlashBRef.current)
    applyStrike(s3, spamArtRef.current, spamSlashARef.current, spamSlashBRef.current)
    applyStrike(s4, scamArtRef.current, scamSlashARef.current, scamSlashBRef.current)
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

  const strikeCardClass = (idx: number) => {
    if (activeStage < idx) return 'border-slate-800 bg-[#0b1222]'
    return 'border-orange-500/75 bg-[#170f16] shadow-[0_0_36px_rgba(249,115,22,0.20)]'
  }

  const strikeBadgeClass = (idx: number) => {
    if (activeStage < idx) return 'bg-slate-900 text-slate-500 border-slate-800'
    return 'bg-orange-500/20 text-orange-300 border-orange-400/50'
  }

  return (
    <section
      aria-label="Problem Solved."
      className="relative bg-[#050914] text-white border-b border-slate-800 pb-20 sm:pb-28"
    >
      <div ref={trackRef} className="relative h-[320vh]">
        <div
          ref={stickyRef}
          className="sticky top-20 sm:top-24 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] w-full flex flex-col items-center justify-center px-4 sm:px-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              background:
                activeStage >= 1
                  ? 'radial-gradient(circle at 30% 54%, rgba(16,185,129,0.14) 0%, transparent 48%), radial-gradient(circle at 72% 54%, rgba(249,115,22,0.14) 0%, transparent 52%)'
                  : 'radial-gradient(circle at 50% 54%, rgba(16,185,129,0.16) 0%, rgba(56,189,248,0.07) 42%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-6xl mx-auto w-full">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                Problem{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB923C] via-[#F97316] to-emerald-400">
                  Solved.
                </span>
              </h2>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="hidden lg:block absolute left-[14%] right-[11%] top-[45%] -translate-y-1/2 h-1.5 rounded-full bg-slate-800/90 overflow-hidden z-0"
              >
                <div
                  ref={beamFillRef}
                  className="h-full w-full origin-left rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-[#F97316] will-change-transform"
                  style={{ transform: 'scaleX(0)' }}
                />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                <button
                  ref={(el) => {
                    cardRefs.current[0] = el
                  }}
                  type="button"
                  onClick={() => jumpToStage(0)}
                  className="lg:col-span-4 rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-b from-[#09241d] to-[#081726] shadow-[0_0_42px_rgba(16,185,129,0.22)] p-6 sm:p-7 flex flex-col items-center justify-between text-center cursor-pointer will-change-transform relative"
                >
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 mb-3">
                    ✓
                  </span>

                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                    <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                      <circle
                        ref={shieldAuraRef}
                        cx="48"
                        cy="48"
                        r="40"
                        fill="rgba(16,185,129,0.14)"
                        style={{ transformOrigin: '48px 48px' }}
                      />
                      <path
                        d="M48 12L20 24v22c0 19.5 11.9 36.8 28 42 16.1-5.2 28-22.5 28-42V24L48 12z"
                        fill="#07261f"
                        stroke="#34d399"
                        strokeWidth="3.8"
                        strokeLinejoin="round"
                      />
                      <path
                        ref={shieldCheckRef}
                        d="M35 49l9 9 18-19"
                        stroke="#ffffff"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="36"
                        strokeDashoffset="36"
                      />
                    </svg>
                  </div>

                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                    100% ID-Verified
                    <br />
                    <span className="text-emerald-300">Professionals</span>
                  </span>
                </button>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <button
                    ref={(el) => {
                      cardRefs.current[1] = el
                    }}
                    type="button"
                    onClick={() => jumpToStage(1)}
                    className={`rounded-3xl border-2 p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-colors duration-300 cursor-pointer will-change-transform ${strikeCardClass(1)}`}
                  >
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-3 ${strikeBadgeClass(1)}`}
                    >
                      01
                    </span>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                      <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                        <g ref={botArtRef}>
                          <line x1="48" y1="14" x2="48" y2="26" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
                          <circle cx="48" cy="12" r="4" fill="#94a3b8" />
                          <rect x="22" y="26" width="52" height="44" rx="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="3.5" />
                          <circle cx="37" cy="45" r="5" fill="#cbd5e1" />
                          <circle cx="59" cy="45" r="5" fill="#cbd5e1" />
                          <line x1="36" y1="58" x2="60" y2="58" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
                        </g>
                        <line
                          ref={botSlashARef}
                          x1="18"
                          y1="18"
                          x2="78"
                          y2="78"
                          stroke="#f97316"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                        <line
                          ref={botSlashBRef}
                          x1="78"
                          y1="18"
                          x2="18"
                          y2="78"
                          stroke="#ef4444"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                      </svg>
                    </div>

                    <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                      No More Bots
                    </span>
                  </button>

                  <button
                    ref={(el) => {
                      cardRefs.current[2] = el
                    }}
                    type="button"
                    onClick={() => jumpToStage(2)}
                    className={`rounded-3xl border-2 p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-colors duration-300 cursor-pointer will-change-transform ${strikeCardClass(2)}`}
                  >
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-3 ${strikeBadgeClass(2)}`}
                    >
                      02
                    </span>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                      <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                        <g ref={spamArtRef}>
                          <rect x="24" y="22" width="52" height="36" rx="7" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                          <rect x="18" y="32" width="54" height="38" rx="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="3.5" />
                          <path
                            d="M21 36l24 17 24-17"
                            stroke="#cbd5e1"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <line
                          ref={spamSlashARef}
                          x1="18"
                          y1="18"
                          x2="78"
                          y2="78"
                          stroke="#f97316"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                        <line
                          ref={spamSlashBRef}
                          x1="78"
                          y1="18"
                          x2="18"
                          y2="78"
                          stroke="#ef4444"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                      </svg>
                    </div>

                    <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                      No More Spam
                    </span>
                  </button>

                  <button
                    ref={(el) => {
                      cardRefs.current[3] = el
                    }}
                    type="button"
                    onClick={() => jumpToStage(3)}
                    className={`rounded-3xl border-2 p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-colors duration-300 cursor-pointer will-change-transform ${strikeCardClass(3)}`}
                  >
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border mb-3 ${strikeBadgeClass(3)}`}
                    >
                      03
                    </span>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                      <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" fill="none">
                        <g ref={scamArtRef}>
                          <line x1="54" y1="12" x2="54" y2="52" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
                          <circle cx="54" cy="26" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" />
                          <path
                            d="M54 52c0 11-8 18-17 18-8.5 0-15-6.2-15-14.5 0-3.5 1.2-6.8 3.5-9.5l7.5 5.5"
                            stroke="#cbd5e1"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <line
                          ref={scamSlashARef}
                          x1="18"
                          y1="18"
                          x2="78"
                          y2="78"
                          stroke="#f97316"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                        <line
                          ref={scamSlashBRef}
                          x1="78"
                          y1="18"
                          x2="18"
                          y2="78"
                          stroke="#ef4444"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="92"
                          strokeDashoffset="92"
                        />
                      </svg>
                    </div>

                    <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                      No More Scams
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
