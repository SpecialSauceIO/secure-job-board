'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Cycles through slides 0, 1, 2, and 3 every 7 seconds (7000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 3 ? 0 : prev + 1))
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation (Compact h-20 height) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between relative">
          
          {/* LEFT: Clickable Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image 
                src="/logo.jpg" 
                alt="specialsauce.io Logo" 
                width={300} 
                height={75} 
                className="w-[185px] sm:w-[225px] h-auto"
                priority
              />
            </Link>
          </div>

          {/* CENTERED: Tagline */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-4">
            <span className="h-5 w-px bg-slate-200"></span>
            <p className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase whitespace-nowrap">
              Securely Connecting Professionals &amp; Employers
            </p>
            <span className="h-5 w-px bg-slate-200"></span>
          </div>

          {/* RIGHT: Quick CTAs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="hidden md:inline-flex text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>

        </div>
      </nav>

      {/* Hero Section (Compact vertical footprint so CTAs + Scroll Cue fit comfortably on all screens) */}
      <section className="relative pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Cross-fading text container */}
        <div className="grid [grid-template-areas:'stack'] mb-6 w-full place-items-center">
          
          {/* SLIDE 0: The End of Traditional Recruiting (Flagship Opening Slide) */}
          <div className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${currentSlide === 0 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
              </span>
              The End of Traditional Recruiting
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Changing the Hiring <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-orange-500">Landscape.</span><br />
              For good.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              We stripped away the noise, the bias, and the black-hole job boards—replacing them with verified identities, blind skill matrices, and pure 1-to-1 merit.
            </p>
          </div>

          {/* SLIDE 1: Platform Integrity */}
          <div className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${currentSlide === 1 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Platform Integrity
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Zero <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Spam.</span><br />
              No more bots.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Say goodbye to automated application blizzards and phantom job postings. Our closed-loop extraction system ensures every applicant is a real professional and every role is a genuine opportunity.
            </p>
          </div>

          {/* SLIDE 2: Employers */}
          <div className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${currentSlide === 2 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              For Employers
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Hire for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Talent.</span><br />
              Not for background.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              specialsauce.io strips away names, photos, and bias. We use AI to extract pure skills and experience, letting candidates prove their worth and employers find the absolute best fit.
            </p>
          </div>

          {/* SLIDE 3: Candidates */}
          <div className={`[grid-area:stack] bg-slate-50 flex flex-col items-center transition-all duration-700 ${currentSlide === 3 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              For Candidates
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-4">
              Get hired for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-400">Skills.</span><br />
              Not your pedigree.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
              Bypass the resume black hole. Apply to real companies with an anonymous profile that highlights your true capabilities, putting your raw talent front and center.
            </p>
          </div>

        </div>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto relative z-20">
          <Link href="/signup/candidate" className="px-7 py-3.5 bg-slate-900 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2">
            I&apos;m a Candidate
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
          <Link href="/signup/employer" className="px-7 py-3.5 bg-white text-slate-900 text-sm sm:text-base font-bold rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:-translate-y-0.5 transition-all shadow-xs flex items-center justify-center gap-2">
            I&apos;m an Employer
          </Link>
        </div>
        
        {/* Slide Indicators */}
        <div className="flex gap-2 mt-5 z-20 relative">
          <button onClick={() => setCurrentSlide(0)} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === 0 ? 'bg-violet-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}`} aria-label="View changing the hiring landscape slide" />
          <button onClick={() => setCurrentSlide(1)} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === 1 ? 'bg-orange-500 w-6' : 'bg-slate-300 hover:bg-slate-400'}`} aria-label="View platform integrity slide" />
          <button onClick={() => setCurrentSlide(2)} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === 2 ? 'bg-indigo-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}`} aria-label="View employer slide" />
          <button onClick={() => setCurrentSlide(3)} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === 3 ? 'bg-emerald-500 w-6' : 'bg-slate-300 hover:bg-slate-400'}`} aria-label="View candidate slide" />
        </div>

        {/* Center Scroll-Down Cue (Visible right below the dots on all devices) */}
        <button
          type="button"
          onClick={scrollToHowItWorks}
          className="mt-6 inline-flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors group cursor-pointer z-20"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Explore How It Works
          </span>
          <span className="w-6 h-6 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center group-hover:border-indigo-300 transition-all">
            <svg className="w-3 h-3 animate-bounce text-slate-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* Side Navigational Tidbit (Floating right-side pill for wide desktop resolutions) */}
        <button
          type="button"
          onClick={scrollToHowItWorks}
          className="hidden xl:inline-flex items-center gap-2 fixed right-8 bottom-8 z-30 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-md hover:border-slate-900 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer group"
        >
          <span>Learn More</span>
          <svg className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* Feature Section */}
      <section id="how-it-works" className="scroll-mt-20 py-20 px-6 md:px-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          
          {/* TRACK 1: CANDIDATES */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                How the platform works <span className="text-emerald-500">for Candidates</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Candidate Feature 1 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Resume Parsing</h3>
                <p className="text-slate-500 leading-relaxed">
                  Upload your resume. Our AI instantly strips personal identifiers and extracts a pure, formatted snapshot of your raw technical skills and experience years.
                </p>
              </div>

              {/* Candidate Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 text-cyan-500 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Blind Applications</h3>
                <p className="text-slate-500 leading-relaxed">
                  Apply to roles with one click. Employers evaluate your profile based strictly on merit. No bias, no initial pedigree checks—just your ability to do the work.
                </p>
              </div>

              {/* Candidate Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-25 font-mono text-xs text-emerald-400 overflow-hidden break-all pointer-events-none">
                  {`01001010 01101111 01100010 01110011 01001010 01101111 01100010 01110011 01001010 01101111 01100010 01110011`}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">The Decryption Reveal</h3>
                  <p className="text-slate-400 leading-relaxed">
                    When an employer wants to move forward, they unlock your profile. Watch the data decrypt as your true identity is seamlessly revealed to the hiring team.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TRACK 2: EMPLOYERS */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                How the platform works <span className="text-indigo-600">for Employers</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Employer Feature 1 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Job Profiling</h3>
                <p className="text-slate-500 leading-relaxed">
                  Upload your job description and let our AI instantly extract the core requirements, structuring them into a precise skills matrix for flawless matching.
                </p>
              </div>

              {/* Employer Feature 2 */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Precision Fit Analysis</h3>
                <p className="text-slate-500 leading-relaxed">
                  Evaluate anonymous applicants against your exact role requirements instantly. Our AI generates a visual Radar Chart and executive briefing for every match.
                </p>
              </div>

              {/* Employer Feature 3 */}
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-25 font-mono text-xs text-indigo-400 overflow-hidden break-all pointer-events-none">
                  {`01010101 01101110 01101100 01101111 01100011 01101011 01010101 01101110 01101100 01101111 01100011 01101011`}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Unlock Top Talent</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Once a candidate proves they have the exact skills you need, securely unlock their profile to reveal their identity, access their physical resume, and initiate an interview.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* The End Result Section */}
      <section className="py-24 px-6 md:px-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">The End Result</h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              A hiring ecosystem built entirely on trust, merit, and mutual intent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Widget 1: Candidate Anonymity */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Candidate Anonymity</h3>
              <p className="text-slate-500 leading-relaxed">
                Candidates are evaluated strictly on verified skills and raw talent, eliminating unconscious bias and creating a true meritocracy where abilities speak louder than names.
              </p>
            </div>

            {/* Widget 2: Employer Anonymity */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Employer Anonymity</h3>
              <p className="text-slate-500 leading-relaxed">
                Employers bypass the avalanche of spam and brand-chasers. By hiding the company identity, you guarantee every application is driven by genuine interest in the role itself.
              </p>
            </div>

            {/* Widget 3: Secure Connection */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400 via-slate-900 to-slate-900 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center mb-6 text-orange-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Secure Connection</h3>
                <p className="text-slate-400 leading-relaxed">
                  When the perfect match is found, both parties mutually opt-in. The platform seamlessly decrypts the data, transforming a blind match into a direct, high-trust introduction.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image 
              src="/logo.jpg" 
              alt="specialsauce.io Logo" 
              width={200} 
              height={50} 
              className="w-[185px] h-auto grayscale hover:grayscale-0 transition-all duration-300"
            />
          </Link>
          
          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
          </div>

          <p className="text-sm text-slate-500">© {new Date().getFullYear()} specialsauce.io. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}