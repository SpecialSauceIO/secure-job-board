'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [activePreview, setActivePreview] = useState<{
    title: string
    badge: string
    mp4: string
    webm: string
    poster: string
  } | null>(null)

  // Cycles through slides 0, 1, 2, 3, 4, and 5 every 9 seconds (9000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 5 ? 0 : prev + 1))
    }, 9000)
    return () => clearInterval(timer)
  }, [currentSlide])

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <PublicHeader fixed />

      {/* Hero Section — Full-Bleed Dark Slate with Right-Side 3D Isometric UI Accent */}
      <section className="relative overflow-hidden bg-[#0f172a] border-b border-slate-800 pt-40 sm:pt-48 pb-20 sm:pb-28">
        {/* Ambient Left-Side Deep Slate Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-[38rem] h-[38rem] rounded-full bg-sky-500/10 blur-3xl z-0"
        />

        {/* Full-Width Seamless Right-Side 3D Isometric Interface Accent (Zero Vertical Seam) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
        >
          {/* Ambient cyan/orange backlight behind the right-side monitor */}
          <div className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tr from-[#0077D4]/25 via-sky-500/15 to-[#EA580C]/15 blur-3xl" />

          {/* Smooth Alpha-Masked Wrapper: 0% opacity on left/center text zone -> 95% crisp visibility on right edge */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 right-[-15%] sm:right-[-6%] lg:right-[0%] w-[1080px] sm:w-[1280px] lg:w-[1440px] opacity-90 transition-all duration-1000"
              style={{
                transform:
                  'perspective(1350px) rotateY(-30deg) rotateX(8deg) rotateZ(-3deg) scale(1.32)',
                transformOrigin: 'center right',
              }}
            >
              <div className="rounded-2xl border border-sky-400/25 bg-[#0a0f1c] p-2 shadow-[0_35px_90px_rgba(0,0,0,0.9)]">
                {/* Subtle Window Chrome */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 rounded-t-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 tracking-wider">
                    specialsauce.io • Live Platform Interface
                  </span>
                </div>

                {/* Cross-Fading High-Res Interface Captures synced to hero slides */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-b-xl bg-[#0a0f1c]">
                  <img
                    src="/media/ui-card-ai-fit-radar.webp"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-left-top transition-opacity duration-1000 ${
                      currentSlide % 3 === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <img
                    src="/media/ui-card-privacy-vault.webp"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-left-top transition-opacity duration-1000 ${
                      currentSlide % 3 === 1 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <img
                    src="/media/ui-card-mutual-unlock.webp"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-left-top transition-opacity duration-1000 ${
                      currentSlide % 3 === 2 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Soft Top & Bottom Vignettes so the 3D monitor melts into the header and section border */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0f172a] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />
        </div>

        {/* Foreground Content Container */}
        <div className="relative z-10 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Cross-fading text container */}
          <div className="grid [grid-template-areas:'stack'] mb-10 w-full place-items-center">
            {/* SLIDE 0 (Slide #1): Universal Opening Slide - LOGO BLUE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 0
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
                Strictly Human-to-Human Hiring • Zero Automated Black Holes
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                Changing the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0077D4]">
                  Hiring Landscape.
                </span>
                <br />
                For good.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Traditional job boards bury 8 out of 10 résumés in automated filters. Special Sauce restores human-to-human hiring with upfront pay and complete identity protection.
              </p>
            </div>

            {/* SLIDE 1 (Slide #2): No More Bots, No More Spam, No More Scams - LOGO ORANGE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 1
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]"></span>
                </span>
                ID-Verified Professionals • ID- &amp; Domain-Verified Employers
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                No More Bots.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB923C] to-[#EA580C]">
                  No More Spam.
                </span>
                <br />
                No More Scams.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Every active candidate and employer completes Stripe Identity verification before connecting—eliminating automated bots, fake listings, and spam so real professionals deal strictly with real hiring teams.
              </p>
            </div>

            {/* SLIDE 2 (Slide #3): The Intro/Convo Privacy Handshake - LOGO BLUE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 2
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
                The Intro/Convo Privacy Handshake • Mutual Consent First
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                Start With{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0077D4]">
                  An Introduction.
                </span>
                <br />
                Share Your Resume When Ready.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Chat in an encrypted Introduction thread showing only your First Name and Last Initial. Release your full resume and contact information only after mutual interest is confirmed.
              </p>
            </div>

            {/* SLIDE 3 (Slide #4): Zero Ghost Jobs - LOGO ORANGE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 3
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]"></span>
                </span>
                30-Day Active Role Guarantee • No Resume Traps
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                Zero{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB923C] to-[#EA580C]">
                  Ghost Jobs.
                </span>
                <br />
                No resume harvesting.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Every job posting automatically expires after 30 days unless the employer actively renews it, eliminating abandoned listings and resume-collector traps so you never waste time applying to outdated roles.
              </p>
            </div>

            {/* SLIDE 4 (Slide #5): Employers - LOGO BLUE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 4
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
                For Hiring Managers &amp; Recruiting Teams
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                Hire for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0077D4]">
                  True Fit.
                </span>
                <br />
                Skip the resume pile.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Stop sifting through &apos;Easy Apply&apos; spam. Every applicant is an ID-verified human who has already cleared a 40%+ match across your required skills, dealbreakers, and pay bands.
              </p>
            </div>

            {/* SLIDE 5 (Slide #6): Free Profile Staging + 30-Day Free Trial - LOGO ORANGE */}
            <div
              className={`[grid-area:stack] bg-transparent flex flex-col items-center transition-all duration-700 ${
                currentSlide === 5
                  ? 'opacity-100 translate-y-0 z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]"></span>
                </span>
                Free Profile &amp; Role Staging • 30-Day Free Trial
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mb-4 drop-shadow-xs">
                Test Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB923C] to-[#EA580C]">
                  True Market Fit.
                </span>
                <br />
                30-Day Free Trial. Cancel Anytime.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Stage your anonymous profile or open roles and run unlimited TrueFit Score™ checks for free. When you find a match worth pursuing, start your 30-Day Free Trial to unlock verified applications and refund-protected Professional Invitations.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto relative z-20">
            <Link
              href="/signup/candidate"
              className="px-7 py-3.5 bg-[#0077D4] text-white text-sm sm:text-base font-bold rounded-xl hover:bg-[#1DA1F2] hover:-translate-y-0.5 transition-all shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2"
            >
              I&apos;m a Candidate
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </Link>
            <Link
              href="/signup/employer"
              className="px-7 py-3.5 bg-slate-900/90 text-white text-sm sm:text-base font-bold rounded-xl border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-xs flex items-center justify-center gap-2 backdrop-blur-xs"
            >
              I&apos;m an Employer
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 text-sm sm:text-base font-extrabold rounded-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 backdrop-blur-xs"
            >
              ★ 30-Day Free Trial • Plans &amp; Perks
            </Link>
          </div>

          {/* 6 Slide Indicators - Alternating Logo Blue & Logo Orange */}
          <div className="flex gap-2.5 mt-8 z-20 relative">
            <button
              onClick={() => setCurrentSlide(0)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 0
                  ? 'bg-[#38BDF8] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View overview slide"
            />
            <button
              onClick={() => setCurrentSlide(1)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 1
                  ? 'bg-[#F97316] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View No Bots No Spam No Scams slide"
            />
            <button
              onClick={() => setCurrentSlide(2)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 2
                  ? 'bg-[#38BDF8] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View Founding Member & Partner Launch Rewards slide"
            />
            <button
              onClick={() => setCurrentSlide(3)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 3
                  ? 'bg-[#F97316] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View Zero Ghost Jobs slide"
            />
            <button
              onClick={() => setCurrentSlide(4)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 4
                  ? 'bg-[#38BDF8] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View Employer True Fit slide"
            />
            <button
              onClick={() => setCurrentSlide(5)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === 5
                  ? 'bg-[#F97316] w-6'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label="View Candidate Privacy Vault slide"
            />
          </div>

          {/* Subtle Enterprise Video Tour Trigger */}
          <div className="mt-7 z-20 relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="group inline-flex items-center gap-3 pl-2.5 pr-4 py-2 rounded-full bg-slate-900/90 border border-slate-700 hover:border-[#38BDF8] shadow-md transition-all cursor-pointer backdrop-blur-md"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-[#0077D4] to-[#1DA1F2] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <svg className="w-3.5 h-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-sky-300 transition-colors">
                Watch 45-Second Platform Tour
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                0:45 • Audio
              </span>
            </button>
          </div>

          {/* High-Visibility Operational Trust Strip — Dark Slate Edition */}
          <div className="mt-12 w-full max-w-5xl z-20 relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 py-3 px-2 rounded-2xl bg-[#0f172a]/85 backdrop-blur-md border border-slate-800/90 shadow-lg">
              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center border-r border-slate-800">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                  100% US-Based Company
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  US-Owned &amp; Operated
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center lg:border-r border-slate-800">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                  100% US Human Support
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Zero Offshore Call Centers
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center border-r border-slate-800">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                  Daily-Calibrated TrueFit™
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Tested Daily for Accuracy
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                  Intro/Convo Privacy Vault
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Stripe ID &amp; DNS Verified
                </span>
              </div>
            </div>
          </div>

          {/* Single Clean Scroll-Down Cue */}
          <button
            type="button"
            onClick={scrollToHowItWorks}
            className="mt-10 inline-flex flex-col items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors group cursor-pointer z-20"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Explore How It Works
            </span>
            <span className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 shadow-2xs flex items-center justify-center group-hover:border-sky-400 transition-all">
              <svg
                className="w-3 h-3 animate-bounce text-slate-400 group-hover:text-sky-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>

          {/* Floating Bottom-Right Security & Trust Pill -> Navigates directly to /security */}
          <Link
            href="/security"
            className="hidden sm:inline-flex items-center gap-2 fixed right-6 bottom-6 z-30 px-4 py-2.5 rounded-full bg-slate-900/95 backdrop-blur text-white border border-slate-700 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 text-xs font-extrabold transition-all cursor-pointer group"
          >
            <span>🛡️ Security &amp; Trust</span>
            <svg
              className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section
        id="how-it-works"
        className="scroll-mt-20 py-20 px-4 sm:px-6 md:px-12 bg-white border-t border-slate-300"
      >
        <div className="max-w-7xl mx-auto">
          {/* TRACK 1: CANDIDATES */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-3">
                Privacy, Transparency &amp; Fair Pay
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                How Special Sauce works{' '}
                <span className="text-emerald-500">for Candidates</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Candidate Feature 1 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '1. Build Your Private Profile',
                      badge: 'Stage 1 Privacy Vault Redaction',
                      mp4: '/media/loop-privacy-calibration.mp4',
                      webm: '/media/loop-privacy-calibration.webm',
                      poster: '/media/ui-card-privacy-vault.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-emerald-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wide">
                      STAGE 1 PRIVACY VAULT
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-privacy-vault.webp"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-privacy-calibration.webm" type="video/webm" />
                      <source src="/media/loop-privacy-calibration.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-slate-300 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform border-slate-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  1. Build Your Private Profile
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Upload your resume for free to automatically extract your skill matrix, experience, education, and language proficiencies—while keeping your name and contact details hidden. Your anonymous profile is immediately Vault-Staged in Employer Search for free.
                </p>
              </div>

              {/* Candidate Feature 2 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '2. See Your Fit & Get Discovered',
                      badge: 'Instant 5-Point TrueFit Score™',
                      mp4: '/media/loop-ai-fit-reveal.mp4',
                      webm: '/media/loop-ai-fit-reveal.webm',
                      poster: '/media/ui-card-ai-fit-radar.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-cyan-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 tracking-wide">
                      5-POINT TRUEFIT SCORE™
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-ai-fit-radar.webp"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-ai-fit-reveal.webm" type="video/webm" />
                      <source src="/media/loop-ai-fit-reveal.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-slate-300 flex items-center justify-center mb-6 text-cyan-500 group-hover:scale-110 transition-transform border-slate-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  2. See Your Fit &amp; Get Discovered
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Browse transparent pay bands and preview how your skills align using our TrueFit Score™ for free. When you are ready to submit a protected application or accept a Professional Invitation from an employer, start your 30-Day Free Trial (including 1-time Stripe ID verification).
                </p>
              </div>

              {/* Candidate Feature 3 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '3. The Intro/Convo Privacy Handshake',
                      badge: 'One-Click Identity & Resume Vault Release',
                      mp4: '/media/loop-mutual-unlock.mp4',
                      webm: '/media/loop-mutual-unlock.webm',
                      poster: '/media/ui-card-mutual-unlock.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-emerald-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wide">
                      MUTUAL VAULT UNLOCK
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-mutual-unlock.webp"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-mutual-unlock.webm" type="video/webm" />
                      <source src="/media/loop-mutual-unlock.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl border border-emerald-300 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    3. The Intro/Convo Privacy Handshake
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    In The Introduction, you see the employer’s verified company name and chat directly on the platform while remaining anonymous. In The Conversation, you release your full resume and contact card with one click only when you are ready to move forward.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* TRACK 2: EMPLOYERS */}
          <div>
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs font-extrabold uppercase tracking-wider mb-3">
                Built for Businesses Across All 28 Industry Verticals
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                How Special Sauce works{' '}
                <span className="text-indigo-600">for Employers</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Employer Feature 1 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '1. Post Roles in Seconds',
                      badge: 'Structured Protected Role & Upfront Pay Bands',
                      mp4: '/media/loop-employer-roles.mp4',
                      webm: '/media/loop-employer-roles.webm',
                      poster: '/media/ui-card-employer-roles.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-orange-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-orange-400 tracking-wide">
                      PROTECTED ROLE STAGING
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-employer-roles.webp"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-employer-roles.webm" type="video/webm" />
                      <source src="/media/loop-employer-roles.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-slate-300 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform border-slate-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  1. Post Roles in Seconds
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Upload any job description to structure your role, search our anonymous talent directory, and preview candidate alignment with TrueFit Score™ checks for free. Your company name stays private until you send a Professional Invitation or unlock an applicant.
                </p>
              </div>

              {/* Employer Feature 2 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '2. 40% Skill-Fit Threshold & Protected Invitations',
                      badge: '40%+ Baseline Match Verification Gate',
                      mp4: '/media/loop-ai-fit-reveal.mp4',
                      webm: '/media/loop-ai-fit-reveal.webm',
                      poster: '/media/ui-card-ai-fit-radar.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-indigo-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wide">
                      40%+ FIT THRESHOLD GATE
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-ai-fit-radar.webp"
                      className="w-full h-full object-cover object-bottom group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-ai-fit-reveal.webm" type="video/webm" />
                      <source src="/media/loop-ai-fit-reveal.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-slate-300 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform border-slate-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  2. 40% Skill-Fit Threshold &amp; Protected Invitations
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Start your 30-Day Founding Partner Trial when you are ready to publish live roles or send Professional Invitations. Our 40% minimum TrueFit Score™ threshold ensures every applicant meets your core role requirements, and 100% Accepted-Only Invitation Credit Protection ensures you only use a credit when a professional accepts.
                </p>
              </div>

              {/* Employer Feature 3 */}
              <div className="p-5 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-300 relative overflow-hidden group border-slate-300 flex flex-col">
                <div
                  onClick={() =>
                    setActivePreview({
                      title: '3. Direct Messaging & Team Collaboration',
                      badge: '2-Way Direct Chat & Full Resume Release',
                      mp4: '/media/loop-mutual-unlock.mp4',
                      webm: '/media/loop-mutual-unlock.webm',
                      poster: '/media/ui-card-mutual-unlock.webp',
                    })
                  }
                  className="mb-6 -mx-1 -mt-1 rounded-xl overflow-hidden border-2 border-slate-300 bg-[#0a0f1c] shadow-sm group-hover:border-indigo-400 transition-all cursor-zoom-in relative"
                  title="Click to expand live UI preview"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wide">
                      2-WAY DIRECT CHAT &amp; VAULT
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0f1c]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/media/ui-card-mutual-unlock.webp"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    >
                      <source src="/media/loop-mutual-unlock.webm" type="video/webm" />
                      <source src="/media/loop-mutual-unlock.mp4" type="video/mp4" />
                    </video>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/85 border border-white/15 text-[10px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⤢ Expand UI
                    </span>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl border border-indigo-300 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    3. Direct Messaging &amp; Team Collaboration
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Reviewing and messaging candidates who apply to your jobs is 100% free. Start a direct conversation to confirm mutual interest, invite team members or recruiting partners to collaborate, and download the candidate’s resume once released.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* The End Result Section */}
      <section className="py-24 px-4 sm:px-6 md:px-12 bg-slate-50 border-t border-slate-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Both Sides Trust Special Sauce
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              A respectful, straightforward hiring community built for real people and real businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Widget 1: Verified People & Real Companies */}
            <div className="p-5 sm:p-8 rounded-2xl bg-white border-2 border-slate-300 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform border-slate-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-center mb-6 text-emerald-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Verified People &amp; Real Companies
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Candidates and employers can build profiles and run TrueFit Score™ checks for free, then complete 1-time Stripe Identity verification with a 30-Day Free Trial before applying, pitching, or posting live jobs—eliminating bots, fake profiles, and scam listings.
              </p>
            </div>

            {/* Widget 2: Always Fresh Opportunities */}
            <div className="p-5 sm:p-8 rounded-2xl bg-white border-2 border-slate-300 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform border-slate-300">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl border border-indigo-300 flex items-center justify-center mb-6 text-indigo-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                30-Day Fresh Job Guarantee
              </h3>
              <p className="text-slate-500 leading-relaxed">
                No forgotten job posts sitting around for months. Every listing automatically closes after 30 days unless renewed, and employers must actively respond to candidates in their inbox to keep unlocking new profiles.
              </p>
            </div>

            {/* Widget 3: Step-by-Step Privacy */}
            <div className="p-5 sm:p-8 rounded-2xl bg-white border-2 border-slate-300 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform border-slate-300">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-100 rounded-xl border border-orange-300 flex items-center justify-center mb-6 text-orange-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  US-Based Support &amp; Calibrated TrueFit™
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Special Sauce is 100% US-owned and operated with direct US human support specialists—zero offshore call centers or bot loops. Our TrueFit Score™ is benchmark-tested and calibrated daily to prevent model drift.
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Trigger to Open Technical & Security Documentation Page */}
          <div className="mt-14 p-5 sm:p-8 rounded-2xl bg-white border-2 border-slate-300 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-300">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-300 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Curious how our security, identity verification, and matching work under the hood?
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Read our plain-English and technical documentation covering Stripe Identity verification, Step-by-Step Resume Protection, and our anti-harvesting protections.
                </p>
              </div>
            </div>

            <Link
              href="/security"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Read Technical &amp; Security Docs →
            </Link>
          </div>
        </div>
      </section>

      {/* 45-Second Platform Tour Theater Modal */}
      {isTourOpen && (
        <div
          onClick={() => setIsTourOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-2xl border-2 border-slate-700 bg-[#0a0f1c] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  Special Sauce — 45-Second Platform Tour
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTourOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <video
              src="/media/hero-tour-captioned.mp4"
              controls
              autoPlay
              playsInline
              className="w-full h-auto block bg-black"
            />
          </div>
        </div>
      )}

      {/* Interactive UI Card Zoom Lightbox */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-2xl border-2 border-slate-700 bg-[#0a0f1c] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {activePreview.title}
                </span>
                <span className="ml-3 text-[11px] font-mono text-sky-400">
                  {activePreview.badge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                ✕ Close Preview
              </button>
            </div>
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={activePreview.poster}
              className="w-full h-auto block bg-[#0a0f1c]"
            >
              <source src={activePreview.webm} type="video/webm" />
              <source src={activePreview.mp4} type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}
