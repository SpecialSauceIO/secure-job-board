import Link from 'next/link'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-8 px-6 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Global Operational Provenance & Trust Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-slate-700 font-bold">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">🇺🇸</span> Proudly US-Based Company &amp; Operations
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 100% US-Based Human Support
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0077D4]" /> AI Matching Tested &amp; Calibrated Daily
            </span>
          </div>
          <Link
            href="/security"
            className="text-[11px] font-extrabold text-[#0077D4] hover:underline whitespace-nowrap"
          >
            Verify Our Security &amp; AI Standards →
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-center gap-5">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src="/logo.png?v=20261024"
              alt="specialsauce.io Logo"
              width={280}
              height={70}
              className="h-9 sm:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
            />
          </Link>

          {/* Legal, Workflows & Help Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/workflows"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Platform Workflows
            </Link>
            <Link
              href="/security"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Security &amp; Trust
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link
              href="/dashboard/support"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Help &amp; Support
            </Link>
          </div>

          <p className="text-xs text-slate-500 text-center xl:text-right shrink-0">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
