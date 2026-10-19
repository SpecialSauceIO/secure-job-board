'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Cycles through slides 0, 1, 2, 3, and 4 every 9 seconds (9000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 4 ? 0 : prev + 1))
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

      {/* Hero Section */}
      <section className="relative pt-36 sm:pt-44 pb-16 sm:pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Cross-fading text container */}
        <div className="grid [grid-template-areas:'stack'] mb-6 w-full place-items-center">
          {/* SLIDE 0 (Slide #1): Universal Opening Slide */}
          <div
            className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${
              currentSlide === 0
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-300 text-violet-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
              </span>
              28 Industry Verticals • Privacy-First Hiring
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Changing the Hiring{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-orange-500">
                Landscape.
              </span>
              <br />
              For good.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Whether you work in Healthcare, Hospitality, Finance, Skilled Trades, Agriculture, Government, or Tech—we replace black-hole job boards with upfront pay transparency, skill-and-language matching, and complete privacy until you choose to connect.
            </p>
          </div>

          {/* SLIDE 1 (Slide #2): Unified Founding Member & Partner Launch Slide */}
          <div
            className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${
              currentSlide === 1
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold uppercase tracking-wide mb-5 shadow-2xs">
              <span className="text-amber-600">★</span>
              Early-Access Launch • Founding Memberships Open
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[3.35rem] font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-6xl mb-4">
              <span className="sm:whitespace-nowrap">
                Lock In Permanent{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600">
                  Founding Status.
                </span>
              </span>
              <br />
              <span className="sm:whitespace-nowrap">
                Full access. Lifetime perks.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Join during our launch window to unlock{' '}
              <strong className="text-slate-700">30 days of complimentary full access</strong>, permanent{' '}
              <strong className="text-slate-700">Permanent Founding Member &amp; Partner status</strong>, priority AI matching rank, and lifetime rate locks.
            </p>
          </div>

          {/* SLIDE 2 (Slide #3): No Ghost Jobs or Spam */}
          <div
            className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${
              currentSlide === 2
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Real Active Jobs • No Resume Collector Traps
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Zero{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                Ghost Jobs.
              </span>
              <br />
              No resume harvesting.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Every job posting automatically closes after 30 days unless the employer actively renews it, so you never waste time applying to outdated listings. Plus, your name and contact info stay private until you’re ready to talk.
            </p>
          </div>

          {/* SLIDE 3 (Slide #4): Employers */}
          <div
            className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${
              currentSlide === 3
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              For Hiring Managers &amp; Recruiting Teams
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Hire for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                True Fit.
              </span>
              <br />
              Skip the resume pile.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Stop sifting through hundreds of unqualified applications. Our 5-Point AI Match Radar evaluates Core Competencies, Skill Tenure, Logistics &amp; Pay, Industry &amp; Creds, and Execution &amp; Comm. upfront—so only qualified, verified candidates reach your desk.
            </p>
          </div>

          {/* SLIDE 4 (Slide #5): Candidates */}
          <div
            className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${
              currentSlide === 4
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              For Job Seekers &amp; Passive Professionals
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Your Career.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-400">
                Your Privacy.
              </span>
              <br />
              Zero cold spam.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Explore new opportunities without risking your current job. Set your minimum pay and work preferences upfront, chat safely with interested employers first, and share your full resume only when you decide it’s a match.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto relative z-20">
          <Link
            href="/signup/candidate"
            className="px-7 py-3.5 bg-slate-900 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2"
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
            className="px-7 py-3.5 bg-white text-slate-900 text-sm sm:text-base font-bold rounded-xl border-2 border-slate-300 hover:border-slate-300 hover:-translate-y-0.5 transition-all shadow-xs flex items-center justify-center gap-2"
          >
            I&apos;m an Employer
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-sm sm:text-base font-extrabold rounded-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
          >
            ★ Compare Plans &amp; Perks
          </Link>
        </div>

        {/* 5 Slide Indicators */}
        <div className="flex gap-2 mt-5 z-20 relative">
          <button
            onClick={() => setCurrentSlide(0)}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === 0
                ? 'bg-violet-600 w-6'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label="View overview slide"
          />
          <button
            onClick={() => setCurrentSlide(1)}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === 1
                ? 'bg-amber-500 w-6'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label="View Founding Member & Partner Launch Rewards slide"
          />
          <button
            onClick={() => setCurrentSlide(2)}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === 2
                ? 'bg-orange-500 w-6'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label="View fresh jobs slide"
          />
          <button
            onClick={() => setCurrentSlide(3)}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === 3
                ? 'bg-indigo-600 w-6'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label="View employer fit slide"
          />
          <button
            onClick={() => setCurrentSlide(4)}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === 4
                ? 'bg-emerald-500 w-6'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label="View candidate privacy slide"
          />
        </div>

        {/* Single Clean Scroll-Down Cue */}
        <button
          type="button"
          onClick={scrollToHowItWorks}
          className="mt-6 inline-flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors group cursor-pointer z-20"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Explore How It Works
          </span>
          <span className="w-6 h-6 rounded-full border border-slate-300 bg-white shadow-2xs flex items-center justify-center group-hover:border-indigo-300 transition-all">
            <svg
              className="w-3 h-3 animate-bounce text-slate-500 group-hover:text-indigo-600"
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
      </section>

      {/* Feature Section */}
      <section
        id="how-it-works"
        className="scroll-mt-20 py-20 px-6 md:px-12 bg-white border-t border-slate-300"
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
              <div className="p-8 rounded-2xl bg-slate-50 border-2 border-2-slate-100 relative overflow-hidden group border-slate-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-2-slate-200 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform border-slate-300">
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
                  Upload your resume to automatically extract your skills, experience, education, licenses, and written/verbal language proficiencies—while keeping your name and contact details hidden. Set your minimum pay and dealbreakers upfront.
                </p>
              </div>

              {/* Candidate Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 border-2 border-2-slate-100 relative overflow-hidden group border-slate-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-2-slate-200 flex items-center justify-center mb-6 text-cyan-500 group-hover:scale-110 transition-transform border-slate-300">
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
                  2. See Your Fit Before You Apply
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Every job listing shows real pay bands (annual or hourly) and closes after 30 days so you never apply to dead roles. Check your instant 5-Point AI Fit score before submitting an anonymous application and earn verified behavioral responsiveness signals.
                </p>
              </div>

              {/* Candidate Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-slate-900 to-slate-900 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
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
                  <h3 className="text-xl font-bold text-white mb-3">
                    3. Chat First, Share Your Resume Later
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    When an employer wants to connect, you’ll see their verified company name and can message them directly on the platform—while your email and full resume stay private until you decide you’re ready to release them.
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
              <div className="p-8 rounded-2xl bg-slate-50 border-2 border-2-slate-100 relative overflow-hidden group border-slate-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-2-slate-200 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform border-slate-300">
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
                  Upload any existing job description and let our assistant organize the required skills, experience, certifications, languages, and US metro location for you. Your company name stays private until you connect with a candidate.
                </p>
              </div>

              {/* Employer Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 border-2 border-2-slate-100 relative overflow-hidden group border-slate-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border-2 border-2-slate-200 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform border-slate-300">
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
                  2. Quality Over Clutter
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Every applicant is pre-screened against your role’s core skills, experience, credentials, and language requirements before they can apply. You can also search our passive talent pool by industry, location, certifications, and language fluency.
                </p>
              </div>

              {/* Employer Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-slate-900 to-slate-900 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
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
                  <h3 className="text-xl font-bold text-white mb-3">
                    3. Direct Messaging &amp; Team Collaboration
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Reviewing and messaging candidates who apply to your jobs is 100% free. Start a direct conversation to confirm mutual interest, invite team members or BPO partners to collaborate, and download the candidate’s resume once released.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOUNDING MEMBER & FOUNDING PARTNER LAUNCH REWARDS BANNER */}
          <div className="mt-20 rounded-3xl bg-slate-900 text-white p-8 sm:p-10 border-2 border-slate-300 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-indigo-900 to-slate-900 pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                  ★ Early-Access Launch • Founding Memberships Open
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                  30-Day Founding Rewards. Full Access &amp; Lifetime Perks.
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Join during our initial launch window to unlock 30 days of complimentary full access, permanent{' '}
                  <strong className="text-amber-300">
                    Permanent Founding Member &amp; Founding Partner Status
                  </strong>
                  , a permanent{' '}
                  <strong className="text-amber-300">
                    Verified Behavioral Trust Signals
                  </strong>
                  , and lifetime Founder&apos;s Rate Locks.
                </p>
                <div className="pt-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-sm"
                  >
                    Compare All Plans &amp; Founding Rewards →
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    ★ Candidates (Explorer • Professional • Prestige)
                  </span>
                  <div className="text-lg font-black text-white">
                    First 30 Days $0
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    $0 Explorer Vault forever, or try Professional ($9/mo, 15 apps) &amp; Prestige ($15/mo, Unlimited apps + Priority Placement) free for 30 days.
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
                    ★ Employers (Starter • Growth • Enterprise)
                  </span>
                  <div className="text-lg font-black text-white">
                    First 30 Days $0
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Try Starter (5 roles), Growth (15 roles), or Enterprise (Unlimited roles + Workday &amp; Greenhouse ATS Webhooks) free for 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The End Result Section */}
      <section className="py-24 px-6 md:px-12 bg-slate-50 border-t border-slate-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Both Sides Trust Special Sauce
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              A respectful, common-sense hiring community built for real people and real businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Widget 1: Verified People & Real Companies */}
            <div className="p-8 rounded-2xl bg-white border-2 border-2-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform border-slate-300">
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
                Every candidate and employer is verified before they can apply or post jobs—eliminating bots, fake profiles, and scam job listings while keeping sensitive personal data off our servers.
              </p>
            </div>

            {/* Widget 2: Always Fresh Opportunities */}
            <div className="p-8 rounded-2xl bg-white border-2 border-2-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform border-slate-300">
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
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400 via-slate-900 to-slate-900 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-orange-400">
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
                <h3 className="text-xl font-bold text-white mb-3">
                  You Control Your Information
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Instead of blasting your name, phone number, and resume across public job boards, you connect in two simple steps: chat privately first, then release your resume and contact card only when you’re comfortable.
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Trigger to Open Technical & Security Documentation Page */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-white border-2 border-2-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-300">
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
                  Read our plain-English and technical documentation covering Stripe Identity verification, 2-Stage Resume Vaulting, and our anti-harvesting protections.
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

      <PublicFooter />
    </div>
  )
}
